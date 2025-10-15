# Quick Inngest Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. **Sign up for Inngest**

-   Go to [https://inngest.com](https://inngest.com)
-   Create a free account
-   Create a new app called "Handyman App"

### 2. **Get Your Keys**

From your Inngest dashboard:

-   Copy your **Event Key** (starts with `re_`)
-   Copy your **Signing Key** (starts with `signkey_`)

### 3. **Update Your `.env`**

Add these lines to your `.env` file:

```env
# Inngest Configuration
INNGEST_EVENT_KEY=re_your_event_key_here
INNGEST_SIGNING_KEY=signkey_your_signing_key_here
INNGEST_APP_ID=handyman-app
```

### 4. **Restart Your Server**

```bash
npm run dev
```

### 5. **Test It Out**

1. **Register a new user** using Postman
2. **Check your email** - verification email should arrive
3. **Check Inngest dashboard** - you'll see workflows running!

## 🎯 What You Get

### **Immediate Benefits**

✅ **Faster API responses** - No more waiting for emails to send  
✅ **Reliable email delivery** - Automatic retries if emails fail  
✅ **Better user experience** - Non-blocking registration/login

### **Automatic Workflows**

🔄 **User Onboarding** - Welcome series over 3 days  
🔄 **Email Verification** - Reliable verification emails  
🔄 **Password Reset** - Secure reset emails  
🔄 **Account Security** - Lock notifications  
🔄 **System Cleanup** - Daily token cleanup  
🔄 **Analytics** - Daily/weekly/monthly reports

### **Monitoring**

📊 **Inngest Dashboard** - See all workflows running  
📊 **Step-by-step logs** - Debug any issues  
📊 **Retry tracking** - Monitor failed jobs  
📊 **Performance metrics** - Track workflow performance

## 🧪 Test the Integration

### **Test Email Workflows**

1. Register a user → Check email verification
2. Request password reset → Check reset email
3. Enable 2FA → Check confirmation email

### **Test Onboarding Flow**

1. Register a user
2. Wait 24 hours → Check for profile completion reminder
3. Wait 3 days → Check for role-specific tips

### **Test System Workflows**

-   Check Inngest dashboard for daily cleanup jobs
-   Monitor system health checks (every 15 minutes)
-   Review weekly maintenance reports

## 🔧 Troubleshooting

### **If workflows don't trigger:**

1. Check your `.env` file has correct Inngest keys
2. Verify server is running: `npm run dev`
3. Check Inngest dashboard for errors

### **If emails don't send:**

1. Verify Resend API key in `.env`
2. Check Inngest dashboard for failed jobs
3. Review email templates

### **If you see errors:**

1. Check server logs for detailed error messages
2. Review Inngest dashboard for workflow failures
3. Verify all environment variables are set

## 📈 Next Steps

### **Production Ready**

-   All workflows include retry logic
-   Error handling is built-in
-   Monitoring is automatic

### **Scale Up**

-   Inngest handles scaling automatically
-   No worker processes to manage
-   Built-in queue management

### **Add More Workflows**

-   Payment processing
-   SMS notifications
-   Third-party integrations
-   Custom business logic

## 🎉 You're All Set!

Your Handyman Management App now has:

-   **Reliable background job processing**
-   **Automated email workflows**
-   **User onboarding automation**
-   **System maintenance automation**
-   **Comprehensive monitoring**

**Start testing with Postman and watch the magic happen in your Inngest dashboard!** 🚀
