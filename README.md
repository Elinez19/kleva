# Handyman Management API

RESTful API for managing handyman services, bookings, and user authentication.

## Tech Stack

-   **Runtime:** Node.js + TypeScript
-   **Framework:** Express.js
-   **Database:** MongoDB + Mongoose
-   **Cache/Sessions:** Redis (Upstash)
-   **Validation:** Zod
-   **Authentication:** JWT with 2FA (TOTP)
-   **Email:** Resend
-   **Documentation:** OpenAPI 3.0 (Swagger)

## Features

✅ **Complete Authentication System**

-   User registration with email verification
-   Login with 2FA support (TOTP - Google Authenticator)
-   Password reset flow
-   Access & Refresh tokens (JWT)
-   Session management (Redis-backed)
-   Multi-tier rate limiting

✅ **User Roles**

-   **Handyman** - Service providers with skills, rates, and availability
-   **Customer** - Clients who hire handymen
-   **Admin** - Platform administrators

✅ **Security Features**

-   bcrypt password hashing
-   Account lockout after failed attempts
-   Email verification required
-   Redis session management
-   IP and device tracking
-   2FA with backup codes

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file:

```env
# Environment
NODE_ENV=development

# Server
PORT=3006

# MongoDB Atlas (Production)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/handyman-app?retryWrites=true&w=majority

# Local Development (Optional)
# MONGODB_URI=mongodb://localhost:27017/handyman-app

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Upstash Redis
REDIS_URL=rediss://default:password@us1-xxxxx.upstash.io:6379

# Resend Email
RESEND_API_KEY=re_your_api_key

# Frontend
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Setup Services

**MongoDB:**

-   Local: Install MongoDB or use Docker
-   Cloud: MongoDB Atlas (free tier available)

**Redis:**

-   Recommended: Upstash (https://console.upstash.com) - Free tier
-   Alternative: Local Redis installation

**Email:**

-   Sign up at Resend (https://resend.com) - Free tier: 100 emails/day
-   Get API key from dashboard

### 4. Seed Database (Optional but Recommended)

```bash
# Clear database and add test users
npm run seed:clear
```

This creates 7 test users:

-   2 Admins (operations & testing)
-   3 Handymen (plumber, electrician, general)
-   2 Customers

**📋 See [SEED_DATA.md](./SEED_DATA.md) for all credentials**

### 5. Run the Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Server runs on `http://localhost:3006`

## API Endpoints

### Authentication Endpoints

| Method   | Endpoint                             | Description               | Auth Required |
| -------- | ------------------------------------ | ------------------------- | ------------- |
| `POST`   | `/api/v1/auth/register`              | Register new user         | ❌            |
| `GET`    | `/api/v1/auth/verify-email/:token`   | Verify email address      | ❌            |
| `POST`   | `/api/v1/auth/login`                 | Login (with optional 2FA) | ❌            |
| `POST`   | `/api/v1/auth/refresh`               | Refresh access token      | ❌            |
| `POST`   | `/api/v1/auth/forgot-password`       | Request password reset    | ❌            |
| `POST`   | `/api/v1/auth/reset-password/:token` | Reset password            | ❌            |
| `POST`   | `/api/v1/auth/logout`                | Logout                    | ✅            |
| `GET`    | `/api/v1/auth/me`                    | Get user profile          | ✅            |
| `PATCH`  | `/api/v1/auth/me`                    | Update profile            | ✅            |
| `POST`   | `/api/v1/auth/change-password`       | Change password           | ✅            |
| `POST`   | `/api/v1/auth/2fa/enable`            | Enable 2FA                | ✅            |
| `POST`   | `/api/v1/auth/2fa/verify`            | Verify 2FA setup          | ✅            |
| `POST`   | `/api/v1/auth/2fa/disable`           | Disable 2FA               | ✅            |
| `GET`    | `/api/v1/auth/sessions`              | Get all sessions          | ✅            |
| `DELETE` | `/api/v1/auth/sessions/:id`          | Revoke specific session   | ✅            |
| `DELETE` | `/api/v1/auth/sessions`              | Revoke all sessions       | ✅            |

### Utility Endpoints

| Method | Endpoint    | Description           |
| ------ | ----------- | --------------------- |
| `GET`  | `/health`   | Health check          |
| `GET`  | `/api-docs` | Swagger documentation |

## User Roles & Profiles

