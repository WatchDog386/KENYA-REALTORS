# Complete Troubleshooting Guide

## What We Found and Fixed

### Issue #1: 400 Error in PropertyManager
**Error Message**: 
```
Failed to load resource: the server responded with a status of 400
rcxmrtqgppayncelonls.supabase.co/rest/v1/property_manager_assignments
```

**Root Cause**: 
The code was filtering with `.eq('status', 'active')` but `property_manager_assignments` table has NO `status` column.

**Table Schema (Correct)**:
```sql
CREATE TABLE public.property_manager_assignments (
    id UUID PRIMARY KEY,
    property_manager_id UUID,     -- ✅
    property_id UUID,              -- ✅
    assigned_at TIMESTAMP,         -- ✅
    -- NO status column!           -- ❌ This was the problem!
);
```

**Fix Applied**: ✅ DONE
- File: `src/components/portal/super-admin/PropertyManager.tsx` line 85
- Removed: `.eq('status', 'active')`
- Now it correctly fetches ALL assignments without the non-existent filter

---

### Issue #2: "User not found or update failed"
**Error Message**:
```
Error assigning role: Error: User not found or update failed
```

**Root Cause**: 
The code tried to update a profile that might not exist yet. When a user registers, sometimes the profile record isn't created immediately, causing the update to fail with a confusing error message.

**What Was Wrong**:
```typescript
// OLD CODE - No safety check
const { data: updateData } = await supabase
  .from("profiles")
  .update({ role: newRole })
  .eq("id", userId)
  .select();

if (!updateData || updateData.length === 0) {
  throw new Error("User not found or update failed");  // Confusing!
}
```

**Fix Applied**: ✅ DONE
- File: `src/components/portal/super-admin/UserManagementNew.tsx` lines 174-209
- Added: Profile existence check BEFORE attempting update
- Now it checks with `.maybeSingle()` first
- Gives clear error: "User profile not found. The user may not have completed registration yet."
- Only proceeds with update if profile exists

**New Code**:
```typescript
// NEW CODE - Check first, then update
const { data: existingProfile, error: checkError } = await supabase
  .from("profiles")
  .select("id")
  .eq("id", userId)
  .maybeSingle();

if (!existingProfile) {
  throw new Error(`User profile not found. The user may not have completed registration yet.`);
}
// NOW it's safe to update
```

---

### Issue #3: Dialog Accessibility Warnings
**Warnings**:
```
DialogContent requires DialogTitle for accessibility
Missing Description or aria-describedby for DialogContent
```

**Status**: ✅ ALREADY CORRECT
- Both dialogs already have `DialogHeader`, `DialogTitle`, and `DialogDescription`
- No changes needed

---

## Database Structure Overview

You need these tables for the system to work:

### Table 1: `auth.users` (Supabase built-in)
- Created automatically when you enable Authentication
- Contains email, password, metadata

