# Postman Collection Guide

## Overview

Complete Postman collection for testing the Handyman Management App Authentication API with all endpoints organized into logical folders.

## Files Included

1. **`Handyman-App.postman_collection.json`** - Main API collection
2. **`Handyman-App.postman_environment.json`** - Local environment variables

## Quick Setup

### Step 1: Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop or select:
    - `Handyman-App.postman_collection.json`
    - `Handyman-App.postman_environment.json`
4. Click **Import**

### Step 2: Select Environment

1. Click the environment dropdown (top right)
2. Select **"Handyman App - Local"**
3. Verify `baseUrl` is set to `http://localhost:3006`

### Step 3: Start Your Server

```bash
npm run dev
# or
npm start
```

## Collection Structure

### 📁 1. Authentication (7 requests)

-   **Register Customer** - Create customer account
-   **Register Handyman** - Create handyman account
-   **Register Admin** - Create admin account
-   **Verify Email** - Verify email with token
-   **Login** - Login with email/password
-   **Login with 2FA** - Login with 2FA code
-   **Refresh Token** - Get new access token
-   **Logout** - End session

### 📁 2. Password Management (3 requests)

-   **Forgot Password** - Request reset link
-   **Reset Password** - Reset with token
-   **Change Password** - Change while logged in

### 📁 3. Profile Management (2 requests)

-   **Get Profile** - View current user
-   **Update Profile** - Update user info

### 📁 4. Two-Factor Authentication (3 requests)

-   **Enable 2FA** - Get QR code and backup codes
-   **Verify 2FA** - Complete 2FA setup
-   **Disable 2FA** - Turn off 2FA

### 📁 5. Session Management (3 requests)

-   **Get All Sessions** - View active sessions
-   **Revoke Specific Session** - Logout one device
-   **Revoke All Sessions** - Logout all devices

### 📄 6. Health Check

-   **Health Check** - API status

## Testing Flow

### Complete Registration & Login Flow

1. **Register Customer**

    ```
    POST /api/v1/auth/register
    ```

    - Auto-saves `userId` to environment
    - Check your email for verification link (or logs)

2. **Verify Email** (Optional in dev)

    ```
    GET /api/v1/auth/verify-email/:token
    ```

    - Use token from email
    - Account is now active

3. **Login**

    ```
    POST /api/v1/auth/login
    ```

    - Auto-saves `accessToken` and `refreshToken`
    - All protected routes now work automatically

4. **Get Profile**
    ```
    GET /api/v1/auth/me
    ```
    - Uses saved `accessToken` automatically
    - View your user data

### Testing 2FA Flow

1. **Enable 2FA** (must be logged in)

    ```
    POST /api/v1/auth/2fa/enable
    ```

    - Returns QR code URL
    - Returns backup codes (save these!)
    - Auto-saves `twoFactorSecret`

2. **Scan QR Code**

    - Copy `qrCodeUrl` from response
    - Open in browser OR
    - Scan with Google Authenticator app

3. **Verify 2FA**

    ```
    POST /api/v1/auth/2fa/verify
    ```

    - Enter 6-digit code from authenticator
    - 2FA is now active

4. **Login with 2FA**
    ```
    POST /api/v1/auth/login
    ```
    - Include `twoFactorCode` in body
    - Get new tokens

### Testing Session Management

1. **View All Sessions**

    ```
    GET /api/v1/auth/sessions
    ```

    - See all active devices
    - Note session IDs

2. **Revoke Specific Session**

    ```
    DELETE /api/v1/auth/sessions/:sessionId
    ```

    - Logout from one device

3. **Revoke All Sessions**
    ```
    DELETE /api/v1/auth/sessions
    ```
    - Logout from all devices

## Environment Variables

The collection automatically manages these variables:

| Variable          | Description         | Auto-set  |
| ----------------- | ------------------- | --------- |
| `baseUrl`         | API base URL        | ❌ Manual |
| `accessToken`     | JWT access token    | ✅ Auto   |
| `refreshToken`    | JWT refresh token   | ✅ Auto   |
| `tempToken`       | Temporary 2FA token | ✅ Auto   |
| `userId`          | Current user ID     | ✅ Auto   |
| `handymanUserId`  | Handyman user ID    | ✅ Auto   |
| `twoFactorSecret` | 2FA secret          | ✅ Auto   |

### Manual Variables

You may need to manually set:

-   Verification tokens (from email)
-   Reset tokens (from email)
-   Session IDs (from sessions list)

## Auto-Scripts

The collection includes automatic scripts:

### Login Request

```javascript
// Automatically saves tokens after login
if (pm.response.code === 200) {
	const response = pm.response.json();
	if (response.tokens) {
		pm.environment.set('accessToken', response.tokens.accessToken);
		pm.environment.set('refreshToken', response.tokens.refreshToken);
	}
}
```

### Register Request

