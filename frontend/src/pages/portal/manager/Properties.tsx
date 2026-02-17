import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building, 
  Home, 
  Users, 
  DollarSign, 
  MapPin, 
  Calendar,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Loader2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Wrench,
  CheckCircle,
  XCircle,
  Briefcase,
  Hammer
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useManager } from '@/hooks/useManager';
import { formatCurrency } from '@/utils/formatCurrency';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ProprietorAssignmentDialog,
  TechnicianAssignmentDialog,
  CaretakerAssignmentDialog
} from '@/components/PropertyAssignments';
import { TechniciansList, CaretakersList } from '@/components/Properties';

const ManagerProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    maintenanceCount: 0
  });

  // Assignment dialog states
  const [selectedPropertyForProprietor, setSelectedPropertyForProprietor] = useState<string | null>(null);
  const [selectedPropertyForTechnician, setSelectedPropertyForTechnician] = useState<string | null>(null);
  const [selectedPropertyForCaretaker, setSelectedPropertyForCaretaker] = useState<string | null>(null);
  const [selectedPropertyForStaffView, setSelectedPropertyForStaffView] = useState<string | null>(null);

  const { getAssignedProperties, getMaintenanceRequests } = useManager();

  useEffect(() => {
    fetchProperties();
    fetchMaintenanceCount();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await getAssignedProperties();
      setProperties(data || []);

      // Calculate stats
      if (data && data.length > 0) {
        const totalProperties = data.length;
        const totalUnits = data.reduce((sum, prop) => sum + (prop.total_units || 0), 0);
        const occupiedUnits = data.reduce((sum, prop) => sum + (prop.occupied_units || 0), 0);
        const totalRevenue = data.reduce((sum, prop) => {
          // Calculate revenue from occupied units
          const monthlyRevenue = (prop.occupied_units || 0) * (prop.monthly_rent || 0);
          return sum + monthlyRevenue;
        }, 0);
        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

        setStats(prev => ({
          ...prev,
          totalProperties,
          totalUnits,
          occupiedUnits,
          totalRevenue,
          occupancyRate
        }));
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceCount = async () => {
    try {
      const maintenance = await getMaintenanceRequests();
      setStats(prev => ({
        ...prev,
        maintenanceCount: maintenance?.filter(m => m.status === 'pending' || m.status === 'assigned').length || 0
      }));
    } catch (err) {
      console.error('Error fetching maintenance count:', err);
    }
  };

  const filteredProperties = properties.filter(property => 
    property.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Wrench className="w-3 h-3 mr-1" /> Maintenance</Badge>;
      case 'vacant':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Home className="w-3 h-3 mr-1" /> Vacant</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100"><XCircle className="w-3 h-3 mr-1" /> Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to deactivate this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          is_active: false,
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (error) throw error;

      toast.success('Property deactivated successfully');
      fetchProperties();
    } catch (err) {
      console.error('Error deactivating property:', err);
      toast.error('Failed to deactivate property');
    }
  };

  const activateProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          is_active: true,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (error) throw error;

      toast.success('Property activated successfully');
      fetchProperties();
    } catch (err) {
      console.error('Error activating property:', err);
      toast.error('Failed to activate property');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#00356B]" />
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00356B] to-[#00356B]/80 rounded-xl shadow-lg p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">My Properties</h1>
            <p className="text-blue-100 text-sm mt-1">Manage your assigned properties and units</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="border border-white text-white hover:bg-white/20 px-6 py-3 rounded-md">
            <Link to="/portal/manager/properties/units">
              <Home className="w-4 h-4 mr-2" />
              View Units
            </Link>
          </Button>
          <Button asChild className="bg-[#D85C2C] text-white px-6 py-3 text-[10px] font-black uppercase tracking-[1.5px] hover:bg-[#b84520] rounded-md shadow-sm">
            <Link to="/portal/manager/properties/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-gray-500">Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Home className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnits}</div>
            <p className="text-xs text-gray-500">All units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupiedUnits}</div>
            <p className="text-xs text-gray-500">Currently occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-gray-500">From occupied units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">Current rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenanceCount}</div>
            <p className="text-xs text-gray-500">Pending requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Properties List</CardTitle>
              <CardDescription>
                {filteredProperties.length} of {properties.length} properties
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search properties..."
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
          {filteredProperties.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Property</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-center">Units</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <Link to={`/portal/manager/properties/${property.id}`} className="font-medium hover:text-blue-600">
                              {property.name}
                            </Link>
                            <p className="text-sm text-gray-500">
                              {property.property_type} • {property.tenants?.length || 0} tenants
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{property.city}</p>
                            <p className="text-sm text-gray-500 truncate max-w-[150px]">{property.address}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold">{property.occupied_units || 0}/{property.total_units || 0}</span>
                          <span className="text-xs text-gray-500">occupied/total</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">{formatCurrency(property.monthly_rent || 0)}</div>
                        <p className="text-xs text-gray-500">per unit/month</p>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(property.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/portal/manager/properties/${property.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/portal/manager/properties/${property.id}/edit`}>
                              <Edit className="w-4 h-4" />
                            </Link>
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
                                <Link to={`/portal/manager/properties/${property.id}/tenants`}>
                                  View Tenants
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/portal/manager/properties/${property.id}/maintenance`}>
                                  View Maintenance
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/portal/manager/properties/${property.id}/payments`}>
                                  View Payments
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setSelectedPropertyForStaffView(property.id)}
                              >
                                <Users className="w-4 h-4 mr-2" />
                                View Assigned Staff
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs">Assign Staff</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => setSelectedPropertyForProprietor(property.id)}
                              >
                                <Briefcase className="w-4 h-4 mr-2" />
                                Assign Proprietor
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setSelectedPropertyForTechnician(property.id)}
                              >
                                <Wrench className="w-4 h-4 mr-2" />
                                Assign Technician
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setSelectedPropertyForCaretaker(property.id)}
                              >
                                <Hammer className="w-4 h-4 mr-2" />
                                Assign Caretaker
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {property.is_active ? (
                                <DropdownMenuItem 
                                  onClick={() => deleteProperty(property.id)}
                                  className="text-red-600"
                                >
                                  Deactivate Property
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => activateProperty(property.id)}
                                  className="text-green-600"
                                >
                                  Activate Property
                                </DropdownMenuItem>
                              )}
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
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery ? 'Try a different search term' : 'No properties assigned to you yet'}
              </p>
              <Button asChild>
                <Link to="/portal/manager/properties/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Property
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialogs */}
      {selectedPropertyForProprietor !== null && (
        <ProprietorAssignmentDialog
          propertyId={selectedPropertyForProprietor}
          open={selectedPropertyForProprietor !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedPropertyForProprietor(null);
          }}
          onAssignmentChanged={() => {
            setSelectedPropertyForProprietor(null);
            fetchProperties();
          }}
        />
      )}

      {selectedPropertyForTechnician !== null && (
        <TechnicianAssignmentDialog
          propertyId={selectedPropertyForTechnician}
          open={selectedPropertyForTechnician !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedPropertyForTechnician(null);
          }}
          onAssignmentChanged={() => {
            setSelectedPropertyForTechnician(null);
            fetchProperties();
          }}
        />
      )}

      {selectedPropertyForCaretaker !== null && (
        <CaretakerAssignmentDialog
          propertyId={selectedPropertyForCaretaker}
          open={selectedPropertyForCaretaker !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedPropertyForCaretaker(null);
          }}
          onAssignmentChanged={() => {
            setSelectedPropertyForCaretaker(null);
            fetchProperties();
          }}
        />
      )}

      {selectedPropertyForStaffView !== null && (
        <Dialog open={!!selectedPropertyForStaffView} onOpenChange={(open) => !open && setSelectedPropertyForStaffView(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assigned Staff</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
               <TechniciansList propertyId={selectedPropertyForStaffView} />
               <CaretakersList propertyId={selectedPropertyForStaffView} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ManagerProperties;