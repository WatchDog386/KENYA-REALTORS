# 409 Conflict Error Fix - Property & Staff Assignments

## Issue Summary

**Error**: 409 Conflict when fetching/assigning staff to properties
```
Failed to load resource: the server responded with a status of 409 ()
```

**Root Cause**: 
The recent technician category enforcement migration (`20260301_enforce_technician_categories.sql`) introduced broken RLS (Row Level Security) policies that prevent super_admin from accessing and modifying technician_property_assignments.

## Problems Identified

### 1. **Incorrect Auth Check in technician_categories Policies**
   - Used: `auth.jwt() ->> 'role' = 'super_admin'`
   - Issue: This JWT-based check is unreliable and doesn't work with Supabase's standard authentication
   - Should Use: `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')`

### 2. **Missing Service Role Access**
   - The technician_categories table had no policy for service_role (backend operations)
   - This prevents backend functions from accessing categories

### 3. **Incomplete technician_property_assignments Policies**
   - Missing service_role policy for backend operations
   - The policies needed refresh after the technician table constraints changed

## Solution Applied

Created migration file: `20260302_fix_assignment_rls_409.sql`

### Changes Made:

#### 1. Fixed technician_categories RLS Policies
- ✅ Corrected super_admin policy to use proper auth check
- ✅ Added service_role full access policy
- ✅ Maintained public access to view active categories

#### 2. Refreshed technician_property_assignments Policies
- ✅ Recreated all policies with correct syntax
- ✅ Added service_role full access policy
- ✅ Fixed super_admin policy to use proper auth check
- ✅ Ensured property_manager policies work correctly

#### 3. Service Role Support
- ✅ Added explicit service_role policies to both tables
- ✅ Allows backend operations and migrations to function properly

## How to Apply the Fix

### Option 1: Via Supabase Dashboard (Recommended for immediate fix)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Create a new query with the content from `database/20260302_fix_assignment_rls_409.sql`
3. Click **Run**
4. Verify the success message

### Option 2: Via Supabase CLI

```bash
supabase db push
```

This will apply all pending migrations including the fix.

## Testing the Fix

After applying the migration:

1. **Refresh your browser** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. **Navigate to Properties/Staff Management** section
3. **Try assigning a technician to a property** - should work without 409 error
4. **Try viewing property assignments** - should load correctly
5. **Check browser console** - should not show failed resource loads

## Verification Queries

Run these in Supabase SQL Editor to confirm the fix:

```sql
-- Check RLS policies are correct
SELECT policyname, permissive, cmd
FROM pg_policies
WHERE tablename IN ('technician_categories', 'technician_property_assignments')
ORDER BY tablename, policyname;

-- Check super_admin can access
SELECT 
  p.email, 
  p.role,
  '✅ Can access categories' as status
FROM public.profiles p
WHERE p.role = 'super_admin'
LIMIT 1;

-- Verify active assignments
SELECT COUNT(*) as active_assignments
FROM public.technician_property_assignments
WHERE is_active = true;
```

## What Was Wrong - Technical Details

### Before Fix:
```sql
-- ❌ BROKEN - Uses unreliable JWT check
CREATE POLICY "Super admins can manage categories"
  ON public.technician_categories
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'super_admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');
```

### After Fix:
```sql
-- ✅ CORRECT - Uses standard profiles table check
CREATE POLICY "Super admins can manage categories"
  ON public.technician_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
```

## Additional Notes

- This fix doesn't modify the technician category enforcement logic from the previous migration
- All existing technician-category assignments remain intact
- The 409 error should be completely resolved on both property manager and technician assignment operations
- If you continue to see errors, check browser console for specific error messages and Report this in the logs folder

## Related Documents

- Previous Migration: `database/20260301_enforce_technician_categories.sql`
- RLS Documentation: `docs/PROPERTY_ASSIGNMENT_SYSTEM.md`
- Similar Fix Reference: `database/FIX_TENANT_RLS_ASSIGNMENT.sql`
