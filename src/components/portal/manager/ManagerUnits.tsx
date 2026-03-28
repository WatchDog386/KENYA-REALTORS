import React, { useState, useEffect } from 'react';
import { Building, Search, Loader2, Plus, X, Check, Users, Camera, Upload, Edit, FileText, Image as ImageIcon, Building2, Layers, Maximize, AlertTriangle, CheckCircle2, ArrowRight, LayoutGrid, List, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getManagerAssignedPropertyIds } from '@/services/managerPropertyAssignmentService';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Badge } from '@/components/ui/badge';

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
      status?: string;
  }
}

interface UnitType {
  id: string;
  name: string;
  price_per_unit: number;
  unit_category: string;
  property_id?: string;
}

interface TenantProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface ApplicantCandidate {
  application_id: string;
  applicant_id: string;
  name: string;
  email: string;
  status: string;
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
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [filterUnitType, setFilterUnitType] = useState<string>('all');
  const [filterPriceRange, setFilterPriceRange] = useState<string>('all');
  const [propertyId, setPropertyId] = useState<string>('');
  const [propertyName, setPropertyName] = useState<string>('');
  const [properties, setProperties] = useState<{id: string, name: string}[]>([]);
  const [expandedProps, setExpandedProps] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
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
    
    // Initialize edit config in case they switch to Manage tab
    const effectivePrice = unit.price || unit.property_unit_types?.price_per_unit || 0;
    setUnitToEdit(unit);
    setEditConfig({
        status: unit.status || 'vacant',
        features: unit.features ? unit.features.join(', ') : '',
        description: unit.description || '',
        floor_number: unit.floor_number?.toString() || '',
        unit_type_id: unit.unit_type_id || '',
        price: effectivePrice
    });
    
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
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [savingUnit, setSavingUnit] = useState(false);
  const [isCreatingTenantUser, setIsCreatingTenantUser] = useState(false);
  const [addTenantMode, setAddTenantMode] = useState<'create_user' | 'from_applicants'>('create_user');
  const [applicantCandidates, setApplicantCandidates] = useState<ApplicantCandidate[]>([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState('');
  const [newTenantForm, setNewTenantForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    physical_address: '',
    po_box: '',
    employer_details: '',
    marital_status: '',
    children_count: '',
    age_bracket: '',
    occupants_count: '1',
    next_of_kin: '',
    next_of_kin_email: '',
    nationality: '',
    house_staff: false,
    home_address: '',
    location: '',
    sub_location: '',
  });
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

  useEffect(() => {
    if (!isAssignOpen) return;
    setSelectedTenant(selectedUnit?.active_lease?.tenant_id || '');
  }, [isAssignOpen, selectedUnit?.id]);

  useEffect(() => {
    if (!isAddTenantOpen) return;
    void loadApplicantCandidates();
  }, [isAddTenantOpen, selectedUnit?.id, propertyId]);

  const fetchUnitTypes = async (propIds: string[]) => {
    try {
        const { data: types, error } = await supabase
        .from('property_unit_types')
        .select('*')
        .in('property_id', propIds);
        
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
                unit_category: t.unit_category || 'residential',
                property_id: t.property_id
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
      
      let targetPropertyIds: string[] = [];

      // If no ID in URL, get all assigned properties
      if (id) {
        targetPropertyIds = [id];
      } else {
        targetPropertyIds = await getManagerAssignedPropertyIds(user.id);
      }

      if (targetPropertyIds.length === 0) {
        toast.info('No property assigned to you yet');
        setLoading(false);
        return;
      }

      // Fetch property names
      const { data: propData } = await supabase
        .from('properties')
        .select('id, name')
        .in('id', targetPropertyIds);
      
      if (propData) {
        setProperties(propData);
        const expandedState: Record<string, boolean> = {};
        propData.forEach(p => { expandedState[p.id] = true; });
        setExpandedProps(expandedState);

        if (propData.length > 0) {
          setPropertyId(propData[0].id);
          setPropertyName(propData[0].name);
        }
      }

      fetchUnitTypes(targetPropertyIds);

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
            status,
            start_date,
            end_date,
            created_at
            )
        `)
        .in('property_id', targetPropertyIds)
        .order('unit_number', { ascending: true });

      if (error) {
        throw error;
      }

      // Re-fetch types to manually join if needed (more robust against schema naming issues)
      const { data: typeData } = await supabase.from('property_unit_types').select('*').in('property_id', targetPropertyIds);
      
      if (data) {
        // Map leases and types
        const unitsWithDetails = data.map((u: any) => {
            const now = Date.now();
            const leases = Array.isArray(u.tenant_leases) ? u.tenant_leases : [];
            const activeCandidates = leases
              .filter((l: any) => {
                const status = String(l?.status || '').toLowerCase();
                const isEndedStatus = ['terminated', 'ended', 'inactive', 'cancelled', 'expired'].includes(status);
                const endDatePassed = l?.end_date ? new Date(l.end_date).getTime() <= now : false;
                return !isEndedStatus && !endDatePassed;
              })
              .sort((a: any, b: any) => {
                const aDate = new Date(a?.start_date || a?.created_at || 0).getTime();
                const bDate = new Date(b?.start_date || b?.created_at || 0).getTime();
                return bDate - aDate;
              });
            const activeLease = activeCandidates[0];
            let leaseInfo = undefined;
            if (activeLease) {
                 const tenant = tenantData?.find(t => t.id === activeLease.tenant_id);
                 leaseInfo = {
                     id: activeLease.id,
                     tenant_id: activeLease.tenant_id,
                     tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unknown Tenant',
                     status: activeLease.status
                 };
            }
            
            // Manual join for unit types
            const uType = typeData?.find((t: any) => t.id === u.unit_type_id);
            const mappedType = uType ? {
                id: uType.id,
                name: uType.name || uType.unit_type_name || 'Standard',
                price_per_unit: uType.price_per_unit || 0,
                unit_category: uType.unit_category || 'residential',
                property_id: uType.property_id
            } : undefined;

            return { 
                ...u, 
                active_lease: leaseInfo,
                property_unit_types: u.property_unit_types || mappedType // Use join from DB if it worked, or manual fallback
            };
        });
        
        // Sort units by floor then by unit number (natural sort)
        unitsWithDetails.sort((a: any, b: any) => {
          const aFloor = String(a.floor_number || 'G');
          const bFloor = String(b.floor_number || 'G');
          const floorOrder: { [key: string]: number } = { 'B5': -5, 'B4': -4, 'B3': -3, 'B2': -2, 'B1': -1, 'B': -1, 'G': 0, 'M': 0.5 };
          const aFloorNum = floorOrder[aFloor] ?? parseInt(aFloor) ?? 0;
          const bFloorNum = floorOrder[bFloor] ?? parseInt(bFloor) ?? 0;
          if (aFloorNum !== bFloorNum) return aFloorNum - bFloorNum;
          return String(a.unit_number || '').localeCompare(String(b.unit_number || ''), undefined, { numeric: true, sensitivity: 'base' });
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

  const createMoveInAllocationInvoice = async (tenantProfileId: string, leaseApplicationId?: string) => {
    if (!selectedUnit) return null;

    const applicationTag = leaseApplicationId ? `LEASE_APPLICATION_ID:${leaseApplicationId}` : null;
    const onboardingFilter = 'notes.ilike.%BILLING_EVENT:first_payment%,notes.ilike.%BILLING_EVENT:unit_allocation%';
    const notesFilter = applicationTag ? `${onboardingFilter},notes.ilike.%${applicationTag}%` : onboardingFilter;

    const { data: existingInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, notes')
      .eq('tenant_id', tenantProfileId)
      .eq('property_id', selectedUnit.property_id)
      .in('status', ['unpaid', 'overdue'])
      .or(notesFilter)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invoiceError && invoiceError.code !== 'PGRST116') {
      throw invoiceError;
    }

    if (!existingInvoice?.id) {
      return null;
    }

    const existingNotes = String(existingInvoice.notes || '');
    const metadataLines = [
      `LEASE_APPLICATION_ID:${leaseApplicationId || ''}`,
      `APPLICANT_ID:${tenantProfileId}`,
      `UNIT_ID:${selectedUnit.id}`,
      `PROPERTY_ID:${selectedUnit.property_id}`,
      `UNIT_NUMBER:${selectedUnit.unit_number || ''}`,
      `UNIT_TYPE_ID:${selectedUnit.unit_type_id || ''}`,
      `UNIT_TYPE_NAME:${selectedUnit.property_unit_types?.name || ''}`,
    ].filter((line) => !line.endsWith(':'));

    const missingLines = metadataLines.filter((line) => !existingNotes.includes(line));
    if (missingLines.length > 0) {
      const mergedNotes = existingNotes ? `${existingNotes}\n${missingLines.join('\n')}` : missingLines.join('\n');
      const { error: updateNotesError } = await supabase
        .from('invoices')
        .update({ notes: mergedNotes })
        .eq('id', existingInvoice.id);

      if (updateNotesError) throw updateNotesError;
    }

    return existingInvoice.id;
  };

  const assignTenantToUnit = async (
    tenantUserId: string,
    options: { allowPendingTenant?: boolean; createInitialInvoice?: boolean } = {}
  ) => {
    if (!selectedUnit || !tenantUserId) return;

    try {
      setSavingUnit(true);
      const now = new Date().toISOString();

      const { data: selectedTenantProfile, error: selectedTenantProfileError } = await supabase
        .from('profiles')
        .select('id, status, role')
        .eq('id', tenantUserId)
        .maybeSingle();

      if (selectedTenantProfileError) throw selectedTenantProfileError;
      if (!selectedTenantProfile) {
        toast.error('Selected tenant profile not found');
        return;
      }

      const tenantStatus = String(selectedTenantProfile.status || '').toLowerCase();
      if (!options.allowPendingTenant && tenantStatus !== 'active') {
        toast.error('This tenant is pending approval and cannot be assigned yet.');
        return;
      }

      const activeStatuses = ['active', 'approved', 'manager_approved', 'ongoing', 'current'];
      let conflictQuery = supabase
        .from('tenant_leases')
        .select('id, unit_id, status, units(unit_number)')
        .eq('tenant_id', tenantUserId)
        .in('status', activeStatuses);

      if (selectedUnit.active_lease?.id) {
        conflictQuery = conflictQuery.neq('id', selectedUnit.active_lease.id);
      }

      const { data: conflictingLeases, error: conflictError } = await conflictQuery.limit(1);
      if (conflictError) throw conflictError;

      if (conflictingLeases && conflictingLeases.length > 0) {
        const conflict: any = conflictingLeases[0];
        const conflictUnit = conflict?.units?.unit_number || 'another unit';
        toast.error(`This tenant is already assigned to unit ${conflictUnit}. Unassign first.`);
        return;
      }

      const { data: existingTenant, error: checkError } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', tenantUserId)
        .limit(1)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Database check failed: ${checkError.message}`);
      }

