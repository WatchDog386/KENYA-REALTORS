# User Sync Setup Guide

## Overview
This guide ensures that auth users are automatically synced to the profiles table and accessible in the super admin dashboard.

## What Gets Set Up

1. **Automatic User Sync**: New users signing up are automatically created in the profiles table
2. **Super Admin Access**: duncanmarshel@gmail.com has super_admin role with full visibility
3. **User Management Dashboard**: Admin dashboard displays all users from profiles table
4. **RLS Policies**: Proper Row Level Security policies for super admin and users

## Installation Options

### Option 1: Automatic via Node Script (Recommended)
```bash
npm run migrate:user-sync
```

### Option 2: Manual via Supabase Dashboard
1. Open: https://rcxmrtqgppayncelonls.supabase.co
2. Go to **SQL Editor** (left sidebar)
3. Create a **New Query**
4. Copy contents from: `supabase/migrations/20260205_enhance_user_sync.sql`
5. Click **Run** button
6. Verify completion in console

### Option 3: Using Python Script
```bash
python scripts/apply-user-sync-migration.py
```

## What the Migration Does

### 1. Enhanced User Sync Function
- Creates `handle_new_user()` function that syncs new auth users to profiles
- Sets default role as 'tenant' if not provided
- Handles errors gracefully with warnings

### 2. Automatic Trigger
- Creates `on_auth_user_created` trigger
- Fires when new user signs up in auth.users
- Automatically creates corresponding profile record

### 3. Batch Sync of Existing Users
- Finds all users in auth.users not yet in profiles
- Inserts them with appropriate role, status, and user_type
- Sets is_active to true and status to 'active'

### 4. Super Admin Setup
- Sets duncanmarshel@gmail.com as super_admin
- Full access to view all users
- Can approve/manage property managers
- Can update user roles and status

### 5. Dashboard Query Function
- Creates `get_all_users_with_auth()` function
- Returns all users with auth data
- Only accessible to super admin
- Used by admin dashboard to fetch users

### 6. Updated RLS Policies
- Users can only access their own profile
- Super admin can view and update all users
- Service role has full access
- Proper security without infinite recursion

## Verification Steps

### 1. Check Super Admin Role
```sql
-- Login to Supabase SQL Editor and run:
SELECT id, email, role, status, is_active FROM public.profiles 
WHERE email = 'duncanmarshel@gmail.com';
```

Expected output:
- email: duncanmarshel@gmail.com
- role: super_admin
- status: active
- is_active: true

### 2. Check Trigger is Active
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

### 3. Test User Dashboard
1. Login as duncanmarshel@gmail.com (or create account)
2. Go to Admin Dashboard
3. Click "All Users" tab
4. Verify users are displayed
5. Check super admin badge on your user

### 4. Test User Sync
1. Create a new test user account
2. Wait 2-3 seconds
3. Refresh admin dashboard
4. New user should appear in the list

## Troubleshooting

### Issue: "Users not appearing in dashboard"
**Solution**: 
1. Run "Sync Users" button in dashboard
2. Or manually run: `supabase db push`

### Issue: "Super admin can't see users"
**Solution**:
1. Verify duncanmarshel@gmail.com role is "super_admin"
2. Check RLS policies are enabled on profiles table
3. Run the migration again

### Issue: "New users not auto-syncing"
**Solution**:
1. Check if trigger is enabled: `SELECT * FROM pg_trigger`
2. Verify handle_new_user function exists
3. Check auth.users has raw_user_meta_data with role

### Issue: "Profile sync function not found"
**Solution**:
1. This is normal - we use the trigger instead
2. Dashboard will still fetch users correctly
3. Manual sync button may show a warning but will work

## API Usage in Code

### Fetching All Users (Dashboard)
```typescript
import { getAllUsers } from "@/services/userManagementService";

const users = await getAllUsers(); // Only works for super admin
```

### Fetching Pending Approvals
```typescript
import { getPendingApprovals } from "@/services/userManagementService";

const pending = await getPendingApprovals();
```

### Approving a User
```typescript
import { approveUser } from "@/services/userManagementService";

await approveUser(userId); // Changes status to 'active'
```

### Updating User Role
```typescript
import { updateUserRole } from "@/services/userManagementService";

await updateUserRole(userId, 'property_manager', 'active');
```

## Architecture

```
Auth User Signup
      ↓
   Trigger: on_auth_user_created
      ↓
   Function: handle_new_user()
      ↓
   Insert/Update profiles table
      ↓
   RLS Policy check
      ↓
   Super admin can view, others see own profile only
      ↓
   Admin Dashboard fetches via getAllUsers()
      ↓
   Users displayed with role/status badges
```

## Super Admin Features

Once super_admin role is active, duncanmarshel@gmail.com can:
- View all user profiles
- Approve pending property managers
- Update user roles and status
- Deactivate/activate users
- Search and filter users
- Monitor registration approvals

## Next Steps

1. ✅ Run the migration (choose one option above)
2. ✅ Verify super admin setup
3. ✅ Test user dashboard
4. ✅ Create test accounts to verify auto-sync
5. ✅ Monitor admin dashboard for user activity

## Files Modified/Created

- `supabase/migrations/20260205_enhance_user_sync.sql` - Main migration
- `src/services/userManagementService.ts` - Dashboard service
- `src/pages/AdminDashboard.tsx` - Updated to use new service
- `scripts/apply-user-sync-migration.py` - Setup script
- `scripts/apply-user-sync-migration.js` - Node version

## Support

If you encounter issues:
1. Check the Supabase dashboard for errors
2. Review function definitions in SQL editor
3. Verify RLS policies are correct
4. Check auth.users table has users
5. Review browser console for client errors

---

**Last Updated**: February 5, 2026
**Status**: Ready for Production
