from rest_framework import serializers
from .models import Invoice
from .models import Setting,Deposit
from .models import CompanyBill, Buyer, Salary, Other,BankingDeposit,Employee,BankAccount,CashEntry
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from .models import UserProfile, Partner, OTP
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from num2words import num2words

User = get_user_model()    #Django's built-in User model

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'mobile')

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)    
        # Add custom claims
        token['email'] = user.email
        token['first_name'] = user.first_name
        return token

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'})
    mobile = serializers.CharField(required=True, max_length=10)
    tokens = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'mobile', 'password', 'password2', 'tokens')

    def get_tokens(self, obj):
        user = User.objects.get(email=obj.email)
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."})
        
        if len(attrs['mobile']) != 10:
            raise serializers.ValidationError(
                {"mobile": "Mobile number must be 10 digits"})
                
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class InvoiceSerializer(serializers.ModelSerializer):
    total_with_gst = serializers.SerializerMethodField()
    cgst = serializers.SerializerMethodField()
    sgst = serializers.SerializerMethodField()
    igst = serializers.SerializerMethodField()
    taxtotal = serializers.SerializerMethodField()
    amount_in_words = serializers.SerializerMethodField()
    inr_equivalent = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = '__all__'

    def get_total_with_gst(self, obj):
        # Your calculation logic here
        return obj.base_amount + obj.cgst + obj.sgst  # Example

    def get_cgst(self, obj):
        # Your calculation logic here
        return (obj.base_amount * 0.09) if obj.country == "India" and obj.state == "Gujarat" else 0

    def get_sgst(self, obj):
        return (obj.base_amount * 0.09) if obj.country == "India" and obj.state == "Gujarat" else 0

    def get_igst(self, obj):
        return (obj.base_amount * 0.18) if obj.country == "India" and obj.state != "Gujarat" else 0

    def get_taxtotal(self, obj):
        return self.get_cgst(obj) + self.get_sgst(obj) + self.get_igst(obj)

    def get_amount_in_words(self, obj):
        # Use a utility to convert numbers to words
        return num2words(obj.total_with_gst, to='currency', lang='en_IN').replace('INR', '').strip() + " Only"

    def get_inr_equivalent(self, obj):
        # Example: for foreign currency
        if obj.currency != "INR":
            return obj.total_with_gst * obj.exchange_rate
        return obj.total_with_gst

    def validate(self, data):
        # Custom validation for required fields
        required_fields = ['buyer_name', 'buyer_address', 'invoice_date']
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError({field: "This field is required."})
        
        # Validate that either (rate and hours) or base_amount is provided
        if not data.get('base_amount') and not (data.get('rate') and data.get('total_hours')):
            raise serializers.ValidationError(
                "Either provide rate and hours, or directly enter the base amount"
            )
        
        if data.get('country') == 'India' and not data.get('state'):
            raise serializers.ValidationError(
                {"state": "State is required for Indian invoices"}
            )
        
        return data

class SettingSerializer(serializers.ModelSerializer):
    HSN_codes = serializers.JSONField(required=False)
    
    class Meta:
        model = Setting
        fields = '__all__'
        extra_kwargs = {
            'HSN_codes': {'required': False},
        }

    def validate_HSN_codes(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("HSN_codes must be a list")
        return value

class DepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deposit
        fields = ['id', 'deposit_date', 'amount']

class CompanyBillSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyBill
        fields = '__all__'       


class BuyerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Buyer
        fields = '__all__'
        

class SalarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Salary
        fields = '__all__'
        extra_kwargs = {
            'other_amount': {'required': True},
            'transaction_type': {'required': True},
            'payment_method': {'required': False},
            'bank_name': {'required': False}
        }

class PartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = ['id', 'name']

class OtherSerializer(serializers.ModelSerializer):
    partner = PartnerSerializer(read_only=True)
    partner_id = serializers.PrimaryKeyRelatedField(
        queryset=Partner.objects.all(), source='partner', write_only=True, required=False
    )
    class Meta:
        model = Other
        fields = '__all__'
        extra_kwargs = {
            'other_amount': {'required': True},
            'transaction_type': {'required': True}
        }


class BankingDepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankingDeposit  
        fields = '__all__'



class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['user']


class UserProfileSerializer(serializers.ModelSerializer):
    image1_url = serializers.SerializerMethodField()
    image2_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id', 'image1', 'image2', 'image1_url', 'image2_url', 'created_at', 'updated_at']
        extra_kwargs = {
            'image1': {'write_only': True},
            'image2': {'write_only': True}
        }

    def get_image1_url(self, obj):
        if obj.image1:
            return self.context['request'].build_absolute_uri(obj.image1.url)
        return None

    def get_image2_url(self, obj):
        if obj.image2:
            return self.context['request'].build_absolute_uri(obj.image2.url)
        return None


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = '__all__'

class CashEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = CashEntry
        fields = ['id', 'amount', 'description', 'date', 'is_deleted']

class OTPSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTP
        fields = ['email', 'otp_code', 'created_at', 'is_verified']
        read_only_fields = ['created_at', 'is_verified']

class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6)

class CashEntryViewSet(ModelViewSet):
    queryset = CashEntry.objects.all()
    serializer_class = CashEntrySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)