// Central export for all mock data
export * from './properties';
export * from './users';
export * from './payments';
export * from './leases';
export * from './approvals';
export * from './maintenance';

// Convenience functions
export function generateDashboardStats() {
  const { getMockProperties } = require('./properties');
  const { getMockUsers, getMockUsersByRole } = require('./users');
  const { getTotalRevenue } = require('./payments');
  const { getTotalActiveLeases } = require('./leases');
  const { getPendingApprovalsCount } = require('./approvals');
  const { getUrgentMaintenanceCount } = require('./maintenance');

  const totalProperties = getMockProperties().length;
  const activeUsers = getMockUsersByRole('tenant').length;
  const pendingApprovals = getPendingApprovalsCount();
  const totalRevenue = getTotalRevenue();
  const totalLeases = getTotalActiveLeases();
  const systemHealth = 98;

  return {
    totalProperties,
    activeUsers,
    pendingApprovals,
    totalRevenue,
    totalLeases,
    systemHealth,
  };
}
