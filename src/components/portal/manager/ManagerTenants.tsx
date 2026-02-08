// src/components/portal/manager/ManagerTenants.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  unit_name?: string;
  move_in_date?: string;
}

const ManagerTenants: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    loadTenants();
  }, [user?.id]);

  const loadTenants = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get property assigned to manager
      const { data: assignment, error: assignmentError } = await supabase
        .from('property_manager_assignments')
        .select('property_id')
        .eq('property_manager_id', user.id)
        .single();

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        throw assignmentError;
      }

      if (!assignment) {
        setTenants([]);
        return;
      }

      // Get tenants via leases (Source of Truth for Occupancy)
      // This ensures consistency with ManagerUnits which shows occupied units
      const { data: activeLeases, error: leasesError } = await supabase
        .from('tenant_leases')
        .select(`
          id,
          tenant_id,
          start_date,
          units!inner (
            id,
            unit_number,
            property_id
          )
        `)
        .eq('status', 'active')
        .eq('units.property_id', assignment.property_id);

      if (leasesError) throw leasesError;

      if (!activeLeases || activeLeases.length === 0) {
        setTenants([]);
        return;
      }

      // Extract User IDs to fetch profiles
      const userIds = activeLeases.map((l: any) => l.tenant_id).filter(Boolean);
      
      // Fetch Profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .in('id', userIds);
        
      if (profilesError) throw profilesError;

      const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const formattedTenants: Tenant[] = activeLeases.map((lease: any) => {
        const profile = profilesMap.get(lease.tenant_id) || {};
        const unit = lease.units || {};
        
        return {
          id: lease.tenant_id, // Use user_id as ID for list
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
          phone: profile.phone,
          unit_name: unit.unit_number || 'Unassigned',
          move_in_date: lease.start_date,
        };
      });

      setTenants(formattedTenants);
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Users className="h-8 w-8" />
          Tenants
        </h1>
        <p className="text-gray-600">Manage tenants in your property</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Tenants ({tenants.length})</CardTitle>
          <CardDescription>All active tenants in your managed property</CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tenants assigned yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Move-in Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.first_name} {tenant.last_name}</TableCell>
                      <TableCell>{tenant.email}</TableCell>
                      <TableCell>{tenant.phone || '-'}</TableCell>
                      <TableCell>{tenant.unit_name || '-'}</TableCell>
                      <TableCell>
                        {tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerTenants;
