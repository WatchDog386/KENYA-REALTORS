// src/utils/roleHelpers.ts
import { UserRole, Permission } from '@/types/superAdmin';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'manage_properties',
    'manage_users',
    'manage_approvals',
    'view_analytics',
    'manage_system_settings',
    'view_reports',
    'export_data',
    'manage_roles',
    'manage_notifications',
    'manage_payments'
  ],
  admin: [
    'manage_properties',
    'manage_users',
    'manage_approvals',
    'view_analytics',
    'view_reports',
    'export_data',
    'manage_notifications'
  ],
  property_manager: [
    'manage_properties',
    'manage_approvals',
    'view_analytics',
    'view_reports'
  ],
  tenant: [
    'view_reports'
  ],
  guest: []
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: 'Full system access with all permissions',
  admin: 'Administrative access with most permissions',
  property_manager: 'Manage properties and tenant applications',
  tenant: 'Tenant access for viewing their information',
  guest: 'Limited access for unauthenticated users'
};

export const DEFAULT_ROLE: UserRole = 'tenant';

// Check if a user has a specific permission
export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

// Get all permissions for a role
export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

// Check if a role can perform an action
export const canPerformAction = (
  userRole: UserRole,
  action: string,
  resource?: any
): boolean => {
  // Map actions to permissions
  const actionPermissionMap: Record<string, Permission> = {
    // Property actions
    'create:property': 'manage_properties',
    'read:property': 'manage_properties',
    'update:property': 'manage_properties',
    'delete:property': 'manage_properties',
    'assign:manager': 'manage_properties',
    
    // User actions
    'create:user': 'manage_users',
    'read:user': 'manage_users',
    'update:user': 'manage_users',
    'delete:user': 'manage_users',
    'suspend:user': 'manage_users',
    'change:role': 'manage_users',
    
    // Approval actions
    'create:approval': 'manage_approvals',
    'read:approval': 'manage_approvals',
    'update:approval': 'manage_approvals',
    'approve:request': 'manage_approvals',
    'reject:request': 'manage_approvals',
    
    // Analytics actions
    'view:analytics': 'view_analytics',
    'export:analytics': 'export_data',
    
    // Settings actions
    'update:settings': 'manage_system_settings',
    'manage:roles': 'manage_roles',
    'manage:notifications': 'manage_notifications',
    'manage:payments': 'manage_payments',
    
    // Report actions
    'view:reports': 'view_reports',
    'export:reports': 'export_data',
  };

  const permission = actionPermissionMap[action];
  if (!permission) return false;

  return hasPermission(userRole, permission);
};

// Get hierarchical role level (higher number = more permissions)
export const getRoleLevel = (role: UserRole): number => {
  const roleLevels: Record<UserRole, number> = {
    super_admin: 5,
    admin: 4,
    property_manager: 3,
    tenant: 2,
    guest: 1
  };
  
  return roleLevels[role] || 0;
};

// Check if a role can manage another role
export const canManageRole = (managerRole: UserRole, targetRole: UserRole): boolean => {
  const managerLevel = getRoleLevel(managerRole);
  const targetLevel = getRoleLevel(targetRole);
  
  // A role can only manage roles with a lower level
  return managerLevel > targetLevel;
};

// Validate role assignment
export const validateRoleAssignment = (
  assignerRole: UserRole,
  assigneeCurrentRole: UserRole,
  assigneeNewRole: UserRole
): { valid: boolean; message?: string } => {
  
  // Check if assigner can manage both current and new roles
  if (!canManageRole(assignerRole, assigneeCurrentRole)) {
    return {
      valid: false,
      message: 'You do not have permission to manage this user\'s current role'
    };
  }
  
  if (!canManageRole(assignerRole, assigneeNewRole)) {
    return {
      valid: false,
      message: 'You do not have permission to assign this role'
    };
  }
  
  // Check if trying to assign a higher or equal role
  if (getRoleLevel(assigneeNewRole) >= getRoleLevel(assignerRole)) {
    return {
      valid: false,
      message: 'You cannot assign a role equal to or higher than your own'
    };
  }
  
  return { valid: true };
};

// Get available roles for assignment by a given role
export const getAssignableRoles = (assignerRole: UserRole): UserRole[] => {
  const allRoles: UserRole[] = ['super_admin', 'admin', 'property_manager', 'tenant', 'guest'];
  
  return allRoles.filter(targetRole => 
    canManageRole(assignerRole, targetRole) && 
    getRoleLevel(targetRole) < getRoleLevel(assignerRole)
  );
};

// Format role for display
export const formatRole = (role: UserRole): string => {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Check if user is elevated (admin or super admin)
export const isElevatedUser = (role: UserRole): boolean => {
  return role === 'super_admin' || role === 'admin';
};

// Check if user can access super admin features
export const canAccessSuperAdmin = (role: UserRole): boolean => {
  return role === 'super_admin';
};