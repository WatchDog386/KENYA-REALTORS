// src/utils/permissionChecks.ts
import { UserRole, Permission } from '@/types/superAdmin';
import { ROLE_PERMISSIONS } from './roleHelpers';

export class PermissionChecker {
  private userRole: UserRole;
  private userPermissions: Permission[];

  constructor(userRole: UserRole) {
    this.userRole = userRole;
    this.userPermissions = ROLE_PERMISSIONS[userRole] || [];
  }

  // Check if user has a specific permission
  has(permission: Permission): boolean {
    return this.userPermissions.includes(permission);
  }

  // Check if user has any of the given permissions
  hasAny(permissions: Permission[]): boolean {
    return permissions.some(permission => this.has(permission));
  }

  // Check if user has all of the given permissions
  hasAll(permissions: Permission[]): boolean {
    return permissions.every(permission => this.has(permission));
  }

  // Check if user can perform an action on a resource
  can(action: string, resource?: any): boolean {
    const permissionMap: Record<string, Permission> = {
      // Property management
      'view_properties': 'manage_properties',
      'create_property': 'manage_properties',
      'edit_property': 'manage_properties',
      'delete_property': 'manage_properties',
      'assign_property_manager': 'manage_properties',
      
      // User management
      'view_users': 'manage_users',
      'create_user': 'manage_users',
      'edit_user': 'manage_users',
      'delete_user': 'manage_users',
      'suspend_user': 'manage_users',
      'change_user_role': 'manage_users',
      
      // Approval management
      'view_approvals': 'manage_approvals',
      'review_approval': 'manage_approvals',
      'approve_request': 'manage_approvals',
      'reject_request': 'manage_approvals',
      
      // Analytics
      'view_dashboard': 'view_analytics',
      'view_reports': 'view_reports',
      'export_data': 'export_data',
      
      // System settings
      'view_settings': 'manage_system_settings',
      'edit_settings': 'manage_system_settings',
      'manage_roles': 'manage_roles',
      'manage_notifications': 'manage_notifications',
      'manage_payments': 'manage_payments',
    };

    const permission = permissionMap[action];
    if (!permission) return false;

    return this.has(permission);
  }

  // Check if user can access a route based on permissions
  canAccessRoute(routePermission?: string): boolean {
    if (!routePermission) return true;
    
    // Super admin has access to everything
    if (this.userRole === 'super_admin') return true;
    
    return this.has(routePermission as Permission);
  }

  // Get all permissions for the user
  getAllPermissions(): Permission[] {
    return [...this.userPermissions];
  }

  // Check if user can edit their own profile vs others
  canEditProfile(userId: string, currentUserId: string): boolean {
    // Users can always edit their own profile
    if (userId === currentUserId) return true;
    
    // Otherwise, need manage_users permission
    return this.has('manage_users');
  }

  // Check if user can view sensitive information
  canViewSensitiveInfo(resourceOwnerId?: string, currentUserId?: string): boolean {
    // Super admin can view everything
    if (this.userRole === 'super_admin') return true;
    
    // Users can view their own sensitive info
    if (resourceOwnerId && currentUserId && resourceOwnerId === currentUserId) {
      return true;
    }
    
    // Admin can view sensitive info if they have permission
    if (this.userRole === 'admin') {
      return this.has('manage_users') || this.has('manage_properties');
    }
    
    return false;
  }

  // Check if user can export data
  canExportData(format: string): boolean {
    if (!this.has('export_data')) return false;
    
    // Additional checks for specific formats
    if (format === 'pdf') {
      return this.has('view_reports');
    }
    
    return true;
  }

  // Check if user can manage system settings
  canManageSystemSettings(category?: string): boolean {
    if (!this.has('manage_system_settings')) return false;
    
    if (category) {
      const categoryPermissions: Record<string, Permission> = {
        'security': 'manage_system_settings',
        'email': 'manage_notifications',
        'payment': 'manage_payments',
        'notifications': 'manage_notifications'
      };
      
      const requiredPermission = categoryPermissions[category];
      if (requiredPermission) {
        return this.has(requiredPermission);
      }
    }
    
    return true;
  }
}

// Helper function to create a permission checker
export const createPermissionChecker = (userRole: UserRole): PermissionChecker => {
  return new PermissionChecker(userRole);
};

// Quick permission check functions
export const canManageProperties = (userRole: UserRole): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes('manage_properties') || false;
};

export const canManageUsers = (userRole: UserRole): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes('manage_users') || false;
};

export const canManageApprovals = (userRole: UserRole): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes('manage_approvals') || false;
};

export const canViewAnalytics = (userRole: UserRole): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes('view_analytics') || false;
};

export const canManageSystemSettings = (userRole: UserRole): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes('manage_system_settings') || false;
};

// Check if user is a super admin
export const isSuperAdmin = (userRole: UserRole): boolean => {
  return userRole === 'super_admin';
};

// Check if user is an admin or super admin
export const isAdminOrSuperAdmin = (userRole: UserRole): boolean => {
  return userRole === 'super_admin' || userRole === 'admin';
};