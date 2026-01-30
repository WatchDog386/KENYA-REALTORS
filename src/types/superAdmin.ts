// src/types/superAdmin.ts

// User Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  metadata?: Record<string, any>;
}

export type UserRole = 'super_admin' | 'admin' | 'property_manager' | 'tenant' | 'guest';
export type UserStatus = 'active' | 'suspended' | 'pending' | 'inactive';

// Property Types
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  type: PropertyType;
  status: PropertyStatus;
  total_units: number;
  occupied_units: number;
  monthly_rent: number;
  manager_id?: string;
  manager?: User;
  images?: string[];
  amenities?: string[];
  description?: string;
  created_at: string;
  updated_at: string;
}

export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land' | 'other';
export type PropertyStatus = 'available' | 'occupied' | 'under_maintenance' | 'closed';

// Approval Types
export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  type: ApprovalType;
  status: ApprovalStatus;
  priority: PriorityLevel;
  submitted_by: string;
  submitted_by_user?: User;
  property_id?: string;
  property?: Property;
  attachments?: Attachment[];
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export type ApprovalType = 'property_listing' | 'tenant_application' | 'maintenance_request' | 'payment_verification' | 'contract_renewal' | 'other';
export type ApprovalStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

// Analytics Types
export interface AnalyticsData {
  revenueTrend: RevenueDataPoint[];
  occupancyTrend: OccupancyDataPoint[];
  propertyTypeDistribution: PropertyTypeData[];
  userGrowthTrend: UserGrowthDataPoint[];
  financialMetrics: FinancialMetrics;
  occupancyMetrics: OccupancyMetrics;
  userMetrics: UserMetrics;
  propertyMetrics: PropertyMetrics;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export interface OccupancyDataPoint {
  month: string;
  occupancyRate: number;
}

export interface PropertyTypeData {
  name: string;
  value: number;
}

export interface UserGrowthDataPoint {
  month: string;
  newUsers: number;
  activeUsers: number;
}

export interface FinancialMetrics {
  totalRevenue: number;
  rentCollected: number;
  maintenanceFees: number;
  otherIncome: number;
  netIncome: number;
  revenueChange: number;
  paymentStatus: {
    onTime: number;
    late: number;
    overdue: number;
  };
}

export interface OccupancyMetrics {
  occupancyRate: number;
  occupancyChange: number;
  availableUnits: number;
  occupiedUnits: number;
  maintenanceUnits: number;
}

export interface UserMetrics {
  activeUsers: number;
  userGrowth: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  avgSessionDuration: number;
  roleDistribution: {
    role: UserRole;
    count: number;
    percentage: number;
  }[];
}

export interface PropertyMetrics {
  totalProperties: number;
  availableProperties: number;
  occupiedProperties: number;
  maintenanceProperties: number;
  statusDistribution: {
    status: PropertyStatus;
    count: number;
    percentage: number;
  }[];
  topProperties: {
    id: string;
    name: string;
    type: PropertyType;
    revenue: number;
    occupancyRate: number;
  }[];
}

// System Settings Types
export interface SystemSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  email: EmailSettings;
  payment: PaymentSettings;
}

export interface GeneralSettings {
  siteName: string;
  siteUrl: string;
  adminEmail: string;
  supportEmail: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
}

export interface SecuritySettings {
  requireTwoFactor: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireMixedCase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  apiKey: string;
  enableAuditLog: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  newUserRegistration: boolean;
  newPropertyListing: boolean;
  paymentReceived: boolean;
  maintenanceRequest: boolean;
  approvalRequest: boolean;
  systemAlerts: boolean;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpEncryption: 'none' | 'ssl' | 'tls';
  fromName: string;
  fromEmail: string;
  testEmail: string;
}

export interface PaymentSettings {
  stripeEnabled: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;
  paypalEnabled: boolean;
  paypalClientId: string;
  currency: string;
  lateFeePercentage: number;
  gracePeriodDays: number;
  autoChargeEnabled: boolean;
}

// Common Types
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Permission Types
export type Permission = 
  | 'manage_properties'
  | 'manage_users'
  | 'manage_approvals'
  | 'view_analytics'
  | 'manage_system_settings'
  | 'view_reports'
  | 'export_data'
  | 'manage_roles'
  | 'manage_notifications'
  | 'manage_payments';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  includeFields: string[];
  timeframe?: string;
  filters?: Record<string, any>;
}

export interface ExportResult {
  url: string;
  filename: string;
  size: number;
  expires_at: string;
}