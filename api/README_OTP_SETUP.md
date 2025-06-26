# OTP Email Verification Setup

This document explains how to set up SMTP email verification for user registration and forgot password functionality.

## Backend Setup

### 1. Email Configuration

Update the email settings in `bill/settings.py`:

```python
# Email Configuration for SMTP
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # For Gmail
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'  # Replace with your email
EMAIL_HOST_PASSWORD = 'your-app-password'  # Replace with your app password
DEFAULT_FROM_EMAIL = 'your-email@gmail.com'  # Replace with your email

# OTP Configuration
OTP_EXPIRY_MINUTES = 10  # OTP expires after 10 minutes
```

### 2. Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → App passwords
   - Select "Mail" and your device
   - Copy the generated 16-character password
4. Use this password in `EMAIL_HOST_PASSWORD`

### 3. Alternative Email Providers

#### For Outlook/Hotmail:
```python
EMAIL_HOST = 'smtp-mail.outlook.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
```

#### For Yahoo:
```python
EMAIL_HOST = 'smtp.mail.yahoo.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
```

## Frontend Features

### Signup Flow:
1. User enters email and clicks "Get OTP"
2. System sends 6-digit OTP to email
3. User enters OTP and clicks "Verify OTP"
4. After verification, user can complete registration
5. User is redirected to login page

### Forgot Password Flow:
1. User clicks "Forgot password?" on login page
2. User enters email and clicks "Get OTP"
3. System sends 6-digit OTP to email
4. User enters OTP and clicks "Verify OTP"
5. After verification, user can enter new password
6. User submits new password and is redirected to login

### Security Features:
- OTP expires after 10 minutes
- OTP can only be used once
- Email validation before OTP sending
- Prevents duplicate user registration
- Password reset requires OTP verification

## API Endpoints

### Signup OTP
- **URL**: `POST /api/auth/send-otp/`
- **Body**: `{"email": "user@example.com"}`
- **Response**: `{"message": "OTP sent successfully", "email": "user@example.com"}`

### Forgot Password OTP
- **URL**: `POST /api/auth/forgot-password/send-otp/`
- **Body**: `{"email": "user@example.com"}`
- **Response**: `{"message": "Password reset OTP sent successfully", "email": "user@example.com"}`

### Verify OTP (Both Signup and Forgot Password)
- **URL**: `POST /api/auth/verify-otp/` or `POST /api/auth/forgot-password/verify-otp/`
- **Body**: `{"email": "user@example.com", "otp_code": "123456"}`
- **Response**: `{"message": "OTP verified successfully", "email": "user@example.com"}`

### Register User (Updated)
- **URL**: `POST /api/auth/register/`
- **Body**: `{"email": "user@example.com", "first_name": "John", "mobile": "1234567890", "password": "password123", "password2": "password123"}`
- **Note**: Requires verified OTP before registration

### Reset Password
- **URL**: `POST /api/auth/forgot-password/reset/`
- **Body**: `{"email": "user@example.com", "new_password": "newpassword123", "confirm_password": "newpassword123"}`
- **Note**: Requires verified OTP before password reset

## Testing

1. Start the Django server: `python manage.py runserver`
2. Start the React app: `npm start`
3. Navigate to signup page or login page
4. Test the OTP flow with a valid email

## Troubleshooting

### Email Not Sending:
1. Check email configuration in settings.py
2. Verify app password is correct
3. Check if 2FA is enabled on Gmail
4. Check Django logs for error messages

### OTP Not Working:
1. Check if OTP model is migrated
2. Verify database connection
3. Check Django logs for errors

### Frontend Issues:
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check network tab for failed requests

## User Flow Diagrams

### Signup Process:
```
User → Enter Email → Click "Get OTP" → Receive Email → Enter OTP → Verify OTP → Complete Registration → Login
```

### Forgot Password Process:
```
User → Click "Forgot Password" → Enter Email → Click "Get OTP" → Receive Email → Enter OTP → Verify OTP → Enter New Password → Reset Password → Login
``` 