# 🧪 Handyman Management API - Testing Guide

## 📋 Overview

This guide provides comprehensive instructions for testing all endpoints of the Handyman Management API using PowerShell commands and Postman.

**Base URL**: `https://kleva-server.vercel.app`

---

## 🚀 Quick Start Tests

### 1. Health Check

```powershell
# Test API health
Invoke-RestMethod -Uri "https://kleva-server.vercel.app/health" -Method GET | ConvertTo-Json -Depth 10
```

**Expected Response**:
```json
{
  "status": "OK",
  "message": "Handyman Management API is running",
  "timestamp": "2024-10-17T...",
  "version": "1.0.0"
}
```

### 2. API Documentation

Visit: `https://kleva-server.vercel.app/api-docs`

---

## 🔐 Authentication Endpoints

### Register New User

#### Register as Customer
```powershell
$registerBody = @{
    email = "customer@example.com"
    password = "Customer123!"
    role = "customer"
    profile = @{
        firstName = "John"
        lastName = "Doe"
        phone = "+1234567890"
        preferredContactMethod = "email"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/register" -Method POST -Body $registerBody -ContentType "application/json" | ConvertTo-Json -Depth 10
```

#### Register as Handyman
```powershell
$registerBody = @{
    email = "handyman@example.com"
    password = "Handyman123!"
    role = "handyman"
    profile = @{
        firstName = "Mike"
        lastName = "Smith"
        phone = "+1234567891"
        skills = @("plumbing", "electrical")
        hourlyRate = 75
        experience = 10
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/register" -Method POST -Body $registerBody -ContentType "application/json" | ConvertTo-Json -Depth 10
```

#### Register as Admin
```powershell
$registerBody = @{
    email = "admin@example.com"
    password = "Admin123!"
    role = "admin"
    profile = @{
        firstName = "Admin"
        lastName = "User"
        phone = "+1234567892"
        department = "Operations"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/register" -Method POST -Body $registerBody -ContentType "application/json" | ConvertTo-Json -Depth 10
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "67..."
}
```

**📧 Check Your Email**: You should receive a verification email from `noreply@anorateck.com`

---

### Verify Email

After receiving the verification email, click the link or use:

```powershell
# Replace TOKEN with the token from the email
$token = "YOUR_VERIFICATION_TOKEN_HERE"
Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/verify-email/$token" -Method GET | ConvertTo-Json -Depth 10
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**📧 Check Your Email Again**: You should receive a welcome email!

---

### Login

```powershell
$loginBody = @{
    email = "handyman@example.com"
    password = "Handyman123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$loginResponse | ConvertTo-Json -Depth 10

# Save tokens for later use
$accessToken = $loginResponse.tokens.accessToken
$refreshToken = $loginResponse.tokens.refreshToken

Write-Host "Access Token: $accessToken"
Write-Host "Refresh Token: $refreshToken"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "67...",
    "email": "handyman@example.com",
    "role": "handyman",
    "isEmailVerified": true,
    "is2FAEnabled": false
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

## 🔑 Protected Endpoints (Requires Authentication)

### Get User Profile

```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/me" -Method GET -Headers $headers | ConvertTo-Json -Depth 10
```

### Update User Profile

```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

$updateBody = @{
    profile = @{
        firstName = "Michael"
        lastName = "Smith"
        bio = "Professional handyman with 10 years experience"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/me" -Method PATCH -Headers $headers -Body $updateBody -ContentType "application/json" | ConvertTo-Json -Depth 10
```

### Get Token Information

```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/token-info" -Method GET -Headers $headers | ConvertTo-Json -Depth 10
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Token information",
  "data": {
    "userId": "67...",
    "email": "handyman@example.com",
    "role": "handyman",
    "sessionId": "...",
    "issuedAt": "2024-10-17T...",
    "expiresAt": "2024-10-17T...",
    "timeRemaining": 899000
  }
}
```

### Refresh Access Token

```powershell
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

$newTokens = Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/refresh" -Method POST -Body $refreshBody -ContentType "application/json"
$newTokens | ConvertTo-Json -Depth 10

# Update access token
$accessToken = $newTokens.accessToken
```

### Change Password

```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

$changePasswordBody = @{
    currentPassword = "Handyman123!"
    newPassword = "NewHandyman123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/change-password" -Method POST -Headers $headers -Body $changePasswordBody -ContentType "application/json" | ConvertTo-Json -Depth 10
```

### Logout

```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

$logoutBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/logout" -Method POST -Headers $headers -Body $logoutBody -ContentType "application/json" | ConvertTo-Json -Depth 10
```

---

## 🔐 Two-Factor Authentication (2FA)

### Enable 2FA

```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

$enable2FABody = @{
    password = "Handyman123!"
} | ConvertTo-Json

$twoFASetup = Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/2fa/enable" -Method POST -Headers $headers -Body $enable2FABody -ContentType "application/json"
$twoFASetup | ConvertTo-Json -Depth 10

Write-Host "`n📱 QR Code URL: $($twoFASetup.qrCodeUrl)"
Write-Host "`n🔑 Backup Codes:"
$twoFASetup.backupCodes | ForEach-Object { Write-Host "  - $_" }
```

### Verify 2FA Code

```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

$verify2FABody = @{
    token = "123456"  # 6-digit code from authenticator app
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/2fa/verify" -Method POST -Headers $headers -Body $verify2FABody -ContentType "application/json" | ConvertTo-Json -Depth 10
```

### Disable 2FA

```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

$disable2FABody = @{
    password = "Handyman123!"
    twoFactorCode = "123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/2fa/disable" -Method POST -Headers $headers -Body $disable2FABody -ContentType "application/json" | ConvertTo-Json -Depth 10
```

---

## 🔄 Password Management

### Request Password Reset

```powershell
$resetRequestBody = @{
    email = "handyman@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/forgot-password" -Method POST -Body $resetRequestBody -ContentType "application/json" | ConvertTo-Json -Depth 10
```

### Reset Password

```powershell
# Replace TOKEN with the token from the reset email
$token = "YOUR_RESET_TOKEN_HERE"
$resetBody = @{
    newPassword = "NewPassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/reset-password/$token" -Method POST -Body $resetBody -ContentType "application/json" | ConvertTo-Json -Depth 10
```

---

## 👥 Session Management

### Get All Sessions

```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/sessions" -Method GET -Headers $headers | ConvertTo-Json -Depth 10
```

### Revoke Specific Session

```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

$sessionId = "SESSION_ID_HERE"
Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/sessions/$sessionId" -Method DELETE -Headers $headers | ConvertTo-Json -Depth 10
```

### Revoke All Sessions

```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/sessions" -Method DELETE -Headers $headers | ConvertTo-Json -Depth 10
```

---

## 💳 Payment Endpoints

### Initialize Payment

```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

$paymentBody = @{
    jobId = "job_123"
    amount = 15000
    description = "Plumbing repair service"
    metadata = @{
        jobTitle = "Fix kitchen sink"
        handymanId = "67..."
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/payments/initialize-job" -Method POST -Headers $headers -Body $paymentBody -ContentType "application/json" | ConvertTo-Json -Depth 10
```

### Verify Payment

```powershell
$reference = "PAYSTACK_REFERENCE_HERE"
Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/payments/verify/$reference" -Method GET | ConvertTo-Json -Depth 10
```

### Get Payment History

```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/payments/history?limit=10" -Method GET -Headers $headers | ConvertTo-Json -Depth 10
```

### Get Banks List

```powershell
Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/payments/banks" -Method GET | ConvertTo-Json -Depth 10
```

---

## 📊 Admin/Testing Endpoints

### Get User Statistics

```powershell
Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/users/stats" -Method GET | ConvertTo-Json -Depth 10
```

**Expected Response**:
```json
{
  "success": true,
  "message": "User statistics",
  "data": {
    "totalUsers": 3,
    "verifiedUsers": 3,
    "unverifiedUsers": 0,
    "usersByRole": {
      "customer": 1,
      "handyman": 1,
      "admin": 1
    }
  }
}
```

### Test Resend Email

```powershell
$testEmailBody = @{
    email = "your-test-email@gmail.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/test-resend" -Method POST -Body $testEmailBody -ContentType "application/json" | ConvertTo-Json -Depth 10
```

---

## 📝 Postman Testing

### Import Collection

1. Open Postman
2. Click **Import**
3. Select `Handyman-App.postman_collection.json` from your project root
4. Create an **Environment** with these variables:
   - `baseUrl`: `https://kleva-server.vercel.app`
   - `accessToken`: (will be auto-filled after login)
   - `refreshToken`: (will be auto-filled after login)
   - `userId`: (will be auto-filled after login)

### Testing Flow in Postman

1. **Register** → Save `userId` from response
2. **Check Email** → Copy verification token
3. **Verify Email** → Paste token
4. **Login** → Tokens auto-saved to environment
5. **Get Profile** → Uses saved `accessToken`
6. **Test Protected Endpoints** → All use saved tokens

---

## 🐛 Troubleshooting

### Error: "Email already registered"
**Solution**: Use a different email address or check if you already registered.

### Error: "Please verify your email before logging in"
**Solution**: Check your email inbox (including spam folder) and click the verification link.

### Error: "Invalid or expired verification token"
**Solution**: Request a new verification email (re-register or use password reset flow).

### Error: "Access token has expired"
**Solution**: Use the refresh token endpoint to get a new access token.

### Error: "Token has been revoked"
**Solution**: Login again to get new tokens.

### Error: "Rate limit exceeded"
**Solution**: Wait 15 minutes before trying again (rate limits reset automatically).

---

## 📊 Expected Test Results

### ✅ Successful Registration
- HTTP Status: `201 Created`
- Response includes `userId`
- Verification email received

### ✅ Successful Login
- HTTP Status: `200 OK`
- Response includes `accessToken` and `refreshToken`
- User object includes profile data

### ✅ Protected Endpoint Access
- HTTP Status: `200 OK`
- Valid token required in Authorization header
- Returns user-specific data

### ❌ Common Errors
- `400 Bad Request`: Missing or invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Email not verified or insufficient permissions
- `409 Conflict`: Duplicate email/phone
- `429 Too Many Requests`: Rate limit exceeded

---

## 🎯 Complete Test Sequence

Run this complete test sequence to verify all functionality:

```powershell
# 1. Health check
Write-Host "`n1️⃣ Testing Health Check..."
Invoke-RestMethod -Uri "https://kleva-server.vercel.app/health" -Method GET | ConvertTo-Json

# 2. Register handyman
Write-Host "`n2️⃣ Registering Handyman..."
$registerBody = @{
    email = "test-handyman-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "Test123!"
    role = "handyman"
    profile = @{
        firstName = "Test"
        lastName = "Handyman"
        phone = "+1$(Get-Random -Minimum 1000000000 -Maximum 9999999999)"
        skills = @("plumbing")
        hourlyRate = 50
        experience = 5
    }
} | ConvertTo-Json -Depth 10
$registerResponse = Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
$registerResponse | ConvertTo-Json

# 3. Check stats
Write-Host "`n3️⃣ Checking User Statistics..."
Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/users/stats" -Method GET | ConvertTo-Json

# 4. Test email (manual - check email for verification link)
Write-Host "`n4️⃣ Check your email for verification link!"
Write-Host "User ID: $($registerResponse.userId)"

# NOTE: After email verification, continue with login tests
```

---

## 📚 Additional Resources

- **API Documentation**: https://kleva-server.vercel.app/api-docs
- **OpenAPI Spec**: https://kleva-server.vercel.app/api-docs/openapi.json
- **GitHub Repository**: Check README for latest updates

---

**🎉 Happy Testing!**

