// src/services/proprietorService.ts
import { supabase } from '@/integrations/supabase/client';
import { 
  Proprietor, 
  ProprietorProperty, 
  ProprietorReport,
  ProprietorMessage 
} from '@/types/newRoles';

export const proprietorService = {
  // ============================================================================
  // PROPRIETOR MANAGEMENT
  // ============================================================================

  // Get proprietor by user ID
  async getProprietorByUserId(userId: string): Promise<Proprietor | null> {
    const { data, error } = await supabase
      .from('proprietors')
      .select(`
        *,
        profile:profiles(id, first_name, last_name, email, phone, avatar_url)
      `)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') return null; // Not found
    if (error) throw error;
    return data;
  },

  // Create proprietor profile
  async createProprietor(
    userId: string,
    businessName?: string,
    businessRegistrationNumber?: string
  ): Promise<Proprietor> {
    const { data, error } = await supabase
      .from('proprietors')
      .insert([{
        user_id: userId,
        business_name: businessName,
        business_registration_number: businessRegistrationNumber,
        status: 'active'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update proprietor profile
  async updateProprietor(id: string, updates: Partial<Proprietor>): Promise<Proprietor> {
    const { data, error } = await supabase
      .from('proprietors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ============================================================================
  // PROPRIETOR PROPERTIES
  // ============================================================================

  // Assign property to proprietor
  async assignPropertyToProprietor(
    proprietorId: string,
    propertyId: string,
    ownershipPercentage: number = 100
  ): Promise<ProprietorProperty> {
    const { data, error } = await supabase
      .from('proprietor_properties')
      .insert([{
        proprietor_id: proprietorId,
        property_id: propertyId,
        ownership_percentage: ownershipPercentage,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get proprietor's properties
  async getProprietorProperties(proprietorId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('proprietor_properties')
      .select(`
        *,
        property:properties(
          id,
          name,
          location,
          type,
          status,
          image_url,
          total_monthly_rental_expected
        )
      `)
      .eq('proprietor_id', proprietorId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get number of properties owned by proprietor
  async getPropertiesCount(proprietorId: string): Promise<number> {
    const { data, error, count } = await supabase
      .from('proprietor_properties')
      .select('id', { count: 'exact', head: true })
      .eq('proprietor_id', proprietorId)
      .eq('is_active', true);
    
    if (error) throw error;
    return count || 0;
  },

  // Remove property from proprietor
  async removePropertyFromProprietor(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('proprietor_properties')
      .update({ is_active: false })
      .eq('id', assignmentId);
    
    if (error) throw error;
  },

  // ============================================================================
  // PROPRIETOR REPORTS
  // ============================================================================

  // Create report
  async createReport(
    proprietorId: string,
    propertyId: string,
    reportType: string,
    title: string,
    description?: string,
    data?: Record<string, any>
  ): Promise<ProprietorReport> {
    const { data: result, error } = await supabase
      .from('proprietor_reports')
      .insert([{
        proprietor_id: proprietorId,
        property_id: propertyId,
        report_type: reportType,
        title,
        description,
        data,
        status: 'draft'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  // Get proprietor's reports
  async getProprietorReports(proprietorId: string, propertyId?: string): Promise<ProprietorReport[]> {
    let query = supabase
      .from('proprietor_reports')
      .select('*')
      .eq('proprietor_id', proprietorId);
    
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Update report
  async updateReport(id: string, updates: Partial<ProprietorReport>): Promise<ProprietorReport> {
    const { data, error } = await supabase
      .from('proprietor_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Approve and send report
  async approveAndSendReport(reportId: string): Promise<ProprietorReport> {
    const { data, error } = await supabase
      .from('proprietor_reports')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ============================================================================
  // PROPRIETOR MESSAGES
  // ============================================================================

  // Send message to proprietor (SuperAdmin)
  async sendMessageToProprietor(
    proprietorId: string,
    message: string,
    subject?: string,
    messageType: 'general' | 'alert' | 'report' | 'notification' = 'general'
  ): Promise<ProprietorMessage> {
    const { data, error } = await supabase
      .from('proprietor_messages')
      .insert([{
        proprietor_id: proprietorId,
        message,
        subject,
        message_type: messageType,
        is_read: false
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get proprietor's messages
  async getProprietorMessages(proprietorId: string, unreadOnly: boolean = false): Promise<ProprietorMessage[]> {
    let query = supabase
      .from('proprietor_messages')
      .select(`
        *,
        sender:profiles(id, first_name, last_name, email, avatar_url)
      `)
      .eq('proprietor_id', proprietorId);
    
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Mark message as read
  async markMessageAsRead(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('proprietor_messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId);
    
    if (error) throw error;
  },

  // Get unread message count
  async getUnreadMessageCount(proprietorId: string): Promise<number> {
    const { data, error, count } = await supabase
      .from('proprietor_messages')
      .select('id', { count: 'exact', head: true })
      .eq('proprietor_id', proprietorId)
      .eq('is_read', false);
    
    if (error) throw error;
    return count || 0;
  },

  // ============================================================================
  // COMBINED DATA FOR PROPRIETOR DASHBOARD
  // ============================================================================

  // Get complete proprietor dashboard data
  async getProprietorDashboardData(proprietorId: string) {
    const [properties, reports, messages, unreadMessageCount] = await Promise.all([
      this.getProprietorProperties(proprietorId),
      this.getProprietorReports(proprietorId),
      this.getProprietorMessages(proprietorId),
      this.getUnreadMessageCount(proprietorId)
    ]);

    return {
      properties,
      propertiesCount: properties.length,
      reports,
      recentReports: reports.slice(0, 5),
      messages,
      unreadMessages: messages.filter(m => !m.is_read),
      unreadMessageCount
    };
  }
};
