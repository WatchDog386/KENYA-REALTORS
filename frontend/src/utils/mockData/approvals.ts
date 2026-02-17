// Mock approvals data for super admin dashboard
export interface Approval {
  id: string;
  tenant_id: string;
  property_id: string;
  type: 'lease_approval' | 'maintenance_approval' | 'refund_approval' | 'lease_termination';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  title: string;
  description: string;
  requester_id: string;
  requester_name: string;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export const mockApprovals: Approval[] = [
  {
    id: "approval-001",
    tenant_id: "tenant-006",
    property_id: "prop-002",
    type: "lease_approval",
    status: "pending",
    title: "New Lease Application",
    description: "George Martin is applying for a lease at Karen Estate",
    requester_id: "mgr-001",
    requester_name: "Michael Thompson",
    requested_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Application under review",
  },
  {
    id: "approval-002",
    tenant_id: "tenant-004",
    property_id: "prop-001",
    type: "maintenance_approval",
    status: "pending",
    title: "Maintenance Request",
    description: "Roof repair needed in Unit 203",
    requester_id: "tenant-004",
    requester_name: "Eric Davis",
    requested_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Pending contractor availability",
  },
  {
    id: "approval-003",
    tenant_id: "tenant-001",
    property_id: "prop-005",
    type: "refund_approval",
    status: "pending",
    title: "Refund Request",
    description: "Security deposit refund for completed lease",
    requester_id: "tenant-001",
    requester_name: "Alice Patel",
    requested_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Pending final inspection",
  },
  {
    id: "approval-004",
    tenant_id: "tenant-003",
    property_id: "prop-003",
    type: "lease_termination",
    status: "pending",
    title: "Early Lease Termination",
    description: "Carol Brown requests early termination of lease",
    requester_id: "tenant-003",
    requester_name: "Carol Brown",
    requested_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Awaiting management decision",
  },
  {
    id: "approval-005",
    tenant_id: "tenant-002",
    property_id: "prop-006",
    type: "lease_approval",
    status: "approved",
    title: "Lease Renewal",
    description: "Bob Wilson lease renewal application",
    requester_id: "mgr-003",
    requester_name: "Robert Taylor",
    requested_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_by: "admin-001",
    notes: "Approved without issues",
  },
  {
    id: "approval-006",
    tenant_id: "tenant-005",
    property_id: "prop-007",
    type: "maintenance_approval",
    status: "approved",
    title: "HVAC System Upgrade",
    description: "Installation of new HVAC system",
    requester_id: "mgr-001",
    requester_name: "Michael Thompson",
    requested_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_by: "admin-001",
    notes: "Approved. Work completed successfully.",
  },
  {
    id: "approval-007",
    tenant_id: "tenant-001",
    property_id: "prop-001",
    type: "refund_approval",
    status: "rejected",
    title: "Refund Request",
    description: "Partial refund request for damages",
    requester_id: "tenant-001",
    requester_name: "Alice Patel",
    requested_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_by: "admin-001",
    notes: "Rejected - Damages not covered under policy",
  },
  {
    id: "approval-008",
    tenant_id: "tenant-004",
    property_id: "prop-008",
    type: "maintenance_approval",
    status: "approved",
    title: "Plumbing Repair",
    description: "Fix leaking pipe in Unit 22",
    requester_id: "tenant-004",
    requester_name: "Eric Davis",
    requested_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_by: "mgr-002",
    notes: "Approved and completed",
  },
  {
    id: "approval-009",
    tenant_id: "tenant-006",
    property_id: "prop-004",
    type: "lease_approval",
    status: "pending",
    title: "Lease Application - George Martin",
    description: "New lease application awaiting review",
    requester_id: "mgr-001",
    requester_name: "Michael Thompson",
    requested_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Background check in progress",
  },
  {
    id: "approval-010",
    tenant_id: "tenant-002",
    property_id: "prop-002",
    type: "lease_termination",
    status: "cancelled",
    title: "Lease Termination Request",
    description: "Bob Wilson cancels termination request",
    requester_id: "tenant-002",
    requester_name: "Bob Wilson",
    requested_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_by: "tenant-002",
    notes: "Request cancelled by tenant",
  },
];

export function getMockApprovals(limit?: number): Approval[] {
  return limit ? mockApprovals.slice(0, limit) : mockApprovals;
}

export function getMockApprovalsByStatus(status: string): Approval[] {
  return mockApprovals.filter((a) => a.status === status);
}

export function getPendingApprovalsCount(): number {
  return mockApprovals.filter((a) => a.status === "pending").length;
}

export function getMockApprovalsByType(type: string): Approval[] {
  return mockApprovals.filter((a) => a.type === type);
}
