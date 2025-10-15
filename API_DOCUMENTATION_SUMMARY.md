# Handyman Management API - Documentation Summary

## 📚 Overview

Complete REST API for the Handyman Management Platform with comprehensive authentication, session management, and payment processing capabilities.

## 🔗 Documentation Files

### 1. **Postman Collection** (`Handyman-App.postman_collection.json`)

-   Import into Postman for interactive API testing
-   Includes all endpoints with example requests
-   Environment variables for easy testing
-   Automated scripts to save tokens and IDs

### 2. **OpenAPI Specification** (`openapi.json`)

-   Swagger/OpenAPI 3.0 compatible
-   Can be viewed in Swagger UI, Redoc, or any OpenAPI viewer
-   Complete schema definitions and response examples

## 🚀 Quick Start

### Import Postman Collection

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `Handyman-App.postman_collection.json`
4. Set environment variable: `baseUrl` = `http://localhost:3006`

### View OpenAPI Docs

```bash
# Online viewer
https://editor.swagger.io/
# Upload openapi.json

# Or use local Swagger UI
npx swagger-ui-watcher openapi.json
```

## 📋 API Endpoints Summary

### 🔐 Authentication (`/api/v1/auth`)

| Method | Endpoint               | Description                                 | Auth Required |
| ------ | ---------------------- | ------------------------------------------- | ------------- |
| POST   | `/register`            | Register new user (customer/handyman/admin) | ❌            |
| GET    | `/verify-email/:token` | Verify email address                        | ❌            |
| POST   | `/login`               | User login with optional 2FA                | ❌            |
| POST   | `/refresh`             | Refresh access token                        | ❌            |
| POST   | `/logout`              | Logout and revoke session                   | ✅            |

### 🔑 Password Management (`/api/v1/auth`)

| Method | Endpoint                 | Description                     | Auth Required |
| ------ | ------------------------ | ------------------------------- | ------------- |
| POST   | `/forgot-password`       | Request password reset          | ❌            |
| POST   | `/reset-password/:token` | Reset password with token       | ❌            |
| POST   | `/change-password`       | Change password while logged in | ✅            |

### 👤 Profile Management (`/api/v1/auth`)

| Method | Endpoint | Description              | Auth Required |
| ------ | -------- | ------------------------ | ------------- |
| GET    | `/me`    | Get current user profile | ✅            |
| PATCH  | `/me`    | Update user profile      | ✅            |

### 🔐 Two-Factor Authentication (`/api/v1/auth/2fa`)

| Method | Endpoint   | Description                        | Auth Required |
| ------ | ---------- | ---------------------------------- | ------------- |
| POST   | `/enable`  | Enable 2FA (returns QR code)       | ✅            |
| POST   | `/verify`  | Verify 2FA code and complete setup | ✅            |
| POST   | `/disable` | Disable 2FA                        | ✅            |

### 📱 Session Management (`/api/v1/auth/sessions`)

| Method | Endpoint      | Description                              | Auth Required |
| ------ | ------------- | ---------------------------------------- | ------------- |
| GET    | `/`           | Get all active sessions                  | ✅            |
| DELETE | `/:sessionId` | Revoke specific session                  | ✅            |
| DELETE | `/`           | Revoke all sessions (logout all devices) | ✅            |

### 💰 Payments (`/api/v1/payments`)

| Method | Endpoint                   | Description                      | Auth Required |
| ------ | -------------------------- | -------------------------------- | ------------- |
| POST   | `/initialize-job`          | Initialize payment for job       | ✅            |
| GET    | `/verify/:reference`       | Verify payment status            | ❌            |
| GET    | `/history`                 | Get payment history              | ✅            |
| GET    | `/:reference`              | Get payment details by reference | ✅            |
| POST   | `/initialize-subscription` | Initialize subscription payment  | ✅            |
| GET    | `/banks`                   | Get list of supported banks      | ❌            |
| POST   | `/transfer-recipient`      | Create transfer recipient        | ✅            |
| POST   | `/payout-handyman`         | Payout to handyman (Admin only)  | ✅ Admin      |
| GET    | `/stats`                   | Get payment statistics           | ✅            |
| POST   | `/webhook`                 | Paystack webhook endpoint        | ❌            |

### ⚕️ Health Check

| Method | Endpoint  | Description       | Auth Required |
| ------ | --------- | ----------------- | ------------- |
| GET    | `/health` | API health status | ❌            |

## 🔑 Authentication Flow

### 1. Register & Verify Email

```javascript
// Step 1: Register
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "StrongPass123",
  "role": "customer",
  "profile": { /* profile data */ }
}

// Step 2: Check email and verify
GET /api/v1/auth/verify-email/{token-from-email}
```

### 2. Login

```javascript
// Without 2FA
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "StrongPass123"
}

// With 2FA
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "StrongPass123",
  "twoFactorCode": "123456"
}
```

### 3. Use Access Token

```javascript
// Add to request headers
Authorization: Bearer {accessToken}
```

