# Quick Reference: New Auth System

## For Developers

### Using the New Auth Context

```typescript
import { useAuth } from "@/contexts/AuthContext";

const MyComponent = () => {
  const {
    user, // UserProfile | null
    userTypes, // UserType[] - available roles from DB
    isLoading, // boolean
    error, // string | null
    getUserRole, // () => string | null
    updateUserRole, // (role: string) => Promise<void>
    isAdmin, // () => boolean
    hasPermission, // (permission: string) => boolean
  } = useAuth();

  // Get current user's role
  const currentRole = getUserRole();

  // Check if user is admin
  if (isAdmin()) {
    // Show admin features
  }

  // Check specific permission
  if (hasPermission("manage_properties")) {
    // Show feature
  }

  return <div>{user?.email}</div>;
};
```

### User Types Available

From `user_types` table:

- **tenant** - Tenant/Renter
- **property_manager** - Property Manager
- **super_admin** - Super Administrator
- **owner** - Property Owner

### Updating User Role

```typescript
const { updateUserRole } = useAuth();

// Set user's role (usually done on /profile page)
await updateUserRole("tenant");

// User will be redirected to appropriate portal automatically
```

---

## Database

### Check User Types

```sql
SELECT * FROM public.user_types WHERE is_active = true;
```

### Check User Roles

```sql
SELECT id, email, role, created_at FROM public.profiles LIMIT 10;
```

### Update User Role (Manual)

```sql
UPDATE public.profiles
SET role = 'property_manager'
WHERE email = 'user@example.com';
```

### Add New User Type

```sql
INSERT INTO public.user_types (name, description, permissions, is_active)
VALUES (
  'custom_role',
  'Custom Role Description',
  ARRAY['permission1', 'permission2'],
  true
);
```

---

## User Flow

### New User

```
1. Visit /auth → Sign up form
2. Enter email, password, full name
3. Submit → Account created with role = NULL
4. Verify email
5. Login → Redirected to /profile
6. Select role from dropdown
7. Redirected to appropriate portal
```

### Returning User

```
1. Visit /auth → Login form
2. Enter email, password
3. Submit → Check role
4. If role set → Redirect to portal
5. If role NULL → Redirect to /profile
```

---

## Routes

### Public Routes

- `/` - Home page
- `/auth` - Login/Signup
- `/auth/callback` - OAuth callback
- `/reset-password` - Password reset

### Profile Route (Any Authenticated User)

- `/profile` - User profile & role selection

### Protected Routes (Require Role)

- `/portal/super-admin/*` - Super admin dashboard (role = 'super_admin')
- `/portal/manager/*` - Manager portal (role = 'property_manager')
- `/portal/tenant/*` - Tenant portal (role = 'tenant')
- `/portal/owner/*` - Owner portal (role = 'owner')

---

## File Changes Summary

| File                                                | Change              | Type  |
| --------------------------------------------------- | ------------------- | ----- |
| `src/contexts/AuthContext.tsx`                      | Complete rewrite    | Major |
| `src/pages/Profile.tsx`                             | Complete rewrite    | Major |
| `src/pages/auth/LoginPage.tsx`                      | Update method calls | Minor |
| `src/App.tsx`                                       | Update role checks  | Minor |
| `supabase/migrations/20250115_user_types_table.sql` | New migration       | New   |
| `src/docs/AUTH_WORKFLOW.md`                         | Documentation       | New   |

---

## Deployment Steps

1. **Backup database** - Create Supabase backup
2. **Run migration** - Execute `20250115_user_types_table.sql` in Supabase
3. **Deploy code** - Push changes to production
4. **Verify** - Test signup and login flows
5. **Monitor** - Check logs for any auth errors

---

## Troubleshooting

### User sees "/profile" after login but role isn't selectable

- Check: `user_types` table has data and `is_active = true`
- Check: `users` table has `role` column set to NULL for this user
- Check: RLS policies allow authenticated users to read `user_types`

### User role shows in database but they're not redirected

- Check: `handlePostLoginRedirect()` is being called
- Check: User's role value matches one of: 'super_admin', 'property_manager', 'tenant', 'owner'
- Clear browser cache and retry

### "getUserType is not a function" error

- Update all imports to use `getUserRole()` instead
- Rebuild with `npm run build`

### Role selection dropdown empty

- Verify `user_types` table has records with `is_active = true`
- Check Supabase RLS policies for `user_types` table
- Check console for fetch errors

---

## Permission Examples

```typescript
// Super admin has all permissions
const isSuperAdmin = isAdmin(); // true for super_admin role

// Check specific permission
if (hasPermission("manage_properties")) {
  // User can manage properties
}

if (hasPermission("submit_maintenance")) {
  // User can submit maintenance requests
}
```

---

## Key Differences from Old System

| Feature         | Old                | New                       |
| --------------- | ------------------ | ------------------------- |
| Role assignment | Hardcoded emails   | Database user_types       |
| Role selection  | On signup          | On profile page           |
| Default role    | Tenant             | NULL (must select)        |
| Role change     | Can't change       | Immutable after selection |
| Role format     | user_type + tenant | role field only           |
| Permissions     | Hardcoded          | Database-driven           |
| Method          | `getUserType()`    | `getUserRole()`           |
