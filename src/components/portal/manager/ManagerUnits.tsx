import React, { useState, useEffect } from 'react';
import { Building, Search, Loader2, Plus, X, Check, Users, Camera, Upload, Edit, FileText, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Unit {
  id: string;
  unit_number: string;
  property_id: string;
  unit_type_id: string;
  status: string;
  floor_number?: number;
  description?: string;
  image_url?: string;
  features?: string[];
  price?: number;
  property_unit_types?: {
    id: string;
    name: string;
    price_per_unit: number;
    unit_category: string;
  };
  active_lease?: {
      id: string;
      tenant_id: string;
      tenant_name: string;
  }
}

interface UnitType {
  id: string;
  name: string;
  price_per_unit: number;
  unit_category: string;
}

interface TenantProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

const ManagerUnits = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  // Replaced 'available' with 'vacant' or 'booked' display logic per request
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [tenants, setTenants] = useState<TenantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyId, setPropertyId] = useState<string>('');
  const [propertyName, setPropertyName] = useState<string>('');
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Edit Unit State
  const [isEditUnitOpen, setIsEditUnitOpen] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<Unit | null>(null);
  const [editConfig, setEditConfig] = useState({
      status: '',
      features: '',
      description: '',
      floor_number: '',
      unit_type_id: '',
      price: 0 // Will be read only
  });

const openDetails = (unit: Unit) => {
    setSelectedUnit(unit);
    setEditDescription(unit.description || '');
    setIsEditingDescription(false);
    setIsDetailsOpen(true);
};

// ... existing code ...

const openEditUnit = (unit: Unit) => {
    setUnitToEdit(unit);
    // Determine effective price
    const effectivePrice = unit.price || unit.property_unit_types?.price_per_unit || 0;
    
    setEditConfig({
        status: unit.status || 'vacant',
        features: unit.features ? unit.features.join(', ') : '',
        description: unit.description || '',
        floor_number: unit.floor_number?.toString() || '',
        unit_type_id: unit.unit_type_id || '',
        price: effectivePrice
    });
    setIsEditUnitOpen(true);
};

const handleSaveUnitChanges = async () => {
    if (!unitToEdit) return;
    
    setSavingUnit(true);
    try {
        const floorNum = editConfig.floor_number ? parseInt(editConfig.floor_number) : null;
        
        // Only update allowed fields (status, features, description, floor)
        // Explicitly NOT updating price as requested
        const { error } = await supabase
            .from('units')
            .update({
                status: editConfig.status,
                description: editConfig.description,
                floor_number: floorNum,
                // features is stored as array in DB usually?
                // Assuming text array based on usage elsewhere
                features: editConfig.features.split(',').map(f => f.trim()).filter(Boolean),
                unit_type_id: editConfig.unit_type_id // Allow changing type if needed, but not price directly?
            })
            .eq('id', unitToEdit.id);

        if (error) throw error;
        
        toast.success(`Unit ${unitToEdit.unit_number} updated successfully`);
        setIsEditUnitOpen(false);
        loadUnits();
    } catch (e: any) {
        toast.error("Failed to update unit: " + e.message);
    } finally {
        setSavingUnit(false);
    }
};


