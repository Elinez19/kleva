<!-- 41541dcb-460c-4527-89ac-2600cd9f8628 bb29ae5d-de57-4b3d-ba90-7d8fda684771 -->
# Handyman Management App - Authentication System

## Architecture Overview

Build a secure authentication system leveraging existing dependencies (JWT, speakeasy, resend, bcryptjs) with new Redis integration for session management.

## Implementation Steps

### 1. Dependencies & Configuration

**Add Redis packages:**

- `ioredis` for Redis client
- `@types/ioredis` for TypeScript types
- `express-rate-limit` for rate limiting
- `rate-limit-redis` for Redis-backed rate limiting

**Update `src/config/config.ts`:**

- Add JWT_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY
- Add REDIS_URL, REDIS_HOST, REDIS_PORT
- Add RESEND_API_KEY, FRONTEND_URL
- Add rate limit configurations

**Create `src/config/redis.ts`:**

- Redis connection setup with error handling
- Export Redis client instance

### 2. Database Models

**Create `src/models/user.model.ts`:**

- Base user schema with: email, password (hashed), role (enum: 'handyman' | 'customer' | 'admin')
- Email verification fields: `isEmailVerified`, `emailVerificationToken`, `emailVerificationExpires`
- 2FA fields: `is2FAEnabled`, `twoFactorSecret`, `twoFactorBackupCodes`
- Password reset: `passwordResetToken`, `passwordResetExpires`
- Account status: `isActive`, `accountLockedUntil`, `loginAttempts`
- Profile fields based on role
- Timestamps and indexes

**Create `src/models/refreshToken.model.ts`:**

- Schema for refresh token management
- Fields: `userId`, `token` (hashed), `expiresAt`, `deviceInfo`, `ipAddress`, `isRevoked`
- Indexes on userId, token, expiresAt

**Create `src/models/session.model.ts`:**

- MongoDB backup for Redis sessions
- Fields: `userId`, `sessionId`, `accessToken`, `refreshToken`, `deviceInfo`, `ipAddress`, `lastActivity`, `expiresAt`
- TTL index on expiresAt

### 3. Interfaces

**Create `src/interfaces/IUser.ts`:**

- User interface matching user model
- Role-specific profile interfaces
- Type exports

**Create `src/interfaces/IAuth.ts`:**

- AuthResponse, LoginResponse, RegisterResponse types
- TokenPayload interface
- Session interface

**Create `src/interfaces/ISession.ts`:**

- Session data structure for Redis

### 4. Validation Schemas

**Update `src/validation/user.validation.ts`:**

- Registration schema (separate for handyman/customer/admin)
- Login schema with optional 2FA code
- Email verification schema
- Password reset request schema
- Password reset confirm schema
- Enable 2FA schema
- Verify 2FA schema
- Refresh token schema

### 5. Utilities

**Create `src/utils/jwtUtils.ts`:**

- `generateAccessToken(userId, role)` - 15min expiry
- `generateRefreshToken(userId, role)` - 7 days expiry
- `verifyAccessToken(token)`
- `verifyRefreshToken(token)`
- Token payload interfaces

**Create `src/utils/emailUtils.ts`:**

- Configure Resend client
- `sendVerificationEmail(email, token)`
- `sendPasswordResetEmail(email, token)`
- `sendWelcomeEmail(email, name)`
- `send2FAEnabledEmail(email, name)`
- Email templates with consistent styling

**Create `src/utils/sessionUtils.ts`:**

- `createSession(userId, accessToken, refreshToken, deviceInfo, ipAddress)` - Store in Redis & MongoDB
- `getSession(sessionId)` - Retrieve from Redis (fallback to MongoDB)
- `updateSessionActivity(sessionId)` - Update last activity
- `revokeSession(sessionId)` - Remove from Redis & mark in MongoDB
- `revokeAllUserSessions(userId)` - Logout all devices
- Session key generation helpers

**Create `src/utils/twoFactorUtils.ts`:**

- `generate2FASecret(email)` - Generate secret with speakeasy
- `generateQRCode(secret, email)` - Create QR code URI
- `verify2FAToken(secret, token)` - Verify TOTP code
- `generateBackupCodes()` - Generate 10 backup codes
- `hashBackupCode(code)` - Hash backup codes before storage

### 6. Middleware

**Create `src/middleware/authHandler.ts`:**

- `authenticate` - Verify access token, check session validity in Redis
- `requireRole(...roles)` - Role-based authorization
- `require2FA` - Ensure 2FA is verified for sensitive operations
- Extract user from token and attach to req.user

**Create `src/middleware/rateLimitHandler.ts`:**

- Auth endpoints limiter: 5 requests per 15 min per IP
- General API limiter: 100 requests per 15 min per IP
- Per-user limiter: 1000 requests per hour per authenticated user
- Redis store for distributed rate limiting
- Custom error messages

