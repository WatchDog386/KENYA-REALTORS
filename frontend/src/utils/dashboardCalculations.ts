// src/utils/dashboardCalculations.ts
import { 
  Property, 
  User, 
  ApprovalRequest,
  FinancialMetrics,
  OccupancyMetrics,
  UserMetrics,
  PropertyMetrics
} from '@/types/superAdmin';

export interface DashboardStats {
  financial: FinancialMetrics;
  occupancy: OccupancyMetrics;
  users: UserMetrics;
  properties: PropertyMetrics;
  approvals: {
    pending: number;
    approved: number;
    rejected: number;
    today: number;
    thisWeek: number;
  };
}

export const calculateFinancialMetrics = (
  properties: Property[],
  previousPeriodProperties?: Property[]
): FinancialMetrics => {
  const totalRevenue = properties.reduce((sum, property) => 
    sum + (property.monthly_rent || 0), 0
  );
  
  const rentCollected = properties
    .filter(p => p.status === 'occupied')
    .reduce((sum, property) => sum + (property.monthly_rent || 0), 0);
  
  const maintenanceFees = properties
    .filter(p => p.status === 'under_maintenance')
    .reduce((sum, property) => sum + (property.monthly_rent || 0) * 0.1, 0); // 10% of rent for maintenance
  
  const otherIncome = totalRevenue * 0.05; // 5% other income
  
  const netIncome = totalRevenue - maintenanceFees;
  
  let revenueChange = 0;
  if (previousPeriodProperties) {
    const previousRevenue = previousPeriodProperties.reduce((sum, property) => 
      sum + (property.monthly_rent || 0), 0
    );
    revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 100;
  }
  
  const occupiedProperties = properties.filter(p => p.status === 'occupied').length;
  const totalOccupiedUnits = properties.reduce((sum, p) => sum + (p.occupied_units || 0), 0);
  const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0);
  
  // Mock payment status (in real app, this would come from payment data)
  const paymentStatus = {
    onTime: 75, // 75% on time
    late: 20,   // 20% late
    overdue: 5  // 5% overdue
  };
  
  return {
    totalRevenue,
    rentCollected,
    maintenanceFees,
    otherIncome,
    netIncome,
    revenueChange,
    paymentStatus
  };
};

export const calculateOccupancyMetrics = (
  properties: Property[],
  previousPeriodProperties?: Property[]
): OccupancyMetrics => {
  const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + (p.occupied_units || 0), 0);
  const availableUnits = totalUnits - occupiedUnits;
  const maintenanceUnits = properties
    .filter(p => p.status === 'under_maintenance')
    .reduce((sum, p) => sum + (p.total_units || 0), 0);
  
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
  
  let occupancyChange = 0;
  if (previousPeriodProperties) {
    const previousTotalUnits = previousPeriodProperties.reduce((sum, p) => sum + (p.total_units || 0), 0);
    const previousOccupiedUnits = previousPeriodProperties.reduce((sum, p) => sum + (p.occupied_units || 0), 0);
    const previousOccupancyRate = previousTotalUnits > 0 ? (previousOccupiedUnits / previousTotalUnits) * 100 : 0;
    
    occupancyChange = previousOccupancyRate > 0 
      ? ((occupancyRate - previousOccupancyRate) / previousOccupancyRate) * 100
      : 100;
  }
  
  return {
    occupancyRate,
    occupancyChange,
    availableUnits,
    occupiedUnits,
    maintenanceUnits
  };
};

export const calculateUserMetrics = (
  users: User[],
  previousPeriodUsers?: User[]
): UserMetrics => {
  const activeUsers = users.filter(u => u.status === 'active').length;
  
  let userGrowth = 0;
  if (previousPeriodUsers) {
    const previousActiveUsers = previousPeriodUsers.filter(u => u.status === 'active').length;
    userGrowth = previousActiveUsers > 0 
      ? ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100
      : 100;
  }
  
  // Calculate role distribution
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const roleDistribution = Object.entries(roleCounts).map(([role, count]) => ({
    role: role as any,
    count,
    percentage: (count / users.length) * 100
  }));
  
  // Mock activity metrics (in real app, these would come from analytics)
  const dailyActiveUsers = Math.floor(activeUsers * 0.3); // 30% daily active
  const weeklyActiveUsers = Math.floor(activeUsers * 0.6); // 60% weekly active
  const monthlyActiveUsers = Math.floor(activeUsers * 0.8); // 80% monthly active
  const avgSessionDuration = 8.5; // minutes
  
  return {
    activeUsers,
    userGrowth,
    dailyActiveUsers,
    weeklyActiveUsers,
    monthlyActiveUsers,
    avgSessionDuration,
    roleDistribution
  };
};

