# Database Structure and Issue Analysis

## Current Problem

The user is experiencing three errors when trying to assign roles:
1. **400 Error** - PropertyManager fetching assigned managers fails
2. **"User not found" Error** - Role assignment fails  
3. **Dialog accessibility warnings** (Already fixed)

## Root Causes Identified and Fixed

### 1. 400 Error in PropertyManager.tsx - FIXED ✅

**Problem**: Line had `.eq('status', 'active')` filter
```typescript
// WRONG:
const { data, error } = await supabase
  .from('property_manager_assignments')
  .select('property_id, property_manager_id, profiles(...)')
  .eq('status', 'active');  // ❌ property_manager_assignments table doesn't have a 'status' column!
```

**Root Cause**: The `property_manager_assignments` table schema is:
- id (UUID)
- property_manager_id (UUID)
- property_id (UUID) 
- assigned_at (TIMESTAMP)
- UNIQUE constraint on (property_manager_id, property_id)

It has NO `status` column! This causes a 400 Bad Request error.

**Solution**: Removed the invalid `.eq('status', 'active')` filter

### 2. "User not found or update failed" Error - FIXED ✅

**Problem**: Code tried to update profile without checking if it exists first

```typescript
// WRONG: Might fail if profile doesn't exist
const { data: updateData, error: profileError } = await supabase
  .from("profiles")
  .update({ role: newRole, ... })
  .eq("id", userId)
  .select();

if (!updateData || updateData.length === 0) {
  throw new Error("User not found or update failed");  // Confusing error
}
```

**Solution**: Added profile existence check BEFORE update
```typescript
// CORRECT: Check first, then update
const { data: existingProfile, error: checkError } = await supabase
  .from("profiles")
  .select("id")
  .eq("id", userId)
  .maybeSingle();

if (!existingProfile) {
  throw new Error(`User profile not found. The user may not have completed registration yet.`);
}
```

### 3. Dialog Accessibility Warnings - ALREADY OK ✅

Both dialogs already have proper structure:
- DialogContent
- DialogHeader  
- DialogTitle
- DialogDescription

No changes needed.

## Database Tables Structure

### profiles
```
- id (UUID) - References auth.users(id)
- email (TEXT)
- first_name, last_name (VARCHAR)
- phone, avatar_url (TEXT/VARCHAR)
- role (VARCHAR) - 'super_admin', 'property_manager', 'tenant'
- status (VARCHAR) - 'active', 'pending', 'inactive'
- user_type (VARCHAR)
- is_active (BOOLEAN)
- approved_by (UUID) - References auth.users(id)
- approved_at (TIMESTAMP)
- approval_notes (TEXT)
- property_id, unit_id (UUID)
- created_at, updated_at, last_login_at (TIMESTAMP)
```

### properties
```
- id (UUID)
- name, location (VARCHAR)
- image_url (TEXT)
- type (VARCHAR)
- description (TEXT)
- amenities (TEXT)
- created_at, updated_at (TIMESTAMP)
```

### property_manager_assignments
```
- id (UUID)
- property_manager_id (UUID) - References auth.users(id)
- property_id (UUID) - References properties(id)
- assigned_at (TIMESTAMP)
- UNIQUE(property_manager_id, property_id)
⚠️ NO 'status' column - this was the 400 error!
```

### property_unit_types
```
- id (UUID)
- property_id (UUID)
- name (VARCHAR)
- units_count (INTEGER)
- price_per_unit (DECIMAL)
- created_at, updated_at (TIMESTAMP)
```

### tenants
```
- id (UUID)
- user_id (UUID) - References auth.users(id), UNIQUE
- property_id (UUID)
- unit_id (UUID)
- status (VARCHAR)
- move_in_date, move_out_date (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)
```

### Views

#### all_users_with_profile
Combines auth.users with profiles table for unified user data:
```
- id, email
- first_name, last_name, phone, avatar_url
- role, status, is_active
- created_at, updated_at, last_login_at
```

## RLS Policies

### profiles
- Service role: Full access
- User: Can read own, update own, insert own, delete own
- Super admin: Can read all, update all
- Auth admin: Full access

### property_manager_assignments
- Service role: Full access
- Super admin: Full access
- Manager: Can read own assignments
- Public: Can read

### tenants
- Service role: Full access
- Super admin: Full access
- User: Can read own
- Public: Can read

## Steps to Fix

1. **Apply Migration**: Run the 20260211_comprehensive_database_repair.sql in Supabase
   - Ensures all tables exist
   - Creates all views
   - Sets up RLS policies correctly
   - Verifies data

2. **Test in UI**:
   - Go to Super Admin Dashboard → User Management
   - Try to assign a property manager to a property
   - Try to assign a tenant to a unit
   - Should work now!

## Environment Variables Required

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## How to Run Supabase Migrations

```bash
# If using Supabase CLI:
supabase db push

# Or manually:
# 1. Go to Supabase SQL Editor
# 2. Copy-paste the migration SQL
# 3. Run it
```

## Testing the Fix

### For Property Manager Assignment:
1. User has role 'tenant' (no role)
2. Click "Edit" → "Assign Role"
3. Select "Property Manager"
4. Select one or more properties
5. Click "Approve & Assign"
6. ✅ Should update profile with role='property_manager'
7. ✅ Should create entries in property_manager_assignments

### For Tenant Assignment:
1. User has role 'tenant' (no role)
2. Click "Edit" → "Assign Role"
3. Select "Tenant"
4. Select a property
5. Select a unit
6. Click "Approve & Assign"
7. ✅ Should update profile with role='tenant'
8. ✅ Should create entry in tenants table

