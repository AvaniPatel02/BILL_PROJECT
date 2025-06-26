from django.contrib import admin
from .models import Invoice,Setting,Statement, Deposit,Buyer, CompanyBill, Salary, Other,BankingDeposit,Employee, OTP
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import CustomUser
# Register your models here.

admin.site.register(Invoice)
admin.site.register(Setting)
admin.site.register(Statement)
admin.site.register(Deposit)
admin.site.register(Buyer)
admin.site.register(CompanyBill)
admin.site.register(Salary)
admin.site.register(Other)
admin.site.register(Employee)
admin.site.register(BankingDeposit)
admin.site.register(OTP)
# admin.site.register(RemainingAmount)



class CustomUserAdmin(BaseUserAdmin):
    ordering = ['email']
    list_display = ['email', 'first_name', 'mobile', 'is_staff']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'mobile')}),
        (_('Permissions'), {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions',
            ),
        }),
        (_('Important dates'), {'fields': ('last_login',)}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'mobile', 'password1', 'password2'),
        }),
    )
    
    search_fields = ('email', 'first_name', 'mobile')
    filter_horizontal = ('groups', 'user_permissions')

admin.site.register(CustomUser, CustomUserAdmin)


