# Payment Integration Setup Guide - Paystack for Nigeria

## 🇳🇬 Perfect for Nigeria!

This payment integration uses **Paystack**, which is the most popular payment processor in Nigeria. It supports:

-   ✅ **Nigerian Naira (NGN)** - Primary currency
-   ✅ **Bank transfers** - Direct bank transfers
-   ✅ **Card payments** - Visa, Mastercard, Verve
-   ✅ **USSD payments** - Mobile money
-   ✅ **QR codes** - For mobile payments

## 🚀 Quick Setup (5 Minutes)

### 1. **Get Paystack Account**

1. Go to [https://paystack.com](https://paystack.com)
2. Sign up for a free account
3. Complete your business verification
4. Get your API keys from the dashboard

### 2. **Get Your API Keys**

From your Paystack dashboard:

-   **Secret Key** (starts with `sk_test_` for test mode)
-   **Public Key** (starts with `pk_test_` for test mode)
-   **Webhook Secret** (for webhook verification)

### 3. **Update Your `.env`**

Add these lines to your `.env` file:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here
PAYMENT_CURRENCY=NGN
```

### 4. **Test Mode vs Live Mode**

**For Development (Test Mode):**

-   Use test keys (start with `sk_test_` and `pk_test_`)
-   No real money is charged
-   Perfect for testing

**For Production (Live Mode):**

-   Use live keys (start with `sk_live_` and `pk_live_`)
-   Real money transactions
-   Requires business verification

## 📋 Payment Endpoints

### **Initialize Job Payment**

```http
POST /api/v1/payments/initialize-job
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "jobId": "job_123",
  "amount": 5000,
  "description": "Fix leaking pipe",
  "metadata": {
    "urgency": "high",
    "location": "Lagos"
  }
}
```

**Response:**

```json
{
	"success": true,
	"message": "Payment initialized successfully",
	"data": {
		"id": "payment_123",
		"reference": "HMA_1234567890_ABC123",
		"accessCode": "access_code_123",
		"authorizationUrl": "https://checkout.paystack.com/access_code_123",
		"amount": 5000,
		"currency": "NGN",
		"status": "pending"
	}
}
```

### **Verify Payment**

```http
GET /api/v1/payments/verify/HMA_1234567890_ABC123
```

**Response:**

```json
{
	"success": true,
	"message": "Payment verified successfully",
	"data": {
		"id": "payment_123",
		"reference": "HMA_1234567890_ABC123",
		"amount": 5000,
		"currency": "NGN",
		"status": "success",
		"paidAt": "2024-01-15T10:30:00Z",
		"gatewayResponse": "Successful"
	}
}
```

### **Get Payment History**

```http
GET /api/v1/payments/history?limit=10
Authorization: Bearer <access_token>
```

### **Get Banks List**

```http
GET /api/v1/payments/banks
```

## 💰 Payment Flow

### **1. Customer Flow**

1. **Post Job** → Customer creates a job
2. **Initialize Payment** → Customer pays for job posting
3. **Paystack Checkout** → Customer completes payment
4. **Payment Verified** → System verifies payment
5. **Job Posted** → Job becomes active for handymen

### **2. Handyman Flow**

1. **Complete Job** → Handyman finishes the work
2. **Payment Processing** → System calculates payout
3. **Transfer to Handyman** → Money sent to handyman's account
4. **Payout Notification** → Handyman receives confirmation

## 🔧 Integration Examples

### **Frontend Integration (React)**

```javascript
// Initialize payment
const initializePayment = async (jobData) => {
	const response = await fetch('/api/v1/payments/initialize-job', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			jobId: jobData.id,
			amount: jobData.budget * 100, // Convert to kobo
			description: jobData.title
		})
	});

	const result = await response.json();

	if (result.success) {
		// Redirect to Paystack checkout
		window.location.href = result.data.authorizationUrl;
	}
};