      let tenantRecordId = existingTenant?.id as string | undefined;
      if (existingTenant) {
        const { error: updateError } = await supabase
          .from('tenants')
          .update({
            property_id: selectedUnit.property_id,
            unit_id: selectedUnit.id,
            move_in_date: now,
            status: 'active'
          })
          .eq('id', existingTenant.id);

        if (updateError) throw updateError;
      } else {
        const { data: insertedTenant, error: insertError } = await supabase
          .from('tenants')
          .insert({
            user_id: tenantUserId,
            property_id: selectedUnit.property_id,
            unit_id: selectedUnit.id,
            move_in_date: now,
            status: 'active'
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        tenantRecordId = insertedTenant?.id;
      }

      if (selectedUnit.active_lease) {
        const { error } = await supabase
          .from('tenant_leases')
          .update({ tenant_id: tenantUserId })
          .eq('id', selectedUnit.active_lease.id);

        if (error) throw error;
        toast.success('Assignment updated successfully');
      } else {
        const { data: insertedLease, error: leaseError } = await supabase
          .from('tenant_leases')
          .insert({
            unit_id: selectedUnit.id,
            tenant_id: tenantUserId,
            start_date: now,
            rent_amount: selectedUnit.property_unit_types?.price_per_unit || 0,
            status: 'active'
          })
          .select('id')
          .single();

        if (leaseError) throw leaseError;

        const { error: unitError } = await supabase
          .from('units')
          .update({ status: 'occupied' })
          .eq('id', selectedUnit.id);
        if (unitError) throw unitError;

        if (options.createInitialInvoice && insertedLease?.id) {
          try {
            const linkedInvoiceId = await createMoveInAllocationInvoice(tenantUserId, insertedLease.id);
            if (linkedInvoiceId) {
              toast.success('Tenant linked to existing Super Admin billing invoice.');
            } else {
              toast.info('Tenant assigned. Super Admin should issue the onboarding invoice from Billing and Invoicing.');
            }
          } catch (invoiceError: any) {
            console.error('Failed to create initial invoice:', invoiceError);
            toast.warning('Tenant assigned, but linking to Billing invoice failed.');
          }
        }

        toast.success('Tenant assigned successfully');
      }

      setIsAssignOpen(false);
      loadUnits();
    } catch (e: any) {
      console.error('❌ Assignment error:', e);
      if (e.message?.includes('409') || e.code === '409' || (typeof e === 'object' && JSON.stringify(e).includes('409'))) {
        toast.error('User is already a tenant elsewhere. Ask admin to resolve previous assignment first.');
      } else {
        toast.error('Failed to save assignment: ' + (e.message || JSON.stringify(e)));
      }
    } finally {
      setSavingUnit(false);
    }
  };

  const handleAssignTenant = async () => {
    if (!selectedTenant) return;
    await assignTenantToUnit(selectedTenant, { allowPendingTenant: false, createInitialInvoice: false });
  };

