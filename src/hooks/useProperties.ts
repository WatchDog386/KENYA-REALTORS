import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

// Updated Property interface to match your actual database schema
export interface Property {
  id: string;
  uuid: string;
  name: string;
  varchar: string; // This is the property_name column
  description: string | null;
  address: string | null;
  city: string;
  created_at?: string;
  updated_at?: string;
  
  // Optional fields that might exist
  status?: string;
  type?: string;
  manager_id?: string;
  total_units?: number;
  occupied_units?: number;
  monthly_rent?: number;
  state?: string;
  zip_code?: string;
  country?: string;
  
  // Marketplace/listing fields
  title?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  images?: string[];
  amenities?: string[];
  
  // Related data
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

// Property form data for create/update operations
export interface PropertyFormData {
  name: string;
  varchar: string; // property_name field
  description?: string;
  address?: string;
  city: string;
  status?: string;
  type?: string;
  total_units?: number;
  monthly_rent?: number;
  manager_id?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

// Filters for property search
export interface PropertyFilters {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  type?: string;
  city?: string;
  status?: string;
  manager_id?: string;
  search?: string;
}

export const useProperties = (filters?: PropertyFilters) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // IMPORTANT: Check your actual table name
      const tableName = 'properties'; // Change this if your table has a different name
      
      let query = supabase
        .from(tableName)
        .select(`
          *,
          manager:profiles(id, first_name, last_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      // Apply filters if provided
      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.manager_id) {
        query = query.eq('manager_id', filters.manager_id);
      }
      
      if (filters?.minPrice !== undefined) {
        query = query.gte('monthly_rent', filters.minPrice);
      }
      
      if (filters?.maxPrice !== undefined) {
        query = query.lte('monthly_rent', filters.maxPrice);
      }
      
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,varchar.ilike.%${filters.search}%,city.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw new Error(`Failed to fetch properties: ${supabaseError.message}`);
      }

      console.log('Fetched properties:', data);
      setProperties(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching properties:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const refresh = useCallback(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const createProperty = async (propertyData: Omit<Property, 'id' | 'uuid' | 'created_at' | 'updated_at' | 'manager'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tableName = 'properties'; // Change this if needed
      
      console.log('Creating property with data:', propertyData);
      
      const { data, error: supabaseError } = await supabase
        .from(tableName)
        .insert([
          {
            name: propertyData.name,
            varchar: propertyData.varchar,
            description: propertyData.description || null,
            address: propertyData.address || null,
            city: propertyData.city,
            status: propertyData.status || 'available',
            type: propertyData.type || 'apartment',
            total_units: propertyData.total_units || 1,
            monthly_rent: propertyData.monthly_rent || 0,
            manager_id: propertyData.manager_id || null,
            state: propertyData.state || null,
            zip_code: propertyData.zip_code || null,
            country: propertyData.country || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])
        .select(`
          *,
          manager:profiles(id, first_name, last_name, email, phone)
        `)
        .single();

      if (supabaseError) {
        console.error('Supabase create error:', supabaseError);
        throw new Error(`Failed to create property: ${supabaseError.message}`);
      }

      if (data) {
        console.log('Created property:', data);
        setProperties(prev => [data, ...prev]);
        return data;
      }
    } catch (err: any) {
      console.error('Error creating property:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProperty = async (id: string, updates: Partial<PropertyFormData>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tableName = 'properties'; // Change this if needed
      
      const { data, error: supabaseError } = await supabase
        .from(tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          manager:profiles(id, first_name, last_name, email, phone)
        `)
        .single();

      if (supabaseError) {
        console.error('Supabase update error:', supabaseError);
        throw new Error(`Failed to update property: ${supabaseError.message}`);
      }