### 4. Refresh Token

```javascript
POST /api/v1/auth/refresh
{
  "refreshToken": "{your-refresh-token}"
}
```

## 💳 Payment Flow

### 1. Initialize Payment

```javascript
POST /api/v1/payments/initialize-job
Authorization: Bearer {accessToken}
{
  "jobId": "job-123",
  "amount": 5000,  // Amount in NGN
  "description": "Plumbing service",
  "metadata": {
    "jobTitle": "Fix leaking pipes"
  }
}

// Response includes Paystack checkout URL
{
  "success": true,
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/..."
  }
}
```

### 2. Customer Pays

-   Redirect customer to `authorizationUrl`
-   Customer completes payment on Paystack
-   Paystack sends webhook to your server

### 3. Verify Payment

```javascript
GET /api/v1/payments/verify/{reference}

// Response
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "status": "successful",
    "amount": "₦5,000",
    "reference": "HMA_..."
  }
}
```

## 🔒 Security Features

### Rate Limiting

-   **Auth endpoints**: 5 requests per 15 minutes per IP
-   **Password reset**: 3 requests per 15 minutes per IP
-   **2FA verification**: 5 requests per 15 minutes per IP
-   **General API**: 100 requests per 15 minutes per IP
-   **Per-user**: 1000 requests per hour (authenticated)

### Token Expiry

-   **Access Token**: 15 minutes
-   **Refresh Token**: 7 days
-   **Email Verification**: 24 hours
-   **Password Reset**: 1 hour

### 2FA Implementation

-   **Type**: TOTP (Time-based One-Time Password)
-   **Compatible**: Google Authenticator, Authy, Microsoft Authenticator
-   **Backup Codes**: 10 single-use codes provided

## 🌍 Environment Variables

```env
# Server
PORT=3006
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_uri

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis (Session & Rate Limiting)
REDIS_URL=your_upstash_redis_url
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Frontend
FRONTEND_URL=http://localhost:3000

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
PAYSTACK_WEBHOOK_SECRET=sk_test_your_secret_key
PAYMENT_CURRENCY=NGN
```

## 🧪 Testing with Postman

### Setup Environment

1. Create new environment in Postman
2. Add variables:
    - `baseUrl`: `http://localhost:3006`
    - `accessToken`: (auto-populated by login)
    - `refreshToken`: (auto-populated by login)
    - `userId`: (auto-populated by registration)

### Test Flow

1. **Register** → Auto-saves `userId`
2. **Verify Email** (use token from logs/email)
3. **Login** → Auto-saves `accessToken` and `refreshToken`
4. **Test Protected Endpoints** (token auto-attached)
5. **Initialize Payment** → Get Paystack URL
6. **Verify Payment** (after paying on Paystack)

## 📊 Response Format

### Success Response

```json
{
	"success": true,
	"message": "Operation successful",
	"data": {
		/* response data */
	}
}
```

### Error Response

```json
{
	"success": false,
	"message": "Error description"
}
```

### Validation Error

```json
{
	"success": false,
	"message": "Validation failed",
	"errors": [
		{
			"field": "email",
			"message": "Invalid email format"
		}
	]
}
```

## 🎯 User Roles

### Customer

-   Create jobs
-   Make payments
-   Review handymen
-   Manage profile

### Handyman

-   Browse jobs
-   Accept jobs
-   Receive payouts
-   Manage profile & skills

### Admin

-   Manage users
-   Process payouts
-   View all payments
-   Platform management

## 📞 Support

For API support or questions:

-   **Email**: support@handyman-app.com
-   **Documentation**: Check `README.md`
-   **Issues**: Check terminal logs for detailed errors

## 🔄 Webhook Setup

### Paystack Webhook Configuration

1. **Dashboard**: Go to Paystack Dashboard → Settings → Webhooks
2. **URL**: `https://your-domain.com/api/v1/payments/webhook`
    - For local testing: Use LocalTunnel or ngrok
    - Example: `https://your-tunnel-url.loca.lt/api/v1/payments/webhook`
3. **Events**: All events are automatically sent in test mode
4. **Secret**: Use your `PAYSTACK_SECRET_KEY` to verify webhooks

### Supported Webhook Events

-   `charge.success` - Payment successful
-   `charge.failed` - Payment failed
-   `transfer.success` - Payout successful
-   `transfer.failed` - Payout failed

## 🚦 Status Codes

| Code | Meaning                               |
| ---- | ------------------------------------- |
| 200  | Success                               |
| 201  | Created                               |
| 400  | Bad Request / Validation Error        |
| 401  | Unauthorized                          |
| 403  | Forbidden                             |
| 404  | Not Found                             |
| 409  | Conflict (e.g., email already exists) |
| 429  | Too Many Requests (Rate Limited)      |
| 500  | Internal Server Error                 |

---

**Last Updated**: October 2025  
**API Version**: 1.0.0  
**Base URL**: `http://localhost:3006`
