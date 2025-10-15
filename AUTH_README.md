# Handyman Management App - Authentication System

## Overview

A comprehensive authentication system with advanced security features including:

-   **User Roles**: Handyman, Customer, and Admin
-   **2FA**: TOTP-based (Google Authenticator/Authy)
-   **Email Verification**: Required before login
-   **Password Reset**: Secure token-based reset
-   **Session Management**: Redis-backed with MongoDB fallback
-   **Rate Limiting**: Multi-tier (IP, endpoint, user-level)
-   **Access & Refresh Tokens**: JWT-based with rotation

## Installation

### 1. Install Dependencies

```bash
npm install ioredis express-rate-limit rate-limit-redis uuid
npm install -D @types/ioredis @types/uuid
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# Environment
NODE_ENV=development

# Server
SERVER_HOSTNAME=localhost
PORT=3006

# MongoDB
MONGODB_URI=mongodb://localhost:27017/handyman-app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis Configuration
REDIS_URL=
REDIS_HOST=localhost
REDIS_PORT=6379

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Setup Redis (Required for Sessions & Rate Limiting)

**Using Docker:**

```bash
docker run -d -p 6379:6379 redis:alpine
```

**Or install locally:**

-   macOS: `brew install redis && brew services start redis`
-   Ubuntu: `sudo apt-get install redis-server && sudo systemctl start redis`
-   Windows: Use WSL or Docker

### 4. Setup Resend for Emails

1. Sign up at https://resend.com
2. Get your API key
3. Add it to your `.env` file
4. (Optional) Verify your domain for production use

## API Endpoints

### Public Endpoints

#### Register User

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123",
  "role": "customer",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "address": "123 Main St"
  }
}
```

**Roles:**

-   `customer` - For customers hiring handymen
-   `handyman` - For service providers
-   `admin` - For administrators

**Handyman Profile Fields:**

```json
{
	"firstName": "string",
	"lastName": "string",
	"phone": "string",
	"address": "string",
	"skills": ["plumbing", "electrical"],
	"experience": 5,
	"hourlyRate": 50,
	"availability": "weekdays",
	"bio": "Experienced handyman",
	"certifications": ["cert1", "cert2"]
}
```

#### Verify Email

```http
GET /api/v1/auth/verify-email/:token
```

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123",
  "twoFactorCode": "123456"  // Optional, required if 2FA enabled
}
```

**Response:**

```json
{
	"success": true,
	"message": "Login successful",
	"user": {
		"id": "...",
		"email": "john@example.com",
		"role": "customer",
		"isEmailVerified": true,
		"is2FAEnabled": false
	},
	"tokens": {
		"accessToken": "eyJhbGc...",
		"refreshToken": "eyJhbGc..."
	}
}
```

#### Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Forgot Password

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password

```http
POST /api/v1/auth/reset-password/:token
Content-Type: application/json

{
  "newPassword": "NewPassword123"
}
```

### Protected Endpoints

All protected endpoints require the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

#### Get Profile

```http
GET /api/v1/auth/me
```

#### Update Profile

```http
PATCH /api/v1/auth/me
Content-Type: application/json

{
  "profile": {
    "firstName": "Jane",
    "phone": "+0987654321"
  }
}
```

#### Change Password

```http
POST /api/v1/auth/change-password
Content-Type: application/json

