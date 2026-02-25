import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Home, Calendar, CreditCard, FileText, User, Loader2, MapPin, Clock, Shield, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from 'date-fns';

interface TenantData {
  id: string;
  status: string;
  user_id: string;
  property_id: string;
  unit_id: string;
  move_in_date?: string;
  move_out_date?: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url?: string | null;
    phone?: string | null;
  } | null;
  properties: {
    name: string;
    location?: string;
  } | null;
  units: {
    unit_number: string;
    price: number | null;
  } | null;
  active_lease?: {
    start_date: string;
    end_date: string;
    status: string;
  } | null;
}

const TenantDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTenantDetails(id);
    }
  }, [id]);

  const fetchTenantDetails = async (tenantId: string) => {
    try {
      setLoading(true);
      
      // Fetch tenant with joins for properties and units
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          status,
          user_id,
          property_id,
          unit_id,
          move_in_date,
          move_out_date,
          properties!tenants_property_id_fkey(name, location),
          units!tenants_unit_id_fkey(unit_number, price)
        `)
        .eq('id', tenantId)
        .single();

      if (error) {
        console.warn('Supabase join query failed. Falling back to manual fetch.', error);
        
        // Fallback manual fetch
        const { data: rawTenant, error: fetchError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .single();
            
        if (fetchError) throw fetchError;
        
        if (rawTenant) {
            const [profilesRes, propsRes, unitsRes] = await Promise.all([
                rawTenant.user_id ? supabase.from('profiles').select('first_name, last_name, email, avatar_url, phone').eq('id', rawTenant.user_id).single() : { data: null },
                rawTenant.property_id ? supabase.from('properties').select('name, location').eq('id', rawTenant.property_id).single() : { data: null },
                rawTenant.unit_id ? supabase.from('units').select('unit_number, price').eq('id', rawTenant.unit_id).single() : { data: null }
            ]);

            const tenantData = {
                ...rawTenant,
                profiles: profilesRes.data,
                properties: propsRes.data,
                units: unitsRes.data,
            };
            
            // Fetch active lease
            if (rawTenant.user_id) {
                const { data: leaseData } = await supabase
                    .from('leases')
                    .select('start_date, end_date, status')
                    .eq('tenant_id', rawTenant.user_id)
                    .eq('status', 'active')
                    .maybeSingle();
                    
                tenantData.active_lease = leaseData;
            }
            
            setTenant(tenantData as TenantData);
        }
      } else {
        let tenantData = { ...data } as any;
        
        // Handle array returns from joins
        if (Array.isArray(tenantData.properties)) tenantData.properties = tenantData.properties[0];
        if (Array.isArray(tenantData.units)) tenantData.units = tenantData.units[0];
        
        // Fetch profile separately since there's no direct FK from tenants to profiles
        if (data.user_id) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('first_name, last_name, email, avatar_url, phone')
                .eq('id', data.user_id)
                .single();
            tenantData.profiles = profileData;
        }
        
        // Fetch active lease
        if (data.user_id) {
            const { data: leaseData } = await supabase
                .from('leases')
                .select('start_date, end_date, status')
                .eq('tenant_id', data.user_id)
                .eq('status', 'active')
                .maybeSingle();
                
            tenantData.active_lease = leaseData;
        }
        
        setTenant(tenantData as TenantData);
      }
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      toast.error('Failed to load tenant details');
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (t: TenantData) => {
    if (!t.profiles) return 'Unknown';
    const first = t.profiles.first_name || '';
    const last = t.profiles.last_name || '';
    return `${first} ${last}`.trim() || t.profiles.email || 'Unknown';
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' })
      .format(amount)
      .replace('KES', 'KSh');
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center text-slate-500">
          <Loader2 className="h-12 w-12 animate-spin mb-4 text-[#154279]" />
          <p className="text-lg font-medium">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <User className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Tenant Not Found</h2>
        <p className="text-slate-500 mb-6">The tenant you are looking for does not exist or has been removed.</p>
        <Button onClick={() => navigate('/portal/super-admin/leases')} className="bg-[#154279] hover:bg-[#0f325e]">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 px-6 py-6 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/portal/super-admin/leases')}
              className="text-slate-500 hover:text-[#154279] hover:bg-blue-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#154279]">Tenant Profile</h1>
              <p className="text-sm text-slate-500">View complete details and history</p>
            </div>
          </div>
          <Badge className={
            tenant.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100 px-4 py-1.5 text-sm' :
            tenant.status === 'notice_given' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 px-4 py-1.5 text-sm' :
            'bg-slate-100 text-slate-800 hover:bg-slate-100 px-4 py-1.5 text-sm'
          }>
            {tenant.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* Top Section - Profile Image and Basic Info */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Profile Image - Standalone */}
          <div className="w-full md:w-64 shrink-0">
            <div className="w-full aspect-[3/4] bg-slate-100 overflow-hidden shadow-lg border border-slate-200">
              {tenant.profiles?.avatar_url ? (
                <img 
                  src={tenant.profiles.avatar_url} 
                  alt={getFullName(tenant)} 
                  className="object-cover object-top w-full h-full"
                />
              ) : (
                <div className="w-full h-full text-[#154279] flex items-center justify-center text-6xl font-bold">
                  {tenant.profiles?.first_name?.charAt(0) || ''}
                  {tenant.profiles?.last_name?.charAt(0) || ''}
                </div>
              )}
            </div>
          </div>

          {/* Basic Info & Contact */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-4xl font-bold text-slate-800 mb-2">{getFullName(tenant)}</h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Tenant</Badge>
                <p className="text-slate-500 font-medium">ID: {tenant.id.substring(0, 8)}...</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="flex items-center gap-3 text-slate-600 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-[#154279]" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-400 uppercase">Email Address</p>
                  <p className="text-sm font-medium truncate text-slate-700">{tenant.profiles?.email || 'No email provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-slate-600 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-[#154279]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Phone Number</p>
                  <p className="text-sm font-medium text-slate-700">{tenant.profiles?.phone || 'No phone provided'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Account Status */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg font-bold text-[#154279] flex items-center gap-2">
                  <Shield className="h-5 w-5" /> Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">User ID</p>
                  <p className="text-sm text-slate-700 font-mono bg-slate-50 p-2 rounded border border-slate-100 break-all">
                    {tenant.user_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Account Status</p>
                  <Badge className={
                    tenant.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                    tenant.status === 'notice_given' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                    'bg-slate-100 text-slate-800 hover:bg-slate-100'
                  }>
                    {tenant.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Property & Lease Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Property Assignment */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg font-bold text-[#154279] flex items-center gap-2">
                  <Home className="h-5 w-5" /> Property Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Home className="h-6 w-6 text-[#154279]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase">Property Name</p>
                      <p className="text-lg font-bold text-slate-800">{tenant.properties?.name || 'Unassigned'}</p>
                      {tenant.properties?.location && (
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {tenant.properties.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                      <Home className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase">Unit Number</p>
                      <p className="text-lg font-bold text-slate-800">{tenant.units?.unit_number || 'Unassigned'}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <CreditCard className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase">Monthly Rent</p>
                      <p className="text-lg font-bold text-emerald-700">{formatCurrency(tenant.units?.price)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lease Information */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg font-bold text-[#154279] flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Lease Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <p className="text-sm font-bold text-slate-500 uppercase">Move In Date</p>
                    </div>
                    <p className="text-lg font-semibold text-slate-800">{formatDate(tenant.move_in_date)}</p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <p className="text-sm font-bold text-slate-500 uppercase">Move Out Date</p>
                    </div>
                    <p className="text-lg font-semibold text-slate-800">{formatDate(tenant.move_out_date)}</p>
                  </div>

                  {tenant.active_lease ? (
                    <>
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-[#154279]" />
                          <p className="text-sm font-bold text-[#154279] uppercase">Active Lease Start</p>
                        </div>
                        <p className="text-lg font-semibold text-slate-800">{formatDate(tenant.active_lease.start_date)}</p>
                      </div>
                      
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-[#154279]" />
                          <p className="text-sm font-bold text-[#154279] uppercase">Active Lease End</p>
                        </div>
                        <p className="text-lg font-semibold text-slate-800">{formatDate(tenant.active_lease.end_date)}</p>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-1 sm:col-span-2 bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <p className="text-yellow-800 font-medium">No active lease found for this tenant.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TenantDetails;
