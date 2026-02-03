# 🚀 DEPLOYMENT GUIDE - Registration & Approval System Fix

## Step 1: Deploy Database Migration

### Option A: Via Supabase Dashboard (Recommended)

1. **Open Supabase Console**
   - Go to https://app.supabase.com → Your Project
   - Navigate to SQL Editor

2. **Copy the new migration**
   - Open: `supabase/migrations/20260204_complete_system_fix.sql`
   - Copy ALL the content

3. **Run the migration**
   - Paste into Supabase SQL Editor
   - Click "RUN" button
   - Wait for completion (should see success message)

4. **Verify success**
   - Check no errors appear
   - Table schema should be updated

### Option B: Via Supabase CLI (If available)

```bash
supabase db push
```

---

## Step 2: Update Environment (if needed)

Check your `.env.local` has correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Step 3: Test Registration Flow

### Test Tenant Registration

1. Start dev server: `npm run dev` or `bun run dev`
2. Go to `/register`
3. Fill out form as **Tenant**:
   - Full Name: John Tenant
   - Email: tenant@test.com
   - Phone: +254712345678
   - Password: TestPass123
   - Account Type: **Tenant**
4. Submit form
5. **Expected Result:**
   - ✅ No 500 error
   - ✅ See success message "Registration successful! Awaiting admin approval."
   - ✅ Redirected to login after 3 seconds

### Test Manager Registration

1. Go to `/register` again
2. Fill out form as **Property Manager**:
   - Full Name: Jane Manager
   - Email: manager@test.com
   - Phone: +254712345679
   - Password: TestPass123
   - Account Type: **Property Manager**
3. Submit form
4. **Expected Result:**
   - ✅ No 500 error
   - ✅ Success message appears
   - ✅ Redirected to login

---

## Step 4: Test Approval Flow

### Login as Super Admin

1. Use existing super admin credentials
2. Navigate to dashboard
3. Go to **User Management**

### Approve a User

1. Find pending tenant/manager in the list
2. Click "Assign" button
3. Dialog appears with user info
4. Select role (should match their type)
5. **For Tenant:** Select property and unit
6. **For Manager:** Select managed properties
7. Click "✓ Approve & Assign"
8. **Expected Result:**
   - ✅ User marked as "active"
   - ✅ Notification sent to user
   - ✅ Dashboard refreshes

### Test Approved User Login

1. Use approved user's credentials
2. Attempt to login at `/login`
3. **Expected Result:**
   - ✅ No "approval pending" error
   - ✅ Successfully logs in
   - ✅ Redirected to appropriate portal (tenant, manager, etc.)

---

## Step 5: Monitor for Errors

### Check Supabase Logs

Go to Supabase Dashboard:
- SQL Editor → Run: `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`
- Should see: `profiles`, `manager_approvals`, `tenant_approvals`, `notifications`

### Check Browser Console

During registration, you should see:
```
✅ Auth user created successfully: [uuid]
🔍 Fetching created profile...
✅ Profile confirmed: [uuid]
🔄 Creating tenant_approvals record...
✅ Tenant approval record created
🔔 Fetching super admins for notification
✅ Notification created
```

---

## Troubleshooting

### Error: "Database error finding user"
**Solution:**
- Run migration again (it's idempotent)
- Check Supabase logs for RLS policy errors
- Verify `auth.users` table exists and accessible

### Error: "Column 'X' does not exist"
**Solution:**
- Migration may not have run completely
- Check table structure: Run `DESCRIBE profiles;` in Supabase
- Re-run the migration file

### Notifications not appearing
**Solution:**
- Check if super admins exist in database with `status='active'`
- Verify RLS policies allow service_role notifications insert

### User can't login even after approval
**Solution:**
- Check profile.status = 'active' in database
- Check profile.role is set correctly
- Verify LoginPage has approval check (it should)

---

## Quick Test Commands (Supabase SQL)

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check profiles table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Check pending users
SELECT id, email, role, status FROM profiles 
WHERE status = 'pending' 
ORDER BY created_at DESC;

-- Check manager approvals
SELECT * FROM manager_approvals WHERE status = 'pending';

-- Check tenant approvals
SELECT * FROM tenant_approvals WHERE status = 'pending';

-- Check notifications
SELECT * FROM notifications 
ORDER BY created_at DESC LIMIT 10;
```

---

## Files to Know

| File | Purpose | Status |
|------|---------|--------|
| `20260204_complete_system_fix.sql` | Database migration | ✅ Ready to deploy |
| `RegisterPage.tsx` | Registration form | ✅ Already updated |
| `LoginPage.tsx` | Login with approval check | ✅ Already updated |
| `UserManagementNew.tsx` | Approval dashboard | ✅ Already updated |
| `SYSTEM_FIX_REPORT.md` | What was fixed | 📄 Reference doc |

---

## Success Indicators

✅ Registration doesn't throw 500 error  
✅ Pending users appear in UserManagement  
✅ Super admin can approve users  
✅ Approved users can login  
✅ Notifications work  
✅ Role-based routing works after login  

---

## Need Help?

Check logs in Supabase Dashboard → SQL Editor → View PostgreSQL logs

Error pattern indicates:
- `22P02` = Invalid UUID format
- `23505` = Duplicate key violation
- `23502` = NOT NULL constraint violation
- `42P01` = Table doesn't exist

---

**Status:** Ready for deployment  
**Estimated Downtime:** None (migration is backward compatible)  
**Rollback:** Can run old migration if needed  
