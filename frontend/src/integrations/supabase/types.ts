// Add these types
export interface DashboardStats {
  totalProperties: number;
  activeManagers: number;
  pendingApprovals: number;
  totalRevenue: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: 'property' | 'manager' | 'refund' | 'lease' | 'user' | 'payment';
}

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'error' | 'critical' | 'success';
  action?: string;
}