import { supabase } from '../supabase';

export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  type: 'apartment' | 'house' | 'condo' | 'townhouse';
  status: 'occupied' | 'vacant' | 'maintenance';
  is_featured: boolean;
  images: string[];
  amenities: string[];
  created_at: string;
  updated_at: string;
}

// Mock data for development
export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Modern Downtown Apartment',
    description: 'Beautiful modern apartment in the heart of downtown',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip_code: '10001',
    price: 2500,
    bedrooms: 2,
    bathrooms: 2,
    square_feet: 1200,
    type: 'apartment',
    status: 'occupied',
    is_featured: true,
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00'],
    amenities: ['Parking', 'Gym', 'Pool'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  // Add more mock properties as needed
];

export const propertyService = {
  // Fetch all properties
  async getProperties(filters?: {
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    type?: string;
    city?: string;
  }) {
    let query = supabase.from('properties').select('*');

    if (filters?.minPrice) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters?.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }
    if (filters?.bedrooms) {
      query = query.gte('bedrooms', filters.bedrooms);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data as Property[];
  },

  // Get single property by ID
  async getPropertyById(id: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Property;
  },

  // Create new property
  async createProperty(property: Omit<Property, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('properties')
      .insert([property])
      .select()
      .single();

    if (error) throw error;
    return data as Property;
  },

  // Update property
  async updateProperty(id: string, updates: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Property;
  },

  // Delete property
  async deleteProperty(id: string) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Toggle featured status
  async toggleFeatured(id: string, isFeatured: boolean) {
    const { data, error } = await supabase
      .from('properties')
      .update({ is_featured: isFeatured })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Property;
  },
};