**Update `src/middleware/errorHandler.ts`:**

- Add auth-specific error handling
- JWT errors, validation errors, rate limit errors

### 7. Services

**Create `src/services/authServices.ts`:**

- `registerUser(data)` - Create user, send verification email
- `verifyEmail(token)` - Verify email token and activate account
- `login(email, password, twoFactorCode?)` - Authenticate, create session, return tokens
- `refreshAccessToken(refreshToken)` - Generate new access token
- `logout(sessionId)` - Revoke session
- `requestPasswordReset(email)` - Generate reset token, send email
- `resetPassword(token, newPassword)` - Validate token, update password
- `enable2FA(userId)` - Generate secret, return QR code
- `verify2FA(userId, token)` - Verify and enable 2FA
- `disable2FA(userId, password)` - Disable 2FA after password check
- `changePassword(userId, currentPassword, newPassword)` - Update password

**Create `src/services/sessionServices.ts`:**

- Helper functions for session CRUD operations
- Integration with Redis and MongoDB

### 8. Controllers

**Create `src/controllers/authControllers.ts`:**

- `register` - POST /register
- `verifyEmail` - GET /verify-email/:token
- `login` - POST /login
- `refreshToken` - POST /refresh
- `logout` - POST /logout
- `requestPasswordReset` - POST /forgot-password
- `resetPassword` - POST /reset-password/:token
- `getProfile` - GET /me
- `updateProfile` - PATCH /me
- `changePassword` - POST /change-password
- `enable2FA` - POST /2fa/enable
- `verify2FA` - POST /2fa/verify
- `disable2FA` - POST /2fa/disable
- `getSessions` - GET /sessions
- `revokeSession` - DELETE /sessions/:id
- `revokeAllSessions` - DELETE /sessions

All controllers use async/await with proper error handling

### 9. Routes

**Create `src/routes/v1/authRoutes.ts`:**

- Public routes: register, login, verify-email, forgot-password, reset-password, refresh
- Protected routes: logout, profile, change-password, 2FA endpoints, sessions
- Apply appropriate rate limiting to each route group
- Use validation middleware for all routes

**Update `src/routes/v1/index.ts`:**

- Add auth routes at `/api/v1/auth`

### 10. Application Setup

**Update `src/app.ts`:**

- Import and initialize Redis connection
- Add cookie-parser middleware
- Apply global rate limiting
- Session management setup

**Update `src/server.ts`:**

- Ensure Redis connection before server start
- Graceful shutdown for Redis connections

### 11. Environment Variables

Add to `.env.example`:

```
# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_URL=
REDIS_HOST=localhost
REDIS_PORT=6379

# Resend Email
RESEND_API_KEY=

# Frontend
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Features

1. **Password Security**: bcrypt hashing with salt rounds
2. **Token Security**: Separate secrets for access/refresh tokens, short expiry for access tokens
3. **Session Security**: Redis-backed sessions with device tracking, IP validation
4. **2FA**: TOTP implementation with backup codes
5. **Rate Limiting**: Multi-tier (IP, endpoint, user-level)
6. **Account Protection**: Login attempt tracking, account lockout after failed attempts
7. **Email Verification**: Required before account activation
8. **Secure Headers**: Consider adding helmet middleware

## Testing Considerations

- Unit tests for utilities (JWT, 2FA, session)
- Integration tests for auth flows
- Rate limit testing
- 2FA setup and verification flows
- Password reset flow
- Session management (logout, revoke)

## Key Files

- Models: `src/models/user.model.ts`, `src/models/refreshToken.model.ts`
- Controllers: `src/controllers/authControllers.ts`
- Services: `src/services/authServices.ts`, `src/services/sessionServices.ts`
- Middleware: `src/middleware/authHandler.ts`, `src/middleware/rateLimitHandler.ts`
- Utils: `src/utils/jwtUtils.ts`, `src/utils/emailUtils.ts`, `src/utils/sessionUtils.ts`, `src/utils/twoFactorUtils.ts`
- Config: `src/config/redis.ts`, update `src/config/config.ts`

### To-dos

- [ ] Install Redis packages and update configuration files
- [ ] Create User, RefreshToken, and Session models with proper schemas and indexes
- [ ] Define TypeScript interfaces for User, Auth, and Session types
- [ ] Build Zod validation schemas for all auth operations
- [ ] Create utility functions for JWT, email, sessions, and 2FA
- [ ] Implement authentication and rate limiting middleware
- [ ] Build auth and session service layers with business logic
- [ ] Implement auth controllers for all endpoints
- [ ] Configure auth routes with proper middleware chains
- [ ] Update app.ts and server.ts to integrate Redis and auth system