### Table 2: `public.profiles` (Must exist)
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,                    -- References auth.users(id)
    email TEXT,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50),                       -- 'super_admin', 'property_manager', 'tenant'
    status VARCHAR(50),                     -- 'active', 'pending', 'inactive'
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    ... (other columns)
);
```

### Table 3: `public.properties` (Required for property management)
```sql
CREATE TABLE public.properties (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    location VARCHAR(500),
    type VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Table 4: `public.property_unit_types` (Units in a property)
```sql
CREATE TABLE public.property_unit_types (
    id UUID PRIMARY KEY,
    property_id UUID,                       -- References properties
    name VARCHAR(255),                      -- e.g., "1-Bedroom", "2-Bedroom"
    units_count INTEGER,                    -- How many of this type exist
    price_per_unit DECIMAL(12, 2),
    created_at TIMESTAMP
);
```

### Table 5: `public.property_manager_assignments` (Maps managers to properties)
```sql
CREATE TABLE public.property_manager_assignments (
    id UUID PRIMARY KEY,
    property_manager_id UUID,               -- References auth.users(id)
    property_id UUID,                       -- References properties(id)
    assigned_at TIMESTAMP,
    -- ⚠️ NO 'status' column! (This was the problem)
    UNIQUE(property_manager_id, property_id)
);
```

### Table 6: `public.tenants` (Maps tenants to property units)
```sql
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY,
    user_id UUID,                           -- References auth.users(id), UNIQUE
    property_id UUID,                       -- References properties(id)
    unit_id UUID,                           -- References property_unit_types(id)
    status VARCHAR(50),                     -- 'active', 'moving_out'
    move_in_date TIMESTAMP,
    created_at TIMESTAMP
);
```

### View 1: `public.all_users_with_profile` (Combines auth and profiles)
```sql
CREATE VIEW public.all_users_with_profile AS
SELECT
  u.id,
  u.email,
  COALESCE(p.first_name, ...) AS first_name,
  COALESCE(p.role, 'tenant') AS role,
  COALESCE(p.status, 'active') AS status,
  ... (more columns)
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;
```

This view is CRITICAL for UserManagementNew.tsx to work!

---

## How to Apply the Database Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
# Make sure you're in project directory
cd c:\Users\korri\OneDrive\Desktop\REALTORS-LEASERS

# Push all migrations to Supabase
supabase db push

# Should see:
# ✔ Linked Supabase CLI to project
# ✔ Pushed 1 migration
```

### Option 2: Manual via Supabase Dashboard
1. Go to https://supabase.com → Dashboard → Your Project
2. Click "SQL Editor" in left sidebar
3. Click "New Query"
4. Copy entire contents of: `supabase/migrations/20260211_comprehensive_database_repair.sql`
5. Paste into the query editor
6. Click "RUN" (blue button)
7. Wait for completion
8. See green "Success" message at top

### Option 3: Check if Already Applied
```bash
# In Supabase SQL Editor, run:
SELECT * FROM public.all_users_with_profile LIMIT 5;

# If this works, the view exists ✅
# If you get error, view needs to be created
```

---

## Step-by-Step Testing

### Test 1: View Exists
```sql
-- In Supabase SQL Editor:
SELECT COUNT(*) as total_users FROM public.all_users_with_profile;

-- Should return a number, not an error
-- ✅ PASS if you see a number
```

### Test 2: Properties Work
```sql
-- Create a test property
INSERT INTO public.properties (name, location, type)
VALUES ('Test Property', 'Test Location', 'Residential')
RETURNING id;

-- Note the ID returned, then test fetching
SELECT * FROM public.properties LIMIT 1;

-- ✅ PASS if you see the property
```

### Test 3: Property Units Work
```sql
-- Replace 'PROPERTY_ID' with the ID from Test 2
INSERT INTO public.property_unit_types (property_id, name, units_count, price_per_unit)
VALUES ('PROPERTY_ID', '1-Bedroom', 3, 500.00)
RETURNING id;

-- ✅ PASS if insert succeeds
```

### Test 4: Manager Assignment Works (The 400 Error Fix)
```sql
-- First, get a user ID from profiles
SELECT id, email FROM public.profiles LIMIT 1;

-- Replace 'USER_ID' and 'PROPERTY_ID' with actual IDs
INSERT INTO public.property_manager_assignments (property_manager_id, property_id)
VALUES ('USER_ID', 'PROPERTY_ID');

-- Now fetch it (what PropertyManager.tsx does)
SELECT * FROM public.property_manager_assignments
WHERE property_manager_id = 'USER_ID';

-- ✅ PASS if you see the assignment (NO .eq('status', 'active') filter!)
```

### Test 5: Tenant Assignment Works
```sql
-- Get unit ID from previous tests, user ID, property ID
INSERT INTO public.tenants (user_id, property_id, unit_id, status)
VALUES ('USER_ID', 'PROPERTY_ID', 'UNIT_ID', 'active');

-- Fetch it
SELECT * FROM public.tenants WHERE user_id = 'USER_ID';

-- ✅ PASS if you see the tenant
```

---

## Frontend Testing

### Test 1: Can Load User Management
1. Login as super_admin
2. Go to Dashboard → User Management
3. Should see list of users
4. Should see statistics cards (Total Users, Managers, Tenants, etc.)
5. ✅ PASS if no 400 errors in console

### Test 2: Can Assign Property Manager
1. Click Edit on a user with no role
2. Select "Property Manager" role
3. Select one or more properties from the checkboxes
4. Should see "Selected: X properties"
5. Click "Approve & Assign"
6. ✅ PASS if:
   - Toast shows "User approved as property_manager"
   - No "User not found" error
   - User now shows role "Property Manager" in the table

### Test 3: Can Assign Tenant
1. Click Edit on a user with no role
2. Select "Tenant" role
3. Click property dropdown
4. Select a property (must have properties + units created)
5. Click unit dropdown
6. Select a unit
7. Click "Approve & Assign"
8. ✅ PASS if:
   - Toast shows "User approved as tenant"
   - No errors
   - User now shows role "Tenant" in the table

---

## Browser Console Debugging

### What to Look For
Open browser Developer Tools (F12) → Console tab

**❌ BAD - Still has problems**:
```
400 Bad Request
Error: User not found or update failed
POST .../property_manager_assignments?... 400
```

**✅ GOOD - Fixed**:
```
🔄 Assigning role to user: {userId: "...", newRole: "property_manager"}
📝 Updating user role (trigger will auto-activate)...
✅ User profile updated successfully: {email: "...", role: "property_manager"}
🔗 Assigning properties to manager...
✅ Properties assigned successfully: 1 assignments stored
```

### If Still Getting 400 Error
1. Check code is updated: `PropertyManager.tsx` line 85 should NOT have `.eq('status', 'active')`
2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Restart dev server: Kill it (Ctrl+C) and run `npm run dev` again
4. Check Network tab: Should see 200/201 status for property_manager_assignments queries

### If Still Getting "User not found"
1. Check code is updated: `UserManagementNew.tsx` should have profile existence check
2. User must have completed registration (profile must exist in DB)
3. Check in Supabase: Go to profiles table, see if user is there
4. If not there, re-register the user or manually create profile entry

---

## Files Modified Summary

✅ **FIXED - Code Changes**:
1. `src/components/portal/super-admin/PropertyManager.tsx` line 85
   - Removed `.eq('status', 'active')`
   - Query now works without 400 error

2. `src/components/portal/super-admin/UserManagementNew.tsx` lines 174-209
   - Added profile existence check
   - Better error messages
   - Prevents "User not found" when updating

✨ **NEW - Database Migration**:
3. `supabase/migrations/20260211_comprehensive_database_repair.sql`
   - Comprehensive database setup
   - Creates all required tables
   - Creates all required views
   - Sets up all RLS policies
   - **YOU MUST RUN THIS MIGRATION!**

📖 **NEW - Documentation**:
4. `QUICK_FIX_GUIDE.md` - Quick reference
5. `DATABASE_FIXES.md` - Detailed explanation
6. This file - Complete troubleshooting

---

## CRITICAL: Must Run Migration

⚠️ **The code fixes alone are NOT enough!**

The database migration (`20260211_comprehensive_database_repair.sql`) MUST be applied for everything to work.

**Run it NOW**:
```bash
supabase db push
```

Or manually in Supabase Dashboard → SQL Editor

---

## Still Not Working? Checklist

- [ ] Applied migration 20260211_comprehensive_database_repair.sql
- [ ] PropertyManager.tsx updated (no `.eq('status', 'active')`)
- [ ] UserManagementNew.tsx updated (has profile existence check)
- [ ] .env.local has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- [ ] Restarted dev server after code changes
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Logged in as super_admin
- [ ] At least one property exists in database
- [ ] At least one unit type exists for that property
- [ ] At least one user exists with no role assigned

If all checked and still not working:
1. Check browser console (F12) for specific error
2. Check Supabase dashboard → Logs for database errors
3. Verify tables exist: `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`
4. Verify view exists: `SELECT * FROM public.all_users_with_profile LIMIT 1`