### Customer Profile

```json
{
	"email": "customer@example.com",
	"password": "Secure123",
	"role": "customer",
	"profile": {
		"firstName": "John",
		"lastName": "Doe",
		"phone": "+1234567890",
		"address": "123 Main St",
		"preferredContactMethod": "email"
	}
}
```

### Handyman Profile

```json
{
	"email": "handyman@example.com",
	"password": "Secure123",
	"role": "handyman",
	"profile": {
		"firstName": "Mike",
		"lastName": "Smith",
		"phone": "+1234567890",
		"address": "456 Oak Ave",
		"skills": ["plumbing", "electrical", "carpentry"],
		"experience": 10,
		"hourlyRate": 75,
		"availability": "weekdays 9am-5pm",
		"bio": "Experienced handyman with 10 years...",
		"certifications": ["Licensed Plumber", "Electrician"]
	}
}
```

### Admin Profile

```json
{
	"email": "admin@example.com",
	"password": "Secure123",
	"role": "admin",
	"profile": {
		"firstName": "Admin",
		"lastName": "User",
		"phone": "+1234567890",
		"department": "Operations"
	}
}
```

## Testing the API

### Using Postman (Recommended)

**Quick Setup:**

1. Import `Handyman-App.postman_collection.json` into Postman
2. Import `Handyman-App.postman_environment.json`
3. Select "Handyman App - Local" environment
4. Start testing! Tokens auto-save after login

📖 **See [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md) for complete guide**

### Using cURL

#### Register a Customer

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

#### Login

```bash
curl -X POST http://localhost:3006/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

#### Get Profile (with token)

```bash
curl -X GET http://localhost:3006/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Project Structure

```
src/
├── config/          # Configuration (DB, Redis, etc.)
├── constants/       # HTTP status codes
├── controllers/     # Route handlers
├── database/        # DB connection & seeding
├── helpers/         # Utility functions
├── interfaces/      # TypeScript interfaces
├── middleware/      # Express middleware (auth, rate limiting)
├── models/          # Mongoose models (User, Session, RefreshToken)
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript types
├── utils/           # Utilities (JWT, email, 2FA, sessions)
└── validation/      # Zod schemas
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm start            # Start production server
npm run seed         # Add test users to database
npm run seed:clear   # Clear DB and re-seed with test users
npm test             # Run tests
```

**💡 Tip:** Run `npm run seed:clear` first for instant test accounts!

## Documentation

-   **Complete Auth Guide:** See [AUTH_README.md](./AUTH_README.md)
-   **Implementation Summary:** See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
-   **Postman Collection:** Import `Handyman-App.postman_collection.json` - See [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)
-   **Seed Data Reference:** All test user credentials - See [SEED_DATA.md](./SEED_DATA.md)
-   **Swagger UI:** http://localhost:3006/api-docs (when implemented)

## Security Features

### Password Requirements

-   Minimum 8 characters
-   At least one uppercase letter
-   At least one lowercase letter
-   At least one number

### Rate Limiting

-   Auth endpoints: 5 requests/15 min per IP
-   Password reset: 3 requests/hour per IP
-   2FA verification: 10 attempts/15 min per IP
-   General API: 100 requests/15 min per IP
-   Per-user: 1000 requests/hour

### Session Management

-   Access tokens: 15-minute expiry
-   Refresh tokens: 7-day expiry
-   Redis-backed sessions with MongoDB fallback
-   Multi-device support
-   Device and IP tracking

### Two-Factor Authentication

-   TOTP-based (Google Authenticator compatible)
-   QR code generation
-   10 backup codes (hashed and single-use)

## Deployment

### Vercel Deployment

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in [Vercel Dashboard](https://vercel.com/dashboard)
3. Add environment variables
4. Deploy!

Your API will be available at: `https://your-project.vercel.app`

### Environment Variables for Production

Make sure to set:

-   `MONGODB_URI` - MongoDB connection string
-   `REDIS_URL` - Upstash Redis URL
-   `JWT_SECRET` - Strong random secret
-   `JWT_REFRESH_SECRET` - Strong random secret
-   `RESEND_API_KEY` - Resend API key
-   `FRONTEND_URL` - Your frontend URL
-   `NODE_ENV=production`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Support

For issues or questions, please refer to:

-   [AUTH_README.md](./AUTH_README.md) for authentication details
-   [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical overview "# kleva"
