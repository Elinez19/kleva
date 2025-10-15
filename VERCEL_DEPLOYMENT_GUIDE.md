# Vercel Deployment Guide for Handyman Management API

## 🚀 Quick Deploy Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure the project:**
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Option 2: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name: handyman-api
# - Directory: ./
# - Override settings? No
```

## 🔧 Environment Variables Setup

After deployment, add these environment variables in Vercel Dashboard:

### Required Variables:
```
MONGODB_URI=mongodb+srv://***:***@cluster0.uyjx7mu.mongodb.net/kleva?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
RESEND_API_KEY=your-resend-api-key-here
PAYSTACK_SECRET_KEY=sk_test_edb8f59217fe5fObeffdeca579d3
PAYSTACK_PUBLIC_KEY=pk_test_edb8f59217fe5fObeffdeca579d3
```

### Optional Variables:
```
REDIS_URL=your-redis-url-if-available
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## 📁 Project Structure

Your project is already configured with:
- ✅ `vercel.json` - Vercel configuration
- ✅ `package.json` - Build scripts
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `.vercelignore` - Files to exclude

## 🔗 After Deployment

1. **Get your deployment URL** (e.g., `https://handyman-api-xyz.vercel.app`)
2. **Update Paystack webhook URL** to: `https://your-app.vercel.app/api/v1/payments/webhook`
3. **Update Inngest sync URL** to: `https://your-app.vercel.app/api/inngest`
4. **Test your API endpoints**

## 🧪 Test Your Deployment

```bash
# Test health endpoint
curl https://your-app.vercel.app/health

# Test registration
curl -X POST https://your-app.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","role":"customer","profile":{"firstName":"Test","lastName":"User","phone":"+1234567890","address":"123 Test St"}}'
```

## 🎯 Next Steps

1. **Deploy to Vercel**
2. **Set environment variables**
3. **Test API endpoints**
4. **Configure webhooks**
5. **Sync with Inngest**
6. **Deploy frontend**

Your API is ready for production! 🚀
