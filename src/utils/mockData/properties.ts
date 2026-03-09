// Mock properties data for super admin dashboard
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  property_type: string;
  status: 'active' | 'maintenance' | 'sold' | 'rented' | 'vacant';
  total_units: number;
  occupied_units: number;
  available_units: number;
  monthly_rent: number;
  manager_id?: string;
  created_at: string;
  updated_at: string;
}

export const mockProperties: Property[] = [
  {
    id: "prop-001",
    name: "Westlands Plaza",
    address: "123 Ngong Lane, Westlands",
    city: "Nairobi",
    property_type: "apartment",
    status: "active",
    total_units: 45,
    occupied_units: 38,
    available_units: 7,
    monthly_rent: 150000,
    manager_id: "mgr-001",
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "prop-002",
    name: "Kilimani Heights",
    address: "456 Forest Road, Kilimani",
    city: "Nairobi",
    property_type: "house",
    status: "active",
    total_units: 12,
    occupied_units: 10,
    available_units: 2,
    monthly_rent: 280000,
    manager_id: "mgr-002",
    created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "prop-003",
    name: "Riverside Apartments",
    address: "789 Riverside Drive",
    city: "Nairobi",
    property_type: "apartment",
    status: "active",
    total_units: 60,
    occupied_units: 52,
    available_units: 8,
    monthly_rent: 120000,
    manager_id: "mgr-003",
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "prop-004",
    name: "Garden Villas",
    address: "321 Garden Lane, Runda",
    city: "Nairobi",
    property_type: "house",
    status: "maintenance",
    total_units: 8,
    occupied_units: 6,
    available_units: 2,
    monthly_rent: 350000,
    manager_id: "mgr-001",
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "prop-005",
    name: "South C Commercial",
    address: "654 Enterprise Road, South C",
    city: "Nairobi",
    property_type: "commercial",
    status: "active",
    total_units: 30,
    occupied_units: 28,
    available_units: 2,
    monthly_rent: 200000,
    manager_id: "mgr-002",
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "prop-006",
    name: "Mombasa Beachfront",
    address: "987 Coral Street, Old Town",
    city: "Mombasa",
    property_type: "apartment",
    status: "active",
    total_units: 40,
    occupied_units: 35,
    available_units: 5,
    monthly_rent: 95000,
    manager_id: "mgr-003",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "prop-007",
    name: "Karen Estate",
    address: "111 Woodvale Lane, Karen",
    city: "Nairobi",
    property_type: "house",
    status: "active",
    total_units: 15,
    occupied_units: 14,
    available_units: 1,
    monthly_rent: 420000,
    manager_id: "mgr-001",
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "prop-008",
    name: "Parklands Suites",
    address: "222 Park Avenue, Parklands",
    city: "Nairobi",
    property_type: "apartment",
    status: "active",
    total_units: 50,
    occupied_units: 45,
    available_units: 5,
    monthly_rent: 135000,
    manager_id: "mgr-002",
    created_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function getMockProperties(limit?: number): Property[] {
  return limit ? mockProperties.slice(0, limit) : mockProperties;
}

export function getMockPropertyById(id: string): Property | undefined {
  return mockProperties.find((p) => p.id === id);
}
