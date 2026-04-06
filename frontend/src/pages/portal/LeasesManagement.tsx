import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Calendar, Home, Loader2, User, Trash2, Eye, Phone, Mail, Search, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  } | null;
  units: {
    unit_number: string;
    price: number | null;
  } | null;
  active_lease?: {
    start_date: string;
    end_date: string;
  } | null;
}

const PANEL_HEADER_CLASS =
  "bg-[#154279] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white";

const INPUT_CLASS_NAME =
  "h-10 rounded-none border border-[#b6bec8] bg-white px-3 text-[13px] text-[#1f2937] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#F96302]";

const LeasesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    activeTenants: 0,
    expiringSoon: 0,
    overduePayments: 0, 
    totalRent: 0
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      
      let tenantsList: any[] = [];

      // Try joined fetch first
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
          profiles(first_name, last_name, email, avatar_url, phone),
          properties(name),
          units(unit_number, price)
        `);

      if (error) {
        console.warn('Supabase join query failed (likely missing FKs). Falling back to manual fetch.', error);
        
        // Fallback: Fetch raw tenants and join manually
        const { data: rawTenants, error: fetchError } = await supabase
            .from('tenants')
            .select('id, status, user_id, property_id, unit_id, move_in_date, move_out_date');
            
        if (fetchError) throw fetchError;
        
        if (rawTenants && rawTenants.length > 0) {
            // Collect IDs for batch fetching
            const userIds = [...new Set(rawTenants.map((t: any) => t.user_id).filter(Boolean))];
            const propIds = [...new Set(rawTenants.map((t: any) => t.property_id).filter(Boolean))];
            const unitIds = [...new Set(rawTenants.map((t: any) => t.unit_id).filter(Boolean))];

            // Fetch related data in parallel
            const [profilesRes, propsRes, unitsRes] = await Promise.all([
                userIds.length ? supabase.from('profiles').select('id, first_name, last_name, email, avatar_url, phone').in('id', userIds) : { data: [] },
                propIds.length ? supabase.from('properties').select('id, name').in('id', propIds) : { data: [] },
                unitIds.length ? supabase.from('units').select('id, unit_number, price').in('id', unitIds) : { data: [] }
            ]);

            // Map back to tenants
            tenantsList = rawTenants.map((t: any) => ({
                ...t,
                profiles: profilesRes.data?.find((p: any) => p.id === t.user_id) || null,
                properties: propsRes.data?.find((p: any) => p.id === t.property_id) || null,
                units: unitsRes.data?.find((u: any) => u.id === t.unit_id) || null,
            }));
        }
      } else {
        tenantsList = data || [];
      }

      // Fetch active leases for these tenants
      const { data: leasesData, error: leasesError } = await supabase
        .from('tenant_leases')
        .select('tenant_id, start_date, end_date, status')
        .eq('status', 'active');
        
      if (leasesError) console.error("Error fetching leases:", leasesError);

      const processedTenants: TenantData[] = tenantsList.map((t: any) => {
        // Match using user_id as tenant_leases uses profiles(id)
        const tenantLease = leasesData?.find(l => l.tenant_id === t.user_id && l.status === 'active');
        return {
          ...t,
          active_lease: tenantLease ? {
            start_date: tenantLease.start_date,
            end_date: tenantLease.end_date
          } : null
        };
      });

      setTenants(processedTenants);
      calculateStats(processedTenants);

    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load tenants data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: TenantData[]) => {
    const active = data.filter(t => t.status === 'active').length;
    
    // Calculate expiring soon (within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    let expiring = 0;
    data.forEach(t => {
      if (t.active_lease?.end_date) {
        const endDate = new Date(t.active_lease.end_date);
        if (endDate > today && endDate <= thirtyDaysFromNow) {
          expiring++;
        }
      }
    });
    
    setStats({
      activeTenants: active,
      expiringSoon: expiring,
      overduePayments: 0,
      totalRent: 0 
    });
  };

  const getFullName = (tenant: TenantData) => {
    if (!tenant.profiles) return 'Unknown';
    const first = tenant.profiles.first_name || '';
    const last = tenant.profiles.last_name || '';
    return `${first} ${last}`.trim() || tenant.profiles.email || 'Unknown';
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' })
      .format(amount)
      .replace('KES', 'KSh'); // Use common local abbreviation
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) return;
    
    try {
      const { error: tenantError } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);
        
      if (tenantError) throw tenantError;
      
      toast.success("Tenant deleted successfully");
      fetchTenants();
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast.error("Failed to delete tenant");
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    if (!searchQuery.trim()) return true;

    const term = searchQuery.toLowerCase();
    const fullName = getFullName(tenant).toLowerCase();
    const email = (tenant.profiles?.email || '').toLowerCase();
    const propertyName = (tenant.properties?.name || '').toLowerCase();
    const unit = (tenant.units?.unit_number || '').toLowerCase();
    const status = (tenant.status || '').toLowerCase();

    return (
      fullName.includes(term) ||
      email.includes(term) ||
      propertyName.includes(term) ||
      unit.includes(term) ||
      status.includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 md:p-6 font-['Poppins','Segoe_UI',sans-serif] text-[#243041]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mx-auto max-w-[1500px] space-y-3">
        <section className="border border-[#bcc3cd] bg-[#eef1f4]">
          <div className={PANEL_HEADER_CLASS}>Tenants Management</div>
          <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-12">
            <div className="xl:col-span-9">
              <h1 className="text-[34px] font-bold leading-none text-[#1f2937]">Tenants and Leases</h1>
              <p className="mt-2 text-[13px] font-medium text-[#5f6b7c]">
                Manage all tenants, their assignments, and lease lifecycle from one workspace.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Active Tenants</p>
                  <p className="mt-1 text-[20px] font-bold text-[#1f2937]">{stats.activeTenants}</p>
                </div>
                <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Expiring Soon</p>
                  <p className="mt-1 text-[20px] font-bold text-[#1f2937]">{stats.expiringSoon}</p>
                </div>
                <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Overdue Payments</p>
                  <p className="mt-1 text-[20px] font-bold text-[#1f2937]">{stats.overduePayments}</p>
                </div>
                <div className="border border-[#c7cdd6] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Visible Records</p>
                  <p className="mt-1 text-[20px] font-bold text-[#1f2937]">{filteredTenants.length}</p>
                </div>
              </div>
            </div>

            <div className="xl:col-span-3">
              <div className="flex h-full flex-col justify-between gap-3 border border-[#c7cdd6] bg-white p-3">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Quick Actions</p>
                  <div className="space-y-2">
                    <span className="inline-block bg-[#154279] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Super Admin Panel</span>
                    <span className="inline-block bg-[#F96302] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Leases Module</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={fetchTenants}
                    className="h-10 w-full rounded-none border border-[#b6bec8] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]"
                  >
                    <Loader2 className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : 'hidden'}`} />
                    {!loading && <TrendingUp className="mr-2 h-3.5 w-3.5" />}
                    Refresh Data
                  </Button>

                  <Button
                    onClick={() => toast.info('Use onboarding and lease workflows to add tenants.')}
                    className="h-10 w-full rounded-none border border-[#154279] bg-[#154279] px-4 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#10335f]"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Add New Tenant
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-[#bcc3cd] bg-[#eef1f4]">
          <div className={PANEL_HEADER_CLASS}>Tenant Registry</div>
          <div className="space-y-3 p-3">
            <div className="flex flex-col gap-3 border border-[#c4cad3] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">
                Showing {filteredTenants.length} of {tenants.length} records
              </p>
              <div className="relative w-full sm:w-[340px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8595]" />
                <Input
                  placeholder="Search by name, email, property, unit, status"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${INPUT_CLASS_NAME} pl-9`}
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-[#c4cad3] bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#c4cad3] bg-[#e8ecf1] text-left">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#324156]">Tenant</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#324156]">Property</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#324156]">Lease Duration</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#324156]">Estimated Rent</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#324156]">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-[#324156]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-[#5f6b7c]">
                          <Loader2 className="mb-2 h-8 w-8 animate-spin text-[#154279]" />
                          <p className="text-sm font-medium">Loading tenants...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[#5f6b7c]">
                        No tenants match your current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((tenant) => (
                      <tr key={tenant.id} className="group border-b border-[#d4dae3] hover:bg-[#f6f8fb]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#1f2937]">{getFullName(tenant)}</span>
                            <span className="mt-0.5 text-[12px] font-medium text-[#5f6b7c] flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-[#7b8895]" />
                              {tenant.profiles?.email || 'No email'}
                            </span>
                            {tenant.profiles?.phone && (
                              <span className="mt-0.5 text-[12px] font-medium text-[#5f6b7c] flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-[#7b8895]" />
                                {tenant.profiles.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-[#324156]">
                            <Home className="h-4 w-4 text-[#7b8895]" />
                            <span className="font-medium">{tenant.properties?.name || 'Unassigned'}</span>
                            {tenant.units?.unit_number && (
                              <Badge variant="outline" className="ml-1 border-[#c4cad3] bg-white text-[#5f6b7c] text-xs">
                                {tenant.units.unit_number}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {tenant.active_lease ? (
                            <div className="flex items-center gap-2 text-[13px] font-medium text-[#324156]">
                              <Calendar className="h-4 w-4 text-[#7b8895]" />
                              <span>{formatDate(tenant.active_lease.start_date)} - {formatDate(tenant.active_lease.end_date)}</span>
                            </div>
                          ) : (
                            <span className="text-[13px] italic text-[#7b8895]">No Active Lease</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-[#154279]">
                          {formatCurrency(tenant.units?.price || null)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                            tenant.status === 'active'
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50'
                              : tenant.status === 'notice_given'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}>
                            {tenant.status === 'notice_given'
                              ? 'Notice Given'
                              : tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-none border border-[#154279] bg-[#154279] px-3 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#10335f]"
                              onClick={() => navigate(`/portal/super-admin/leases/${tenant.id}`)}
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-none border border-[#dc3545] bg-[#dc3545] px-3 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#c12c3a]"
                              onClick={() => handleDeleteTenant(tenant.id)}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LeasesManagement;