import React, { useState, useEffect } from 'react';
import { Plus, Building, Home, Search, Filter, Edit, Trash2, Eye, Loader2, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Import UI components (update imports based on your actual paths)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  type: string;
  status: 'available' | 'occupied' | 'under_maintenance' | 'closed';
  total_units: number;
  occupied_units: number;
  monthly_rent: number;
  created_at: string;
  updated_at: string;
  description?: string;
  manager_id?: string;
}

interface NewPropertyForm {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  type: 'apartment' | 'house' | 'commercial' | 'land' | 'other';
  total_units: number;
  monthly_rent: number;
  description: string;
  country?: string;
}

const PropertiesManagement: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingProperty, setAddingProperty] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyStats, setPropertyStats] = useState({
    total: 0,
    occupied: 0,
    vacant: 0,
    maintenance: 0
  });

  const [newProperty, setNewProperty] = useState<NewPropertyForm>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    type: 'apartment',
    total_units: 1,
    monthly_rent: 0,
    description: '',
    country: 'USA'
  });

  // Load properties on component mount
  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProperties(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      console.error('Error loading properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (propertiesList: Property[]) => {
    const total = propertiesList.length;
    const occupied = propertiesList.filter(p => p.status === 'occupied').length;
    const vacant = propertiesList.filter(p => p.status === 'available').length;
    const maintenance = propertiesList.filter(p => p.status === 'under_maintenance').length;
    
    setPropertyStats({
      total,
      occupied,
      vacant,
      maintenance
    });
  };

  const handleAddProperty = async () => {
    // Validate required fields
    if (!newProperty.name || !newProperty.address || !newProperty.city || !newProperty.state || !newProperty.zip_code) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAddingProperty(true);
    try {
      // Get current user for created_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const propertyData = {
        ...newProperty,
        status: 'available' as const,
        occupied_units: 0,
        created_by: profile?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      if (data) {
        toast.success('Property added successfully!');
        setShowAddForm(false);
        resetForm();
        await loadProperties(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Error adding property:', error);
      toast.error(`Failed to add property: ${error.message}`);
    } finally {
      setAddingProperty(false);
    }
  };

  const resetForm = () => {
    setNewProperty({
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      type: 'apartment',
      total_units: 1,
      monthly_rent: 0,
      description: '',
      country: 'USA'
    });
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      // Check if property has active tenants
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('property_id', id)
        .eq('status', 'active')
        .limit(1);

      if (tenants && tenants.length > 0) {
        toast.error('Cannot delete property with active tenants');
        return;
      }

      const { error } = await supabase.from('properties').delete().eq('id', id);

      if (error) throw error;

      toast.success('Property deleted successfully');
      await loadProperties(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast.error(`Failed to delete property: ${error.message}`);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Property['status']) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Property status updated');
      await loadProperties(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating property status:', error);
      toast.error('Failed to update property status');
    }
  };

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Property['status']) => {
    switch (status) {
      case 'occupied':
        return <Badge className="bg-green-100 text-green-800">Occupied</Badge>;
      case 'available':
        return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
      case 'under_maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      case 'closed':
        return <Badge className="bg-red-100 text-red-800">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'house':
        return <Home className="w-5 h-5 text-blue-500" />;
      case 'apartment':
        return <Building className="w-5 h-5 text-purple-500" />;
      case 'commercial':
        return <Building className="w-5 h-5 text-orange-500" />;
      default:
        return <Home className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight">Properties <span className="font-bold">Management</span></h1>
          <p className="text-gray-600 text-[13px] font-medium mt-2">Manage all properties in your portfolio</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-[#D85C2C] text-white px-6 py-3 text-[10px] font-black uppercase tracking-[1.5px] hover:bg-[#b84520] transition-colors rounded-md shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </Button>
      </div>

      {/* Add Property Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light text-[#00356B] tracking-tight">Add <span className="font-bold">Property</span></h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Property Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Property Name *</label>
                      <Input
                        value={newProperty.name}
                        onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                        placeholder="Sunset Villa"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Property Type *</label>
                      <select
                        value={newProperty.type}
                        onChange={(e) => setNewProperty({...newProperty, type: e.target.value as any})}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="apartment">Apartment Building</option>
                        <option value="house">Single Family House</option>
                        <option value="commercial">Commercial Property</option>
                        <option value="land">Land</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Address</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Street Address *</label>
                    <Input
                      value={newProperty.address}
                      onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">City *</label>
                      <Input
                        value={newProperty.city}
                        onChange={(e) => setNewProperty({...newProperty, city: e.target.value})}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">State *</label>
                      <Input
                        value={newProperty.state}
                        onChange={(e) => setNewProperty({...newProperty, state: e.target.value})}
                        placeholder="State"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">ZIP Code *</label>
                      <Input
                        value={newProperty.zip_code}
                        onChange={(e) => setNewProperty({...newProperty, zip_code: e.target.value})}
                        placeholder="12345"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Country</label>
                      <Input
                        value={newProperty.country}
                        onChange={(e) => setNewProperty({...newProperty, country: e.target.value})}
                        placeholder="USA"
                      />
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Property Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Total Units</label>
                      <Input
                        type="number"
                        min="1"
                        value={newProperty.total_units}
                        onChange={(e) => setNewProperty({...newProperty, total_units: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Monthly Rent ($)</label>
                      <Input
                        type="number"
                        min="0"
                        value={newProperty.monthly_rent}
                        onChange={(e) => setNewProperty({...newProperty, monthly_rent: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={newProperty.description}
                      onChange={(e) => setNewProperty({...newProperty, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                      placeholder="Describe the property features, amenities, etc."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    disabled={addingProperty}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddProperty}
                    disabled={addingProperty || !newProperty.name || !newProperty.address}
                  >
                    {addingProperty ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Property...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Add Property
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search properties by name, address, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Property Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Property Statistics</CardTitle>
          <CardDescription>Overview of your property portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold">{propertyStats.total}</p>
                </div>
                <Building className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupied</p>
                  <p className="text-2xl font-bold">{propertyStats.occupied}</p>
                </div>
                <Home className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold">{propertyStats.vacant}</p>
                </div>
                <Home className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold">{propertyStats.maintenance}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(property.type)}
                        <CardTitle className="text-lg">{property.name}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        {property.address}, {property.city}, {property.state} {property.zip_code}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {/* Add view functionality */}}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {/* Add edit functionality */}}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteProperty(property.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Monthly Rent</span>
                      <span className="font-semibold">{formatCurrency(property.monthly_rent)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Units</span>
                      <span className="font-medium">
                        {property.occupied_units}/{property.total_units} occupied
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      {getStatusBadge(property.status)}
                    </div>
                    <div className="pt-3 border-t">
                      <select
                        value={property.status}
                        onChange={(e) => handleUpdateStatus(property.id, e.target.value as Property['status'])}
                        className="w-full px-3 py-2 text-sm border rounded-md"
                      >
                        <option value="available">Mark as Available</option>
                        <option value="occupied">Mark as Occupied</option>
                        <option value="under_maintenance">Mark as Maintenance</option>
                        <option value="closed">Mark as Closed</option>
                      </select>
                    </div>
                    {property.description && (
                      <div className="pt-2">
                        <p className="text-sm text-gray-600 line-clamp-2">{property.description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProperties.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No properties found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first property'}
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Property
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default PropertiesManagement;