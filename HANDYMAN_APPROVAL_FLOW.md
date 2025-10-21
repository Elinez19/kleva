# Handyman Approval Flow Documentation

## Overview

✅ **Handymen MUST be approved by an admin before they can login** - This security measure is already fully implemented in the system.

## How It Works

### 1. Handyman Registration

When a handyman registers:

```typescript
// User Model - Default approval status for handymen
approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function () {
        return this.role === 'handyman' ? 'pending' : 'approved';
    }
}
```

-   **Handymen**: Default status = `'pending'` (requires admin approval)
-   **Customers & Admins**: Default status = `'approved'` (can login immediately)

### 2. Login Validation (src/services/authServices.ts:254-261)

During login, the system checks approval status:

```typescript
// Check approval status for handymen
if (user.role === 'handyman' && user.approvalStatus !== 'approved') {
	if (user.approvalStatus === 'pending') {
		throw new Error('Your handyman account is pending admin approval');
	} else if (user.approvalStatus === 'rejected') {
		throw new Error(`Your handyman account has been rejected. Reason: ${user.rejectionReason || 'No reason provided'}`);
	}
}
```

**Login checks happen in this order:**

1. ✅ Account exists
2. ✅ Account not locked
3. ✅ Account is active
4. ✅ Password is correct
5. ✅ Email is verified
6. ✅ **Handyman is approved** ← Admin approval check
7. ✅ 2FA verification (if enabled)

### 3. Admin Approval Process

Admins can manage handyman approvals using these endpoints:

#### Get Pending Handymen

```http
GET /api/v1/auth/admin/pending-handymen
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
	"success": true,
	"message": "Pending handymen retrieved successfully",
	"data": {
		"pendingHandymen": [
			{
				"_id": "...",
				"email": "handyman@example.com",
				"role": "handyman",
				"approvalStatus": "pending",
				"profile": {
					"firstName": "John",
					"lastName": "Doe",
					"skills": ["plumbing", "electrical"],
					"experience": 10,
					"hourlyRate": 75
				},
				"createdAt": "2024-01-01T00:00:00.000Z"
			}
		],
		"count": 1
	}
}
```

#### Approve Handyman

```http
POST /api/v1/auth/admin/approve-handyman/:userId
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
	"success": true,
	"message": "Handyman approved successfully",
	"data": {
		"userId": "...",
		"email": "handyman@example.com",
		"approvalStatus": "approved",
		"approvedBy": "admin_user_id",
		"approvedAt": "2024-01-01T00:00:00.000Z"
	}
}
```

**Actions taken:**

-   Sets `approvalStatus` to `'approved'`
-   Records `approvedBy` (admin user ID)
-   Records `approvedAt` (timestamp)
-   Sends approval notification email to handyman

#### Reject Handyman

```http
POST /api/v1/auth/admin/reject-handyman/:userId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Insufficient qualifications"
}
```

**Response:**

```json
{
	"success": true,
	"message": "Handyman rejected successfully",
	"data": {
		"userId": "...",
		"email": "handyman@example.com",
		"approvalStatus": "rejected",
		"rejectionReason": "Insufficient qualifications",
		"rejectedBy": "admin_user_id",
		"rejectedAt": "2024-01-01T00:00:00.000Z"
	}
}
```

**Actions taken:**

-   Sets `approvalStatus` to `'rejected'`
-   Records `rejectionReason`
-   Records who rejected and when
-   Sends rejection notification email to handyman

## Complete User Journey

### Handyman Registration & Approval Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    HANDYMAN REGISTRATION FLOW                    │
└─────────────────────────────────────────────────────────────────┘

1. Handyman Registers
   POST /api/v1/auth/register
   {
     "email": "handyman@example.com",
     "password": "SecurePass123",
     "role": "handyman",
     "profile": { ... }
   }
   ↓
   Status: approvalStatus = "pending"
   Email: Verification email sent

2. Handyman Verifies Email
   GET /api/v1/auth/verify-email/:token
   ↓
   Status: isEmailVerified = true
   Status: approvalStatus = "pending" (unchanged)

3. Handyman Attempts Login ❌
   POST /api/v1/auth/login
   {
     "email": "handyman@example.com",
     "password": "SecurePass123"
   }
   ↓
   Response: 401 Unauthorized
   {
     "success": false,
     "message": "Your handyman account is pending admin approval"
   }

4. Admin Reviews Application
   GET /api/v1/auth/admin/pending-handymen
   Authorization: Bearer <admin_token>
   ↓
   Admin sees list of pending handymen

5. Admin Approves Handyman
   POST /api/v1/auth/admin/approve-handyman/:userId
   Authorization: Bearer <admin_token>
   ↓
   Status: approvalStatus = "approved"
   Email: Approval notification sent to handyman

6. Handyman Attempts Login ✅
   POST /api/v1/auth/login
   {
     "email": "handyman@example.com",
     "password": "SecurePass123"
   }
   ↓
   Response: 200 OK
   {
     "success": true,
     "message": "Login successful",
     "accessToken": "...",
     "refreshToken": "...",
     "user": { ... }
   }
