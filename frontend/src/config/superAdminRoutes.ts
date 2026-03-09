// src/config/superAdminRoutes.ts
export interface SuperAdminRoute {
  title: string;
  path: string;
  icon?: string;
  description: string;
  permission?: string;
  showInNavigation: boolean;
  component?: React.ComponentType;
}

export const SUPER_ADMIN_ROUTES: SuperAdminRoute[] = [
  {
    title: 'Dashboard',
    path: '/portal/super-admin/dashboard',
    icon: 'dashboard',
    description: 'System overview and metrics',
    permission: 'view_dashboard',
    showInNavigation: true
  },
  {
    title: 'Properties Management',
    path: '/portal/super-admin/properties',
    icon: 'building',
    description: 'Manage all properties',
    permission: 'manage_properties',
    showInNavigation: true
  },
  {
    title: 'User Management',
    path: '/portal/super-admin/users',
    icon: 'users',
    description: 'Manage system users',
    permission: 'manage_users',
    showInNavigation: true
  },
  {
    title: 'Approval Queue',
    path: '/portal/super-admin/approvals',
    icon: 'check-circle',
    description: 'Review pending requests',
    permission: 'manage_approvals',
    showInNavigation: true
  },
  {
    title: 'Analytics',
    path: '/portal/super-admin/analytics',
    icon: 'bar-chart',
    description: 'System analytics and reports',
    permission: 'view_analytics',
    showInNavigation: true
  },
  {
    title: 'System Settings',
    path: '/portal/super-admin/settings',
    icon: 'settings',
    description: 'Configure system settings',
    permission: 'manage_settings',
    showInNavigation: true
  },
  {
    title: 'Leases Management',
    path: '/portal/super-admin/leases',
    icon: 'file-text',
    description: 'Manage property leases',
    permission: 'manage_leases',
    showInNavigation: true
  },
  {
    title: 'Payments Management',
    path: '/portal/super-admin/payments',
    icon: 'dollar-sign',
    description: 'View and manage payments',
    permission: 'manage_payments',
    showInNavigation: true
  },
  {
    title: 'Manager Portal',
    path: '/portal/super-admin/manager',
    icon: 'shield',
    description: 'Manager oversight',
    permission: 'manage_managers',
    showInNavigation: true
  },
  {
    title: 'Profile Management',
    path: '/portal/super-admin/profile',
    icon: 'user',
    description: 'Manage user profiles',
    permission: 'manage_profiles',
    showInNavigation: true
  },
  {
    title: 'Refund Status',
    path: '/portal/super-admin/refunds',
    icon: 'refresh-cw',
    description: 'Track deposit refunds',
    permission: 'manage_refunds',
    showInNavigation: true
  },
  {
    title: 'Applications',
    path: '/portal/super-admin/applications',
    icon: 'clipboard-list',
    description: 'Tenant applications',
    permission: 'manage_applications',
    showInNavigation: true
  },
  {
    title: 'Tenant Dashboard',
    path: '/portal/super-admin/tenants',
    icon: 'home',
    description: 'Tenant management',
    permission: 'manage_tenants',
    showInNavigation: true
  }
];

// Helper function to get navigation items
export const getNavigationItems = (permissions: string[] = []) => {
  return SUPER_ADMIN_ROUTES.filter(route => {
    // Super admin has all permissions, so show all
    if (!route.permission) return true;
    return permissions.includes(route.permission) || permissions.length === 0;
  });
};