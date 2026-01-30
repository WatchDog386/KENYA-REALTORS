# UserManagement Component Enhancement Guide

## Overview
The UserManagement component is already fully functional but can be enhanced to display roles and permissions from the new `useRoles` integration.

## Current Status
✅ Component exists at: `src/components/portal/super-admin/UserManagement.tsx`
✅ Already uses `useUserManagement` hook
✅ Can easily integrate role display

## Enhancement Options

### Option 1: Display Roles in User List (Simple)
Add a new column in the user table to show assigned roles using the profile's `role` field.

```tsx
<TableCell>
  <Badge variant="outline">{user.role}</Badge>
</TableCell>
```

### Option 2: Full Roles Integration (Advanced)
Replace user fetching with the enhanced `fetchUsersWithRoles()` method:

```tsx
// In UserManagement component
const { fetchUsersWithRoles } = useUserManagement();

// When loading users
const users = await fetchUsersWithRoles(currentPage);

// This returns users with:
// - roles: Role[]
// - permissions: string[]
// - assigned_roles: UserRole[]
```

### Option 3: Role Assignment Dialog (Advanced)
Add a dialog to assign/remove roles to users:

```tsx
const { assignRoleToUser, removeRoleFromUser } = useRoles();
const { fetchRoles } = useRoles();

// In assignment dialog
<RoleAssignmentForm userId={selectedUserId} />
```

## Implementation Timeline

The UserManagement component is working well and doesn't require immediate changes. The enhancements I've implemented enable you to:

1. **Now**: Use the basic `useUserManagement` hook as-is
2. **Later**: Add roles display by integrating `fetchUsersWithRoles`
3. **Advanced**: Add role assignment UI for administrators

## Key Integration Points

- `useRoles` hook: For all role operations
- `fetchUsersWithRoles`: To get users with full role data
- `assignRoleToUser`: To assign roles to users
- `removeRoleFromUser`: To unassign roles

## Testing the Enhancement

Once ready to implement:

```typescript
import { useUserManagement } from '@/hooks/useUserManagement';
import { useRoles } from '@/hooks/useRoles';

// In your component
const { fetchUsersWithRoles } = useUserManagement();
const { fetchRoles, assignRoleToUser } = useRoles();

// Load users with roles
const users = await fetchUsersWithRoles(1);
// users[0].roles, users[0].permissions available
```

## Notes

- The UserManagement component is stable and fully functional
- All role integration is backwards compatible
- No breaking changes to existing functionality
- Can be enhanced incrementally as needed

---

**Status**: Ready for optional enhancement
**Priority**: Low (system works without it)
**Complexity**: Medium (adds new UI)
