// Mock leases data for super admin dashboard
export interface Lease {
  id: string;
  property_id: string;
  unit_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'terminated' | 'expired' | 'pending' | 'draft';
  rent_amount: number;
  security_deposit: number;
  payment_day: number;
  created_at: string;
  updated_at: string;
}

export const mockLeases: Lease[] = [
  {
    id: "lease-001",
    property_id: "prop-001",
    unit_id: "unit-001",
    tenant_id: "tenant-001",
    start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "active",
    rent_amount: 150000,
    security_deposit: 150000,
    payment_day: 1,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lease-002",
    property_id: "prop-002",
    unit_id: "unit-002",
    tenant_id: "tenant-002",
    start_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "active",
    rent_amount: 280000,
    security_deposit: 280000,
    payment_day: 1,
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lease-003",
    property_id: "prop-003",
    unit_id: "unit-003",
    tenant_id: "tenant-003",
    start_date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "active",
    rent_amount: 120000,
    security_deposit: 120000,
    payment_day: 1,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lease-004",
    property_id: "prop-001",
    unit_id: "unit-004",
    tenant_id: "tenant-004",
    start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "active",
    rent_amount: 150000,
    security_deposit: 150000,
    payment_day: 5,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lease-005",
    property_id: "prop-004",
    unit_id: "unit-005",
    tenant_id: "tenant-005",
    start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "active",
    rent_amount: 350000,
    security_deposit: 350000,
    payment_day: 1,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lease-006",
    property_id: "prop-005",
    unit_id: "unit-006",
    tenant_id: "tenant-001",
    start_date: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "expired",
    rent_amount: 200000,
    security_deposit: 200000,
    payment_day: 10,
    created_at: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lease-007",
    property_id: "prop-006",
    unit_id: "unit-007",
    tenant_id: "tenant-002",
    start_date: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "active",
    rent_amount: 95000,
    security_deposit: 95000,
    payment_day: 15,
    created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lease-008",
    property_id: "prop-007",
    unit_id: "unit-008",
    tenant_id: "tenant-003",
    start_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 315 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "active",
    rent_amount: 420000,
    security_deposit: 420000,
    payment_day: 1,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lease-009",
    property_id: "prop-008",
    unit_id: "unit-009",
    tenant_id: "tenant-004",
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 330 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "active",
    rent_amount: 135000,
    security_deposit: 135000,
    payment_day: 5,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lease-010",
    property_id: "prop-001",
    unit_id: "unit-010",
    tenant_id: "tenant-005",
    start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 345 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "active",
    rent_amount: 150000,
    security_deposit: 150000,
    payment_day: 1,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lease-011",
    property_id: "prop-002",
    unit_id: "unit-011",
    tenant_id: "tenant-006",
    start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 390 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "pending",
    rent_amount: 280000,
    security_deposit: 280000,
    payment_day: 1,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function getMockLeases(limit?: number): Lease[] {
  return limit ? mockLeases.slice(0, limit) : mockLeases;
}

export function getMockLeasesByStatus(status: string): Lease[] {
  return mockLeases.filter((l) => l.status === status);
}

export function getMockLeasesByProperty(propertyId: string): Lease[] {
  return mockLeases.filter((l) => l.property_id === propertyId);
}

export function getActiveLeases(): Lease[] {
  return mockLeases.filter((l) => l.status === "active");
}

export function getTotalActiveLeases(): number {
  return getActiveLeases().length;
}
