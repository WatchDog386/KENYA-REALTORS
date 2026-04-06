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

import { Textarea } from "@/components/ui/textarea";

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

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "maintenance": return "bg-amber-50 text-amber-700 border-amber-200";
      case "inactive": return "bg-slate-100 text-slate-600 border-slate-300";
      default: return "bg-white text-slate-800 border-slate-300";
    }
  };

  if (loading && properties.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F8F9FA]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">
      {/* Sharp Enterprise Header */}
      <div className="bg-white border-b border-slate-300 px-6 py-10 mb-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Realters Kenya Portfolio</h4>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Property Management
            </h2>
            <p className="text-slate-500 text-sm max-w-2xl pt-1">
              Command center for residential and commercial assets. Manage structures, unit allocations, and income data.
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-black text-white rounded-none border border-black shadow-none h-11 px-6 font-semibold transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                NEW PROPERTY
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-none border border-slate-300 shadow-2xl p-0">
              <div className="p-6 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
                <DialogTitle className="text-xl font-bold text-slate-900 uppercase tracking-wide">Instantiate Asset</DialogTitle>
                <DialogDescription className="text-slate-500 mt-1">
                  Define structural parameters and unit specifications for the new property.
                </DialogDescription>
              </div>
              <div className="p-6 bg-white">
                <PropertyForm
                  onSuccess={() => {
                    setIsDialogOpen(false);
                    loadProperties();
                    loadStats();
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 space-y-8">
        {/* Strict Grid Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-slate-300 bg-white">
          <div className="p-5 border-b lg:border-b-0 border-r border-slate-200 hover:bg-slate-50 transition-colors flex flex-col justify-between">
            <div className="flex items-start justify-between mb-6">
              <Building className="h-5 w-5 text-slate-400" />
              <div className="text-right">
                <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{stats.totalProperties}</span>
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Properties</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">{stats.totalUnits} aggregate units</p>
            </div>
          </div>

          <div className="p-5 border-b lg:border-b-0 border-r border-slate-200 hover:bg-slate-50 transition-colors flex flex-col justify-between">
            <div className="flex items-start justify-between mb-6">
              <Home className="h-5 w-5 text-emerald-500" />
              <div className="text-right">
                <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                  {stats.totalUnits > 0 ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 0}%
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Global Occupancy</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">{stats.occupiedUnits} / {stats.totalUnits} leased</p>
            </div>
          </div>

          <div className="p-5 border-b lg:border-b-0 border-r border-slate-200 hover:bg-slate-50 transition-colors flex flex-col justify-between">
            <div className="flex items-start justify-between mb-6">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div className="text-right">
                <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                  {(stats.totalMonthlyIncome / 1000).toFixed(0)}K
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Gross Potential Rent</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">Monthly capacity (KSH)</p>
            </div>
          </div>

          <div className="p-5 hover:bg-slate-50 transition-colors flex flex-col justify-between">
            <div className="flex items-start justify-between mb-6">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <div className="text-right">
                <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                  {(stats.projectedMonthlyIncome / 1000).toFixed(0)}K
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Effective Yield</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">Current occupancy based</p>
            </div>
          </div>
        </div>

        {/* Sharp Properties Table Card */}
        <Card className="rounded-none border border-slate-300 shadow-none bg-white">
          <CardHeader className="border-b border-slate-300 p-5 bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 uppercase tracking-wide">Asset Registry</CardTitle>
                <CardDescription className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-wider">
                  DISPLAYING {filteredProperties.length} OF {stats.totalProperties} STRUCTURES
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Query nomenclature or zone..."
                    className="pl-9 h-10 rounded-none border-slate-300 bg-white focus:border-slate-900 focus:ring-0 text-sm"
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-none border-slate-300 bg-white focus:border-slate-900 focus:ring-0 uppercase text-xs font-bold tracking-widest">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-slate-300 shadow-xl">
                    <SelectItem value="all">ALL STATUSES</SelectItem>
                    <SelectItem value="active">ACTIVE</SelectItem>
                    <SelectItem value="maintenance">MAINTENANCE</SelectItem>
                    <SelectItem value="inactive">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {filteredProperties.length === 0 ? (
              <div className="p-12 text-center bg-white">
                <Building className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">No Assets Found</h3>
                <p className="text-sm text-slate-500 mt-1">Adjust search parameters or initialize a new property.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-300 bg-slate-100 hover:bg-slate-100">
                      <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-widest h-12">Structure Identity</TableHead>
                      <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-widest h-12">Coordinates</TableHead>
                      <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-widest h-12">Capacity</TableHead>
                      <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-widest h-12">Load</TableHead>
                      <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-widest h-12">State</TableHead>
                      <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-widest h-12 text-right pr-6">Commands</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.id} className="border-b border-slate-200 hover:bg-slate-50 transition-none">
                        <TableCell className="py-4">
                          <span className="font-bold text-slate-900 text-sm block">
                            {property.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mt-0.5">
                            ID: {property.id.split('-')[0]}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[150px]">{property.city}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 font-mono text-sm text-slate-700">
                          {property.occupied_units} / {property.total_units}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="font-bold text-slate-900">
                            {property.total_units > 0 ? Math.round((property.occupied_units / property.total_units) * 100) : 0}%
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest border ${getStatusBadgeColor(property.status)}`}>
                            {property.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedProperty(property);
                                // Implementation for detail view routing
                              }}
                              className="h-8 w-8 rounded-none text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              title="Inspect Asset"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProperty(property.id)}
                              className="h-8 w-8 rounded-none text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Decommission Asset"
                            >
                              <Trash2 className="h-4 w-4" />
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
    </div>
  );
};

// --------------------------------------------------------------------------------
// PROPERTY FORM (Sharp Design)
// --------------------------------------------------------------------------------
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

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Not authenticated");
        return;
      }

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

      toast.success("Asset instantiated successfully");
      onSuccess();
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error("Failed to compile asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Basic Info */}
      <div className="space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2">Primary Specifications</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-700">Designation <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              className="rounded-none border-slate-300 focus:border-slate-900 focus:ring-0 h-11"
              placeholder="e.g., Alpha Tower"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city" className="text-xs font-bold uppercase tracking-widest text-slate-700">Zone / City <span className="text-red-500">*</span></Label>
            <Input
              id="city"
              className="rounded-none border-slate-300 focus:border-slate-900 focus:ring-0 h-11"
              placeholder="e.g., Nairobi"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-slate-700">Coordinates / Address <span className="text-red-500">*</span></Label>
            <Input
              id="address"
              className="rounded-none border-slate-300 focus:border-slate-900 focus:ring-0 h-11"
              placeholder="e.g., Sector 4, Westlands"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-slate-700">Property Details & Notes</Label>
              <Textarea
                id="description"
                className="rounded-none border-slate-300 focus:border-slate-900 focus:ring-0 min-h-[100px]"
                placeholder="Enter detailed property information here (e.g. Bank Account details for rent, Paybill number, policies, etc.)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type" className="text-xs font-bold uppercase tracking-widest text-slate-700">Classification</Label>
            <Select
              value={formData.type}
              onValueChange={(value: string) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="rounded-none border-slate-300 focus:border-slate-900 focus:ring-0 h-11 uppercase text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-slate-300 shadow-xl">
                <SelectItem value="apartment">RESIDENTIAL COMPLEX</SelectItem>
                <SelectItem value="commercial">COMMERCIAL</SelectItem>
                <SelectItem value="house">DETACHED HOUSE</SelectItem>
                <SelectItem value="mixed">MIXED USE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Unit Types Configuration */}
      <div className="space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2">Volume & Valuation Metrics</h3>
        <div className="space-y-4">
          {unitTypes.map((unitType, index) => (
            <div key={index} className="border border-slate-300 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h4 className="font-bold text-slate-900 uppercase tracking-widest w-32">{unitType.name}</h4>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Allocation (Qty)</Label>
                  <Input
                    type="number"
                    min="0"
                    className="rounded-none border-slate-300 h-9 font-mono text-sm focus:border-slate-900 focus:ring-0 bg-white"
                    value={unitType.count || ''}
                    onChange={(e) => {
                      const newUnitTypes = [...unitTypes];
                      newUnitTypes[index].count = parseInt(e.target.value) || 0;
                      setUnitTypes(newUnitTypes);
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Base Tariff (KSH)</Label>
                  <Input
                    type="number"
                    min="0"
                    className="rounded-none border-slate-300 h-9 font-mono text-sm focus:border-slate-900 focus:ring-0 bg-white"
                    value={unitType.basePrice || ''}
                    onChange={(e) => {
                      const newUnitTypes = [...unitTypes];
                      newUnitTypes[index].basePrice = parseInt(e.target.value) || 0;
                      setUnitTypes(newUnitTypes);
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Area (SQFT)</Label>
                  <Input
                    type="text"
                    placeholder="N/A"
                    className="rounded-none border-slate-200 h-9 font-mono text-sm bg-slate-100 text-slate-400"
                    disabled
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Income Summary */}
      <div className="border border-blue-900 bg-slate-900 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Theoretical Gross Yield</h3>
          <p className="text-xs text-slate-500 mt-1">Based on {unitTypes.reduce((sum, u) => sum + u.count, 0)} units at maximum load</p>
        </div>
        <div className="text-3xl font-black text-white tracking-tighter">
          KSH {unitTypes.reduce((sum, u) => sum + u.count * u.basePrice, 0).toLocaleString()}
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-slate-200">
        <Button
          variant="outline"
          className="flex-1 rounded-none border-slate-300 hover:bg-slate-100 h-12 text-xs font-bold uppercase tracking-widest"
          disabled={loading}
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}
        >
          Abort
        </Button>
        <Button 
          onClick={handleAddProperty} 
          disabled={loading}
          className="flex-1 bg-slate-900 hover:bg-black text-white rounded-none h-12 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Compile Asset
        </Button>
      </div>
    </div>
  );
};

export default PropertyManagementNew;