# Fix Utility Constants Persistence - Database Migrations

## Problem
Utility constants (like Electricity and Water constants) were resetting to 1 when the page was refreshed because the database wasn't properly configured for superadmin updates or lacked proper persistence mechanisms.

## Solution
Two comprehensive SQL migration files have been created to fix this:

### 1. **20260227_fix_utility_constants_schema.sql**
Updates the `utility_constants` table with:
- ✅ Ensures `updated_at` column exists
- ✅ Adds missing `price` column if needed
- ✅ Configures proper RLS policies for superadmin
- ✅ Creates timestamp auto-update trigger
- ✅ Verifies data integrity

### 2. **20260227_complete_utility_management_fix.sql** (RECOMMENDED)
Comprehensive fix for BOTH tables:
- ✅ Fixes `utility_settings` table
- ✅ Fixes `utility_constants` table  
- ✅ Handles both 'super_admin' and 'superadmin' role name variations
- ✅ Creates auto-update triggers
- ✅ Includes verification queries
- ✅ Most thorough fix

## How to Apply

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project (REALTORS-LEASERS)
3. Click on **"SQL Editor"** in the left sidebar

### Step 2: Run the Migration
1. Click **"New Query"**
2. Copy the contents of **`20260227_complete_utility_management_fix.sql`**
3. Paste into the SQL editor
4. Click **"Run"** (or press Ctrl+Enter)
5. Wait for all queries to complete successfully

### Step 3: Verify the Fix
After running, you should see:
```
✓ Table structure verified
✓ RLS policies created
✓ Triggers configured
✓ Default utilities inserted
✓ All columns present
```

## What Gets Fixed

### RLS Policies (Row Level Security)
Now supports BOTH role name variations:
- `role = 'super_admin'` (underscore)
- `role = 'superadmin'` (no underscore)

### Timestamps
- `updated_at` automatically updates when records change
- Prevents ghosted/stale data

### Data Integrity
- Ensures all required columns exist
- Default utilities are properly seeded
- Numeric precision is correct (DECIMAL types)

## Testing the Fix

### Test 1: Change a Constant
1. Go to **SuperAdmin** → **Utilities** → **Manage Utility Constants**
2. Change "Electricity" constant from `1.0` to `50.5`
3. Click away from the field (saves automatically)
4. Refresh the page (F5)
5. **✓ Should still show `50.5`**

### Test 2: Add a New Utility
1. Click "ADD UTILITY"
2. Add "Internet" as a metered utility with constant `2.5`
3. Refresh the page
4. **✓ Should still be there with value `2.5`**

### Test 3: Dashboard Sync
1. In **Property Manager** → **Utilities**
2. Check that constants are loaded correctly
3. Add a reading using the new constants
4. In **SuperAdmin Dashboard** → check **Utility Readings & Payments**
5. **✓ Should show readings calculated with correct constants**

## Troubleshooting

### If you get a permission error:
- Make sure you're logged in as **SuperAdmin**
- Check that your profile role is exactly: `'super_admin'` or `'superadmin'`

### If migrations fail:
1. Try running them one at a time
2. Check the error message for which specific query failed
3. Run the verification queries to see current table structure

### If constants still reset:
1. Make sure the trigger was created (check for `trigger_update_utility_constants_timestamp`)
2. Run the verification queries to confirm all columns exist
3. Check browser console for any API errors

## Key Features Now Working

✅ **Persistence**: Constants saved to database and survive page reloads
✅ **Real-time Sync**: When constants change, all connected users see updates
✅ **Audit Trail**: `updated_at` tracks when changes were made
✅ **Backward Compatibility**: Works with both role name variations
✅ **Automatic Timestamps**: No manual timestamp management needed

## Files Modified/Created

- ✨ `database/20260227_fix_utility_constants_schema.sql` - Individual table fix
- ✨ `database/20260227_complete_utility_management_fix.sql` - Complete fix (recommended)
- 📝 `src/pages/portal/SuperAdminUtilitiesManager.tsx` - Real-time subscriptions added
- 📝 `src/pages/portal/manager/UtilityReadings.tsx` - Real-time sync with manager dashboard
- 📝 `src/components/portal/super-admin/UtilityReadingsPaymentTracker.tsx` - Dashboard updates

## After Running the Migration

1. **Restart your application** (npm run dev)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Log in as SuperAdmin**
4. **Test changing constants** - they should now persist!

---

**Last Updated**: February 27, 2026
**Status**: Ready to deploy
