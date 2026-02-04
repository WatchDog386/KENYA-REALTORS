# Quick Fix Steps

## Problem Summary
Three errors when assigning roles to users:
1. ❌ **400 Error** fetching property managers (FIXED in PropertyManager.tsx)
2. ❌ **"User not found"** when assigning role (FIXED in UserManagementNew.tsx)
3. ❌ **Dialog warnings** (Already OK)

## What Was Fixed

### File 1: `src/components/portal/super-admin/PropertyManager.tsx`
- **Line ~85**: Removed `.eq('status', 'active')` filter
- **Reason**: `property_manager_assignments` table doesn't have a `status` column
- **Status**: ✅ FIXED

### File 2: `src/components/portal/super-admin/UserManagementNew.tsx`
- **Lines ~174-209**: Added profile existence check before updating
- **What it does now**:
  1. First checks if profile exists using `.maybeSingle()`
  2. If no profile → throws clear error: "User profile not found"
  3. If profile exists → proceeds with role assignment
- **Status**: ✅ FIXED

## Next Steps to Complete

### Step 1: Apply Database Migration
The database might be missing required tables or views. Run this migration in Supabase:

**Location**: `supabase/migrations/20260211_comprehensive_database_repair.sql`

**How to apply**:
```
Option A (Recommended - Using Supabase CLI):
  supabase db push

Option B (Manual - Using Supabase Dashboard):
  1. Go to Supabase Dashboard → SQL Editor
  2. Create new query
  3. Copy entire contents of 20260211_comprehensive_database_repair.sql
  4. Click "Run"
  5. Should see "completed" status
```

**What this migration does**:
- ✅ Ensures all required tables exist
- ✅ Ensures `all_users_with_profile` view exists
- ✅ Sets up correct RLS policies
- ✅ Removes any duplicate policies
- ✅ Creates proper indexes

### Step 2: Verify Environment Variables
Make sure your `.env.local` file has:
```
VITE_SUPABASE_URL=https://your-project-name.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...your-full-anon-key...
```

### Step 3: Test the Fix

1. **Restart dev server**:
   ```bash
   npm run dev
   ```

2. **Go to Super Admin Dashboard**:
   - URL: `http://localhost:5173` (or your dev server)
   - Login as super_admin
   - Navigate to "User Management"

3. **Create a test user or use existing one**:
   - Should see list of users
   - Click "Edit" button on a user

4. **Test Property Manager Assignment**:
   - Select role: "Property Manager"
   - Select at least one property
   - Click "Approve & Assign"
   - ✅ Should show success toast
   - ✅ User should now appear with role "Property Manager"

5. **Test Tenant Assignment**:
   - Select role: "Tenant"
   - Select a property
   - Select a unit
   - Click "Approve & Assign"
   - ✅ Should show success toast
   - ✅ User should now appear with role "Tenant"

## Common Issues & Solutions

### Issue: Still Getting 400 Error
**Solution**:
1. Make sure you have the latest code (PropertyManager.tsx is updated)
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console for any other errors
4. Verify `.env.local` has correct Supabase URL

### Issue: "User profile not found" Error
**Cause**: User registered but profile wasn't created in `profiles` table

**Solutions**:
1. User needs to complete registration properly
2. Or manually create profile entry in Supabase dashboard
3. Or wait for the sync service to create it

### Issue: "No properties available"
**Cause**: No properties have been created yet

**Solution**:
1. First go to "Properties" section (if available)
2. Create at least one property
3. Create at least one property unit type for that property
4. Then try to assign property manager again

### Issue: Properties showing but units are empty
**Cause**: No unit types created for selected property

**Solution**:
1. Go to Properties section
2. For each property, create unit types (e.g., "1 Bedroom", "2 Bedroom")
3. Specify number of units and price per unit
4. Then assign tenant to property+unit

## Database Query to Check Status

Run these in Supabase SQL Editor to verify everything is set up:

```sql
-- Check all users
SELECT id, email, first_name, role, status 
FROM public.all_users_with_profile 
ORDER BY created_at DESC;

-- Check property manager assignments
SELECT 
  pma.property_manager_id,
  p.first_name,
  p.last_name,
  pr.name as property_name
FROM public.property_manager_assignments pma
JOIN public.profiles p ON pma.property_manager_id = p.id
JOIN public.properties pr ON pma.property_id = pr.id;

-- Check tenants
SELECT 
  t.user_id,
  p.first_name,
  p.last_name,
  pr.name as property_name,
  put.name as unit_name
FROM public.tenants t
JOIN public.profiles p ON t.user_id = p.id
JOIN public.properties pr ON t.property_id = pr.id
LEFT JOIN public.property_unit_types put ON t.unit_id = put.id;
```

## Files Modified

1. ✅ `src/components/portal/super-admin/PropertyManager.tsx` - Fixed 400 error
2. ✅ `src/components/portal/super-admin/UserManagementNew.tsx` - Fixed "User not found" error
3. ✨ NEW: `supabase/migrations/20260211_comprehensive_database_repair.sql` - Database setup
4. ✨ NEW: `DATABASE_FIXES.md` - This guide

## Need Help?

1. Check `DATABASE_FIXES.md` for detailed explanation
2. Look at the migration SQL file to understand schema
3. Verify all environment variables are set
4. Check Supabase dashboard → SQL Editor for any errors
5. Review browser console for JavaScript errors

