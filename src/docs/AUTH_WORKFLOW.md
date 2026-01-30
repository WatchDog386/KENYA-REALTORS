# New Auth Workflow Documentation

## Overview

The authentication system has been redesigned with the following key changes:

### 1. **User Registration Flow**

- When a user creates a new account via signup, their profile is created in the `users` table
- The user's `role` is set to `NULL` (null) by default
- After signup/verification, users are redirected to the **Profile Page**

### 2. **Profile Page - Role Selection**

The Profile page (`/profile`) now features:

- Display of user profile information (name, email, phone)
- **Required role selection** when a user hasn't selected a role yet
- Role field is **disabled after selection** to prevent changes
- Once a role is selected, the user is automatically redirected to their portal

### 3. **User Types Management**

- Available roles are **hardcoded in the application** using constants
- Available roles:
  - `tenant` - Renter/Tenant
  - `property_manager` - Property Manager
  - `super_admin` - Super Administrator
  - `owner` - Property Owner
- Permissions are managed via `ROLE_PERMISSIONS` constant in AuthContext
- Roles are stored as strings in the `role` column of the profiles table

### 4. **Auth Context Changes**

New properties in `AuthContext`:

- `getAvailableRoles()` - Returns array of available roles with descriptions
- `updateUserRole(role: string)` - Function to update user's role

Modified functions:

- `signUp()` now takes `userData: { full_name: string }` instead of separate parameters
- `getUserRole()` returns `string | null` (role from profiles table)
- `hasPermission(permission: string)` - Check if current user has a specific permission

### 5. **Redirect Logic**

After login or role selection, users are redirected based on their role:

- `super_admin` → `/portal/super-admin`
- `property_manager` → `/portal/manager`
- `tenant` → `/portal/tenant`
- `owner` → `/portal/owner`
- No role selected → `/profile` (for role selection)

## Database Schema

### users table

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT,  -- NULL until user selects
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_role CHECK (role IS NULL OR role IN ('super_admin', 'property_manager', 'tenant', 'owner'))
);
```

### user_types table

```sql
CREATE TABLE public.user_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage Example

### Sign Up a New User

```typescript
const { signUp } = useAuth();

await signUp("user@example.com", "password123", {
  full_name: "John Doe",
});
// User is created with role = NULL and redirected to /profile
```

### Select Role from Profile Page

```typescript
const { updateUserRole } = useAuth();

await updateUserRole("tenant");
// User's role is updated and they're redirected to /portal/tenant
```

### Check Permissions

```typescript
const { hasPermission } = useAuth();

if (hasPermission("manage_assigned_properties")) {
  // Show property management features
}
```

## Migration Scripts

Run the following migration to set up the required tables:

1. **20250115_user_types_table.sql** - Creates user_types table with initial seed data

These migrations should be run in Supabase to properly set up the new schema.

## Next Steps

1. Run migrations in Supabase
2. Test signup flow
3. Verify profile page role selection
4. Test redirects based on role
5. Update any components that reference old `getUserType()` to use `getUserRole()`