{
  "currentPassword": "Password123",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

#### Logout

```http
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."  // Optional
}
```

### Two-Factor Authentication (2FA)

#### Enable 2FA

```http
POST /api/v1/auth/2fa/enable
Content-Type: application/json

{
  "password": "Password123"
}
```

**Response:**

```json
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "data:image/png;base64,...",
  "backupCodes": [
    "A1B2C3D4",
    "E5F6G7H8",
    ...
  ],
  "message": "Please scan the QR code with your authenticator app"
}
```

#### Verify 2FA (Complete Setup)

```http
POST /api/v1/auth/2fa/verify
Content-Type: application/json

{
  "token": "123456"
}
```

#### Disable 2FA

```http
POST /api/v1/auth/2fa/disable
Content-Type: application/json

{
  "password": "Password123",
  "twoFactorCode": "123456"  // Optional
}
```

### Session Management

#### Get All Sessions

```http
GET /api/v1/auth/sessions
```

**Response:**

```json
{
	"success": true,
	"data": [
		{
			"sessionId": "uuid",
			"deviceInfo": "Mozilla/5.0...",
			"ipAddress": "192.168.1.1",
			"lastActivity": "2024-01-01T12:00:00Z",
			"createdAt": "2024-01-01T10:00:00Z"
		}
	]
}
```

#### Revoke Specific Session

```http
DELETE /api/v1/auth/sessions/:sessionId
```

#### Revoke All Sessions (Logout from all devices)

```http
DELETE /api/v1/auth/sessions
```

## Rate Limiting

The system implements multi-tier rate limiting:

### Auth Endpoints

-   **Limit**: 5 requests per 15 minutes per IP
-   **Applies to**: `/register`, `/login`

### Password Reset

-   **Limit**: 3 requests per hour per IP
-   **Applies to**: `/forgot-password`, `/reset-password`

### 2FA Verification

-   **Limit**: 10 attempts per 15 minutes per IP
-   **Applies to**: `/2fa/verify`

### General API

-   **Limit**: 100 requests per 15 minutes per IP
-   **Applies to**: All other endpoints

### Per-User Limit

-   **Limit**: 1000 requests per hour per authenticated user
-   **Applies to**: All authenticated requests

## Security Features

### Password Requirements

-   Minimum 8 characters
-   At least one uppercase letter
-   At least one lowercase letter
-   At least one number

### Account Protection

-   **Login Attempts**: Maximum 5 failed attempts
-   **Account Lockout**: 15 minutes after max attempts
-   **Email Verification**: Required before login
-   **Password Reset**: 1-hour token expiry

### Session Security

-   Access tokens expire in 15 minutes
-   Refresh tokens expire in 7 days
-   Sessions stored in Redis with MongoDB backup
-   Device and IP tracking
-   Automatic cleanup of expired sessions

### 2FA Security

-   TOTP-based (Time-based One-Time Password)
-   6-digit codes
-   30-second window
-   10 backup codes (single-use)
-   Backup codes are hashed before storage

## Testing the API

### Using cURL

**Register:**

```bash
curl -X POST http://localhost:3006/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "role": "customer",
    "profile": {
      "firstName": "Test",
      "lastName": "User",
      "phone": "+1234567890"
    }
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3006/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

**Get Profile:**

```bash
curl -X GET http://localhost:3006/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import the collection (if available)
2. Set environment variables:
    - `baseUrl`: `http://localhost:3006`
    - `accessToken`: (will be set automatically after login)
    - `refreshToken`: (will be set automatically after login)

## Error Handling

All errors follow a consistent format:

```json
{
	"success": false,
	"message": "Error description",
	"error": {
		"message": "Detailed error message",
		"stack": "Stack trace (development only)"
	}
}
```

### Common HTTP Status Codes

-   `200` - Success
-   `201` - Created
-   `400` - Bad Request (validation error)
-   `401` - Unauthorized (invalid/expired token)
-   `403` - Forbidden (insufficient permissions)
-   `404` - Not Found
-   `409` - Conflict (duplicate email)
-   `429` - Too Many Requests (rate limit exceeded)
-   `500` - Internal Server Error

## Development Tips

### Testing 2FA Locally

1. Install Google Authenticator or Authy on your phone
2. Enable 2FA via the API
3. Scan the QR code from the response
4. Use the generated codes for login

### Testing Email Flows

In development, emails are sent via Resend. You can:

1. Use Resend's test mode
2. Check email delivery in the Resend dashboard
3. Use a test email address

### Redis Connection Issues

If Redis is not available:

-   The system will log a warning
-   Session management will fall back to MongoDB only
-   Rate limiting will use in-memory store
-   Some features may be degraded but the API will still work

## Production Checklist

-   [ ] Change all JWT secrets to strong random values
-   [ ] Set `NODE_ENV=production`
-   [ ] Use a production Redis instance (e.g., Redis Cloud, AWS ElastiCache)
-   [ ] Verify your domain with Resend
-   [ ] Update `FROM_EMAIL` in `src/utils/emailUtils.ts`
-   [ ] Enable HTTPS/TLS
-   [ ] Configure CORS for your frontend domain
-   [ ] Set up monitoring and logging
-   [ ] Implement database backups
-   [ ] Review and adjust rate limits
-   [ ] Set up Redis persistence (RDB/AOF)

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Rate Limit  │
│ Middleware  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Routes    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Validation  │
│ Middleware  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Auth     │
│ Middleware  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controllers │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │
└──────┬──────┘
       │
       ├─────────────┐
       ▼             ▼
┌──────────┐  ┌──────────┐
│ MongoDB  │  │  Redis   │
└──────────┘  └──────────┘
```

## Support

For issues or questions:

1. Check this documentation
2. Review the code comments
3. Check the error messages and logs
4. Ensure all dependencies are installed
5. Verify environment variables are set correctly

## License

ISC