```javascript
// Automatically saves user ID
if (pm.response.code === 201) {
	const response = pm.response.json();
	if (response.userId) {
		pm.environment.set('userId', response.userId);
	}
}
```

### Enable 2FA Request

```javascript
// Logs QR code and backup codes to console
if (pm.response.code === 200) {
	console.log('QR Code URL:', response.qrCodeUrl);
	console.log('Backup Codes:', response.backupCodes);
}
```

## Testing Different Roles

### Customer Registration

```json
{
	"email": "customer@test.com",
	"password": "Customer123",
	"role": "customer",
	"profile": {
		"firstName": "John",
		"lastName": "Doe",
		"phone": "+1234567890",
		"preferredContactMethod": "email"
	}
}
```

### Handyman Registration

```json
{
	"email": "handyman@test.com",
	"password": "Handyman123",
	"role": "handyman",
	"profile": {
		"firstName": "Mike",
		"lastName": "Smith",
		"phone": "+1234567891",
		"skills": ["plumbing", "electrical"],
		"hourlyRate": 75,
		"experience": 10
	}
}
```

### Admin Registration

```json
{
	"email": "admin@test.com",
	"password": "Admin123!",
	"role": "admin",
	"profile": {
		"firstName": "Admin",
		"lastName": "User",
		"department": "Operations"
	}
}
```

## Rate Limiting

Be aware of rate limits:

-   **Auth endpoints**: 5 requests / 15 min
-   **Password reset**: 3 requests / hour
-   **2FA verify**: 10 attempts / 15 min
-   **General API**: 100 requests / 15 min

If you hit a limit, you'll see:

```json
{
	"success": false,
	"message": "Too many requests, please try again later"
}
```

## Testing Email Features

### For Development (Resend Test Emails)

Use these test emails:

```json
{
	"email": "delivered@resend.dev"
}
```

This will:

-   Always deliver successfully
-   Show in Resend dashboard logs
-   Not send actual emails

### For Production

Use real email addresses once Resend is configured with your domain.

## Troubleshooting

### Token Expired Error

```json
{
	"success": false,
	"message": "Token has expired",
	"code": "TOKEN_EXPIRED"
}
```

**Solution:** Use the **Refresh Token** request to get a new access token.

### Unauthorized Error

```json
{
	"success": false,
	"message": "No token provided"
}
```

**Solution:** Make sure you're logged in and `accessToken` is set in environment.

### Email Not Verified

```json
{
	"success": false,
	"message": "Please verify your email before logging in"
}
```

**Solution:** Run **Verify Email** request with token from email.

### 2FA Required

```json
{
	"success": true,
	"requires2FA": true,
	"tempToken": "..."
}
```

**Solution:** Use **Login with 2FA** request and include the 6-digit code.

## Creating Custom Environments

### Staging Environment

1. Duplicate the Local environment
2. Rename to "Handyman App - Staging"
3. Change `baseUrl` to your staging URL
4. Clear all token values

### Production Environment

1. Duplicate the Local environment
2. Rename to "Handyman App - Production"
3. Change `baseUrl` to your production URL
4. Clear all token values

## Advanced Testing

### Runner (Batch Testing)

1. Click on collection name
2. Click **Run**
3. Select requests to run
4. Click **Run Handyman Management App**

### Pre-request Scripts

Add to any request to log something:

```javascript
console.log('Running request:', pm.info.requestName);
console.log('Current token:', pm.environment.get('accessToken'));
```

### Tests / Assertions

Add to verify responses:

```javascript
pm.test('Status code is 200', function () {
	pm.response.to.have.status(200);
});

pm.test('Response has success field', function () {
	pm.expect(pm.response.json()).to.have.property('success');
});
```

## Quick Tips

1. **View Console**: Click console icon (bottom left) to see logs
2. **Auto-complete**: Use `{{variableName}}` in any field
3. **Save Responses**: Click **Save Response** to keep examples
4. **Share Collection**: Export and share with team
5. **Version Control**: Commit collection files to git

## Example Workflow

### Day 1: Setup

1. Import collection and environment
2. Register as customer
3. Login (tokens auto-saved)
4. Get profile
5. Update profile

### Day 2: Security Features

1. Enable 2FA
2. Scan QR code
3. Verify 2FA
4. Logout
5. Login with 2FA code

### Day 3: Session Management

1. Login from "multiple devices" (run login multiple times)
2. View all sessions
3. Revoke specific session
4. Test that revoked session is invalid

### Day 4: Password Features

1. Request password reset
2. Check email for token
3. Reset password
4. Login with new password
5. Change password while logged in

## Support

For issues:

1. Check response body for error details
2. View Postman console for logs
3. Check server logs
4. Verify environment variables are set
5. Ensure server is running

---

**Happy Testing! 🚀**

Need help? Check:

-   [AUTH_README.md](./AUTH_README.md) - Complete API documentation
-   [README.md](./README.md) - Project overview
-   [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details
