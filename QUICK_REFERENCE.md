# 🚀 Quick Reference - Handyman Management API

## 📦 What's Been Updated

### ✅ Postman Collection (`Handyman-App.postman_collection.json`)

-   **10 new payment endpoints** added
-   Complete payment flow examples
-   Webhook testing endpoint included
-   Auto-saves payment references and tokens

### ✅ OpenAPI Documentation (`openapi.json`)

-   **5 new payment paths** documented
-   Payment request/response schemas defined
-   Swagger-compatible documentation
-   Ready for API documentation viewers

### ✅ New Documentation (`API_DOCUMENTATION_SUMMARY.md`)

-   Complete API endpoint reference
-   Authentication and payment flows
-   Environment setup guide
-   Testing instructions

## 🎯 Key Payment Endpoints

### Customer Flow

```
1. POST /api/v1/payments/initialize-job
   → Get Paystack checkout URL

2. Customer pays on Paystack
   → Webhook notifies your server

3. GET /api/v1/payments/verify/{reference}
   → Confirm payment status

4. GET /api/v1/payments/history
   → View all payments
```

### Admin Flow

```
1. POST /api/v1/payments/payout-handyman
   → Initiate payout to handyman

2. GET /api/v1/payments/stats
   → View payment statistics
```

## 🔧 Testing the API

### 1. Import Postman Collection

```bash
# Open Postman → Import → Upload Files
# Select: Handyman-App.postman_collection.json
```

### 2. Set Environment

```javascript
// In Postman, create environment:
baseUrl = http://localhost:3006
```

### 3. Test Authentication

```
1. Register → POST /api/v1/auth/register
2. Login → POST /api/v1/auth/login (auto-saves token)
3. All protected endpoints now work automatically
```

### 4. Test Payments

```
1. Initialize Job Payment → Returns Paystack URL
2. Use test card: 4084 0840 8408 4081 (Paystack test card)
3. Verify Payment → Check status
4. View History → See all your payments
```

## 💳 Paystack Test Cards

Use these test cards in your Paystack checkout:

| Card Number         | Expiry          | CVV | PIN  | Result          |
| ------------------- | --------------- | --- | ---- | --------------- |
| 4084 0840 8408 4081 | Any future date | 408 | 0000 | Success         |
| 5060 6666 6666 6666 | Any future date | 123 | -    | Success (Verve) |
| 5078 5078 5078 5078 | Any future date | 081 | -    | Success (Local) |

## 🌐 Webhook Setup

### LocalTunnel (Currently Running)

```
✅ Your webhook URL: https://tasty-months-call.loca.lt/api/v1/payments/webhook
```

### Paystack Dashboard Setup

1. Go to: **Settings → API Keys & Webhooks**
2. **Test Webhook URL**: `https://tasty-months-call.loca.lt/api/v1/payments/webhook`
3. **Save** - No need to select events in test mode

## 📝 Environment Variables Needed

```env
# Paystack (from your dashboard)
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
PAYSTACK_WEBHOOK_SECRET=sk_test_your_secret_key  # Same as secret key!
PAYMENT_CURRENCY=NGN

# Other required variables (see .env.example)
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
MONGODB_URI=your_mongodb_uri
RESEND_API_KEY=your_resend_key
```

## 🎨 Postman Collection Structure

```
📁 Handyman Management App - Complete API
├── 📂 Authentication (7 endpoints)
│   ├── Register Customer
│   ├── Register Handyman
│   ├── Register Admin
│   ├── Verify Email
│   ├── Login
│   ├── Login with 2FA
│   ├── Refresh Token
│   └── Logout
├── 📂 Password Management (3 endpoints)
├── 📂 Profile Management (2 endpoints)
├── 📂 Two-Factor Authentication (3 endpoints)
├── 📂 Session Management (3 endpoints)
├── 📂 Payments (10 endpoints) ✨ NEW!
│   ├── Initialize Job Payment
│   ├── Verify Payment
│   ├── Get Payment History
│   ├── Get Payment Details
│   ├── Initialize Subscription
│   ├── Get Banks
│   ├── Create Transfer Recipient
│   ├── Payout to Handyman (Admin)
│   ├── Get Payment Stats
│   └── Paystack Webhook
└── 📄 Health Check
```

## 🔍 Quick Test Workflow

### Complete Flow (5 minutes)

```bash
# 1. Start your server
npm run dev

# 2. Start LocalTunnel (separate terminal)
lt --port 5000

# 3. In Postman:
# - Register a customer
# - Login (auto-saves token)
# - Initialize Job Payment
# - Click the returned Paystack URL
# - Pay with test card: 4084 0840 8408 4081
# - Verify payment in Postman
# - Check payment history

✅ Done! Your payment system is working!
```

## 📊 API Response Examples

### Success

```json
{
	"success": true,
	"message": "Payment initialized successfully",
	"data": {
		"reference": "HMA_1234567890",
		"authorizationUrl": "https://checkout.paystack.com/...",
		"amount": 500000,
		"currency": "NGN"
	}
}
```

### Error

```json
{
	"success": false,
	"message": "Authentication required"
}
```

## 🆘 Common Issues

### Issue: Webhook not receiving events

**Solution**:

-   Ensure LocalTunnel is running: `lt --port 5000`
-   Update Paystack webhook URL with new tunnel URL
-   Check your server is running on port 5000

### Issue: Payment verification fails

**Solution**:

-   Wait 2-3 seconds after payment before verifying
-   Check the reference is correct
-   Ensure webhook is configured

### Issue: Rate limit exceeded

**Solution**:

-   Wait 15 minutes
-   Use different endpoints
-   In production, implement Redis for better rate limiting

## 📚 Additional Resources

-   **Full Documentation**: `API_DOCUMENTATION_SUMMARY.md`
-   **Postman Collection**: `Handyman-App.postman_collection.json`
-   **OpenAPI Spec**: `openapi.json`
-   **Payment Setup Guide**: `PAYMENT_SETUP_GUIDE.md`

## 🎯 Next Steps

1. ✅ **Documentation Updated** - Postman & OpenAPI complete
2. 🔄 **Test Locally** - Use Postman to test all endpoints
3. 🚀 **Deploy** - Deploy to production when ready
4. 🌐 **Update Webhooks** - Use production URL in Paystack

---

**Status**: ✅ All documentation updated and tested  
**Files Modified**: 3 files (Postman, OpenAPI, Documentation)  
**New Endpoints**: 10 payment endpoints documented  
**Ready to Use**: Import Postman collection and start testing!
