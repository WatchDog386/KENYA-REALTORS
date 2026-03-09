// src/components/portal/manager/ManagerTenants.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  User, 
  FileText, 
  MoreVertical,
  Filter,
  Download,
  Loader2,
  MessageSquare,
  LayoutGrid,
  List
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

const ManagerTenants: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  const handleViewProfile = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsProfileOpen(true);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                {filteredTenants.map((tenant) => {
                    const isActive = tenant.lease_status === 'active';
                    const gradientClass = isActive 
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600" 
                        : "bg-gradient-to-r from-amber-500 to-orange-600";
                    const avatarBg = isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
                    const buttonClass = isActive
                         ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                         : "bg-orange-500 hover:bg-orange-600 shadow-orange-200";

                    return (
                        <div key={tenant.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-visible flex flex-col h-full sticky-card relative">
                            {/* Card Header */}
                            <div className={`h-24 ${gradientClass} rounded-t-xl relative overflow-hidden`}>
                                <div className="absolute top-3 right-3 z-10">
                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                                        {tenant.lease_status === 'active' ? 'Active Lease' : tenant.lease_status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="absolute inset-0 bg-black/5 mix-blend-overlay"></div>
                            </div>
                            
                            {/* Card Body */}
                            <div className="px-6 relative flex-1 flex flex-col bg-white rounded-b-xl">
                                <div className="-mt-12 mb-4 flex justify-between items-end relative z-10">
                                    <Avatar className="h-24 w-24 border-4 border-white shadow-md bg-white">
                                        <AvatarFallback className={`${avatarBg} text-2xl font-bold`}>
                                            {getInitials(tenant.first_name, tenant.last_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="mb-1 text-right max-w-[50%]">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Unit</span>
                                        <span className="text-2xl font-bold text-slate-800 truncate block" title={tenant.unit_name}>{tenant.unit_name}</span>
                                    </div>
                                </div>
                                
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight truncate" title={`${tenant.first_name} ${tenant.last_name}`}>
                                        {tenant.first_name} {tenant.last_name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                                        <Mail size={14} className="shrink-0" />
                                        <span className="truncate" title={tenant.email}>{tenant.email}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6 flex-1">
                                    <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                                        <span className="text-slate-500 flex items-center gap-2"><Phone size={14} /> Phone</span>
                                        <span className="font-medium text-slate-700">{tenant.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                                        <span className="text-slate-500 flex items-center gap-2"><Calendar size={14} /> Move In</span>
                                        <span className="font-medium text-slate-700">{tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                                        <span className="text-slate-500 flex items-center gap-2"><FileText size={14} /> Lease End</span>
                                        <span className="font-medium text-slate-700">{tenant.lease_end_date ? new Date(tenant.lease_end_date).toLocaleDateString() : 'Month-to-Month'}</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 pb-6 mt-auto">
                                    <Button 
                                        onClick={() => handleViewProfile(tenant)}
                                        className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all h-9"
                                    >
                                        <User size={16} className="mr-2" /> Profile
                                    </Button>
                                    <Button 
                                        onClick={() => handleMessage(tenant)}
                                        className={`flex-1 text-white shadow-sm h-9 ${buttonClass}`}
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
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[300px]">Tenant</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Unit / Property</TableHead>
                  <TableHead>Lease Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id} className="group hover:bg-slate-50/50 transition-colors">
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
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail size={14} className="text-slate-400" />
                                <span className="truncate max-w-[180px]" title={tenant.email}>{tenant.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={14} className="text-slate-400" />
                                <span>{tenant.phone || 'N/A'}</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                             <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm">
                                 {tenant.unit_name}
                             </div>
                             <span className="text-sm font-medium text-slate-600">{propertyName}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <Calendar size={14} className="text-slate-400" />
                                <span>In: {tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : '-'}</span>
                            </div>
                            {tenant.lease_end_date && (
                                <div className="text-xs text-slate-500 pl-6">
                                    Ends: {new Date(tenant.lease_end_date).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className={
                            tenant.lease_status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100'
                        }>
                            {tenant.lease_status.replace('_', ' ')}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                                    <MoreVertical size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <User className="w-4 h-4 mr-2" /> View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <FileText className="w-4 h-4 mr-2" /> Lease Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <MessageSquare className="w-4 h-4 mr-2" /> Message
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tenant Profile</DialogTitle>
            <DialogDescription>
              Details for {selectedTenant?.first_name} {selectedTenant?.last_name}
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-slate-200">
                    <AvatarFallback className="bg-slate-100 text-slate-700 text-xl font-bold">
                        {getInitials(selectedTenant.first_name, selectedTenant.last_name)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedTenant.first_name} {selectedTenant.last_name}</h3>
                    <p className="text-sm text-slate-500">{selectedTenant.email}</p>
                    <Badge variant="secondary" className="mt-1">{selectedTenant.lease_status.replace('_', ' ')}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Phone</Label>
                      <div className="font-medium">{selectedTenant.phone || 'N/A'}</div>
                  </div>
                  <div className="space-y-1">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Unit</Label>
                      <div className="font-medium text-indigo-600">{selectedTenant.unit_name}</div>
                  </div>
                  <div className="space-y-1">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Move In Date</Label>
                      <div className="font-medium">{selectedTenant.move_in_date ? new Date(selectedTenant.move_in_date).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div className="space-y-1">
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Lease End</Label>
                      <div className="font-medium">{selectedTenant.lease_end_date ? new Date(selectedTenant.lease_end_date).toLocaleDateString() : 'Month-to-month'}</div>
                  </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
             <Button variant="outline" onClick={() => setIsProfileOpen(false)}>Close</Button>
             <Button onClick={() => {
                setIsProfileOpen(false);
                if(selectedTenant) handleMessage(selectedTenant);
             }}>
                <MessageSquare className="w-4 h-4 mr-2" /> Send Message
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerTenants;
