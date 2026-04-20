import React, { useState, useEffect } from "react";
import { read, utils } from "xlsx";
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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
    
        body { font-family: 'Poppins', sans-serif; }
        .font-poppins { font-family: 'Poppins', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Poppins', sans-serif; }
    
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

const PANEL_HEADER_CLASS =
    "flex items-center justify-between bg-[#154279] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white";

const INPUT_CLASS_NAME =
    "h-9 rounded-none border border-[#b9c3cf] bg-white px-3 text-[12px] text-[#243041] focus-visible:ring-0";

interface PropertyUnitManagerProps {
  property: Property;
  onBack: () => void;
}

interface Unit {
  id: string;
  unit_number: string;
  floor_number: string | number;
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

    const getEffectiveUnitPrice = (unit: Unit) => {
        if (unit.price !== null && unit.price !== undefined) {
            const directPrice = Number(unit.price);
            if (!Number.isNaN(directPrice)) {
                return directPrice;
            }
        }

        if (unit.property_unit_types?.price_per_unit !== null && unit.property_unit_types?.price_per_unit !== undefined) {
            const joinedTypePrice = Number(unit.property_unit_types.price_per_unit);
            if (!Number.isNaN(joinedTypePrice)) {
                return joinedTypePrice;
            }
        }

        const localTypePrice = Number(
            unitTypes.find((type) => type.id === unit.unit_type_id)?.price_per_unit ?? 0
        );
        return Number.isNaN(localTypePrice) ? 0 : localTypePrice;
    };
  
  // Edit State
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  
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
  // Excel Import State
  const [isImporting, setIsImporting] = useState(false);

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
      const parsed = data || [];
        parsed.sort((a: any, b: any) => {
          const aFloor = String(a.floor_number || 'G');
          const bFloor = String(b.floor_number || 'G');
          const floorOrder: { [key: string]: number } = { 'B5': -5, 'B4': -4, 'B3': -3, 'B2': -2, 'B1': -1, 'B': -1, 'G': 0, 'M': 0.5 };
          const aFloorNum = floorOrder[aFloor] ?? parseInt(aFloor) ?? 0;
          const bFloorNum = floorOrder[bFloor] ?? parseInt(bFloor) ?? 0;
          if (aFloorNum !== bFloorNum) return aFloorNum - bFloorNum;
          return String(a.unit_number || '').localeCompare(String(b.unit_number || ''), undefined, { numeric: true, sensitivity: 'base' });
        });
        setUnits(parsed);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        toast.error("Excel sheet is empty");
        return;
      }

      // Fetch existing units to determine update vs insert
      const { data: existingUnits, error: fetchError } = await supabase
        .from('units')
        .select('id, unit_number')
        .eq('property_id', property.id);

      if (fetchError) {
        console.error("Error fetching existing units:", fetchError);
        toast.error("Failed to fetch existing units");
        return;
      }
      
      const existingUnitsMap = new Map(existingUnits?.map(u => [u.unit_number.toString().toLowerCase(), u.id]));

      let importedCount = 0;
      let updatedCount = 0;
      
      // Refresh types to ensure we have latest
      const { data: currentTypes } = await supabase
        .from('property_unit_types')
        .select('*')
        .eq('property_id', property.id);
      
      const localTypes = currentTypes ? [...currentTypes] : [];

      for (const row of jsonData) {
        // Normalize keys to lowercase to handle variations
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
            normalizedRow[key.toString().toLowerCase().trim()] = row[key];
        });

        // Expected columns: Unit Number, Floor, Type, Rent (optional)
        // Check various likely column names
        const unitNumber = normalizedRow['unit number'] || normalizedRow['unit_number'] || normalizedRow['unit'] || normalizedRow['unit #'] || normalizedRow['unit#'];
        const floorNumber = normalizedRow['floor'] || normalizedRow['floor_number'] || normalizedRow['floor number'] || 1;
        const typeName = normalizedRow['type'] || normalizedRow['unit type'] || normalizedRow['unit_type'] || 'Standard';
        const rent = normalizedRow['rent'] || normalizedRow['rent (kes)'] || normalizedRow['price'] || normalizedRow['price (kes)'] || normalizedRow['amount'] || null;
        
        // Handle "status" or "availability"
        let status = (normalizedRow['status'] || normalizedRow['availability'] || 'vacant').toString().toLowerCase().trim();
        const validStatuses = ['vacant', 'occupied', 'booked', 'maintenance'];
        if (!validStatuses.includes(status)) status = 'vacant'; // Default fallback
        
        const description = normalizedRow['description'] || normalizedRow['details'] || null;
        const featuresRaw = normalizedRow['features'] || normalizedRow['amenities'];
        const features = featuresRaw ? (String(featuresRaw)).split(',').map((f: string) => f.trim()) : [];

        if (!unitNumber) {
            console.log("Skipping row without unit number:", row);
            continue;
        }

        const unitNumberStr = String(unitNumber).trim();

        // Find or create Unit Type
        let typeId = "";
        const existingType = localTypes.find(t => t.name.toLowerCase() === String(typeName).trim().toLowerCase());
        
        if (existingType) {
          typeId = existingType.id!;
        } else {
            console.log("Creating new type:", typeName);
            const { data: newType, error: typeError } = await supabase
              .from('property_unit_types')
              .insert({
                property_id: property.id,
                name: String(typeName).trim(),
                                price_per_unit: rent ? Number(rent) : 0
              })
              .select()
              .single();
            
            if (typeError) {
                console.error("Error creating type", typeError);
                continue; 
            }
            typeId = newType.id;
            localTypes.push(newType); 
        }

        const unitData = {
            property_id: property.id,
            unit_number: unitNumberStr,
            floor_number: Number(floorNumber),
            unit_type_id: typeId,
            price: rent ? Number(rent) : null,
            status: status,
            description: description,
            features: features
        };

        const existingUnitId = existingUnitsMap.get(unitNumberStr.toLowerCase());

        if (existingUnitId) {
            // Update existing unit
            const { error: updateError } = await supabase
                .from('units')
                .update(unitData)
                .eq('id', existingUnitId);
            
            if (updateError) {
                console.error(`Error updating unit ${unitNumberStr}`, updateError);
            } else {
                updatedCount++;
            }
        } else {
            // Insert new unit
            const { error: insertError } = await supabase
                .from('units')
                .insert(unitData);

            if (insertError) {
                console.error(`Error inserting unit ${unitNumberStr}`, insertError);
            } else {
                importedCount++;
            }
        }
      }

      toast.success(`Processed units: ${importedCount} created, ${updatedCount} updated`);
      
      if (importedCount === 0 && updatedCount === 0) {
          toast.warning("No units were processed. Please check your Excel column headers. Expected: 'Unit Number', 'Floor', 'Type', 'Rent'.", { duration: 6000 });
          console.warn("First row keys found:", Object.keys(jsonData[0] || {}));
      }

      fetchUnits();
      fetchUnitTypes();

    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to process Excel file. Please ensure it is a valid .xlsx file.");
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleDeleteUnit = async (id: string, unitNumber: string) => {
    if(!confirm(`Are you sure you want to permanently delete Unit ${unitNumber}?`)) return;
    
    const { error } = await supabase.from('units').delete().eq('id', id);
    
    if (error) {
        console.error("Delete error details:", error);
        
        // Handle Foreign Key Violations (23503) or generic constraint errors trying to delete referenced Data
        // 400 Bad Request often indicates a trigger or RLS failure, but can also cover complex constraints in some Supabase configs
        if (error.code === '23503' || error.message?.includes('foreign key') || error.code === '409') {
             toast.error(`Cannot delete Unit ${unitNumber}: It is linked to existing Leases, Tenants, or Payments.`, {
                 duration: 6000,
                 description: "You must delete the lease or tenant first, OR run the 'FIX_UNIT_DELETION.sql' database script to allow safe deletion."
             });
        } else if (JSON.stringify(error).includes('violates foreign key constraint')) {
             toast.error(`Cannot delete Unit ${unitNumber}. Linked data found.`, {
                 description: "Check for active leases or maintenance requests linked to this unit."
             });
        } else {
             // Fallback for generic 400s
             toast.error(`Failed to delete Unit ${unitNumber}`, {
                 description: error.message || "Database restriction. Run database/FIX_UNIT_DELETION.sql to fix constraints."
             });
        }
    } else {
        toast.success(`Unit ${unitNumber} deleted successfully`);
        setUnits(units.filter(u => u.id !== id));
    }
  };

  const handleSaveUnit = async () => {
    if (!editingUnit) return;
    try {
        let typeId = editingUnit.unit_type_id;
        const typeName = editingUnit.property_unit_types?.name;

        // If a type name is provided but no ID, or if we want to ensure the type exists
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
        } else if (!typeId && unitTypes.length > 0) {
            // Fallback: use first available type if none selected
             typeId = unitTypes[0].id!;
        }

        const unitData = {
            property_id: property.id,
            unit_number: editingUnit.unit_number,
            floor_number: editingUnit.floor_number,
            unit_type_id: typeId,
            price: editingUnit.price,
            status: editingUnit.status,
            description: editingUnit.description,
            features: editingUnit.features
        };

        if (editingUnit.id) {
            // Update
            const { error } = await supabase.from('units').update(unitData).eq('id', editingUnit.id);
            if (error) throw error;
            toast.success("Unit updated");
        } else {
            // Create
            const { error } = await supabase.from('units').insert(unitData);
            if (error) throw error;
            toast.success("Unit created");
        }

        setIsEditOpen(false);
        fetchUnits();
    } catch(e) {
        console.error(e);
        toast.error("Failed to save unit");
    }
  };

  const handleAddUnit = () => {
     setEditingUnit({
         id: '',
         unit_number: '',
         floor_number: '1',
         unit_type_id: '',
         price: 0,
         status: 'available',
         description: '',
         features: [],
         property_unit_types: { name: '', price_per_unit: 0 }
     });
     setIsEditOpen(true);
  };

  // Unit Type CRUD
    const handleSaveType = async (type: Partial<PropertyUnitType>) => {
        const normalizedPrice = Number(type.price_per_unit);
        if (!type.name || type.price_per_unit === null || type.price_per_unit === undefined || Number.isNaN(normalizedPrice)) {
                toast.error("Name and Price are required");
                return;
        }

        if (normalizedPrice < 0) {
                toast.error("Price must be zero or more");
                return;
        }
    
    setIsSavingType(true);
    try {
        if (type.id) {
            // Update
            const { error } = await supabase.from('property_unit_types').update({
                name: type.name,
                price_per_unit: normalizedPrice
            }).eq('id', type.id);
            if (error) throw error;
            toast.success("Unit Type updated");
        } else {
            // Create
            const { error } = await supabase.from('property_unit_types').insert({
                property_id: property.id,
                name: type.name,
                price_per_unit: normalizedPrice
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

  const openEditDialog = async (unit: Unit) => {
    setIsEditLoading(true);
    setIsEditOpen(true);
    try {
      // Fetch the full unit details from the database including images
      const { data, error } = await supabase
        .from('units')
        .select(`
          *,
          property_unit_types (
            id,
            name,
            price_per_unit,
            description,
            features
          ),
          unit_images (
            id,
            image_url
          )
        `)
        .eq('id', unit.id)
        .single();

      if (error) {
        console.error("Error fetching unit details:", error);
        toast.error("Failed to load unit details");
        // Fallback to existing unit data
        setEditingUnit({...unit});
      } else if (data) {
        setEditingUnit(data as Unit);
      }
    } catch (err) {
      console.error("Error in openEditDialog:", err);
      toast.error("Failed to load unit details");
      setEditingUnit({...unit});
    } finally {
      setIsEditLoading(false);
    }
  };

  return (
    <>
    <GlobalStyles />
        <div className="min-h-screen bg-[#d7dce1] pb-10 font-poppins text-[#243041]">
      
      {/* Hero Section */}
            <section className="relative mb-3 overflow-hidden border border-[#bcc3cd] bg-[#eef1f4]">
        <HeroBackground />
                <div className="absolute inset-0 bg-gradient-to-r from-[#eef1f4]/95 to-[#e4e9ef]/95" />
        
                <div className="relative z-10 flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 md:mx-auto md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-6">
             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="outline" size="icon" onClick={onBack} className="h-9 w-9 rounded-none border border-[#b6bec8] bg-white text-[#465870] hover:bg-[#f5f7fa]">
                                        <ArrowLeft className="h-4 w-4" />
                </Button>
             </motion.div>
             
             <div>
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 mb-2"
                >
                          <div className="h-[2px] w-8 bg-[#154279]"></div>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#154279]">{property.type || 'Property'} Management</span>
                </motion.div>
                
                     <h1 className="mb-1 text-3xl font-bold leading-tight tracking-tight text-[#1f2937] md:text-4xl">
                     {property.name} <span className="text-[#154279]">Units</span>
                </h1>
                
                     <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide text-[#5f6b7c]">
                         <Building className="h-4 w-4 text-[#154279]" />
                   {property.location}
                </p>
             </div>
          </div>
              
          <div className="flex items-center gap-3">
             <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsManageTypesOpen(true)}
                     className="flex h-9 items-center gap-2 border border-[#154279] bg-[#154279] px-4 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#10335f]"
             >
                <Settings2 className="w-4 h-4" />
                Manage Types
             </motion.button>
          </div>
        </div>
      </section>

        <div className="mx-auto max-w-[1500px] space-y-3 px-4 lg:px-6">

      {/* Summary Section - Product Card Style */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <motion.div 
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden border border-[#bcc3cd] bg-[#eef1f4] p-4 shadow-none transition-all duration-300"
        >
            <div className="absolute -mr-8 -mt-8 h-32 w-32 rounded-bl-full bg-[#edf2f8] pointer-events-none top-0 right-0" />
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-3">
                <div className="mb-2 rounded-none bg-[#eef2f7] p-3 transition-colors group-hover:bg-[#e4ebf4]">
                    <MdApartment size={28} className="text-[#154279]" />
                </div>
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Total Units</h3>
                <div className="text-3xl font-bold text-[#1f2937]">{units.length}</div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Active Inventory</p>
            </div>
        </motion.div>

        <motion.div 
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden border border-[#bcc3cd] bg-[#eef1f4] p-4 shadow-none transition-all duration-300"
        >
             <div className="absolute -mr-8 -mt-8 h-32 w-32 rounded-bl-full bg-emerald-50 pointer-events-none top-0 right-0" />
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-3">
                 <div className="mb-2 rounded-none bg-emerald-50 p-3 transition-colors group-hover:bg-emerald-100">
                    <CheckCircle size={28} className="text-emerald-700" />
                </div>
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Occupancy</h3>
                <div className="text-3xl font-bold text-[#1f2937]">
                    {units.length > 0 ? Math.round((units.filter(u => u.status === 'occupied').length / units.length) * 100) : 0}%
                </div>
                <div className="h-2 w-full max-w-[120px] overflow-hidden rounded-none bg-emerald-100">
                    <div className="h-full bg-emerald-600" style={{ width: `${units.length > 0 ? (units.filter(u => u.status === 'occupied').length / units.length) * 100 : 0}%` }} />
                </div>
            </div>
        </motion.div>

        <motion.div 
             whileHover={{ y: -5 }}
               className="group relative overflow-hidden border border-[#bcc3cd] bg-[#eef1f4] p-4 shadow-none transition-all duration-300"
        >
            <div className="absolute -mr-8 -mt-8 h-32 w-32 rounded-bl-full bg-orange-50 pointer-events-none top-0 right-0" />
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-3">
                 <div className="mb-2 rounded-none bg-orange-50 p-3 transition-colors group-hover:bg-orange-100">
                    <MdStorefront size={28} className="text-orange-700" />
                </div>
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Revenue Potential</h3>
                <div className="flex items-baseline text-2xl font-bold text-[#1f2937]">
                    <span className="mr-1 text-[11px] font-semibold text-[#7b8895]">KES</span>
                    {units.reduce((sum, unit) => sum + getEffectiveUnitPrice(unit), 0).toLocaleString()}
                </div>
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">
                    <Zap size={10} /> Monthly Projected
                </p>
            </div>
        </motion.div>
      </motion.div>

    <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        
        {/* LEFT COLUMN: UNITS LIST - Styled as ComparisonMatrix */}
        <div className="space-y-3 xl:col-span-8">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="overflow-hidden border border-[#bcc3cd] bg-[#eef1f4] shadow-sm"
            >
                <div className={PANEL_HEADER_CLASS}>Unit Directory</div>
                <div className="flex flex-col gap-2 bg-[#eef1f4] p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                         <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#5b6778]">
                            <MdKingBed className="h-4 w-4 text-[#154279]" /> Manage individual units
                        </h2>
                    </div>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Search..." 
                            className={`${INPUT_CLASS_NAME} w-40 pl-9 md:w-60`}
                        />
                    </div>
                    <Button onClick={handleAddUnit} className="ml-0 h-9 rounded-none border border-[#154279] bg-[#154279] text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#10335f] md:ml-2">
                        <Plus className="w-4 h-4 mr-2" /> Add Unit
                    </Button>
                </div>
                
                <div className="overflow-x-auto border-t border-[#c7cdd6] bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-[#f6f8fa] border-b border-[#d5dbe4]">
                                <TableHead className="py-3 text-[#5b6778] font-semibold text-[10px] uppercase tracking-[0.16em]">Unit #</TableHead>
                                <TableHead className="py-3 text-[#5b6778] font-semibold text-[10px] uppercase tracking-[0.16em]">Type</TableHead>
                                <TableHead className="py-3 text-[#5b6778] font-semibold text-[10px] uppercase tracking-[0.16em] text-center">Floor</TableHead>
                                <TableHead className="py-3 text-[#5b6778] font-semibold text-[10px] uppercase tracking-[0.16em] text-right">Price</TableHead>
                                <TableHead className="py-3 text-[#5b6778] font-semibold text-[10px] uppercase tracking-[0.16em] text-center">Status</TableHead>
                                <TableHead className="py-3 text-[#5b6778] font-semibold text-[10px] uppercase tracking-[0.16em] text-right">Actions</TableHead>
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
                                        className="hover:bg-[#f8fafc] transition-colors group"
                                    >
                                        <TableCell className="font-semibold text-[#243041] border-l-4 border-transparent group-hover:border-[#154279] transition-all">
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
                                            <div className="font-semibold text-[#243041] text-[12px]">KES {getEffectiveUnitPrice(unit).toLocaleString()}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border",
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
                                            <div className="flex justify-end gap-1 opacity-100 transition-opacity">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => openEditDialog(unit)}
                                                className="h-7 w-7 p-0 rounded-none border border-[#c2c9d2] text-[#4e5a6d] hover:bg-[#f5f7fa]"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleDeleteUnit(unit.id, unit.unit_number)}
                                                className="h-7 w-7 p-0 rounded-none border border-[#c2c9d2] text-[#7a3131] hover:bg-[#fff1f1]"
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
        <div className="space-y-3 xl:col-span-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={cn(
                    "relative border border-[#bcc3cd] transition-all duration-300 overflow-hidden bg-[#eef1f4]",
                    "shadow-sm"
                )}
            >
                {/* Header Section */}
                <div className={PANEL_HEADER_CLASS}>Bulk Generator</div>

                <div className="p-4 space-y-3 bg-[#eef1f4]">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unit Type</Label>
                        <Input 
                            value={generateConfig.unitTypeName} 
                            onChange={(e) => setGenerateConfig({...generateConfig, unitTypeName: e.target.value})}
                            placeholder="e.g. 1 Bedroom"
                            className={INPUT_CLASS_NAME}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Count</Label>
                            <Input 
                                type="number" 
                                value={generateConfig.count} 
                                onChange={(e) => setGenerateConfig({...generateConfig, count: Number(e.target.value)})}
                                className={INPUT_CLASS_NAME}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Floor</Label>
                            <Input 
                                type="number" 
                                value={generateConfig.floorNumber} 
                                onChange={(e) => setGenerateConfig({...generateConfig, floorNumber: Number(e.target.value)})}
                                className={INPUT_CLASS_NAME}
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
                                className={INPUT_CLASS_NAME}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Start #</Label>
                            <Input 
                                type="number" 
                                value={generateConfig.startNumber} 
                                onChange={(e) => setGenerateConfig({...generateConfig, startNumber: Number(e.target.value)})}
                                className={INPUT_CLASS_NAME}
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
                                className={`${INPUT_CLASS_NAME} pl-10`}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Features</Label>
                        <Input 
                            placeholder="Comma separated"
                            value={generateConfig.features} 
                            onChange={(e) => setGenerateConfig({...generateConfig, features: e.target.value})}
                            className={INPUT_CLASS_NAME}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerateUnits}
                        disabled={isGenerating}
                        className="mt-2 flex h-10 w-full items-center justify-center gap-2 border border-[#154279] bg-[#154279] px-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#10335f]"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MdApartment className="w-4 h-4" />}
                        Generate Units
                    </motion.button>
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={cn(
                    "relative border border-[#bcc3cd] transition-all duration-300 overflow-hidden bg-[#eef1f4]",
                    "shadow-sm"
                )}
            >
                 <div className={PANEL_HEADER_CLASS}>Import Details</div>

                 <div className="p-4 space-y-3 bg-[#eef1f4]">
                    <div className="text-xs text-slate-500 mb-4">
                        Upload an Excel file (.xlsx, .xls) with columns: <br/>
                        <span className="font-mono bg-slate-100 px-1 rounded">Unit Number, Floor, Type, Rent, Status, Description, Features</span>
                    </div>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            disabled={isImporting}
                            className="hidden"
                            id="excel-upload"
                        />
                        <label 
                            htmlFor="excel-upload"
                            className={cn(
                                "w-full cursor-pointer flex flex-col items-center justify-center border border-dashed p-6 transition-all bg-white",
                                "border-[#b9c3cf] hover:border-[#8ea1b8] hover:bg-[#f7f9fc]",
                                isImporting ? "opacity-50 pointer-events-none" : ""
                            )}
                        >
                             {isImporting ? (
                                <>
                                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Importing...</span>
                                </>
                             ) : (
                                <>
                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full mb-3">
                                        <Upload size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Click to Upload</span>
                                    <span className="text-[10px] text-slate-400 mt-1">Metrics & Details</span>
                                </>
                             )}
                        </label>
                    </div>
                </div>
            </motion.div>
        </div>
      </div>
      </div>



      {/* Manage Unit Types Dialog */}
      <Dialog open={isManageTypesOpen} onOpenChange={setIsManageTypesOpen}>
        <DialogContent className="max-w-3xl overflow-hidden border border-[#bcc3cd] p-0 font-poppins">
            <div className={PANEL_HEADER_CLASS}>
                <div>
                    <DialogTitle className="text-white font-semibold text-[11px] uppercase tracking-[0.16em]">Manage Unit Types</DialogTitle>
                    <DialogDescription className="text-blue-100 text-[10px] font-medium uppercase tracking-wide mt-1">Add, edit or remove unit types</DialogDescription>
                </div>
                <div className="p-1 bg-white/10">
                    <MdBusiness className="w-6 h-6 text-[#F96302]" />
                </div>
            </div>
            
            <div className="p-4 bg-[#eef1f4] space-y-4">
                <div className="flex justify-end">
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button onClick={() => openTypeDialog()} className="h-9 rounded-none border border-[#154279] bg-[#154279] px-4 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#10335f]">
                            <Plus size={16} className="mr-2" />
                            Add New Type
                        </Button>
                    </motion.div>
                </div>
                
                <div className="overflow-hidden border border-[#c7cdd6] bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-[#f6f8fa] border-b border-[#d5dbe4]">
                                <TableHead className="py-3 font-semibold text-[#5b6778] text-[10px] uppercase tracking-[0.16em]">Type Name</TableHead>
                                <TableHead className="py-3 font-semibold text-[#5b6778] text-[10px] uppercase tracking-[0.16em]">Price</TableHead>
                                <TableHead className="py-3 text-right font-semibold text-[#5b6778] text-[10px] uppercase tracking-[0.16em]">Actions</TableHead>
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
                                    <TableRow key={t.id} className="hover:bg-[#f8fafc] transition-colors group">
                                        <TableCell className="font-bold text-slate-700">{t.unit_type_name || t.name}</TableCell>
                                        <TableCell className="font-bold text-[#154279] font-mono">KES {Number(t.price_per_unit || 0).toLocaleString()}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => openTypeDialog(t)} className="h-7 w-7 p-0 rounded-none border border-[#c2c9d2] text-[#4e5a6d] hover:bg-[#f5f7fa]">
                                                <Pencil size={14} />
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-none border border-[#c2c9d2] text-[#7a3131] hover:bg-[#fff1f1]" onClick={() => handleDeleteType(t.id!)}>
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
        <DialogContent className="max-w-md overflow-hidden border border-[#bcc3cd] p-0 font-poppins">
            <div className={PANEL_HEADER_CLASS}>
                <DialogTitle className="text-white font-bold text-lg">{editingType?.id ? 'Edit Unit Type' : 'Add Unit Type'}</DialogTitle>
                <DialogDescription className="text-blue-200 text-xs">Define the details for this unit type.</DialogDescription>
            </div>
            
            <div className="p-4 space-y-4 bg-[#eef1f4]">
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Type Name</Label>
                    <Input 
                        value={editingType?.name || ''} 
                        onChange={(e) => setEditingType(prev => ({ ...prev!, name: e.target.value }))}
                        placeholder="e.g. 1 Bedroom Luxury"
                        className={INPUT_CLASS_NAME}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Price per Unit</Label>
                    <Input 
                        type="number"
                        value={editingType?.price_per_unit || ''} 
                        onChange={(e) => setEditingType(prev => ({ ...prev!, price_per_unit: Number(e.target.value) }))}
                        className={INPUT_CLASS_NAME}
                    />
                </div>
                
                <div className="flex items-center gap-3 pt-2">
                    <Button variant="outline" onClick={() => setIsTypeDialogOpen(false)} className="flex-1 h-9 rounded-none border border-[#b9c3cf] bg-white text-[11px] font-semibold uppercase tracking-wide text-[#4f5b6f] hover:bg-[#f6f8fa]">Cancel</Button>
                    <Button onClick={() => handleSaveType(editingType!)} disabled={isSavingType} className="flex-1 h-9 rounded-none border border-[#154279] bg-[#154279] text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#10335f]">
                        {isSavingType ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Type'}
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
      
      {/* Unit Edit Dialog with Images and Features */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border border-[#bcc3cd] p-0 font-poppins bg-[#eef1f4]">
            <div className="sticky top-0 z-20 border-b border-[#0f325e]">
                <div className={PANEL_HEADER_CLASS}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-1 bg-white/10">
                        {editingUnit?.id ? <Pencil className="w-5 h-5 text-[#F96302]" /> : <Plus className="w-5 h-5 text-[#F96302]" />}
                    </div>
                    <div>
                        <DialogTitle className="font-semibold text-[11px] uppercase tracking-[0.16em]">{editingUnit?.id ? `Edit Unit ${editingUnit.unit_number}` : 'Add New Unit'}</DialogTitle>
                        <DialogDescription className="text-blue-100 text-[10px] font-medium uppercase tracking-wide mt-1">
                            {editingUnit?.id ? 'Update unit details and status' : 'Enter details for the new unit'}
                        </DialogDescription>
                    </div>
                </div>
                </div>
            </div>
            
            {isEditLoading ? (
                <div className="flex flex-col items-center justify-center p-16 bg-[#eef1f4]">
                    <Loader2 className="w-12 h-12 animate-spin text-[#154279] mb-4" />
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Loading unit details...</p>
                </div>
            ) : (
            <div className="p-4 space-y-4 bg-[#eef1f4]">
                {/* Top Grid: Number, Floor, Type */}
                <div className="grid grid-cols-3 gap-6">
                     <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unit Number</Label>
                            <Input 
                                value={editingUnit?.unit_number || ''} 
                                onChange={(e) => setEditingUnit(prev => ({...prev!, unit_number: e.target.value}))} 
                                className={INPUT_CLASS_NAME}
                            />
                     </div>
                     <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Floor</Label>
                            <Input 
                                type="number" 
                                value={editingUnit?.floor_number ?? ''} 
                                onChange={(e) => setEditingUnit(prev => ({...prev!, floor_number: Number(e.target.value)}))} 
                                className={INPUT_CLASS_NAME}
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
                            className={INPUT_CLASS_NAME}
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
                            <SelectTrigger className={INPUT_CLASS_NAME}>
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
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">KES</span>
                            <Input 
                                type="number"
                                value={editingUnit?.price ?? ''}
                                onChange={(e) => setEditingUnit(prev => ({...prev!, price: Number(e.target.value)}))}
                                className={`${INPUT_CLASS_NAME} pl-10`}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Description</Label>
                    <Textarea 
                        value={editingUnit?.description || ''}
                        onChange={(e) => setEditingUnit(prev => ({...prev!, description: e.target.value}))}
                        className="min-h-[80px] rounded-none border border-[#b9c3cf] bg-white text-[12px] text-[#243041] focus-visible:ring-0"
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
                        className={INPUT_CLASS_NAME}
                    />
                </div>

                {/* Images Section */}
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Images</Label>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        {editingUnit?.images?.map(img => (
                            <div key={img.id} className="relative aspect-square overflow-hidden border border-[#c2c9d2] bg-white group">
                                <img src={img.image_url} alt="Unit" className="object-cover w-full h-full" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="destructive" size="icon" className="h-7 w-7 rounded-none">
                                        <X size={14} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border border-dashed border-[#b9c3cf] flex flex-col items-center justify-center p-8 bg-white cursor-pointer hover:bg-[#f7f9fc] hover:border-[#8ea1b8] transition-all relative group">
                           <div className="text-center group-hover:-translate-y-1 transition-transform">
                               <div className="w-12 h-12 bg-blue-50 text-[#154279] flex items-center justify-center mx-auto mb-3 group-hover:bg-[#154279] group-hover:text-white transition-colors">
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
            )}
            <div className="p-4 border-t border-[#c7cdd6] bg-[#eef1f4] flex justify-end gap-2 sticky bottom-0 z-20">
                <Button variant="outline" onClick={() => setIsEditOpen(false)} className="h-9 rounded-none border border-[#b9c3cf] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#4f5b6f] hover:bg-[#f6f8fa]">Cancel</Button>
                <Button onClick={handleSaveUnit} className="h-9 rounded-none border border-[#154279] bg-[#154279] px-4 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#10335f]">
                    Save Unit
                </Button>
            </div>
        </DialogContent>
      </Dialog>

        </div>
        </>
    );
};

export default PropertyUnitManager;