  const loadApplicantCandidates = async () => {
    try {
      const targetPropertyId = selectedUnit?.property_id || propertyId;
      if (!targetPropertyId) {
        setApplicantCandidates([]);
        return;
      }

      let applicationsQuery = supabase
        .from('lease_applications')
        .select(`
          id,
          applicant_id,
          applicant_name,
          applicant_email,
          status
        `)
        .eq('property_id', targetPropertyId)
        .in('status', ['pending', 'under_review', 'approved'])
        .order('created_at', { ascending: false });

      if (selectedUnit?.id) {
        applicationsQuery = applicationsQuery.eq('unit_id', selectedUnit.id);
      }

      const { data, error } = await applicationsQuery;

      if (error) throw error;

      const assignedTenantIds = new Set(
        units
          .map((unit) => unit.active_lease?.tenant_id)
          .filter((tenantId): tenantId is string => Boolean(tenantId))
      );

      const uniqueByApplicant = new Map<string, ApplicantCandidate>();
      (data || []).forEach((row: any) => {
        if (!row?.applicant_id) return;
        if (assignedTenantIds.has(row.applicant_id)) return;

        if (!uniqueByApplicant.has(row.applicant_id)) {
          uniqueByApplicant.set(row.applicant_id, {
            application_id: row.id,
            applicant_id: row.applicant_id,
            name: row.applicant_name || 'Unknown Applicant',
            email: row.applicant_email || 'No email',
            status: row.status || 'pending',
          });
        }
      });

      setApplicantCandidates(Array.from(uniqueByApplicant.values()));
    } catch (error) {
      console.error('Error loading applicant candidates:', error);
      toast.error('Failed to load applicants');
      setApplicantCandidates([]);
    }
  };

