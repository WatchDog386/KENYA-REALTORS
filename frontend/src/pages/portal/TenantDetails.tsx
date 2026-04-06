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
import { TenantBillingHistory } from "@/components/utilities/TenantBillingHistory";

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

const PANEL_HEADER_CLASS =
  "bg-[#154279] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white";

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
      <div className="flex min-h-[55vh] items-center justify-center bg-[#d7dce1]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#154279]" />
          <p className="text-[13px] font-medium text-[#5f6b7c]">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-[#d7dce1] p-4 md:p-6 font-['Poppins','Segoe_UI',sans-serif] text-[#243041]">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>
        <div className="mx-auto max-w-[1100px] border border-[#bcc3cd] bg-[#eef1f4] p-8 text-center">
          <User className="mx-auto mb-3 h-12 w-12 text-[#9aa4b1]" />
          <h2 className="text-[28px] font-bold text-[#1f2937]">Tenant Not Found</h2>
          <p className="mt-2 text-[13px] font-medium text-[#5f6b7c]">
            The tenant you are looking for does not exist or has been removed.
          </p>
          <Button
            onClick={() => navigate('/portal/super-admin/leases')}
            className="mt-5 h-10 rounded-none border border-[#154279] bg-[#154279] px-4 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#10335f]"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Tenants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 md:p-6 font-['Poppins','Segoe_UI',sans-serif] text-[#243041]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mx-auto max-w-[1500px] space-y-3">
        <section className="border border-[#bcc3cd] bg-[#eef1f4]">
          <div className={PANEL_HEADER_CLASS}>Tenant Profile</div>
          <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate('/portal/super-admin/leases')}
                  className="h-9 rounded-none border border-[#b6bec8] bg-white px-3 text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]"
                >
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back
                </Button>
              </div>

              <h1 className="mt-3 text-[34px] font-bold leading-none text-[#1f2937]">{getFullName(tenant)}</h1>
              <p className="mt-2 text-[13px] font-medium text-[#5f6b7c]">View complete details, lease information, and billing history.</p>

              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Tenant Type</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">Standard Tenant</p>
                </div>
                <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Status</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{tenant.status.replace('_', ' ')}</p>
                </div>
                <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Tenant ID</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">#{tenant.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Monthly Rent</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{formatCurrency(tenant.units?.price || null)}</p>
                </div>
              </div>
            </div>

            <div className="xl:col-span-4">
              <div className="border border-[#c7cdd6] bg-white p-3">
                <div className="relative h-[290px] overflow-hidden border border-[#c7cdd6] bg-[#eef1f4]">
                  {tenant.profiles?.avatar_url ? (
                    <img
                      src={tenant.profiles.avatar_url}
                      alt={getFullName(tenant)}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-[#154279]">
                      {tenant.profiles?.first_name?.charAt(0) || ''}
                      {tenant.profiles?.last_name?.charAt(0) || ''}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="bg-[#154279] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Tenant</span>
                  <span className={
                    tenant.status === 'active'
                      ? 'bg-[#2dae49] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white'
                      : tenant.status === 'notice_given'
                      ? 'bg-[#f3bd11] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1f2937]'
                      : 'bg-[#7b8895] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white'
                  }>
                    {tenant.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <section className="border border-[#bcc3cd] bg-[#eef1f4] xl:col-span-4">
            <div className={PANEL_HEADER_CLASS}>Account Details</div>
            <div className="space-y-2 p-3">
              <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">User ID</p>
                <p className="mt-1 break-all font-mono text-[12px] font-medium text-[#1f2937]">{tenant.user_id}</p>
              </div>

              <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Email</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1f2937] flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-[#154279]" />
                  {tenant.profiles?.email || 'No email provided'}
                </p>
              </div>

              <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Phone</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1f2937] flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[#154279]" />
                  {tenant.profiles?.phone || 'No phone provided'}
                </p>
              </div>
            </div>
          </section>

          <section className="border border-[#bcc3cd] bg-[#eef1f4] xl:col-span-8">
            <div className={PANEL_HEADER_CLASS}>Property Assignment</div>
            <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
              <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Property Name</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1f2937] flex items-center gap-2">
                  <Home className="h-3.5 w-3.5 text-[#154279]" />
                  {tenant.properties?.name || 'Unassigned'}
                </p>
              </div>

              <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Unit Number</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{tenant.units?.unit_number || 'Unassigned'}</p>
              </div>

              <div className="border border-[#c7cdd6] bg-white px-3 py-2 sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Property Location</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1f2937] flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#154279]" />
                  {tenant.properties?.location || 'Location unavailable'}
                </p>
              </div>

              <div className="border border-[#c7cdd6] bg-white px-3 py-2 sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Monthly Rent</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1f2937] flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-[#154279]" />
                  {formatCurrency(tenant.units?.price)}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="border border-[#bcc3cd] bg-[#eef1f4]">
          <div className={PANEL_HEADER_CLASS}>Lease Information</div>
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-[#c7cdd6] bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Move In Date</p>
              <p className="mt-1 text-[13px] font-semibold text-[#1f2937] flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-[#154279]" />
                {formatDate(tenant.move_in_date)}
              </p>
            </div>

            <div className="border border-[#c7cdd6] bg-white px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Move Out Date</p>
              <p className="mt-1 text-[13px] font-semibold text-[#1f2937] flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#154279]" />
                {formatDate(tenant.move_out_date)}
              </p>
            </div>

            {tenant.active_lease ? (
              <>
                <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Active Lease Start</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{formatDate(tenant.active_lease.start_date)}</p>
                </div>

                <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Active Lease End</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{formatDate(tenant.active_lease.end_date)}</p>
                </div>
              </>
            ) : (
              <div className="border border-[#f3d8a0] bg-[#fff8e8] px-3 py-2 text-[#8a6a2b] sm:col-span-2 lg:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide">No Active Lease</p>
                <p className="mt-1 text-[13px] font-medium">No active lease found for this tenant.</p>
              </div>
            )}
          </div>
        </section>

        {tenant.user_id && (
          <section className="border border-[#bcc3cd] bg-[#eef1f4]">
            <div className={PANEL_HEADER_CLASS}>Billing History</div>
            <div className="p-3">
              <TenantBillingHistory tenantId={tenant.id} userId={tenant.user_id} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default TenantDetails;
