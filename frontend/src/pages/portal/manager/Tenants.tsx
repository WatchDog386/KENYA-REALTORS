import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Calendar,
  Home,
  DollarSign,
  FileText,
  Search,
  Filter,
  MoreVertical,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Ban,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useManager } from '@/hooks/useManager';
import { formatCurrency } from '@/utils/formatCurrency';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddTenantDialog } from '@/components/dialogs/AddTenantDialog';
import { TenantActionRequestDialog } from '@/components/dialogs/TenantActionRequestDialog';

const ManagerTenants = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [managerId, setManagerId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    overdue: 0,
    totalRent: 0
  });
  // Dialog states
  const [addTenantDialogOpen, setAddTenantDialogOpen] = useState(false);
  const [tenantActionDialogOpen, setTenantActionDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  useEffect(() => {
    fetchManagerAndProperty();
  }, []);

  useEffect(() => {
    if (propertyId) {
      fetchTenants();
    }
  }, [propertyId]);

  const fetchManagerAndProperty = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Could not get current user');
      
      setManagerId(user.id);

      // Get manager's assigned property
      const { data: assignments, error: assignError } = await supabase
        .from('property_manager_assignments')
        .select('property_id')
        .eq('property_manager_id', user.id)
        .limit(1)
        .single();

      if (!assignError && assignments) {
        setPropertyId(assignments.property_id);
      }
    } catch (err) {
      console.error('Error fetching manager info:', err);
    }
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      
      if (!propertyId) {
        setTenants([]);
        return;
      }

      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          user_id,
          property_id,
          unit_id,
          status,
          move_in_date,
          move_out_date,
          profiles:user_id (id, email, first_name, last_name),
          units:unit_id (unit_number)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTenants = (data || []).map((tenant: any) => ({
        id: tenant.id,
        name: `${tenant.profiles?.first_name || ''} ${tenant.profiles?.last_name || ''}`.trim(),
        email: tenant.profiles?.email,
        propertyId: tenant.property_id,
        unitId: tenant.unit_id,
        unit: tenant.units?.unit_number,
        status: tenant.status,
        moveInDate: tenant.move_in_date,
        moveOutDate: tenant.move_out_date,
        isActive: tenant.status === 'active',
        rent: 15000 // Mock value - should come from unit pricing
      }));

      setTenants(formattedTenants);

      // Update stats
      const activeCount = formattedTenants.filter(t => t.isActive).length;
      setStats({
        total: formattedTenants.length,
        active: activeCount,
        pending: 0,
        overdue: 0,
        totalRent: activeCount * 15000
      });
    } catch (err) {
      console.error('Error fetching tenants:', err);
      toast.error('Failed to load tenants');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(tenant => 
    tenant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.property?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (tenant: any) => {
    if (!tenant.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    
    // Check if rent is overdue
    const today = new Date();
    const paymentDay = 1;
    const currentDay = today.getDate();
    
    if (currentDay > paymentDay + 5) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertCircle className="w-3 h-3 mr-1" /> Overdue</Badge>;
    }
    
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
  };

  const sendReminder = async (tenantId: string, tenantName: string) => {
    try {
      // Create a notification for the tenant
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: tenantId,
          title: 'Rent Reminder',
          message: 'Your rent payment is due. Please make payment to avoid late fees.',
          type: 'payment',
          is_read: false
        });

      if (error) throw error;

      toast.success(`Reminder sent to ${tenantName}`);
    } catch (err) {
      console.error('Error sending reminder:', err);
      toast.error('Failed to send reminder');
    }
  };

  const terminateLease = async (leaseId: string, tenantName: string) => {
    if (!confirm(`Are you sure you want to terminate ${tenantName}'s lease?`)) return;

    try {
      const { error } = await supabase
        .from('leases')
        .update({
          status: 'terminated',
          terminated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', leaseId);

      if (error) throw error;

      toast.success('Lease terminated successfully');
      fetchTenants();
    } catch (err) {
      console.error('Error terminating lease:', err);
      toast.error('Failed to terminate lease');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-gray-600">Manage your property tenants</p>
        </div>
        <Button onClick={() => setAddTenantDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
          <UserPlus className="w-4 h-4 mr-2" />
          Assign Tenant
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow rounded-xl border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <p className="text-xs text-slate-500">All tenants</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow rounded-xl border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.active}</div>
            <p className="text-xs text-slate-500">Currently active</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow rounded-xl border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.overdue}</div>
            <p className="text-xs text-slate-500">Late payments</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow rounded-xl border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalRent)}</div>
            <p className="text-xs text-slate-500">Total monthly</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow rounded-xl border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.pending}</div>
            <p className="text-xs text-slate-500">Pending review</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Tenants List</CardTitle>
              <CardDescription>
                {filteredTenants.length} of {tenants.length} tenants
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tenants..."
                  className="pl-9 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTenants.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Move-in Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <Link to={`/portal/manager/tenants/${tenant.id}`} className="font-medium hover:text-blue-600">
                              {tenant.name}
                            </Link>
                            <p className="text-sm text-gray-500">Tenant ID: {tenant.id?.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{tenant.email}</span>
                          </div>
                          {tenant.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-sm">{tenant.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link to={`/portal/manager/properties/${tenant.propertyId}`} className="flex items-center gap-2 hover:text-blue-600">
                          <Home className="w-4 h-4 text-gray-400" />
                          <span>{tenant.property}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">{formatCurrency(tenant.rent)}</div>
                        <p className="text-xs text-gray-500">monthly</p>
                      </TableCell>
                      <TableCell>
                        {tenant.moveInDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{new Date(tenant.moveInDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(tenant)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => sendReminder(tenant.id, tenant.name)}
                          >
                            Send Reminder
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link to={`/portal/manager/tenants/${tenant.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedTenant(tenant);
                                  setTenantActionDialogOpen(true);
                                }}
                                className="text-yellow-600"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Suspend Tenant
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedTenant({ ...tenant, action: 'remove' });
                                  setTenantActionDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Tenant
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery ? 'Try a different search term' : 'No tenants assigned to your properties yet'}
              </p>
              <Button asChild>
                <Link to="/portal/manager/tenants/new">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Your First Tenant
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Tenant Dialog */}
      <AddTenantDialog
        open={addTenantDialogOpen}
        onOpenChange={setAddTenantDialogOpen}
        propertyId={propertyId}
        managerId={managerId}
        onSuccess={() => fetchTenants()}
      />

      {/* Tenant Action Request Dialog */}
      {selectedTenant && (
        <TenantActionRequestDialog
          open={tenantActionDialogOpen}
          onOpenChange={setTenantActionDialogOpen}
          tenantId={selectedTenant.id}
          tenantName={selectedTenant.name}
          propertyId={propertyId}
          managerId={managerId}
          onSuccess={() => {
            fetchTenants();
            setSelectedTenant(null);
          }}
        />
      )}
    </div>
  );
};

export default ManagerTenants;