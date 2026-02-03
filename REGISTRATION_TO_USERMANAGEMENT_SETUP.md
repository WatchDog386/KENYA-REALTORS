# Registration to User Management Flow - Complete Setup

## Overview
When a user registers on the RegisterPage, they are automatically saved to the `profiles` table and then appear in the Super Admin User Management dashboard.

---

## Flow Diagram

```
User Registration Form
        ↓
Sign Up (auth.signUp)
        ↓
Create/Upsert Profile in profiles table
        ↓
Profile appears in User Management
        ↓
Super Admin can assign roles
```

---

## What Was Updated

### 1. RegisterPage.tsx (src/pages/auth/RegisterPage.tsx)
**Changes:**
- Now properly captures: `first_name`, `last_name`, `email`, `phone`, `role`, `status`, `is_active`
- Parses full name into first and last name
- Uses `upsert()` to insert OR update profile
- Inserts all required fields from the profiles table schema

**Code:**
```tsx
const profileData = {
  id: data.user.id,
  email: formData.email,
  first_name: firstName,
  last_name: lastName,
  phone: formData.phone,
  role: formData.role,
  user_type: determineUserType(formData.role),
  status: formData.role === "property_manager" ? "pending" : "active",
  is_active: true,
  created_at: NOW(),
  updated_at: NOW(),
};

// Save to profiles table
await supabase.from("profiles").upsert(profileData)
```

### 2. RLS Policies (20260203_fix_registration_profiles.sql)
**Policies Created:**
- `profiles_service_role_all` - Backend can manage all profiles
- `profiles_insert_own` - Users can create their own profile
- `profiles_select_own` - Users can view their own profile
- `profiles_select_all_authenticated` - All authenticated users can view all profiles
- `profiles_update_own` - Users can update their own profile
- `profiles_delete_own` - Users can delete their own profile

---

## Database Schema (profiles table)

Key fields that are now populated during registration:

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,                    -- From auth.users
  email text UNIQUE NOT NULL,             -- User's email
  first_name text,                        -- Parsed from full_name
  last_name text,                         -- Parsed from full_name
  phone text,                             -- From form
  role text (super_admin|property_manager|tenant),
  user_type text,                         -- Derived from role
  status text (active|pending|suspended), -- Based on role
  is_active boolean,                      -- true on signup
  created_at timestamp,                   -- Signup time
  updated_at timestamp,                   -- Last update
  property_id uuid (for tenants),
  unit_id uuid (for tenants)
);
```

---

## User Management Dashboard

### What Happens in UserManagementNew.tsx:
1. **Load Users** - Fetches ALL users from profiles table
   ```tsx
   const { data } = await supabase.from("profiles").select("*")
   ```

2. **Display Users** - Shows:
   - Name (first_name + last_name)
   - Email
   - Phone
   - Current Role
   - Status (Active, Suspended, Pending)
   - Action buttons (Assign Role, Delete)

3. **Assign Roles** - Super admin can:
   - Change a user's role
   - Change their status
   - Delete users
   - Search and filter by name, email, or role

---

## Testing the Complete Flow

### Step 1: User Registers
1. Go to Register page
2. Fill in: Full Name, Email, Phone, Password
3. Select Role (Tenant, Property Manager)
4. Click "Create Account"

### Step 2: Profile is Saved
- RegisterPage inserts data into profiles table
- User receives confirmation email
- Profile now exists in database

### Step 3: Super Admin Views User
1. Log in as super admin (duncanmarshel@gmail.com / Marshel@1992)
2. Go to User Management
3. New user should appear in the table
4. Super admin can:
   - Change role
   - Change status
   - View all user details

---

## SQL to Apply in Supabase

Run this migration in your Supabase SQL Editor:

[supabase/migrations/20260203_fix_registration_profiles.sql](../../supabase/migrations/20260203_fix_registration_profiles.sql)

---

## Verification Checklist

- [ ] User can register on RegisterPage
- [ ] Profile data is saved to profiles table
- [ ] User appears in Super Admin User Management
- [ ] Super admin can view all users
- [ ] Super admin can assign roles to users
- [ ] Super admin can change user status
- [ ] Search and filter work correctly
- [ ] Profile data includes: first_name, last_name, email, phone, role

---

## Key Fields in profiles table

| Field | Type | Source | Default |
|-------|------|--------|---------|
| id | uuid | auth.users.id | - |
| email | text | RegisterForm | - |
| first_name | text | RegisterForm (parsed) | - |
| last_name | text | RegisterForm (parsed) | - |
| phone | text | RegisterForm | - |
| role | text | RegisterForm dropdown | 'tenant' |
| user_type | text | Derived from role | - |
| status | text | Role-based | 'active' or 'pending' |
| is_active | boolean | Always set | true |
| created_at | timestamp | System | NOW() |
| updated_at | timestamp | System | NOW() |
| property_id | uuid | Tenant selection | null |
| unit_id | uuid | Tenant selection | null |

---

## Troubleshooting

### Users not appearing in User Management?
1. Check browser console for errors during registration
2. Verify RLS policies are applied in Supabase
3. Go to Supabase Dashboard → profiles table → verify rows exist
4. Hard refresh the browser

### Profile creation fails?
1. Check if profiles table RLS policies are enabled
2. Ensure RLS has INSERT policy for authenticated users
3. Check Supabase logs for detailed error messages

### Can't assign roles to users?
1. Make sure you're logged in as super_admin
2. Verify the user's role is set correctly in the database
3. Check UPDATE policy on profiles table
