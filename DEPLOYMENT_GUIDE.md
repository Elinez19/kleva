# 🚀 Handyman Management API - Fresh Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Code Status
- [x] All code committed to GitHub
- [x] API endpoint working locally
- [x] Inngest integration implemented
- [x] Environment variables documented

### 🔧 Required Environment Variables
Make sure to add these to your new Vercel project:

```
# Database
MONGODB_URI=mongodb+srv://***:***@cluster0.uyjx7mu.mongodb.net/kleva?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email Configuration
RESEND_API_KEY=your-resend-api-key-here
FRONTEND_URL=http://localhost:3000

# Payment Configuration
PAYSTACK_SECRET_KEY=sk_test_edb8f59217fe5fObeffdeca579d3
PAYSTACK_PUBLIC_KEY=pk_test_edb8f59217fe5fObeffdeca579d3
PAYSTACK_WEBHOOK_SECRET=sk_test_edb8f59217fe5fObeffdeca579d3
PAYMENT_CURRENCY=NGN

# Inngest Configuration
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
INNGEST_APP_ID=handyman-app

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🚀 Deployment Steps

### 1. Create New Vercel Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import from GitHub: `Elinez19/kleva`
4. Select the `kleva-backend` folder

### 2. Configure Build Settings
- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Add Environment Variables
Add all the variables listed above in the **Environment Variables** section.

### 4. Deploy
Click **"Deploy"** and wait for the build to complete.

## 🧪 Post-Deployment Testing

### Test Health Endpoint
```bash
curl https://your-new-project.vercel.app/health
```

### Test Inngest Health
```bash
curl https://your-new-project.vercel.app/api/inngest
```

### Test Inngest Sync
```bash
curl -X PUT https://your-new-project.vercel.app/api/inngest
```

### Test API Documentation
Visit: `https://your-new-project.vercel.app/api-docs`

## 🔗 Update Inngest Integration

1. Go to [Inngest Dashboard](https://app.inngest.com)
2. Update your integration URL to: `https://your-new-project.vercel.app/api/inngest`
3. Run the sync command:
   ```bash
   curl -X PUT https://your-new-project.vercel.app/api/inngest
   ```

## 📊 Expected Results

After successful deployment:
- ✅ Health endpoint returns `{"status": "OK"}`
- ✅ Inngest health shows `"configured": true`
- ✅ Inngest sync returns function definitions
- ✅ API documentation loads properly
- ✅ All environment variables are detected

## 🆘 Troubleshooting

### If Environment Variables Don't Work
1. Check spelling and case sensitivity
2. Ensure no extra spaces around `=`
3. Redeploy after adding variables

### If Inngest Sync Fails
1. Verify signing key matches exactly
2. Check URL is correct
3. Wait 2-3 minutes for deployment to propagate

### If API Doesn't Respond
1. Check Vercel function logs
2. Verify build completed successfully
3. Check for any TypeScript errors

## 🎉 Success Indicators

- All endpoints respond correctly
- Inngest dashboard shows successful sync
- Functions are detected and available
- No error logs in Vercel dashboard
