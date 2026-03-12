import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building, 
  Home, 
  Users, 
  DollarSign, 
  MapPin, 
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Loader2,
  BarChart3,
  Wrench,
  CheckCircle,
  XCircle,
  Briefcase,
  Hammer,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  ArrowLeft,
  BedDouble,
  KeyRound,
  Hash,
  Layers,
  ChevronUp
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
import {
  ProprietorAssignmentDialog,
  TechnicianAssignmentDialog,
  CaretakerAssignmentDialog
} from '@/components/PropertyAssignments';

type ViewMode = 'grid' | 'list' | 'hierarchy';

interface PropertyUnit {
  id: string;
  unit_number: string;
  status: string;
  floor_number?: number;
  price?: number;
  description?: string;
  property_unit_types?: { unit_type_name?: string; name?: string; price_per_unit?: number };
}

const ManagerProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  // The currently-drilled-into property (shows units panel)
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [propertyUnits, setPropertyUnits] = useState<PropertyUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');
  
  // Track expanded properties in hierarchy view
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());
  const [propertyUnitsCache, setPropertyUnitsCache] = useState<{ [propertyId: string]: PropertyUnit[] }>({});

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

  const { getAssignedProperties, getMaintenanceRequests } = useManager();

  useEffect(() => {
    fetchProperties();
    fetchMaintenanceCount();
  }, []);

  const fetchUnitsForProperty = useCallback(async (propertyId: string) => {
    try {
      setUnitsLoading(true);
      const { data, error } = await supabase
        .from('property_units')
        .select(`
          id,
          unit_number,
          status,
          floor_number,
          price,
          description,
          property_unit_types(unit_type_name, price_per_unit)
        `)
        .eq('property_id', propertyId)
        .order('unit_number', { ascending: true });
      if (error) throw error;
      setPropertyUnits(data || []);
    } catch (err) {
      console.error('Error fetching units:', err);
      toast.error('Failed to load units');
      setPropertyUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  }, []);

  const handleSelectProperty = (property: any) => {
    setSelectedProperty(property);
    setUnitSearch('');
    fetchUnitsForProperty(property.id);
  };

  const handleBackToProperties = () => {
    setSelectedProperty(null);
    setPropertyUnits([]);
    setUnitSearch('');
  };

  // Hierarchy view handlers
  const togglePropertyExpanded = async (propertyId: string) => {
    const newExpanded = new Set(expandedProperties);
    
    if (newExpanded.has(propertyId)) {
      // Collapse
      newExpanded.delete(propertyId);
    } else {
      // Expand - fetch units if not cached
      if (!propertyUnitsCache[propertyId]) {
        try {
          const { data, error } = await supabase
            .from('property_units')
            .select(`
              id,
              unit_number,
              status,
              floor_number,
              price,
              description,
              property_unit_types(unit_type_name, price_per_unit)
            `)
            .eq('property_id', propertyId)
            .order('unit_number', { ascending: true });
          
          if (error) throw error;
          
          setPropertyUnitsCache(prev => ({
            ...prev,
            [propertyId]: data || []
          }));
        } catch (err) {
          console.error('Error fetching units:', err);
          toast.error('Failed to load units');
        }
      }
      newExpanded.add(propertyId);
    }
    
    setExpandedProperties(newExpanded);
  };

  const expandAllProperties = async () => {
    const newExpanded = new Set<string>();
    const newCache = { ...propertyUnitsCache };
    
    for (const property of filteredProperties) {
      newExpanded.add(property.id);
      
      // Fetch units if not already cached
      if (!newCache[property.id]) {
        try {
          const { data, error } = await supabase
            .from('property_units')
            .select(`
              id,
              unit_number,
              status,
              floor_number,
              price,
              description,
              property_unit_types(unit_type_name, price_per_unit)
            `)
            .eq('property_id', property.id)
            .order('unit_number', { ascending: true });
          
          if (error) throw error;
          newCache[property.id] = data || [];
        } catch (err) {
          console.error('Error fetching units for property:', property.id, err);
        }
      }
    }
    
    setPropertyUnitsCache(newCache);
    setExpandedProperties(newExpanded);
  };

  const collapseAllProperties = () => {
    setExpandedProperties(new Set());
  };

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

  /* ──────────────────────────────────────────────
     UNITS DRILL-DOWN VIEW (when a property is selected)
  ────────────────────────────────────────────── */
  if (selectedProperty) {
    const filteredUnits = propertyUnits.filter(u =>
      u.unit_number?.toLowerCase().includes(unitSearch.toLowerCase()) ||
      (u.property_unit_types as any)?.unit_type_name?.toLowerCase().includes(unitSearch.toLowerCase()) ||
      u.status?.toLowerCase().includes(unitSearch.toLowerCase())
    );

    const getUnitBadge = (status: string) => {
      switch (status) {
        case 'occupied':
          return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Occupied</Badge>;
        case 'available':
          return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><KeyRound className="w-3 h-3 mr-1" />Available</Badge>;
        case 'maintenance':
          return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Wrench className="w-3 h-3 mr-1" />Maintenance</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };

    const occupied = propertyUnits.filter(u => u.status === 'occupied').length;
    const available = propertyUnits.filter(u => u.status === 'available').length;

    return (
      <div className="space-y-6">
        {/* Breadcrumb / Back */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button
            onClick={handleBackToProperties}
            className="flex items-center gap-1 hover:text-[#00356B] transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            My Properties
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-800 font-semibold">{selectedProperty.name}</span>
        </div>

        {/* Property Header */}
        <div className="bg-gradient-to-r from-[#00356B] to-[#00356B]/80 rounded-xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{selectedProperty.name}</h1>
                <div className="flex items-center gap-2 text-blue-100 text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedProperty.address}{selectedProperty.city ? `, ${selectedProperty.city}` : ''}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={handleBackToProperties}
                className="border border-white text-white hover:bg-white/20 rounded-md"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Properties
              </Button>
              <Button asChild className="bg-[#D85C2C] text-white hover:bg-[#b84520] rounded-md shadow-sm text-xs font-black uppercase tracking-wider">
                <Link to={`/portal/manager/properties/${selectedProperty.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  Full Details
                </Link>
              </Button>
            </div>
          </div>
          {/* Mini stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg px-4 py-3 text-center">
              <p className="text-white text-xl font-bold">{propertyUnits.length}</p>
              <p className="text-blue-200 text-xs">Total Units</p>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-3 text-center">
              <p className="text-green-300 text-xl font-bold">{occupied}</p>
              <p className="text-blue-200 text-xs">Occupied</p>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-3 text-center">
              <p className="text-yellow-300 text-xl font-bold">{available}</p>
              <p className="text-blue-200 text-xs">Available</p>
            </div>
          </div>
        </div>

        {/* Units Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Units – {selectedProperty.name}</CardTitle>
                <CardDescription>{filteredUnits.length} unit{filteredUnits.length !== 1 ? 's' : ''} found</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search units..."
                  className="pl-9 w-full sm:w-56"
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {unitsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#00356B] mr-2" />
                <span className="text-gray-500">Loading units...</span>
              </div>
            ) : filteredUnits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredUnits.map((unit) => {
                  const typeName = (unit.property_unit_types as any)?.unit_type_name || 'Unit';
                  const price = unit.price || (unit.property_unit_types as any)?.price_per_unit || 0;
                  return (
                    <div
                      key={unit.id}
                      className="border rounded-xl p-4 bg-white hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                          <BedDouble className="w-5 h-5 text-[#00356B]" />
                        </div>
                        {getUnitBadge(unit.status)}
                      </div>
                      <h3 className="font-bold text-gray-900 text-base mb-0.5">
                        Unit {unit.unit_number}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">{typeName}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        {unit.floor_number != null && (
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />Floor {unit.floor_number}
                          </span>
                        )}
                      </div>
                      {price > 0 && (
                        <p className="text-sm font-semibold text-[#00356B]">
                          {formatCurrency(price)}<span className="text-xs font-normal text-gray-400">/mo</span>
                        </p>
                      )}
                      <div className="mt-3 pt-3 border-t flex gap-2">
                        <Button size="sm" variant="outline" asChild className="flex-1 text-xs h-7">
                          <Link to={`/portal/manager/properties/${selectedProperty.id}/units/${unit.id}`}>
                            <Eye className="w-3 h-3 mr-1" />View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Home className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base font-medium text-gray-900 mb-1">No units found</h3>
                <p className="text-sm text-gray-500">
                  {unitSearch ? 'Try a different search term' : 'No units have been added to this property yet'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Dialogs (still available from units view) */}
        {selectedPropertyForProprietor !== null && (
          <ProprietorAssignmentDialog
            propertyId={selectedPropertyForProprietor}
            open={selectedPropertyForProprietor !== null}
            onOpenChange={(open) => { if (!open) setSelectedPropertyForProprietor(null); }}
            onAssignmentChanged={() => { setSelectedPropertyForProprietor(null); fetchProperties(); }}
          />
        )}
        {selectedPropertyForTechnician !== null && (
          <TechnicianAssignmentDialog
            propertyId={selectedPropertyForTechnician}
            open={selectedPropertyForTechnician !== null}
            onOpenChange={(open) => { if (!open) setSelectedPropertyForTechnician(null); }}
            onAssignmentChanged={() => { setSelectedPropertyForTechnician(null); fetchProperties(); }}
          />
        )}
        {selectedPropertyForCaretaker !== null && (
          <CaretakerAssignmentDialog
            propertyId={selectedPropertyForCaretaker}
            open={selectedPropertyForCaretaker !== null}
            onOpenChange={(open) => { if (!open) setSelectedPropertyForCaretaker(null); }}
            onAssignmentChanged={() => { setSelectedPropertyForCaretaker(null); fetchProperties(); }}
          />
        )}
      </div>
    );
  }

  /* ──────────────────────────────────────────────
     PROPERTIES LIST VIEW (top-level)
  ────────────────────────────────────────────── */
  const filteredProperties = properties.filter(property =>
    property.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <p className="text-blue-100 text-sm mt-1">Select a property to view its units</p>
          </div>
        </div>
        <Button asChild className="bg-[#D85C2C] text-white px-6 py-3 text-[10px] font-black uppercase tracking-[1.5px] hover:bg-[#b84520] rounded-md shadow-sm">
          <Link to="/portal/manager/properties/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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

      {/* Search, View Toggle & Property Listing */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Properties</CardTitle>
              <CardDescription>
                {filteredProperties.length} of {properties.length} properties — click a property to see its units
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
              {/* View mode toggle */}
              <div className="flex border rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('hierarchy')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm transition-colors ${
                    viewMode === 'hierarchy'
                      ? 'bg-[#00356B] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                  title="Hierarchy view"
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm transition-colors border-l ${
                    viewMode === 'grid'
                      ? 'bg-[#00356B] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm transition-colors border-l ${
                    viewMode === 'list'
                      ? 'bg-[#00356B] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              {/* Expand/Collapse All buttons (hierarchy view only) */}
              {viewMode === 'hierarchy' && filteredProperties.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={expandAllProperties}
                    className="text-xs h-8"
                    title="Expand all properties to see units"
                  >
                    <ChevronDown className="w-3.5 h-3.5 mr-1" />
                    Expand All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={collapseAllProperties}
                    className="text-xs h-8"
                    title="Collapse all properties"
                  >
                    <ChevronUp className="w-3.5 h-3.5 mr-1" />
                    Collapse All
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProperties.length === 0 ? (
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
          ) : viewMode === 'hierarchy' ? (
            /* ── HIERARCHY VIEW (Collapsible Properties) ── */
            <div className="space-y-3">
              {filteredProperties.map((property) => {
                const isExpanded = expandedProperties.has(property.id);
                const units = propertyUnitsCache[property.id] || [];
                const occupied = units.filter(u => u.status === 'occupied').length;
                const available = units.filter(u => u.status === 'available').length;

                return (
                  <div
                    key={property.id}
                    className="border rounded-lg bg-white overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Property Header - Clickable to Expand */}
                    <button
                      onClick={() => togglePropertyExpanded(property.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                          <ChevronRight className="w-5 h-5 text-[#00356B]" />
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <Building className="w-5 h-5 text-[#00356B]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base">
                            {property.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{property.city}{property.address ? `, ${property.address}` : ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* Property Stats in Header */}
                      <div className="flex items-center gap-6 ml-4">
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#00356B]">
                            {property.occupied_units || 0}/{property.total_units || 0}
                          </div>
                          <div className="text-xs text-gray-500">units</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-700">
                            {formatCurrency(property.monthly_rent || 0)}
                          </div>
                          <div className="text-xs text-gray-500">per unit</div>
                        </div>
                        <div>{getStatusBadge(property.status)}</div>
                      </div>
                    </button>

                    {/* Expanded Units Section */}
                    {isExpanded && (
                      <div className="border-t bg-slate-50/50 p-4">
                        {units.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Home className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No units added yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Units Mini Stats */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                                <div className="text-sm font-bold text-[#00356B]">{units.length}</div>
                                <div className="text-xs text-gray-500">Total Units</div>
                              </div>
                              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                                <div className="text-sm font-bold text-green-600">{occupied}</div>
                                <div className="text-xs text-green-600">Occupied</div>
                              </div>
                              <div className="text-center p-3 bg-white rounded-lg border border-yellow-200">
                                <div className="text-sm font-bold text-yellow-600">{available}</div>
                                <div className="text-xs text-yellow-600">Available</div>
                              </div>
                            </div>

                            {/* Units Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {units.map((unit) => {
                                const typeName = (unit.property_unit_types as any)?.unit_type_name || 'Unit';
                                const price = unit.price || (unit.property_unit_types as any)?.price_per_unit || 0;
                                
                                const getUnitBadge = (status: string) => {
                                  switch (status) {
                                    case 'occupied':
                                      return <Badge className="bg-green-100 text-green-800 text-xs"><CheckCircle className="w-3 h-3 mr-0.5" />Occupied</Badge>;
                                    case 'available':
                                      return <Badge className="bg-blue-100 text-blue-800 text-xs"><KeyRound className="w-3 h-3 mr-0.5" />Available</Badge>;
                                    case 'maintenance':
                                      return <Badge className="bg-yellow-100 text-yellow-800 text-xs"><Wrench className="w-3 h-3 mr-0.5" />Maintenance</Badge>;
                                    default:
                                      return <Badge variant="outline" className="text-xs">{status}</Badge>;
                                  }
                                };

                                return (
                                  <div
                                    key={unit.id}
                                    className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="bg-blue-50 p-1.5 rounded">
                                        <BedDouble className="w-4 h-4 text-[#00356B]" />
                                      </div>
                                      {getUnitBadge(unit.status)}
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-sm mb-0.5">
                                      Unit {unit.unit_number}
                                    </h4>
                                    <p className="text-xs text-gray-500 mb-2">{typeName}</p>
                                    {unit.floor_number != null && (
                                      <p className="text-xs text-gray-500 mb-2">Floor {unit.floor_number}</p>
                                    )}
                                    {price > 0 && (
                                      <p className="text-xs font-semibold text-[#00356B] mb-2">
                                        {formatCurrency(price)}<span className="text-gray-400 font-normal">/mo</span>
                                      </p>
                                    )}
                                    <Button size="sm" variant="outline" asChild className="w-full text-xs h-7 mt-auto">
                                      <Link to={`/portal/manager/properties/${property.id}/units/${unit.id}`}>
                                        <Eye className="w-3 h-3 mr-1" /> View
                                      </Link>
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Property Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          <Button size="sm" variant="outline" asChild className="flex-1 text-xs h-8">
                            <Link to={`/portal/manager/properties/${property.id}`}>
                              <Eye className="w-3 h-3 mr-1" />Full Details
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild className="flex-1 text-xs h-8">
                            <Link to={`/portal/manager/properties/${property.id}/edit`}>
                              <Edit className="w-3 h-3 mr-1" />Edit Property
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="text-xs h-8 px-2">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link to={`/portal/manager/properties/${property.id}/tenants`}>View Tenants</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/portal/manager/properties/${property.id}/maintenance`}>View Maintenance</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/portal/manager/properties/${property.id}/payments`}>View Payments</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs">Assign Staff</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSelectedPropertyForProprietor(property.id)}>
                                <Briefcase className="w-4 h-4 mr-2" />Proprietor
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSelectedPropertyForTechnician(property.id)}>
                                <Wrench className="w-4 h-4 mr-2" />Technician
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSelectedPropertyForCaretaker(property.id)}>
                                <Hammer className="w-4 h-4 mr-2" />Caretaker
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {property.is_active ? (
                                <DropdownMenuItem onClick={() => deleteProperty(property.id)} className="text-red-600 text-xs">
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => activateProperty(property.id)} className="text-green-600 text-xs">
                                  Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'grid' ? (
            /* ── GRID VIEW ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className="group border rounded-xl overflow-hidden bg-white hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col"
                  onClick={() => handleSelectProperty(property)}
                >
                  {/* Card top color band */}
                  <div className="h-2 bg-gradient-to-r from-[#00356B] to-[#1a5fa8]" />
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="bg-blue-50 p-2.5 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Building className="w-5 h-5 text-[#00356B]" />
                      </div>
                      {getStatusBadge(property.status)}
                    </div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">
                      {property.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{property.city}{property.address ? ` · ${property.address}` : ''}</span>
                    </div>
                    <p className="text-xs text-gray-400 capitalize mb-4">{property.property_type}</p>

                    {/* Occupancy bar */}
                    {(property.total_units || 0) > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Occupancy</span>
                          <span className="font-medium text-gray-700">
                            {property.occupied_units || 0}/{property.total_units || 0} units
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-[#00356B] h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                ((property.occupied_units || 0) / (property.total_units || 1)) * 100,
                                100
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#00356B]">
                        {formatCurrency(property.monthly_rent || 0)}
                        <span className="text-xs font-normal text-gray-400">/unit</span>
                      </span>
                      <button
                        className="flex items-center gap-1 text-xs text-[#00356B] font-semibold hover:gap-2 transition-all"
                        onClick={(e) => { e.stopPropagation(); handleSelectProperty(property); }}
                      >
                        View Units <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom actions strip */}
                  <div
                    className="border-t px-4 py-2 bg-gray-50 flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                      <Link to={`/portal/manager/properties/${property.id}`}>
                        <Eye className="w-3.5 h-3.5 mr-1" />Details
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                      <Link to={`/portal/manager/properties/${property.id}/edit`}>
                        <Edit className="w-3.5 h-3.5 mr-1" />Edit
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 px-2">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link to={`/portal/manager/properties/${property.id}/tenants`}>View Tenants</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/portal/manager/properties/${property.id}/maintenance`}>View Maintenance</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/portal/manager/properties/${property.id}/payments`}>View Payments</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs">Assign Staff</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSelectedPropertyForProprietor(property.id)}>
                          <Briefcase className="w-4 h-4 mr-2" />Assign Proprietor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedPropertyForTechnician(property.id)}>
                          <Wrench className="w-4 h-4 mr-2" />Assign Technician
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedPropertyForCaretaker(property.id)}>
                          <Hammer className="w-4 h-4 mr-2" />Assign Caretaker
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {property.is_active ? (
                          <DropdownMenuItem onClick={() => deleteProperty(property.id)} className="text-red-600">
                            Deactivate Property
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => activateProperty(property.id)} className="text-green-600">
                            Activate Property
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── LIST VIEW ── */
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Property</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-center">Units</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow
                      key={property.id}
                      className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                      onClick={() => handleSelectProperty(property)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 hover:text-blue-700 transition-colors">
                              {property.name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {property.property_type} · {property.tenants?.length || 0} tenants
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{property.city}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[130px]">{property.address}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-sm">{property.occupied_units || 0}</span>
                        <span className="text-gray-400 text-xs">/{property.total_units || 0}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-sm">{formatCurrency(property.monthly_rent || 0)}</span>
                        <p className="text-xs text-gray-400">per unit</p>
                      </TableCell>
                      <TableCell>{getStatusBadge(property.status)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm" variant="outline"
                            className="h-7 text-xs text-[#00356B] border-[#00356B]"
                            onClick={(e) => { e.stopPropagation(); handleSelectProperty(property); }}
                          >
                            <Home className="w-3.5 h-3.5 mr-1" />Units
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" asChild>
                            <Link to={`/portal/manager/properties/${property.id}`}>
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 px-2">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link to={`/portal/manager/properties/${property.id}/tenants`}>View Tenants</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/portal/manager/properties/${property.id}/maintenance`}>View Maintenance</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/portal/manager/properties/${property.id}/payments`}>View Payments</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs">Assign Staff</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSelectedPropertyForProprietor(property.id)}>
                                <Briefcase className="w-4 h-4 mr-2" />Assign Proprietor
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSelectedPropertyForTechnician(property.id)}>
                                <Wrench className="w-4 h-4 mr-2" />Assign Technician
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSelectedPropertyForCaretaker(property.id)}>
                                <Hammer className="w-4 h-4 mr-2" />Assign Caretaker
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {property.is_active ? (
                                <DropdownMenuItem onClick={() => deleteProperty(property.id)} className="text-red-600">
                                  Deactivate Property
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => activateProperty(property.id)} className="text-green-600">
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
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialogs */}
      {selectedPropertyForProprietor !== null && (
        <ProprietorAssignmentDialog
          propertyId={selectedPropertyForProprietor}
          open={selectedPropertyForProprietor !== null}
          onOpenChange={(open) => { if (!open) setSelectedPropertyForProprietor(null); }}
          onAssignmentChanged={() => { setSelectedPropertyForProprietor(null); fetchProperties(); }}
        />
      )}
      {selectedPropertyForTechnician !== null && (
        <TechnicianAssignmentDialog
          propertyId={selectedPropertyForTechnician}
          open={selectedPropertyForTechnician !== null}
          onOpenChange={(open) => { if (!open) setSelectedPropertyForTechnician(null); }}
          onAssignmentChanged={() => { setSelectedPropertyForTechnician(null); fetchProperties(); }}
        />
      )}
      {selectedPropertyForCaretaker !== null && (
        <CaretakerAssignmentDialog
          propertyId={selectedPropertyForCaretaker}
          open={selectedPropertyForCaretaker !== null}
          onOpenChange={(open) => { if (!open) setSelectedPropertyForCaretaker(null); }}
          onAssignmentChanged={() => { setSelectedPropertyForCaretaker(null); fetchProperties(); }}
        />
      )}
    </div>
  );
};

export default ManagerProperties;
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
    </div>
  );
};

export default ManagerProperties;