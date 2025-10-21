# Handyman Approval System - Quick Test Guide

## Test the Complete Flow

### Step 1: Register a Handyman

```bash
POST http://localhost:3006/api/v1/auth/register
Content-Type: application/json

{
  "email": "testhandyman@gmail.com",
  "password": "TestPass123",
  "role": "handyman",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "address": "123 Main St",
    "skills": ["plumbing", "electrical"],
    "experience": 5,
    "hourlyRate": 50,
    "bio": "Experienced handyman"
  }
}
```

**Expected Response:**

```json
{
	"success": true,
	"message": "Registration successful. Please check your email to verify your account.",
	"userId": "...",
	"verificationToken": "...",
	"verificationUrl": "..."
}
```

**Status**: `approvalStatus: 'pending'`

---

### Step 2: Verify Email

```bash
GET http://localhost:3006/api/v1/auth/verify-email/{verificationToken}
```

**Expected Response:**

```json
{
	"success": true,
	"message": "Email verified successfully. You can now log in to your account."
}
```

**Status**: `isEmailVerified: true`, `approvalStatus: 'pending'` (unchanged)

---

### Step 3: Try to Login (SHOULD FAIL ❌)

```bash
POST http://localhost:3006/api/v1/auth/login
Content-Type: application/json

{
  "email": "testhandyman@gmail.com",
  "password": "TestPass123"
}
```

**Expected Response (401 Unauthorized):**

```json
{
	"success": false,
	"message": "Your handyman account is pending admin approval"
}
```

✅ **This confirms handyman cannot login before approval**

---

### Step 4: Admin Login

```bash
POST http://localhost:3006/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin_password"
}
```

**Save the admin access token!**

---

### Step 5: View Pending Handymen

```bash
GET http://localhost:3006/api/v1/auth/admin/pending-handymen
Authorization: Bearer {admin_access_token}
```

**Expected Response:**

```json
{
	"success": true,
	"message": "Pending handymen retrieved successfully",
	"data": {
		"pendingHandymen": [
			{
				"_id": "...",
				"email": "testhandyman@gmail.com",
				"role": "handyman",
				"approvalStatus": "pending",
				"profile": {
					"firstName": "John",
					"lastName": "Doe",
					"skills": ["plumbing", "electrical"]
				}
			}
		],
		"count": 1
	}
}
```

---

### Step 6: Approve Handyman

```bash
POST http://localhost:3006/api/v1/auth/admin/approve-handyman/{userId}
Authorization: Bearer {admin_access_token}
```

**Expected Response:**

```json
{
	"success": true,
	"message": "Handyman approved successfully",
	"data": {
		"userId": "...",
		"email": "testhandyman@gmail.com",
		"approvalStatus": "approved",
		"approvedBy": "admin_id",
		"approvedAt": "2024-01-01T00:00:00.000Z"
	}
}
```

**Status**: `approvalStatus: 'approved'`

---

### Step 7: Handyman Login (SHOULD SUCCEED ✅)

```bash
POST http://localhost:3006/api/v1/auth/login
Content-Type: application/json

{
  "email": "testhandyman@gmail.com",
  "password": "TestPass123"
}
```

**Expected Response (200 OK):**

```json
{
	"success": true,
	"message": "Login successful",
	"accessToken": "...",
	"refreshToken": "...",
	"user": {
		"_id": "...",
		"email": "testhandyman@gmail.com",
		"role": "handyman",
		"approvalStatus": "approved"
	}
}
```

✅ **Handyman can now login after admin approval!**

---

## Alternative: Test Rejection Flow

### Reject Handyman

```bash
POST http://localhost:3006/api/v1/auth/admin/reject-handyman/{userId}
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
  "reason": "Insufficient experience"
}
```

**Expected Response:**

```json
{
	"success": true,
	"message": "Handyman rejected successfully",
	"data": {
		"userId": "...",
		"approvalStatus": "rejected",
		"rejectionReason": "Insufficient experience"
	}
}
```

### Try to Login After Rejection

```bash
POST http://localhost:3006/api/v1/auth/login

{
  "email": "testhandyman@gmail.com",
  "password": "TestPass123"
}
```

**Expected Response (401 Unauthorized):**

```json
{
	"success": false,
	"message": "Your handyman account has been rejected. Reason: Insufficient experience"
}
```

---

## Compare: Customer Registration (No Approval Needed)

### Register Customer

```bash
POST http://localhost:3006/api/v1/auth/register

{
  "email": "customer@gmail.com",
  "password": "TestPass123",
  "role": "customer",
  "profile": {
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+0987654321"
  }
}
```

### Verify Customer Email

```bash
GET http://localhost:3006/api/v1/auth/verify-email/{token}
```

### Customer Login (IMMEDIATE SUCCESS ✅)

```bash
POST http://localhost:3006/api/v1/auth/login

{
  "email": "customer@gmail.com",
  "password": "TestPass123"
}
```

**Expected**: 200 OK with tokens - No admin approval needed!

---

## Test Checklist

-   [ ] Handyman registers successfully
-   [ ] Handyman verifies email
-   [ ] Handyman CANNOT login (pending approval)
-   [ ] Admin can view pending handymen
-   [ ] Admin can approve handyman
-   [ ] Handyman CAN login after approval
-   [ ] Admin can reject handyman
-   [ ] Rejected handyman CANNOT login
-   [ ] Customer can login immediately (no approval)

---

## Security Verification

### ❌ Non-Admin Cannot Approve

```bash
# Login as customer
POST /api/v1/auth/login
{
  "email": "customer@example.com",
  "password": "password"
}

# Try to approve (should fail with 403)
POST /api/v1/auth/admin/approve-handyman/{userId}
Authorization: Bearer {customer_token}
```

**Expected**: 403 Forbidden - "Insufficient permissions"

### ❌ Unauthenticated Cannot View Pending

```bash
# Try without token (should fail with 401)
GET /api/v1/auth/admin/pending-handymen
```

**Expected**: 401 Unauthorized - "No token provided"

---

## Summary

✅ **Handyman approval system is fully functional**

-   Handymen default to `'pending'` status
-   Login is blocked until admin approves
-   Only admins can approve/reject
-   Clear error messages for all states
-   Customers bypass approval (immediate login)
-   Audit trail maintained for all actions
