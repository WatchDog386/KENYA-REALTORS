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
  ImageIcon,
  UserPlus,
  LayoutGrid,
  Users,
  Eye,
  Pencil
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
import { PropertyUnitManager } from "./properties/PropertyUnitManager";
import ManagerAssignment from '@/pages/portal/components/ManagerAssignment';

const PropertyManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPropertyForm, setShowAddPropertyForm] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const [showViewProperty, setShowViewProperty] = useState(false);
  const [showEditProperty, setShowEditProperty] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyForUnits, setPropertyForUnits] = useState<Property | null>(null);
  // assignedStaff maps propertyId to lists of names
  const [assignedStaff, setAssignedStaff] = useState<Record<string, {
      managers: string[],
      technicians: string[],
      proprietors: string[],
      caretakers: string[]
  }>>({});
  const [occupiedUnitsCount, setOccupiedUnitsCount] = useState(0);
  
  // New state for assignment
  const [showAssignManagerDialog, setShowAssignManagerDialog] = useState(false);
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");

  // Form State
  const [formData, setFormData] = useState<CreatePropertyDTO>({
    name: '',
    location: '',
    image_url: '',
    type: 'Apartment',
    description: '',
    amenities: '',
    number_of_floors: 1,
    units: [{ name: '', units_count: 0, price_per_unit: 0 }]
  });

  useEffect(() => {
    fetchProperties();
    fetchAssignedStaff();
    fetchAvailableManagers();
  }, []);

  const fetchAvailableManagers = async () => {
      try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('role', 'property_manager');
            
          if(error) throw error;
          setAvailableManagers(data || []);
      } catch (err) {
          console.error("Error fetching managers", err);
      }
  };

  const fetchAssignedStaff = async () => {
    try {
      const staffMap: Record<string, { managers: string[], technicians: string[], proprietors: string[], caretakers: string[] }> = {};

      const initMap = (propId: string) => {
          if (!staffMap[propId]) {
              staffMap[propId] = { managers: [], technicians: [], proprietors: [], caretakers: [] };
          }
      };

      // 1. Managers
      const { data: managers } = await supabase.from('property_manager_assignments').select('property_id, property_manager_id').eq('status', 'active');
      if (managers?.length) {
          const ids = managers.map((m: any) => m.property_manager_id);
          const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', ids);
          managers.forEach((m: any) => {
              const p = profiles?.find((prof: any) => prof.id === m.property_manager_id);
              if (p && m.property_id) {
                  initMap(m.property_id);
                  staffMap[m.property_id].managers.push(`${p.first_name} ${p.last_name}`);
              }
          });
      }

      // 2. Technicians
      const { data: techAssigns } = await supabase.from('technician_property_assignments').select('property_id, technician_id');
      if (techAssigns?.length) {
          const techIds = techAssigns.map((t: any) => t.technician_id);
          const { data: technicians } = await supabase.from('technicians').select('id, user_id, technician_categories(name)').in('id', techIds); 
          if (technicians?.length) {
              const userIds = technicians.map((t: any) => t.user_id);
              const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', userIds);
              
              techAssigns.forEach((t: any) => {
                  const tech = technicians.find((te: any) => te.id === t.technician_id);
                  if (tech) {
                      const p = profiles?.find((prof: any) => prof.id === tech.user_id);
                      if (p && t.property_id) {
                          initMap(t.property_id);
                          const cat = (tech.technician_categories as any)?.name || 'Tech';
                          staffMap[t.property_id].technicians.push(`${p.first_name} ${p.last_name} (${cat})`);
                      }
                  }
              });
          }
      }

      // 3. Proprietors
      const { data: propAssigns } = await supabase.from('proprietor_properties').select('property_id, proprietor_id');
      if (propAssigns?.length) {
          const propIds = propAssigns.map((p: any) => p.proprietor_id);
          const { data: proprietors } = await supabase.from('proprietors').select('id, user_id').in('id', propIds);
          
          if (proprietors?.length) {
              const userIds = proprietors.map((p: any) => p.user_id);
              const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', userIds);
              
              propAssigns.forEach((pa: any) => {
                   const prop = proprietors.find((pr: any) => pr.id === pa.proprietor_id);
                   if (prop) {
                       const p = profiles?.find((prof: any) => prof.id === prop.user_id);
                       if (p && pa.property_id) {
                           initMap(pa.property_id);
                           staffMap[pa.property_id].proprietors.push(`${p.first_name} ${p.last_name}`);
                       }
                   }
              });
          }
      }

      // 4. Caretakers
      const { data: caretakers } = await supabase.from('caretakers').select('property_id, user_id').eq('status', 'active');
      if (caretakers?.length) {
          const userIds = caretakers.map((c: any) => c.user_id);
          const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', userIds);
          caretakers.forEach((c: any) => {
               const p = profiles?.find((prof: any) => prof.id === c.user_id);
               if (p && c.property_id) {
                   initMap(c.property_id);
                   staffMap[c.property_id].caretakers.push(`${p.first_name} ${p.last_name}`);
               }
          });
      }

      setAssignedStaff(staffMap);
    } catch (error) {
      console.error("Error fetching assigned staff:", error);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await propertyService.fetchProperties();
      setProperties(data);
      
      // Fetch occupied units count
      const { data: units = [] } = await supabase
        .from('units')
        .select('id, status');
      
      const occupied = units.filter((u: any) => u.status?.toLowerCase() === 'occupied').length;
      setOccupiedUnitsCount(occupied);
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
      number_of_floors: property.number_of_floors || 1,
      units: property.property_unit_types?.map((u: any) => ({
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
          number_of_floors: formData.number_of_floors || 1,
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
  const totalUnits = properties.reduce((sum: number, p: Property) => sum + (p.total_units || 0), 0);
  const totalIncome = properties.reduce((sum: number, p: Property) => sum + (p.expected_income || 0), 0);

  // Form Calculations
  const formTotalUnits = formData.units.reduce((sum: number, u: any) => sum + Number(u.units_count || 0), 0);
  const formExpectedIncome = formData.units.reduce((sum: number, u: any) => sum + (Number(u.units_count || 0) * Number(u.price_per_unit || 0)), 0);

  const unitTypeOptions = [
    "Bedsitter", "Studio", "One Bedroom", "Two Bedroom", "Three Bedroom", "Shop", "Office", "Penthouse", "Maisonette", "Villa", "Other"
  ];

  return (
    <div className="bg-[#F5F8FA] min-h-screen antialiased text-slate-900 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
      `}</style>
      
      {/* UNIT MANAGER VIEW */}
      {propertyForUnits && (
        <PropertyUnitManager 
          property={propertyForUnits} 
          onBack={() => {
            setPropertyForUnits(null);
            fetchProperties();
          }}
        />
      )}

      {/* MAIN PROPERTY MANAGER VIEW */}
      {!propertyForUnits && (
      <>
      <section className="relative overflow-hidden bg-[#154279] rounded-b-[2.5rem] shadow-xl mb-12 min-h-[40vh] flex items-center">
        <HeroBackground />
        <div className="absolute inset-0 bg-gradient-to-r from-[#154279] via-[#154279]/95 to-blue-900/80" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-[1400px] mx-auto px-6 w-full pt-16">
          <div className="space-y-1">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-inner">
                    <Building className="w-5 h-5 text-white" />
                 </div>
                 <span className="text-blue-100 font-bold tracking-wider text-xs uppercase">Management</span>
             </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white">
              Property <span className="text-[#F96302]">Management</span>
            </h1>
            <p className="text-blue-100 text-sm mt-2 font-medium max-w-xl leading-relaxed">
              Manage your real estate portfolio, units, and income projections efficiently from one dashboard.
            </p>
          </div>
              
          <div className="flex items-center gap-3">
            <Button
                variant="ghost"
                onClick={() => { fetchProperties(); toast.info("Refreshing..."); }}
                className="bg-white/10 hover:bg-white/20 text-white border-none rounded-xl"
            >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
            
            <Dialog open={showAddPropertyForm} onOpenChange={setShowAddPropertyForm}>
                <DialogTrigger asChild>
                <Button className="bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl shadow-lg border-none px-6 py-6 text-sm uppercase tracking-wider">
                    <Plus className="w-5 h-5 mr-2" />
                    New Property
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
                            <DialogTitle className="text-xl font-bold text-[#154279] tracking-tight">Add New Property</DialogTitle>
                            <DialogDescription className="text-slate-500 text-sm font-medium">
                            Enter property details and unit breakdown below.
                            </DialogDescription>
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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
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
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, location: e.target.value})}
                                        placeholder="e.g. Westlands, Nairobi"
                                        className="pl-9 h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold text-sm">Floors</Label>
                                <Input 
                                    type="number"
                                    min="1"
                                    value={formData.number_of_floors} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, number_of_floors: Number(e.target.value)})}
                                    placeholder="Number of floors"
                                    className="h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 font-semibold text-sm">Type</Label>
                                <Select 
                                    value={formData.type} 
                                    onValueChange={(val: string) => setFormData({...formData, type: val})}
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
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, image_url: e.target.value})}
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
                                <Button size="sm" variant="outline" onClick={handleAddUnit} className="h-8 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-[#154279] rounded-lg gap-1.5 text-xs font-bold transition-all">
                                <Plus className="w-3.5 h-3.5" /> Add Unit Type
                                </Button>
                            </div>

                            <div className="space-y-3">
                            <AnimatePresence initial={false}>
                                {formData.units.map((unit: any, index: number) => (
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
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitChange(index, 'name', e.target.value)}
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
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitChange(index, 'units_count', Number(e.target.value))}
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
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitChange(index, 'price_per_unit', Number(e.target.value))}
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
                                    <p className="text-2xl font-bold text-[#154279] tracking-tight">
                                    <span className="text-sm text-slate-500 mr-1 font-medium">KES</span>
                                    {formExpectedIncome.toLocaleString()}
                                    </p>
                                </div>
                                </div>
                                
                                <div className="flex gap-6 text-sm">
                                    <div className="px-4 py-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <span className="text-slate-500 text-xs font-semibold uppercase mr-2">Units:</span>
                                        <span className="font-bold text-[#154279]">{formTotalUnits}</span>
                                    </div>
                                    <div className="px-4 py-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <span className="text-slate-500 text-xs font-semibold uppercase mr-2">Types:</span>
                                        <span className="font-bold text-[#154279]">{formData.units.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t border-slate-100 bg-white">
                    <Button variant="ghost" onClick={() => setShowAddPropertyForm(false)} disabled={savingProperty} className="font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#154279] rounded-lg">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveProperty} 
                        disabled={savingProperty || !formData.name || formTotalUnits === 0} 
                        className="bg-[#154279] hover:bg-[#0f325e] text-white px-6 font-bold rounded-lg shadow-sm"
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
          <DialogTitle className="sr-only">Property Details</DialogTitle>
          <DialogDescription className="sr-only">Full details of the selected property</DialogDescription>
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
                  <h2 className="text-3xl font-bold text-[#154279] mb-2">{selectedProperty.name}</h2>
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

                {/* Assigned Staff */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900 mb-2">Assigned Staff</h3>
                  <div className="space-y-1">
                      {assignedStaff[selectedProperty.id]?.managers?.length > 0 && (
                          <div className="text-sm text-blue-900"><span className="font-semibold">Managers:</span> {assignedStaff[selectedProperty.id].managers.join(', ')}</div>
                      )}
                      {assignedStaff[selectedProperty.id]?.technicians?.length > 0 && (
                          <div className="text-sm text-blue-900"><span className="font-semibold">Technicians:</span> {assignedStaff[selectedProperty.id].technicians.join(', ')}</div>
                      )}
                      {assignedStaff[selectedProperty.id]?.proprietors?.length > 0 && (
                          <div className="text-sm text-blue-900"><span className="font-semibold">Proprietors:</span> {assignedStaff[selectedProperty.id].proprietors.join(', ')}</div>
                      )}
                       {assignedStaff[selectedProperty.id]?.caretakers?.length > 0 && (
                          <div className="text-sm text-blue-900"><span className="font-semibold">Caretakers:</span> {assignedStaff[selectedProperty.id].caretakers.join(', ')}</div>
                      )}
                      {(!assignedStaff[selectedProperty.id] || (
                          !assignedStaff[selectedProperty.id].managers.length && 
                          !assignedStaff[selectedProperty.id].technicians.length &&
                          !assignedStaff[selectedProperty.id].proprietors.length &&
                          !assignedStaff[selectedProperty.id].caretakers.length
                      )) && (
                          <span className="text-slate-500 italic text-sm">No staff assigned</span>
                      )}
                  </div>
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
                  <DialogTitle className="text-xl font-bold text-[#154279] tracking-tight">Edit Property</DialogTitle>
                  <DialogDescription className="text-slate-500 text-sm font-medium">
                    Update property details and unit information.
                  </DialogDescription>
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. Westlands, Nairobi"
                      className="pl-9 h-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold text-sm">Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(val: string) => setFormData({...formData, type: val})}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, image_url: e.target.value})}
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
            <Button variant="ghost" onClick={() => setShowEditProperty(false)} disabled={savingProperty} className="font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#154279] rounded-lg">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProperty} 
              disabled={savingProperty || !formData.name} 
              className="bg-[#154279] hover:bg-[#0f325e] text-white px-6 font-bold rounded-lg shadow-sm"
            >
              {savingProperty ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <span>Update Property</span>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASSIGN MANAGER DIALOG */}
      <Dialog open={showAssignManagerDialog} onOpenChange={(open) => {
        setShowAssignManagerDialog(open);
        if (!open) fetchAssignedStaff();
      }}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-xl border border-slate-200">
            <DialogHeader>
                <DialogTitle className="text-[#154279] font-bold">Assign Staff</DialogTitle>
                <DialogDescription>
                    Assign Managers, Technicians, Proprietors, or Caretakers to <span className="font-semibold text-[#154279]">{selectedProperty?.name}</span>.
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
                <ManagerAssignment propertyId={selectedProperty?.id} showForm={true} />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowAssignManagerDialog(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Properties", value: totalProperties, icon: Building, color: "blue", subtext: "Active Listings" },
          { label: "Total Units", value: totalUnits, icon: Home, color: "green", subtext: `Across ${totalProperties} Properties` },
          { label: "Occupied Units", value: occupiedUnitsCount, icon: Users, color: "purple", subtext: `${totalUnits > 0 ? ((occupiedUnitsCount/totalUnits)*100).toFixed(1) : 0}% Occupancy` },
          { label: "Monthly Income", value: `KES ${(totalIncome / 1000).toFixed(0)}K`, icon: DollarSign, color: "orange", subtext: "Projected" },
        ].map((stat, idx) => {
          const IconComponent = stat.icon;
          const colorMap: any = { 
            blue: "from-[#154279] to-[#205a9e]", 
            green: "from-emerald-600 to-emerald-500", 
            purple: "from-purple-600 to-purple-500", 
            orange: "from-[#F96302] to-[#ff8c42]" 
          };

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card className={`bg-gradient-to-br ${colorMap[stat.color]} text-white border-none shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl h-full overflow-hidden relative`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <IconComponent className="w-24 h-24 -mr-6 -mt-6" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-bold text-blue-100 uppercase tracking-wider">{stat.label}</CardTitle>
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-2xl font-black text-white mt-1">{stat.value}</div>
                  <p className="text-xs text-blue-100 font-semibold mt-1 bg-black/10 px-2 py-1 rounded inline-block">{stat.subtext}</p>
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
        <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-white py-6">
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-0 bg-white h-10"
                />
              </div>
            </div>

            {/* Properties List - Card View */}
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
                <div className="space-y-6">
                    {properties.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.location.toLowerCase().includes(searchQuery.toLowerCase())).map((property) => (
                        <Card key={property.id} className="hover:shadow-lg transition-shadow border border-slate-200">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg text-[#154279]">{property.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            <MapPin className="w-3.5 h-3.5 text-[#F96302]" /> 
                                            {property.location} • <span className="text-slate-500">{property.type || 'Apartment'}</span>
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                        {assignedStaff[property.id]?.managers?.map((name, i) => (
                                            <Badge key={`m-${i}`} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 w-fit">
                                                <UserPlus className="w-3 h-3" /> {name}
                                            </Badge>
                                        ))}
                                        {assignedStaff[property.id]?.technicians?.map((name, i) => (
                                            <Badge key={`t-${i}`} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 w-fit">
                                                <Users className="w-3 h-3" /> {name}
                                            </Badge>
                                        ))}
                                          {assignedStaff[property.id]?.proprietors?.map((name, i) => (
                                            <Badge key={`p-${i}`} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 w-fit">
                                                <Building className="w-3 h-3" /> {name}
                                            </Badge>
                                        ))}
                                        {assignedStaff[property.id]?.caretakers?.map((name, i) => (
                                            <Badge key={`c-${i}`} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1 w-fit">
                                                <UserPlus className="w-3 h-3" /> {name}
                                            </Badge>
                                        ))}
                                        {(!assignedStaff[property.id] || (
                                            !assignedStaff[property.id].managers.length && 
                                            !assignedStaff[property.id].technicians.length &&
                                            !assignedStaff[property.id].proprietors.length &&
                                            !assignedStaff[property.id].caretakers.length
                                        )) && (
                                            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 flex items-center gap-1">
                                                <UserPlus className="w-3 h-3" /> Unassigned
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                         <Badge variant="outline" className="flex items-center gap-1 bg-slate-50">
                                            <Home className="w-3 h-3 text-slate-500" />
                                            {property.total_units} Total Units
                                         </Badge>
                                         <Badge variant="outline" className="flex items-center gap-1 bg-slate-50">
                                            <DollarSign className="w-3 h-3 text-emerald-600" />
                                            Proj. Income: KES {(property.expected_income || 0).toLocaleString()}
                                         </Badge>
                                         <Badge variant="outline" className="flex items-center gap-1 bg-slate-50">
                                            <Building className="w-3 h-3 text-blue-500" />
                                            {property.number_of_floors || 1} Floors
                                         </Badge>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Status</p>
                                            <p className="font-bold text-[#154279] text-sm">Active Listing</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleViewProperty(property)}
                                                className="bg-[#154279] hover:bg-[#0f325e] text-white font-bold rounded-xl border-none mb-1 h-9"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Details
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setPropertyForUnits(property)}
                                                className="bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl border-none mb-1 h-9"
                                            >
                                                <LayoutGrid className="w-4 h-4 mr-2" />
                                                Manage Units
                                            </Button>
                                            
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleEditProperty(property)}
                                                    className="h-9 w-9 text-slate-400 hover:text-[#154279] hover:bg-blue-50 rounded-xl"
                                                    title="Edit Property"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => {
                                                        setSelectedProperty(property);
                                                        setSelectedManagerId(""); // reset selection
                                                        setShowAssignManagerDialog(true);
                                                    }}
                                                    className="h-9 w-9 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl"
                                                    title="Assign Staff"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDeleteProperty(property.id)} 
                                                    className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                                                    title="Delete Property"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      </div>
      </>
      )}
    </div>
  );
};

export default PropertyManager;
