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

const LeasesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 px-6 py-6 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#154279]">Tenants Management</h1>
            <p className="text-sm text-slate-500">Manage all tenants, their assignments, and lease statuses.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search tenants..." 
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#154279]"
              />
            </div>
            <Button className="bg-[#154279] hover:bg-[#0f325e] text-white shadow-sm shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Add New Tenant
            </Button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Active Tenants</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.activeTenants}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" /> Updated just now
                </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Expiring Leases</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.expiringSoon}</h3>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                </div>
                 <div className="mt-4 text-xs font-medium text-slate-500">
                    Within next 30 days
                </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Overdue Payments</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.overduePayments}</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                </div>
                 <div className="mt-4 text-xs font-medium text-red-600">
                    Requires attention
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenants Table */}
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User className="h-5 w-5 text-[#154279]" /> All Tenants
             </h3>
             <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-slate-600 border-slate-200">
                  <Filter className="h-4 w-4 mr-2" /> Filter
                </Button>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lease Duration</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Rent</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin mb-2 text-[#154279]" />
                        <p className="text-sm font-medium">Loading tenants...</p>
                      </div>
                    </td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No tenants found.
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{getFullName(tenant)}</span>
                            <span className="text-xs text-slate-500">{tenant.profiles?.email}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-2 text-slate-600">
                            <Home className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{tenant.properties?.name || 'Unassigned'}</span>
                            {tenant.units?.unit_number && (
                              <Badge variant="outline" className="ml-1 text-xs bg-white border-slate-200 text-slate-600">{tenant.units.unit_number}</Badge>
                            )}
                         </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                         {tenant.active_lease ? (
                           <div className="text-sm text-slate-600 flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span>{formatDate(tenant.active_lease.start_date)} - {formatDate(tenant.active_lease.end_date)}</span>
                           </div>
                         ) : (
                           <span className="text-sm text-slate-400 italic">No Active Lease</span>
                         )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-[#154279]">
                        {formatCurrency(tenant.units?.price || null)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        tenant.status === 'active' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50' :
                        tenant.status === 'notice_given' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50' :
                        'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}>
                        {tenant.status === 'notice_given' ? 'Notice Given' : 
                         tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => navigate(`/portal/super-admin/leases/${tenant.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => handleDeleteTenant(tenant.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LeasesManagement;