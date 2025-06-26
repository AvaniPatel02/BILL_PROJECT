from django.apps import AppConfig


class InvoiceBackendConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField' #Sets the default type for auto-incrementing model IDs
    name = 'invoice_backend'  #Registers your app's name and location for Django



