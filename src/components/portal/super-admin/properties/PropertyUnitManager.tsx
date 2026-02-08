import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Property, PropertyUnitType } from "@/services/propertyService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Trash2, LayoutGrid, ArrowLeft, Pencil, Plus, Upload, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Unit Management</h2>
            <p className="text-muted-foreground">
                Manage units for {property.name}
            </p>
        </div>
        <div className="ml-auto">
            <Button variant="outline" onClick={() => setIsManageTypesOpen(true)}>
                Manage Unit Types
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Bulk Generate Units</CardTitle>
            <CardDescription>Rapidly create multiple units based on a pattern</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                    <Label>Unit Type Name (e.g. 1 Bedroom)</Label>
                    <Input 
                        value={generateConfig.unitTypeName} 
                        onChange={(e) => setGenerateConfig({...generateConfig, unitTypeName: e.target.value})}
                        placeholder="Type Name"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Floor Number</Label>
                    <Input 
                        type="number" 
                        value={generateConfig.floorNumber} 
                        onChange={(e) => setGenerateConfig({...generateConfig, floorNumber: Number(e.target.value)})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Count</Label>
                    <Input 
                        type="number" 
                        value={generateConfig.count} 
                        onChange={(e) => setGenerateConfig({...generateConfig, count: Number(e.target.value)})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Prefix (e.g. "A-")</Label>
                    <Input 
                        value={generateConfig.prefix} 
                        onChange={(e) => setGenerateConfig({...generateConfig, prefix: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Start Number</Label>
                    <Input 
                        type="number" 
                        value={generateConfig.startNumber} 
                        onChange={(e) => setGenerateConfig({...generateConfig, startNumber: Number(e.target.value)})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Price (KES)</Label>
                    <Input 
                        type="number" 
                        placeholder="Price in KES"
                        value={generateConfig.price} 
                        onChange={(e) => setGenerateConfig({...generateConfig, price: e.target.value})}
                    />
                </div>
                <div className="space-y-2 md:col-span-3">
                    <Label>Features (comma separated)</Label>
                    <Input 
                        placeholder="Balcony, Ocean View, AC"
                        value={generateConfig.features} 
                        onChange={(e) => setGenerateConfig({...generateConfig, features: e.target.value})}
                    />
                </div>
                <div className="space-y-2 md:col-span-3">
                    <Label>Description</Label>
                    <Textarea 
                        placeholder="Unit description..."
                        value={generateConfig.description} 
                        onChange={(e) => setGenerateConfig({...generateConfig, description: e.target.value})}
                    />
                </div>
            </div>
            <Button onClick={handleGenerateUnits} disabled={isGenerating}>
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate Units
            </Button>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>Units List ({units.length})</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="rounded-md border">
                 <Table>
                     <TableHeader>
                         <TableRow>
                             <TableHead>Unit #</TableHead>
                             <TableHead>Type</TableHead>
                             <TableHead>Floor</TableHead>
                             <TableHead>Price</TableHead>
                             <TableHead>Status</TableHead>
                             <TableHead className="text-right">Actions</TableHead>
                         </TableRow>
                     </TableHeader>
                     <TableBody>
                         {loading ? (
                             <TableRow>
                                 <TableCell colSpan={6} className="text-center py-8">
                                     <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                                 </TableCell>
                             </TableRow>
                         ) : units.length === 0 ? (
                             <TableRow>
                                 <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                     No units found. Generate some above.
                                 </TableCell>
                             </TableRow>
                         ) : (
                             units.map((unit) => (
                                 <TableRow key={unit.id}>
                                     <TableCell className="font-medium">{unit.unit_number}</TableCell>
                                     <TableCell>
                                         <Badge variant="outline" className="flex items-center w-fit gap-1">
                                             <LayoutGrid className="w-3 h-3" />
                                             {unit.property_unit_types?.name || 'Unknown'}
                                         </Badge>
                                     </TableCell>
                                     <TableCell>{unit.floor_number}</TableCell>
                                     <TableCell>
                                         KES {unit.price?.toLocaleString() || 0}
                                     </TableCell>
                                     <TableCell>
                                         <Badge 
                                            variant="outline" 
                                            className={
                                                unit.status === 'occupied' ? 'bg-green-100 text-green-800 border-green-200' :
                                                unit.status === 'booked' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                                unit.status === 'maintenance' ? 'bg-red-100 text-red-800 border-red-200' :
                                                'bg-yellow-100 text-yellow-800 border-yellow-200' // Vacant/Available
                                            }
                                         >
                                             {unit.status === 'available' ? 'vacant' : unit.status}
                                         </Badge>
                                     </TableCell>
                                     <TableCell className="text-right">
                                         <div className="flex justify-end gap-1">
                                         <Button 
                                             variant="ghost" 
                                             size="icon" 
                                             onClick={() => openEditDialog(unit)}
                                             className="text-blue-500 hover:bg-blue-50"
                                         >
                                             <Pencil className="w-4 h-4" />
                                         </Button>
                                         <Button 
                                             variant="ghost" 
                                             size="icon" 
                                             onClick={() => handleDeleteUnit(unit.id)}
                                             className="text-red-500 hover:bg-red-50"
                                         >
                                             <Trash2 className="w-4 h-4" />
                                         </Button>
                                         </div>
                                     </TableCell>
                                 </TableRow>
                             ))
                         )}
                     </TableBody>
                 </Table>
             </div>
          </CardContent>
      </Card>



      {/* Manage Unit Types Dialog */}
      <Dialog open={isManageTypesOpen} onOpenChange={setIsManageTypesOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Manage Unit Types</DialogTitle>
                <DialogDescription>Add, edit or remove unit types.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div className="flex justify-end">
                    <Button onClick={() => openTypeDialog()}>
                        <Plus size={16} className="mr-2" />
                        Add New Type
                    </Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {unitTypes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                    No unit types defined
                                </TableCell>
                            </TableRow>
                        ) : (
                            unitTypes.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>{t.unit_type_name || t.name}</TableCell>
                                    <TableCell>${t.price_per_unit}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="sm" onClick={() => openTypeDialog(t)}>
                                            <Pencil size={14} />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteType(t.id!)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Unit Type Dialog */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingType?.id ? 'Edit Unit Type' : 'Add Unit Type'}</DialogTitle>
                <DialogDescription>Define the details for this unit type.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="grid gap-2">
                    <Label>Type Name</Label>
                    <Input 
                        value={editingType?.name || ''} 
                        onChange={(e) => setEditingType(prev => ({ ...prev!, name: e.target.value }))}
                        placeholder="e.g. 1 Bedroom Luxury"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Price per Unit</Label>
                    <Input 
                        type="number"
                        value={editingType?.price_per_unit || ''} 
                        onChange={(e) => setEditingType(prev => ({ ...prev!, price_per_unit: Number(e.target.value) }))}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsTypeDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => handleSaveType(editingType!)} disabled={isSavingType}>
                    {isSavingType ? 'Saving...' : 'Save'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Unit Edit Dialog with Images and Features */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Edit Unit {editingUnit?.unit_number}</DialogTitle>
                <DialogDescription>Use this form to update unit details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                {/* Top Grid: Number, Floor, Type */}
                <div className="grid grid-cols-3 gap-4">
                     <div className="space-y-2">
                            <Label>Unit Number</Label>
                            <Input 
                                value={editingUnit?.unit_number || ''} 
                                onChange={(e) => setEditingUnit(prev => ({...prev!, unit_number: e.target.value}))} 
                            />
                     </div>
                     <div className="space-y-2">
                            <Label>Floor</Label>
                            <Input 
                                type="number" 
                                value={editingUnit?.floor_number ?? ''} 
                                onChange={(e) => setEditingUnit(prev => ({...prev!, floor_number: Number(e.target.value)}))} 
                            />
                     </div>
                     <div className="space-y-2">
                        <Label>Type Name</Label>
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
                        />
                        <datalist id="unit-type-suggestions">
                            {unitTypes.map(t => (
                                <option key={t.id} value={t.name} />
                            ))}
                        </datalist>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                            value={editingUnit?.status} 
                            onValueChange={(val) => setEditingUnit(prev => ({...prev!, status: val}))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vacant">Vacant</SelectItem>
                                <SelectItem value="occupied">Occupied</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="booked">Booked</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Price (KES)</Label>
                        <Input 
                            type="number"
                            value={editingUnit?.price ?? ''}
                            onChange={(e) => setEditingUnit(prev => ({...prev!, price: Number(e.target.value)}))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                        value={editingUnit?.description || ''}
                        onChange={(e) => setEditingUnit(prev => ({...prev!, description: e.target.value}))}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Features (comma separated)</Label>
                    <Input 
                        value={editingUnit?.features?.join(', ') || ''}
                        onChange={(e) => {
                             const features = e.target.value.split(',').map(f => f.trim()).filter(Boolean);
                             setEditingUnit(prev => ({...prev!, features}));
                        }}
                        placeholder="Balcony, AC, Wifi"
                    />
                </div>

                {/* Images Section */}
                <div className="space-y-2">
                    <Label>Images</Label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                        {editingUnit?.images?.map(img => (
                            <div key={img.id} className="relative aspect-square rounded overflow-hidden border">
                                <img src={img.image_url} alt="Unit" className="object-cover w-full h-full" />
                            </div>
                        ))}
                    </div>
                    <div className="border dashed border-slate-300 rounded flex items-center justify-center p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 relative">
                           <div className="text-center">
                               <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                               <span className="text-sm text-slate-500">Click to upload images</span>
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
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateUnit}>
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


