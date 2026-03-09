// src/services/caretakerService.ts
import { supabase } from '@/integrations/supabase/client';
import { Caretaker } from '@/types/newRoles';

export const caretakerService = {
  // ============================================================================
  // CARETAKER MANAGEMENT
  // ============================================================================

  // Get caretaker by user ID
  async getCaretakerByUserId(userId: string): Promise<Caretaker | null> {
    // First get the caretaker record
    const { data: caretakerData, error: caretakerError } = await supabase
      .from('caretakers')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (caretakerError && caretakerError.code === 'PGRST116') return null; // Not found
    if (caretakerError) {
      console.error('Error fetching caretaker:', caretakerError);
      throw caretakerError;
    }
    
    // Build the result object
    const result: any = { ...caretakerData };
    
    // Try to fetch property info (might fail due to RLS)
    if (caretakerData.property_id) {
      try {
        const { data: propertyData } = await supabase
          .from('properties')
          .select('id, name, location, type')
          .eq('id', caretakerData.property_id)
          .single();
        result.property = propertyData || null;
      } catch (e) {
        console.warn('Could not fetch property:', e);
        result.property = null;
      }
    }
    
    // Try to fetch property manager info (might fail due to RLS)
    if (caretakerData.property_manager_id) {
      try {
        const { data: managerData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('id', caretakerData.property_manager_id)
          .single();
        result.property_manager = managerData || null;
      } catch (e) {
        console.warn('Could not fetch property manager:', e);
        result.property_manager = null;
      }
    }
    
    // Try to fetch profile info
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, avatar_url')
        .eq('id', userId)
        .single();
      result.profile = profileData || null;
    } catch (e) {
      console.warn('Could not fetch profile:', e);
      result.profile = null;
    }
    
    return result;
  },

  // Get caretaker by ID
  async getCaretakerById(id: string): Promise<Caretaker> {
    // First get the caretaker record
    const { data: caretakerData, error } = await supabase
      .from('caretakers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    const result: any = { ...caretakerData };
    
    // Fetch profile
    if (caretakerData.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, avatar_url')
        .eq('id', caretakerData.user_id)
        .maybeSingle();
      result.profile = profileData || null;
    }
    
    // Fetch property
    if (caretakerData.property_id) {
      const { data: propertyData } = await supabase
        .from('properties')
        .select('id, name, location, type')
        .eq('id', caretakerData.property_id)
        .maybeSingle();
      result.property = propertyData || null;
    }
    
    // Fetch property manager
    if (caretakerData.property_manager_id) {
      const { data: managerData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', caretakerData.property_manager_id)
        .maybeSingle();
      result.property_manager = managerData || null;
    }
    
    return result;
  },

  // Create caretaker profile (by super admin or property manager)
  async createCaretaker(
    userId: string,
    propertyId: string,
    propertyManagerId: string,
    hireDate?: string
  ): Promise<Caretaker> {
    const { data, error } = await supabase
      .from('caretakers')
      .insert([{
        user_id: userId,
        property_id: propertyId,
        property_manager_id: propertyManagerId,
        hire_date: hireDate,
        status: 'active'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update caretaker profile (super admin only)
  async updateCaretaker(id: string, updates: Partial<Caretaker>): Promise<Caretaker> {
    const { data, error } = await supabase
      .from('caretakers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get caretakers for a property
  async getCaretakersForProperty(propertyId: string): Promise<Caretaker[]> {
    // First get caretakers
    const { data: caretakersData, error } = await supabase
      .from('caretakers')
      .select('*')
      .eq('property_id', propertyId)
      .eq('status', 'active')
      .order('assignment_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching caretakers:', error);
      throw error;
    }
    
    if (!caretakersData || caretakersData.length === 0) {
      return [];
    }
    
    // Get unique user IDs
    const userIds = [...new Set(caretakersData.map(c => c.user_id))];
    
    // Fetch profiles separately
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, avatar_url')
      .in('id', userIds);
    
    // Create a map of profiles
    const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
    
    // Merge profiles into caretakers
    return caretakersData.map(caretaker => ({
      ...caretaker,
      profile: profilesMap.get(caretaker.user_id) || null
    }));
  },

  // Get caretakers under a property manager
  async getCaretakersUnderManager(propertyManagerId: string): Promise<Caretaker[]> {
    // First get caretakers
    const { data: caretakersData, error } = await supabase
      .from('caretakers')
      .select('*')
      .eq('property_manager_id', propertyManagerId)
      .eq('status', 'active')
      .order('assignment_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching caretakers:', error);
      throw error;
    }
    
    if (!caretakersData || caretakersData.length === 0) {
      return [];
    }
    
    // Get unique user IDs and property IDs
    const userIds = [...new Set(caretakersData.map(c => c.user_id))];
    const propertyIds = [...new Set(caretakersData.map(c => c.property_id).filter(Boolean))];
    
    // Fetch profiles and properties separately
    const [profilesResult, propertiesResult] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, email, phone, avatar_url').in('id', userIds),
      propertyIds.length > 0 
        ? supabase.from('properties').select('id, name, location').in('id', propertyIds)
        : Promise.resolve({ data: [] })
    ]);
    
    // Create maps
    const profilesMap = new Map((profilesResult.data || []).map(p => [p.id, p]));
    const propertiesMap = new Map((propertiesResult.data || []).map(p => [p.id, p]));
    
    // Merge data
    return caretakersData.map(caretaker => ({
      ...caretaker,
      profile: profilesMap.get(caretaker.user_id) || null,
      property: caretaker.property_id ? propertiesMap.get(caretaker.property_id) || null : null
    }));
  },

  // Update caretaker performance rating
  async updatePerformanceRating(id: string, rating: number): Promise<Caretaker> {
    const { data, error } = await supabase
      .from('caretakers')
      .update({ performance_rating: rating })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Suspend caretaker
  async suspendCaretaker(id: string): Promise<Caretaker> {
    const { data, error } = await supabase
      .from('caretakers')
      .update({ status: 'suspended' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Reactivate caretaker
  async reactivateCaretaker(id: string): Promise<Caretaker> {
    const { data, error } = await supabase
      .from('caretakers')
      .update({ status: 'active' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
