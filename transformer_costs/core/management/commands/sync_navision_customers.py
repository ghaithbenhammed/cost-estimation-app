from django.core.management.base import BaseCommand
from core.models import TemporaryCustomer
from core.services.navision import fetch_integration_customer_card

class Command(BaseCommand):
    help = "Synchronise les clients de Navision dans la table TemporaryCustomer"

    def handle(self, *args, **kwargs):
        try:
            navision_customers = fetch_integration_customer_card()
            if navision_customers and "value" in navision_customers:
                navision_customers = navision_customers["value"]
            else:
                navision_customers = []

            count_created = 0
            count_skipped = 0

            for customer in navision_customers:
                no = customer.get("No")
                name = customer.get("Name")
                county = customer.get("County")
                responsibility_center = customer.get("Responsibility_Center")
                status = customer.get("Customer_Status")
                vat = customer.get("VAT_Registration_No")

                if not TemporaryCustomer.objects.filter(No=no).exists():
                    TemporaryCustomer.objects.create(
                        No=no,
                        Name=name,
                        County=county,
                        Responsibility_Center=responsibility_center,
                        Customer_Status=status,
                        VAT_Registration_No=vat,
                        is_approved=True  # ✅ Marqué comme approuvé automatiquement
                    )
                    count_created += 1
                else:
                    count_skipped += 1

            self.stdout.write(self.style.SUCCESS(f"✅ {count_created} clients ajoutés depuis Navision."))
            self.stdout.write(self.style.WARNING(f"⚠️ {count_skipped} clients déjà existants ignorés."))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Erreur lors de la synchronisation : {str(e)}"))
