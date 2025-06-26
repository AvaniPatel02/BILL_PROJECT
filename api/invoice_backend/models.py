from django.db import models
from django.utils import timezone
from datetime import date
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from django.db.models import JSONField 
import random
import string
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes


class CustomUserManager(BaseUserManager):
    def create_user(self, email, first_name, mobile, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)        #Normalizes the email format.
        user = self.model(
            email=email,
            first_name=first_name,
            mobile=mobile,
            **extra_fields
        )
        user.set_password(password)             #Hashes and sets the password.
        user.save(using=self._db)
        return user

    def create_superuser(self, email, first_name, mobile, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, first_name, mobile, password, **extra_fields)   #Calls create_user() with extra permissions.

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=10)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'mobile']

    def _str_(self):
        return self.email

class Invoice(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    # Buyer Info (required fields)
    buyer_name = models.CharField(max_length=255)
    buyer_address = models.TextField()
    buyer_gst = models.CharField(max_length=20, blank=True, null=True)
    
    # Consignee Info (optional)
    consignee_name = models.CharField(max_length=255, blank=True, null=True)
    consignee_address = models.TextField(blank=True, null=True)
    consignee_gst = models.CharField(max_length=20, blank=True, null=True)

    # Invoice details (date is required)
    financial_year = models.CharField(max_length=9, default='2025-2026')
    invoice_number = models.CharField(max_length=20, default="01-2025/2026")
    invoice_date = models.DateField()
    
    # Optional fields
    delivery_note = models.CharField(max_length=255, blank=True, null=True,default='')
    payment_mode = models.CharField(max_length=100, blank=True, null=True,default='')
    delivery_note_date = models.DateField(null=True, blank=True)
    destination = models.CharField(max_length=255, blank=True, null=True,default='')
    Terms_to_delivery = models.CharField(max_length=255, blank=True, null=True,default='')
    
    # Country and Currency Info
    country = models.CharField(max_length=255, default='India')
    currency = models.CharField(max_length=10, default='INR')
    state = models.CharField(max_length=50, default="Gujarat")

    # Product details
    Particulars = models.CharField(max_length=255, blank=True, null=True,default='Consultancy')
    hsn_sac_code = models.CharField(max_length=10)
    total_hours = models.FloatField(blank=True, null=True, default=0.0)
    rate = models.FloatField(blank=True, null=True, default=0.0)
    base_amount = models.FloatField()

    # Tax details
    cgst = models.FloatField(blank=True, null=True, default=0.0)
    sgst = models.FloatField(blank=True, null=True, default=0.0)
    total_with_gst = models.FloatField()
    amount_in_words = models.CharField(max_length=255, blank=True, null=True)
    taxtotal = models.FloatField(blank=True, null=True, default=0.0)

    # Remarks
    remark = models.TextField(blank=True, null=True,default='')

    exchange_rate = models.FloatField(blank=True, null=True, default=1.0)
    inr_equivalent = models.FloatField(blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    country_flag = models.URLField(max_length=300, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def _str_(self):
        return self.invoice_number

    def save(self, *args, **kwargs):
        # Only generate invoice number for new records
        if not self.pk:
            current_year = datetime.now().year
            next_year = current_year + 1
            self.financial_year = f"{current_year}/{next_year}"
            
            # Find the last invoice for this financial year and user
            last_invoice = Invoice.objects.filter(
                financial_year=self.financial_year,
                user=self.user
            ).order_by('-invoice_number').first()
            
            if last_invoice:
                try:
                    # Extract number part (format "01-2025/2026")
                    num_part = last_invoice.invoice_number.split('-')[0]
                    next_num = int(num_part) + 1
                except (ValueError, IndexError):
                    next_num = 1
            else:
                next_num = 1
            
            self.invoice_number = f"{next_num:02d}-{self.financial_year}"
        
        # Calculate totals
        self.calculate_totals()
        
          # Calculate INR equivalent if currency is not INR
        if self.currency != 'INR':
            if hasattr(self, 'exchange_rate') and self.exchange_rate:
                # Use the provided exchange rate if available
                self.inr_equivalent = self.total_with_gst * self.exchange_rate
            else:
                # Fallback to default conversion if no rate provided
                self.inr_equivalent = self.total_with_gst * 1  # Adjust this if you have a default rate
        
        super().save(*args, **kwargs)

    def calculate_totals(self):
        """Calculate financial fields"""
        if not self.base_amount and self.total_hours and self.rate:
            self.base_amount = self.total_hours * self.rate
        
        if self.country == 'India' and self.base_amount:
            self.cgst = (self.base_amount * 9) / 100
            self.sgst = (self.base_amount * 9) / 100
            self.taxtotal = self.cgst + self.sgst
            self.total_with_gst = self.base_amount + self.taxtotal
        else:
            self.cgst = 0
            self.sgst = 0
            self.taxtotal = 0
            self.total_with_gst = self.base_amount

class Setting(models.Model):
    # Seller Info
    company_name = models.CharField(max_length=255, default='Your Company')
    seller_address = models.TextField(default='Your Address')
    seller_email = models.EmailField(blank=True, null=True)
    seller_pan = models.CharField(max_length=20, blank=True, null=True)
    seller_gstin = models.CharField(max_length=20, blank=True, null=True)

    # Company Bank Details
    bank_account_holder = models.CharField(max_length=255, blank=True, null=True)
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    account_number = models.CharField(max_length=50,blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    branch = models.CharField(max_length=255, blank=True, null=True)
    swift_code = models.CharField(max_length=20,blank=True, null=True)
    company_code = models.CharField(max_length=20,blank=True, null=True )
    
    HSN_codes = models.JSONField(default=list)
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    last_invoice_number = models.IntegerField(default=0)
    
    # Link to user (one-to-one relationship)
    user = models.OneToOneField(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    primary_key=True
)


    def __str__(self):
        return f"{self.company_name} - Settings"

class Statement(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='statements')
    date = models.DateField(default=timezone.now)
    notice = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def _str_(self):
        return f"Statement ({self.date}) - Invoice {self.invoice.invoice_number}"

    @property
    def total_deposited(self):
        return sum(deposit.amount for deposit in self.deposits.all())

class Deposit(models.Model):
    statement = models.ForeignKey(Statement, on_delete=models.CASCADE, related_name='deposits')
    deposit_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def _str_(self):
        return f"₹{self.amount} on {self.deposit_date} for Statement {self.statement.id}"

class Buyer(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    PAYMENT_CHOICES = [
        ('Cash', 'Cash'),
        ('Banking', 'Banking'),
    ]

    buyer_name = models.CharField(max_length=255, default='Unknown')
    transaction_date = models.DateField(default=timezone.now)  # Changed from selected_date
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notice = models.TextField(default="No remarks")
    payment_method = models.CharField(max_length=100, null=False, default='Cash')
    bank_name = models.CharField(max_length=100, null=True, blank=True,default=None)

    def __str__(self):
        return f"{self.buyer_name} - {self.transaction_date}"

class Bank(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def _str_(self):
        return self.name

class CompanyBill(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    PAYMENT_CHOICES = [
        ('Cash', 'Cash'),
        ('Banking', 'Banking'),
    ]

    company_name = models.CharField(max_length=255, null=True, blank=True)  # Changed from buyer_name
    invoice_id = models.CharField(max_length=50, null=True, blank=True)
    transaction_date = models.DateField(null=True, blank=True)
    notice = models.CharField(max_length=255, null=False, default="")
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Changed from deposit_amount
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, null=True, blank=True)
    bank_name = models.CharField(max_length=100, null=True, blank=True)

    def _str_(self):
        return f"{self.company_name} - {self.invoice_id or 'No Invoice'}"
    
class Salary(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    PAYMENT_CHOICES = [
        ('Cash', 'Cash'),
        ('Banking', 'Banking'),
    ]

    salary_newname = models.CharField(max_length=100, default="N/A")
    salary_name = models.CharField(max_length=255)
    salary_amount = models.DecimalField(max_digits=10, decimal_places=2)
    salary_date = models.DateField()
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, null=True, blank=True)
    bank_name = models.CharField(max_length=100, null=True, blank=True)

    def _str_(self):
        return f"{self.salary_name} Salary"

class Other(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    TRANSACTION_TYPE_CHOICES = [
        ('credit', 'Credit'),
        ('debit', 'Debit'),
    ]
    PAYMENT_CHOICES = [
        ('Cash', 'Cash'),
        ('Banking', 'Banking'),
    ]

    transaction_type = models.CharField(
        max_length=6,
        choices=TRANSACTION_TYPE_CHOICES,
        default='debit',
        blank=True,  # Make it optional
        null=True  
    )
    other_type = models.CharField(max_length=50)
    other_date = models.DateField()
    other_notice = models.TextField()
    other_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, null=True, blank=True)
    bank_name = models.CharField(max_length=100, null=True, blank=True)
    partner = models.ForeignKey('Partner', null=True, blank=True, on_delete=models.SET_NULL)
    
    def _str_(self):  
        return f"{self.other_type} ({self.transaction_type}) - {self.other_date} - ${abs(self.other_amount)}"
    
    def save(self, *args, **kwargs):
        # Ensure amount is negative for debits and positive for credits
        if self.transaction_type == 'debit':
            self.other_amount = -abs(self.other_amount)
        else:
            self.other_amount = abs(self.other_amount)
        super().save(*args, **kwargs)


class BankingDeposit(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    
    def _str_(self):
        return f"{self.amount} on {self.date}"
    
class Employee(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    joining_date = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    email = models.EmailField()
    number = models.CharField(max_length=15)
    
    def _str_(self):
        return self.name

    class Meta:
        verbose_name = "Employee"
        verbose_name_plural = "Employees"


User = get_user_model()

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    image1 = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    image2 = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def _str_(self):
        return f"Profile for {self.user.email}"



class BankAccount(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.bank_name} - {self.account_number}"
    

class CashEntry(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"Cash: {self.amount} on {self.date}"

class Partner(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class OTP(models.Model):
    email = models.EmailField()
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    
    def is_expired(self):
        """Check if OTP has expired (10 minutes)"""
        expiry_time = self.created_at + timedelta(minutes=10)
        return timezone.now() > expiry_time
    
    def __str__(self):
        return f"OTP for {self.email}"
    
    class Meta:
        ordering = ['-created_at']