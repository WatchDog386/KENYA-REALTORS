# User Synchronization Documentation

## Overview

The super admin dashboard now uses a two-table system for managing users:

1. **auth.users** - Supabase authentication table (source of truth for login credentials)
2. **profiles** - Custom table (synced from auth.users, contains user metadata)

## Architecture

```
┌─────────────────┐
│  User Signup    │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  auth.users (created)│
└────────┬─────────────┘
         │
         │ TRIGGER: on_auth_user_created
         │
         ▼
┌──────────────────────┐
│ profiles (synced)    │
│ - id                 │
│ - email              │
│ - first_name         │
│ - last_name          │
│ - role               │
│ - user_type          │
│ - status             │
│ - is_active          │
│ - created_at         │
│ - updated_at         │
└──────────────────────┘
         │
         │ Super Admin reads
         │
         ▼
┌──────────────────────┐
│ SuperAdmin Dashboard │
│ User Management      │
└──────────────────────┘
```

## How It Works

### 1. User Creation Flow

When a user signs up:

```
User Registration → auth.users table → Trigger fires
                                        ↓
                              handle_new_user() function
                                        ↓
                              Inserts/Updates profiles table
```

**Key Details:**
- The `on_auth_user_created` trigger fires automatically when a new user is created in `auth.users`
- The `handle_new_user()` function extracts user metadata from `raw_user_meta_data`
- Data is inserted into the `profiles` table with proper defaults
- The `user_type` column is kept in sync with the `role` column

### 2. Dashboard Fetch Flow

When super admin views users:

```
Super Admin Dashboard → userSyncService.getAllUsers()
                              ↓
                        Queries profiles table
                              ↓
                        Returns User[] with auth data
                              ↓
                        Display in User Management UI
```

**Flow:**
1. UserManagementNew component calls `loadUsers()`
2. `loadUsers()` calls `userSyncService.getAllUsers()`
3. Service queries the `profiles` table
4. Profiles table is synced from auth.users via trigger
5. Data is displayed in the UI

## Service: userSyncService

Located at: `src/services/api/userSyncService.ts`

### Key Methods

#### `getAllUsers(): Promise<UserProfile[]>`
Fetches all users from the profiles table.
```typescript
const users = await userSyncService.getAllUsers();
```

#### `getUsersByRole(role: string): Promise<UserProfile[]>`
Fetches users filtered by role.
```typescript
const managers = await userSyncService.getUsersByRole('property_manager');
```

#### `getUserById(userId: string): Promise<UserProfile | null>`
Fetches a specific user by ID.
```typescript
const user = await userSyncService.getUserById(userId);
```

#### `updateUserRole(userId: string, role: string, status?: string): Promise<UserProfile | null>`
Updates a user's role and optional status.
```typescript
await userSyncService.updateUserRole(userId, 'property_manager', 'active');
```

#### `verifySync(): Promise<SyncStatus>`
Verifies that auth.users and profiles are in sync.
```typescript
const status = await userSyncService.verifySync();
console.log(`${status.profilesCount} users synced`);
```

## Database Triggers

### on_auth_user_created

**When:** After a user is inserted into `auth.users`

**What it does:**
1. Extracts role from `raw_user_meta_data` (defaults to 'tenant')
2. Inserts user into `profiles` table with:
   - id, email, first_name, last_name from auth.users
   - role and user_type from metadata
   - status: 'active', is_active: true (defaults)
   - created_at, updated_at (timestamps)

**Example:**
```sql
-- User signs up with metadata:
-- raw_user_meta_data: { role: 'property_manager', first_name: 'John', last_name: 'Doe' }

-- Trigger automatically creates profile:
INSERT INTO profiles (
    id, email, first_name, last_name, role, user_type, status, is_active
) VALUES (
    '<user_id>',
    '<email>',
    'John',
    'Doe',
    'property_manager',
    'property_manager',
    'active',
    true
);
```

## RLS Policies

### Super Admin Access

```sql
-- Super Admin can view all users
CREATE POLICY "super_admin_view_all_users" 
ON public.profiles FOR SELECT 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Super Admin can update any user
CREATE POLICY "super_admin_update_users" 
ON public.profiles FOR UPDATE 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
)
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);
```

### User Own Profile

```sql
-- Users can manage their own profile
CREATE POLICY "users_manage_own_profile" 
ON public.profiles FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

## Component Implementation

### UserManagementNew Component

The user management component uses the sync service:

```typescript
const loadUsers = async () => {
    // 1. Verify sync status
    const syncStatus = await userSyncService.verifySync();
    
    // 2. Fetch all users from profiles table
    const allUsers = await userSyncService.getAllUsers();
    
    // 3. Map to component User interface
    const typedUsers: User[] = allUsers.map(u => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        // ... other fields
    }));
    
    // 4. Calculate statistics
    // 5. Update component state
};
```

## Synchronization Guarantee

### How It Works

1. **Automatic Sync:** The trigger ensures automatic sync on signup
2. **Manual Sync:** For existing users, the migration runs a sync function
3. **Verification:** The `verifySync()` method checks consistency

### What Gets Synced

From `auth.users`:
```
id                      → profiles.id
email                   → profiles.email
raw_user_meta_data.first_name  → profiles.first_name
raw_user_meta_data.last_name   → profiles.last_name
raw_user_meta_data.role        → profiles.role
created_at              → profiles.created_at
updated_at              → profiles.updated_at
```

## Troubleshooting

### Issue: Users not appearing in dashboard

**Solutions:**
1. Verify RLS policies allow super admin to read profiles:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

2. Check if users exist in profiles table:
   ```sql
   SELECT COUNT(*) FROM public.profiles;
   ```

3. Verify sync status:
   ```typescript
   const status = await userSyncService.verifySync();
   console.log(status);
   ```

### Issue: Trigger not firing

**Check:**
1. Trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```

### Issue: RLS blocking access

**Check:**
1. User has super_admin role:
   ```sql
   SELECT role FROM profiles WHERE id = '<user_id>';
   ```

2. Policy allows super admin access:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'profiles' 
   AND policyname = 'super_admin_view_all_users';
   ```

## Best Practices

1. **Always use userSyncService** for user queries in components
2. **Never query auth.users directly** from client code
3. **Keep role and user_type in sync** in the trigger
4. **Verify sync status** on dashboard load
5. **Log all sync operations** for debugging

## Migration Files

- `20260204_emergency_fix_rls_recursion.sql` - Initial RLS fix
- `20260205_enhance_user_sync.sql` - User sync enhancement

## Related Files

- Component: `src/components/portal/super-admin/UserManagementNew.tsx`
- Service: `src/services/api/userSyncService.ts`
- Types: Check interfaces in `src/types/superAdmin.ts` or `superAdminService.ts`