```

### Alternative Flow: Rejection

```
5. Admin Rejects Handyman
   POST /api/v1/auth/admin/reject-handyman/:userId
   Authorization: Bearer <admin_token>
   {
     "reason": "Insufficient qualifications"
   }
   ↓
   Status: approvalStatus = "rejected"
   Email: Rejection notification sent

6. Handyman Attempts Login ❌
   POST /api/v1/auth/login
   ↓
   Response: 401 Unauthorized
   {
     "success": false,
     "message": "Your handyman account has been rejected. Reason: Insufficient qualifications"
   }
```

## Approval Status States

| Status     | Description                    | Can Login? | Next Actions                          |
| ---------- | ------------------------------ | ---------- | ------------------------------------- |
| `pending`  | Awaiting admin review          | ❌ No      | Admin must approve or reject          |
| `approved` | Admin approved, account active | ✅ Yes     | Normal login and system access        |
| `rejected` | Admin rejected application     | ❌ No      | User must contact support or re-apply |

## Database Schema

### User Model Fields

```typescript
{
  // Basic Info
  email: String,
  password: String,
  role: 'handyman' | 'customer' | 'admin',

  // Approval Fields (Handyman-specific)
  approvalStatus: 'pending' | 'approved' | 'rejected',  // Default: 'pending' for handymen
  approvedBy: ObjectId,                                  // Admin who approved/rejected
  approvedAt: Date,                                      // Timestamp of approval/rejection
  rejectionReason: String,                               // Reason if rejected

  // Other verification
  isEmailVerified: Boolean,
  isActive: Boolean
}
```

### Database Indexes

For efficient queries:

```typescript
userSchema.index({ approvalStatus: 1 }); // Query pending handymen
userSchema.index({ role: 1, approvalStatus: 1 }); // Compound index for handyman queries
```

## Security Features

### 1. Multi-Layer Validation

```typescript
// Login validation order
✅ User exists
✅ Account not locked (failed login attempts)
✅ Account is active
✅ Password correct
✅ Email verified
✅ Handyman approved ← Admin approval
✅ 2FA verified (if enabled)
```

### 2. Role-Based Approval

-   **Customers**: Auto-approved on registration
-   **Admins**: Auto-approved on registration
-   **Handymen**: Manual approval required

### 3. Admin-Only Approval Endpoints

All approval endpoints are protected with RBAC:

```typescript
// Only admins can access these
router.get('/admin/pending-handymen', authenticate, requireRole('admin'), ...);
router.post('/admin/approve-handyman/:userId', authenticate, requireRole('admin'), ...);
router.post('/admin/reject-handyman/:userId', authenticate, requireRole('admin'), ...);
```

### 4. Audit Trail

Every approval/rejection is tracked:

-   Who approved/rejected (`approvedBy`)
-   When it happened (`approvedAt`)
-   Why it was rejected (`rejectionReason`)

## Error Messages

| Scenario                   | HTTP Status | Error Message                                               |
| -------------------------- | ----------- | ----------------------------------------------------------- |
| Pending approval           | 401         | "Your handyman account is pending admin approval"           |
| Rejected application       | 401         | "Your handyman account has been rejected. Reason: [reason]" |
| Non-admin approval attempt | 403         | "Insufficient permissions"                                  |
| Already approved           | 400         | "This handyman is already approved"                         |
| Already rejected           | 400         | "This handyman is already rejected"                         |

## Testing

### Test Scenario 1: Pending Handyman Cannot Login

```bash
# 1. Register as handyman
POST /api/v1/auth/register
{
  "email": "new-handyman@example.com",
  "password": "Password123",
  "role": "handyman",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "skills": ["plumbing"]
  }
}

# 2. Verify email
GET /api/v1/auth/verify-email/:token

# 3. Try to login (should fail)
POST /api/v1/auth/login
{
  "email": "new-handyman@example.com",
  "password": "Password123"
}

# Expected: 401 Unauthorized
# "Your handyman account is pending admin approval"
```

### Test Scenario 2: Approved Handyman Can Login

```bash
# 1. Admin approves handyman
POST /api/v1/auth/admin/approve-handyman/:userId
Authorization: Bearer <admin_token>

# 2. Handyman logs in (should succeed)
POST /api/v1/auth/login
{
  "email": "new-handyman@example.com",
  "password": "Password123"
}

# Expected: 200 OK with tokens
```

### Test Scenario 3: Customer Can Login Immediately

```bash
# 1. Register as customer
POST /api/v1/auth/register
{
  "email": "customer@example.com",
  "password": "Password123",
  "role": "customer",
  "profile": { ... }
}

# 2. Verify email
GET /api/v1/auth/verify-email/:token

# 3. Login immediately (should succeed)
POST /api/v1/auth/login

# Expected: 200 OK with tokens (no admin approval needed)
```

## Summary

✅ **Handyman approval system is fully implemented and working**

-   Handymen default to `'pending'` status on registration
-   Login is blocked until admin approves
-   Clear error messages for pending/rejected states
-   Admin-only approval endpoints protected with RBAC
-   Audit trail for all approvals/rejections
-   Email notifications sent on approval/rejection
-   Customers and admins can login immediately

The system ensures that only vetted, admin-approved handymen can access the platform.
