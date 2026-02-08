# FIX: Property Manager Dashboard 400 Error Resolution

## Problem Identified
The manager portal was showing `400 Bad Request` errors when querying properties. The root cause was overly complex RLS (Row Level Security) policies that were causing Supabase to struggle with the queries.

## Files Modified

### 1. **src/hooks/useManager.ts**
- Added proper empty array checks before calling `.in()` queries
- Added detailed console logging for debugging
- Fixed `getMaintenanceRequests()` to fetch property IDs first before querying maintenance
- Fixed `fetchManagerStats()` to properly validate property IDs

### 2. **src/components/portal/manager/AssignmentStatus.tsx**
- Added empty array filtering before `.in()` calls
- Added detailed debug logging to track property ID resolution
- Improved error handling with specific error messages

### 3. **supabase/migrations/20260217_005_fix_rls_property_access.sql** (NEW)
- Simplified RLS policies to use `EXISTS` instead of `IN` subqueries
- This prevents the complex subquery nesting that causes 400 errors
- Updated policies for: properties, units, tenants, maintenance_requests

## How to Apply the Fix

### Option 1: Run via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** tab
3. Create a new query
4. Copy the entire content from: `supabase/migrations/20260217_005_fix_rls_property_access.sql`
5. Click **Execute**
6. Wait for the query to complete successfully

### Option 2: Run via CLI (if you have Supabase CLI installed)

```bash
cd c:\Users\korri\OneDrive\Desktop\REALTORS-LEASERS
supabase db push
```

## Verification Steps

After applying the migration, test the following:

1. **Verify RLS Policies Updated**: Run this in Supabase SQL Editor:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('properties', 'units', 'tenants', 'maintenance_requests')
ORDER BY tablename, policyname;
```

You should see the updated policies with names like:
- `manager_see_assigned_properties`
- `manager_view_property_units`
- `manager_view_property_tenants`
- `manager_view_maintenance_requests`

2. **Verify Property Assignment**: Run this in Supabase SQL Editor:
```sql
SELECT pma.*, p.name as property_name
FROM property_manager_assignments pma
LEFT JOIN properties p ON pma.property_id = p.id
ORDER BY pma.created_at DESC;
```

Check that:
- Your manager has entries in this table
- The `status` is `'active'`
- The property IDs exist in the properties table

3. **Test the Manager Portal**: 
- Log in as a property manager
- Navigate to `/portal/manager`
- You should now see your assigned properties instead of the "Waiting for Property Assignment" message

## Troubleshooting

### Still seeing 400 errors?

1. **Check your browser console** (F12) for detailed error messages
2. **Verify property assignment exists**:
   ```sql
   SELECT * FROM property_manager_assignments 
   WHERE property_manager_id = 'YOUR_USER_ID_HERE';
   ```

3. **Verify property exists**:
   ```sql
   SELECT id, name FROM properties 
   WHERE id = 'THE_PROPERTY_ID_FROM_ASSIGNMENT';
   ```

4. **Clear browser cache and refresh** - sometimes old RLS states are cached

### 401 Unauthorized errors?

This means the RLS policy isn't allowing access. Run:
```sql
-- Check if auth.uid() is set correctly
SELECT auth.uid() as current_user_id;

-- Check what role this user has
SELECT id, email, role, status FROM profiles 
WHERE id = auth.uid();
```

## Code Changes Summary

### Key Improvements:
1. **Defensive `.in()` calls**: All `.in()` queries now check for empty arrays first
2. **Better error logging**: Console logs show exactly which property IDs are being queried
3. **Simplified RLS**: Using `EXISTS` instead of `IN` subqueries for better Supabase performance
4. **Proper fallback handling**: If assignment query fails, returns empty gracefully

### Testing
The changes maintain backward compatibility while fixing the query execution issues.

## Questions or Issues?

If you still encounter problems:
1. Check the browser console (F12) for the specific error
2. Look at the Supabase Query Editor for SQL syntax errors
3. Verify the property_manager_assignments table has entries with `status = 'active'`
4. Ensure the property IDs in assignments actually exist in the properties table