const handleUpdateDescription = async () => {
    if (!selectedUnit) return;
    try {
        setSavingUnit(true);
        const { error } = await supabase
            .from('units')
            .update({ description: editDescription })
            .eq('id', selectedUnit.id);

        if (error) throw error;
        
        toast.success("Description updated");
        setIsEditingDescription(false);
        // Update local state
        setUnits(units.map(u => u.id === selectedUnit.id ? { ...u, description: editDescription } : u));
        setSelectedUnit({ ...selectedUnit, description: editDescription });
    } catch (error: any) {
        toast.error("Failed to update description: " + error.message);
    } finally {
        setSavingUnit(false);
    }
};

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedUnit) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedUnit.id}_${Date.now()}.${fileExt}`;
    const filePath = `unit-images/${fileName}`;

    try {
        setUploadingImage(true);
        
        // upload to property_images bucket as unit-images folder or root if specific bucket
        // Assuming 'property_images' bucket exists from context
        const { error: uploadError } = await supabase.storage
            .from('property_images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('property_images')
            .getPublicUrl(filePath);

        // Update unit record
        const { error: updateError } = await supabase
            .from('units')
            .update({ image_url: publicUrl })
            .eq('id', selectedUnit.id);

        if (updateError) throw updateError;

        toast.success("Image uploaded successfully");
        setUnits(units.map(u => u.id === selectedUnit.id ? { ...u, image_url: publicUrl } : u));
        setSelectedUnit({ ...selectedUnit, image_url: publicUrl });

    } catch (error: any) {
        console.error('Error uploading image:', error);
        toast.error("Failed to upload image");
    } finally {
        setUploadingImage(false);
    }
};
  
// Add/Edit Unit State
const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [savingUnit, setSavingUnit] = useState(false);
  const [newUnit, setNewUnit] = useState({
    unit_number: '',
    unit_type_id: '',
    floor_number: '',
    description: '',
    features: '',
    price: '',
    status: 'vacant'
  });

  useEffect(() => {
    loadUnits();
  }, [user?.id, id]);

  const fetchUnitTypes = async (propId: string) => {
    try {
        const { data: types, error } = await supabase
        .from('property_unit_types')
        .select('*')
        .eq('property_id', propId);
        
        if (error) {
            console.error('Error fetching unit types:', error);
            // Don't toast error here to avoid spamming 400s if schema is updating
        } else {
            // Map whatever we got to the structure we need
            // This handles if column is 'name' or 'unit_type_name'
            const mappedTypes = (types || []).map((t: any) => ({
                id: t.id,
                name: t.name || t.unit_type_name || 'Unknown Type',
                price_per_unit: t.price_per_unit || 0,
                unit_category: t.unit_category || 'residential'
            }));
            setUnitTypes(mappedTypes);
        }
    } catch (e) {
        console.error("Exception fetching unit types", e);
    }
  };

  const handleAddUnit = async () => {
    if (!newUnit.unit_number || !newUnit.unit_type_id || !propertyId) {
      toast.error('Please fill in required fields');
      return;
    }

    setSavingUnit(true);
    try {
      // 1. Check if unit number already exists in this property
      const { data: existing } = await supabase
        .from('units')
        .select('id')
        .eq('property_id', propertyId)
        .eq('unit_number', newUnit.unit_number)
        .maybeSingle();

      if (existing) {
        toast.error(`Unit ${newUnit.unit_number} already exists`);
        setSavingUnit(false);
        return;
      }

      // 2. Insert new unit
      const floorNum = newUnit.floor_number ? parseInt(newUnit.floor_number) : null;
      
      const { error } = await supabase
        .from('units')
        .insert({
          property_id: propertyId,
          unit_number: newUnit.unit_number,
          unit_type_id: newUnit.unit_type_id,
          status: newUnit.status,
          floor_number: floorNum,
          description: newUnit.description,
          // square_footage, bedrooms, bathrooms typically come from unit_type, 
          // or can be added if schema supports per-unit override
        });

      if (error) {
        if (error.message?.includes('column "floor_number" does not exist')) {
            toast.error('Database schema out of date. Please verify the migration was applied.', {
                description: 'We tried to save "floor_number" but the database rejected it.'
            });
        } else {
            throw error;
        }
      } else {
        toast.success(`Unit ${newUnit.unit_number} added successfully`);
        setIsAddUnitOpen(false);
        setNewUnit({
            unit_number: '',
            unit_type_id: '',
            floor_number: '',
            description: '',
            features: '',
            price: '',
            status: 'vacant'
        });
        loadUnits(); // Reload list
      }
    } catch (err: any) {
      console.error('Error adding unit:', err);
      toast.error('Failed to add unit: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingUnit(false);
    }
  };

  const loadUnits = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      
      let targetPropertyId = id;

      // If no ID in URL, get the first assigned property
      if (!targetPropertyId) {
        const { data: assignment, error: assignError } = await supabase
          .from('property_manager_assignments')
          .select('property_id')
          .eq('property_manager_id', user.id)
          .single();

        if (assignError && assignError.code !== 'PGRST116') {
          console.error("Assignment error:", assignError);
        }
        
        if (assignment) {
          targetPropertyId = assignment.property_id;
        }
      }

      if (!targetPropertyId) {
        toast.info('No property assigned to you yet');
        setLoading(false);
        return;
      }

      setPropertyId(targetPropertyId);
      fetchUnitTypes(targetPropertyId);

      // Fetch property name
      const { data: propData } = await supabase
        .from('properties')
        .select('name')
        .eq('id', targetPropertyId)
        .single();
      
      if (propData) {
        setPropertyName(propData.name);
      }

      // Fetch tenants
      const { data: tenantData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant');
      if (tenantData) setTenants(tenantData);

      // Fetch units for this property
      // Note: We avoid verifying inner join columns here to prevent 400 errors if schema drifts.
      // We will perform client-side join if necessary or just resiliently display what we have.
      const { data, error } = await supabase
        .from('units')
        .select(`
            *,
            tenant_leases(
                id,
                tenant_id,
                status
            )
        `)
        .eq('property_id', targetPropertyId)
        .order('unit_number', { ascending: true });

      if (error) {
        throw error;
      }

      // Re-fetch types to manually join if needed (more robust against schema naming issues)
      const { data: typeData } = await supabase.from('property_unit_types').select('*').eq('property_id', targetPropertyId);
      
      if (data) {
        // Map leases and types
        const unitsWithDetails = data.map((u: any) => {
            const activeLease = u.tenant_leases?.find((l: any) => l.status === 'active');
            let leaseInfo = undefined;
            if (activeLease) {
                 const tenant = tenantData?.find(t => t.id === activeLease.tenant_id);
                 leaseInfo = {
                     id: activeLease.id,
                     tenant_id: activeLease.tenant_id,
                     tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unknown Tenant'
                 };
            }
            
            // Manual join for unit types
            const uType = typeData?.find((t: any) => t.id === u.unit_type_id);
            const mappedType = uType ? {
                id: uType.id,
                name: uType.name || uType.unit_type_name || 'Standard',
                price_per_unit: uType.price_per_unit || 0,
                unit_category: uType.unit_category || 'residential'
            } : undefined;

            return { 
                ...u, 
                active_lease: leaseInfo,
                property_unit_types: u.property_unit_types || mappedType // Use join from DB if it worked, or manual fallback
            };
        });
        setUnits(unitsWithDetails);
      }
    } catch (err) {
      console.error('Error loading units:', err);
      toast.error('Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTenant = async () => {
      if(!selectedUnit || !selectedTenant) return;
      
      try {
          setSavingUnit(true);
          const now = new Date().toISOString();
          
          console.log("🔹 Starting tenant assignment...", { selectedTenant, propertyId, unitId: selectedUnit.id });
          
          if (selectedUnit.active_lease) {
               // Update existing assignment
               console.log("📝 Updating existing lease...");
               const { error } = await supabase
                  .from('tenant_leases')
                  .update({ 
                      tenant_id: selectedTenant 
                  })
                  .eq('id', selectedUnit.active_lease.id);
               
               if(error) throw error;

               // Also update the tenants table to keep them in sync
               const { error: tenantsError } = await supabase
                  .from('tenants')
                  .update({
                      property_id: propertyId,
                      unit_id: selectedUnit.id,
                      move_in_date: now,
                      status: 'active'
                  })
                  .eq('user_id', selectedTenant);

               if(tenantsError) throw new Error(`Failed to update tenant record: ${tenantsError.message}`);
               console.log("✅ Tenant record updated");
               
               toast.success("Assignment updated successfully");
          } else {
              // First, create the tenants table record so tenant can see assignment immediately
              console.log("🔍 Checking for existing tenant record...");
              const { data: existingTenant, error: checkError } = await supabase
                  .from('tenants')
                  .select('id')
                  .eq('user_id', selectedTenant)
                  .limit(1)
                  .maybeSingle();

              if (checkError && checkError.code !== 'PGRST116') {
                  throw new Error(`Database check failed: ${checkError.message}`);
              }

              if (existingTenant) {
                  console.log("📝 Updating existing tenant record...");
                  // Update existing tenant record
                  const { error: updateError } = await supabase
                      .from('tenants')
                      .update({
                          property_id: propertyId,
                          unit_id: selectedUnit.id,
                          move_in_date: now,
                          status: 'active'
                      })
                      .eq('user_id', selectedTenant);

                  if (updateError) throw updateError;
                  console.log("✅ Tenant record updated successfully");
              } else {
                  console.log("➕ Creating new tenant record...");
                  // Create new tenant record
                  const { error: insertError } = await supabase
                      .from('tenants')
                      .insert({
                          user_id: selectedTenant,
                          property_id: propertyId,
                          unit_id: selectedUnit.id,
                          move_in_date: now,
                          status: 'active'
                      });

                  if (insertError) throw insertError;
                  console.log("✅ Tenant record created successfully");
              }

              // Create lease
              console.log("➕ Creating lease record...");
              const { error: leaseError } = await supabase.from('tenant_leases').insert({
                  unit_id: selectedUnit.id,
                  tenant_id: selectedTenant,
                  start_date: now,
                  rent_amount: selectedUnit.property_unit_types?.price_per_unit || 0,
                  status: 'active'
              });

              if(leaseError) throw leaseError;
              console.log("✅ Lease record created");
              
              // Update unit status to 'occupied' as requested
              console.log("🔄 Updating unit status to occupied...");
              const { error: unitError } = await supabase.from('units').update({ status: 'occupied' }).eq('id', selectedUnit.id);
              if(unitError) throw unitError;
              console.log("✅ Unit status updated");
              
              toast.success("Tenant assigned successfully");
          }

          setIsAssignOpen(false);
          loadUnits();
      } catch(e: any) {
          console.error("❌ Assignment error:", e);
          if (e.message?.includes("409") || e.code === "409" || (typeof e === 'object' && JSON.stringify(e).includes("409"))) {
            toast.error("User is already a tenant elsewhere. You do not have permission to move them. Ask an admin to enable full tenant access.");
          } else {
            toast.error("Failed to save assignment: " + (e.message || JSON.stringify(e)));
          }
      } finally {
          setIsAssignOpen(false);
          setSavingUnit(false);
      }
  };

  const filteredUnits = units.filter(unit =>
    unit.unit_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'occupied':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-purple-100 text-purple-800';
      case 'vacant':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
      case 'available': // Fallback for old data
        return 'bg-yellow-100 text-yellow-800'; // Make it look like vacant
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-slate-900">Units {propertyName && `- ${propertyName}`}</h1>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddUnitOpen(true)}>
              <Plus size={16} className="mr-2" />
              Add Unit
            </Button>
          </div>
          <p className="text-slate-600">Manage all units in your property</p>
        </div>

        {/* Add Unit Dialog */}
        <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Unit</DialogTitle>
              <DialogDescription>
                Create a new unit record. These details will be visible to potential tenants.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="unit_number">Unit Number <span className="text-red-500">*</span></Label>
                    <Input 
                      id="unit_number" 
                      placeholder="e.g. A101" 
                      value={newUnit.unit_number} 
                      onChange={(e) => setNewUnit({...newUnit, unit_number: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="floor_number">Floor Number</Label>
                    <Input 
                      id="floor_number" 
                      type="number"
                      placeholder="e.g. 1" 
                      value={newUnit.floor_number} 
                      onChange={(e) => setNewUnit({...newUnit, floor_number: e.target.value})}
                    />
                  </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit_type">Unit Type <span className="text-red-500">*</span></Label>
                <Select 
                    value={newUnit.unit_type_id} 
                    onValueChange={(val) => setNewUnit({...newUnit, unit_type_id: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.unit_category}) - {type.price_per_unit?.toLocaleString()} KES
                      </SelectItem>
                    ))}
                    {unitTypes.length === 0 && (
                        <div className="p-2 text-sm text-slate-500 text-center">
                            No unit types found. Please ask admin to create property unit types first.
                        </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="features">Features</Label>
                 <Input 
                      id="features" 
                      placeholder="e.g. Balcony, AC, Wifi" 
                      value={newUnit.features} 
                      onChange={(e) => setNewUnit({...newUnit, features: e.target.value})}
                    />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select 
                    value={newUnit.status} 
                    onValueChange={(val) => setNewUnit({...newUnit, status: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input 
                  id="description" 
                  placeholder="e.g. Corner unit with balcony" 
                  value={newUnit.description} 
                  onChange={(e) => setNewUnit({...newUnit, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUnitOpen(false)} disabled={savingUnit}>
                Cancel
              </Button>
              <Button onClick={handleAddUnit} disabled={savingUnit}>
                {savingUnit ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                     Saving...
                   </>
                ) : (
                  'Create Unit'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Tenant Dialog */}
        <Dialog open={isEditUnitOpen} onOpenChange={setIsEditUnitOpen}>
           <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
               <DialogHeader>
                   <DialogTitle>Edit Unit {unitToEdit?.unit_number}</DialogTitle>
                   <DialogDescription>
                       Update unit details. Price changes are restricted to admins.
                   </DialogDescription>
               </DialogHeader>
               
               <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                      {/* Read Only Price */}
                      <div className="grid gap-2">
                        <Label>Current Rate (Read Only)</Label>
                        <Input 
                          value={`${editConfig.price?.toLocaleString() || 0} KES`} 
                          disabled 
                          className="bg-slate-100 font-bold text-slate-700"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-floor">Floor Number</Label>
                        <Input 
                          id="edit-floor"
                          type="number"
                          value={editConfig.floor_number} 
                          onChange={(e) => setEditConfig({...editConfig, floor_number: e.target.value})}
                        />
                      </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select 
                        value={editConfig.status} 
                        onValueChange={(val) => setEditConfig({...editConfig, status: val})}
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vacant">Vacant</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="available">Available (Legacy)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-type">Unit Type</Label>
                    <Select 
                        value={editConfig.unit_type_id} 
                        onValueChange={(val) => setEditConfig({...editConfig, unit_type_id: val})}
                    >
                      <SelectTrigger id="edit-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitTypes.map(t => (
                           <SelectItem key={t.id} value={t.id}>
                               {t.name}
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">Changing type may affect base rent price.</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-features">Features</Label>
                     <Input 
                          id="edit-features" 
                          placeholder="e.g. Balcony, AC" 
                          value={editConfig.features} 
                          onChange={(e) => setEditConfig({...editConfig, features: e.target.value})}
                        />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea 
                      id="edit-description" 
                      rows={4}
                      value={editConfig.description} 
                      onChange={(e) => setEditConfig({...editConfig, description: e.target.value})}
                    />
                  </div>
               </div>

               <DialogFooter>
                   <Button variant="outline" onClick={() => setIsEditUnitOpen(false)} disabled={savingUnit}>Cancel</Button>
                   <Button onClick={handleSaveUnitChanges} disabled={savingUnit} className="bg-blue-600 hover:bg-blue-700">
                       {savingUnit ? 'Saving...' : 'Save Changes'}
                   </Button>
               </DialogFooter>
           </DialogContent>
        </Dialog>

        {/* Assign Tenant Dialog */}
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
           <DialogContent>
               <DialogHeader>
                   <DialogTitle>Assign Tenant to Unit {selectedUnit?.unit_number}</DialogTitle>
                   <DialogDescription>
                       Select a tenant to assign this unit to. This will create an active lease.
                   </DialogDescription>
               </DialogHeader>
               <div className="py-4">
                   <Label>Select Tenant</Label>
                   <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                       <SelectTrigger><SelectValue placeholder="Search tenant..." /></SelectTrigger>
                       <SelectContent>
                           {tenants.map(t => (
                               <SelectItem key={t.id} value={t.id}>
                                   {t.first_name} {t.last_name} ({t.email})
                               </SelectItem>
                           ))}
                           {tenants.length === 0 && <div className="p-2 text-sm text-center">No tenants found</div>}
                       </SelectContent>
                   </Select>
               </div>
               <DialogFooter>
                   <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
                   <Button onClick={handleAssignTenant} disabled={savingUnit}>
                       {savingUnit ? 'Assigning...' : 'Assign Tenant'}
                   </Button>
               </DialogFooter>
           </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Unit Details - {selectedUnit?.unit_number}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    {/* Image Section */}
                    <div className="relative h-64 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border">
                        {selectedUnit?.image_url ? (
                            <img src={selectedUnit.image_url} alt="Unit" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center text-slate-400">
                                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No image uploaded</p>
                            </div>
                        )}
                        <div className="absolute bottom-4 right-4">
                            <Label htmlFor="image-upload" className="cursor-pointer">
                                <div className="bg-white/90 hover:bg-white text-slate-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all">
                                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                    <span className="font-semibold text-sm">
                                        {selectedUnit?.image_url ? 'Change Image' : 'Upload Image'}
                                    </span>
                                </div>
                                <Input 
                                    id="image-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleImageUpload}
                                    disabled={uploadingImage}
                                />
                            </Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground">Status</Label>
                            <p className={`font-semibold capitalize `}>
                                {selectedUnit?.active_lease ? 'Occupied' : (selectedUnit?.status || 'Vacant')}
                            </p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Price</Label>
                            <p className="font-semibold">
                                {(selectedUnit?.price || selectedUnit?.property_unit_types?.price_per_unit || 0) > 0 
                                  ? `${(selectedUnit?.price || selectedUnit?.property_unit_types?.price_per_unit || 0).toLocaleString()} KES`
                                  : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Floor</Label>
                            <p className="font-semibold">{selectedUnit?.floor_number ?? 'N/A'}</p>
                        </div>
                        <div>
                             <Label className="text-muted-foreground">Type</Label>
                             <p className="font-semibold">{selectedUnit?.property_unit_types?.name || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-between mb-2">
                             <Label className="text-muted-foreground">Description</Label>
                             {!isEditingDescription && (
                                 <Button variant="ghost" size="sm" onClick={() => setIsEditingDescription(true)}>
                                     <Edit className="w-3 h-3 mr-1" /> Edit
                                 </Button>
                             )}
                        </div>
                        
                        {isEditingDescription ? (
                            <div className="space-y-2">
                                <Textarea 
                                    value={editDescription} 
                                    onChange={(e) => setEditDescription(e.target.value)} 
                                    placeholder="Enter detailed description..."
                                    rows={4}
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => setIsEditingDescription(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleUpdateDescription} disabled={savingUnit}>
                                        {savingUnit ? 'Saving...' : 'Save Description'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                             <p className="mt-1 text-slate-700 bg-slate-50 p-3 rounded-md border text-sm min-h-[60px]">
                                {selectedUnit?.description || <span className="text-slate-400 italic">No description available. Click edit to add one.</span>}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label className="text-muted-foreground">Features</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                             {selectedUnit?.features?.map((f, i) => (
                                 <span key={i} className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-sm">{f}</span>
                             ))}
                             {(!selectedUnit?.features || selectedUnit.features.length === 0) && <span className="text-slate-500 text-sm">No features listed</span>}
                        </div>
                    </div>

                    {selectedUnit?.active_lease && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex justify-between items-center">
                            <div>
                                <h4 className="font-semibold text-green-800 mb-2">Occupancy Details</h4>
                                <p><span className="text-green-700">Tenant:</span> {selectedUnit.active_lease.tenant_name}</p>
                            </div>
                            <Button 
                                variant="outline" 
                                className="bg-white hover:bg-green-50 text-green-700 border-green-200"
                                onClick={() => {
                                    setIsDetailsOpen(false);
                                    setSelectedUnit(selectedUnit);
                                    setSelectedTenant(selectedUnit.active_lease!.tenant_id);
                                    setIsAssignOpen(true);
                                }}
                            >
                                <Edit className="w-4 h-4 mr-2" /> Edit Assignment
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search size={16} className="text-slate-400 absolute left-3 top-3" />
          <Input
            className="pl-9"
            placeholder="Search units by number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Building className="w-16 h-16 mx-auto mb-4 opacity-30 text-slate-400" />
            <p className="text-slate-600 text-lg">No units found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUnits.map(unit => {
              const unitType = unitTypes.find(t => t.id === unit.unit_type_id);
              const displayStatus = unit.active_lease ? 'occupied' : unit.status;
              
              return (
              <div key={unit.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-full">
                <div className="h-48 bg-slate-200 relative">
                     {unit.image_url ? (
                         <img src={unit.image_url} alt={`Unit ${unit.unit_number}`} className="w-full h-full object-cover" />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-400">
                             <ImageIcon className="w-12 h-12 opacity-50" />
                         </div>
                     )}
                     <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${getStatusColor(displayStatus)}`}>
                            {displayStatus === 'available' ? 'Vacant' : (displayStatus === 'occupied' ? 'Occupied' : displayStatus) || 'Vacant'}
                        </span>
                     </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Unit {unit.unit_number}</h3>
                            {(unit.floor_number !== undefined && unit.floor_number !== null) && (
                            <p className="text-sm text-slate-600">Floor {unit.floor_number}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 mb-4 flex-1">
                        {unitType?.name && (
                            <p><span className="font-semibold">Type:</span> {unitType.name}</p>
                        )}
                        {unit.features && unit.features.length > 0 && (
                            <p className="line-clamp-1"><span className="font-semibold">Features:</span> {unit.features.join(', ')}</p>
                        )}
                        {unit.active_lease && (
                            <p className="text-green-600"><span className="font-semibold">Tenant:</span> {unit.active_lease.tenant_name}</p>
                        )}
                        {(unit.price || unitType?.price_per_unit) && (
                            <p><span className="font-semibold">Rent:</span> KES {(unit.price || unitType?.price_per_unit || 0).toLocaleString()}</p>
                        )}
                    </div>
                
                    <div className="flex gap-2 mt-auto">
                        <Button variant="outline" className="flex-1" onClick={() => openDetails(unit)}>
                        Details
                        </Button>
                        <Button 
                             variant="outline"
                             className="flex-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                             onClick={() => openEditUnit(unit)}
                        >
                             <Edit size={16} className="mr-1" /> Edit
                        </Button>
                        {!unit.active_lease ? (
                            <Button 
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                    setSelectedUnit(unit);
                                    setSelectedTenant('');
                                    setIsAssignOpen(true);
                                }}
                            >
                            <Users size={16} className="mr-1" /> Assign
                            </Button>
                        ) : (
                            <Button 
                                variant="outline"
                                className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                                onClick={() => {
                                    setSelectedUnit(unit);
                                    setSelectedTenant(unit.active_lease!.tenant_id);
                                    setIsAssignOpen(true);
                                }}
                            >
                             <Check size={16} className="mr-1" /> Lease
                            </Button>
                        )}
                    </div>
                </div>
              </div>
            )})}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && units.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-sm text-slate-600 mb-2">Total Units</p>
              <p className="text-3xl font-bold text-slate-900">{units.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-sm text-slate-600 mb-2">Occupied</p>
              <p className="text-3xl font-bold text-green-600">{units.filter(u => u.status === 'occupied').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-sm text-slate-600 mb-2">Vacant</p>
              <p className="text-3xl font-bold text-yellow-600">{units.filter(u => u.status === 'vacant').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-sm text-slate-600 mb-2">Maintenance</p>
              <p className="text-3xl font-bold text-red-600">{units.filter(u => u.status === 'maintenance').length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerUnits;
