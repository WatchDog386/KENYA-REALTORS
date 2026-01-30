import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Payment {
  id: string;
  tenant_id: string;
  property_id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_date: string;
  reference_id?: string;
  metadata?: any;
  created_at: string;
  tenant?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  property?: {
    name: string;
    address: string;
  };
}

export const usePayments = () => {
  const [loading, setLoading] = useState(false);

  const getPaymentsByManager = useCallback(async (filters?: {
    status?: string;
    date_from?: string;
    date_to?: string;
    property_id?: string;
  }) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('payments')
        .select(`
          *,
          tenant:users!payments_tenant_id_fkey (
            first_name,
            last_name,
            email
          ),
          property:properties!payments_property_id_fkey (
            name,
            address
          )
        `)
        .in('property_id', 
          supabase
            .from('properties')
            .select('id')
            .eq('property_manager_id', user.id)
        )
        .order('payment_date', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_from) {
        query = query.gte('payment_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('payment_date', filters.date_to);
      }
      if (filters?.property_id) {
        query = query.eq('property_id', filters.property_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching payments:', err);
      toast.error('Failed to load payments');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ... rest of payment-related functions
  return { getPaymentsByManager, loading };
};