export const calculatePropertyMetrics = (properties: Property[]): PropertyMetrics => {
  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => p.status === 'available').length;
  const occupiedProperties = properties.filter(p => p.status === 'occupied').length;
  const maintenanceProperties = properties.filter(p => p.status === 'under_maintenance').length;
  
  // Calculate status distribution
  const statusCounts = properties.reduce((acc, property) => {
    acc[property.status] = (acc[property.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    status: status as any,
    count,
    percentage: (count / totalProperties) * 100
  }));
  
  // Find top performing properties (by revenue)
  const topProperties = properties
    .map(property => ({
      id: property.id,
      name: property.name,
      type: property.type,
      revenue: property.monthly_rent || 0,
      occupancyRate: property.total_units > 0 
        ? ((property.occupied_units || 0) / property.total_units) * 100 
        : 0
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5); // Top 5 properties
  
  return {
    totalProperties,
    availableProperties,
    occupiedProperties,
    maintenanceProperties,
    statusDistribution,
    topProperties
  };
};

export const calculateApprovalMetrics = (approvals: ApprovalRequest[]) => {
  const pending = approvals.filter(a => a.status === 'pending').length;
  const approved = approvals.filter(a => a.status === 'approved').length;
  const rejected = approvals.filter(a => a.status === 'rejected').length;
  
  const today = new Date().toDateString();
  const approvalsToday = approvals.filter(a => {
    const approvalDate = new Date(a.created_at).toDateString();
    return approvalDate === today;
  }).length;
  
  const thisWeek = approvals.filter(a => {
    const now = new Date();
    const approvalDate = new Date(a.created_at);
    const diffTime = Math.abs(now.getTime() - approvalDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;
  
  return {
    pending,
    approved,
    rejected,
    today: approvalsToday,
    thisWeek
  };
};

export const calculateDashboardStats = (
  properties: Property[],
  users: User[],
  approvals: ApprovalRequest[],
  previousPeriodData?: {
    properties?: Property[];
    users?: User[];
  }
): DashboardStats => {
  const financial = calculateFinancialMetrics(
    properties,
    previousPeriodData?.properties
  );
  
  const occupancy = calculateOccupancyMetrics(
    properties,
    previousPeriodData?.properties
  );
  
  const userMetrics = calculateUserMetrics(
    users,
    previousPeriodData?.users
  );
  
  const propertyMetrics = calculatePropertyMetrics(properties);
  
  const approvalMetrics = calculateApprovalMetrics(approvals);
  
  return {
    financial,
    occupancy,
    users: userMetrics,
    properties: propertyMetrics,
    approvals: approvalMetrics
  };
};

// Calculate trends over time
export const calculateRevenueTrend = (
  properties: Property[],
  months: number = 6
): Array<{ month: string; revenue: number }> => {
  const monthsAgo = new Date();
  monthsAgo.setMonth(monthsAgo.getMonth() - months);
  
  // Group properties by month (simplified - in real app, use actual transaction data)
  const trend = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    // Mock revenue calculation (in real app, use actual revenue data)
    const monthRevenue = properties.reduce((sum, property) => {
      // Add some variation based on property type and occupancy
      const baseRevenue = property.monthly_rent || 0;
      const variation = 0.9 + (Math.random() * 0.2); // 90-110% variation
      return sum + (baseRevenue * variation);
    }, 0);
    
    trend.push({
      month: monthNames[date.getMonth()],
      revenue: Math.round(monthRevenue)
    });
  }
  
  return trend;
};

export const calculateOccupancyTrend = (
  properties: Property[],
  months: number = 6
): Array<{ month: string; occupancyRate: number }> => {
  const trend = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    // Mock occupancy trend (in real app, use historical data)
    const baseOccupancy = properties.reduce((sum, p) => {
      const occupancy = p.total_units > 0 ? (p.occupied_units || 0) / p.total_units : 0;
      return sum + occupancy;
    }, 0) / properties.length;
    
    // Add some variation
    const variation = -0.05 + (Math.random() * 0.1); // -5% to +5% variation
    const occupancyRate = Math.min(100, Math.max(0, (baseOccupancy * 100) + (variation * 100)));
    
    trend.push({
      month: monthNames[date.getMonth()],
      occupancyRate: Math.round(occupancyRate)
    });
  }
  
  return trend;
};

// Calculate growth rate
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Format numbers for display
export const formatNumber = (num: number, decimals: number = 0): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(decimals) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(decimals) + 'K';
  }
  return num.toFixed(decimals);
};

// Calculate average values
export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
};

// Calculate percentage
export const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return (part / total) * 100;
};