# Super Admin User - Quick Checklist

## User Details
- **Email**: duncanmarshel@gmail.com
- **Password**: Marshel@1992
- **Role**: super_admin
- **Access Level**: Full system control

---

## Setup Checklist

### ✅ Phase 1: Supabase Authentication Setup
- [ ] Go to https://app.supabase.com
- [ ] Select your project: REALTORS-LEASERS
- [ ] Navigate to: **Authentication > Users**
- [ ] Click: **"Add user"**
- [ ] Enter email: `duncanmarshel@gmail.com`
- [ ] Enter password: `Marshel@1992`
- [ ] **✓ Check "Auto confirm email"**
- [ ] Click: **"Create user"**
- [ ] **COPY the User ID (UUID)** - You'll need this next!

### ✅ Phase 2: Database Profile Setup

#### Option A: Using SQL Editor (Recommended)
- [ ] Open `CREATE_SUPER_ADMIN_USER.sql`
- [ ] Find: `id = '{USER_ID}'`
- [ ] Replace `{USER_ID}` with your UUID from Phase 1
- [ ] Go to Supabase: **SQL Editor > New Query**
- [ ] Copy entire SQL script and paste
- [ ] Click: **"Run"**
- [ ] Verify output shows the profile was created

#### Option B: Using Batch Script (Windows)
- [ ] Run: `setup-super-admin-windows.bat`
- [ ] Follow the on-screen prompts
- [ ] Enter your User ID when prompted

### ✅ Phase 3: Verification & Testing
- [ ] Open terminal in project folder
- [ ] Run: `npm run dev`
- [ ] Wait for app to start (usually http://localhost:5173)
- [ ] Go to login page
- [ ] Enter email: `duncanmarshel@gmail.com`
- [ ] Enter password: `Marshel@1992`
- [ ] Click login
- [ ] **Verify you're redirected to**: `/portal/super-admin/dashboard`

### ✅ Phase 4: Verify Admin Access
Once logged in, verify you can access:
- [ ] **Dashboard** - Shows system metrics
- [ ] **Properties Management** - Can view all properties
- [ ] **User Management** - Can manage all users
- [ ] **Approval Queue** - Can review requests
- [ ] **Analytics** - Can view reports
- [ ] **System Settings** - Can configure settings
- [ ] **Leases Management** - Can manage leases
- [ ] **Payments Management** - Can view payments
- [ ] **Manager Portal** - Can manage managers
- [ ] **Profile Management** - Can manage profiles
- [ ] **Refund Status** - Can track refunds

---

## Troubleshooting

### Problem: "Login failed" or "User not found"
**Solution**: 
- Make sure you completed Phase 2 (created the profile in database)
- Check that the User ID was correct
- Verify the email in the profiles table matches: `duncanmarshel@gmail.com`

### Problem: "Access denied" on admin dashboard
**Solution**:
- Run this query in Supabase SQL Editor:
  ```sql
  SELECT id, email, role, status FROM public.profiles 
  WHERE email = 'duncanmarshel@gmail.com';
  ```
- Check that `role` = `super_admin`
- If not, update it manually

### Problem: "Redirects to home page instead of admin dashboard"
**Solution**:
- The role might not be set correctly to `super_admin`
- Run verification query from Troubleshooting above
- Check browser console (F12) for errors

### Problem: SQL script fails to run
**Solution**:
- Make sure `{USER_ID}` was replaced with actual UUID
- UUIDs look like: `5f8d9e2c-4a1b-47e5-8f3c-2d1a9b5c4e3f`
- Copy from Supabase auth, not from a different source

---

## SQL Verification Queries

Run these in Supabase SQL Editor to verify setup:

**Check if profile exists:**
```sql
SELECT id, email, role, status, is_active 
FROM public.profiles 
WHERE email = 'duncanmarshel@gmail.com';
```

**Show all super admin users:**
```sql
SELECT id, email, role, status 
FROM public.profiles 
WHERE role = 'super_admin';
```

**Update role to super_admin (if needed):**
```sql
UPDATE public.profiles 
SET role = 'super_admin', user_type = 'super_admin' 
WHERE email = 'duncanmarshel@gmail.com';
```

---

## Important Files

- `CREATE_SUPER_ADMIN_USER.sql` - SQL script to create profile
- `SUPER_ADMIN_SETUP_GUIDE.md` - Detailed setup instructions
- `setup-super-admin-windows.bat` - Windows setup helper
- `src/contexts/AuthContext.tsx` - Auth logic
- `src/config/superAdminRoutes.ts` - Admin routes

---

## What the Super Admin Can Do

✅ **Full System Control**
- View all properties in the system
- Manage all users (create, edit, delete)
- Approve or reject all requests
- Manage all leases and payments
- Configure system settings
- View analytics and reports
- Manage property managers
- Process deposit refunds
- View all audit logs

---

## Security Notes

1. **First Login**: After successful login, change the password for security
2. **Email Confirmation**: Should be auto-confirmed in setup
3. **Audit Trail**: All actions are logged
4. **Backup Admin**: Consider creating a second super admin for backup
5. **Strong Password**: If you need to reset, use a strong password

---

## Quick Test Steps

After setup, here's how to quickly test:

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Login**
   - URL: http://localhost:5173/login
   - Email: duncanmarshel@gmail.com
   - Password: Marshel@1992

3. **Expected Redirect**
   - Should go to: http://localhost:5173/portal/super-admin/dashboard

4. **Check Sidebar**
   - Should see all admin menu items
   - Should be able to click and navigate to all sections

---

## Need Help?

If something isn't working:

1. Check the browser console: Press **F12** > **Console tab**
2. Check for error messages
3. Verify User ID format is correct (should be UUID v4)
4. Verify role is `super_admin` in database
5. Try refreshing the page
6. Try clearing browser cache and cookies

---

**Last Updated**: February 3, 2026
**Status**: Ready for implementation
