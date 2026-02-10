import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Property, PropertyUnitType } from "@/services/propertyService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeroBackground } from "@/components/ui/HeroBackground";
import { motion, AnimatePresence } from "framer-motion";
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
    Dialog,
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Trash2, LayoutGrid, ArrowLeft, Pencil, Plus, Upload, X, Building, DollarSign, Users, Home, CheckCircle, Zap, Shield, BarChart3, Settings2, ChevronRight, Search } from "lucide-react";
import { MdApartment, MdKingBed, MdBusiness, MdStorefront } from "react-icons/md";
import { FaCouch } from "react-icons/fa";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";  
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
    
    body { font-family: 'Nunito', sans-serif; }
    .font-nunito { font-family: 'Nunito', sans-serif; }
    h1, h2, h3, h4, h5, h6 { font-family: 'Nunito', sans-serif; }
    
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #ccc; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #F96302; }
  `}</style>
);

const THEME = {
  primary: "#154279",
  secondary: "#F96302",
};

interface PropertyUnitManagerProps {
  property: Property;
  onBack: () => void;
}

interface Unit {
  id: string;
  unit_number: string;
  floor_number: number;
  unit_type_id: string;
  price: number | null;
  status: string;
  description: string | null;
  features?: string[];
  images?: { id: string, image_url: string }[];
  property_unit_types?: {
    name: string;
    price_per_unit: number;
    description?: string;
    features?: string[];
  };
}

export const PropertyUnitManager: React.FC<PropertyUnitManagerProps> = ({ property, onBack }) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitTypes, setUnitTypes] = useState<PropertyUnitType[]>([]);
  
  // Edit State
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Bulk Generation State
  const [generateConfig, setGenerateConfig] = useState({
    unitTypeName: "", // Replaces unitTypeId for input
    count: 1,
    floorNumber: 1,
    startNumber: 1,
    prefix: "",
    price: "",
    description: "",
    features: "" // Comma separated
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Unit Types Management State
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
  const [editingType, setEditingType] = useState<PropertyUnitType | null>(null);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false); // For Add/Edit Type
  const [isSavingType, setIsSavingType] = useState(false);

  useEffect(() => {
    fetchUnits();
    fetchUnitTypes();
  }, [property.id]);

  const fetchUnitTypes = async () => {
    const { data } = await supabase
      .from('property_unit_types')
      .select('*')
      .eq('property_id', property.id);
    if(data) setUnitTypes(data);
  };

  const fetchUnits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        property_unit_types (
          name,
          price_per_unit
        ),
        unit_images (
           id,
           image_url
        )
      `)
      .eq('property_id', property.id)
      .order('floor_number', { ascending: true })
      .order('unit_number', { ascending: true });

    if (error) {
      toast.error("Failed to fetch units");
      console.error(error);
    } else {
      setUnits(data || []);
    }
    setLoading(false);
  };

  const handleGenerateUnits = async () => {
    if (!generateConfig.unitTypeName || !generateConfig.price) {
      toast.error("Unit Type Name and Price are required");
      return;
    }

    try {
      setIsGenerating(true);
      
      // 1. Find or Create Unit Type
      let typeId = "";
      const existingType = unitTypes.find(t => t.name.toLowerCase() === generateConfig.unitTypeName.toLowerCase());
      
      if (existingType) {
        typeId = existingType.id!;
      } else {
        // Create new type
        const { data: newType, error: typeError } = await supabase
          .from('property_unit_types')
          .insert({
            property_id: property.id,
            name: generateConfig.unitTypeName,
            price_per_unit: Number(generateConfig.price)
          })
          .select()
          .single();
        
        if (typeError) throw typeError;
        typeId = newType.id;
        fetchUnitTypes(); // visual update
      }

      // 2. Create Units
      const unitsToCreate = [];
      const featuresArray = generateConfig.features ? generateConfig.features.split(',').map(f => f.trim()).filter(Boolean) : [];
      
      for (let i = 0; i < generateConfig.count; i++) {
        const num = generateConfig.startNumber + i;
        const unitNumber = `${generateConfig.prefix}${num}`;
        
        unitsToCreate.push({
          property_id: property.id,
          unit_type_id: typeId,
          unit_number: unitNumber,
          floor_number: generateConfig.floorNumber,
          price: Number(generateConfig.price),
          status: 'vacant', // Default as per request
          description: generateConfig.description || generateConfig.unitTypeName,
          features: featuresArray
        });
      }

      const { error } = await supabase.from('units').insert(unitsToCreate);
      
      if (error) {
        if (error.code === '23505') {
            toast.error("Some unit numbers already exist! Use different numbers.");
        } else {
            throw error;
        }
      } else {
        toast.success(`Generated ${generateConfig.count} units`);
        fetchUnits();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate units");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if(!confirm("Delete this unit?")) return;
    const { error } = await supabase.from('units').delete().eq('id', id);
    if(error) toast.error("Failed to delete");
    else {
        toast.success("Unit deleted");
        setUnits(units.filter(u => u.id !== id));
    }
  };

  const handleUpdateUnit = async () => {
    if (!editingUnit) return;
    try {
        let typeId = editingUnit.unit_type_id;
        const typeName = editingUnit.property_unit_types?.name;

        if (typeName) {
            // Find existing type by name (case-insensitive)
            const existingType = unitTypes.find(t => t.name.toLowerCase() === typeName.toLowerCase());
            
            if (existingType) {
                typeId = existingType.id!;
            } else {
                // Create new type
                const { data: newType, error: typeError } = await supabase
                  .from('property_unit_types')
                  .insert({
                    property_id: property.id,
                    name: typeName,
                    price_per_unit: editingUnit.price || 0
                  })
                  .select()
                  .single();
                
                if (typeError) throw typeError;
                typeId = newType.id;
                await fetchUnitTypes(); // Refresh types list
            }
        }

        const { error } = await supabase.from('units').update({
            unit_number: editingUnit.unit_number,
            floor_number: editingUnit.floor_number,
            unit_type_id: typeId,
            price: editingUnit.price,
            status: editingUnit.status,
            description: editingUnit.description,
            features: editingUnit.features
        }).eq('id', editingUnit.id);

        if (error) throw error;
        toast.success("Unit updated");
        setIsEditOpen(false);
        fetchUnits();
    } catch(e) {
        console.error(e);
        toast.error("Failed to update unit");
    }
  };

  // Unit Type CRUD
  const handleSaveType = async (type: Partial<PropertyUnitType>) => {
    if (!type.name || !type.price_per_unit) {
        toast.error("Name and Price are required");
        return;
    }
    
    setIsSavingType(true);
    try {
        if (type.id) {
            // Update
            const { error } = await supabase.from('property_unit_types').update({
                name: type.name,
                price_per_unit: type.price_per_unit
            }).eq('id', type.id);
            if (error) throw error;
            toast.success("Unit Type updated");
        } else {
            // Create
            const { error } = await supabase.from('property_unit_types').insert({
                property_id: property.id,
                name: type.name,
                price_per_unit: type.price_per_unit
            });
            if (error) throw error;
            toast.success("Unit Type created");
        }
        setIsTypeDialogOpen(false);
        fetchUnitTypes();
    } catch (e: any) {
        console.error(e);
        toast.error("Error saving unit type: " + e.message);
    } finally {
        setIsSavingType(false);
    }
  };

  const handleDeleteType = async (id: string) => {
      // Check if used
      const isUsed = units.some(u => u.unit_type_id === id);
      if (isUsed) {
          toast.error("Cannot delete type: It is assigned to existing units.");
          return;
      }
      if (!confirm("Delete this unit type?")) return;

      const { error } = await supabase.from('property_unit_types').delete().eq('id', id);
      if (error) toast.error("Failed to delete");
      else {
          toast.success("Unit Type deleted");
          fetchUnitTypes();
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files.length || !editingUnit) return;
      
      const files = Array.from(e.target.files);
      const uploadingToast = toast.loading("Uploading images...");
      
      try {
          for (const file of files) {
              const fileExt = file.name.split('.').pop();
              const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
              const filePath = `${editingUnit.id}/${fileName}`;
              
              const { error: uploadError } = await supabase.storage
                  .from('property_images') // Assuming bucket name
                  .upload(filePath, file);

              if (uploadError) throw uploadError;
              
              const { data: { publicUrl } } = supabase.storage
                  .from('property_images')
                  .getPublicUrl(filePath);

              // Save to unit_images table
              const { error: dbError } = await supabase
                  .from('unit_images')
                  .insert({
                      unit_id: editingUnit.id,
                      image_url: publicUrl
                  });
              
              if (dbError) throw dbError;
          }
          toast.success("Images uploaded");
          // Refresh units or active unit images
          // Fetch images for this unit specifically or just refetch all units
          fetchUnits(); 
      } catch (error: any) {
          console.error("Upload failed", error);
          toast.error("Upload failed: " + error.message);
      } finally {
          toast.dismiss(uploadingToast);
      }
  };

  const openTypeDialog = (type?: PropertyUnitType) => {
      setEditingType(type || { 
          name: '', 
          price_per_unit: 0, 
          units_count: 0 
      } as any);
      setIsTypeDialogOpen(true);
  };

  const openEditDialog = (unit: Unit) => {
    setEditingUnit({...unit});
    setIsEditOpen(true);
  };

  return (
    <>
    <GlobalStyles />
    <div className="min-h-screen pb-20 animate-in fade-in duration-500 bg-[#F5F8FA] font-nunito">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#154279] rounded-b-[2.5rem] shadow-xl mb-12 min-h-[40vh] flex items-center -mx-6 -mt-6 lg:-mx-0 lg:-mt-0">
        <HeroBackground />
        <div className="absolute inset-0 bg-gradient-to-r from-[#154279] via-[#154279]/95 to-blue-900/80" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-[1400px] mx-auto px-6 w-full pt-16">
          <div className="flex items-center gap-6">
             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" onClick={onBack} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl h-12 w-12 shadow-md backdrop-blur-sm">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
             </motion.div>
             
             <div>
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 mb-2"
                >
                    <div className="h-[2px] w-8 bg-[#F96302]"></div>
                    <span className="text-[11px] font-bold text-[#F96302] uppercase tracking-[0.2em]">{property.type || 'Property'} Management</span>
                </motion.div>
                
                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-2">
                {property.name} <span className="text-[#F96302]">Units</span>
                </h1>
                
                <p className="text-blue-100/80 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                   <Building className="w-4 h-4 text-[#F96302]" />
                   {property.location}
                </p>
             </div>
          </div>
              
          <div className="flex items-center gap-3">
             <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsManageTypesOpen(true)}
                className="px-5 py-3 rounded-lg font-bold text-[11px] uppercase tracking-[0.15em] transition-all flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 shadow-lg backdrop-blur-sm"
             >
                <Settings2 className="w-4 h-4" />
                Manage Types
             </motion.button>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 space-y-12">

      {/* Summary Section - Product Card Style */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <motion.div 
            whileHover={{ y: -5 }}
            className="group relative rounded-2xl p-6 shadow-lg bg-gradient-to-br from-[#154279] to-[#205a9e] text-white overflow-hidden transition-all duration-300"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none -mr-8 -mt-8" />
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl mb-2 group-hover:bg-white/30 transition-colors">
                    <MdApartment size={32} className="text-white" />
                </div>
                <h3 className="text-xs font-bold text-blue-100 uppercase tracking-widest">Total Units</h3>
                <div className="text-4xl font-black text-white">{units.length}</div>
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Active Inventory</p>
            </div>
        </motion.div>

        <motion.div 
            whileHover={{ y: -5 }}
            className="group relative rounded-2xl p-6 shadow-lg bg-gradient-to-br from-emerald-600 to-emerald-500 text-white overflow-hidden transition-all duration-300"
        >
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none -mr-8 -mt-8" />
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-3">
                 <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl mb-2 group-hover:bg-white/30 transition-colors">
                    <CheckCircle size={32} className="text-white" />
                </div>
                <h3 className="text-xs font-bold text-emerald-100 uppercase tracking-widest">Occupancy</h3>
                <div className="text-4xl font-black text-white">
                    {units.length > 0 ? Math.round((units.filter(u => u.status === 'occupied').length / units.length) * 100) : 0}%
                </div>
                <div className="w-full max-w-[120px] h-2 bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white" style={{ width: `${units.length > 0 ? (units.filter(u => u.status === 'occupied').length / units.length) * 100 : 0}%` }} />
                </div>
            </div>
        </motion.div>

        <motion.div 
             whileHover={{ y: -5 }}
             className="group relative rounded-2xl p-6 shadow-lg bg-gradient-to-br from-[#F96302] to-[#ff8c42] text-white overflow-hidden transition-all duration-300"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none -mr-8 -mt-8" />
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-3">
                 <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl mb-2 group-hover:bg-white/30 transition-colors">
                    <MdStorefront size={32} className="text-white" />
                </div>
                <h3 className="text-xs font-bold text-orange-100 uppercase tracking-widest">Revenue Potential</h3>
                <div className="text-3xl font-black text-white flex items-baseline">
                    <span className="text-sm font-bold text-orange-200 mr-1">KES</span>
                    {units.reduce((sum, u) => sum + (Number(u.price) || 0), 0).toLocaleString()}
                </div>
                <p className="text-[10px] text-orange-100 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Zap size={10} /> Monthly Projected
                </p>
            </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: UNITS LIST - Styled as ComparisonMatrix */}
        <div className="lg:col-span-2 space-y-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border-none shadow-xl rounded-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
                    <div>
                         <h2 className="text-lg font-bold flex items-center gap-2 text-[#154279] uppercase tracking-tight">
                            <MdKingBed className="w-5 h-5 text-[#F96302]" /> Unit Directory
                        </h2>
                        <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">Manage individual units</p>
                    </div>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Search..." 
                            className="pl-9 h-9 text-xs border-slate-300 focus:border-[#F96302] focus:ring-0 rounded-lg w-40 md:w-60 bg-white"
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gradient-to-r from-[#e8ecf1] to-[#f0f4f8] border-b-2 border-[#154279]">
                                <TableHead className="py-4 text-[#154279] font-bold text-[10px] uppercase tracking-[0.2em]">Unit #</TableHead>
                                <TableHead className="py-4 text-[#154279] font-bold text-[10px] uppercase tracking-[0.2em]">Type</TableHead>
                                <TableHead className="py-4 text-[#154279] font-bold text-[10px] uppercase tracking-[0.2em] text-center">Floor</TableHead>
                                <TableHead className="py-4 text-[#154279] font-bold text-[10px] uppercase tracking-[0.2em] text-right">Price</TableHead>
                                <TableHead className="py-4 text-[#154279] font-bold text-[10px] uppercase tracking-[0.2em] text-center">Status</TableHead>
                                <TableHead className="py-4 text-[#154279] font-bold text-[10px] uppercase tracking-[0.2em] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#154279] mb-2" />
                                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Loading...</p>
                                    </TableCell>
                                </TableRow>
                            ) : units.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16 bg-slate-50/50">
                                        <div className="opacity-20 mb-4 inline-block">
                                            <MdApartment size={64} />
                                        </div>
                                        <h3 className="text-[#154279] font-bold text-sm uppercase tracking-wide">No units found</h3>
                                        <p className="text-slate-500 text-xs mt-1">Use the generator to create units.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                units.map((unit) => (
                                    <motion.tr 
                                        key={unit.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        whileHover={{ backgroundColor: "rgba(21, 66, 121, 0.02)" }}
                                        className="hover:bg-slate-50 transition-colors group"
                                    >
                                        <TableCell className="font-bold text-[#154279] border-l-4 border-transparent group-hover:border-[#F96302] transition-all">
                                            {unit.unit_number}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                                                    <LayoutGrid size={14} />
                                                </div>
                                                <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wide">
                                                    {unit.property_unit_types?.name || 'Unknown'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-slate-500 text-xs">{unit.floor_number}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="font-bold text-[#154279] text-[12px]">KES {unit.price?.toLocaleString() || 0}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                unit.status === 'occupied' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                unit.status === 'booked' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                unit.status === 'maintenance' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-blue-50 text-blue-700 border-blue-200'
                                            )}>
                                                <span className={cn("w-1.5 h-1.5 rounded-full", 
                                                     unit.status === 'occupied' ? 'bg-emerald-500' : 
                                                     unit.status === 'booked' ? 'bg-purple-500' :
                                                     unit.status === 'maintenance' ? 'bg-red-500' :
                                                     'bg-blue-500'
                                                )}></span>
                                                {unit.status === 'available' ? 'vacant' : unit.status}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => openEditDialog(unit)}
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-[#154279] hover:bg-transparent"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleDeleteUnit(unit.id)}
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-transparent"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </motion.div>
        </div>

        {/* RIGHT COLUMN: GENERATOR - Styled as Product Card but with Form */}
        <div className="space-y-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={cn(
                    "relative border-2 rounded-2xl transition-all duration-300 overflow-hidden bg-white",
                    "border-[#154279] shadow-2xl shadow-[#154279]/10"
                )}
            >
                {/* Header Section */}
                <div className="bg-gradient-to-br from-[#154279] via-[#154279] to-[#0f325e] p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                <MdBusiness size={24} className="text-[#F96302]" />
                             </div>
                             <h2 className="text-lg font-bold uppercase tracking-wide">Bulk Generator</h2>
                        </div>
                        <p className="text-[11px] text-blue-100 font-bold uppercase tracking-widest pl-1">Rapidly create multiple units</p>
                    </div>
                </div>

                <div className="p-6 space-y-5 bg-gradient-to-b from-white to-slate-50">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unit Type</Label>
                        <Input 
                            value={generateConfig.unitTypeName} 
                            onChange={(e) => setGenerateConfig({...generateConfig, unitTypeName: e.target.value})}
                            placeholder="e.g. 1 Bedroom"
                            className="bg-white border-slate-200 focus:border-[#F96302] focus:ring-0 rounded-lg h-10 font-bold text-custom-primary text-sm"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Count</Label>
                            <Input 
                                type="number" 
                                value={generateConfig.count} 
                                onChange={(e) => setGenerateConfig({...generateConfig, count: Number(e.target.value)})}
                                className="bg-white border-slate-200 focus:border-[#154279] rounded-lg"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Floor</Label>
                            <Input 
                                type="number" 
                                value={generateConfig.floorNumber} 
                                onChange={(e) => setGenerateConfig({...generateConfig, floorNumber: Number(e.target.value)})}
                                className="bg-white border-slate-200 focus:border-[#154279] rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Prefix</Label>
                            <Input 
                                value={generateConfig.prefix} 
                                onChange={(e) => setGenerateConfig({...generateConfig, prefix: e.target.value})}
                                placeholder="e.g. A-"
                                className="bg-white border-slate-200 focus:border-[#154279] rounded-lg"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Start #</Label>
                            <Input 
                                type="number" 
                                value={generateConfig.startNumber} 
                                onChange={(e) => setGenerateConfig({...generateConfig, startNumber: Number(e.target.value)})}
                                className="bg-white border-slate-200 focus:border-[#154279] rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Price (KES)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">KES</span>
                            <Input 
                                type="number" 
                                placeholder="0.00"
                                value={generateConfig.price} 
                                onChange={(e) => setGenerateConfig({...generateConfig, price: e.target.value})}
                                className="pl-10 bg-white border-slate-200 focus:border-[#F96302] rounded-lg font-bold text-[#154279]"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Features</Label>
                        <Input 
                            placeholder="Comma separated"
                            value={generateConfig.features} 
                            onChange={(e) => setGenerateConfig({...generateConfig, features: e.target.value})}
                            className="bg-white border-slate-200 focus:border-[#154279] rounded-lg"
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerateUnits}
                        disabled={isGenerating}
                        className="w-full mt-4 bg-[#F96302] hover:bg-[#e05802] text-white px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MdApartment className="w-4 h-4" />}
                        Generate Units
                    </motion.button>
                </div>
            </motion.div>
        </div>
      </div>
      </div>



      {/* Manage Unit Types Dialog */}
      <Dialog open={isManageTypesOpen} onOpenChange={setIsManageTypesOpen}>
        <DialogContent className="max-w-3xl rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-gradient-to-r from-[#154279] to-[#0f325e] px-6 py-4 flex items-center justify-between">
                <div>
                    <DialogTitle className="text-white font-bold text-xl uppercase tracking-wide">Manage Unit Types</DialogTitle>
                    <DialogDescription className="text-blue-200 text-xs font-medium uppercase tracking-widest mt-1">Add, edit or remove unit types</DialogDescription>
                </div>
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <MdBusiness className="w-6 h-6 text-[#F96302]" />
                </div>
            </div>
            
            <div className="p-6 bg-white space-y-6">
                <div className="flex justify-end">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button onClick={() => openTypeDialog()} className="bg-[#F96302] hover:bg-[#e05802] text-white font-bold shadow-lg shadow-orange-500/20 rounded-xl px-6 h-11 text-xs uppercase tracking-widest">
                            <Plus size={16} className="mr-2" />
                            Add New Type
                        </Button>
                    </motion.div>
                </div>
                
                <div className="rounded-xl border-2 border-slate-100 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                                <TableHead className="py-4 font-bold text-[#154279] text-[11px] uppercase tracking-wider">Type Name</TableHead>
                                <TableHead className="py-4 font-bold text-[#154279] text-[11px] uppercase tracking-wider">Price</TableHead>
                                <TableHead className="py-4 text-right font-bold text-[#154279] text-[11px] uppercase tracking-wider">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-50">
                            {unitTypes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-slate-400 py-12 font-medium">
                                        No unit types defined
                                    </TableCell>
                                </TableRow>
                            ) : (
                                unitTypes.map(t => (
                                    <TableRow key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <TableCell className="font-bold text-slate-700">{t.unit_type_name || t.name}</TableCell>
                                        <TableCell className="font-bold text-[#154279] font-mono">KES {Number(t.price_per_unit || 0).toLocaleString()}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => openTypeDialog(t)} className="h-8 w-8 p-0 text-slate-400 hover:text-[#154279] hover:bg-transparent">
                                                <Pencil size={14} />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-transparent" onClick={() => handleDeleteType(t.id!)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Unit Type Dialog */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent className="rounded-2xl border-none shadow-2xl overflow-hidden p-0 max-w-md">
            <div className="bg-[#154279] px-6 py-4">
                <DialogTitle className="text-white font-bold text-lg">{editingType?.id ? 'Edit Unit Type' : 'Add Unit Type'}</DialogTitle>
                <DialogDescription className="text-blue-200 text-xs">Define the details for this unit type.</DialogDescription>
            </div>
            
            <div className="p-6 space-y-5 bg-white">
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Type Name</Label>
                    <Input 
                        value={editingType?.name || ''} 
                        onChange={(e) => setEditingType(prev => ({ ...prev!, name: e.target.value }))}
                        placeholder="e.g. 1 Bedroom Luxury"
                        className="bg-slate-50 border-slate-200 focus:bg-white focus:border-[#F96302] focus:ring-0 rounded-lg h-10 font-bold text-[#154279]"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Price per Unit</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">KES</span>
                        <Input 
                            type="number"
                            value={editingType?.price_per_unit || ''} 
                            onChange={(e) => setEditingType(prev => ({ ...prev!, price_per_unit: Number(e.target.value) }))}
                            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-[#F96302] focus:ring-0 rounded-lg h-10 font-bold text-[#154279]"
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setIsTypeDialogOpen(false)} className="flex-1 rounded-xl h-12 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100">Cancel</Button>
                    <Button onClick={() => handleSaveType(editingType!)} disabled={isSavingType} className="flex-1 bg-[#154279] hover:bg-[#0f325e] text-white font-bold rounded-xl h-12 shadow-lg shadow-blue-900/20">
                        {isSavingType ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Type'}
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
      
      {/* Unit Edit Dialog with Images and Features */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
            <div className="bg-gradient-to-r from-[#154279] to-[#0f325e] text-white p-6 sticky top-0 z-20">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Pencil className="w-5 h-5 text-[#F96302]" />
                    </div>
                    <div>
                        <DialogTitle className="font-bold text-xl">Edit Unit {editingUnit?.unit_number}</DialogTitle>
                        <DialogDescription className="text-blue-200 text-xs font-medium uppercase tracking-widest mt-1">Update unit details and status</DialogDescription>
                    </div>
                </div>
            </div>
            
            <div className="p-8 space-y-6 bg-white">
                {/* Top Grid: Number, Floor, Type */}
                <div className="grid grid-cols-3 gap-6">
                     <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unit Number</Label>
                            <Input 
                                value={editingUnit?.unit_number || ''} 
                                onChange={(e) => setEditingUnit(prev => ({...prev!, unit_number: e.target.value}))} 
                                className="font-black text-[#154279] bg-slate-50 border-slate-200 focus:border-[#154279] rounded-lg h-10"
                            />
                     </div>
                     <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Floor</Label>
                            <Input 
                                type="number" 
                                value={editingUnit?.floor_number ?? ''} 
                                onChange={(e) => setEditingUnit(prev => ({...prev!, floor_number: Number(e.target.value)}))} 
                                className="font-bold bg-slate-50 border-slate-200 focus:border-[#154279] rounded-lg h-10"
                            />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Type Name</Label>
                        <Input 
                            value={editingUnit?.property_unit_types?.name || ''} 
                            onChange={(e) => setEditingUnit(prev => {
                                if (!prev) return null;
                                return {
                                    ...prev, 
                                    property_unit_types: { 
                                        price_per_unit: 0,
                                        ...prev.property_unit_types,
                                        name: e.target.value,
                                    }
                                };
                            })} 
                            placeholder="e.g. 1 Bedroom"
                            list="unit-type-suggestions"
                            className="font-bold bg-slate-50 border-slate-200 focus:border-[#154279] rounded-lg h-10"
                        />
                        <datalist id="unit-type-suggestions">
                            {unitTypes.map(t => (
                                <option key={t.id} value={t.name} />
                            ))}
                        </datalist>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</Label>
                        <Select 
                            value={editingUnit?.status} 
                            onValueChange={(val) => setEditingUnit(prev => ({...prev!, status: val}))}
                        >
                            <SelectTrigger className="font-bold bg-slate-50 border-slate-200 focus:ring-[#154279] rounded-lg h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vacant">Vacant</SelectItem>
                                <SelectItem value="occupied">Occupied</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="booked">Booked</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Price (KES)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">KES</span>
                            <Input 
                                type="number"
                                value={editingUnit?.price ?? ''}
                                onChange={(e) => setEditingUnit(prev => ({...prev!, price: Number(e.target.value)}))}
                                className="pl-10 font-bold bg-slate-50 border-slate-200 focus:border-[#F96302] rounded-lg h-10 text-[#154279]"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Description</Label>
                    <Textarea 
                        value={editingUnit?.description || ''}
                        onChange={(e) => setEditingUnit(prev => ({...prev!, description: e.target.value}))}
                        className="bg-slate-50 border-slate-200 focus:border-[#154279] rounded-lg min-h-[80px]"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Features</Label>
                    <Input 
                        value={editingUnit?.features?.join(', ') || ''}
                        onChange={(e) => {
                             const features = e.target.value.split(',').map(f => f.trim()).filter(Boolean);
                             setEditingUnit(prev => ({...prev!, features}));
                        }}
                        placeholder="Balcony, AC, Wifi"
                        className="bg-slate-50 border-slate-200 focus:border-[#154279] rounded-lg h-10"
                    />
                </div>

                {/* Images Section */}
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Images</Label>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        {editingUnit?.images?.map(img => (
                            <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                                <img src={img.image_url} alt="Unit" className="object-cover w-full h-full" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full">
                                        <X size={14} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-[#F96302] transition-all relative group">
                           <div className="text-center group-hover:-translate-y-1 transition-transform">
                               <div className="w-12 h-12 rounded-full bg-blue-50 text-[#154279] flex items-center justify-center mx-auto mb-3 group-hover:bg-[#154279] group-hover:text-white transition-colors">
                                   <Upload className="w-5 h-5" />
                               </div>
                               <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 uppercase tracking-wide">Upload Images</span>
                           </div>
                           <Input 
                               type="file" 
                               className="absolute inset-0 opacity-0 cursor-pointer" 
                               multiple 
                               accept="image/*"
                               onChange={handleImageUpload} 
                           />
                    </div>
                </div>

            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-20">
                <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="font-bold text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl h-11 px-6">Cancel</Button>
                <Button onClick={handleUpdateUnit} className="bg-[#154279] hover:bg-[#0f325e] text-white font-bold shadow-lg shadow-blue-900/20 rounded-xl h-11 px-8 uppercase tracking-widest text-xs">
                    Save Changes
                </Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
};


