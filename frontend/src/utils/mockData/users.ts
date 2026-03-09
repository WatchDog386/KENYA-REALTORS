// Mock users data for super admin dashboard
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'property_manager' | 'tenant' | 'maintenance';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  phone?: string;
  created_at: string;
  last_login_at?: string;
}

export const mockUsers: User[] = [
  {
    id: "user-001",
    email: "john.doe@realtors.com",
    first_name: "John",
    last_name: "Doe",
    role: "property_manager",
    status: "active",
    phone: "+254712345678",
    created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user-002",
    email: "jane.smith@realtors.com",
    first_name: "Jane",
    last_name: "Smith",
    role: "property_manager",
    status: "active",
    phone: "+254723456789",
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user-003",
    email: "admin@realtors.com",
    first_name: "Admin",
    last_name: "User",
    role: "super_admin",
    status: "active",
    phone: "+254734567890",
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "user-004",
    email: "maint.tech@realtors.com",
    first_name: "David",
    last_name: "Johnson",
    role: "maintenance",
    status: "active",
    phone: "+254745678901",
    created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "tenant-001",
    email: "alice.patel@tenant.com",
    first_name: "Alice",
    last_name: "Patel",
    role: "tenant",
    status: "active",
    phone: "+254756789012",
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "tenant-002",
    email: "bob.wilson@tenant.com",
    first_name: "Bob",
    last_name: "Wilson",
    role: "tenant",
    status: "active",
    phone: "+254767890123",
    created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "tenant-003",
    email: "carol.brown@tenant.com",
    first_name: "Carol",
    last_name: "Brown",
    role: "tenant",
    status: "suspended",
    phone: "+254778901234",
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "tenant-004",
    email: "eric.davis@tenant.com",
    first_name: "Eric",
    last_name: "Davis",
    role: "tenant",
    status: "active",
    phone: "+254789012345",
    created_at: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "tenant-005",
    email: "fiona.garcia@tenant.com",
    first_name: "Fiona",
    last_name: "Garcia",
    role: "tenant",
    status: "active",
    phone: "+254790123456",
    created_at: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "tenant-006",
    email: "george.martin@tenant.com",
    first_name: "George",
    last_name: "Martin",
    role: "tenant",
    status: "pending",
    phone: "+254701234567",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mgr-001",
    email: "property.mgr1@realtors.com",
    first_name: "Michael",
    last_name: "Thompson",
    role: "property_manager",
    status: "active",
    phone: "+254702345678",
    created_at: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mgr-002",
    email: "property.mgr2@realtors.com",
    first_name: "Sarah",
    last_name: "Anderson",
    role: "property_manager",
    status: "active",
    phone: "+254713456789",
    created_at: new Date(Date.now() - 220 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mgr-003",
    email: "property.mgr3@realtors.com",
    first_name: "Robert",
    last_name: "Taylor",
    role: "property_manager",
    status: "active",
    phone: "+254724567890",
    created_at: new Date(Date.now() - 190 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
];

export function getMockUsers(limit?: number): User[] {
  return limit ? mockUsers.slice(0, limit) : mockUsers;
}

export function getMockUsersByRole(role: string): User[] {
  return mockUsers.filter((u) => u.role === role);
}

export function getMockUserById(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}
