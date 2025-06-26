# invoice_backend/signals.py
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import Setting

@receiver(post_migrate)
def create_default_settings(sender, **kwargs):
    if Setting.objects.count() == 0:
        Setting.objects.create(
            company_name="",
            seller_address="Your Address",
            seller_email="",
            seller_pan="",
            seller_gstin="",
            bank_account_holder="",
            bank_name="",
            account_number="",
            ifsc_code="",
            branch="",
            swift_code="",
            last_invoice_number=0
        )
        print("✅ Default settings created!")