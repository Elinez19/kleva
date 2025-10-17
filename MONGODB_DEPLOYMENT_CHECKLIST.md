# ✅ MongoDB Deployment Checklist

## 🎯 You're Now Using the Full TypeScript Version!

Your API is now using `api/index.ts` which connects to MongoDB for data persistence.

---

## 📋 Vercel Environment Variables Checklist

Make sure these are set in your Vercel project settings:

### **Required Variables** (Must Have)

- [x] **MONGODB_URI**
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/handyman?retryWrites=true&w=majority`
  - Get from: MongoDB Atlas → Database → Connect → Connect your application
  - ⚠️ **CRITICAL**: Without this, your API will fail to start

- [x] **JWT_SECRET**
  - Example: `your-super-secret-jwt-key-change-in-production`
  - Used for: Access token signing
  - Generate: `openssl rand -base64 32` or any random string

- [x] **JWT_REFRESH_SECRET**
  - Example: `your-super-secret-refresh-key-change-in-production`
  - Used for: Refresh token signing
  - Generate: `openssl rand -base64 32` or any random string

- [x] **RESEND_API_KEY**
  - Example: `re_...`
  - Get from: https://resend.com/api-keys
  - Used for: Sending emails

### **Optional Variables** (Recommended)

- [ ] **REDIS_URL** (Recommended for production)
  - Example: `redis://default:password@redis-host:6379`
  - Used for: Distributed rate limiting and session storage
  - Get from: Upstash Redis, Redis Cloud, or any Redis provider
  - Note: Falls back to in-memory if not provided

- [ ] **FRONTEND_URL**
  - Example: `https://your-frontend.vercel.app`
  - Default: `http://localhost:3000`
  - Used for: CORS and email link generation

- [ ] **JWT_ACCESS_EXPIRY**
  - Default: `15m`
  - Options: `5m`, `15m`, `30m`, `1h`

- [ ] **JWT_REFRESH_EXPIRY**
  - Default: `7d`
  - Options: `1d`, `7d`, `30d`

### **Payment Variables** (If using Paystack)

- [ ] **PAYSTACK_SECRET_KEY**
  - Get from: https://dashboard.paystack.com/#/settings/developer
  
- [ ] **PAYSTACK_PUBLIC_KEY**
  - Get from: https://dashboard.paystack.com/#/settings/developer
  
- [ ] **PAYSTACK_WEBHOOK_SECRET**
  - Get from: Paystack Dashboard → Settings → Webhooks

### **Inngest Variables** (If using Inngest)

- [ ] **INNGEST_EVENT_KEY**
  - Get from: Inngest Dashboard
  
- [ ] **INNGEST_SIGNING_KEY**
  - Get from: Inngest Dashboard
  
- [ ] **INNGEST_APP_ID**
  - Default: `handyman-app`

---

## 🚀 Deployment Steps

### 1. **Check Vercel Dashboard**
```
1. Go to https://vercel.com/dashboard
2. Select your project (kleva-server)
3. Go to Settings → Environment Variables
4. Verify all required variables are set
```

### 2. **Wait for Deployment**
```
Current deployment in progress...
Check: https://vercel.com/[your-username]/kleva-server/deployments
```

### 3. **Test Health Endpoint**
```powershell
# After deployment completes (2-3 minutes)
curl https://kleva-server.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Handyman Management API is running",
  "timestamp": "2024-10-17T...",
  "version": "1.0.0"
}
```

### 4. **Test Database Connection**
```powershell
# Register a test user
$registerBody = @{
    email = "test@example.com"
    password = "Test123!"
    role = "customer"
    profile = @{
        firstName = "Test"
        lastName = "User"
        phone = "+1234567890"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/register" -Method POST -Body $registerBody -ContentType "application/json" | ConvertTo-Json
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "67..."
}
```

### 5. **Check User Stats**
```powershell
# Verify data is being saved to MongoDB
Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/users/stats" -Method GET | ConvertTo-Json
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1,
    "verifiedUsers": 0,
    "unverifiedUsers": 1,
    "usersByRole": {
      "customer": 1,
      "handyman": 0,
      "admin": 0
    }
  }
}
```

---

## 🐛 Troubleshooting

### Error: "FUNCTION_INVOCATION_FAILED"
**Cause**: Missing `MONGODB_URI` in Vercel environment variables

**Solution**:
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add `MONGODB_URI` with your MongoDB connection string
3. Redeploy the project

### Error: "Cannot connect to MongoDB"
**Cause**: Invalid MongoDB connection string or network access

**Solution**:
1. Check MongoDB Atlas → Network Access
2. Make sure `0.0.0.0/0` (Allow access from anywhere) is added
3. Verify connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

### Error: "MongoServerError: bad auth"
**Cause**: Incorrect username or password in MongoDB URI

**Solution**:
1. Go to MongoDB Atlas → Database Access
2. Verify username and password
3. Update `MONGODB_URI` in Vercel
4. Redeploy

### Error: "Email not sending"
**Cause**: Missing or invalid `RESEND_API_KEY`

**Solution**:
1. Go to https://resend.com/api-keys
2. Copy your API key
3. Add to Vercel environment variables
4. Redeploy

---

## 📊 What Changed?

### **Before (api/handyman.js)**
```javascript
// In-memory storage
const userStore = new Map();
const tokenStore = new Map();

// Data lost on restart ❌
```

### **After (api/index.ts)**
```typescript
// MongoDB storage
import UserModel from '../src/models/user.model';
await connectDb(); // Persistent database ✅

// Data persists forever ✅
// Can scale to multiple instances ✅
```

---

## ✅ Features Now Available

With MongoDB connected, you now have:

- ✅ **Persistent User Data**: Users don't disappear on restart
- ✅ **Session Management**: Track logins across devices
- ✅ **2FA Storage**: Backup codes and secrets saved
- ✅ **Payment History**: Transaction records persist
- ✅ **Job Management**: Post and track jobs
- ✅ **Advanced Queries**: Search, filter, and aggregate data
- ✅ **Scalability**: Multiple Vercel instances share same database

---

## 🎯 Next Steps

1. **Test Registration** → Create a user
2. **Check Email** → Verify email functionality
3. **Test Login** → Get access token
4. **Try Protected Endpoints** → Use authentication
5. **Monitor Logs** → Check Vercel logs for any errors
6. **Set up Redis** (Optional) → For better performance
7. **Run Seed Scripts** (Optional) → Populate test data

---

## 🔗 Quick Commands

### Add Environment Variable in Vercel
```bash
# Via Vercel CLI
vercel env add MONGODB_URI

# Or via Dashboard:
# https://vercel.com/[username]/kleva-server/settings/environment-variables
```

### Test Complete Flow
```powershell
# 1. Register
$register = @{email="test@test.com"; password="Test123!"; role="customer"; profile=@{firstName="Test"; lastName="User"; phone="+1234567890"}} | ConvertTo-Json
$result = Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/register" -Method POST -Body $register -ContentType "application/json"

# 2. Check if saved (should show 1 user)
Invoke-RestMethod -Uri "https://kleva-server.vercel.app/api/v1/auth/users/stats" -Method GET
```

---

## 📚 Documentation

- **API Docs**: https://kleva-server.vercel.app/api-docs
- **Testing Guide**: `TESTING_GUIDE.md`
- **Refactoring Summary**: `REFACTORING_SUMMARY.md`
- **MongoDB Atlas**: https://cloud.mongodb.com

---

**🎉 Congratulations! You're now running the full production-ready TypeScript version with MongoDB! 🚀**

---

*Last Updated: October 17, 2024*

