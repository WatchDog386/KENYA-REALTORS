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
  UserMinus,
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
import { propertyImageService } from '@/services/propertyImageService';
import { PropertyUnitManager } from "./properties/PropertyUnitManager";
import ManagerAssignment from '@/pages/portal/components/ManagerAssignment';

type PropertyFormData = Omit<CreatePropertyDTO, 'units'> & {
  units: Array<{
    id?: string;
    name: string;
    units_count: number;
    price_per_unit: number;
    sample_image_url?: string;
  }>;
};

const parseSampleImageUrls = (rawValue?: string | null): string[] => {
  const normalized = String(rawValue || '').trim();
  if (!normalized) return [];

  try {
    const parsed = JSON.parse(normalized);
    if (Array.isArray(parsed)) {
      return Array.from(
        new Set(
          parsed
            .map((item) => String(item || '').trim())
            .filter(Boolean)
        )
      );
    }

    if (typeof parsed === 'string' && parsed.trim()) {
      return [parsed.trim()];
    }
  } catch {
    // Keep backward compatibility with plain URL string storage.
  }

  if (normalized.includes(',')) {
    const splitUrls = normalized
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (splitUrls.length > 1) {
      return Array.from(new Set(splitUrls));
    }
  }

  return [normalized];
};

const serializeSampleImageUrls = (imageUrls: string[]): string => {
  const deduped = Array.from(
    new Set(
      (imageUrls || [])
        .map((url) => String(url || '').trim())
        .filter(Boolean)
    )
  );

  if (deduped.length === 0) return '';
  if (deduped.length === 1) return deduped[0];
  return JSON.stringify(deduped);
};

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // assignedStaff maps propertyId to lists of names
  const [assignedStaff, setAssignedStaff] = useState<Record<string, {
      managers: {id: string, name: string}[],
      technicians: {id: string, name: string}[],
      proprietors: {id: string, name: string}[],
      caretakers: {id: string, name: string}[]
  }>>({});
  const [occupiedUnitsCount, setOccupiedUnitsCount] = useState(0);
  
  // New state for assignment
  const [showAssignManagerDialog, setShowAssignManagerDialog] = useState(false);
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [unitSampleUrlDrafts, setUnitSampleUrlDrafts] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    location: '',
    image_url: '',
    type: 'Apartment',
    description: '',
    amenities: '',
    number_of_floors: 1,
    units: [{ name: '', units_count: 0, price_per_unit: 0, sample_image_url: '' }]
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
      const staffMap: Record<string, { managers: {id: string, name: string}[], technicians: {id: string, name: string}[], proprietors: {id: string, name: string}[], caretakers: {id: string, name: string}[] }> = {};

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
                  staffMap[m.property_id].managers.push({ id: m.property_manager_id, name: `${p.first_name} ${p.last_name}` });
              }
          });
      }

      // 2. Technicians
      const { data: techAssigns } = await supabase.from('technician_property_assignments').select('property_id, technician_id').eq('is_active', true);
      if (techAssigns?.length) {
          const techIds = techAssigns.map((t: any) => t.technician_id);
          const { data: technicians } = await supabase.from('technicians').select('id, user_id, technician_categories:category_id(name)').in('id', techIds); 
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
                          staffMap[t.property_id].technicians.push({ id: t.technician_id, name: `${p.first_name} ${p.last_name} (${cat})` });
                      }
                  }
              });
          }
      }

      // 3. Proprietors
      const { data: propAssigns } = await supabase.from('proprietor_properties').select('property_id, proprietor_id').eq('is_active', true);
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
                           staffMap[pa.property_id].proprietors.push({ id: pa.proprietor_id, name: `${p.first_name} ${p.last_name}` });
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
                   staffMap[c.property_id].caretakers.push({ id: c.user_id, name: `${p.first_name} ${p.last_name}` });
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
      units: [...formData.units, { name: '', units_count: 0, price_per_unit: 0, sample_image_url: '' }]
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

  const getUnitSampleImages = (index: number) => {
    const rawValue = formData.units[index]?.sample_image_url;
    return parseSampleImageUrls(rawValue);
  };

  const setUnitSampleImages = (index: number, imageUrls: string[]) => {
    const serialized = serializeSampleImageUrls(imageUrls);
    handleUnitChange(index, 'sample_image_url', serialized);
  };

  const addUnitSampleImageFromUrl = (index: number, draftKey: string) => {
    const draftUrl = String(unitSampleUrlDrafts[draftKey] || '').trim();
    if (!draftUrl) return;

    if (!/^https?:\/\//i.test(draftUrl)) {
      toast.error('Use a valid image URL that starts with http:// or https://');
      return;
    }

    const currentImages = getUnitSampleImages(index);
    if (currentImages.includes(draftUrl)) {
      toast.info('That image is already added for this unit type');
      return;
    }

    setUnitSampleImages(index, [...currentImages, draftUrl]);
    setUnitSampleUrlDrafts((prev) => ({ ...prev, [draftKey]: '' }));
  };

  const removeUnitSampleImage = (index: number, imageUrl: string) => {
    const remaining = getUnitSampleImages(index).filter((url) => url !== imageUrl);
    setUnitSampleImages(index, remaining);
  };

  const clearUnitSampleImages = (index: number) => {
    setUnitSampleImages(index, []);
  };

  const handleUnitSampleImageUpload = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const validationError = propertyImageService.getImageValidationError(file);
      if (validationError) {
        toast.error(validationError);
        event.target.value = '';
        return;
      }
    }

    try {
      setUploadingImage(true);
      const ownerId = selectedProperty?.id || `new-property-${Date.now()}`;
      const existingImages = getUnitSampleImages(index);
      const uploadedImages: string[] = [];

      for (const file of files) {
        const publicUrl = await propertyImageService.uploadPropertyImage(file, `${ownerId}/unit-samples`);
        uploadedImages.push(publicUrl);
      }

      setUnitSampleImages(index, [...existingImages, ...uploadedImages]);
      toast.success(`${uploadedImages.length} sample image${uploadedImages.length > 1 ? 's' : ''} uploaded`);
    } catch (error: any) {
      console.error('Error uploading unit sample image:', error);
      toast.error(error?.message || 'Failed to upload sample image');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const [unassignConfig, setUnassignConfig] = useState<{ propertyId: string, roleType: 'manager' | 'technician' | 'proprietor' | 'caretaker', recordId: string } | null>(null);

  const parseFloorCount = (value: string | number) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return Math.floor(parsed);
  };

  const getLivePropertySnapshot = async (property: Property): Promise<Property> => {
    const [unitsResponse, unitTypesResponse] = await Promise.all([
      supabase
        .from('units')
        .select('id, unit_number, floor_number, price, unit_type_id, property_unit_types(id, name, unit_type_name, price_per_unit)')
        .eq('property_id', property.id),
      supabase
        .from('property_unit_types')
        .select('id, name, unit_type_name, units_count, price_per_unit, sample_image_url')
        .eq('property_id', property.id),
    ]);

    const { data: liveUnits, error } = unitsResponse;
    const { data: configuredUnitTypes, error: configuredTypesError } = unitTypesResponse;

    if (error) {
      console.error('Error fetching live units for property snapshot:', error);
      return property;
    }
    if (configuredTypesError) {
      console.warn('Unable to fetch configured unit types for snapshot:', configuredTypesError.message);
    }

    const units = liveUnits || [];
    const configuredTypes = configuredUnitTypes || [];

    const normalizeTypeName = (typeRow: any) => String(typeRow?.name || typeRow?.unit_type_name || 'Standard').trim();
    const configuredById = new Map<string, any>(
      configuredTypes
        .filter((typeRow: any) => Boolean(typeRow?.id))
        .map((typeRow: any) => [String(typeRow.id), typeRow])
    );
    const configuredByName = new Map<string, any>(
      configuredTypes
        .map((typeRow: any) => [normalizeTypeName(typeRow).toLowerCase(), typeRow])
    );

    if (units.length === 0) {
      const mappedTypes = configuredTypes.map((typeRow: any) => ({
        id: String(typeRow.id || normalizeTypeName(typeRow)),
        name: normalizeTypeName(typeRow),
        units_count: Number(typeRow.units_count || 0),
        price_per_unit: Number(typeRow.price_per_unit || 0),
        sample_image_url: typeRow.sample_image_url || '',
      }));

      return {
        ...property,
        total_units: 0,
        expected_income: 0,
        property_unit_types: mappedTypes,
        number_of_floors: property.number_of_floors || 1,
      };
    }

    const floorSet = new Set<string>();
    const typeMap = new Map<
      string,
      {
        id: string;
        name: string;
        units_count: number;
        total_price: number;
        priced_count: number;
        default_price: number;
        sample_image_url: string;
      }
    >();
    let expectedIncome = 0;

    units.forEach((unit: any) => {
      floorSet.add(String(unit.floor_number ?? 'G'));

      const unitPrice = Number(unit.price || 0);
      const unitTypeRow = Array.isArray(unit.property_unit_types)
        ? unit.property_unit_types[0]
        : unit.property_unit_types;
      const typePrice = Number(unitTypeRow?.price_per_unit || 0);
      const resolvedPrice = unitPrice || typePrice;
      expectedIncome += resolvedPrice;

      const typeName = normalizeTypeName(unitTypeRow);
      const mapKey = String(unit.unit_type_id || unitTypeRow?.id || typeName);
      const matchedType = configuredById.get(mapKey) || configuredByName.get(typeName.toLowerCase());
      const current = typeMap.get(mapKey) || {
        id: mapKey,
        name: typeName,
        units_count: 0,
        total_price: 0,
        priced_count: 0,
        default_price: typePrice,
        sample_image_url: String(matchedType?.sample_image_url || ''),
      };

      current.units_count += 1;
      if (resolvedPrice > 0) {
        current.total_price += resolvedPrice;
        current.priced_count += 1;
      }
      typeMap.set(mapKey, current);
    });

    const aggregatedUnitTypes = Array.from(typeMap.values()).map((item) => ({
      id: item.id,
      name: item.name,
      units_count: item.units_count,
      price_per_unit: item.priced_count > 0 ? Math.round(item.total_price / item.priced_count) : item.default_price,
      sample_image_url: item.sample_image_url,
    }));

    const aggregatedKeys = new Set(aggregatedUnitTypes.map((item) => String(item.id)));
    const missingConfiguredTypes = configuredTypes
      .filter((typeRow: any) => !aggregatedKeys.has(String(typeRow.id)))
      .map((typeRow: any) => ({
        id: String(typeRow.id || normalizeTypeName(typeRow)),
        name: normalizeTypeName(typeRow),
        units_count: Number(typeRow.units_count || 0),
        price_per_unit: Number(typeRow.price_per_unit || 0),
        sample_image_url: String(typeRow.sample_image_url || ''),
      }));

    return {
      ...property,
      total_units: units.length,
      expected_income: expectedIncome,
      number_of_floors: floorSet.size || property.number_of_floors || 1,
      property_unit_types: [...aggregatedUnitTypes, ...missingConfiguredTypes],
    };
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
        number_of_floors: 1,
        units: [{ name: '', units_count: 0, price_per_unit: 0, sample_image_url: '' }]
      });
      setUnitSampleUrlDrafts({});
      setImagePreview(null);

      fetchProperties();
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error("Failed to create property");
    } finally {
      setSavingProperty(false);
    }
  };

  const handleUnassignStaff = (propertyId: string, roleType: 'manager' | 'technician' | 'proprietor' | 'caretaker', recordId: string) => {
      setUnassignConfig({ propertyId, roleType, recordId });
  };

  const executeUnassignStaff = async () => {
      if (!unassignConfig) return;
      const { propertyId, roleType, recordId } = unassignConfig;
      setUnassignConfig(null);
      try {
          if (roleType === 'manager') {
              const { error } = await supabase.from('property_manager_assignments').delete().eq('property_id', propertyId).eq('property_manager_id', recordId);
              if (error) throw error;
          } else if (roleType === 'technician') {
              const { error } = await supabase.from('technician_property_assignments').delete().eq('property_id', propertyId).eq('technician_id', recordId);
              if (error) throw error;
          } else if (roleType === 'proprietor') {
              const { error } = await supabase.from('proprietor_properties').delete().eq('property_id', propertyId).eq('proprietor_id', recordId);
              if (error) throw error;
          } else if (roleType === 'caretaker') {
              const { error } = await supabase.from('caretakers').delete().eq('property_id', propertyId).eq('user_id', recordId);
              if (error) throw error;
          }
          toast.success('Staff unassigned successfully');
          fetchAssignedStaff();
      } catch (err: any) {
          console.error('Error unassigning staff:', err);
          toast.error(err.message || 'Failed to unassign staff');
      }
  };

  const handleDeleteProperty = async (id: string) => {
      if(!confirm("Are you sure? This will delete the property and all its units.")) return;
      try {
        await propertyService.deleteProperty(id);
          toast.success("Property deleted");
          fetchProperties();
      } catch (err: any) {
        toast.error(err?.message || "Failed to delete property");
          console.error(err);
      }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = propertyImageService.getImageValidationError(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setUploadingImage(true);
      
      // Create a temporary property ID for the upload (use timestamp)
      const tempId = Date.now().toString();
      
      // Upload image
      const publicUrl = await propertyImageService.uploadPropertyImage(file, tempId);
      
      // Update form data with the image URL
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      
      // Set preview
      setImagePreview(publicUrl);
      
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, image_url: url }));
    // Only set preview if it's a valid URL
    if (url.startsWith('http')) {
      setImagePreview(url);
    } else if (!url) {
      setImagePreview(null);
    }
  };

  const handleViewProperty = async (property: Property) => {
    const liveProperty = await getLivePropertySnapshot(property);
    setSelectedProperty(liveProperty);
    setShowViewProperty(true);
  }

  const handleEditProperty = async (property: Property) => {
    const liveProperty = await getLivePropertySnapshot(property);
    setSelectedProperty(liveProperty);
    setUnitSampleUrlDrafts({});
    setFormData({
      name: liveProperty.name,
      location: liveProperty.location,
      image_url: liveProperty.image_url || '',
      type: liveProperty.type || 'Apartment',
      description: liveProperty.description || '',
      amenities: liveProperty.amenities || '',
      number_of_floors: liveProperty.number_of_floors || 1,
      units: liveProperty.property_unit_types?.map((u: any) => ({
        id: u.id,
        name: u.name,
        units_count: u.units_count,
        price_per_unit: u.price_per_unit,
        sample_image_url: u.sample_image_url || ''
      })) || [{ name: '', units_count: 0, price_per_unit: 0, sample_image_url: '' }]
    });
    setImagePreview(liveProperty.image_url || null);
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

      const validUnits = formData.units
        .filter((unit) => unit.name.trim())
        .map((unit) => ({
          id: unit.id,
          property_id: selectedProperty.id,
          name: unit.name.trim(),
          units_count: Number(unit.units_count) || 0,
          price_per_unit: Number(unit.price_per_unit) || 0,
          sample_image_url: serializeSampleImageUrls(parseSampleImageUrls(unit.sample_image_url)) || null,
        }));

      const { data: existingUnits, error: existingUnitsError } = await supabase
        .from('property_unit_types')
        .select('id')
        .eq('property_id', selectedProperty.id);

      if (existingUnitsError) throw existingUnitsError;

      const retainedIds = new Set(
        validUnits
          .filter((unit) => Boolean(unit.id))
          .map((unit) => unit.id as string)
      );

      const unitsToDelete = (existingUnits || [])
        .map((unit: any) => unit.id as string)
        .filter((unitId: string) => !retainedIds.has(unitId));

      if (unitsToDelete.length > 0) {
        const { error: unitDeleteError } = await supabase
          .from('property_unit_types')
          .delete()
          .in('id', unitsToDelete);

        if (unitDeleteError) throw unitDeleteError;
      }

      for (const unit of validUnits) {
        if (unit.id) {
          const { error: unitUpdateError } = await supabase
            .from('property_unit_types')
            .update({
              name: unit.name,
              units_count: unit.units_count,
              price_per_unit: unit.price_per_unit,
              sample_image_url: unit.sample_image_url,
            })
            .eq('id', unit.id);

          if (unitUpdateError) throw unitUpdateError;
        } else {
          const { error: unitInsertError } = await supabase
            .from('property_unit_types')
            .insert({
              property_id: unit.property_id,
              name: unit.name,
              units_count: unit.units_count,
              price_per_unit: unit.price_per_unit,
              sample_image_url: unit.sample_image_url,
            });

          if (unitInsertError) throw unitInsertError;
        }
      }

      toast.success("Property updated successfully");
      setShowEditProperty(false);
      setSelectedProperty(null);
      setUnitSampleUrlDrafts({});
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
    "Bedsitter", "Studio", "One Bedroom", "Two Bedroom", "Three Bedroom", "Shop", "Office", "Rooftop", "Penthouse", "Maisonette", "Villa", "Other"
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
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 rounded-b-lg shadow-lg mb-12 min-h-[40vh] flex items-center border-b border-blue-300">
        <HeroBackground />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-[1400px] mx-auto px-6 w-full pt-16">
          <div className="space-y-1">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-blue-100 backdrop-blur-sm rounded-lg border border-blue-300 shadow-inner">
                    <Building className="w-5 h-5 text-blue-600" />
                 </div>
                 <span className="text-blue-600 font-bold tracking-wider text-xs uppercase">Management</span>
             </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-blue-900">
              Property <span className="text-blue-600">Management</span>
            </h1>
            <p className="text-blue-700 text-sm mt-2 font-medium max-w-xl leading-relaxed">
              Manage your real estate portfolio, units, and income projections efficiently from one dashboard.
            </p>
          </div>
              
          <div className="flex items-center gap-3">
            <Button
                onClick={() => { fetchProperties(); toast.info("Refreshing..."); }}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 rounded-lg font-semibold transition-all"
            >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
            
            <Dialog open={showAddPropertyForm} onOpenChange={setShowAddPropertyForm}>
                <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg border-none px-6 py-6 text-sm uppercase tracking-wider transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    New Property
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden bg-white shadow-xl rounded-lg border border-blue-300">
                     {/* Header - Clean White */}
                    <div className="bg-blue-50 border-b border-blue-200 p-6">
                    <DialogHeader className="p-0 space-y-1">
                        <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Building className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-blue-900 tracking-tight">Add New Property</DialogTitle>
                            <DialogDescription className="text-blue-600 text-sm font-medium">
                            Enter property details and unit breakdown below.
                            </DialogDescription>
                        </div>
                        </div>
                    </DialogHeader>
                    </div>
                
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-8 bg-white">
                        {/* Image Upload Info Alert */}
                        <Alert className="bg-blue-50 border-blue-300">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-800 text-sm">
                            <strong>Image Tips:</strong> Upload a high-quality image or paste an external URL. Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB.
                          </AlertDescription>
                        </Alert>

                        {/* Section 1: Property Details */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                            Property Information
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <Label className="text-blue-900 font-semibold text-sm">Property Name</Label>
                                <Input 
                                    value={formData.name} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Sunrise Apartments"
                                    className="h-10 border-blue-300 focus:border-blue-600 focus:ring-blue-600 rounded-lg bg-white"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-blue-900 font-semibold text-sm">Location</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4" />
                                    <Input 
                                        value={formData.location} 
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, location: e.target.value})}
                                        placeholder="e.g. Westlands, Nairobi"
                                        className="pl-9 h-10 border-blue-300 focus:border-blue-600 focus:ring-blue-600 rounded-lg bg-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-blue-900 font-semibold text-sm">Floors</Label>
                                <Input 
                                    type="number"
                                    min="1"
                                    value={formData.number_of_floors} 
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, number_of_floors: parseFloorCount(e.target.value)})}
                                    placeholder="Number of floors"
                                    className="h-10 border-blue-300 focus:border-blue-600 focus:ring-blue-600 rounded-lg bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-blue-900 font-semibold text-sm">Type</Label>
                                <Select 
                                    value={formData.type} 
                                    onValueChange={(val: string) => setFormData({...formData, type: val})}
                                >
                                    <SelectTrigger className="h-10 border-blue-300 focus:border-blue-600 focus:ring-blue-600 rounded-lg bg-white">
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
                            
                            <div className="col-span-1 md:col-span-2 space-y-3">
                                <Label className="text-blue-900 font-semibold text-sm flex items-center gap-2">
                                  <ImageIcon className="w-4 h-4" />
                                  Cover Image
                                </Label>
                                
                                {/* Image Preview */}
                                {imagePreview && (
                                  <div className="relative h-40 rounded-lg overflow-hidden border-2 border-blue-300 bg-blue-50 flex items-center justify-center">
                                    <img 
                                      src={imagePreview} 
                                      alt="Property preview" 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e0e7ff" width="400" height="300"/%3E%3C/svg%3E';
                                      }}
                                    />
                                    <button 
                                      onClick={() => setImagePreview(null)}
                                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold transition-all"
                                      type="button"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
                                
                                {/* Upload Options */}
                                <div className="space-y-2">
                                  <label className="block">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleImageUpload}
                                      disabled={uploadingImage}
                                      className="hidden"
                                      id="property-image-input"
                                    />
                                    <label 
                                      htmlFor="property-image-input"
                                      className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-all text-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {uploadingImage ? (
                                        <>
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          Uploading...
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-4 h-4" />
                                          Upload Image
                                        </>
                                      )}
                                    </label>
                                  </label>
                                </div>

                                {/* Or paste URL */}
                                <div className="relative">
                                  <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1 block">Or paste URL:</span>
                                  <Input 
                                    value={formData.image_url} 
                                    onChange={handleImageInputChange}
                                    placeholder="https://example.com/image.jpg"
                                    className="h-10 border-blue-300 focus:border-blue-600 focus:ring-blue-600 rounded-lg bg-white text-sm"
                                  />
                                </div>
                            </div>
                            </div>
                        </div>

                        <Separator className="bg-blue-200" />

                        {/* Section 2: Unit Configuration */}
                        <div className="space-y-5">
                            <div className="flex justify-between items-end">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                                Unit Configuration
                                </h3>
                                <Button size="sm" onClick={handleAddUnit} className="h-8 border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-lg gap-1.5 text-xs font-bold transition-all">
                                <Plus className="w-3.5 h-3.5" /> Add Unit Type
                                </Button>
                            </div>

                            <div className="space-y-3">
                            <AnimatePresence initial={false}>
                              {formData.units.map((unit: any, index: number) => {
                              const sampleImages = getUnitSampleImages(index);
                              const sampleDraftKey = `create-${index}`;
                              return (
                                <motion.div 
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="group relative grid grid-cols-12 gap-3 items-end bg-blue-50/50 p-4 rounded-lg border border-blue-300 hover:border-blue-400 transition-all"
                                >
                                    <div className="col-span-12 md:col-span-5 space-y-1.5">
                                    <Label className="text-xs font-semibold text-blue-700">Unit Type</Label>
                                    <div className="relative">
                                        <Input 
                                            list={`unit-types-${index}`}
                                            placeholder="Select or type..." 
                                            value={unit.name}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitChange(index, 'name', e.target.value)}
                                            className="h-9 border-blue-300 bg-white text-sm font-medium focus:border-blue-600 focus:ring-blue-600 rounded-md shadow-sm" 
                                        />
                                        <datalist id={`unit-types-${index}`}>
                                            {unitTypeOptions.map(opt => <option key={opt} value={opt} />)}
                                        </datalist>
                                    </div>
                                    <div className="mt-2 space-y-1.5">
                                        <Label className="text-[11px] font-semibold text-blue-600">Sample Unit Photos (optional)</Label>
                                        {sampleImages.length > 0 && (
                                          <div className="flex flex-wrap gap-2">
                                            {sampleImages.map((imageUrl, imageIndex) => (
                                              <div key={`${imageUrl}-${imageIndex}`} className="relative h-14 w-14 rounded-md overflow-hidden border border-blue-200 bg-blue-100">
                                                <img
                                                  src={imageUrl}
                                                  alt={`Sample ${imageIndex + 1}`}
                                                  className="w-full h-full object-cover"
                                                  onError={(event) => {
                                                    (event.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" fill="%23dbeafe"/%3E%3C/svg%3E';
                                                  }}
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => removeUnitSampleImage(index, imageUrl)}
                                                  className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center"
                                                  title="Remove image"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        <div className="flex gap-2">
                                          <Input
                                            value={unitSampleUrlDrafts[sampleDraftKey] || ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnitSampleUrlDrafts((prev) => ({ ...prev, [sampleDraftKey]: e.target.value }))}
                                            placeholder="Paste image URL and click Add"
                                            className="h-8 border-blue-300 bg-white text-xs font-medium"
                                          />
                                          <Button
                                            type="button"
                                            onClick={() => addUnitSampleImageFromUrl(index, sampleDraftKey)}
                                            className="h-8 px-3 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                                          >
                                            Add
                                          </Button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            id={`unit-sample-upload-${index}`}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitSampleImageUpload(index, e)}
                                          />
                                          <label
                                            htmlFor={`unit-sample-upload-${index}`}
                                            className="h-8 px-3 inline-flex items-center justify-center rounded-md border border-blue-300 bg-white text-blue-700 text-[11px] font-semibold cursor-pointer hover:bg-blue-100"
                                          >
                                            {uploadingImage ? 'Uploading...' : 'Upload Many'}
                                          </label>
                                          {sampleImages.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => clearUnitSampleImages(index)}
                                              className="h-8 px-2 inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100"
                                            >
                                              Clear
                                            </button>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-blue-600">{sampleImages.length} image(s) attached</p>
                                    </div>
                                    </div>
                                    
                                    <div className="col-span-4 md:col-span-2 space-y-1.5">
                                    <Label className="text-xs font-semibold text-blue-700">Count</Label>
                                    <Input 
                                        type="number"
                                        min="0"
                                        placeholder="0" 
                                        value={unit.units_count}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitChange(index, 'units_count', Number(e.target.value))}
                                        className="h-9 border-blue-300 bg-white text-sm font-medium text-center focus:border-blue-600 focus:ring-blue-600 rounded-md shadow-sm"
                                    />
                                    </div>
                                    
                                    <div className="col-span-7 md:col-span-4 space-y-1.5">
                                    <Label className="text-xs font-semibold text-blue-700">Rent (KES)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 text-xs font-bold z-10">KES</span>
                                        <Input 
                                        type="number"
                                        min="0"
                                        placeholder="0" 
                                        value={unit.price_per_unit}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitChange(index, 'price_per_unit', Number(e.target.value))}
                                        className="pl-10 h-9 border-blue-300 bg-white text-sm font-medium text-right focus:border-blue-600 focus:ring-blue-600 rounded-md shadow-sm"
                                        />
                                    </div>
                                    </div>
                                    
                                    <div className="col-span-1 flex justify-center pb-1">
                                    <Button 
                                        size="icon" 
                                        onClick={() => handleRemoveUnit(index)} 
                                        className="h-7 w-7 text-red-600 bg-red-50 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors border border-red-300"
                                        disabled={formData.units.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    </div>
                                </motion.div>
                                  );
                                  })}
                            </AnimatePresence>
                            
                            {formData.units.length === 0 && (
                                <div onClick={handleAddUnit} className="border-2 border-dashed border-blue-300 rounded-lg p-8 flex flex-col items-center justify-center text-blue-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer">
                                    <Home className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="font-semibold text-sm">Add your first unit type</p>
                                </div>
                            )}
                            </div>
                        </div>

                        {/* Financial Summary Card - Clean & Minimal */}
                        <div className="rounded-lg overflow-hidden border border-blue-300 bg-blue-50 p-5 mt-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-white border border-blue-200 rounded-full shadow-sm">
                                    <Calculator className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-0.5">Projected Monthly Income</p>
                                    <p className="text-2xl font-bold text-blue-900 tracking-tight">
                                    <span className="text-sm text-blue-600 mr-1 font-medium">KES</span>
                                    {formExpectedIncome.toLocaleString()}
                                    </p>
                                </div>
                                </div>
                                
                                <div className="flex gap-6 text-sm">
                                    <div className="px-4 py-2 bg-white rounded-lg border border-blue-200 shadow-sm">
                                        <span className="text-blue-600 text-xs font-semibold uppercase mr-2">Units:</span>
                                        <span className="font-bold text-blue-900">{formTotalUnits}</span>
                                    </div>
                                    <div className="px-4 py-2 bg-white rounded-lg border border-blue-200 shadow-sm">
                                        <span className="text-blue-600 text-xs font-semibold uppercase mr-2">Types:</span>
                                        <span className="font-bold text-blue-900">{formData.units.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t border-blue-200 bg-white">
                    <Button onClick={() => setShowAddPropertyForm(false)} disabled={savingProperty} className="font-semibold text-blue-700 border border-blue-300 hover:bg-blue-50 rounded-lg">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveProperty} 
                        disabled={savingProperty || !formData.name || formTotalUnits === 0} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold rounded-lg shadow-md transition-all"
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
        <DialogContent className="w-[96vw] max-w-[1400px] h-[92vh] p-0 gap-0 overflow-hidden bg-white shadow-2xl rounded-xl border border-slate-200">
          <DialogTitle className="sr-only">Property Details</DialogTitle>
          <DialogDescription className="sr-only">Full details of the selected property</DialogDescription>
          {selectedProperty && (
            <>
              <div className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg border border-blue-200">
                      <Eye className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Property Overview</h2>
                      <p className="text-slate-600 text-sm mt-1">Full profile, staff assignment, and unit breakdown.</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="uppercase tracking-wider font-semibold">Viewing</p>
                    <p className="text-slate-700 font-bold mt-1">{selectedProperty.name}</p>
                  </div>
                </div>
              </div>

              <div className="h-[calc(92vh-145px)] overflow-y-auto p-6 bg-slate-50">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <div className="xl:col-span-5 space-y-6">
                    <Card className="border border-slate-200 shadow-sm overflow-hidden">
                      <div className="h-60 bg-slate-200">
                        {selectedProperty.image_url ? (
                          <img
                            src={selectedProperty.image_url}
                            alt={selectedProperty.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/900x400?text=Property+Image';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                            <Building className="w-16 h-16 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5 space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">{selectedProperty.name}</h3>
                          <div className="mt-2 flex items-center gap-2 text-slate-700">
                            <MapPin className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">{selectedProperty.location}</span>
                          </div>
                          <Badge className="mt-3 bg-blue-100 text-blue-800 px-3 py-1">{selectedProperty.type || 'Apartment'}</Badge>
                        </div>

                        {selectedProperty.description && (
                          <div className="pt-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</p>
                            <p className="text-slate-800 leading-relaxed">{selectedProperty.description}</p>
                          </div>
                        )}

                        {selectedProperty.amenities && (
                          <div className="pt-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Amenities</p>
                            <p className="text-slate-800 leading-relaxed">{selectedProperty.amenities}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold text-slate-900">Property Metrics</CardTitle>
                        <CardDescription>Quick operational and revenue indicators.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 mb-1">Floors</p>
                            <p className="text-2xl font-bold text-indigo-900">{selectedProperty.number_of_floors || 1}</p>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 mb-1">Total Units</p>
                            <p className="text-2xl font-bold text-emerald-900">{selectedProperty.total_units || 0}</p>
                          </div>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-orange-900 mb-1">Expected Monthly Income</p>
                          <p className="text-2xl font-bold text-orange-900">KES {(selectedProperty.expected_income || 0).toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="xl:col-span-7 space-y-6">
                    <Card className="border border-slate-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold text-slate-900">Assigned Staff</CardTitle>
                        <CardDescription>Current workforce assignments for this property.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {assignedStaff[selectedProperty.id]?.managers?.length > 0 && (
                          <div className="text-sm text-slate-800 flex flex-wrap gap-2 items-center">
                            <span className="font-semibold text-slate-900">Managers:</span>
                            {assignedStaff[selectedProperty.id].managers.map((m, i) => (
                              <span key={i} className="bg-white px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                                {m.name}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnassignStaff(selectedProperty.id, 'manager', m.id);
                                  }}
                                  className="text-red-500 hover:text-red-700 ml-1"
                                  title="Unassign"
                                >
                                  <UserMinus className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {assignedStaff[selectedProperty.id]?.technicians?.length > 0 && (
                          <div className="text-sm text-slate-800 flex flex-wrap gap-2 items-center">
                            <span className="font-semibold text-slate-900">Technicians:</span>
                            {assignedStaff[selectedProperty.id].technicians.map((t, i) => (
                              <span key={i} className="bg-white px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                                {t.name}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnassignStaff(selectedProperty.id, 'technician', t.id);
                                  }}
                                  className="text-red-500 hover:text-red-700 ml-1"
                                  title="Unassign"
                                >
                                  <UserMinus className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {assignedStaff[selectedProperty.id]?.proprietors?.length > 0 && (
                          <div className="text-sm text-slate-800 flex flex-wrap gap-2 items-center">
                            <span className="font-semibold text-slate-900">Proprietors:</span>
                            {assignedStaff[selectedProperty.id].proprietors.map((p, i) => (
                              <span key={i} className="bg-white px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                                {p.name}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnassignStaff(selectedProperty.id, 'proprietor', p.id);
                                  }}
                                  className="text-red-500 hover:text-red-700 ml-1"
                                  title="Unassign"
                                >
                                  <UserMinus className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {assignedStaff[selectedProperty.id]?.caretakers?.length > 0 && (
                          <div className="text-sm text-slate-800 flex flex-wrap gap-2 items-center">
                            <span className="font-semibold text-slate-900">Caretakers:</span>
                            {assignedStaff[selectedProperty.id].caretakers.map((c, i) => (
                              <span key={i} className="bg-white px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                                {c.name}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnassignStaff(selectedProperty.id, 'caretaker', c.id);
                                  }}
                                  className="text-red-500 hover:text-red-700 ml-1"
                                  title="Unassign"
                                >
                                  <UserMinus className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {(!assignedStaff[selectedProperty.id] || (
                          !assignedStaff[selectedProperty.id].managers.length &&
                          !assignedStaff[selectedProperty.id].technicians.length &&
                          !assignedStaff[selectedProperty.id].proprietors.length &&
                          !assignedStaff[selectedProperty.id].caretakers.length
                        )) && (
                          <p className="text-slate-500 italic text-sm">No staff assigned</p>
                        )}
                      </CardContent>
                    </Card>

                    {selectedProperty.property_unit_types && selectedProperty.property_unit_types.length > 0 && (
                      <Card className="border border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50">
                          <CardTitle className="text-lg font-bold text-slate-900">Unit Type Breakdown</CardTitle>
                          <CardDescription>Unit mix and average rent by type.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 divide-y divide-slate-100">
                          {selectedProperty.property_unit_types.map((unitType, idx) => (
                            <div key={`${unitType.id || unitType.name}-${idx}`} className="px-5 py-4 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-slate-900">{unitType.name}</p>
                                <p className="text-xs text-slate-500">{unitType.units_count} units</p>
                              </div>
                              <p className="font-bold text-slate-900">KES {(Number(unitType.price_per_unit) || 0).toLocaleString()}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="px-6 py-4 border-t border-slate-200 bg-white sticky bottom-0 z-20">
                <Button
                  variant="outline"
                  onClick={() => setShowViewProperty(false)}
                  className="font-semibold text-slate-700 border-slate-300 hover:bg-slate-100"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowViewProperty(false);
                    handleEditProperty(selectedProperty);
                  }}
                  className="bg-[#154279] hover:bg-[#0f325e] text-white font-bold"
                >
                  Edit Property
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT PROPERTY DIALOG */}
      <Dialog open={showEditProperty} onOpenChange={setShowEditProperty}>
        <DialogContent className="w-[96vw] max-w-[1400px] h-[92vh] p-0 gap-0 overflow-hidden bg-white shadow-2xl rounded-xl border border-slate-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-20">
            <DialogHeader className="p-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg border border-blue-200">
                    <Building className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Property</DialogTitle>
                    <DialogDescription className="text-slate-600 text-sm mt-1">
                      Full editor for property profile, media, and unit setup.
                    </DialogDescription>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="uppercase tracking-wider font-semibold">Now Editing</p>
                  <p className="text-slate-700 font-bold mt-1">{selectedProperty?.name || formData.name || 'Property'}</p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="h-[calc(92vh-145px)] overflow-y-auto p-6 bg-slate-50">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left Panel */}
              <div className="xl:col-span-5 space-y-6">
                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900">Property Profile</CardTitle>
                    <CardDescription>Core identity and location details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Property Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Sunrise Apartments"
                        className="h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          value={formData.location}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="e.g. Westlands, Nairobi"
                          className="pl-9 h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Property Type</Label>
                        <Select value={formData.type} onValueChange={(val: string) => setFormData({ ...formData, type: val })}>
                          <SelectTrigger className="h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white">
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

                      <div className="space-y-2">
                        <Label className="text-slate-700 font-semibold text-sm">Floors</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.number_of_floors || 1}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, number_of_floors: parseFloorCount(e.target.value) })}
                          className="h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Description</Label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Property description..."
                        className="w-full min-h-[96px] p-3 border border-slate-300 rounded-md focus:border-blue-500 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Amenities</Label>
                      <textarea
                        value={formData.amenities || ''}
                        onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                        placeholder="e.g. Gym, Swimming Pool, Security..."
                        className="w-full min-h-[96px] p-3 border border-slate-300 rounded-md focus:border-blue-500 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900">Media</CardTitle>
                    <CardDescription>Upload or paste a cover image URL.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(imagePreview || formData.image_url) ? (
                      <div className="relative h-56 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={imagePreview || formData.image_url}
                          alt="Property preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/900x400?text=Invalid+Image';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData((prev) => ({ ...prev, image_url: '' }));
                          }}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold"
                          aria-label="Clear selected image"
                        >
                          x
                        </button>
                      </div>
                    ) : (
                      <div className="h-56 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm font-semibold">No image selected</p>
                        </div>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="property-image-input-edit"
                    />
                    <label
                      htmlFor="property-image-input-edit"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-all text-blue-700 font-semibold text-sm"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Upload New Cover
                        </>
                      )}
                    </label>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Paste Image URL</Label>
                      <Input
                        value={formData.image_url}
                        onChange={handleImageInputChange}
                        placeholder="https://example.com/image.jpg"
                        className="h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel */}
              <div className="xl:col-span-7 space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-sm">
                    Keep this page as your full editing workspace. Update unit mix and pricing, then save once.
                  </AlertDescription>
                </Alert>

                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-900">Unit Configuration</CardTitle>
                        <CardDescription>Define unit types, counts, and rental values.</CardDescription>
                      </div>
                      <Button size="sm" onClick={handleAddUnit} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5 text-xs font-bold">
                        <Plus className="w-3.5 h-3.5" /> Add Unit Type
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {formData.units.map((unit: any, index: number) => {
                      const sampleImages = getUnitSampleImages(index);
                      const sampleDraftKey = `edit-${index}`;
                      return (
                      <div
                        key={unit.id || `edit-unit-${index}`}
                        className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-4 rounded-lg border border-slate-200"
                      >
                        <div className="col-span-12 md:col-span-5 space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">Unit Type</Label>
                          <Input
                            list={`edit-unit-types-${index}`}
                            placeholder="Select or type..."
                            value={unit.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitChange(index, 'name', e.target.value)}
                            className="h-9 border-slate-300 bg-white text-sm font-medium"
                          />
                          <datalist id={`edit-unit-types-${index}`}>
                            {unitTypeOptions.map(opt => <option key={opt} value={opt} />)}
                          </datalist>
                          <div className="mt-2 space-y-1.5">
                            <Label className="text-[11px] font-semibold text-slate-600">Sample Unit Photos (optional)</Label>
                            {sampleImages.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {sampleImages.map((imageUrl, imageIndex) => (
                                  <div key={`${imageUrl}-${imageIndex}`} className="relative h-14 w-14 rounded-md overflow-hidden border border-slate-300 bg-slate-100">
                                    <img
                                      src={imageUrl}
                                      alt={`Sample ${imageIndex + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(event) => {
                                        (event.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" fill="%23e2e8f0"/%3E%3C/svg%3E';
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeUnitSampleImage(index, imageUrl)}
                                      className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center"
                                      title="Remove image"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Input
                                value={unitSampleUrlDrafts[sampleDraftKey] || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnitSampleUrlDrafts((prev) => ({ ...prev, [sampleDraftKey]: e.target.value }))}
                                placeholder="Paste image URL and click Add"
                                className="h-8 border-slate-300 bg-white text-xs font-medium"
                              />
                              <Button
                                type="button"
                                onClick={() => addUnitSampleImageFromUrl(index, sampleDraftKey)}
                                className="h-8 px-3 text-[11px] font-semibold bg-slate-700 hover:bg-slate-800 text-white"
                              >
                                Add
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                id={`edit-unit-sample-upload-${index}`}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitSampleImageUpload(index, e)}
                              />
                              <label
                                htmlFor={`edit-unit-sample-upload-${index}`}
                                className="h-8 px-3 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 text-[11px] font-semibold cursor-pointer hover:bg-slate-100"
                              >
                                {uploadingImage ? 'Uploading...' : 'Upload Many'}
                              </label>
                              {sampleImages.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => clearUnitSampleImages(index)}
                                  className="h-8 px-2 inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">{sampleImages.length} image(s) attached</p>
                          </div>
                        </div>

                        <div className="col-span-4 md:col-span-2 space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">Count</Label>
                          <Input
                            type="number"
                            min="0"
                            value={unit.units_count}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitChange(index, 'units_count', Number(e.target.value))}
                            className="h-9 border-slate-300 bg-white text-sm font-medium text-center"
                          />
                        </div>

                        <div className="col-span-7 md:col-span-4 space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">Rent (KES)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={unit.price_per_unit}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitChange(index, 'price_per_unit', Number(e.target.value))}
                            className="h-9 border-slate-300 bg-white text-sm font-medium text-right"
                          />
                        </div>

                        <div className="col-span-1 flex justify-center pb-1">
                          <Button
                            size="icon"
                            onClick={() => handleRemoveUnit(index)}
                            className="h-8 w-8 text-red-600 bg-red-50 hover:text-red-700 hover:bg-red-100 border border-red-200"
                            disabled={formData.units.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                    })}
                  </CardContent>
                </Card>

                <Card className="border border-blue-200 bg-blue-50 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-white border border-blue-200 rounded-full shadow-sm">
                          <Calculator className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider mb-0.5">Projected Monthly Income</p>
                          <p className="text-2xl font-bold text-blue-900 tracking-tight">
                            <span className="text-sm text-blue-700 mr-1 font-medium">KES</span>
                            {formExpectedIncome.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 text-sm">
                        <div className="px-4 py-2 bg-white rounded-lg border border-blue-200">
                          <span className="text-blue-700 text-xs font-semibold uppercase mr-2">Units:</span>
                          <span className="font-bold text-blue-900">{formTotalUnits}</span>
                        </div>
                        <div className="px-4 py-2 bg-white rounded-lg border border-blue-200">
                          <span className="text-blue-700 text-xs font-semibold uppercase mr-2">Types:</span>
                          <span className="font-bold text-blue-900">{formData.units.length}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-200 bg-white sticky bottom-0 z-20">
            <Button
              variant="outline"
              onClick={() => setShowEditProperty(false)}
              disabled={savingProperty}
              className="font-semibold text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProperty}
              disabled={savingProperty || !formData.name}
              className="bg-[#154279] hover:bg-[#0f325e] text-white px-8 font-bold"
            >
              {savingProperty ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving Changes...
                </>
              ) : (
                'Update Property'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
        {/* UNASSIGN CONFIRM DIALOG */}
        <Dialog open={!!unassignConfig} onOpenChange={(open) => !open && setUnassignConfig(null)}>
          <DialogContent className="sm:max-w-[400px] bg-white rounded-xl border border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Confirm Unassign
              </DialogTitle>
              <DialogDescription className="text-slate-600 pt-2">
                Are you sure you want to unassign this staff member from the property? This action will immediately revoke their access.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:justify-start">
              <Button variant="outline" className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200" onClick={() => setUnassignConfig(null)}>
                  Cancel
              </Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={executeUnassignStaff}>
                  Yes, Unassign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        
        {/* UNASSIGN CONFIRM DIALOG */}
        <Dialog open={!!unassignConfig} onOpenChange={(open) => !open && setUnassignConfig(null)}>
          <DialogContent className="sm:max-w-[400px] bg-white rounded-xl border border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Confirm Unassign
              </DialogTitle>
              <DialogDescription className="text-slate-600 pt-2">
                Are you sure you want to unassign this staff member from the property? This action will immediately revoke their access.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:justify-start">
              <Button variant="outline" className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200" onClick={() => setUnassignConfig(null)}>
                  Cancel
              </Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={executeUnassignStaff}>
                  Yes, Unassign
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
                <Button variant="outline" className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200" onClick={() => setShowAssignManagerDialog(false)}>Close</Button>
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
                                        {assignedStaff[property.id]?.managers?.map((staff, i) => (
                                            <Badge key={`m-${i}`} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center w-fit gap-1 pr-1">
                                                <UserPlus className="w-3 h-3" /> <span className="mr-1">{staff.name}</span>
                                                <button onClick={(e) => { e.stopPropagation(); handleUnassignStaff(property.id, 'manager', staff.id); }} className='text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 rounded p-0.5 transition-colors' title='Unassign'>
                                                    <UserMinus className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                        {assignedStaff[property.id]?.technicians?.map((staff, i) => (
                                            <Badge key={`t-${i}`} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center w-fit gap-1 pr-1">
                                                <Users className="w-3 h-3" /> <span className="mr-1">{staff.name}</span>
                                                <button onClick={(e) => { e.stopPropagation(); handleUnassignStaff(property.id, 'technician', staff.id); }} className='text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded p-0.5 transition-colors' title='Unassign'>
                                                    <UserMinus className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                          {assignedStaff[property.id]?.proprietors?.map((staff, i) => (
                                            <Badge key={`p-${i}`} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center w-fit gap-1 pr-1">
                                                <Building className="w-3 h-3" /> <span className="mr-1">{staff.name}</span>
                                                <button onClick={(e) => { e.stopPropagation(); handleUnassignStaff(property.id, 'proprietor', staff.id); }} className='text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded p-0.5 transition-colors' title='Unassign'>
                                                    <UserMinus className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                        {assignedStaff[property.id]?.caretakers?.map((staff, i) => (
                                            <Badge key={`c-${i}`} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center w-fit gap-1 pr-1">
                                                <UserPlus className="w-3 h-3" /> <span className="mr-1">{staff.name}</span>
                                                <button onClick={(e) => { e.stopPropagation(); handleUnassignStaff(property.id, 'caretaker', staff.id); }} className='text-orange-500 hover:text-orange-700 hover:bg-orange-100 rounded p-0.5 transition-colors' title='Unassign'>
                                                    <UserMinus className="w-3 h-3" />
                                                </button>
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
                                            
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleEditProperty(property)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl border-none mb-1 h-9"
                                            >
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Edit Property
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => {
                                                    setSelectedProperty(property);
                                                    setSelectedManagerId(""); // reset selection
                                                    setShowAssignManagerDialog(true);
                                                }}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl border-none mb-1 h-9"
                                            >
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Assign Staff
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => {
                                                    handleViewProperty(property);
                                                    setTimeout(() => {
                                                        // Inform the user since specific unassignments happen in the staff list
                                                        toast.info("Manage staff inside View Details to unassign specific members");
                                                    }, 500);
                                                }}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl border-none mb-1 h-9"
                                            >
                                                <UserMinus className="w-4 h-4 mr-2" />
                                                Unassign Staff
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleDeleteProperty(property.id)} 
                                                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl border-none mb-1 h-9"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete Property
                                            </Button>
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
