from django.core.exceptions import ValidationError
from django.db import models
from django.contrib.auth.models import AbstractUser
import re

class User(AbstractUser):
    TITLE_CHOICES = [
        ('M.', 'Monsieur'),
        ('Mme', 'Madame'),
        
    ]

    ROLE_CHOICES = [
        ('SuperAdmin', 'SuperAdmin'),
        ('Admin', 'Admin'),
        ('ResponsableEtude', 'ResponsableEtude'),
        ('ResponsableCout', 'ResponsableCout'),
    ]

    title = models.CharField(
        max_length=10,
        choices=TITLE_CHOICES,
        blank=True,
        null=True,
        verbose_name="Titre"
    )
    first_name = models.CharField(max_length=50, verbose_name="Prénom")
    last_name = models.CharField(max_length=50, verbose_name="Nom")
    email = models.EmailField(
        unique=True,
        help_text="Format attendu : exemple@example.com"
    )
    phone_number = models.CharField(
        max_length=20,
        verbose_name="Téléphone",
        help_text="Inclure l’indicatif pays. Ex : +21699123456",
        blank=True,
        null=True
    )
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name="Adresse",
        help_text="Ex : Rue de la Liberté, Tunis"
    )
    profile_picture = models.ImageField(
        upload_to='profile_pics/',
        blank=True,
        null=True,
        verbose_name="Photo de profil"
    )
    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        verbose_name="Rôle"
    )
    is_active = models.BooleanField(default=True)
    USERNAME_FIELD = 'email'

    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    def __str__(self):
        return f"{self.username} - {self.role}"

   
    def clean(self):
        if self.phone_number and not re.match(r'^\+\d{6,15}$', self.phone_number):
            raise ValidationError({'phone_number': "Le numéro doit commencer par un indicatif (+216...) et contenir uniquement des chiffres."})
