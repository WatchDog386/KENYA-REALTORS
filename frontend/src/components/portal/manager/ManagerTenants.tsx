// src/components/portal/manager/ManagerTenants.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getManagerAssignedPropertyIds } from '@/services/managerPropertyAssignmentService';
import {
  Card,
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

      const propertyIds = await getManagerAssignedPropertyIds(user.id);

      if (propertyIds.length === 0) {
        setTenants([]);
        return;
      }

      const { data: managerProperties, error: managerPropertiesError } = await supabase
        .from('properties')
        .select('id, name')
        .in('id', propertyIds);

      if (managerPropertiesError) {
        throw managerPropertiesError;
      }

      if ((managerProperties || []).length === 1) {
        setPropertyName(String((managerProperties as any[])[0]?.name || ''));
      } else {
        setPropertyName(`${propertyIds.length} properties`);
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
        .in('status', ['active', 'pending', 'approved', 'manager_approved', 'pending_renewal'])
        .in('units.property_id', propertyIds);

      if (leasesError) throw leasesError;

      if (!activeLeases || activeLeases.length === 0) {
        setTenants([]);
        return;
      }

      // Leases can reference either profiles.id or tenants.id depending on onboarding path.
      const leaseTenantIds = Array.from(
        new Set(activeLeases.map((lease: any) => lease.tenant_id).filter(Boolean))
      );

      const tenantIdToProfileId = new Map<string, string>();
      let profilesMap = new Map<string, any>();

      if (leaseTenantIds.length > 0) {
        const { data: directProfiles, error: directProfilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, avatar_url')
          .in('id', leaseTenantIds);

        if (directProfilesError) throw directProfilesError;

        profilesMap = new Map((directProfiles || []).map((profile: any) => [profile.id, profile]));

        const unresolvedLeaseTenantIds = leaseTenantIds.filter((tenantId) => !profilesMap.has(tenantId));

        if (unresolvedLeaseTenantIds.length > 0) {
          const { data: tenantRows, error: tenantRowsError } = await supabase
            .from('tenants')
            .select('id, user_id')
            .in('id', unresolvedLeaseTenantIds);

          if (tenantRowsError && tenantRowsError.code !== 'PGRST116') throw tenantRowsError;

          (tenantRows || []).forEach((row: any) => {
            if (row?.id && row?.user_id) {
              tenantIdToProfileId.set(row.id, row.user_id);
            }
          });

          const missingProfileIds = Array.from(
            new Set((tenantRows || []).map((row: any) => row?.user_id).filter(Boolean))
          ).filter((profileId) => !profilesMap.has(profileId));

          if (missingProfileIds.length > 0) {
            const { data: fallbackProfiles, error: fallbackProfilesError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, email, phone, avatar_url')
              .in('id', missingProfileIds);

            if (fallbackProfilesError) throw fallbackProfilesError;

            (fallbackProfiles || []).forEach((profile: any) => {
              profilesMap.set(profile.id, profile);
            });
          }
        }
      }

      const formattedTenants: Tenant[] = activeLeases.map((lease: any) => {
        const resolvedProfileId = tenantIdToProfileId.get(lease.tenant_id) || lease.tenant_id;
        const profile = profilesMap.get(resolvedProfileId) || {};
        const unit = lease.units || {};
        
        return {
          id: resolvedProfileId,
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
      <div className="flex min-h-[55vh] items-center justify-center bg-[#d7dce1]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#154279]" />
          <p className="text-[13px] font-medium text-[#5f6b7c]">Loading tenants...</p>
        </div>
      </div>
    );
  }

  const activeLeaseCount = tenants.filter((tenant) => tenant.lease_status === 'active').length;
  const newMoveInsCount = tenants.filter((tenant) => {
    if (!tenant.move_in_date) return false;
    const moveInDate = new Date(tenant.move_in_date);
    const now = new Date();
    const diffTime = now.getTime() - moveInDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 font-['Poppins','Segoe_UI',sans-serif] text-[#243041] md:p-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="border border-[#bcc3cd] bg-[#eef1f4] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[#6a7788]">Property Management</p>
              <h1 className="mt-1 text-[42px] font-bold leading-none text-[#1f2937]">Tenant Directory</h1>
              <p className="mt-2 text-[13px] font-medium text-[#5f6b7c]">
                Manage residents for <span className="font-semibold text-[#324156]">{propertyName || 'Your Property'}</span>
              </p>
            </div>
            <span className="inline-flex items-center bg-[#1f5e8f] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              {tenants.length} Active Tenants
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="overflow-hidden border border-[#adb5bf] rounded-none">
              <div className="bg-[#2aa8bf] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Total Tenants</p>
                <p className="mt-1 text-[40px] font-bold leading-none text-white">{tenants.length}</p>
              </div>
              <div className="bg-[#1f93a8] px-3 py-1.5 text-[18px] font-medium text-white">All registered tenants</div>
            </div>
            <div className="overflow-hidden border border-[#adb5bf] rounded-none">
              <div className="bg-[#2daf4a] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Active Leases</p>
                <p className="mt-1 text-[40px] font-bold leading-none text-white">{activeLeaseCount}</p>
              </div>
              <div className="bg-[#24933d] px-3 py-1.5 text-[18px] font-medium text-white">Current occupancy</div>
            </div>
            <div className="overflow-hidden border border-[#adb5bf] rounded-none">
              <div className="bg-[#f3bd11] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1f2937]/80">Move-ins (30d)</p>
                <p className="mt-1 text-[40px] font-bold leading-none text-[#1f2937]">{newMoveInsCount}</p>
              </div>
              <div className="bg-[#d6a409] px-3 py-1.5 text-[18px] font-medium text-[#1f2937]">Recent tenants</div>
            </div>
          </div>
        </section>

        <section className="border border-[#bcc3cd] bg-[#eef1f4]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c4cad3] px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold text-[#1f2937]">Tenants and Leases</p>
              <p className="text-[12px] font-medium text-[#5f6b7c]">{filteredTenants.length} records</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-10 rounded-none border border-[#b6bec8] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]"
              >
                <Download className="mr-2 h-3.5 w-3.5" /> Export List
              </Button>
              <Button className="h-10 rounded-none border border-[#d96d26] bg-[#F96302] px-4 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#e15802]">
                <Mail className="mr-2 h-3.5 w-3.5" /> Message All
              </Button>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8595]" />
                <Input
                  placeholder="Search tenants by name, email, or unit"
                  className="h-10 rounded-none border border-[#b6bec8] bg-white px-3 pl-9 text-[13px] text-[#1f2937] shadow-none focus-visible:border-[#F96302] focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center border border-[#b6bec8] bg-white">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#154279] text-white' : 'text-[#5f6b7c] hover:bg-[#f5f7fa]'}`}
                    title="Grid View"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#154279] text-white' : 'text-[#5f6b7c] hover:bg-[#f5f7fa]'}`}
                    title="List View"
                  >
                    <List size={18} />
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-none border border-[#b6bec8] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]"
                >
                  <Filter className="mr-2 h-3.5 w-3.5" /> Filter
                </Button>
              </div>
            </div>

            {filteredTenants.length === 0 ? (
              <div className="border border-[#c4cad3] bg-white py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-[#d4dae3] bg-[#f6f8fb]">
                  <Users className="h-7 w-7 text-[#7a8595]" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#1f2937]">No tenants found</h3>
                <p className="mt-1 text-[13px] font-medium text-[#5f6b7c]">
                  {searchTerm ? `No results for "${searchTerm}"` : "You don't have any active tenants yet."}
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                    className="mt-4 h-9 rounded-none border border-[#b6bec8] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-2 xl:grid-cols-3">
                {filteredTenants.map((tenant) => {
                  const isActive = tenant.lease_status === 'active';
                  const headerClass = isActive ? 'bg-[#2daf4a]' : 'bg-[#f3bd11]';
                  const headerTitleClass = isActive ? 'text-white' : 'text-[#1f2937]';
                  const headerSubtitleClass = isActive ? 'text-white/90' : 'text-[#1f2937]/80';
                  const badgeClass = isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <div key={tenant.id} className="border border-[#c4cad3] bg-white">
                      <div className={`${headerClass} flex items-start justify-between gap-3 px-4 py-3`}>
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-11 w-11 border border-white/60">
                            <AvatarFallback className="bg-white text-[13px] font-bold text-[#1f2937]">
                              {getInitials(tenant.first_name, tenant.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className={`truncate text-[14px] font-bold ${headerTitleClass}`}>
                              {tenant.first_name} {tenant.last_name}
                            </p>
                            <p className={`truncate text-[11px] font-medium ${headerSubtitleClass}`}>
                              ID: {tenant.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${badgeClass}`}>
                          {formatStatus(tenant.lease_status)}
                        </span>
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="border border-[#d4dae3] bg-[#f6f8fb] p-3">
                          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]">
                            <Mail className="h-3.5 w-3.5" /> Email
                          </p>
                          <p className="break-all text-[13px] font-semibold text-[#324156]">{tenant.email || 'No email provided'}</p>
                        </div>
                        <div className="border border-[#d4dae3] bg-[#f6f8fb] p-3">
                          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]">
                            <Phone className="h-3.5 w-3.5" /> Phone
                          </p>
                          <p className="text-[13px] font-semibold text-[#324156]">{tenant.phone || 'Not provided'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="border border-[#d4dae3] bg-white p-3">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]">Unit</p>
                            <p className="text-[13px] font-semibold text-[#1f2937]">{tenant.unit_name || 'Unassigned'}</p>
                          </div>
                          <div className="border border-[#d4dae3] bg-white p-3">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]">Move In</p>
                            <p className="text-[13px] font-semibold text-[#1f2937]">{formatDate(tenant.move_in_date)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            onClick={() => handleViewProfile(tenant)}
                            variant="outline"
                            className="h-10 rounded-none border border-[#154279] bg-white text-[11px] font-semibold uppercase tracking-wide text-[#154279] hover:bg-[#f5f7fa]"
                          >
                            <Eye size={15} className="mr-1.5" /> Details
                          </Button>
                          <Button
                            onClick={() => handleMessage(tenant)}
                            className="h-10 rounded-none border border-[#d96d26] bg-[#F96302] text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#e15802]"
                          >
                            <MessageSquare size={15} className="mr-1.5" /> Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="overflow-hidden rounded-none border border-[#c4cad3] bg-white shadow-none">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-[#c4cad3] bg-[#e8ecf1] hover:bg-[#e8ecf1]">
                        <TableHead className="h-12 text-xs font-bold uppercase tracking-widest text-[#324156]">Tenant</TableHead>
                        <TableHead className="h-12 text-xs font-bold uppercase tracking-widest text-[#324156]">Contact</TableHead>
                        <TableHead className="h-12 text-xs font-bold uppercase tracking-widest text-[#324156]">Unit</TableHead>
                        <TableHead className="h-12 text-xs font-bold uppercase tracking-widest text-[#324156]">Lease</TableHead>
                        <TableHead className="h-12 text-xs font-bold uppercase tracking-widest text-[#324156]">Status</TableHead>
                        <TableHead className="h-12 pr-4 text-right text-xs font-bold uppercase tracking-widest text-[#324156]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTenants.map((tenant) => (
                        <TableRow key={tenant.id} className="border-b border-[#d4dae3] hover:bg-[#f6f8fb]">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border border-[#c4cad3]">
                                <AvatarFallback className="bg-[#eef1f4] font-bold text-[#154279]">
                                  {getInitials(tenant.first_name, tenant.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-[13px] font-semibold text-[#1f2937]">{tenant.first_name} {tenant.last_name}</p>
                                <p className="text-[11px] font-medium text-[#5f6b7c]">ID: {tenant.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[260px] space-y-1">
                              <div className="flex items-center gap-2 text-[12px] text-[#5f6b7c]">
                                <Mail size={14} className="text-[#7a8595]" />
                                <span className="break-all">{tenant.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[12px] text-[#5f6b7c]">
                                <Phone size={14} className="text-[#7a8595]" />
                                <span>{tenant.phone || 'Not provided'}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="inline-flex items-center gap-2 border border-[#bfd7ef] bg-[#e9f3ff] px-2.5 py-1.5 text-[12px] font-semibold text-[#1f5e8f]">
                              <Building2 className="h-4 w-4" />
                              Unit {tenant.unit_name}
                            </div>
                            <p className="mt-1 text-[11px] font-medium text-[#5f6b7c]">{propertyName || 'Property'}</p>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-[12px] text-[#5f6b7c]">
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-[#7a8595]" />
                                <span>In: {formatDate(tenant.move_in_date)}</span>
                              </div>
                              <div className="pl-6">Ends: {formatDate(tenant.lease_end_date, 'Month-to-Month')}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                tenant.lease_status === 'active'
                                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
                                  : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50'
                              }
                            >
                              {formatStatus(tenant.lease_status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewProfile(tenant)}
                                className="h-8 rounded-none border border-[#154279] bg-white text-[11px] font-semibold uppercase tracking-wide text-[#154279] hover:bg-[#f5f7fa]"
                              >
                                <Eye className="mr-1 h-3.5 w-3.5" /> Details
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleMessage(tenant)}
                                className="h-8 rounded-none border border-[#d96d26] bg-[#F96302] text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#e15802]"
                              >
                                <MessageSquare className="mr-1 h-3.5 w-3.5" /> Message
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
        </section>
      </div>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent
          overlayClassName="bg-black/45 backdrop-blur-none"
          className="sm:max-w-3xl rounded-none border border-[#bcc3cd] bg-[#eef1f4] p-0 shadow-xl"
        >
          <DialogHeader>
            <div className="bg-[#154279] px-6 py-5 text-white">
              <DialogTitle className="text-xl font-bold">Tenant Details</DialogTitle>
              <DialogDescription className="mt-1 text-blue-100">
                Full tenant profile aligned with super admin detail view
              </DialogDescription>
            </div>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-5 p-5">
              {isDetailsLoading ? (
                <div className="py-10 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#154279]" />
                  <p className="mt-3 text-sm text-[#5f6b7c]">Fetching full tenant details...</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4 border border-[#c4cad3] bg-white p-4 sm:flex-row sm:items-center">
                    <Avatar className="h-16 w-16 border border-[#c4cad3]">
                      <AvatarFallback className="bg-[#eef1f4] text-xl font-bold text-[#154279]">
                        {getInitials(tenantDetails?.tenant.first_name || selectedTenant.first_name, tenantDetails?.tenant.last_name || selectedTenant.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="break-words text-xl font-bold text-[#1f2937]">
                        {tenantDetails?.tenant.first_name || selectedTenant.first_name} {tenantDetails?.tenant.last_name || selectedTenant.last_name}
                      </h3>
                      <p className="break-all text-sm font-medium text-[#5f6b7c]">{tenantDetails?.tenant.email || selectedTenant.email || 'No email'}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                          {formatStatus(tenantDetails?.tenant.lease_status || selectedTenant.lease_status)}
                        </Badge>
                        <Badge variant="outline" className="rounded-none border-[#b6bec8] bg-white text-[#465870]">
                          {tenantDetails?.account_status || 'active'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="border border-[#c4cad3] bg-white p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]"><Phone className="h-3.5 w-3.5" /> Phone</p>
                      <p className="text-[13px] font-semibold text-[#324156]">{tenantDetails?.tenant.phone || selectedTenant.phone || 'Not provided'}</p>
                    </div>
                    <div className="border border-[#c4cad3] bg-white p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]"><Building2 className="h-3.5 w-3.5" /> Property</p>
                      <p className="break-words text-[13px] font-semibold text-[#324156]">{tenantDetails?.property_name || propertyName || 'N/A'}</p>
                    </div>
                    <div className="border border-[#c4cad3] bg-white p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]"><Hash className="h-3.5 w-3.5" /> Unit</p>
                      <p className="text-[13px] font-semibold text-[#324156]">{tenantDetails?.tenant.unit_name || selectedTenant.unit_name || 'N/A'}</p>
                    </div>
                    <div className="border border-[#c4cad3] bg-white p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]">Floor</p>
                      <p className="text-[13px] font-semibold text-[#324156]">{tenantDetails?.floor_name || 'N/A'}</p>
                    </div>
                    <div className="border border-[#c4cad3] bg-white p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]"><Calendar className="mr-1 inline-block h-3.5 w-3.5" /> Move In</p>
                      <p className="text-[13px] font-semibold text-[#324156]">{formatDate(tenantDetails?.tenant.move_in_date || selectedTenant.move_in_date)}</p>
                    </div>
                    <div className="border border-[#c4cad3] bg-white p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]"><FileText className="mr-1 inline-block h-3.5 w-3.5" /> Lease End</p>
                      <p className="text-[13px] font-semibold text-[#324156]">{formatDate(tenantDetails?.tenant.lease_end_date || selectedTenant.lease_end_date, 'Month-to-Month')}</p>
                    </div>
                    <div className="border border-[#c4cad3] bg-white p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]"><User className="mr-1 inline-block h-3.5 w-3.5" /> Next of Kin</p>
                      <p className="break-words text-[13px] font-semibold text-[#324156]">{tenantDetails?.next_of_kin || 'Not provided'}</p>
                    </div>
                    <div className="border border-[#c4cad3] bg-white p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]"><Mail className="mr-1 inline-block h-3.5 w-3.5" /> Next of Kin Email</p>
                      <p className="break-all text-[13px] font-semibold text-[#324156]">{tenantDetails?.next_of_kin_email || 'Not provided'}</p>
                    </div>
                    <div className="border border-[#c4cad3] bg-white p-3 sm:col-span-2">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]"><User className="mr-1 inline-block h-3.5 w-3.5" /> Nationality</p>
                      <p className="text-[13px] font-semibold text-[#324156]">{tenantDetails?.nationality || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="border border-[#c4cad3] bg-white p-4">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#6a7788]">Audit Information</p>
                    <div className="grid grid-cols-1 gap-3 text-[12px] text-[#5f6b7c] sm:grid-cols-2">
                      <p>Tenant ID: <span className="break-all font-semibold text-[#324156]">{selectedTenant.id}</span></p>
                      <p>Lease ID: <span className="break-all font-semibold text-[#324156]">{tenantDetails?.lease_id || 'N/A'}</span></p>
                      <p>Profile Created: <span className="font-semibold text-[#324156]">{formatDate(tenantDetails?.profile_created_at)}</span></p>
                      <p>Lease Created: <span className="font-semibold text-[#324156]">{formatDate(tenantDetails?.lease_created_at)}</span></p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsProfileOpen(false)}
                  className="h-10 rounded-none border border-[#b6bec8] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (selectedTenant) handleMessage(selectedTenant);
                  }}
                  className="h-10 rounded-none border border-[#d96d26] bg-[#F96302] px-4 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#e15802]"
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> Message Tenant
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
