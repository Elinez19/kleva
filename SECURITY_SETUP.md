# 🔐 Security Setup Guide

## ⚠️ **CRITICAL: Secret Leak Fix**

GitGuardian detected exposed passwords in the repository. This has been fixed by removing hardcoded credentials from all files.

## 🛡️ **Environment Variables Setup**

### **Required Environment Variables**

Create a `.env` file in your project root with the following variables:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets (Generate strong random strings)
JWT_SECRET=your_super_strong_jwt_secret_key_here
JWT_REFRESH_SECRET=your_super_strong_refresh_secret_key_here

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key_here

# Redis (Optional)
REDIS_URL=your_redis_connection_string

# Payment (Paystack)
PAYSTACK_SECRET_KEY=sk_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_your_paystack_public_key
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret

# Inngest (Optional)
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
INNGEST_APP_ID=handyman-app

# Frontend
FRONTEND_URL=http://localhost:3000

# Server
NODE_ENV=production
PORT=3006
```

### **Postman Environment Variables**

To use the Postman collection securely:

1. **Import the collection and environment**
2. **Set the password variables manually** in Postman:

    - `adminPassword`: Set to your admin password
    - `customerPassword`: Set to your test customer password
    - `handymanPassword`: Set to your test handyman password
    - `approvedHandymanPassword`: Set to your approved handyman password

3. **Never commit passwords to version control**

## 🧪 **Test User Credentials**

The seed data creates these test users (passwords must be set in Postman environment):

### **Admin User**

-   **Email**: `admin@handyman.com`
-   **Password**: Set in `{{adminPassword}}` variable
-   **Role**: Admin (auto-approved)

### **Customer User**

-   **Email**: `customer@handyman.com`
-   **Password**: Set in `{{customerPassword}}` variable
-   **Role**: Customer (auto-approved)

### **Handyman (Pending Approval)**

-   **Email**: `handyman@handyman.com`
-   **Password**: Set in `{{handymanPassword}}` variable
-   **Role**: Handyman (requires admin approval)

### **Approved Handyman**

-   **Email**: `approved@handyman.com`
-   **Password**: Set in `{{approvedHandymanPassword}}` variable
-   **Role**: Handyman (pre-approved)

### **Additional Test Users**

-   `customer2fa@handyman.com` - Customer with 2FA enabled
-   `locked@handyman.com` - Locked account (for testing)
-   `unverified@handyman.com` - Unverified email (for testing)
-   `rejected@handyman.com` - Rejected handyman (for testing)

## 🔒 **Security Best Practices**

### **1. Never Commit Secrets**

-   ✅ Use `.env` files for local development
-   ✅ Use environment variables in production
-   ✅ Add `.env*` to `.gitignore`
-   ❌ Never hardcode passwords in source code

### **2. Strong Password Requirements**

-   Minimum 8 characters
-   At least 1 uppercase letter
-   At least 1 lowercase letter
-   At least 1 number
-   At least 1 special character

### **3. JWT Secret Generation**

Generate strong JWT secrets using:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64
```

### **4. Production Deployment**

-   Set environment variables in Vercel dashboard
-   Use strong, unique secrets for each environment
-   Rotate secrets regularly
-   Monitor for secret leaks with tools like GitGuardian

## 🚀 **Quick Start**

1. **Clone repository**
2. **Create `.env` file** with required variables
3. **Run seed script**: `npm run seed`
4. **Import Postman collection and environment**
5. **Set password variables in Postman**
6. **Start testing authentication flows**

## 📞 **Support**

If you encounter any security issues:

1. Immediately rotate all exposed secrets
2. Check GitGuardian dashboard for detailed leak information
3. Update all affected services
4. Review access logs for suspicious activity

---

**Remember**: Security is everyone's responsibility. When in doubt, ask for help!
