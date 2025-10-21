# 🚀 Development to Production Deployment Guide

## 📋 Pre-Deployment Checklist

Before pushing to production, ensure:

-   ✅ All features work correctly in development
-   ✅ All tests pass (if you have tests)
-   ✅ No linter errors
-   ✅ Database migrations are ready (if any)
-   ✅ Environment variables are documented
-   ✅ API documentation is up to date

---

## 🔄 Step-by-Step Deployment Process

### **Step 1: Ensure Development Branch is Clean**

```bash
# Switch to development branch
git checkout development

# Pull latest changes
git pull origin development

# Check status - should be clean
git status
```

---

### **Step 2: Merge Main into Development (Safety Check)**

```bash
# Make sure development has all production fixes
git checkout development
git pull origin main
git push origin development
```

This ensures development has any hotfixes that might have been applied directly to main.

---

### **Step 3: Test Everything in Development**

```bash
# Run your application
npm run dev

# Or build and run production build
npm run build
npm start
```

**Test checklist:**

-   ✅ All endpoints work
-   ✅ Authentication flows work
-   ✅ Payments work
-   ✅ 2FA works
-   ✅ Email sending works
-   ✅ No console errors

---

### **Step 4: Create Pull Request (Recommended Method)**

#### **Option A: Using GitHub Web Interface (Recommended)**

1. **Push your development branch** (if not already pushed):

    ```bash
    git checkout development
    git push origin development
    ```

2. **Go to your GitHub repository** in your browser

3. **Create Pull Request:**

    - Click "Pull Requests" tab
    - Click "New Pull Request"
    - Set **base:** `main` ← **compare:** `development`
    - Fill in PR details:

        ```
        Title: Release v1.x.x - [Brief description]

        Description:
        ## Changes
        - Updated OpenAPI documentation
        - Updated Postman collection
        - Fixed reset password endpoint (POST → PUT)
        - Added 9 new payment endpoints
        - Fixed ES Module import issue in sessionUtils

        ## Testing
        - ✅ All endpoints tested
        - ✅ Authentication flows verified
        - ✅ Payment processing works
        - ✅ 2FA tested

        ## Deployment Notes
        - No database migrations required
        - No new environment variables
        - Documentation updated
        ```

4. **Request Review** (if you have team members)

5. **Wait for approval and merge**

---

#### **Option B: Direct Merge (Use with Caution)**

⚠️ **Only use if you're the sole developer or have permission**

```bash
# Switch to main branch
git checkout main

# Pull latest main
git pull origin main

# Merge development into main
git merge development

# If there are conflicts, resolve them
# Then:
git add .
git commit -m "Merge development into main"

# Push to main (triggers production deployment)
git push origin main
```

---

### **Step 5: Verify Production Deployment**

Since you're using Vercel:

1. **Check Vercel Dashboard:**

    - Go to https://vercel.com/dashboard
    - Check deployment status
    - Wait for build to complete

2. **Test Production API:**

    ```bash
    # Test health endpoint
    curl https://kleva-server.vercel.app/health

    # Test API docs
    curl https://kleva-server.vercel.app/api-docs/json
    ```

3. **Update Postman baseUrl:**
    - Make sure your Postman collection points to production
    - Test critical endpoints in production

---

### **Step 6: Tag the Release (Optional but Recommended)**

```bash
# Create a version tag
git tag -a v1.0.0 -m "Release v1.0.0 - Complete API documentation update"

# Push the tag
git push origin v1.0.0
```

---

## 🛡️ Safety Best Practices

### **Do:**

-   ✅ Always create a Pull Request for review
-   ✅ Test thoroughly in development first
-   ✅ Keep detailed commit messages
-   ✅ Tag releases with version numbers
-   ✅ Backup database before major deployments
-   ✅ Monitor logs after deployment
-   ✅ Have a rollback plan

### **Don't:**

-   ❌ Push directly to main without review
-   ❌ Deploy on Fridays (if possible) - gives you the weekend to fix issues
-   ❌ Deploy without testing
-   ❌ Force push to main (`git push -f origin main`)
-   ❌ Skip documentation updates
-   ❌ Ignore linter warnings

---

## 🔥 Quick Command Reference

```bash
# DEVELOPMENT TO PRODUCTION WORKFLOW

# 1. Make sure you're on development with latest changes
git checkout development
git pull origin development

# 2. Create and push to main
git checkout main
git pull origin main
git merge development

# 3. Resolve conflicts if any
# (Edit files, then:)
git add .
git commit -m "Merge development into main"

# 4. Push to production
git push origin main

# 5. Tag the release
git tag -a v1.0.0 -m "Release description"
git push origin v1.0.0
```

