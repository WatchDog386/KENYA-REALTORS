// src/components/portal/manager/ManagerTenants.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  User,
  FileText, 
  Filter,
  Download,
  Loader2,
  MessageSquare,
  LayoutGrid,
  List,
  Building2,
  Eye,
  Hash,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  unit_name?: string;
  unit_id?: string;
  move_in_date?: string;
  lease_status: string;
  lease_end_date?: string;
}

interface TenantDetails {
  tenant: Tenant;
  property_name?: string;
  floor_name?: string;
  lease_id?: string;
  lease_created_at?: string;
  profile_created_at?: string;
  account_status?: string;
  next_of_kin?: string;
  next_of_kin_email?: string;
  nationality?: string;
}

const ManagerTenants: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

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
        .select(`
            property_id,
            properties (
               name
            )
        `)
        .eq('property_manager_id', user.id)
        .single();

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        throw assignmentError;
      }

      if (!assignment) {
        setTenants([]);
        return;
      }

      if (assignment.properties) {
          // @ts-ignore
          setPropertyName(assignment.properties.name);
      }

      // Get tenants via leases (Source of Truth for Occupancy)
      const { data: activeLeases, error: leasesError } = await supabase
        .from('tenant_leases')
        .select(`
          id,
          tenant_id,
          start_date,
          end_date,
          status,
          units!inner (
            id,
            unit_number,
            property_id
          )
        `)
        .or('status.eq.active,status.eq.pending_renewal')
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
        .select('id, first_name, last_name, email, phone, avatar_url')
        .in('id', userIds);
        
      if (profilesError) throw profilesError;

      const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const formattedTenants: Tenant[] = activeLeases.map((lease: any) => {
        const profile = profilesMap.get(lease.tenant_id) || {};
        const unit = lease.units || {};
        
        return {
          id: lease.tenant_id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
          phone: profile.phone,
          unit_name: unit.unit_number || 'Unassigned',
          unit_id: unit.id,
          move_in_date: lease.start_date,
          lease_end_date: lease.end_date,
          lease_status: lease.status || 'active'
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

  const filteredTenants = tenants.filter(tenant => 
    tenant.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tenant.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.unit_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const handleMessage = (tenant: Tenant) => {
    // Navigate to messages page with tenant info
    navigate('/portal/manager/messages', { 
        state: { 
            selectedContactId: tenant.id,
            selectedContactName: `${tenant.first_name} ${tenant.last_name}`,
            relatedUnitId: tenant.unit_id
        } 
    });
  };

  const formatDate = (date?: string, fallback = '-') => {
    return date ? new Date(date).toLocaleDateString('en-GB') : fallback;
  };

  const formatStatus = (status?: string) => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ');
  };

  const loadTenantDetails = async (tenant: Tenant) => {
    setIsDetailsLoading(true);
    try {
      const fetchLatestApplication = async (includeNextOfKinEmail: boolean) => {
        const selectCols = includeNextOfKinEmail
          ? 'next_of_kin, next_of_kin_email, nationality'
          : 'next_of_kin, nationality';

        return supabase
          .from('lease_applications')
          .select(selectCols)
          .eq('applicant_id', tenant.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
      };

      const [leaseRes, profileRes] = await Promise.all([
        supabase
          .from('tenant_leases')
          .select(`
            id,
            status,
            start_date,
            end_date,
            created_at,
            units (
              id,
              unit_number,
              floor,
              properties (
                name
              )
            )
          `)
          .eq('tenant_id', tenant.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, status, created_at')
          .eq('id', tenant.id)
          .maybeSingle(),
      ]);

      let latestApplicationRes = await fetchLatestApplication(true);
      if (
        latestApplicationRes.error &&
        String(latestApplicationRes.error.message || '').toLowerCase().includes('next_of_kin_email')
      ) {
        latestApplicationRes = await fetchLatestApplication(false);
      }

      if (leaseRes.error) throw leaseRes.error;
      if (profileRes.error) throw profileRes.error;
      if (latestApplicationRes.error) throw latestApplicationRes.error;

      const lease = leaseRes.data as any;
      const profile = profileRes.data as any;
      const latestApplication = latestApplicationRes.data as any;
      const leaseUnit = lease?.units || {};
      const leaseProperty = leaseUnit?.properties as any;

      const mergedTenant: Tenant = {
        ...tenant,
        first_name: profile?.first_name || tenant.first_name,
        last_name: profile?.last_name || tenant.last_name,
        email: profile?.email || tenant.email,
        phone: profile?.phone || tenant.phone,
        lease_status: lease?.status || tenant.lease_status,
        move_in_date: lease?.start_date || tenant.move_in_date,
        lease_end_date: lease?.end_date || tenant.lease_end_date,
        unit_name: leaseUnit?.unit_number || tenant.unit_name,
      };

      setTenantDetails({
        tenant: mergedTenant,
        property_name: leaseProperty?.name || propertyName,
        floor_name: leaseUnit?.floor || undefined,
        lease_id: lease?.id,
        lease_created_at: lease?.created_at,
        profile_created_at: profile?.created_at,
        account_status: profile?.status || undefined,
        next_of_kin: latestApplication?.next_of_kin || undefined,
        next_of_kin_email: latestApplication?.next_of_kin_email || undefined,
        nationality: latestApplication?.nationality || undefined,
      });
    } catch (error) {
      console.error('Error loading tenant details:', error);
      toast.error('Failed to fetch full tenant details');
      setTenantDetails({ tenant, property_name: propertyName });
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleViewProfile = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setTenantDetails(null);
    setIsProfileOpen(true);
    void loadTenantDetails(tenant);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            Tenants
             <Badge variant="secondary" className="text-lg px-3 py-1 font-normal text-slate-500 bg-white border shadow-sm">
                {tenants.length} Active
             </Badge>
          </h1>
          <p className="text-gray-500 mt-1">
             Manage residents for <span className="font-semibold text-gray-700">{propertyName || 'Your Property'}</span>
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="bg-white">
                <Download className="w-4 h-4 mr-2" /> Export List
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Mail className="w-4 h-4 mr-2" /> Message All
            </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Users size={24} />
                  </div>
                  <div>
                      <p className="text-sm font-medium text-slate-500">Total Tenants</p>
                      <h3 className="text-2xl font-bold text-slate-900">{tenants.length}</h3>
                  </div>
              </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <FileText size={24} />
                  </div>
                  <div>
                      <p className="text-sm font-medium text-slate-500">Active Leases</p>
                      <h3 className="text-2xl font-bold text-slate-900">{tenants.filter(t => t.lease_status === 'active').length}</h3>
                  </div>
              </CardContent>
          </Card>

           <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                      <Calendar size={24} />
                  </div>
                  <div>
                      <p className="text-sm font-medium text-slate-500">New Move-ins (30d)</p>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {tenants.filter(t => {
                            if(!t.move_in_date) return false;
                            const date = new Date(t.move_in_date);
                            const now = new Date();
                            const diffTime = Math.abs(now.getTime() - date.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                            return diffDays <= 30;
                        }).length}
                      </h3>
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                   placeholder="Search tenants..." 
                   className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                />
           </div>
           
           <div className="flex items-center gap-2 w-full sm:w-auto">
               <div className="bg-slate-100 p-1 rounded-lg flex items-center border border-slate-200">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Grid View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        title="List View"
                    >
                        <List size={18} />
                    </button>
               </div>
               <Button variant="outline" size="sm" className="h-10 text-slate-600">
                   <Filter className="w-4 h-4 mr-2" /> Filter
               </Button>
           </div>
        </div>
        
        {filteredTenants.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-xl border border-slate-200 border-dashed">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Users className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No tenants found</h3>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchTerm ? `No results for "${searchTerm}"` : "You don't have any active tenants yet."}
              </p>
              {searchTerm && (
                  <Button variant="link" onClick={() => setSearchTerm('')} className="mt-2 text-indigo-600">
                      Clear search
                  </Button>
              )}
            </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
            {filteredTenants.map((tenant) => {
              const isActive = tenant.lease_status === 'active';
              const gradientClass = isActive
                ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600'
                : 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500';
              const badgeClass = isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200';

              return (
                <div key={tenant.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden">
                  <div className={`${gradientClass} p-5 relative`}>
                    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10" />
                    <div className="flex items-start justify-between gap-4 relative z-10">
                      <Avatar className="h-14 w-14 border-2 border-white/50 shadow-sm">
                        <AvatarFallback className="bg-white/90 text-slate-900 text-base font-bold">
                          {getInitials(tenant.first_name, tenant.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-widest text-white/80 font-semibold">Unit</p>
                        <p className="text-2xl font-bold text-white leading-tight break-words">{tenant.unit_name || 'Unassigned'}</p>
                      </div>
                    </div>
                    <div className="mt-4 relative z-10">
                      <h3 className="text-xl font-bold text-white break-words">{tenant.first_name} {tenant.last_name}</h3>
                      <p className="text-sm text-white/90 break-all mt-1">{tenant.email || 'No email provided'}</p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={badgeClass}>{formatStatus(tenant.lease_status)}</Badge>
                      <span className="text-xs text-slate-500">ID: {tenant.id.slice(0, 8)}</span>
                    </div>

                    <div className="space-y-3 flex-1">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> Phone
                        </p>
                        <p className="text-sm font-semibold text-slate-800 break-words">{tenant.phone || 'Not provided'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-100 p-3">
                          <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Move In</p>
                          <p className="text-sm font-semibold text-slate-800">{formatDate(tenant.move_in_date)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 p-3">
                          <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Lease End</p>
                          <p className="text-sm font-semibold text-slate-800">{formatDate(tenant.lease_end_date, 'Month-to-Month')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Button
                        onClick={() => handleViewProfile(tenant)}
                        variant="outline"
                        className="h-10 border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        <Eye size={16} className="mr-2" /> View Details
                      </Button>
                      <Button
                        onClick={() => handleMessage(tenant)}
                        className="h-10 bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <MessageSquare size={16} className="mr-2" /> Message
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
            <Card className="border-slate-200 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
            <Table>
            <TableHeader className="bg-slate-50/80">
                <TableRow>
              <TableHead className="w-[280px]">Tenant</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Lease</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
              <TableRow key={tenant.id} className="group hover:bg-slate-50/60 transition-colors">
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                                    {getInitials(tenant.first_name, tenant.last_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-slate-900">{tenant.first_name} {tenant.last_name}</p>
                                <p className="text-xs text-slate-500">ID: {tenant.id.slice(0, 8)}</p>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 max-w-[260px]">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail size={14} className="text-slate-400" />
                          <span className="break-all">{tenant.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={14} className="text-slate-400" />
                          <span>{tenant.phone || 'Not provided'}</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                         <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-2.5 py-1.5 text-sm font-semibold text-blue-700">
                           <Building2 className="h-4 w-4" />
                           Unit {tenant.unit_name}
                         </div>
                         <p className="text-xs text-slate-500">{propertyName || 'Property'}</p>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <Calendar size={14} className="text-slate-400" />
                                <span>In: {formatDate(tenant.move_in_date)}</span>
                            </div>
                              <div className="text-xs text-slate-500 pl-6">
                                Ends: {formatDate(tenant.lease_end_date, 'Month-to-Month')}
                              </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className={
                            tenant.lease_status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100'
                        }>
                            {formatStatus(tenant.lease_status)}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProfile(tenant)}
                            className="border-slate-300"
                          >
                            <Eye className="w-4 h-4 mr-1.5" /> View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMessage(tenant)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <MessageSquare className="w-4 h-4 mr-1.5" /> Message
                          </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
      </div>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          <DialogHeader>
            <div className="bg-gradient-to-r from-[#154279] to-[#0f325e] px-6 py-5 text-white">
              <DialogTitle className="text-xl">Tenant Details</DialogTitle>
              <DialogDescription className="text-blue-100 mt-1">
                Full tenant profile aligned with super admin detail view
              </DialogDescription>
            </div>
          </DialogHeader>
          {selectedTenant && (
            <div className="p-6 space-y-6">
              {isDetailsLoading ? (
                <div className="py-10 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#154279]" />
                  <p className="text-sm text-slate-500 mt-3">Fetching full tenant details...</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-slate-200">
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-xl font-bold">
                        {getInitials(tenantDetails?.tenant.first_name || selectedTenant.first_name, tenantDetails?.tenant.last_name || selectedTenant.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-slate-900 break-words">
                        {tenantDetails?.tenant.first_name || selectedTenant.first_name} {tenantDetails?.tenant.last_name || selectedTenant.last_name}
                      </h3>
                      <p className="text-sm text-slate-500 break-all">{tenantDetails?.tenant.email || selectedTenant.email || 'No email'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {formatStatus(tenantDetails?.tenant.lease_status || selectedTenant.lease_status)}
                        </Badge>
                        <Badge variant="outline">{tenantDetails?.account_status || 'active'}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone</p>
                      <p className="font-semibold text-slate-800">{tenantDetails?.tenant.phone || selectedTenant.phone || 'Not provided'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Property</p>
                      <p className="font-semibold text-slate-800 break-words">{tenantDetails?.property_name || propertyName || 'N/A'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Unit</p>
                      <p className="font-semibold text-slate-800">{tenantDetails?.tenant.unit_name || selectedTenant.unit_name || 'N/A'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Floor</p>
                      <p className="font-semibold text-slate-800">{tenantDetails?.floor_name || 'N/A'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1"><Calendar className="h-3.5 w-3.5 inline-block mr-1" /> Move In</p>
                      <p className="font-semibold text-slate-800">{formatDate(tenantDetails?.tenant.move_in_date || selectedTenant.move_in_date)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1"><FileText className="h-3.5 w-3.5 inline-block mr-1" /> Lease End</p>
                      <p className="font-semibold text-slate-800">{formatDate(tenantDetails?.tenant.lease_end_date || selectedTenant.lease_end_date, 'Month-to-Month')}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1"><User className="h-3.5 w-3.5 inline-block mr-1" /> Next of Kin</p>
                      <p className="font-semibold text-slate-800 break-words">{tenantDetails?.next_of_kin || 'Not provided'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1"><Mail className="h-3.5 w-3.5 inline-block mr-1" /> Next of Kin Email</p>
                      <p className="font-semibold text-slate-800 break-all">{tenantDetails?.next_of_kin_email || 'Not provided'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3 sm:col-span-2">
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1"><User className="h-3.5 w-3.5 inline-block mr-1" /> Nationality</p>
                      <p className="font-semibold text-slate-800">{tenantDetails?.nationality || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Audit Information</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <p className="text-slate-600">Tenant ID: <span className="font-medium text-slate-800 break-all">{selectedTenant.id}</span></p>
                      <p className="text-slate-600">Lease ID: <span className="font-medium text-slate-800 break-all">{tenantDetails?.lease_id || 'N/A'}</span></p>
                      <p className="text-slate-600">Profile Created: <span className="font-medium text-slate-800">{formatDate(tenantDetails?.profile_created_at)}</span></p>
                      <p className="text-slate-600">Lease Created: <span className="font-medium text-slate-800">{formatDate(tenantDetails?.lease_created_at)}</span></p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button variant="outline" onClick={() => setIsProfileOpen(false)}>Close</Button>
                <Button onClick={() => {
                  setIsProfileOpen(false);
                  if (selectedTenant) handleMessage(selectedTenant);
                }}>
                  <MessageSquare className="w-4 h-4 mr-2" /> Message Tenant
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerTenants;
