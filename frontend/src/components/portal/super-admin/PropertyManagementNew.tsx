// src/components/portal/super-admin/PropertyManagementNew.tsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Building,
  Home,
  Loader2,
  AlertCircle,
  Eye,
  DollarSign,
  BarChart3,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/ui/HeroBackground";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  status: string;
  total_units: number;
  occupied_units: number;
  created_at: string;
}

interface PropertyStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  totalMonthlyIncome: number;
  projectedMonthlyIncome: number;
}

const PropertyManagementNew: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats>({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    totalMonthlyIncome: 0,
    projectedMonthlyIncome: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    loadProperties();
    loadStats();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select(
          `id, name, address, city, status, total_units, occupied_units, created_at`
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error loading properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: properties, error } = await supabase
        .from("properties")
        .select("total_units, occupied_units");

      if (error) throw error;

      const totalUnits = (properties || []).reduce(
        (sum: number, p: any) => sum + (p.total_units || 0),
        0
      );
      const occupiedUnits = (properties || []).reduce(
        (sum: number, p: any) => sum + (p.occupied_units || 0),
        0
      );

      // Fetch income projections
      const { data: projections } = await supabase
        .from("property_income_projections")
        .select(
          "total_monthly_income, projected_monthly_income"
        );

      const totalMonthlyIncome = (projections || []).reduce(
        (sum: number, p: any) => sum + (p.total_monthly_income || 0),
        0
      );
      const projectedMonthlyIncome = (projections || []).reduce(
        (sum: number, p: any) => sum + (p.projected_monthly_income || 0),
        0
      );

      setStats({
        totalProperties: properties?.length || 0,
        totalUnits,
        occupiedUnits,
        vacantUnits: totalUnits - occupiedUnits,
        totalMonthlyIncome,
        projectedMonthlyIncome,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteProperty = async (propertyId: string) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        const { error } = await supabase
          .from("properties")
          .delete()
          .eq("id", propertyId);

        if (error) throw error;
        toast.success("Property deleted successfully");
        loadProperties();
        loadStats();
      } catch (error) {
        console.error("Error deleting property:", error);
        toast.error("Failed to delete property");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#154279]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-nunito bg-slate-50 min-h-screen p-6 rounded-lg" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#154279] to-[#0f325e] p-8 rounded-xl shadow-lg text-white relative overflow-hidden">
        <HeroBackground />
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tight">
            Property Management
          </h2>
          <p className="text-slate-100 text-sm mt-2 font-medium">
            Manage residential properties, units, and income projections
          </p>
        </div>
        <div className="relative z-10">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white text-[#154279] hover:bg-slate-100 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto bg-white border-2 border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-[#154279] font-black text-xl">Add New Property</DialogTitle>
              <DialogDescription className="text-slate-600 font-medium">
                Create a new residential or commercial property with unit specifications
              </DialogDescription>
            </DialogHeader>
            <PropertyForm
              onSuccess={() => {
                setIsDialogOpen(false);
                loadProperties();
                loadStats();
              }}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-slate-200 bg-white hover:border-[#154279] transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">
              Total Properties
            </CardTitle>
            <Building className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#154279]">{stats.totalProperties}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {stats.totalUnits} total units
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 bg-white hover:border-[#154279] transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">Occupancy</CardTitle>
            <Home className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#154279]">
              {stats.totalUnits > 0
                ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {stats.occupiedUnits}/{stats.totalUnits} occupied
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 bg-white hover:border-[#154279] transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">Monthly Income</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#154279]">
              KSH {(stats.totalMonthlyIncome / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">All units at capacity</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 bg-white hover:border-[#154279] transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">
              Projected Income
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#154279]">
              KSH {(stats.projectedMonthlyIncome / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Current occupancy rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Properties List */}
      <Card className="border-2 border-slate-200 bg-white shadow-lg">
        <CardHeader className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-[#154279] font-black text-xl">Properties</CardTitle>
              <CardDescription className="text-slate-600 font-medium mt-1">
                Manage all residential and commercial properties
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search properties..."
                  className="pl-10 border-2 border-slate-200 rounded-xl focus:border-[#154279] focus:ring-0 bg-white"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] border-2 border-slate-200 rounded-xl bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredProperties.length === 0 ? (
            <Alert className="bg-amber-50 border-2 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 font-medium">
                No properties found. Create your first property to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-xl border-2 border-slate-200 overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-slate-50 border-b-2 border-slate-200">
                  <TableRow className="hover:bg-slate-50">
                    <TableHead className="text-[#154279] font-black">Property Name</TableHead>
                    <TableHead className="text-[#154279] font-black">Location</TableHead>
                    <TableHead className="text-[#154279] font-black">Units</TableHead>
                    <TableHead className="text-[#154279] font-black">Occupancy</TableHead>
                    <TableHead className="text-[#154279] font-black">Status</TableHead>
                    <TableHead className="text-[#154279] font-black">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">
                        {property.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {property.city}
                        </div>
                      </TableCell>
                      <TableCell>
                        {property.occupied_units}/{property.total_units}
                      </TableCell>
                      <TableCell>
                        {property.total_units > 0
                          ? Math.round(
                              (property.occupied_units / property.total_units) *
                                100
                            )
                          : 0}
                        %
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            property.status === "active" ? "default" : "outline"
                          }
                        >
                          {property.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProperty(property);
                              // Navigate to property detail view
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteProperty(property.id)
                            }
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
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
    </div>
  );
};

// PropertyForm Component
interface PropertyFormProps {
  onSuccess: () => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    description: "",
    type: "apartment",
    units: [] as any[],
  });

  const [unitTypes, setUnitTypes] = useState([
    { name: "Bedsitter", count: 0, basePrice: 0, sizes: [] },
    { name: "1-Bedroom", count: 0, basePrice: 0, sizes: [] },
    { name: "2-Bedroom", count: 0, basePrice: 0, sizes: [] },
    { name: "Studio", count: 0, basePrice: 0, sizes: [] },
    { name: "Shop", count: 0, basePrice: 0, sizes: [] },
  ]);

  const handleAddProperty = async () => {
    if (!formData.name || !formData.address || !formData.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Not authenticated");
        return;
      }

      // Create property
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .insert({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          description: formData.description,
          type: formData.type,
          status: "active",
          super_admin_id: userData.user.id,
          total_units: unitTypes.reduce((sum, u) => sum + u.count, 0),
        })
        .select()
        .single();

      if (propertyError) throw propertyError;

      // Add unit specifications
      for (const unitType of unitTypes) {
        if (unitType.count > 0) {
          const { error: specError } = await supabase
            .from("unit_specifications")
            .insert({
              property_id: property.id,
              unit_type_name: unitType.name,
              unit_category: formData.type === "apartment" ? "residential" : "commercial",
              total_units_of_type: unitType.count,
              base_price: unitType.basePrice,
              size_variants: unitType.sizes,
            });

          if (specError) throw specError;
        }
      }

      toast.success("Property created successfully");
      onSuccess();
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error("Failed to create property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="font-semibold">Property Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Property Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Westlands Luxury Apartments"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              placeholder="e.g., Nairobi"
              value={formData.city}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, city: e.target.value })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Full Address *</Label>
            <Input
              id="address"
              placeholder="e.g., Mpaka Road, Westlands"
              value={formData.address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Property description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="type">Property Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: string) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartment Complex</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="mixed">Mixed Use</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Unit Types Configuration */}
      <div className="space-y-4">
        <h3 className="font-semibold">Unit Types & Pricing</h3>
        <div className="space-y-4">
          {unitTypes.map((unitType, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">{unitType.name}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Total Units</Label>
                  <Input
                    type="number"
                    min="0"
                    value={unitType.count}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newUnitTypes = [...unitTypes];
                      newUnitTypes[index].count = parseInt(e.target.value) || 0;
                      setUnitTypes(newUnitTypes);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Base Price (Monthly)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={unitType.basePrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newUnitTypes = [...unitTypes];
                      newUnitTypes[index].basePrice =
                        parseInt(e.target.value) || 0;
                      setUnitTypes(newUnitTypes);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Size Range (sqft)</Label>
                  <Input
                    type="text"
                    placeholder="e.g., 300-400"
                    disabled
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Income Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Expected Monthly Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            KSH{" "}
            {unitTypes
              .reduce((sum, u) => sum + u.count * u.basePrice, 0)
              .toLocaleString()}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Based on {unitTypes.reduce((sum, u) => sum + u.count, 0)} total
            units at full occupancy
          </p>
        </CardContent>
      </Card>

      <DialogFooter>
        <Button
          variant="outline"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button onClick={handleAddProperty} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Property
        </Button>
      </DialogFooter>
    </div>
  );
};

export default PropertyManagementNew;