---

## 🚨 If Something Goes Wrong

### **Rollback to Previous Version**

```bash
# Find the last working commit
git log --oneline -10

# Reset main to that commit
git checkout main
git reset --hard <commit-hash>
git push origin main --force-with-lease

# Or revert the merge
git revert -m 1 <merge-commit-hash>
git push origin main
```

### **Hotfix in Production**

```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-bug-fix

# Make your fix
# ... edit files ...

# Commit and push
git add .
git commit -m "hotfix: fix critical bug"
git push origin hotfix/critical-bug-fix

# Merge to main
git checkout main
git merge hotfix/critical-bug-fix
git push origin main

# Merge back to development
git checkout development
git merge hotfix/critical-bug-fix
git push origin development
```

---

## 📊 Recommended Workflow for Your Project

Based on your setup with Vercel, here's the recommended flow:

```
Feature Branch → Development → Main (Production)
     ↓              ↓            ↓
   Local        Staging      Vercel Deploy
   Testing      Testing      (Automatic)
```

---

## 🎯 For Your Current Changes

You have the following updates ready to deploy:

1. ✅ Updated OpenAPI documentation (9 new endpoints)
2. ✅ Updated Postman collection (complete payments section)
3. ✅ Fixed reset password endpoint (POST → PUT)
4. ✅ Fixed UUID/crypto ES Module issue
5. ✅ All JSON files validated

**You're ready to deploy!** 🚀

---

## 📝 Deployment Steps for Current Changes

```bash
# Step 1: Verify you're on development with all changes
git checkout development
git status

# Step 2: Commit any uncommitted changes
git add .
git commit -m "docs: update OpenAPI and Postman collection with new endpoints"

# Step 3: Push development branch
git push origin development

# Step 4: Merge to main
git checkout main
git pull origin main
git merge development

# Step 5: Push to production (triggers Vercel deployment)
git push origin main

# Step 6: Tag the release
git tag -a v1.1.0 -m "Release v1.1.0 - API documentation updates"
git push origin v1.1.0

# Step 7: Switch back to development for continued work
git checkout development
```

---

## 🔍 Post-Deployment Verification

After deployment, verify the following:

### **1. Health Check**

```bash
curl https://kleva-server.vercel.app/health
```

Expected: `{"status":"OK","message":"Handyman Management API is running",...}`

### **2. API Documentation**

Visit: https://kleva-server.vercel.app/api-docs

-   ✅ All 28 endpoints should be visible
-   ✅ New payment endpoints should be present
-   ✅ Reset password should show PUT method

### **3. OpenAPI Spec**

```bash
curl https://kleva-server.vercel.app/api-docs/json
```

-   ✅ Should return valid JSON
-   ✅ Should include all new endpoints

### **4. Critical Endpoints**

Test these endpoints in production:

-   ✅ `POST /api/v1/auth/register`
-   ✅ `POST /api/v1/auth/login`
-   ✅ `PUT /api/v1/auth/reset-password/{token}`
-   ✅ `GET /api/v1/payments/banks`
-   ✅ `GET /api/v1/auth/users/stats`

---

## 🌐 Environment-Specific Configuration

### **Local Development**

```
BASE_URL=http://localhost:5000
NODE_ENV=development
```

### **Production (Vercel)**

```
BASE_URL=https://kleva-server.vercel.app
NODE_ENV=production
```

Make sure all environment variables are set in Vercel dashboard:

-   Database connection strings
-   JWT secrets
-   API keys (Paystack, Resend, etc.)
-   Redis configuration

---

## 📞 Need Help?

If you encounter issues during deployment:

1. **Check Vercel Logs:**

    - Go to Vercel Dashboard
    - Click on your deployment
    - Check "Build Logs" and "Function Logs"

2. **Check GitHub Actions** (if configured):

    - Go to your GitHub repository
    - Click "Actions" tab
    - Check workflow status

3. **Rollback if necessary:**
    ```bash
    # In Vercel dashboard, click "Rollback" to previous deployment
    # Or use git to revert
    git revert HEAD
    git push origin main
    ```

---

## 🎉 Successful Deployment

Once deployed successfully, you should:

1. ✅ Update team members
2. ✅ Update any external documentation
3. ✅ Announce new features/endpoints
4. ✅ Monitor error logs for the first few hours
5. ✅ Test critical user flows
6. ✅ Update frontend applications with new endpoints

---

**Last Updated:** October 21, 2024  
**Current Version:** v1.1.0  
**Deployment Platform:** Vercel  
**Repository:** kleva-backend
