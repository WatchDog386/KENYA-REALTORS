// Mock payments data for super admin dashboard
export interface Payment {
  id: string;
  tenant_id: string;
  property_id: string;
  lease_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  payment_date: string;
  due_date: string;
  period_start: string;
  period_end: string;
  description: string;
  created_at: string;
}

export const mockPayments: Payment[] = [
  {
    id: "payment-001",
    tenant_id: "tenant-001",
    property_id: "prop-001",
    lease_id: "lease-001",
    amount: 150000,
    currency: "KES",
    payment_method: "bank_transfer",
    status: "completed",
    payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    period_start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_end: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: "Monthly rent - Unit 101",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "payment-002",
    tenant_id: "tenant-002",
    property_id: "prop-002",
    lease_id: "lease-002",
    amount: 280000,
    currency: "KES",
    payment_method: "mpesa",
    status: "completed",
    payment_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
    period_start: new Date(Date.now() - 62 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_end: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: "Monthly rent - Villa 5",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "payment-003",
    tenant_id: "tenant-003",
    property_id: "prop-003",
    lease_id: "lease-003",
    amount: 120000,
    currency: "KES",
    payment_method: "bank_transfer",
    status: "pending",
    payment_date: null,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    period_start: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: "Monthly rent - Unit 45",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "payment-004",
    tenant_id: "tenant-004",
    property_id: "prop-001",
    lease_id: "lease-004",
    amount: 150000,
    currency: "KES",
    payment_method: "mpesa",
    status: "completed",
    payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    period_start: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_end: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: "Monthly rent - Unit 203",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "payment-005",
    tenant_id: "tenant-005",
    property_id: "prop-004",
    lease_id: "lease-005",
    amount: 350000,
    currency: "KES",
    payment_method: "bank_transfer",
    status: "completed",
    payment_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000).toISOString(),
    period_start: new Date(Date.now() - 63 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_end: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: "Monthly rent - Villa 12",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "payment-006",
    tenant_id: "tenant-001",
    property_id: "prop-005",
    lease_id: "lease-006",
    amount: 200000,
    currency: "KES",
    payment_method: "bank_transfer",
    status: "failed",
    payment_date: null,
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    period_start: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: "Monthly rent - Office 12",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "payment-007",
    tenant_id: "tenant-002",
    property_id: "prop-006",
    lease_id: "lease-007",
    amount: 95000,
    currency: "KES",
    payment_method: "mpesa",
    status: "completed",
    payment_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
    period_start: new Date(Date.now() - 61 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_end: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: "Monthly rent - Apt 8",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "payment-008",
    tenant_id: "tenant-003",
    property_id: "prop-007",
    lease_id: "lease-008",
    amount: 420000,
    currency: "KES",
    payment_method: "bank_transfer",
    status: "completed",
    payment_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString(),
    period_start: new Date(Date.now() - 64 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_end: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: "Monthly rent - Karen Estate",
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "payment-009",
    tenant_id: "tenant-004",
    property_id: "prop-008",
    lease_id: "lease-009",
    amount: 135000,
    currency: "KES",
    payment_method: "mpesa",
    status: "completed",
    payment_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() - 36 * 24 * 60 * 60 * 1000).toISOString(),
    period_start: new Date(Date.now() - 66 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_end: new Date(Date.now() - 36 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: "Monthly rent - Unit 22",
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "payment-010",
    tenant_id: "tenant-005",
    property_id: "prop-001",
    lease_id: "lease-010",
    amount: 150000,
    currency: "KES",
    payment_method: "bank_transfer",
    status: "pending",
    payment_date: null,
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    period_start: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: "Monthly rent - Unit 105",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function getMockPayments(limit?: number): Payment[] {
  return limit ? mockPayments.slice(0, limit) : mockPayments;
}

export function getMockPaymentsByStatus(status: string): Payment[] {
  return mockPayments.filter((p) => p.status === status);
}

export function getMockPaymentsByTenant(tenantId: string): Payment[] {
  return mockPayments.filter((p) => p.tenant_id === tenantId);
}

export function getTotalRevenue(): number {
  return mockPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
}
