// src/hooks/usePropertyManagement.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  name: string;
  property_name?: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  zip_code?: string;
  country: string;
  postal_code?: string;
  property_type: string;
  type: string;
  status: string;
  is_active: boolean;
  total_units: number;
  occupied_units: number;
  available_units: number;
  monthly_rent?: number;
  security_deposit?: number;
  property_manager_id?: string;
  manager_id?: string;
  owner_id?: string;
  super_admin_id?: string;
  amenities?: string[];
  images?: string[];
  coordinates?: any;
  latitude?: number;
  longitude?: number;
  year_built?: number;
  square_feet?: number;
  created_at: string;
  updated_at: string;
  unit_number?: string;
  // Manager relationship
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

interface Manager {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  role: string;
  status: string;
  avatar_url?: string;
  created_at: string;
  last_login_at?: string;
}

interface PropertyFormData {
  name: string;
  property_name?: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  zip_code?: string;
  country?: string;
  postal_code?: string;
  property_type: string;
  type?: string;
  status: string;
  is_active?: boolean;
  total_units: number;
  monthly_rent?: number;
  security_deposit?: number;
  amenities?: string[];
  manager_id?: string;
  property_manager_id?: string;
}

export const usePropertyManagement = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Fetch properties with manager details using proper joins
      // First get all properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (propertiesError) {
        throw new Error(`Failed to fetch properties: ${propertiesError.message}`);
      }

      console.log(`📦 Fetched ${propertiesData?.length || 0} properties`);

      // Step 2: Get all unique manager IDs from properties
      const managerIds = new Set<string>();
      (propertiesData || []).forEach(property => {
        if (property.property_manager_id) managerIds.add(property.property_manager_id);
        if (property.manager_id) managerIds.add(property.manager_id);
      });

      console.log(`👥 Found ${managerIds.size} unique manager IDs`);

      // Step 3: Fetch all manager data in one query
      let managersMap = new Map<string, any>();
      if (managerIds.size > 0) {
        const { data: managersData, error: managersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, role, status')
          .in('id', Array.from(managerIds));

        if (managersError) {
          console.warn(`⚠️ Warning fetching managers: ${managersError.message}`);
          // Don't throw - continue without manager details
        } else {
          (managersData || []).forEach(manager => {
            managersMap.set(manager.id, manager);
          });
          console.log(`✅ Loaded ${managersMap.size} manager profiles`);
        }
      }

      // Step 4: Combine properties with manager data
      const propertiesWithManagers = (propertiesData || []).map(property => {
        // Try property_manager_id first, then manager_id
        const managerId = property.property_manager_id || property.manager_id;
        const manager = managerId ? managersMap.get(managerId) : null;

        if (managerId && !manager) {
          console.warn(`⚠️ Manager ${managerId} not found for property ${property.name}`);
        }

        return {
          id: property.id,
          name: property.name || '',
          property_name: property.property_name || property.name || '',
          description: property.description || '',
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          zip_code: property.zip_code || '',
          country: property.country || 'Kenya',
          postal_code: property.postal_code || '',
          property_type: property.property_type || property.type || 'apartment',
          type: property.type || property.property_type || 'apartment',
          status: property.status || 'active',
          is_active: property.is_active !== undefined ? property.is_active : true,
          total_units: property.total_units || 0,
          occupied_units: property.occupied_units || 0,
          available_units: property.available_units || 0,
          monthly_rent: property.monthly_rent || 0,
          security_deposit: property.security_deposit || 0,
          property_manager_id: property.property_manager_id,
          manager_id: property.manager_id,
          owner_id: property.owner_id,
          super_admin_id: property.super_admin_id,
          amenities: property.amenities || [],
          images: property.images || [],
          coordinates: property.coordinates,
          latitude: property.latitude,
          longitude: property.longitude,
          year_built: property.year_built,
          square_feet: property.square_feet,
          created_at: property.created_at,
          updated_at: property.updated_at,
          unit_number: property.unit_number,
          manager: manager || null
        };
      });

      console.log(`✅ Fetched ${propertiesWithManagers.length} properties with manager details`);
      
      // Debug: Show properties with missing managers
      const unassignedCount = propertiesWithManagers.filter(p => !p.manager && (p.manager_id || p.property_manager_id)).length;
      if (unassignedCount > 0) {
        console.warn(`⚠️ ${unassignedCount} properties have manager_id but no manager data found`);
      }
      
      setProperties(propertiesWithManagers);
    } catch (err: any) {
      console.error('Error fetching properties:', err);
      setError(err.message || 'Failed to load properties');
      toast({
        title: 'Error',
        description: 'Failed to load properties. Please check your database connection.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting to fetch managers...');
      
      // First, let's check what profiles exist and their roles
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('id, email, role, first_name, last_name, status, created_at')
        .order('created_at', { ascending: false });

      if (allProfilesError) {
        console.error('Error fetching all profiles:', allProfilesError);
        throw new Error(`Failed to fetch profiles: ${allProfilesError.message}`);
      }

      console.log('📊 All profiles found:', allProfiles?.length);
      console.log('🎭 Available roles:', [...new Set(allProfiles?.map(p => p.role))]);
      
      // Show all profiles for debugging
      if (allProfiles && allProfiles.length > 0) {
        console.table(allProfiles.map(p => ({
          id: p.id.substring(0, 8) + '...',
          email: p.email,
          role: p.role,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'No name',
          status: p.status
        })));
      }

      // Try different role filters to find managers
      let managersData = allProfiles || [];
      
      // Filter for property managers or any user that could manage properties
      const potentialManagers = managersData.filter(profile => 
        profile.role === 'property_manager' || 
        profile.role === 'super_admin' ||
        profile.role === 'admin' ||
        profile.role === 'manager'
      );

      console.log(`👥 Potential managers found: ${potentialManagers.length}`);
      
      if (potentialManagers.length === 0 && allProfiles && allProfiles.length > 0) {
        console.warn('⚠️ No specific managers found. Using all profiles as fallback.');
        // If no specific managers found, use all profiles as fallback
        // This helps with testing until you create proper property_manager users
        managersData = allProfiles;
      } else {
        managersData = potentialManagers;
      }

      // Process managers to ensure all fields have values
      const processedManagers = managersData.map(manager => ({
        id: manager.id,
        email: manager.email || '',
        first_name: manager.first_name || '',
        last_name: manager.last_name || '',
        full_name: manager.full_name || `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || manager.email,
        phone: '', // Default empty phone
        role: manager.role || 'property_manager',
        status: manager.status || 'active',
        avatar_url: '',
        created_at: manager.created_at,
        last_login_at: undefined,
      }));

      console.log(`✅ Processed ${processedManagers.length} managers to display`);
      setManagers(processedManagers);
      
      // Show toast if no managers found
      if (processedManagers.length === 0) {
        toast({
          title: 'No Managers Found',
          description: 'Create property manager users in User Management first.',
          variant: 'default',
        });
      }
    } catch (err: any) {
      console.error('❌ Error fetching managers:', err);
      setError(err.message || 'Failed to load managers');
      toast({
        title: 'Error',
        description: 'Failed to load property managers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createProperty = async (propertyData: PropertyFormData) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Creating property with data:', propertyData);
      
      // Prepare property data according to schema
      // IMPORTANT: property_name has a DEFAULT constraint, so we shouldn't include it in insert
      const propertyToCreate = {
        name: propertyData.name,
        // DO NOT include property_name - it has DEFAULT name::character varying
        description: propertyData.description || null,
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state || null,
        zip_code: propertyData.zip_code || null,
        country: propertyData.country || 'Kenya',
        postal_code: propertyData.postal_code || null,
        property_type: propertyData.property_type,
        type: propertyData.property_type,
        status: propertyData.status,
        is_active: propertyData.status === 'active',
        total_units: propertyData.total_units || 1,
        occupied_units: 0,
        available_units: propertyData.total_units || 1,
        monthly_rent: propertyData.monthly_rent || 0,
        security_deposit: propertyData.security_deposit || 0,
        property_manager_id: propertyData.manager_id || propertyData.property_manager_id || null,
        manager_id: propertyData.manager_id || propertyData.property_manager_id || null,
        amenities: propertyData.amenities || [],
        images: [],
        // Let database handle created_at and updated_at defaults
      };

      console.log('Inserting property data:', JSON.stringify(propertyToCreate, null, 2));

      const { data, error: createError } = await supabase
        .from('properties')
        .insert([propertyToCreate])
        .select()
        .single();

      if (createError) {
        console.error('Supabase create error details:', createError);
        throw new Error(`Failed to create property: ${createError.message}`);
      }

      if (data) {
        console.log('✅ Created property:', data);
        
        // Add to local state with manager info if needed
        let manager = null;
        if (data.manager_id) {
          const { data: managerData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone')
            .eq('id', data.manager_id)
            .single();
          
          manager = managerData;
        }

        const newProperty: Property = {
          id: data.id,
          name: data.name || '',
          property_name: data.property_name || data.name || '',
          description: data.description || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          country: data.country || 'Kenya',
          postal_code: data.postal_code || '',
          property_type: data.property_type || data.type || 'apartment',
          type: data.type || data.property_type || 'apartment',
          status: data.status || 'active',
          is_active: data.is_active !== undefined ? data.is_active : true,
          total_units: data.total_units || 0,
          occupied_units: data.occupied_units || 0,
          available_units: data.available_units || 0,
          monthly_rent: data.monthly_rent || 0,
          security_deposit: data.security_deposit || 0,
          property_manager_id: data.property_manager_id,
          manager_id: data.manager_id,
          owner_id: data.owner_id,
          super_admin_id: data.super_admin_id,
          amenities: data.amenities || [],
          images: data.images || [],
          coordinates: data.coordinates,
          latitude: data.latitude,
          longitude: data.longitude,
          year_built: data.year_built,
          square_feet: data.square_feet,
          created_at: data.created_at,
          updated_at: data.updated_at,
          unit_number: data.unit_number,
          manager: manager
        };

        setProperties((prev) => [newProperty, ...prev]);
        
        toast({
          title: 'Success',
          description: 'Property created successfully',
        });
        
        return newProperty;
      }
    } catch (err: any) {
      console.error('Error creating property:', err);
      setError(err.message || 'Failed to create property');
      toast({
        title: 'Error',
        description: err.message || 'Failed to create property. Please check your input.',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProperty = async (
    id: string,
    updates: Partial<PropertyFormData>
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Calculate available units based on total and occupied
      const currentProperty = properties.find(p => p.id === id);
      const newTotalUnits = updates.total_units || currentProperty?.total_units || 1;
      const currentOccupiedUnits = currentProperty?.occupied_units || 0;
      
      // Ensure occupied units don't exceed total units
      const safeOccupiedUnits = Math.min(currentOccupiedUnits, newTotalUnits);
      const availableUnits = newTotalUnits - safeOccupiedUnits;

      const updateData: any = {
        ...updates,
        // DO NOT update property_name directly - it's derived from name
        type: updates.property_type || updates.type,
        is_active: updates.status ? updates.status === 'active' : currentProperty?.is_active,
        available_units: availableUnits,
        updated_at: new Date().toISOString(),
      };

      // Remove property_name if it was included
      if (updateData.property_name) {
        delete updateData.property_name;
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      console.log('Updating property with data:', updateData);

      const { data, error: updateError } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update property: ${updateError.message}`);
      }

      if (data) {
        // Fetch manager details if manager_id changed
        let manager = null;
        if (data.manager_id) {
          const { data: managerData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone')
            .eq('id', data.manager_id)
            .single();
          
          manager = managerData;
        }

        const updatedProperty: Property = {
          ...data,
          manager
        };

        setProperties((prev) =>
          prev.map((prop) => (prop.id === id ? updatedProperty : prop))
        );
        
        toast({
          title: 'Success',
          description: 'Property updated successfully',
        });
        
        return updatedProperty;
      }
    } catch (err: any) {
      console.error('Error updating property:', err);
      setError(err.message || 'Failed to update property');
      toast({
        title: 'Error',
        description: 'Failed to update property. Please try again.',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProperty = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // Check if property has any units or tenants before deleting
      const { data: units } = await supabase
        .from('units')
        .select('id')
        .eq('property_id', id)
        .limit(1);

      if (units && units.length > 0) {
        throw new Error('Cannot delete property with existing units. Delete units first.');
      }

      const { data: tenants } = await supabase
        .from('tenant_properties')
        .select('id')
        .eq('property_id', id)
        .limit(1);

      if (tenants && tenants.length > 0) {
        throw new Error('Cannot delete property with tenants. Remove tenants first.');
      }

      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(`Failed to delete property: ${deleteError.message}`);
      }

      setProperties((prev) => prev.filter((prop) => prop.id !== id));
      
      toast({
        title: 'Success',
        description: 'Property deleted successfully',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting property:', err);
      setError(err.message || 'Failed to delete property');
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete property',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignManager = async (propertyId: string, managerId: string) => {
    setLoading(true);
    setError(null);

    try {
      const updateData = {
        property_manager_id: managerId === 'none' ? null : managerId,
        manager_id: managerId === 'none' ? null : managerId,
        updated_at: new Date().toISOString(),
      };

      const { data, error: assignError } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', propertyId)
        .select()
        .single();

      if (assignError) {
        throw new Error(`Failed to assign manager: ${assignError.message}`);
      }

      if (data) {
        // Fetch manager details
        let manager = null;
        if (data.manager_id) {
          const { data: managerData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone')
            .eq('id', data.manager_id)
            .single();
          
          manager = managerData;
        }

        const updatedProperty: Property = {
          ...data,
          manager
        };

        setProperties((prev) =>
          prev.map((prop) => (prop.id === propertyId ? updatedProperty : prop))
        );
        
        toast({
          title: 'Success',
          description: managerId === 'none' ? 'Manager unassigned successfully' : 'Manager assigned successfully',
        });
        
        return updatedProperty;
      }
    } catch (err: any) {
      console.error('Error assigning manager:', err);
      setError(err.message || 'Failed to assign manager');
      toast({
        title: 'Error',
        description: 'Failed to assign manager. Please try again.',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPropertyById = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch property: ${fetchError.message}`);
      }

      // Fetch manager details
      let manager = null;
      if (data.manager_id) {
        const { data: managerData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone')
          .eq('id', data.manager_id)
          .single();
        
        manager = managerData;
      }

      const property: Property = {
        ...data,
        manager
      };

      return property;
    } catch (err: any) {
      console.error('Error fetching property:', err);
      setError(err.message || 'Failed to fetch property');
      throw err;
    }
  };

  const searchProperties = async (query: string) => {
    try {
      const { data, error: searchError } = await supabase
        .from('properties')
        .select('*')
        .or(`name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%,property_type.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchError) {
        throw new Error(`Search failed: ${searchError.message}`);
      }

      // Get all unique manager IDs from search results
      const managerIds = new Set<string>();
      (data || []).forEach(property => {
        if (property.property_manager_id) managerIds.add(property.property_manager_id);
        if (property.manager_id) managerIds.add(property.manager_id);
      });

      // Fetch all manager data in one query
      let managersMap = new Map<string, any>();
      if (managerIds.size > 0) {
        const { data: managersData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, role, status')
          .in('id', Array.from(managerIds));

        (managersData || []).forEach(manager => {
          managersMap.set(manager.id, manager);
        });
      }

      // Combine with manager data
      const propertiesWithManagers = (data || []).map(property => {
        const managerId = property.property_manager_id || property.manager_id;
        return {
          ...property,
          manager: managerId ? managersMap.get(managerId) || null : null
        };
      });

      setProperties(propertiesWithManagers);
      return propertiesWithManagers;
    } catch (err: any) {
      console.error('Error searching properties:', err);
      setError(err.message || 'Search failed');
      return [];
    }
  };

  const getPropertyStats = () => {
    const total = properties.length;
    const active = properties.filter((p) => p.status === 'active' && p.is_active).length;
    const inactive = properties.filter((p) => p.status === 'inactive' || !p.is_active).length;
    const maintenance = properties.filter((p) => p.status === 'maintenance').length;
    const vacant = properties.filter((p) => p.status === 'vacant').length;
    const occupied = properties.filter((p) => p.status === 'occupied').length;
    const pending = properties.filter((p) => p.status === 'pending').length;

    const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0);
    const occupiedUnits = properties.reduce((sum, p) => sum + (p.occupied_units || 0), 0);
    const availableUnits = properties.reduce((sum, p) => sum + (p.available_units || 0), 0);
    const assignedProperties = new Set(properties.map(p => p.manager_id).filter(Boolean)).size;
    
    const totalRevenue = properties.reduce((sum, p) => 
      sum + ((p.monthly_rent || 0) * (p.occupied_units || 0)), 0);
    
    const totalDeposits = properties.reduce((sum, p) => 
      sum + ((p.security_deposit || 0) * (p.occupied_units || 0)), 0);

    return {
      total,
      active,
      inactive,
      maintenance,
      vacant,
      occupied,
      pending,
      totalUnits,
      occupiedUnits,
      availableUnits,
      assignedProperties,
      totalRevenue,
      totalDeposits,
      occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
      availableRate: totalUnits > 0 ? Math.round((availableUnits / totalUnits) * 100) : 0,
    };
  };

  const exportProperties = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const { data, error: exportError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (exportError) {
        throw new Error(`Export failed: ${exportError.message}`);
      }

      if (format === 'csv') {
        const headers = ['Name', 'Address', 'City', 'State', 'Country', 'Type', 'Status', 'Total Units', 'Occupied Units', 'Monthly Rent', 'Security Deposit', 'Created At'];
        const csvRows = [
          headers.join(','),
          ...(data || []).map(property => {
            const values = [
              `"${property.name || ''}"`,
              `"${property.address || ''}"`,
              `"${property.city || ''}"`,
              `"${property.state || ''}"`,
              `"${property.country || ''}"`,
              `"${property.property_type || ''}"`,
              `"${property.status || ''}"`,
              property.total_units || 0,
              property.occupied_units || 0,
              property.monthly_rent || 0,
              property.security_deposit || 0,
              `"${new Date(property.created_at).toLocaleDateString()}"`
            ];
            return values.join(',');
          })
        ];
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `properties_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `properties_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: 'Success',
        description: `${data?.length || 0} properties exported as ${format.toUpperCase()}`,
      });
    } catch (err: any) {
      console.error('Error exporting properties:', err);
      setError(err.message || 'Export failed');
      toast({
        title: 'Error',
        description: 'Failed to export properties',
        variant: 'destructive',
      });
    }
  };

  const getCities = () => {
    const cities = new Set(properties.map(p => p.city).filter(Boolean));
    return Array.from(cities);
  };

  const getPropertyTypes = () => {
    const types = new Set(properties.map(p => p.property_type).filter(Boolean));
    return Array.from(types);
  };

  // Add a refresh function
  const refresh = useCallback(async () => {
    await Promise.all([fetchProperties(), fetchManagers()]);
  }, [fetchProperties, fetchManagers]);

  useEffect(() => {
    refresh();
  }, []);

  return {
    // State
    properties,
    managers,
    loading,
    error,
    
    // Methods
    fetchProperties,
    fetchManagers,
    createProperty,
    updateProperty,
    deleteProperty,
    assignManager,
    getPropertyById,
    searchProperties,
    getPropertyStats,
    exportProperties,
    getCities,
    getPropertyTypes,
    refresh,
    
    // Helpers
    setProperties,
    setError,
  };
};