# Database Seed Data Reference

## Quick Commands

```bash
# Seed database (adds test users)
npm run seed

# Clear and re-seed (fresh start)
npm run seed:clear
```

## 📊 What Gets Seeded

-   **2 Admin accounts** (operations & testing)
-   **3 Handyman accounts** (different specialties)
-   **2 Customer accounts** (different preferences)
-   **Total: 7 users** - All email verified and ready to use!

## 🔐 Test Credentials

### 👤 ADMIN ACCOUNTS

| Email                | Password    | Department |
| -------------------- | ----------- | ---------- |
| `admin@handyman.com` | `Admin123!` | Operations |
| `test@admin.com`     | `Test123!`  | Testing    |

### 🔧 HANDYMAN ACCOUNTS

| Email                        | Password      | Specialty   | Rate/hr | Experience |
| ---------------------------- | ------------- | ----------- | ------- | ---------- |
| `mike.plumber@handyman.com`  | `Handyman123` | Plumber     | $85     | 12 years   |
| `john.electric@handyman.com` | `Handyman123` | Electrician | $95     | 15 years   |
| `bob.handyman@handyman.com`  | `Handyman123` | General     | $65     | 8 years    |

**Skills Overview:**

-   **Mike (Plumber):** plumbing, pipe repair, drain cleaning
-   **John (Electrician):** electrical, wiring, lighting, panel upgrades
-   **Bob (General):** carpentry, drywall, painting, furniture assembly

### 👥 CUSTOMER ACCOUNTS

| Email                      | Password      | Contact Preference |
| -------------------------- | ------------- | ------------------ |
| `sarah.customer@gmail.com` | `Customer123` | Email              |
| `david.home@gmail.com`     | `Customer123` | Phone              |

## ✨ Features

### Pre-configured Settings

-   ✅ **Email Verified:** All accounts ready to login immediately
-   ✅ **Active Status:** No waiting for activation
-   ✅ **No 2FA:** Easier testing (can enable via API)
-   ✅ **Realistic Data:** Complete profiles with all fields

### Handyman Profiles Include

-   Skills and specialties
-   Hourly rates
-   Years of experience
-   Availability schedules
-   Professional bios
-   Certifications/licenses
-   Contact info & addresses

### Customer Profiles Include

-   Full name and contact info
-   Address
-   Preferred contact method

## 🚀 Usage Examples

### Quick Start

```bash
# 1. Seed the database
npm run seed:clear

# 2. Start server
npm run dev

# 3. Login as admin
POST /api/v1/auth/login
{
  "email": "admin@handyman.com",
  "password": "Admin123!"
}
```

### Test Different Roles

**As Admin:**

```bash
# Login as admin
Email: admin@handyman.com
Pass:  Admin123!

# Use for: Managing users, viewing all data
```

**As Handyman:**

```bash
# Login as plumber
Email: mike.plumber@handyman.com
Pass:  Handyman123

# Use for: Managing services, accepting jobs
```

**As Customer:**

```bash
# Login as customer
Email: sarah.customer@gmail.com
Pass:  Customer123

# Use for: Browsing handymen, booking services
```

## 🔄 Resetting Database

### Clear All Data

```bash
npm run seed:clear
```

This will:

1. Delete all users
2. Delete all refresh tokens
3. Delete all sessions
4. Re-seed with fresh test data

### Add More Users (Keep Existing)

```bash
npm run seed
```

This will:

-   Keep existing users
-   Add seed users (may cause duplicates)

**Note:** Use `seed:clear` for clean slate!

## 📝 Adding Your Own Seed Data

Edit `src/database/seed.ts` and add to `userData` array:

```typescript
{
  email: 'newuser@example.com',
  password: 'Password123',
  role: 'handyman', // or 'customer' or 'admin'
  isEmailVerified: true,
  isActive: true,
  profile: {
    firstName: 'New',
    lastName: 'User',
    // ... role-specific fields
  }
}
```

Then run: `npm run seed:clear`

## 🎯 Testing Workflows

### Workflow 1: Admin Management

1. Seed database
2. Login as `admin@handyman.com`
3. View all users (when endpoint is created)
4. Manage platform settings

### Workflow 2: Handyman Services

1. Seed database
2. Login as `mike.plumber@handyman.com`
3. View profile (shows skills, rate, etc.)
4. Update availability
5. Accept bookings (when feature is added)

### Workflow 3: Customer Booking

1. Seed database
2. Login as `sarah.customer@gmail.com`
3. Browse handymen (when endpoint is created)
4. Create booking
5. Manage orders

### Workflow 4: Mixed Testing

1. Seed database
2. Create additional users via Postman
3. Test interactions between seeded and new users
4. Reset when needed: `npm run seed:clear`

## 💡 Pro Tips

### Tip 1: Save Credentials

Keep a copy of these credentials in your notes for quick reference!

### Tip 2: Use Different Browsers

Test multi-user scenarios:

-   Chrome: Login as admin
-   Firefox: Login as handyman
-   Safari: Login as customer

### Tip 3: Fresh Start Anytime

```bash
npm run seed:clear && npm run dev
```

Resets database and starts server in one command!

### Tip 4: Combine with Postman

1. Use seeded users for quick login
2. Create custom test scenarios via Postman
3. Reset to seeded state when needed

### Tip 5: Production Note

**⚠️ Never run seed in production!** This is for development/testing only.

## 🔍 Verification

After seeding, you should see output like:

```
✅ Successfully inserted 7 users

📊 User Summary:
   Admins     : 2
   Handymen   : 3
   Customers  : 2
   TOTAL      : 7

✅ All accounts are EMAIL VERIFIED and ready to use!
✅ No 2FA enabled (for easier testing)
```

## 📚 Related Documentation

-   **[README.md](./README.md)** - Project overview
-   **[AUTH_README.md](./AUTH_README.md)** - Auth API documentation
-   **[POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)** - Postman testing guide

---

**Happy Testing! 🎉**
