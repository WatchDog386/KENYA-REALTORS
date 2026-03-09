// src/services/caretakerService.ts
import { supabase } from '@/integrations/supabase/client';
import { Caretaker } from '@/types/newRoles';

export const caretakerService = {
  // ============================================================================
  // CARETAKER MANAGEMENT
  // ============================================================================

  // Get caretaker by user ID
  async getCaretakerByUserId(userId: string): Promise<Caretaker | null> {
    const { data, error } = await supabase
      .from('caretakers')
      .select(`
        *,
        profile:profiles(id, first_name, last_name, email, phone, avatar_url),
        property:properties(id, name, location, type),
        property_manager:profiles!property_manager_id(id, first_name, last_name, email)
      `)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') return null; // Not found
    if (error) throw error;
    return data;
  },

  // Get caretaker by ID
  async getCaretakerById(id: string): Promise<Caretaker> {
    const { data, error } = await supabase
      .from('caretakers')
      .select(`
        *,
        profile:profiles(id, first_name, last_name, email, phone, avatar_url),
        property:properties(id, name, location, type),
        property_manager:profiles!property_manager_id(id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
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
    const { data, error } = await supabase
      .from('caretakers')
      .select(`
        *,
        profile:profiles(id, first_name, last_name, email, phone, avatar_url)
      `)
      .eq('property_id', propertyId)
      .eq('status', 'active')
      .order('assignment_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get caretakers under a property manager
  async getCaretakersUnderManager(propertyManagerId: string): Promise<Caretaker[]> {
    const { data, error } = await supabase
      .from('caretakers')
      .select(`
        *,
        profile:profiles(id, first_name, last_name, email, phone, avatar_url),
        property:properties(id, name, location)
      `)
      .eq('property_manager_id', propertyManagerId)
      .eq('status', 'active')
      .order('assignment_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
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
