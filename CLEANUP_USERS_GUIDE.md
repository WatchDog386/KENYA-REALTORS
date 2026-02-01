# Complete User Cleanup Guide

## Overview
This guide provides step-by-step instructions to delete all users except the superadmin and reset the system for fresh registrations.

**⚠️ WARNING: This is a destructive operation. All non-superadmin users will be permanently deleted.**

---

## Quick Start (Windows)
```bash
cleanup-users.bat
```

## Quick Start (macOS/Linux)
```bash
bash cleanup-users.sh
```

---

## Step-by-Step Manual Process

### Step 1: Database Cleanup (Automated)
The SQL migration handles this automatically:

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click "SQL Editor"
   - Click "New Query"

2. **Copy and paste the migration SQL:**
   ```sql
   -- See: supabase/migrations/20260202_cleanup_and_reset_users.sql
   ```

3. **Run the query**
   - This deletes all non-superadmin profiles
   - Removes related notifications, approvals, etc.
   - Preserves superadmin data

### Step 2: Delete Auth Users (Manual - Must Be Done)
**Supabase requires manual deletion of auth users via the dashboard.**

1. **Go to Authentication > Users**
   - URL: `https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/auth/users`

2. **For each non-superadmin user:**
   - Click on the user row
   - Look for the "Delete user" option (may be in a menu/dropdown)
   - Confirm deletion
   - Repeat for all non-superadmin users

3. **Result:** Only superadmin remains in auth.users

### Step 3: Clear Browser Storage
This ensures you're completely logged out:

**Chrome/Edge/Firefox:**
1. Press `F12` to open DevTools
2. Go to **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
3. Click **Local Storage**
4. Find entries for `http://localhost:8080` or similar
5. Delete entries containing:
   - `supabase-auth-token`
   - `supabase-session`
   - `auth-` prefixed entries
6. Or simply **Clear Site Data** completely

**Alternative - Nuclear Option:**
- Open DevTools (F12)
- Right-click any entry → "Clear all"

### Step 4: Restart Development Server
```bash
# Stop current server (Ctrl+C)

# Restart fresh
bun run dev
# or
npm run dev
```

### Step 5: Verify Cleanup
1. **Check Supabase:**
   - Go to Supabase > SQL Editor
   - Run: `SELECT COUNT(*) as user_count FROM public.profiles;`
   - Should show only 1 (superadmin)

2. **Check Auth:**
   - Go to Supabase > Authentication > Users
   - Should show only superadmin

3. **Check Your App:**
   - Go to `http://localhost:8080`
   - Should show login/register page (not logged in)

---

## What Gets Deleted

### Database Tables
- **profiles** - All non-superadmin profiles deleted
- **notifications** - Messages for deleted users
- **manager_approvals** - Approval requests from deleted users
- **property_assignments** - Property assignments for deleted users
- **audit_logs** - Logs for deleted users

### Auth System
- **auth.users** - All non-superadmin auth users (manual deletion)
- **Sessions** - All non-superadmin sessions

### Browser Storage
- `supabase-auth-token`
- `supabase-session`
- Any cached user data

---

## What's Preserved

✅ **Superadmin user and profile**
✅ **All properties, units, and property data**
✅ **System configuration and settings**
✅ **Database schema and migrations**

---

## New Registration Flow (After Cleanup)

When you register a new user:

1. ✅ Auth user created in `auth.users`
2. ✅ Profile automatically created in `public.profiles` (via trigger or API logic)
3. ✅ Profile includes:
   - User ID
   - Email
   - Default role (based on registration type)
   - Timestamps
4. ✅ User can log in immediately
5. ✅ No more "Database error finding user" issues

---

## Troubleshooting

### "Still getting 'No profile found' error"
1. Make sure you ran the SQL migration
2. Check that auth.users was cleaned (manual step)
3. Clear browser storage completely
4. Restart dev server

### "Can't delete users from Supabase Auth"
1. You need **project admin** access
2. Go directly to: https://supabase.com/dashboard
3. Select your project
4. Go to Authentication > Users
5. Delete via UI or contact Supabase support

### "Database still has old users"
1. Re-run the SQL migration
2. Manually delete profiles with: 
   ```sql
   DELETE FROM public.profiles WHERE role != 'super_admin';
   ```

### "Sessions still active"
1. Supabase sessions expire after 1 hour
2. Or clear them manually in browser storage (Step 3)
3. Restart dev server
4. Hard refresh browser (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)

---

## SQL Migration Reference

**File:** `supabase/migrations/20260202_cleanup_and_reset_users.sql`

**What it does:**
1. Identifies superadmin users
2. Deletes all non-superadmin profiles
3. Cleans up related data (notifications, approvals, etc.)
4. Displays remaining users
5. Shows what was preserved

**Note:** This only handles the database. Auth users must be deleted manually.

---

## Testing After Cleanup

### Test 1: Verify Cleanup
```sql
-- Should show only 1 user (superadmin)
SELECT COUNT(*) FROM public.profiles;
SELECT * FROM public.profiles;

-- Should show only superadmin
SELECT COUNT(*) FROM auth.users;
```

### Test 2: New User Registration
1. Go to registration page
2. Register with new email
3. Should complete without "Database error finding user"
4. New user profile should be created
5. Should be able to log in immediately

### Test 3: Superadmin Still Works
1. Log in as superadmin
2. Verify superadmin dashboard accessible
3. Verify all superadmin functions work

---

## Files Created

```
cleanup-users.bat           ← Windows script (use this on Windows)
cleanup-users.sh            ← Bash script (use on Mac/Linux)
supabase/migrations/
  20260202_cleanup_and_reset_users.sql    ← Database migration
```

---

## Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Run SQL migration | ✅ Automated |
| 2 | Delete auth.users | ⏳ Manual (Supabase dashboard) |
| 3 | Clear browser storage | ⏳ Manual (DevTools) |
| 4 | Restart dev server | ⏳ Manual (Ctrl+C, then restart) |
| 5 | Verify cleanup | ✅ Check SQL queries |
| 6 | Test new registration | ✅ Should work now |

---

## Questions?

- Check the console logs for specific error messages
- Review Supabase documentation: https://supabase.com/docs
- Check application code in `src/pages/auth/RegisterPage.tsx` for registration logic
