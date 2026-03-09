// Mock maintenance requests data for super admin dashboard
export interface MaintenanceRequest {
  id: string;
  property_id: string;
  unit_id: string;
  tenant_id: string;
  assigned_to?: string;
  type: 'plumbing' | 'electrical' | 'hvac' | 'structural' | 'general' | 'appliance' | 'painting' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  title: string;
  description: string;
  estimated_cost?: number;
  actual_cost?: number;
  created_at: string;
  completed_at?: string;
  notes?: string;
}

export const mockMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: "maint-001",
    property_id: "prop-001",
    unit_id: "unit-001",
    tenant_id: "tenant-001",
    assigned_to: "maint.tech@realtors.com",
    type: "plumbing",
    priority: "high",
    status: "in_progress",
    title: "Leaking faucet in kitchen",
    description: "Hot water faucet is dripping continuously",
    estimated_cost: 5000,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Technician on site, part ordered",
  },
  {
    id: "maint-002",
    property_id: "prop-002",
    unit_id: "unit-002",
    tenant_id: "tenant-002",
    assigned_to: "maint.tech@realtors.com",
    type: "electrical",
    priority: "urgent",
    status: "in_progress",
    title: "Power outage in Unit 5",
    description: "Entire unit has no power supply",
    estimated_cost: 8500,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Electrician investigating circuit breaker",
  },
  {
    id: "maint-003",
    property_id: "prop-003",
    unit_id: "unit-003",
    tenant_id: "tenant-003",
    type: "hvac",
    priority: "medium",
    status: "open",
    title: "AC not cooling properly",
    description: "Air conditioning is on but not cooling room effectively",
    estimated_cost: 6000,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Awaiting technician appointment",
  },
  {
    id: "maint-004",
    property_id: "prop-004",
    unit_id: "unit-004",
    tenant_id: "tenant-004",
    type: "general",
    priority: "low",
    status: "open",
    title: "Door hinge squeaking",
    description: "Bedroom door hinge needs lubrication",
    estimated_cost: 1000,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Simple maintenance, low priority",
  },
  {
    id: "maint-005",
    property_id: "prop-005",
    unit_id: "unit-005",
    tenant_id: "tenant-005",
    assigned_to: "maint.tech@realtors.com",
    type: "appliance",
    priority: "high",
    status: "completed",
    title: "Refrigerator not working",
    description: "Built-in refrigerator has stopped cooling",
    estimated_cost: 12000,
    actual_cost: 11500,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Replaced compressor. Tested and working.",
  },
  {
    id: "maint-006",
    property_id: "prop-006",
    unit_id: "unit-006",
    tenant_id: "tenant-002",
    type: "painting",
    priority: "low",
    status: "on_hold",
    title: "Wall paint peeling",
    description: "Paint is peeling off in master bedroom",
    estimated_cost: 8000,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "On hold pending tenant confirmation",
  },
  {
    id: "maint-007",
    property_id: "prop-007",
    unit_id: "unit-007",
    tenant_id: "tenant-001",
    assigned_to: "maint.tech@realtors.com",
    type: "structural",
    priority: "urgent",
    status: "in_progress",
    title: "Ceiling crack",
    description: "Large crack in living room ceiling needs immediate inspection",
    estimated_cost: 25000,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Structural engineer called for assessment",
  },
  {
    id: "maint-008",
    property_id: "prop-008",
    unit_id: "unit-008",
    tenant_id: "tenant-003",
    type: "general",
    priority: "low",
    status: "completed",
    title: "Replace window blinds",
    description: "Broken blinds in bedroom need replacement",
    estimated_cost: 3500,
    actual_cost: 3500,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "New blinds installed successfully",
  },
  {
    id: "maint-009",
    property_id: "prop-001",
    unit_id: "unit-009",
    tenant_id: "tenant-005",
    type: "plumbing",
    priority: "medium",
    status: "open",
    title: "Clogged shower drain",
    description: "Shower drain is draining very slowly",
    estimated_cost: 3000,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Pending plumber availability",
  },
  {
    id: "maint-010",
    property_id: "prop-002",
    unit_id: "unit-010",
    tenant_id: "tenant-006",
    type: "other",
    priority: "low",
    status: "cancelled",
    title: "Loose cabinet door",
    description: "Kitchen cabinet door is loose and squeaks",
    estimated_cost: 1500,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Cancelled - tenant fixed it themselves",
  },
];

export function getMockMaintenanceRequests(limit?: number): MaintenanceRequest[] {
  return limit ? mockMaintenanceRequests.slice(0, limit) : mockMaintenanceRequests;
}

export function getMockMaintenanceByStatus(status: string): MaintenanceRequest[] {
  return mockMaintenanceRequests.filter((m) => m.status === status);
}

export function getOpenMaintenanceCount(): number {
  return mockMaintenanceRequests.filter((m) => m.status === "open").length;
}

export function getUrgentMaintenanceCount(): number {
  return mockMaintenanceRequests.filter(
    (m) => m.priority === "urgent" || m.priority === "high"
  ).length;
}