// Verify payment (after redirect)
const verifyPayment = async (reference) => {
	const response = await fetch(`/api/v1/payments/verify/${reference}`);
	const result = await response.json();

	if (result.success) {
		// Payment successful, redirect to success page
		window.location.href = '/payment/success';
	}
};
```

### **Webhook Handling**

```javascript
// Paystack webhook endpoint
app.post('/api/v1/payments/webhook', (req, res) => {
	const signature = req.headers['x-paystack-signature'];
	const payload = JSON.stringify(req.body);

	// Verify webhook signature
	const isValid = PaymentUtils.validateWebhookSignature(payload, signature);

	if (isValid) {
		// Process webhook
		PaymentService.processWebhook(req.body);
		res.status(200).json({ success: true });
	} else {
		res.status(400).json({ success: false });
	}
});
```

## 🎯 Test Scenarios

### **Test Card Numbers (Paystack Test Mode)**

-   **Successful Payment:** `4084084084084081`
-   **Failed Payment:** `4084084084084085`
-   **Insufficient Funds:** `4084084084084086`
-   **Expired Card:** `4084084084084087`

### **Test Bank Account**

-   **Bank Code:** `044` (Access Bank)
-   **Account Number:** `0690000032`
-   **Account Name:** `Test Account`

## 📊 Payment Analytics

The system automatically tracks:

-   **Daily payment metrics**
-   **Success/failure rates**
-   **Revenue analytics**
-   **Platform fees**
-   **Handyman payouts**

## 🔒 Security Features

-   ✅ **Webhook signature verification**
-   ✅ **Payment reference validation**
-   ✅ **Amount verification**
-   ✅ **User authentication**
-   ✅ **Rate limiting**
-   ✅ **Encrypted data storage**

## 🚨 Error Handling

### **Common Errors**

-   **Invalid API Key:** Check your Paystack keys
-   **Insufficient Funds:** Customer needs to add money
-   **Network Issues:** Retry payment
-   **Invalid Reference:** Payment reference not found

### **Error Responses**

```json
{
	"success": false,
	"message": "Payment initialization failed",
	"error": "Invalid API key"
}
```

## 📱 Mobile Integration

### **React Native**

```javascript
import { Linking } from 'react-native';

const openPaystackCheckout = (authorizationUrl) => {
	Linking.openURL(authorizationUrl);
};
```

### **Flutter**

```dart
import 'package:url_launcher/url_launcher.dart';

void openPaystackCheckout(String authorizationUrl) async {
  if (await canLaunch(authorizationUrl)) {
    await launch(authorizationUrl);
  }
}
```

## 🌍 Multi-Currency Support

While optimized for Nigeria (NGN), the system also supports:

-   **USD** - US Dollar
-   **EUR** - Euro
-   **GBP** - British Pound

## 📈 Production Checklist

### **Before Going Live:**

-   [ ] Switch to live Paystack keys
-   [ ] Complete business verification
-   [ ] Set up webhook endpoints
-   [ ] Test all payment flows
-   [ ] Configure SSL certificates
-   [ ] Set up monitoring
-   [ ] Create backup procedures

### **Webhook Configuration:**

-   **URL:** `https://yourdomain.com/api/v1/payments/webhook`
-   **Events:** `charge.success`, `charge.failed`
-   **Secret:** Use the webhook secret from Paystack

## 🎉 You're Ready!

Your Handyman Management App now has:

-   ✅ **Full payment processing** with Paystack
-   ✅ **Nigerian payment methods** support
-   ✅ **Automatic workflows** via Inngest
-   ✅ **Email notifications** for all payment events
-   ✅ **Analytics and reporting**
-   ✅ **Security and error handling**

**Start testing with the test card numbers and watch payments flow through your system!** 🚀

## 📞 Support

-   **Paystack Support:** [https://paystack.com/support](https://paystack.com/support)
-   **Documentation:** [https://paystack.com/docs](https://paystack.com/docs)
-   **API Reference:** [https://paystack.com/docs/api](https://paystack.com/docs/api)
