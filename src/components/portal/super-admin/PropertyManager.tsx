// src/components/portal/super-admin/PropertyManager.tsx
import React, { useState, useEffect } from "react";
import {
  Building,
  UserPlus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  Home,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  Plus,
  X,
  Loader2,
  DollarSign,
  Shield,
  Calendar,
  Eye,
  Settings,
  Database,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePropertyManagement } from "@/hooks/usePropertyManagement";
import { useUserManagement } from "@/hooks/useUserManagement";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateHelpers";
import { supabase } from "@/integrations/supabase/client";

interface PropertyManagerProps {
  onPropertySelect?: (propertyId: string) => void;
  onManagerAssign?: (propertyId: string, managerId: string) => void;
}

interface Property {
  id: string;
  name: string;
  property_name?: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  zip_code?: string;
  country: string;
  postal_code?: string;
  property_type: string;
  type: string;
  status: string;
  is_active: boolean;
  total_units: number;
  occupied_units: number;
  available_units: number;
  monthly_rent?: number;
  security_deposit?: number;
  property_manager_id?: string;
  manager_id?: string;
  owner_id?: string;
  super_admin_id?: string;
  amenities?: string[];
  images?: string[];
  coordinates?: any;
  latitude?: number;
  longitude?: number;
  year_built?: number;
  square_feet?: number;
  created_at: string;
  updated_at: string;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

interface Manager {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
}

const PropertyManager: React.FC<PropertyManagerProps> = ({
  onPropertySelect,
  onManagerAssign,
}) => {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [assigningManager, setAssigningManager] = useState<string | null>(null);
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [showAddPropertyForm, setShowAddPropertyForm] = useState(false);
  const [addingProperty, setAddingProperty] = useState(false);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [exportingData, setExportingData] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [newProperty, setNewProperty] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "Kenya",
    property_type: "apartment",
    total_units: 1,
    monthly_rent: 0,
    security_deposit: 0,
    description: "",
    amenities: [] as string[],
    status: "active",
  });

  const {
    properties,
    managers,
    loading,
    fetchProperties,
    fetchManagers,
    assignManager,
    deleteProperty,
    searchProperties,
    createProperty,
    updateProperty,
  } = usePropertyManagement();

  const { fetchUsers } = useUserManagement();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchProperties(), fetchManagers(), fetchUsers()]);
        setDbError(null);
      } catch (error: any) {
        console.error("Error loading data:", error);
        setDbError(error.message || "Failed to load property data");
      }
    };
    loadData();
  }, []);

  // Add Ayden Homes property if it doesn't exist
  useEffect(() => {
    const addAydenHomesIfNeeded = async () => {
      if (properties.length > 0) {
        const aydenHomesExists = properties.some(p => p.name?.toLowerCase() === "ayden homes");
        if (!aydenHomesExists) {
          try {
            await createProperty({
              name: "Ayden Homes",
              property_name: "Ayden Homes",
              address: "123 Ayden Road",
              city: "Nairobi",
              state: "Nairobi County",
              zip_code: "00100",
              country: "Kenya",
              property_type: "apartment",
              type: "apartment",
              total_units: 24,
              monthly_rent: 45000,
              security_deposit: 90000,
              description: "Modern apartment complex with premium amenities and strategic location",
              amenities: ["Swimming Pool", "Gym", "Parking", "Security", "Wi-Fi", "24/7 Power"],
              status: "active",
              is_active: true,
            });
            toast.success("Ayden Homes property added successfully");
            await fetchProperties();
          } catch (error: any) {
            if (!error.message?.includes("already exists")) {
              console.error("Error adding Ayden Homes:", error);
            }
          }
        }
      }
    };
    addAydenHomesIfNeeded();
  }, [properties.length]);

  // Handle property search
  const handleSearch = async () => {
    try {
      if (searchQuery.trim()) {
        await searchProperties(searchQuery);
      } else {
        await fetchProperties();
      }
      setDbError(null);
    } catch (error: any) {
      setDbError(error.message || "Search failed");
    }
  };

  // Handle manager assignment
  const handleAssignManager = async (propertyId: string) => {
    if (!selectedManager) {
      toast.error("Please select a manager");
      return;
    }

    try {
      await assignManager(propertyId, selectedManager);
      toast.success("Manager assigned successfully");
      setAssigningManager(null);
      setSelectedManager("");

      if (onManagerAssign) {
        onManagerAssign(propertyId, selectedManager);
      }
    } catch (error: any) {
      toast.error(`Failed to assign manager: ${error.message}`);
    }
  };

  // Handle property deletion
  const handleDeleteProperty = async (propertyId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this property? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteProperty(propertyId);
      toast.success("Property deleted successfully");
    } catch (error: any) {
      toast.error(`Failed to delete property: ${error.message}`);
    }
  };

  // Reset form
  const resetPropertyForm = () => {
    setNewProperty({
      name: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "Kenya",
      property_type: "apartment",
      total_units: 1,
      monthly_rent: 0,
      security_deposit: 0,
      description: "",
      amenities: [],
      status: "active",
    });
    setEditingProperty(null);
  };

  // Handle adding/editing property
  const handleSaveProperty = async () => {
    // Validate required fields
    if (!newProperty.name || !newProperty.address || !newProperty.city) {
      toast.error("Please fill in required fields: Name, Address, and City");
      return;
    }

    const isEditing = !!editingProperty;
    setAddingProperty(true);

    try {
      const propertyData = {
        name: newProperty.name,
        property_name: newProperty.name,
        address: newProperty.address,
        city: newProperty.city,
        state: newProperty.state,
        zip_code: newProperty.zip_code,
        country: newProperty.country,
        property_type: newProperty.property_type,
        type: newProperty.property_type,
        total_units: newProperty.total_units,
        monthly_rent: newProperty.monthly_rent,
        security_deposit: newProperty.security_deposit,
        description: newProperty.description,
        amenities: newProperty.amenities,
        status: newProperty.status,
        is_active: newProperty.status === "active",
        occupied_units: 0,
        available_units: newProperty.total_units,
      };

      if (isEditing) {
        await updateProperty(editingProperty, propertyData);
        toast.success('Property updated successfully');
      } else {
        await createProperty(propertyData);
        toast.success('Property added successfully');
      }

      setShowAddPropertyForm(false);
      resetPropertyForm();
      await fetchProperties();
      setDbError(null);
    } catch (error: any) {
      console.error('Error saving property:', error);
      setDbError(error.message);
      toast.error(`Failed to save property: ${error.message}`);
    } finally {
      setAddingProperty(false);
    }
  };

  // Start editing a property
  const startEditingProperty = (property: Property) => {
    setEditingProperty(property.id);
    setNewProperty({
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state || "",
      zip_code: property.zip_code || "",
      country: property.country || "Kenya",
      property_type: property.property_type || "apartment",
      total_units: property.total_units || 1,
      monthly_rent: property.monthly_rent || 0,
      security_deposit: property.security_deposit || 0,
      description: property.description || "",
      amenities: property.amenities || [],
      status: property.status || "active",
    });
    setShowAddPropertyForm(true);
  };

  // Filter properties based on selected filters
  const filteredProperties = properties.filter((property: Property) => {
    if (statusFilter !== "all" && property.status !== statusFilter) return false;
    if (typeFilter !== "all" && property.property_type !== typeFilter) return false;
    if (managerFilter !== "all") {
      if (managerFilter === "assigned" && !property.manager_id) return false;
      if (managerFilter === "unassigned" && property.manager_id) return false;
      if (
        managerFilter !== "assigned" &&
        managerFilter !== "unassigned" &&
        property.manager_id !== managerFilter
      )
        return false;
    }
    return true;
  });

  // Handle export data
  const handleExportData = async () => {
    try {
      setExportingData(true);
      let data: any[] = [];
      
      if (filteredProperties.length > 0) {
        data = filteredProperties;
      } else {
        const { data: propertiesData, error }: any = await supabase
          .from("properties")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        data = propertiesData || [];
      }

      // Convert to CSV
      const headers = ['Name', 'Address', 'City', 'Type', 'Status', 'Total Units', 'Occupied Units', 'Monthly Rent', 'Created At'];
      const csvRows = [
        headers.join(','),
        ...data.map((property: any) => {
          const values = [
            `"${property.name || ''}"`,
            `"${property.address || ''}"`,
            `"${property.city || ''}"`,
            `"${property.property_type || ''}"`,
            `"${property.status || ''}"`,
            property.total_units || 0,
            property.occupied_units || 0,
            property.monthly_rent || 0,
            `"${new Date(property.created_at).toLocaleDateString()}"`
          ];
          return values.join(',');
        })
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `properties_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${data.length} properties exported successfully`);
    } catch (error: any) {
      console.error("Error exporting properties:", error);
      toast.error(`Failed to export properties: ${error.message}`);
    } finally {
      setExportingData(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "maintenance":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "vacant":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "occupied":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Get type badge color
  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "apartment":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "house":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "commercial":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "condo":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "townhouse":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Get property stats
  const stats = {
    total: properties.length,
    active: properties.filter((p: Property) => p.status === "active" && p.is_active).length,
    assignedManagers: new Set(properties.map((p: Property) => p.manager_id).filter(Boolean)).size,
    totalUnits: properties.reduce((sum: number, p: Property) => sum + (p.total_units || 0), 0),
    occupiedUnits: properties.reduce((sum: number, p: Property) => sum + (p.occupied_units || 0), 0),
    availableUnits: properties.reduce((sum: number, p: Property) => sum + (p.available_units || 0), 0),
    cities: new Set(properties.map((p: Property) => p.city).filter(Boolean)).size,
    totalRevenue: properties.reduce((sum: number, p: Property) => sum + ((p.monthly_rent || 0) * (p.occupied_units || 0)), 0),
  };

  const occupancyRate = stats.totalUnits > 0 ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 0;

  return (
    <div className="space-y-6 font-nunito">
      {/* Database Error Alert */}
      {dbError && (
        <Alert variant="destructive">
          <Database className="h-4 w-4" />
          <AlertDescription>
            Database error: {dbError}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Property Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all properties and assign managers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              fetchProperties();
              toast.info("Refreshing properties...");
            }}
          >
            <Loader2 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportData}
            disabled={exportingData}
          >
            {exportingData ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
          <Dialog
            open={showAddPropertyForm}
            onOpenChange={(open: boolean) => {
              if (!open) {
                setShowAddPropertyForm(false);
                resetPropertyForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => {
                resetPropertyForm();
                setShowAddPropertyForm(true);
              }}>
                <Building className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProperty ? 'Edit Property' : 'Add New Property'}
                </DialogTitle>
                <DialogDescription>
                  {editingProperty 
                    ? 'Update property information below.' 
                    : 'Fill in the property details below.'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Basic Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Property Name *</Label>
                      <Input
                        id="name"
                        value={newProperty.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProperty({...newProperty, name: e.target.value})}
                        placeholder="Sunrise Apartments"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="property_type">Property Type</Label>
                      <Select
                        value={newProperty.property_type}
                        onValueChange={(value: string) => 
                          setNewProperty({...newProperty, property_type: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="condo">Condo</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={newProperty.address}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProperty({...newProperty, address: e.target.value})}
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={newProperty.city}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProperty({...newProperty, city: e.target.value})}
                        placeholder="Kisumu"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Region</Label>
                      <Input
                        id="state"
                        value={newProperty.state}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProperty({...newProperty, state: e.target.value})}
                        placeholder="Kisumu County"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip_code">Postal Code</Label>
                      <Input
                        id="zip_code"
                        value={newProperty.zip_code}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProperty({...newProperty, zip_code: e.target.value})}
                        placeholder="40100"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={newProperty.country}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProperty({...newProperty, country: e.target.value})}
                      placeholder="Kenya"
                    />
                  </div>
                </div>

                {/* Property Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Property Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total_units">Total Units</Label>
                      <Input
                        id="total_units"
                        type="number"
                        min="1"
                        value={newProperty.total_units}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProperty({...newProperty, total_units: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthly_rent">Monthly Rent (KES)</Label>
                      <Input
                        id="monthly_rent"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProperty.monthly_rent}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProperty({...newProperty, monthly_rent: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="security_deposit">Security Deposit (KES)</Label>
                      <Input
                        id="security_deposit"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProperty.security_deposit}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProperty({...newProperty, security_deposit: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newProperty.status}
                      onValueChange={(value: string) => 
                        setNewProperty({...newProperty, status: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Description & Amenities</h3>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProperty.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewProperty({...newProperty, description: e.target.value})}
                      placeholder="Describe the property, including notable features, amenities, etc."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Amenities (comma separated)</Label>
                    <Input
                      value={newProperty.amenities.join(', ')}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProperty({
                        ...newProperty, 
                        amenities: e.target.value.split(',').map((item: string) => item.trim()).filter((item: string) => item)
                      })}
                      placeholder="e.g., Swimming Pool, Gym, Parking, Security"
                    />
                    <p className="text-xs text-gray-500">
                      Separate amenities with commas
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddPropertyForm(false);
                    resetPropertyForm();
                  }}
                  disabled={addingProperty}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProperty}
                  disabled={addingProperty || !newProperty.name || !newProperty.address || !newProperty.city}
                >
                  {addingProperty ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingProperty ? 'Updating...' : 'Adding...'}
                    </>
                  ) : editingProperty ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Update Property
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Property
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Properties
            </CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-500">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Units & Occupancy
            </CardTitle>
            <Home className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {occupancyRate}%
            </div>
            <p className="text-xs text-gray-500">
              {stats.occupiedUnits}/{stats.totalUnits} units occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-gray-500">
              Projected monthly income
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assigned Managers
            </CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.assignedManagers}
            </div>
            <p className="text-xs text-gray-500">
              {managers?.length || 0} managers available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search properties by name, address, city, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-white border-gray-200 text-gray-900 dark:text-gray-100 dark:bg-gray-950 dark:border-gray-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] bg-white border-gray-200 text-gray-900 dark:text-gray-100 dark:bg-gray-950 dark:border-gray-700">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                </SelectContent>
              </Select>

              <Select value={managerFilter} onValueChange={setManagerFilter}>
                <SelectTrigger className="w-[160px] bg-white border-gray-200 text-gray-900 dark:text-gray-100 dark:bg-gray-950 dark:border-gray-700">
                  <SelectValue placeholder="Manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {managers?.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.first_name} {manager.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleSearch}>
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button variant="ghost" onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setTypeFilter("all");
                setManagerFilter("all");
                fetchProperties();
              }} className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
          <CardDescription>
            {filteredProperties.length} properties found • Showing {Math.min(filteredProperties.length, 20)} of {filteredProperties.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No properties found</h3>
              <p className="text-gray-500">
                Try adjusting your filters or search query
              </p>
              <Button 
                className="mt-4" 
                onClick={() => {
                  resetPropertyForm();
                  setShowAddPropertyForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Property
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.slice(0, 20).map((property) => (
                    <TableRow
                      key={property.id}
                      className={
                        selectedProperty === property.id ? "bg-gray-50 dark:bg-gray-800" : ""
                      }
                      onClick={() => {
                        setSelectedProperty(property.id);
                        if (onPropertySelect) {
                          onPropertySelect(property.id);
                        }
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium">{property.name}</div>
                            {property.description && (
                              <div className="text-sm text-gray-500 truncate max-w-[200px]">
                                {property.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{property.city}</div>
                          {property.state && (
                            <div className="text-xs text-gray-500">{property.state}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getTypeColor(property.property_type || 'other')}
                        >
                          {property.property_type?.replace("_", " ") || 'other'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(property.status || 'active')}
                        >
                          {property.status?.replace("_", " ") || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-center">
                            <div className="font-medium">{property.occupied_units || 0}</div>
                            <div className="text-xs text-gray-500">occupied</div>
                          </div>
                          <div className="text-gray-400">/</div>
                          <div className="text-center">
                            <div className="font-medium">{property.total_units || 0}</div>
                            <div className="text-xs text-gray-500">total</div>
                          </div>
                          <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${property.total_units ? ((property.occupied_units || 0) / property.total_units) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {property.monthly_rent ? formatCurrency(property.monthly_rent) : 'N/A'}
                        </div>
                        {property.security_deposit && (
                          <div className="text-xs text-gray-500">
                            Deposit: {formatCurrency(property.security_deposit)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {assigningManager === property.id ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={selectedManager}
                              onValueChange={setSelectedManager}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select manager" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Unassign</SelectItem>
                                {managers.map((manager) => (
                                  <SelectItem
                                    key={manager.id}
                                    value={manager.id}
                                  >
                                    {manager.first_name} {manager.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => handleAssignManager(property.id)}
                              disabled={!selectedManager}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAssigningManager(null);
                                setSelectedManager("");
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : property.manager ? (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {property.manager.first_name?.[0]}
                                {property.manager.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">
                                {property.manager.first_name}{" "}
                                {property.manager.last_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {property.manager.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 italic text-sm">Unassigned</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditingProperty(property)}
                            className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setAssigningManager(property.id);
                              setSelectedManager(property.manager_id || "");
                            }}
                            className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => startEditingProperty(property)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Property
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setAssigningManager(property.id);
                                  setSelectedManager(property.manager_id || "");
                                }}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign Manager
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(`${property.name}, ${property.address}, ${property.city}`);
                                  toast.success("Property address copied");
                                }}
                              >
                                <MapPin className="h-4 w-4 mr-2" />
                                Copy Address
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteProperty(property.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Property
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
          )}
        </CardContent>
      </Card>

      {/* Available Managers Section */}
      {managers && managers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Managers</CardTitle>
            <CardDescription>
              {managers.length} property managers available for assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {managers.slice(0, 6).map((manager) => {
                const assignedProperties = properties.filter(p => p.manager_id === manager.id).length;
                
                return (
                  <div
                    key={manager.id}
                    className="border dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {manager.first_name?.[0]}
                            {manager.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {manager.first_name} {manager.last_name}
                          </h4>
                          <p className="text-sm text-gray-500">{manager.email}</p>
                          {manager.phone && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {manager.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={manager.status === 'active' ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-50 text-gray-700"}
                      >
                        {manager.status || 'active'}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Assigned:</span>
                        <span className="ml-2 font-medium">
                          {assignedProperties} properties
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Role:</span>
                        <span className="ml-2 font-medium capitalize">
                          {manager.role?.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700" 
                        onClick={() => {
                          // Find an unassigned property
                          const unassignedProperty = properties.find(p => !p.manager_id);
                          if (unassignedProperty) {
                            setAssigningManager(unassignedProperty.id);
                            setSelectedManager(manager.id);
                            toast.info(`Assigning ${manager.first_name} to ${unassignedProperty.name}`);
                          } else {
                            toast.info("All properties are already assigned. Add a new property first.");
                          }
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {managers.length > 6 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  View All {managers.length} Managers
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyManager;