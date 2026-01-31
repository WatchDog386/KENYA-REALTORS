import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Refund {
  id: string;
  payment_id: string;
  tenant_id: string;
  property_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'failed';
  reason: string;
  requested_by: string;
  reviewed_by?: string;
  review_notes?: string;
  processed_at?: string;
  details?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  tenant?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  property?: {
    name: string;
    address: string;
  };
  payment?: {
    amount: number;
    payment_date: string;
  };
}

export const useRefundTracking = () => {
  const [loading, setLoading] = useState(false);
  const [refunds, setRefunds] = useState<Refund[]>([]);

  const fetchRefunds = useCallback(async (filters?: {
    status?: string;
    property_id?: string;
    tenant_id?: string;
  }) => {
    try {
      setLoading(true);

      let query = supabase
        .from('refunds')
        .select(`
          *,
          tenant:users!refunds_tenant_id_fkey (
            first_name,
            last_name,
            email
          ),
          property:properties!refunds_property_id_fkey (
            name,
            address
          ),
          payment:payments!refunds_payment_id_fkey (
            amount,
            payment_date
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.property_id) {
        query = query.eq('property_id', filters.property_id);
      }
      if (filters?.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRefunds(data as Refund[] || []);
      return data as Refund[];
    } catch (error: any) {
      toast.error('Failed to fetch refunds: ' + error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createRefundRequest = useCallback(async (refundData: {
    payment_id: string;
    tenant_id: string;
    property_id: string;
    amount: number;
    reason: string;
  }) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('refunds')
        .insert({
          ...refundData,
          requested_by: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Refund request submitted successfully');
      return data;
    } catch (error: any) {
      toast.error('Failed to create refund request: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reviewRefund = useCallback(async (
    refundId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string
  ) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('refunds')
        .update({
          status,
          reviewed_by: user.id,
          review_notes: reviewNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', refundId)
        .select()
        .single();

      if (error) throw error;

      toast.success(`Refund ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      return data;
    } catch (error: any) {
      toast.error('Failed to review refund: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const processRefund = useCallback(async (refundId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('refunds')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', refundId)
        .select()
        .single();

      if (error) throw error;

      toast.success('Refund processed successfully');
      return data;
    } catch (error: any) {
      toast.error('Failed to process refund: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    refunds,
    fetchRefunds,
    createRefundRequest,
    reviewRefund,
    processRefund
  };
};
