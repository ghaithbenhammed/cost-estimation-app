from django.db import models
from django.contrib.auth import get_user_model
from django.utils.timezone import now
from django.core.validators import FileExtensionValidator

class TemporaryCustomer(models.Model):
    """
    Modèle pour stocker les clients ajoutés/modifiés temporairement avant validation.
    """
    No = models.CharField(max_length=50, unique=True)  
    Name = models.CharField(max_length=255)  
    County = models.CharField(max_length=255, blank=True, null=True) 
    Responsibility_Center = models.CharField(max_length=255, blank=True, null=True)  
    Customer_Status = models.CharField(max_length=50, blank=True, null=True)  
    VAT_Registration_No = models.CharField(max_length=50, blank=True, null=True)  
    Last_Date_Modified = models.DateTimeField(auto_now=True)  
    is_approved = models.BooleanField(default=False)  

    def __str__(self):
        return f"{self.No} - {self.Name}"
class CustomerRequest(models.Model):
    """
    Modèle pour gérer les demandes des clients.
    """
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('completed', 'Terminée'),
        ('rejected', 'Rejetée'),
    ]

    customer = models.ForeignKey(TemporaryCustomer, on_delete=models.CASCADE, related_name='requests', null=True, blank=True)
    customer_no = models.CharField(max_length=50)  
    customer_name = models.CharField(max_length=255, null=True, blank=True)  
    request_type = models.CharField(max_length=255)
    power = models.CharField(max_length=50)
    primary_voltage = models.CharField(max_length=50)
    secondary_voltage = models.CharField(max_length=50)
    frequency = models.CharField(max_length=50)
    oil_heating = models.CharField(max_length=50)
    conductor_heating = models.CharField(max_length=50)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')  
    created_at = models.DateTimeField(auto_now_add=True)
    validated_at = models.DateTimeField(null=True, blank=True)
    description_text = models.TextField(null=True, blank=True, help_text="Description facultative de la demande")
    description_file = models.FileField(
        upload_to='descriptions/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(['pdf', 'jpg', 'jpeg', 'png'])],
        help_text="Fichier joint (PDF ou image)"
    )
    def save(self, *args, **kwargs):
        if self.customer_no:
            self.customer_no = self.customer_no.strip().upper() 
        super().save(*args, **kwargs)
    def __str__(self):
        return f"Demande {self.request_type} pour {self.customer_no} - {self.get_status_display()}"

User = get_user_model()

class SavedBom(models.Model):
    dossier = models.CharField(max_length=100)
    objet = models.CharField(max_length=255)
    date_creation = models.DateField(default=now)
    client_no = models.CharField(max_length=50)
    client_name = models.CharField(max_length=100)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    sent_to_cost_responsible = models.BooleanField(default=True)
    request = models.ForeignKey(CustomerRequest, on_delete=models.CASCADE, null=True, blank=True, related_name='nomenclature')

    STATUS_CHOICES = [
        ('en_cours', 'En cours'),
        ('emise', 'Émise'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_cours')


    def __str__(self):
        return f"Nomenclature {self.dossier} - {self.client_name}"

class SavedBomLine(models.Model):
    bom = models.ForeignKey(SavedBom, on_delete=models.CASCADE, related_name='lines')
    code = models.CharField(max_length=100, blank=True)
    designation = models.TextField()
    unite = models.CharField(max_length=20)
    quantite = models.DecimalField(max_digits=10, decimal_places=2)
    remarque = models.TextField(blank=True)
    is_custom = models.BooleanField(default=False) 

    def __str__(self):
        return f"{self.code or 'Custom'} - {self.designation[:30]}"