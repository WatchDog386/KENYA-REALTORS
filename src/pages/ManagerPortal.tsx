// src/pages/ManagerPortal.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2, Users, CheckCircle, XCircle, Loader2, ArrowLeft,
  Clock, FileText, Mail, Phone, MapPin
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ManagedProperty {
  id: string;
  name: string;
  address: string;
  total_units: number;
  occupied_units: number;
}

interface PendingTenant {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id: string;
  status: string;
  created_at: string;
  
  // Joined data
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  unit?: {
    unit_number: string;
    unit_type: string;
  };
  property?: {
    name: string;
    address: string;
  };
}

export default function ManagerPortal() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [managedProperties, setManagedProperties] = useState<ManagedProperty[]>([]);
  const [pendingTenants, setPendingTenants] = useState<PendingTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  // Check access - must be property manager
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile?.role !== 'property_manager') {
      toast({
        title: 'Access Denied',
        description: 'Only property managers can access this portal.',
        variant: 'destructive'
      });
      navigate('/dashboard');
      return;
    }

    fetchManagerData();
  }, [user, profile]);

  const fetchManagerData = async () => {
    setLoading(true);
    try {
      if (!user?.id) throw new Error('User not found');

      // 1. Fetch properties assigned to this manager
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('manager_assignments')
        .select('property_id')
        .eq('manager_id', user.id)
        .eq('status', 'active');

      if (assignmentError) throw assignmentError;

      const propertyIds = (assignmentData || []).map(a => a.property_id);

      if (propertyIds.length === 0) {
        setManagedProperties([]);
        setPendingTenants([]);
        setLoading(false);
        return;
      }

      // 2. Fetch property details
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('id, name, address, total_units, occupied_units')
        .in('id', propertyIds);

      if (propertiesError) throw propertiesError;
      setManagedProperties(propertiesData || []);

      // 3. Fetch pending tenant verifications for these properties
      const { data: verificationData, error: verificationError } = await supabase
        .from('tenant_verifications')
        .select(
          `
          id,
          tenant_id,
          property_id,
          unit_id,
          status,
          created_at,
          unit_id,
          property_id
          `
        )
        .in('property_id', propertyIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (verificationError) throw verificationError;

      // 4. Enrich with tenant and property details
      const enrichedTenants: PendingTenant[] = [];

      for (const verification of verificationData || []) {
        // Fetch tenant profile
        const { data: tenantProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone')
          .eq('id', verification.tenant_id)
          .single();

        // Fetch unit details
        const { data: unit } = await supabase
          .from('units_detailed')
          .select('unit_number, unit_type')
          .eq('id', verification.unit_id)
          .single();

        // Fetch property details
        const { data: property } = await supabase
          .from('properties')
          .select('name, address')
          .eq('id', verification.property_id)
          .single();

        enrichedTenants.push({
          ...verification,
          profile: tenantProfile || undefined,
          unit: unit || undefined,
          property: property || undefined,
        });
      }

      setPendingTenants(enrichedTenants);
    } catch (error: any) {
      console.error('Error fetching manager data:', error);
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTenant = async (verificationId: string, tenantId: string) => {
    setApproving(verificationId);
    try {
      // 1. Update tenant verification
      const { error: verifyError } = await supabase
        .from('tenant_verifications')
        .update({
          status: 'verified',
          verified_by: user?.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', verificationId);

      if (verifyError) throw verifyError;

      // 2. Activate tenant profile (important for login)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (profileError) throw profileError;

      // 3. Create notification for tenant that they are approved
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          recipient_id: tenantId,
          sender_id: user?.id,
          type: 'verification_approved',
          related_entity_type: 'tenant',
          related_entity_id: tenantId,
          title: 'Application Approved',
          message: 'Your tenant application has been approved. You can now login to your account and access the tenant portal.'
        });

      if (notificationError) console.error('Notification error:', notificationError);

      toast({
        title: 'Tenant Approved',
        description: 'The tenant can now log in to their account.',
        className: 'bg-green-50 border-green-200'
      });

      // Refresh the list
      fetchManagerData();
    } catch (error: any) {
      console.error('Error approving tenant:', error);
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setApproving(null);
    }
  };

  const handleRejectTenant = async (verificationId: string) => {
    setRejecting(verificationId);
    try {
      const { error } = await supabase
        .from('tenant_verifications')
        .update({
          status: 'rejected',
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          rejection_reason: 'Rejected by property manager'
        })
        .eq('id', verificationId);

      if (error) throw error;

      toast({
        title: 'Tenant Rejected',
        description: 'The application has been rejected.',
      });

      fetchManagerData();
    } catch (error: any) {
      toast({
        title: 'Error rejecting tenant',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setRejecting(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-indigo-600 h-8 w-8" />
            Property Manager Portal
          </h1>
          <p className="text-slate-600 mt-1">Manage your properties and approve tenants</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="pending-tenants" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
          <TabsTrigger value="pending-tenants" className="data-[state=active]:bg-slate-100">
            Pending Tenants
            {pendingTenants.length > 0 && (
              <Badge className="ml-2 bg-amber-500">{pendingTenants.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="properties" className="data-[state=active]:bg-slate-100">
            My Properties
          </TabsTrigger>
        </TabsList>

        {/* Pending Tenants Tab */}
        <TabsContent value="pending-tenants">
          <Card>
            <CardHeader>
              <CardTitle>Pending Tenant Applications</CardTitle>
              <CardDescription>
                Review and approve new tenant applications for your properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTenants.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                  <p>No pending tenant applications.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                    >
                      {/* Tenant Info */}
                      <div className="flex-1 space-y-3 mb-4 md:mb-0">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-indigo-100 text-indigo-700">
                              {tenant.profile?.first_name?.charAt(0) || 'T'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {tenant.profile?.first_name} {tenant.profile?.last_name}
                            </p>
                            <p className="text-sm text-slate-600">
                              Applied on {new Date(tenant.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Contact & Location Info */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="h-4 w-4" />
                            <span>{tenant.profile?.email}</span>
                          </div>
                          {tenant.profile?.phone && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="h-4 w-4" />
                              <span>{tenant.profile.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="h-4 w-4" />
                            <span>Unit {tenant.unit?.unit_number}</span>
                          </div>
                        </div>

                        {/* Property & Unit Details */}
                        <div className="bg-white p-3 rounded border border-slate-200 text-sm">
                          <p className="font-medium text-slate-900">
                            {tenant.property?.name}
                          </p>
                          <p className="text-slate-600">
                            Unit {tenant.unit?.unit_number} ({tenant.unit?.unit_type})
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectTenant(tenant.id)}
                          disabled={rejecting === tenant.id}
                          className="flex-1 md:flex-initial"
                        >
                          {rejecting === tenant.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <span className="ml-2">Reject</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleApproveTenant(tenant.id, tenant.tenant_id)
                          }
                          disabled={approving === tenant.id}
                          className="flex-1 md:flex-initial bg-green-600 hover:bg-green-700"
                        >
                          {approving === tenant.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span className="ml-2">Approve</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>My Managed Properties</CardTitle>
              <CardDescription>Properties you are assigned to manage</CardDescription>
            </CardHeader>
            <CardContent>
              {managedProperties.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                  <p>No properties assigned yet.</p>
                  <p className="text-sm mt-2">
                    Contact your administrator to assign properties.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {managedProperties.map((prop) => (
                    <Card key={prop.id} className="border-slate-200">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-slate-900 mb-2">
                          {prop.name}
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">{prop.address}</p>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-indigo-50 p-2 rounded">
                            <p className="text-indigo-600 font-semibold">
                              {prop.total_units}
                            </p>
                            <p className="text-slate-600 text-xs">Total Units</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-green-600 font-semibold">
                              {prop.occupied_units}
                            </p>
                            <p className="text-slate-600 text-xs">Occupied</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
