// src/components/portal/super-admin/PropertyManager.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeroBackground } from "@/components/ui/HeroBackground";
import {
  Building,
  Home,
  DollarSign,
  Search,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Filter,
  RefreshCw,
  BarChart3,
  MapPin,
  Calculator,
  ImageIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { propertyService, Property, CreatePropertyDTO } from '@/services/propertyService';

const PropertyManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPropertyForm, setShowAddPropertyForm] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const [showViewProperty, setShowViewProperty] = useState(false);
  const [showEditProperty, setShowEditProperty] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [assignedManagers, setAssignedManagers] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState<CreatePropertyDTO>({
    name: '',
    location: '',
    image_url: '',
    type: 'Apartment',
    description: '',
    amenities: '',
    units: [{ name: '', units_count: 0, price_per_unit: 0 }]
  });

  useEffect(() => {
    fetchProperties();
    fetchAssignedManagers();
  }, []);

  const fetchAssignedManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('property_manager_assignments')
        .select('property_id, property_manager_id, profiles(first_name, last_name, email)')
        .eq('status', 'active');

      if (error) throw error;

      const managers: Record<string, string> = {};
      data?.forEach((assignment: any) => {
        const profile = assignment.profiles;
        if (profile) {
          managers[assignment.property_id] = `${profile.first_name} ${profile.last_name}`;
        }
      });
      setAssignedManagers(managers);
    } catch (error) {
      console.error("Error fetching assigned managers:", error);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await propertyService.fetchProperties();
      setProperties(data);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = () => {
    setFormData({
      ...formData,
      units: [...formData.units, { name: '', units_count: 0, price_per_unit: 0 }]
    });
  };

  const handleRemoveUnit = (index: number) => {
    const newUnits = [...formData.units];
    newUnits.splice(index, 1);
    setFormData({ ...formData, units: newUnits });
  };

  const handleUnitChange = (index: number, field: keyof typeof formData.units[0], value: any) => {
    const newUnits = [...formData.units];
    newUnits[index] = { ...newUnits[index], [field]: value };
    setFormData({ ...formData, units: newUnits });
  };

  const handleSaveProperty = async () => {
    if (!formData.name || !formData.location) {
        toast.error("Please fill in property name and location");
        return;
    }

    try {
      setSavingProperty(true);
      await propertyService.createProperty(formData);
      toast.success("Property created successfully");
      setShowAddPropertyForm(false);
      
      // Reset form
      setFormData({
        name: '',
        location: '',
        image_url: '',
        type: 'Apartment',
        description: '',
        amenities: '',
        units: [{ name: '', units_count: 0, price_per_unit: 0 }]
      });

      fetchProperties();
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error("Failed to create property");
    } finally {
      setSavingProperty(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
      if(!confirm("Are you sure? This will delete the property and all its units.")) return;
      try {
          const { error } = await supabase.from('properties').delete().eq('id', id);
          if(error) throw error;
          toast.success("Property deleted");
          fetchProperties();
      } catch (err) {
          toast.error("Failed to delete property");
          console.error(err);
      }
  }

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowViewProperty(true);
  }

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setFormData({
      name: property.name,
      location: property.location,
      image_url: property.image_url || '',
      type: property.type || 'Apartment',
      description: property.description || '',
      amenities: property.amenities || '',
      units: property.property_unit_types?.map(u => ({
        name: u.name,
        units_count: u.units_count,
        price_per_unit: u.price_per_unit
      })) || [{ name: '', units_count: 0, price_per_unit: 0 }]
    });
    setShowEditProperty(true);
  }

  const handleUpdateProperty = async () => {
    if (!formData.name || !formData.location || !selectedProperty) {
        toast.error("Please fill in property name and location");
        return;
    }

    try {
      setSavingProperty(true);
      const { error } = await supabase
        .from('properties')
        .update({
          name: formData.name,
          location: formData.location,
          image_url: formData.image_url,
          type: formData.type,
          description: formData.description,
          amenities: formData.amenities,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProperty.id);

      if (error) throw error;

      toast.success("Property updated successfully");
      setShowEditProperty(false);
      setSelectedProperty(null);
      fetchProperties();
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error("Failed to update property");
    } finally {
      setSavingProperty(false);
    }
  }

  // Derived Stats
  const totalProperties = properties.length;
  const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0);
  const totalIncome = properties.reduce((sum, p) => sum + (p.expected_income || 0), 0);

  // Form Calculations
  const formTotalUnits = formData.units.reduce((sum, u) => sum + Number(u.units_count || 0), 0);
  const formExpectedIncome = formData.units.reduce((sum, u) => sum + (Number(u.units_count || 0) * Number(u.price_per_unit || 0)), 0);

  const unitTypeOptions = [
    "Bedsitter", "Studio", "One Bedroom", "Two Bedroom", "Three Bedroom", "Shop", "Office", "Penthouse", "Maisonette", "Villa", "Other"
  ];

  return (
    <div className="bg-slate-50 min-h-screen antialiased text-slate-900 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
      `}</style>
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#154279] to-[#0f325e] text-white py-10 px-6 shadow-xl mb-8 lg:rounded-b-3xl">
        <HeroBackground />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-[1400px] mx-auto">
          <div className="space-y-1">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-inner">
                    <Building className="w-5 h-5 text-white" />
                 </div>
                 <span className="text-blue-100 font-bold tracking-wider text-xs uppercase">Management</span>
             </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Property <span className="text-[#F96302]">Management</span>
            </h1>
            <p className="text-blue-100 text-sm mt-2 font-medium max-w-xl">
              Manage your real estate portfolio, units, and income projections.
            </p>
          </div>
              
          <div className="flex items-center gap-3">
            <Button
                variant="ghost"
                onClick={() => { fetchProperties(); toast.info("Refreshing..."); }}
                className="bg-white/10 hover:bg-white/20 text-white border-none"
            >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
            
            <Dialog open={showAddPropertyForm} onOpenChange={setShowAddPropertyForm}>
                <DialogTrigger asChild>
                <Button className="bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl shadow-lg border-none">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Property
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden bg-white shadow-xl rounded-xl border border-slate-200">
                     {/* Header - Clean White */}
                    <div className="bg-white border-b border-slate-100 p-6">
                    <DialogHeader className="p-0 space-y-1">
                        <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <Building className="w-5 h-5 text-slate-700" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Add New Property</DialogTitle>
                            <p className="text-slate-500 text-sm font-medium">
                            Enter property details and unit breakdown below.
                            </p>
                        </div>
                        </div>
                    </DialogHeader>
                    </div>
                
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-8 bg-white">
                        {/* Section 1: Property Details */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            Property Information
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <Label className="text-slate-700 font-semibold text-sm">Property Name</Label>
                                <Input 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Sunrise Apartments"
                                    className="h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold text-sm">Location</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input 
                                        value={formData.location} 
                                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                                        placeholder="e.g. Westlands, Nairobi"
                                        className="pl-9 h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold text-sm">Type</Label>
                                <Select 
                                    value={formData.type} 
                                    onValueChange={(val) => setFormData({...formData, type: val})}
                                >
                                    <SelectTrigger className="h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Apartment">Apartment</SelectItem>
                                        <SelectItem value="Commercial">Commercial</SelectItem>
                                        <SelectItem value="Mixed">Mixed Use</SelectItem>
                                        <SelectItem value="Villa">Villa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <Label className="text-slate-700 font-semibold text-sm">Cover Image URL</Label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input 
                                        value={formData.image_url} 
                                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                                        placeholder="https://example.com/image.jpg"
                                        className="pl-9 h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white"
                                    />
                                </div>
                            </div>
                            </div>
                        </div>

                        <Separator className="bg-slate-100" />

                        {/* Section 2: Unit Configuration */}
                        <div className="space-y-5">
                            <div className="flex justify-between items-end">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                Unit Configuration
                                </h3>
                                <Button size="sm" variant="outline" onClick={handleAddUnit} className="h-8 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg gap-1.5 text-xs font-bold transition-all">
                                <Plus className="w-3.5 h-3.5" /> Add Unit Type
                                </Button>
                            </div>

                            <div className="space-y-3">
                            <AnimatePresence initial={false}>
                                {formData.units.map((unit, index) => (
                                <motion.div 
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="group relative grid grid-cols-12 gap-3 items-end bg-slate-50/50 p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all"
                                >
                                    <div className="col-span-12 md:col-span-5 space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500">Unit Type</Label>
                                    <div className="relative">
                                        <Input 
                                            list={`unit-types-${index}`}
                                            placeholder="Select or type..." 
                                            value={unit.name}
                                            onChange={(e) => handleUnitChange(index, 'name', e.target.value)}
                                            className="h-9 border-slate-200 bg-white text-sm font-medium focus:border-slate-400 focus:ring-slate-400 rounded-md shadow-sm" 
                                        />
                                        <datalist id={`unit-types-${index}`}>
                                            {unitTypeOptions.map(opt => <option key={opt} value={opt} />)}
                                        </datalist>
                                    </div>
                                    </div>
                                    
                                    <div className="col-span-4 md:col-span-2 space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500">Count</Label>
                                    <Input 
                                        type="number"
                                        min="0"
                                        placeholder="0" 
                                        value={unit.units_count}
                                        onChange={(e) => handleUnitChange(index, 'units_count', Number(e.target.value))}
                                        className="h-9 border-slate-200 bg-white text-sm font-medium text-center focus:border-slate-400 focus:ring-slate-400 rounded-md shadow-sm"
                                    />
                                    </div>
                                    
                                    <div className="col-span-7 md:col-span-4 space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500">Rent (KES)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold z-10">KES</span>
                                        <Input 
                                        type="number"
                                        min="0"
                                        placeholder="0" 
                                        value={unit.price_per_unit}
                                        onChange={(e) => handleUnitChange(index, 'price_per_unit', Number(e.target.value))}
                                        className="pl-10 h-9 border-slate-200 bg-white text-sm font-medium text-right focus:border-slate-400 focus:ring-slate-400 rounded-md shadow-sm"
                                        />
                                    </div>
                                    </div>
                                    
                                    <div className="col-span-1 flex justify-center pb-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleRemoveUnit(index)} 
                                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        disabled={formData.units.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    </div>
                                </motion.div>
                                ))}
                            </AnimatePresence>
                            
                            {formData.units.length === 0 && (
                                <div onClick={handleAddUnit} className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                                    <Home className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="font-semibold text-sm">Add your first unit type</p>
                                </div>
                            )}
                            </div>
                        </div>

                        {/* Financial Summary Card - Clean & Minimal */}
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-5 mt-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-white border border-slate-100 rounded-full shadow-sm">
                                    <Calculator className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Projected Monthly Income</p>
                                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                                    <span className="text-sm text-slate-500 mr-1 font-medium">KES</span>
                                    {formExpectedIncome.toLocaleString()}
                                    </p>
                                </div>
                                </div>
                                
                                <div className="flex gap-6 text-sm">
                                    <div className="px-4 py-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <span className="text-slate-500 text-xs font-semibold uppercase mr-2">Units:</span>
                                        <span className="font-bold text-slate-900">{formTotalUnits}</span>
                                    </div>
                                    <div className="px-4 py-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <span className="text-slate-500 text-xs font-semibold uppercase mr-2">Types:</span>
                                        <span className="font-bold text-slate-900">{formData.units.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t border-slate-100 bg-white">
                    <Button variant="ghost" onClick={() => setShowAddPropertyForm(false)} disabled={savingProperty} className="font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveProperty} 
                        disabled={savingProperty || !formData.name || formTotalUnits === 0} 
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 font-bold rounded-lg shadow-sm"
                    >
                        {savingProperty ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        Create Property
                    </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
      </div>
      </section>

      {/* VIEW PROPERTY DIALOG */}
      <Dialog open={showViewProperty} onOpenChange={setShowViewProperty}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white rounded-2xl shadow-2xl">
          {selectedProperty && (
            <>
              {/* Header with Image */}
              <div className="relative h-80 bg-slate-200 rounded-t-2xl overflow-hidden">
                {selectedProperty.image_url ? (
                  <img 
                    src={selectedProperty.image_url} 
                    alt={selectedProperty.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/900x300?text=Property+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400">
                    <Building className="w-24 h-24 text-slate-500 opacity-50" />
                  </div>
                )}
                <button 
                  onClick={() => setShowViewProperty(false)}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">{selectedProperty.name}</h2>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">{selectedProperty.location}</span>
                  </div>
                  <Badge className="mt-3 bg-blue-100 text-blue-800 px-3 py-1">{selectedProperty.type || 'Apartment'}</Badge>
                </div>

                {/* Description */}
                {selectedProperty.description && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h3>
                    <p className="text-slate-700 leading-relaxed">{selectedProperty.description}</p>
                  </div>
                )}

                {/* Amenities */}
                {selectedProperty.amenities && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Amenities</h3>
                    <p className="text-slate-700 leading-relaxed">{selectedProperty.amenities}</p>
                  </div>
                )}

                {/* Assigned Manager */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900 mb-2">Assigned Manager</h3>
                  <p className="text-lg font-semibold text-blue-900">
                    {assignedManagers[selectedProperty.id] || <span className="text-slate-500">No manager assigned</span>}
                  </p>
                </div>

                {/* Units Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">Total Units</p>
                    <p className="text-2xl font-bold text-emerald-900">{selectedProperty.total_units}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-900 mb-1">Monthly Income</p>
                    <p className="text-2xl font-bold text-orange-900">KES {(selectedProperty.expected_income || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50 rounded-b-2xl">
                <Button variant="ghost" onClick={() => setShowViewProperty(false)} className="font-semibold">
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setShowViewProperty(false);
                    handleEditProperty(selectedProperty);
                  }}
                  className="bg-[#F96302] hover:bg-[#e05802] text-white font-bold"
                >
                  Edit Property
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT PROPERTY DIALOG */}
      <Dialog open={showEditProperty} onOpenChange={setShowEditProperty}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden bg-white shadow-xl rounded-xl border border-slate-200">
          {/* Header */}
          <div className="bg-white border-b border-slate-100 p-6">
            <DialogHeader className="p-0 space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Building className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Edit Property</DialogTitle>
                  <p className="text-slate-500 text-sm font-medium">
                    Update property details and unit information.
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-8 bg-white">
            {/* Section 1: Property Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                Property Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Property Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Sunrise Apartments"
                    className="h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input 
                      value={formData.location} 
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. Westlands, Nairobi"
                      className="pl-9 h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(val) => setFormData({...formData, type: val})}
                  >
                    <SelectTrigger className="h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Mixed">Mixed Use</SelectItem>
                      <SelectItem value="Villa">Villa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Cover Image URL</Label>
                  <div className="space-y-3">
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input 
                        value={formData.image_url} 
                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                        className="pl-9 h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white"
                      />
                    </div>
                    {formData.image_url && (
                      <div className="rounded-lg overflow-hidden border border-slate-200">
                        <img 
                          src={formData.image_url} 
                          alt="Preview"
                          className="w-full h-40 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x160?text=Invalid+Image';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Description</Label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Property description..."
                    className="w-full min-h-[80px] p-3 border-slate-200 border rounded-lg focus:border-slate-400 focus:ring-slate-400 bg-white"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Amenities</Label>
                  <textarea
                    value={formData.amenities || ''}
                    onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                    placeholder="e.g. Gym, Swimming Pool, Security..."
                    className="w-full min-h-[80px] p-3 border-slate-200 border rounded-lg focus:border-slate-400 focus:ring-slate-400 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-slate-100 bg-white">
            <Button variant="ghost" onClick={() => setShowEditProperty(false)} disabled={savingProperty} className="font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProperty} 
              disabled={savingProperty || !formData.name} 
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 font-bold rounded-lg shadow-sm"
            >
              {savingProperty ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <span>Update Property</span>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Properties", value: totalProperties, icon: Building, color: "blue", subtext: "Active Listings" },
          { label: "Total Units", value: totalUnits, icon: Home, color: "green", subtext: `Across ${totalProperties} Properties` },
          { label: "Monthly Income", value: `KES ${(totalIncome / 1000).toFixed(0)}K`, icon: DollarSign, color: "purple", subtext: "Projected" },
          { label: "Avg Rent/Unit", value: `KES ${totalUnits > 0 ? ((totalIncome/totalUnits)/1000).toFixed(1) : 0}K`, icon: BarChart3, color: "orange", subtext: "Estimated" },
        ].map((stat, idx) => {
          const IconComponent = stat.icon;
          const colorMap: any = { 
            blue: "text-blue-600 bg-blue-50 border-blue-100", 
            green: "text-green-600 bg-green-50 border-green-100", 
            purple: "text-purple-600 bg-purple-50 border-purple-100", 
            orange: "text-orange-600 bg-orange-50 border-orange-100" 
          };

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card className="border-2 border-slate-200 hover:border-[#F96302] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-2xl h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">{stat.label}</CardTitle>
                  <div className={`p-2 rounded-lg ${colorMap[stat.color]}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-[#154279] mt-2">{stat.value}</div>
                  <p className="text-xs text-slate-500 font-semibold mt-1">{stat.subtext}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Properties Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-slate-200 rounded-2xl shadow-lg border-t-4 border-t-[#154279]">
          <CardHeader className="border-b-2 border-slate-100 bg-white rounded-t-2xl py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-[#154279] font-black text-xl flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Property Directory
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium mt-1">
                  Managing {properties.length} active properties
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6 bg-white rounded-b-2xl">
            {/* Search */}
            <div className="flex flex-col lg:flex-row gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search properties by name, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-0 bg-white h-10"
                />
              </div>
            </div>

            {/* Properties Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 text-[#154279] animate-spin mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">Loading...</p>
                </div>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-3">
                    <Building className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">No properties found</h3>
                <p className="text-slate-500 mt-1 max-w-xs mx-auto">Create your first property to get started.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="font-bold text-[#154279]">Property Name</TableHead>
                        <TableHead className="font-bold text-[#154279]">Location</TableHead>
                        <TableHead className="font-bold text-[#154279]">Assigned Manager</TableHead>
                        <TableHead className="font-bold text-[#154279] text-center">Total Units</TableHead>
                        <TableHead className="font-bold text-[#154279] text-right">Proj. Income</TableHead>
                        <TableHead className="font-bold text-[#154279] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                   {properties.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.location.toLowerCase().includes(searchQuery.toLowerCase())).map((property) => (
                       <TableRow key={property.id} className="hover:bg-slate-50">
                           <TableCell className="font-medium text-slate-800">
                              {property.name}
                              <div className="text-xs text-slate-400 font-normal">{property.type || 'Apartment'}</div>
                           </TableCell>
                           <TableCell className="text-slate-600">
                               <div className="flex items-center gap-1">
                                   <MapPin className="w-3 h-3" /> {property.location}
                               </div>
                           </TableCell>
                           <TableCell className="font-medium text-slate-700">
                               <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                   {assignedManagers[property.id] || 'Unassigned'}
                               </Badge>
                           </TableCell>
                           <TableCell className="text-center font-bold text-slate-700">
                               {property.total_units}
                           </TableCell>
                           <TableCell className="text-right font-bold text-emerald-600">
                               KES {(property.expected_income || 0).toLocaleString()}
                           </TableCell>
                           <TableCell className="text-center">
                               <div className="flex items-center justify-center gap-2">
                                   <Button 
                                       variant="outline" 
                                       size="sm" 
                                       onClick={() => handleViewProperty(property)}
                                       className="h-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border-slate-200 rounded-lg"
                                   >
                                       View
                                   </Button>
                                   <Button 
                                       variant="outline" 
                                       size="sm" 
                                       onClick={() => handleEditProperty(property)}
                                       className="h-8 text-slate-600 hover:text-orange-600 hover:bg-orange-50 border-slate-200 rounded-lg"
                                   >
                                       Edit
                                   </Button>
                                   <Button variant="ghost" size="icon" onClick={() => handleDeleteProperty(property.id)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                       <Trash2 className="w-4 h-4" />
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
      </motion.div>
    </div>
    </div>
  );
};

export default PropertyManager;
