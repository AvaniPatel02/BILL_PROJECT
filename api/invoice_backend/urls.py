from django.urls import path
from . import views
from .views import InvoiceDetailView, MyTokenObtainPairView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Partner
from .serializers import PartnerSerializer

urlpatterns = [
    # Invoice paths
    path('invoices/', views.get_invoices, name='invoice-list'),
    path('invoices/<int:pk>/', InvoiceDetailView.as_view(), name='invoice-detail'),
    path('create/', views.create_invoice, name='create-invoice'),
    path('update/<int:pk>/', views.invoice_detail, name='update-invoice'),
    path('delete/<int:pk>/', views.invoice_detail, name='delete-invoice'),
    path('get_next_invoice_number/', views.get_next_invoice_number, name='get_next_invoice_number'),
    path('invoices/by-gst/<str:gst_number>/', views.get_invoices_by_gst, name='get_invoices_by_gst'),
    path('grouped-invoices/', views.grouped_invoices, name='grouped-invoices'),

    # Settings paths
    path('settings/', views.settings_list_create, name='settings-list-create'),
    path('settings/<int:pk>/', views.update_setting, name='update-setting'),
    path('settings/<int:pk>/delete/', views.delete_setting, name='delete-setting'),

    # User profile & authentication
    path('profile/', views.user_profile_view, name='user-profile'),
    path('auth/register/', views.register_user, name='register'),
    path('auth/me/', views.get_current_user, name='current-user'),
    path('auth/login/', MyTokenObtainPairView.as_view(), name='login'),
    path('auth/send-otp/', views.send_otp, name='send-otp'),
    path('auth/verify-otp/', views.verify_otp, name='verify-otp'),
    path('auth/forgot-password/send-otp/', views.send_forgot_password_otp, name='send-forgot-password-otp'),
    path('auth/forgot-password/verify-otp/', views.verify_otp, name='verify-forgot-password-otp'),
    path('auth/forgot-password/reset/', views.reset_password, name='reset-password'),

    # Banking Transaction paths
    path('banking/company/', views.create_company_transaction, name='create-company-transaction'),
    path('banking/company/<int:pk>/', views.company_transaction_detail, name='company-transaction-detail'),

    path('banking/buyer/', views.create_buyer_transaction, name='create-buyer-transaction'),
    path('banking/buyer/<int:pk>/', views.buyer_transaction_detail, name='buyer-transaction-detail'),

    path('banking/salary/', views.create_salary_transaction, name='create-salary-transaction'),
    path('banking/salary/<int:pk>/', views.salary_transaction_detail, name='salary-transaction-detail'),

    path('banking/other/', views.create_other_transaction, name='create-other-transaction'),
    path('banking/other/<int:pk>/', views.other_transaction_detail, name='other-transaction-detail'),

    path('banking/employee/', views.employee_list_create, name='employee-list-create'),
    path('employees/<int:pk>/', views.employee_detail, name='employee-detail'),

    path('add-deposit/', views.add_bankingdeposit, name='add-deposit'),

    # Bank account management
    path('bank-accounts/', views.bank_account_list_create, name='bank-account-list-create'),
    path('bank-accounts/<int:pk>/', views.bank_account_detail, name='bank-account-detail'),
    path('bank-accounts/<int:pk>/restore/', views.restore_bank_account, name='restore-account'),
    path('bank-accounts/deleted/', views.soft_deleted_bank_accounts, name='soft-deleted-bank-accounts'),
    path('bank-accounts/deleted/<int:pk>/', views.soft_deleted_bank_account_detail, name='soft-deleted-bank-account-detail'),
    path('bank-accounts/deleted/<int:pk>/permanent-delete/', views.permanently_delete_bank_account, name='permanently-delete-account'),

    # Cash management
    path('cash-entries/', views.cash_entry_collection, name='cashentry-collection'),
    path('cash-entries/<int:pk>/', views.cash_entry_detail, name='cashentry-detail'),
    path('cash-entries/<int:pk>/restore/', views.restore_cash_entry, name='restore-cash-entry'),
    path('cash-entries/deleted/', views.soft_deleted_cash_entries, name='soft-deleted-cash-entries'),

    # Company balance utility
    path('company-balance/<str:buyer_gst>/', views.company_balance, name='company-balance'),
    
    # Partner paths
    path('partners/', views.partner_list_create, name='partner-list-create'),
    path('partners/<int:pk>/', views.partner_detail, name='partner-detail'),
]