      if (data) {
        setProperties(prev => prev.map(p => p.id === id ? data : p));
        return data;
      }
    } catch (err: any) {
      console.error('Error updating property:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProperty = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tableName = 'properties'; // Change this if needed
      
      const { error: supabaseError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (supabaseError) {
        console.error('Supabase delete error:', supabaseError);
        throw new Error(`Failed to delete property: ${supabaseError.message}`);
      }

      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      console.error('Error deleting property:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const assignManager = async (propertyId: string, managerId: string | null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tableName = 'properties'; // Change this if needed
      
      const { data, error: supabaseError } = await supabase
        .from(tableName)
        .update({
          manager_id: managerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', propertyId)
        .select(`
          *,
          manager:profiles(id, first_name, last_name, email, phone)
        `)
        .single();

      if (supabaseError) {
        console.error('Supabase assign manager error:', supabaseError);
        throw new Error(`Failed to assign manager: ${supabaseError.message}`);
      }

      if (data) {
        setProperties(prev => prev.map(p => p.id === propertyId ? data : p));
        return data;
      }
    } catch (err: any) {
      console.error('Error assigning manager:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const searchProperties = async (query: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tableName = 'properties'; // Change this if needed
      
      const { data, error: supabaseError } = await supabase
        .from(tableName)
        .select(`
          *,
          manager:profiles(id, first_name, last_name, email, phone)
        `)
        .or(`name.ilike.%${query}%,varchar.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('Supabase search error:', supabaseError);
        throw new Error(`Search failed: ${supabaseError.message}`);
      }

      return data || [];
    } catch (err: any) {
      console.error('Error searching properties:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getPropertyStats = () => {
    const total = properties.length;
    const available = properties.filter(p => p.status === 'available').length;
    const occupied = properties.filter(p => p.status === 'occupied').length;
    const under_maintenance = properties.filter(p => p.status === 'under_maintenance').length;
    const closed = properties.filter(p => p.status === 'closed').length;

    const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0);
    const occupiedUnits = properties.reduce((sum, p) => sum + (p.occupied_units || 0), 0);
    const monthlyRevenue = properties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0);
    const assignedProperties = new Set(properties.map(p => p.manager_id).filter(Boolean)).size;
    const cities = new Set(properties.map(p => p.city).filter(Boolean)).size;

    return {
      total,
      available,
      occupied,
      under_maintenance,
      closed,
      totalUnits,
      occupiedUnits,
      monthlyRevenue,
      assignedProperties,
      cities,
    };
  };

  return {
    properties,
    isLoading,
    error,
    refresh,
    createProperty,
    updateProperty,
    deleteProperty,
    assignManager,
    searchProperties,
    getPropertyStats,
  };
};

// Hook for single property
export const useProperty = (id: string) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperty = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableName = 'properties'; // Change this if needed
      
      const { data, error: supabaseError } = await supabase
        .from(tableName)
        .select(`
          *,
          manager:profiles(id, first_name, last_name, email, phone)
        `)
        .eq('id', id)
        .single();

      if (supabaseError) {
        console.error('Supabase fetch property error:', supabaseError);
        throw new Error(`Failed to fetch property: ${supabaseError.message}`);
      }

      setProperty(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching property:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  const updateProperty = async (updates: Partial<PropertyFormData>) => {
    if (!property) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableName = 'properties'; // Change this if needed
      
      const { data, error: supabaseError } = await supabase
        .from(tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', property.id)
        .select(`
          *,
          manager:profiles(id, first_name, last_name, email, phone)
        `)
        .single();

      if (supabaseError) {
        console.error('Supabase update property error:', supabaseError);
        throw new Error(`Failed to update property: ${supabaseError.message}`);
      }

      if (data) {
        setProperty(data);
        return data;
      }
    } catch (err: any) {
      console.error('Error updating property:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const assignManager = async (managerId: string | null) => {
    if (!property) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableName = 'properties'; // Change this if needed
      
      const { data, error: supabaseError } = await supabase
        .from(tableName)
        .update({
          manager_id: managerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', property.id)
        .select(`
          *,
          manager:profiles(id, first_name, last_name, email, phone)
        `)
        .single();

      if (supabaseError) {
        console.error('Supabase assign manager error:', supabaseError);
        throw new Error(`Failed to assign manager: ${supabaseError.message}`);
      }

      if (data) {
        setProperty(data);
        return data;
      }
    } catch (err: any) {
      console.error('Error assigning manager:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProperty = async () => {
    if (!property) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tableName = 'properties'; // Change this if needed
      
      const { error: supabaseError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', property.id);

      if (supabaseError) {
        console.error('Supabase delete property error:', supabaseError);
        throw new Error(`Failed to delete property: ${supabaseError.message}`);
      }

      setProperty(null);
    } catch (err: any) {
      console.error('Error deleting property:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    property,
    isLoading,
    error,
    refresh: fetchProperty,
    updateProperty,
    assignManager,
    deleteProperty,
    setProperty,
  };
};