  const handleAddTenantFromApplicants = async () => {
    if (!selectedApplicantId) {
      toast.error('Please select an applicant');
      return;
    }

    try {
      setIsCreatingTenantUser(true);
      const candidate = applicantCandidates.find((a) => a.applicant_id === selectedApplicantId);
      if (!candidate) {
        toast.error('Selected applicant not found');
        return;
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          role: 'tenant',
          user_type: 'tenant',
          status: 'pending',
          is_active: false,
          assigned_property_id: selectedUnit?.property_id || propertyId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', candidate.applicant_id);

      if (profileUpdateError) {
        throw new Error(`Failed to update applicant profile: ${profileUpdateError.message}`);
      }

      const linkedInvoiceId = await createMoveInAllocationInvoice(candidate.applicant_id, candidate.application_id);

      const { error: appStatusError } = await supabase
        .from('lease_applications')
        .update({ status: 'under_review' })
        .eq('id', candidate.application_id);

      if (appStatusError) throw appStatusError;

      setSelectedTenant(candidate.applicant_id);
      setIsAddTenantOpen(false);
      if (linkedInvoiceId) {
        toast.success('Tenant linked to Super Admin invoice. Unit allocation will happen automatically after successful payment.');
      } else {
        toast.success('Applicant moved to under review. Awaiting Super Admin Billing invoice before checkout.');
      }
    } catch (error: any) {
      console.error('Error adding tenant from applicants:', error);
      toast.error(error.message || 'Failed to add tenant from applicants');
    } finally {
      setIsCreatingTenantUser(false);
    }
  };

  const handleCreateTenantUser = async () => {
    const email = newTenantForm.email.trim().toLowerCase();
    const firstName = newTenantForm.first_name.trim();
    const lastName = newTenantForm.last_name.trim();
    const phone = newTenantForm.phone.trim();
    const password = newTenantForm.password;

    if (!email || !firstName || !lastName || !phone || !password) {
      toast.error('Please complete first name, last name, email, phone and password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please provide a valid email address');
      return;
    }

    try {
      setIsCreatingTenantUser(true);

      const occupantsCountRaw = parseInt(newTenantForm.occupants_count, 10);
      const occupantsCount = Number.isFinite(occupantsCountRaw) && occupantsCountRaw > 0 ? occupantsCountRaw : 1;
      const childrenCountRaw = parseInt(newTenantForm.children_count, 10);
      const childrenCount = Number.isFinite(childrenCountRaw) && childrenCountRaw >= 0 ? childrenCountRaw : 0;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
            role: 'tenant',
            status: 'pending',
          },
        },
      });

      if (authError || !authData.user?.id) {
        throw new Error(authError?.message || 'Failed to create tenant user');
      }

      const tenantUserId = authData.user.id;

      const { error: profileUpsertError } = await supabase
        .from('profiles')
        .upsert({
          id: tenantUserId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          role: 'tenant',
          user_type: 'tenant',
          status: 'pending',
          is_active: false,
          assigned_property_id: selectedUnit?.property_id || propertyId || null,
          updated_at: new Date().toISOString(),
        });

      if (profileUpsertError) {
        throw new Error(`Failed to save tenant profile: ${profileUpsertError.message}`);
      }

      const applicationInsertPayload = {
        applicant_id: tenantUserId,
        property_id: selectedUnit?.property_id || propertyId,
        unit_id: selectedUnit?.id,
        status: 'under_review',
        applicant_name: `${firstName} ${lastName}`,
        applicant_email: email,
        telephone_numbers: phone,
        physical_address: newTenantForm.physical_address.trim() || null,
        po_box: newTenantForm.po_box.trim() || null,
        employer_details: newTenantForm.employer_details.trim() || null,
        marital_status: newTenantForm.marital_status || null,
        children_count: childrenCount,
        age_bracket: newTenantForm.age_bracket || null,
        occupants_count: occupantsCount,
        next_of_kin: newTenantForm.next_of_kin.trim() || null,
        next_of_kin_email: newTenantForm.next_of_kin_email.trim() || null,
        nationality: newTenantForm.nationality.trim() || null,
        house_staff: Boolean(newTenantForm.house_staff),
        home_address: newTenantForm.home_address.trim() || null,
        location: newTenantForm.location.trim() || null,
        sub_location: newTenantForm.sub_location.trim() || null,
      };

      let { data: newApplication, error: newApplicationError } = await supabase
        .from('lease_applications')
        .insert(applicationInsertPayload)
        .select('id')
        .single();

      if (newApplicationError && String(newApplicationError.message || '').toLowerCase().includes('next_of_kin_email')) {
        const { next_of_kin_email, ...fallbackPayload } = applicationInsertPayload as any;
        ({ data: newApplication, error: newApplicationError } = await supabase
          .from('lease_applications')
          .insert(fallbackPayload)
          .select('id')
          .single());
      }

      if (newApplicationError) {
        throw new Error(`Failed to create lease application: ${newApplicationError.message}`);
      }

      const linkedInvoiceId = await createMoveInAllocationInvoice(tenantUserId, newApplication?.id);

      setSelectedTenant(tenantUserId);
      setNewTenantForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        physical_address: '',
        po_box: '',
        employer_details: '',
        marital_status: '',
        children_count: '',
        age_bracket: '',
        occupants_count: '1',
        next_of_kin: '',
        next_of_kin_email: '',
        nationality: '',
        house_staff: false,
        home_address: '',
        location: '',
        sub_location: '',
      });
      setIsAddTenantOpen(false);
      if (linkedInvoiceId) {
        toast.success('Tenant created and linked to Super Admin invoice. Unit allocation will happen after payment is confirmed.');
      } else {
        toast.success('Tenant created and moved to under review. Awaiting Super Admin Billing invoice before checkout.');
      }
    } catch (error: any) {
      console.error('Error creating tenant user:', error);
      toast.error(error.message || 'Failed to create tenant user');
    } finally {
      setIsCreatingTenantUser(false);
    }
  };

  // Handle Unassign Tenant from Unit
  const handleUnassignTenant = async () => {
      if(!selectedUnit || !selectedUnit.active_lease) {
          toast.error("No tenant assigned to this unit");
          return;
      }
      
      if (!window.confirm("Are you sure you want to unassign this tenant from the unit? This will end their lease.")) {
          return;
      }
      
      try {
          setSavingUnit(true);
          const tenantId = selectedUnit.active_lease.tenant_id;
          const leaseId = selectedUnit.active_lease.id;
          
          console.log("🔹 Starting tenant unassignment...", { tenantId, unitId: selectedUnit.id, leaseId });
          
          // 1. Update the lease status to 'terminated' instead of deleting
          console.log("📝 Terminating lease...");
          const { error: leaseError } = await supabase
              .from('tenant_leases')
              .update({ 
                  status: 'terminated',
                  end_date: new Date().toISOString()
              })
              .eq('id', leaseId);
          
          if(leaseError) throw leaseError;
          console.log("✅ Lease terminated");
          
          // 2. Clear the tenant's unit assignment
          console.log("📝 Clearing tenant unit assignment...");
          const { error: tenantError } = await supabase
              .from('tenants')
              .update({
                  unit_id: null,
                  status: 'inactive',
                  move_out_date: new Date().toISOString()
              })
              .eq('user_id', tenantId);
          
          if(tenantError) {
              console.warn("Warning: Could not update tenant record:", tenantError);
          } else {
              console.log("✅ Tenant record updated");
          }
          
          // 3. Update unit status back to 'vacant'
          console.log("🔄 Updating unit status to vacant...");
          const { error: unitError } = await supabase
              .from('units')
              .update({ status: 'vacant' })
              .eq('id', selectedUnit.id);
          
          if(unitError) throw unitError;
          console.log("✅ Unit status updated to vacant");
          
          toast.success("Tenant unassigned successfully");
          setIsDetailsOpen(false);
          loadUnits();
      } catch(e: any) {
          console.error("❌ Unassignment error:", e);
          toast.error("Failed to unassign tenant: " + (e.message || JSON.stringify(e)));
      } finally {
          setSavingUnit(false);
      }
  };

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.unit_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty = filterProperty === 'all' || unit.property_id === filterProperty;
    const matchesUnitType = filterUnitType === 'all' || unit.unit_type_id === filterUnitType;
    
    let matchesPrice = true;
    if (filterPriceRange !== 'all') {
      const price = unit.price || unitTypes.find(t => t.id === unit.unit_type_id)?.price_per_unit || 0;
      if (filterPriceRange === '0-10000') matchesPrice = price < 10000;
      else if (filterPriceRange === '10000-20000') matchesPrice = price >= 10000 && price <= 20000;
      else if (filterPriceRange === '20000-50000') matchesPrice = price > 20000 && price <= 50000;
      else if (filterPriceRange === '50000+') matchesPrice = price > 50000;
    }

    return matchesSearch && matchesProperty && matchesUnitType && matchesPrice;
  });

  const assignedTenantIds = new Set(
    units
      .map((unit) => unit.active_lease?.tenant_id)
      .filter((tenantId): tenantId is string => Boolean(tenantId))
  );

  const selectableTenants = tenants.filter((tenant) => {
    const isCurrentAssigned = selectedUnit?.active_lease?.tenant_id === tenant.id;
    return isCurrentAssigned || !assignedTenantIds.has(tenant.id);
  });

  const toggleProperty = (propId: string) => {
    setExpandedProps(prev => ({
      ...prev,
      [propId]: !prev[propId]
    }));
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'occupied') return 'bg-green-100 text-green-800';
    if (s === 'booked') return 'bg-purple-100 text-purple-800';
    if (s === 'vacant') return 'bg-yellow-100 text-yellow-800';
    if (s === 'maintenance') return 'bg-red-100 text-red-800';
    if (s === 'available') return 'bg-yellow-100 text-yellow-800';
    return 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full h-full p-4 md:p-6 lg:p-8 space-y-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-slate-800">Units</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="List View"
                >
                  <List size={18} />
                </button>
              </div>
              <Button
                onClick={() => {
                  setAddTenantMode('create_user');
                  setSelectedApplicantId('');
                  setIsAddTenantOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" /> Add Tenant
              </Button>
            </div>
          </div>
          <p className="text-slate-500 ml-1">Manage all units across your properties</p>
        </div>

        {/* Add Unit Dialog */}
        <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white border-slate-100 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-slate-800">Add New Unit</DialogTitle>
              <DialogDescription className="text-slate-500">
                Create a new unit record. These details will be visible to potential tenants.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="property_id" className="text-slate-700">Property <span className="text-red-500">*</span></Label>
                <Select 
                    value={propertyId} 
                    onValueChange={(val) => setPropertyId(val)}
                >
                  <SelectTrigger className="bg-white border-slate-200 focus:ring-blue-500">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="unit_number" className="text-slate-700">Unit Number <span className="text-red-500">*</span></Label>
                    <Input 
                      id="unit_number" 
                      placeholder="e.g. A101" 
                      value={newUnit.unit_number} 
                      onChange={(e) => setNewUnit({...newUnit, unit_number: e.target.value})}
                      className="bg-white border-slate-200 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="floor_number" className="text-slate-700">Floor Number</Label>
                    <Input 
                      id="floor_number" 
                      type="number"
                      placeholder="e.g. 1" 
                      value={newUnit.floor_number} 
                      onChange={(e) => setNewUnit({...newUnit, floor_number: e.target.value})}
                      className="bg-white border-slate-200 focus:ring-blue-500"
                    />
                  </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit_type" className="text-slate-700">Unit Type <span className="text-red-500">*</span></Label>
                <Select 
                    value={newUnit.unit_type_id} 
                    onValueChange={(val) => setNewUnit({...newUnit, unit_type_id: val})}
                >
                  <SelectTrigger className="bg-white border-slate-200 focus:ring-blue-500">
                    <SelectValue placeholder="Select unit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitTypes.filter(t => !propertyId || t.property_id === propertyId).map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.unit_category}) - {type.price_per_unit?.toLocaleString()} KES
                      </SelectItem>
                    ))}
                    {unitTypes.filter(t => !propertyId || t.property_id === propertyId).length === 0 && (
                        <div className="p-2 text-sm text-slate-500 text-center">
                            No unit types found for this property.
                        </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="features" className="text-slate-700">Features</Label>
                 <Input 
                      id="features" 
                      placeholder="e.g. Balcony, AC, Wifi" 
                      value={newUnit.features} 
                      onChange={(e) => setNewUnit({...newUnit, features: e.target.value})}
                      className="bg-white border-slate-200 focus:ring-blue-500"
                    />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select 
                    value={newUnit.status} 
                    onValueChange={(val) => setNewUnit({...newUnit, status: val})}
                >
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant" className="text-blue-700">Vacant</SelectItem>
                    <SelectItem value="occupied" className="text-emerald-700">Occupied</SelectItem>
                    <SelectItem value="booked" className="text-purple-700">Booked</SelectItem>
                    <SelectItem value="maintenance" className="text-amber-700">Maintenance</SelectItem>
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
                  className="bg-white border-slate-200 focus:ring-blue-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUnitOpen(false)} disabled={savingUnit} className="border-slate-200 hover:bg-slate-50 text-slate-600">
                Cancel
              </Button>
              <Button onClick={handleAddUnit} disabled={savingUnit} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold">
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
          <Dialog open={isAddTenantOpen} onOpenChange={setIsAddTenantOpen}>
            <DialogContent className="bg-white border-slate-100 shadow-xl max-w-3xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                   <DialogTitle className="text-slate-800">Add Tenant</DialogTitle>
                   <DialogDescription className="text-slate-500">
                     Create a tenant or pick an applicant, then send the initial invoice. Assignment completes automatically after payment.
                   </DialogDescription>
               </DialogHeader>

               <div className="space-y-4 py-2">
                  <div>
                    <Label className="text-slate-700 mb-2 block">Add Method</Label>
                    <Select value={addTenantMode} onValueChange={(val: 'create_user' | 'from_applicants') => setAddTenantMode(val)}>
                      <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Choose method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="create_user">Create User</SelectItem>
                        <SelectItem value="from_applicants">Add From Applicants</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {addTenantMode === 'create_user' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">First Name</Label>
                        <Input
                          value={newTenantForm.first_name}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, first_name: e.target.value }))}
                          placeholder="First name"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">Last Name</Label>
                        <Input
                          value={newTenantForm.last_name}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, last_name: e.target.value }))}
                          placeholder="Last name"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-slate-700 mb-1 block">Email</Label>
                        <Input
                          type="email"
                          value={newTenantForm.email}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="tenant@example.com"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">Phone</Label>
                        <Input
                          value={newTenantForm.phone}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="Phone"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">Password</Label>
                        <Input
                          type="password"
                          value={newTenantForm.password}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, password: e.target.value }))}
                          placeholder="At least 6 characters"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">Physical Address</Label>
                        <Input
                          value={newTenantForm.physical_address}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, physical_address: e.target.value }))}
                          placeholder="Apartment/House, Street"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">P.O. Box</Label>
                        <Input
                          value={newTenantForm.po_box}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, po_box: e.target.value }))}
                          placeholder="P.O. Box"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">Marital Status</Label>
                        <Select
                          value={newTenantForm.marital_status || 'none'}
                          onValueChange={(val) => setNewTenantForm((prev) => ({ ...prev, marital_status: val === 'none' ? '' : val }))}
                        >
                          <SelectTrigger className="bg-white border-slate-200">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not set</SelectItem>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">Age Bracket</Label>
                        <Select
                          value={newTenantForm.age_bracket || 'none'}
                          onValueChange={(val) => setNewTenantForm((prev) => ({ ...prev, age_bracket: val === 'none' ? '' : val }))}
                        >
                          <SelectTrigger className="bg-white border-slate-200">
                            <SelectValue placeholder="Select bracket" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not set</SelectItem>
                            <SelectItem value="18-25">18-25</SelectItem>
                            <SelectItem value="26-35">26-35</SelectItem>
                            <SelectItem value="36-45">36-45</SelectItem>
                            <SelectItem value="46-55">46-55</SelectItem>
                            <SelectItem value="55+">55+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">Occupants Count</Label>
                        <Input
                          type="number"
                          min={1}
                          value={newTenantForm.occupants_count}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, occupants_count: e.target.value }))}
                          placeholder="1"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">Children Count</Label>
                        <Input
                          type="number"
                          min={0}
                          value={newTenantForm.children_count}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, children_count: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">Nationality</Label>
                        <Input
                          value={newTenantForm.nationality}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, nationality: e.target.value }))}
                          placeholder="e.g. Kenyan"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">Live-in House Staff</Label>
                        <Select
                          value={newTenantForm.house_staff ? 'yes' : 'no'}
                          onValueChange={(val) => setNewTenantForm((prev) => ({ ...prev, house_staff: val === 'yes' }))}
                        >
                          <SelectTrigger className="bg-white border-slate-200">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-slate-700 mb-1 block">Next of Kin</Label>
                        <Input
                          value={newTenantForm.next_of_kin}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, next_of_kin: e.target.value }))}
                          placeholder="Name and contact"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-slate-700 mb-1 block">Next of Kin Email</Label>
                        <Input
                          type="email"
                          value={newTenantForm.next_of_kin_email}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, next_of_kin_email: e.target.value }))}
                          placeholder="kin@example.com"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-slate-700 mb-1 block">Employer Details</Label>
                        <Textarea
                          value={newTenantForm.employer_details}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, employer_details: e.target.value }))}
                          placeholder="Employer name and address"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">Home Address</Label>
                        <Input
                          value={newTenantForm.home_address}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, home_address: e.target.value }))}
                          placeholder="Village / Estate"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-slate-700 mb-1 block">Location</Label>
                        <Input
                          value={newTenantForm.location}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, location: e.target.value }))}
                          placeholder="County / City"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-slate-700 mb-1 block">Sub-Location</Label>
                        <Input
                          value={newTenantForm.sub_location}
                          onChange={(e) => setNewTenantForm((prev) => ({ ...prev, sub_location: e.target.value }))}
                          placeholder="Ward / Area"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-slate-700 mb-2 block">Select Applicant</Label>
                      <Select value={selectedApplicantId} onValueChange={setSelectedApplicantId}>
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Choose applicant" />
                        </SelectTrigger>
                        <SelectContent>
                          {applicantCandidates.map((candidate) => (
                            <SelectItem key={candidate.applicant_id} value={candidate.applicant_id}>
                              {candidate.name} ({candidate.email})
                            </SelectItem>
                          ))}
                          {applicantCandidates.length === 0 && (
                            <div className="p-2 text-sm text-center text-slate-500">No unassigned applicants found</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-xs p-3">
                    The tenant receives an initial invoice first. Unit allocation is completed automatically after successful payment.
                  </div>
               </div>

               <DialogFooter>
                   <Button variant="outline" onClick={() => setIsAddTenantOpen(false)} className="border-slate-200 hover:bg-slate-50 text-slate-600">Cancel</Button>
                   <Button
                     onClick={addTenantMode === 'create_user' ? handleCreateTenantUser : handleAddTenantFromApplicants}
                     disabled={isCreatingTenantUser}
                     className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
                   >
                     {isCreatingTenantUser ? 'Processing...' : 'Create / Send Invoice'}
                   </Button>
               </DialogFooter>
           </DialogContent>
        </Dialog>

        {/* Assign Tenant Dialog */}
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
           <DialogContent className="bg-white border-slate-100 shadow-xl">
               <DialogHeader>
                   <DialogTitle className="text-slate-800">Assign Tenant to Unit {selectedUnit?.unit_number}</DialogTitle>
                   <DialogDescription className="text-slate-500">
                       Select a tenant to assign this unit to. This will create an active lease.
                   </DialogDescription>
               </DialogHeader>
               <div className="py-4">
                   <Label className="text-slate-700 mb-2 block">Select Tenant</Label>
                   <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                       <SelectTrigger className="bg-white border-slate-200 focus:ring-blue-500"><SelectValue placeholder="Search tenant..." /></SelectTrigger>
                       <SelectContent>
                       {selectableTenants.map(t => (
                               <SelectItem key={t.id} value={t.id}>
                                   {t.first_name} {t.last_name} ({t.email})
                               </SelectItem>
                           ))}
                       {selectableTenants.length === 0 && <div className="p-2 text-sm text-center text-slate-500">No unassigned tenants found</div>}
                       </SelectContent>
                   </Select>
               </div>
               <DialogFooter>
                   <Button variant="outline" onClick={() => setIsAssignOpen(false)} className="border-slate-200 hover:bg-slate-50 text-slate-600">Cancel</Button>
                   <Button onClick={handleAssignTenant} disabled={savingUnit} className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm font-semibold border-orange-600 border-b-2 active:translate-y-[1px] active:border-b-0 transition-all">
                       {savingUnit ? 'Assigning...' : 'Assign Tenant'}
                   </Button>
               </DialogFooter>
           </DialogContent>
        </Dialog>

        {/* View Details Dialog - Full View (Form Layout) */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="max-w-6xl h-[90vh] p-0 bg-white flex flex-col gap-0 overflow-hidden outline-none border-0 shadow-lg">
                
                {/* Fixed Header */}
                <div className="bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center shrink-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                            Unit {selectedUnit?.unit_number} Details
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-bold ${
                                selectedUnit?.active_lease 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                                {selectedUnit?.active_lease ? 'Occupied' : selectedUnit?.status || 'Vacant'}
                            </span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">View and manage unit specifications</p>
                    </div>
                    <div className="flex gap-3">
                         <Button 
                            variant="outline" 
                            onClick={() => setIsDetailsOpen(false)} 
                            className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                         >
                            Cancel
                         </Button>
                         <Button 
                            onClick={handleSaveUnitChanges} 
                            disabled={savingUnit} 
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold px-6 border-transparent"
                         >
                            {savingUnit ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                                </>
                            ) : 'Save Changes'}
                         </Button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        
                        {/* LEFT COLUMN - MAIN INFO form */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Property Information Card */}
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                <h3 className="text-base font-bold text-slate-800 mb-6 pb-4 border-b border-slate-50">Property Information</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="info-unit-number" className="text-slate-700 font-semibold">Unit Number</Label>
                                        <Input 
                                            id="info-unit-number" 
                                            value={selectedUnit?.unit_number} 
                                            disabled 
                                            className="bg-slate-50 border-slate-200 text-slate-500 font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="info-floor" className="text-slate-700 font-semibold">Floor Level</Label>
                                        <Input 
                                            id="info-floor" 
                                            value={editConfig.floor_number}
                                            onChange={(e) => setEditConfig({...editConfig, floor_number: e.target.value})}
                                            className="bg-white border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Ex. 1"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="info-type" className="text-slate-700 font-semibold">Property Type</Label>
                                        <Select 
                                            value={editConfig.unit_type_id} 
                                            onValueChange={(val) => setEditConfig({...editConfig, unit_type_id: val})}
                                        >
                                          <SelectTrigger id="info-type" className="bg-white border-slate-200 focus:ring-blue-500">
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
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="info-status" className="text-slate-700 font-semibold">Availability Status</Label>
                                        <Select 
                                            value={editConfig.status} 
                                            onValueChange={(val) => setEditConfig({...editConfig, status: val})}
                                        >
                                          <SelectTrigger id="info-status" className="bg-white border-slate-200 focus:ring-blue-500">
                                            <SelectValue placeholder="Select status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="vacant" className="text-blue-700 font-medium">Vacant</SelectItem>
                                            <SelectItem value="occupied" className="text-emerald-700 font-medium">Occupied</SelectItem>
                                            <SelectItem value="booked" className="text-purple-700 font-medium">Booked</SelectItem>
                                            <SelectItem value="maintenance" className="text-amber-700 font-medium">Maintenance</SelectItem>
                                          </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Specifications Card */}
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                <h3 className="text-base font-bold text-slate-800 mb-6 pb-4 border-b border-slate-50">Property Details</h3>
                                
                                <div className="space-y-6">
                                     <div className="space-y-2">
                                        <Label htmlFor="info-features" className="text-slate-700 font-semibold">Features & Amenities</Label>
                                        <Input 
                                            id="info-features" 
                                            value={editConfig.features}
                                            onChange={(e) => setEditConfig({...editConfig, features: e.target.value})}
                                            className="bg-white border-slate-200 focus:ring-blue-500 rounded-lg"
                                            placeholder="Ex. Balcony, AC, Parking, Wifi"
                                        />
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {editConfig.features.split(',').filter(f => f.trim()).map((f, i) => (
                                                <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-100">{f.trim()}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="info-desc" className="text-slate-700 font-semibold">Description</Label>
                                        <Textarea 
                                            id="info-desc" 
                                            rows={5}
                                            value={editConfig.description}
                                            onChange={(e) => setEditConfig({...editConfig, description: e.target.value})}
                                            className="bg-white border-slate-200 focus:ring-blue-500 resize-none leading-relaxed rounded-lg"
                                            placeholder="Describe the unit layout, view, and key selling points..."
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN - MEDIA & ACTIONS */}
                        <div className="space-y-6">
                            
                            {/* Image Upload Card */}
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                <h3 className="text-base font-bold text-slate-800 mb-4">Property Image</h3>
                                
                                <div className="space-y-4">
                                     <div className="relative aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-blue-400 transition-all group cursor-pointer shadow-inner">
                                        {selectedUnit?.image_url ? (
                                            <>
                                                <img src={selectedUnit.image_url} alt="Unit" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <p className="text-white font-bold text-sm flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                                                        <Camera className="w-4 h-4 mr-2"/> Change Image
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                                                    <ImageIcon className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">Click to upload photo</p>
                                            </div>
                                        )}
                                        
                                        <label htmlFor="upload-cover" className="absolute inset-0 cursor-pointer">
                                            <Input 
                                                id="upload-cover" 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={handleImageUpload}
                                                disabled={uploadingImage}
                                            />
                                        </label>
                                        {uploadingImage && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 text-center">
                                        Supported: JPG, PNG, WEBP. Max 5MB.
                                    </p>
                                </div>
                            </div>

                            {/* Price Card */}
                            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                <h3 className="text-base font-bold text-slate-800 mb-4">Pricing</h3>
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl p-5 border border-blue-100">
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">Monthly Rent</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-semibold text-blue-700">KES</span>
                                        <span className="text-3xl font-bold text-slate-900">
                                            {(editConfig.price || 0).toLocaleString()} 
                                        </span>
                                    </div>
                                    <p className="text-xs text-blue-400 mt-2 font-medium">
                                        Base price derived from Unit Type.
                                    </p>
                                </div>
                            </div>

                            {/* Lease / Tenant Actions */}
                             <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                <h3 className="text-base font-bold text-slate-800 mb-4">Lease Management</h3>
                                
                                {selectedUnit?.active_lease ? ( // Occupied State
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Current Tenant</p>
                                                <p className="font-bold text-slate-800 truncate text-sm">{selectedUnit.active_lease.tenant_name}</p>
                                            </div>
                                        </div>
                                        
                                        <Button 
                                            variant="outline" 
                                            onClick={() => {
                                                setSelectedTenant(selectedUnit.active_lease!.tenant_id);
                                                setIsAssignOpen(true);
                                            }}
                                            className="w-full bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 font-semibold"
                                        >
                                            Reassign Tenant
                                        </Button>
                                        
                                        <Button 
                                            variant="outline" 
                                            onClick={handleUnassignTenant}
                                            disabled={savingUnit}
                                            className="w-full bg-white text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-semibold"
                                        >
                                            {savingUnit ? 'Unassigning...' : 'Unassign Tenant'}
                                        </Button>
                                    </div>
                                ) : ( // Vacant State
                                    <div className="space-y-4">
                                        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                            <p className="text-slate-500 text-sm mb-4 font-medium">Unit is currently vacant.</p>
                                            <Button 
                                                onClick={() => {
                                                setAddTenantMode('from_applicants');
                                                setSelectedApplicantId('');
                                                setIsAddTenantOpen(true);
                                                }}
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-sm font-bold border-orange-600 border-b-2 active:translate-y-[1px] active:border-b-0 transition-all"
                                            >
                                              <UserPlus className="w-4 h-4 mr-2" /> Add Tenant
                                            </Button>
                                        </div>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

{/* Search & Filters */}
        <div className="mb-6 flex flex-col xl:flex-row gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="text-slate-400 absolute left-3 top-3" /> 
            <Input
              className="pl-9 w-full bg-white"
              placeholder="Search units by number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 overflow-x-auto pb-1">
              <Select value={filterProperty} onValueChange={setFilterProperty}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white text-slate-700">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterUnitType} onValueChange={setFilterUnitType}>
                <SelectTrigger className="w-full sm:w-[160px] bg-white text-slate-700">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {unitTypes.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPriceRange} onValueChange={setFilterPriceRange}>
                <SelectTrigger className="w-full sm:w-[160px] bg-white text-slate-700">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Price</SelectItem>
                  <SelectItem value="0-10000">Under 10,000</SelectItem>
                  <SelectItem value="10000-20000">10,000 - 20,000</SelectItem>
                  <SelectItem value="20000-50000">20,000 - 50,000</SelectItem>
                  <SelectItem value="50000+">50,000+</SelectItem>
                </SelectContent>
              </Select>
          </div>
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
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-widest text-[11px] font-extrabold">
                  <tr>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Type & Category</th>
                    <th className="px-6 py-4">Floor</th>
                    <th className="px-6 py-4">Rent (KES)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUnits.map(unit => {
                    const unitType = unitTypes.find(t => t.id === unit.unit_type_id);
                    const displayStatus = (unit.active_lease ? 'occupied' : unit.status)?.toLowerCase() || 'vacant';
                    const isOccupied = displayStatus === 'occupied';
                    const isVacant = displayStatus === 'vacant' || displayStatus === 'available';

                    return (
                      <tr key={unit.id} className="hover:bg-slate-50/80 hover:shadow-[inset_4px_0_0_0_rgba(59,130,246,0.5)] transition-all duration-200 group cursor-pointer" onClick={() => openDetails(unit)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                {unit.image_url ? (
                                    <img src={unit.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                            <span className="font-extrabold text-slate-800 text-base">{unit.unit_number}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700">{unitType?.name || 'Unknown Type'}</span>
                            <span className="text-xs text-slate-500">{unitType?.unit_category || 'Std'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 font-medium">
                            {unit.floor_number ? `Floor ${unit.floor_number}` : 'Ground'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-blue-600">{(unit.price || unitType?.price_per_unit || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          {isOccupied ? (
                              <Badge className="bg-blue-100 text-blue-700 border-none font-semibold px-2.5 py-0.5">
                                  Occupied
                              </Badge>
                          ) : isVacant ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-none font-semibold px-2.5 py-0.5">
                                  Vacant
                              </Badge>
                          ) : (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-none font-semibold px-2.5 py-0.5">
                                  {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                              </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {isOccupied && unit.active_lease ? (
                                <>
                                    <Button 
                                        variant="outline" size="sm"
                                        className="h-8 text-xs bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                        onClick={() => openDetails(unit)}
                                    >
                                        View
                                    </Button>
                                    <Button 
                                        size="sm"
                                        className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm border-b-2 border-emerald-700 active:translate-y-[1px] active:border-b-0"
                                        onClick={() => { 
                                            setSelectedUnit(unit);
                                            setSelectedTenant(unit.active_lease!.tenant_id);
                                            setIsAssignOpen(true);
                                        }}
                                    >
                                        Manage
                                    </Button>
                                </>
                            ) : displayStatus === 'maintenance' ? (
                                <>
                                    <Button 
                                        variant="outline" size="sm"
                                        className="h-8 text-xs bg-white text-orange-600 border-orange-200 hover:bg-orange-50"
                                        onClick={() => openDetails(unit)}
                                    >
                                        Details
                                    </Button>
                                    <Button 
                                        size="sm"
                                        className="h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white shadow-sm border-b-2 border-orange-700 active:translate-y-[1px] active:border-b-0"
                                        onClick={() => openDetails(unit)}
                                    >
                                        Resolve
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button 
                                        variant="outline" size="sm"
                                        className="h-8 text-xs bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                                        onClick={() => openDetails(unit)}
                                    >
                                        Details
                                    </Button>
                                    <Button 
                                        size="sm"
                                        className="h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white shadow-sm border-b-2 border-orange-700 active:translate-y-[1px] active:border-b-0"
                                        onClick={() => { 
                                            setSelectedUnit(unit);
                                        setAddTenantMode('from_applicants');
                                        setSelectedApplicantId('');
                                        setIsAddTenantOpen(true);
                                        }}
                                    >
                                      Add Tenant
                                    </Button>
                                </>
                             )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredUnits.map(unit => {
              const unitType = unitTypes.find(t => t.id === unit.unit_type_id);
              const displayStatus = (unit.active_lease ? 'occupied' : unit.status)?.toLowerCase() || 'vacant';
              
              // Status Logic
              const isOccupied = displayStatus === 'occupied';
              const isVacant = displayStatus === 'vacant' || displayStatus === 'available';

              // Theme Selection Based on Category
              const categoryName = unitType?.unit_category || unitType?.name || 'default';
              const getTheme = (cat: string) => {
                  const sum = cat.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                  const themes = [
                      { // Emerald
                        wrapper: "hover:border-emerald-500 hover:shadow-emerald-500/30 via-emerald-500/5",
                        accent: "from-emerald-900 group-hover:from-emerald-500",
                        icon: "text-emerald-500"
                      },
                      { // Orange
                        wrapper: "hover:border-orange-500 hover:shadow-orange-500/30 via-orange-500/5",
                        accent: "from-orange-900 group-hover:from-orange-500",
                        icon: "text-orange-500"
                      },
                      { // Blue
                        wrapper: "hover:border-blue-500 hover:shadow-blue-500/30 via-blue-500/5",
                        accent: "from-blue-900 group-hover:from-blue-500",
                        icon: "text-blue-500"
                      },
                      { // Violet
                        wrapper: "hover:border-violet-500 hover:shadow-violet-500/30 via-violet-500/5",
                        accent: "from-violet-900 group-hover:from-violet-500",
                        icon: "text-violet-500"
                      }, 
                      { // Rose
                        wrapper: "hover:border-rose-500 hover:shadow-rose-500/30 via-rose-500/5",
                        accent: "from-rose-900 group-hover:from-rose-500",
                        icon: "text-rose-500"
                      },
                      { // Amber
                        wrapper: "hover:border-amber-500 hover:shadow-amber-500/30 via-amber-500/5",
                        accent: "from-amber-900 group-hover:from-amber-500",
                        icon: "text-amber-500"
                      }
                  ];
                  return themes[sum % themes.length];
              };
              const theme = getTheme(categoryName);

              return (
              <div key={unit.id} 
                  className={`group relative border-2 rounded-2xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer bg-gradient-to-br from-white to-slate-50 border-slate-300 hover:shadow-2xl hover:scale-[1.02] shadow-lg shadow-slate-300/30 ${theme.wrapper}`}
                  onClick={() => openDetails(unit)}
              >
                {/* Decorative Corner Accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-20 bg-gradient-to-br transition-all duration-300 z-20 ${theme.accent}`} style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />

                {/* Image / Header Section - Professional Style */}
                <div className="h-28 bg-slate-100 relative border-b border-slate-50">
                     {unit.image_url ? (
                         <>
                           <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors z-10" />
                           <img 
                              src={unit.image_url} 
                              alt={`Unit ${unit.unit_number}`} 
                              className="w-full h-full object-cover" 
                           />
                         </>
                     ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                             <div className="bg-white p-2 rounded-full shadow-sm mb-1 relative z-10">
                                <Building2 className={`w-5 h-5 ${theme.icon}`} strokeWidth={2} />
                             </div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">No Image</p>
                         </div>
                     )}
                     
                     {/* Status Badge - Floating Top Right */}
                     <div className="absolute top-3 right-3 z-20">
                        {isOccupied ? (
                            <Badge className="bg-blue-600 text-white border-none shadow-md hover:bg-blue-700 font-semibold px-2.5 py-0.5">
                                Occupied
                            </Badge>
                        ) : isVacant ? (
                            <Badge className="bg-emerald-600 text-white border-none shadow-md hover:bg-emerald-700 font-semibold px-2.5 py-0.5">
                                Vacant
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-orange-500 text-white border-none shadow-md font-semibold px-2.5 py-0.5">
                                {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                            </Badge>
                        )}
                     </div>
                </div>
                
                {/* Body Content */}
                <div className="p-3 flex flex-col flex-1 gap-2.5">
                    
                    {/* Header: Unit # and Price */}
                    <div className="flex justify-between items-start">
                         <div>
                             <h3 className="text-base font-extrabold text-blue-900 group-hover:text-blue-700 transition-colors">Unit {unit.unit_number}</h3>
                             <p className="text-xs text-blue-500 font-semibold truncate max-w-[120px]" title={unitType?.name}>
                                {unitType?.name || 'Unknown Type'}
                             </p>
                         </div>
                         <div className="text-right">
                             <span className="block text-base font-bold text-blue-600">
                               KES {(unit.price || unitType?.price_per_unit || 0).toLocaleString()}
                             </span>
                             <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wide">/ month</span>
                         </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-100 w-full" />

                    {/* Quick Specs */}
                    <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                         <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100 group-hover:border-indigo-100 transition-colors" title="Floor Number">
                             <div className="p-1.5 rounded-md bg-indigo-600 text-white shadow-sm shrink-0">
                                <Layers size={14} strokeWidth={2.5} />
                             </div>
                             <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Floor</p>
                                <span className="font-bold text-slate-700 leading-none">{unit.floor_number ? `${unit.floor_number}` : 'G'}</span>
                             </div>
                         </div>
                         <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100 group-hover:border-violet-100 transition-colors" title="Unit Category">
                             <div className="p-1.5 rounded-md bg-violet-600 text-white shadow-sm shrink-0">
                                <Maximize size={14} strokeWidth={2.5} />
                             </div>
                             <div className="overflow-hidden">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Type</p>
                                <span className="font-bold text-slate-700 truncate block leading-none">{unitType?.unit_category || 'Std'}</span>
                             </div>
                         </div>
                    </div>
                    
                    {/* Footer Actions */}
                    <div className="mt-auto pt-2 grid grid-cols-2 gap-2">
                         {isOccupied && unit.active_lease ? ( // Occupied
                            <>
                                <Button 
                                    className="w-full bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 font-bold text-xs shadow-sm h-9" 
                                    onClick={(e) => { e.stopPropagation(); openDetails(unit); }}
                                >
                                    View
                                </Button>
                                <Button 
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md border-b-2 border-emerald-700 active:translate-y-[1px] active:border-b-0 h-9"
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setSelectedUnit(unit);
                                        setSelectedTenant(unit.active_lease!.tenant_id);
                                        setIsAssignOpen(true);
                                    }}
                                >
                                    Manage
                                </Button>
                            </>
                         ) : displayStatus === 'maintenance' ? ( // Maintenance
                            <>
                                <Button 
                                    className="w-full bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 font-bold text-xs shadow-sm h-9"
                                    onClick={(e) => { e.stopPropagation(); openDetails(unit); }}
                                >
                                    Details
                                </Button>
                                <Button 
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md border-b-2 border-orange-700 active:translate-y-[1px] active:border-b-0 h-9"
                                    onClick={(e) => { e.stopPropagation(); openDetails(unit); }}
                                >
                                    Resolve
                                </Button>
                            </>
                         ) : ( // Vacant
                            <>
                                <Button 
                                    className="w-full bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 font-bold text-xs shadow-sm h-9"
                                    onClick={(e) => { e.stopPropagation(); openDetails(unit); }}
                                >
                                    Details
                                </Button>
                                <Button 
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md border-b-2 border-orange-700 active:translate-y-[1px] active:border-b-0 h-9"
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setSelectedUnit(unit);
                                        setIsAssignOpen(true);
                                    }}
                                >
                                    Assign
                                </Button>
                            </>
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
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 text-center">
              <p className="text-sm text-slate-500 mb-2 font-medium uppercase tracking-wider">Total Units</p>
              <p className="text-3xl font-bold text-slate-800">{units.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-emerald-100 p-4 text-center">
              <p className="text-sm text-emerald-600 mb-2 font-medium uppercase tracking-wider">Occupied</p>
              <p className="text-3xl font-bold text-emerald-600">{units.filter(u => u.status === 'occupied').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-4 text-center">
              <p className="text-sm text-blue-600 mb-2 font-medium uppercase tracking-wider">Vacant</p>
              <p className="text-3xl font-bold text-blue-600">{units.filter(u => u.status === 'vacant').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-orange-100 p-4 text-center">
              <p className="text-sm text-orange-600 mb-2 font-medium uppercase tracking-wider">Maintenance</p>
              <p className="text-3xl font-bold text-orange-500">{units.filter(u => u.status === 'maintenance').length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerUnits;
