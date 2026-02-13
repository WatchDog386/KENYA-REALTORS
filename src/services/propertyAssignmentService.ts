// src/services/propertyAssignmentService.ts
import { supabase } from '@/integrations/supabase/client';

/**
 * Property Assignment Service
 * Handles all operations for proprietor, technician, and caretaker assignments
 */

export const PropertyAssignmentService = {
  // ============================================================================
  // PROPRIETOR ASSIGNMENTS
  // ============================================================================

  async assignProprietor(
    proprietorId: string,
    propertyId: string,
    ownershipPercentage: number
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { data, error } = await supabase
      .from('proprietor_properties')
      .insert([
        {
          proprietor_id: proprietorId,
          property_id: propertyId,
          ownership_percentage: ownershipPercentage,
          assigned_by: profile?.id,
        }
      ])
      .select();

    if (error) throw error;
    return data;
  },

  async removeProprietorAssignment(assignmentId: string) {
    const { error } = await supabase
      .from('proprietor_properties')
      .update({ is_active: false })
      .eq('id', assignmentId);

    if (error) throw error;
  },

  async getPropertyProprietors(propertyId: string) {
    const { data, error } = await supabase
      .from('proprietor_properties')
      .select(`
        id,
        proprietor_id,
        ownership_percentage,
        assigned_at,
        proprietors(
          business_name,
          profiles:user_id(first_name, last_name, email)
        )
      `)
      .eq('property_id', propertyId)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  },

  async getProprietorProperties(proprietorId: string) {
    const { data, error } = await supabase
      .from('proprietor_properties')
      .select(`
        id,
        ownership_percentage,
        assigned_at,
        properties(
          id,
          name,
          address,
          city,
          state,
          monthly_rent,
          occupied_units,
          total_units
        )
      `)
      .eq('proprietor_id', proprietorId)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  },

  // ============================================================================
  // TECHNICIAN ASSIGNMENTS
  // ============================================================================

  async assignTechnician(
    technicianId: string,
    propertyId: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { data, error } = await supabase
      .from('technician_property_assignments')
      .insert([
        {
          technician_id: technicianId,
          property_id: propertyId,
          assigned_by: profile?.id,
        }
      ])
      .select();

    if (error) throw error;
    return data;
  },

  async removeTechnicianAssignment(assignmentId: string) {
    const { error } = await supabase
      .from('technician_property_assignments')
      .update({ is_active: false })
      .eq('id', assignmentId);

    if (error) throw error;
  },

  async getPropertyTechnicians(propertyId: string) {
    const { data, error } = await supabase
      .from('technician_property_assignments')
      .select(`
        id,
        technician_id,
        assigned_at,
        technicians(
          category_id,
          is_available,
          average_rating,
          total_jobs_completed,
          profiles:user_id(first_name, last_name, email, phone),
          technician_categories:category_id(id, name, description)
        )
      `)
      .eq('property_id', propertyId)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  },

  async getTechnicianProperties(technicianId: string) {
    const { data, error } = await supabase
      .from('technician_property_assignments')
      .select(`
        id,
        assigned_at,
        properties(
          id,
          name,
          address,
          city,
          state,
          status
        )
      `)
      .eq('technician_id', technicianId)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  },

  // ============================================================================
  // TECHNICIAN CATEGORIES
  // ============================================================================

  async getTechnicianCategories() {
    const { data, error } = await supabase
      .from('technician_categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getTechniciansByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('technicians')
      .select(`
        id,
        user_id,
        category_id,
        is_available,
        status,
        profiles:user_id(first_name, last_name, email)
      `)
      .eq('category_id', categoryId)
      .eq('status', 'active')
      .eq('is_available', true)
      .order('profiles.first_name', { ascending: true });

    if (error) throw error;
    return data;
  },

  // ============================================================================
  // CARETAKER ASSIGNMENTS
  // ============================================================================

  async assignCaretaker(
    caretakerId: string,
    propertyId: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Remove caretaker from previous property if assigned
    await supabase
      .from('caretakers')
      .update({ property_id: null })
      .eq('id', caretakerId);

    // Assign to new property
    const { data, error } = await supabase
      .from('caretakers')
      .update({
        property_id: propertyId,
        assigned_by: profile?.id,
        assignment_date: new Date().toISOString()
      })
      .eq('id', caretakerId)
      .select();

    if (error) throw error;
    return data;
  },

  async removeCaretaker(propertyId: string) {
    const { error } = await supabase
      .from('caretakers')
      .update({ property_id: null })
      .eq('property_id', propertyId);

    if (error) throw error;
  },

  async getPropertyCaretaker(propertyId: string) {
    const { data, error } = await supabase
      .from('caretakers')
      .select(`
        id,
        user_id,
        assignment_date,
        status,
        profiles:user_id(first_name, last_name, email, phone)
      `)
      .eq('property_id', propertyId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return error ? null : data;
  },

  async getCaretakerProperty(caretakerId: string) {
    const { data, error } = await supabase
      .from('caretakers')
      .select(`
        id,
        property_id,
        status,
        properties(
          id,
          name,
          address,
          city,
          state
        )
      `)
      .eq('id', caretakerId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return error ? null : data;
  },

  // ============================================================================
  // UTILITIES
  // ============================================================================

  async getPropertyAssignmentsSummary(propertyId: string) {
    const [proprietors, technicians, caretaker] = await Promise.all([
      this.getPropertyProprietors(propertyId),
      this.getPropertyTechnicians(propertyId),
      this.getPropertyCaretaker(propertyId)
    ]);

    return {
      proprietors: proprietors || [],
      technicians: technicians || [],
      caretaker: caretaker || null
    };
  },

  async getUserAssignments(userId: string, role: string) {
    switch (role) {
      case 'proprietor': {
        const { data: proprietor } = await supabase
          .from('proprietors')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!proprietor) return null;
        return this.getProprietorProperties(proprietor.id);
      }

      case 'technician': {
        const { data: technician } = await supabase
          .from('technicians')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!technician) return null;
        return this.getTechnicianProperties(technician.id);
      }

      case 'caretaker': {
        const { data: caretaker } = await supabase
          .from('caretakers')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!caretaker) return null;
        return this.getCaretakerProperty(caretaker.id);
      }

      default:
        return null;
    }
  }
};
