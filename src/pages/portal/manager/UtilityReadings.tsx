import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  Droplets,
  Trash2,
  Shield,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Eye,
  Edit,
  X,
  Download,
  Filter,
  Search,
  ChevronRight,
  Calendar,
  DollarSign,
  Home,
  User,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface UtilityReading {
  id?: string;
  tenant_id: string;
  unit_id: string;
  property_id: string;
  reading_month: string;
  previous_reading: number;
  current_reading: number;
  electricity_usage?: number;
  electricity_bill?: number;
  electricity_rate: number;
  water_previous_reading?: number;
  water_current_reading?: number;
  water_rate?: number;
  water_bill: number;
  garbage_fee: number;
  security_fee: number;
  service_fee?: number;
  custom_utilities?: Record<string, number>;
  other_charges: number;
  total_bill?: number;
  status: 'pending' | 'paid';
  created_at?: string;
  updated_at?: string;
  tenant_name?: string;
  unit_number?: string;
  property_name?: string;
}

interface Unit {
  id: string;
  unit_number: string;
  unit_type?: string;
  property_id: string;
  property_name: string;
  tenant_id?: string;
  tenant_name?: string;
  tenant_number?: string;
  latestReading?: UtilityReading;
  totalBill?: number;
}

interface UtilitySettings {
  water_fee: number;
  water_rate?: number;
  water_constant?: number;
  electricity_rate?: number;
  electricity_constant?: number;
  garbage_fee: number;
  security_fee: number;
  service_fee?: number;
  custom_utilities?: Record<string, number>;
}

interface UtilityConstant {
  id: string;
  utility_name: string;
  constant: number;
  price?: number;
  is_metered: boolean;
  description?: string;
}

const formatKES = (value: number | undefined) =>
  Number(value || 0).toLocaleString('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const ManagerUtilityReadings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<UtilityReading[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [utilitySettings, setUtilitySettings] = useState<UtilitySettings>({
    water_fee: 0,
    water_rate: 0,
    electricity_rate: 140,
    garbage_fee: 0,
    security_fee: 0,
    service_fee: 0,
    water_constant: 1,
    electricity_constant: 1,
    custom_utilities: {},
  });
  const [utilityConstants, setUtilityConstants] = useState<UtilityConstant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().split('T')[0].substring(0, 7)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProperty, setFilterProperty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingReading, setEditingReading] = useState<UtilityReading | null>(null);
  const [formData, setFormData] = useState<UtilityReading>({
    tenant_id: '',
    unit_id: '',
    property_id: '',
    reading_month: new Date().toISOString().split('T')[0].substring(0, 7),
    previous_reading: 0,
    current_reading: 0,
    electricity_rate: 140,
    water_previous_reading: 0,
    water_current_reading: 0,
    water_rate: 0,
    water_bill: 0,
    garbage_fee: 0,
    security_fee: 0,
    service_fee: 0,
    custom_utilities: {},
    other_charges: 0,
    status: 'pending',
  });

  // Helpers are declared early to avoid TDZ issues when used for derived state
  function buildCustomUtilityValues() {
    const values: Record<string, number> = {};
    utilityConstants
      .filter(u => !['Electricity', 'Water', 'Garbage', 'Security', 'Service'].includes(u.utility_name))
      .forEach(u => {
        values[u.utility_name] = u.is_metered ? (u.constant || 0) : (u.price || 0);
      });
    return values;
  }

  const getUtilityConstant = (name: string) =>
    utilityConstants.find(u => u.utility_name === name);

  function calculateBills(reading: UtilityReading) {
    // Get constants from utility_constants table
    const waterConstant = getUtilityConstant('Water')?.constant || 1;
    const electricityConstant = getUtilityConstant('Electricity')?.constant || 1;
    const garbagePrice = Math.abs(getUtilityConstant('Garbage')?.price || reading.garbage_fee);
    const securityPrice = Math.abs(getUtilityConstant('Security')?.price || reading.security_fee);
    const servicePrice = Math.abs(getUtilityConstant('Service')?.price || (reading.service_fee || 0));
    
    // Calculate usage as the range/magnitude between readings (absolute difference)
    const electricityUsage = Math.abs(reading.current_reading - reading.previous_reading);
    const electricityBill = electricityUsage * (reading.electricity_rate || electricityConstant);
    
    const waterUsage = Math.abs((reading.water_current_reading || 0) - (reading.water_previous_reading || 0));
    const waterBill = waterUsage * (reading.water_rate || waterConstant);

    const customUtilityValues = buildCustomUtilityValues();
    let customUtilitiesTotal = 0;
    Object.values(customUtilityValues).forEach(val => {
      customUtilitiesTotal += Math.abs(Number(val) || 0);
    });

    const totalBill =
      electricityBill +
      waterBill +
      garbagePrice +
      securityPrice +
      servicePrice +
      customUtilitiesTotal +
      Math.abs(reading.other_charges || 0);

    return {
      electricityUsage,
      electricityBill,
      waterUsage,
      waterBill,
      garbagePrice,
      securityPrice,
      servicePrice,
      customUtilitiesTotal,
      totalBill,
      customUtilityValues,
    };
  }

  // Derived bill details for display; calculated each render
  const billDetails = calculateBills(formData);

  // Lock background scroll when the full-page form is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showForm]);

  // Fetch utility settings
  useEffect(() => {
    const fetchUtilitySettings = async () => {
      try {
        const { data, error } = await supabase
          .from('utility_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setUtilitySettings({
            water_fee: Number(data.water_fee) || 0,
            water_rate: Number(data.water_rate) || 0,
            electricity_rate: Number(data.electricity_rate) || 140,
            garbage_fee: Number(data.garbage_fee) || 0,
            security_fee: Number(data.security_fee) || 0,
            service_fee: Number(data.service_fee) || 0,
            water_constant: Number(data.water_constant) || 1,
            electricity_constant: Number(data.electricity_constant) || 1,
            custom_utilities: data.custom_utilities || {},
          });
          // Set form default values
          setFormData(prev => ({
            ...prev,
            water_rate: Number(data.water_rate) || 0,
            electricity_rate: Number(data.electricity_rate) || 140,
            water_bill: Number(data.water_fee) || 0,
            garbage_fee: Number(data.garbage_fee) || 0,
            security_fee: Number(data.security_fee) || 0,
            service_fee: Number(data.service_fee) || 0,
            custom_utilities: data.custom_utilities || {},
          }));
        }

        // Fetch utility constants
        const { data: constants, error: constantsError } = await supabase
          .from('utility_constants')
          .select('*')
          .order('utility_name');

        if (constantsError && constantsError.code !== 'PGRST116') throw constantsError;

        if (constants) {
          setUtilityConstants(constants);
        }
      } catch (err) {
        console.error('Error fetching utility settings:', err);
      }
    };

    fetchUtilitySettings();

    // Setup real-time subscription for utility constants
    const channel = supabase
      .channel('utility_constants_manager')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'utility_constants',
        },
        async () => {
          // Refresh all constants when any change occurs
          const { data: updatedConstants } = await supabase
            .from('utility_constants')
            .select('*')
            .order('utility_name');

          if (updatedConstants) {
            console.log('Utility constants updated on manager:', updatedConstants);
            setUtilityConstants(updatedConstants);
          }
        }
      )
      .subscribe();

    // Cleanup: unsubscribe on unmount
    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Keep all prices and constants locked to server values so users cannot alter them
  useEffect(() => {
    const garbagePrice = getUtilityConstant('Garbage')?.price || 0;
    const securityPrice = getUtilityConstant('Security')?.price || 0;
    const servicePrice = getUtilityConstant('Service')?.price || 0;
    const electricityConstant = getUtilityConstant('Electricity')?.constant || utilitySettings.electricity_constant || 1;
    const waterConstant = getUtilityConstant('Water')?.constant || utilitySettings.water_constant || 1;
    const customUtilityValues = buildCustomUtilityValues();

    setFormData(prev => ({
      ...prev,
      garbage_fee: garbagePrice,
      security_fee: securityPrice,
      service_fee: servicePrice,
      custom_utilities: customUtilityValues,
      electricity_rate: electricityConstant,
      water_rate: waterConstant,
    }));
  }, [utilityConstants, utilitySettings.electricity_constant, utilitySettings.water_constant]);

  // Fetch managed properties and their units
  useEffect(() => {
    const fetchManagedUnits = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Get property IDs assigned to manager
        const { data: assignments, error: assignError } = await supabase
          .from('property_manager_assignments')
          .select('property_id')
          .eq('property_manager_id', user.id);

        if (assignError) throw assignError;

        if (!assignments || assignments.length === 0) {
          setUnits([]);
          setReadings([]);
          return;
        }

        const propertyIds = assignments.map(a => a.property_id);

        // Fetch units for these properties with tenant info
        const { data: unitsData, error: unitsError } = await supabase
          .from('units')
          .select(
            `
            id,
            unit_number,
            property_id,
            properties(name),
            property_unit_types(unit_type_name),
            tenants(user_id)
          `
          )
          .in('property_id', propertyIds)
          .order('unit_number');

        if (unitsError) throw unitsError;

        // Get all tenant user IDs for batch profile fetch
        const tenantUserIds = unitsData
          ?.flatMap((u: any) => u.tenants)
          .filter((t: any) => t?.user_id)
          .map((t: any) => t.user_id) || [];

        let tenantProfiles: any = {};
        if (tenantUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, phone')
            .in('id', tenantUserIds);

          if (profiles) {
            tenantProfiles = Object.fromEntries(
              profiles.map((p: any) => [p.id, p])
            );
          }
        }

        // Fetch all readings for these properties
        const { data: readingsData, error: readingsError } = await supabase
          .from('utility_readings')
          .select('*')
          .in('property_id', propertyIds)
          .order('reading_month', { ascending: false });

        if (readingsError && readingsError.code !== 'PGRST116') {
          throw readingsError;
        }

        // Tenant details for each unit
        let enrichedUnits: Unit[] = [];
        if (unitsData) {
          enrichedUnits = unitsData.map((unit: any) => {
            let tenantName = 'Vacant';
            let tenantNumber = '';
            let tenantId = '';

            // Get tenant info from the nested relation
            if (unit.tenants && unit.tenants.length > 0) {
              const tenantUserId = unit.tenants[0].user_id;
              tenantId = tenantUserId;
              const tenant = tenantProfiles[tenantUserId];
              if (tenant) {
                tenantName = `${tenant.first_name} ${tenant.last_name}`;
                tenantNumber = tenant.phone || '';
              }
            }

            // Find latest reading for this unit
            const unitReadings = (readingsData || []).filter(
              r => r.unit_id === unit.id
            );
            const latestReading = unitReadings.length > 0 ? unitReadings[0] : undefined;
            
            let totalBill = 0;
            if (latestReading) {
              const electricityUsage = Math.abs(latestReading.current_reading - latestReading.previous_reading);
              const electricityBill = electricityUsage * latestReading.electricity_rate;
              
              const waterUsage = Math.abs((latestReading.water_current_reading || 0) - (latestReading.water_previous_reading || 0));
              const waterBill = waterUsage * (latestReading.water_rate || 0);

              let customUtilitiesTotal = 0;
              if (latestReading.custom_utilities) {
                Object.values(latestReading.custom_utilities).forEach(val => {
                  customUtilitiesTotal += Number(val) || 0;
                });
              }

              totalBill = electricityBill + waterBill + latestReading.garbage_fee + latestReading.security_fee + (latestReading.service_fee || 0) + customUtilitiesTotal + latestReading.other_charges;
            }

            return {
              id: unit.id,
              unit_number: unit.unit_number,
              unit_type: unit.property_unit_types?.unit_type_name || 'Unknown',
              property_id: unit.property_id,
              property_name: unit.properties?.name || 'Unknown',
              tenant_id: tenantId,
              tenant_name: tenantName,
              tenant_number: tenantNumber,
              latestReading: latestReading,
              totalBill: totalBill,
            };
          });
        }

        setUnits(enrichedUnits);
        setReadings(readingsData || []);

        // Setup real-time subscription for utility readings
        const propertyIdsString = propertyIds.join(',');
        const channel = supabase
          .channel(`utility_readings_${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'utility_readings',
            },
            async (payload) => {
              // Refresh readings when any change occurs
              const { data: updatedReadings } = await supabase
                .from('utility_readings')
                .select('*')
                .in('property_id', propertyIds)
                .order('reading_month', { ascending: false });

              if (updatedReadings) {
                const enrichedUpdatedReadings = updatedReadings.map((reading: any) => {
                  const unit = enrichedUnits.find(u => u.id === reading.unit_id);
                  return {
                    ...reading,
                    tenant_name: unit?.tenant_name || 'Unknown',
                    unit_number: unit?.unit_number || 'Unknown',
                    property_name: unit?.property_name || 'Unknown',
                  };
                });
                setReadings(enrichedUpdatedReadings);

                // Update units with new latest readings
                const updatedUnits = enrichedUnits.map(unit => {
                  const newLatestReading = updatedReadings.find(r => r.unit_id === unit.id);
                  if (newLatestReading) {
                    const electricityUsage = Math.abs(newLatestReading.current_reading - newLatestReading.previous_reading);
                    const electricityBill = electricityUsage * newLatestReading.electricity_rate;
                    const waterUsage = Math.abs((newLatestReading.water_current_reading || 0) - (newLatestReading.water_previous_reading || 0));
                    const waterBill = waterUsage * (newLatestReading.water_rate || 0);
                    let customUtilitiesTotal = 0;
                    if (newLatestReading.custom_utilities) {
                      Object.values(newLatestReading.custom_utilities).forEach(val => {
                        customUtilitiesTotal += Number(val) || 0;
                      });
                    }
                    const totalBill = electricityBill + waterBill + newLatestReading.garbage_fee + newLatestReading.security_fee + (newLatestReading.service_fee || 0) + customUtilitiesTotal + newLatestReading.other_charges;
                    return { ...unit, latestReading: newLatestReading, totalBill };
                  }
                  return unit;
                });
                setUnits(updatedUnits);
              }
            }
          )
          .subscribe();

        // Cleanup subscription on unmount
        return () => {
          channel.unsubscribe();
        };
      } catch (err: any) {
        console.error('Error fetching units:', err);
        toast.error('Failed to load units');
      } finally {
        setLoading(false);
      }
    };

    const cleanup = fetchManagedUnits();
    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [user?.id]);

  // Filter readings
  useEffect(() => {
    let filtered = readings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.unit_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Property filter
    if (filterProperty !== 'all') {
      filtered = filtered.filter(r => r.property_id === filterProperty);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    setFilteredReadings(filtered);
  }, [readings, searchTerm, filterProperty, filterStatus]);

  const handleAddReading = () => {
    setEditingReading(null);
    
    // Get fixed utility prices from database
    const garbagePrice = utilityConstants.find(u => u.utility_name === 'Garbage')?.price || 0;
    const securityPrice = utilityConstants.find(u => u.utility_name === 'Security')?.price || 0;
    const servicePrice = utilityConstants.find(u => u.utility_name === 'Service')?.price || 0;
    const electricityConstant = getUtilityConstant('Electricity')?.constant || utilitySettings.electricity_constant || 1;
    const waterConstant = getUtilityConstant('Water')?.constant || utilitySettings.water_constant || 1;
    const customUtilityValues = buildCustomUtilityValues();
    
    setFormData({
      tenant_id: '',
      unit_id: '',
      property_id: '',
      reading_month: new Date().toISOString().split('T')[0].substring(0, 7),
      previous_reading: 0,
      current_reading: 0,
      electricity_rate: electricityConstant,
      water_previous_reading: 0,
      water_current_reading: 0,
      water_rate: waterConstant,
      water_bill: utilitySettings.water_fee || 0,
      garbage_fee: garbagePrice,
      security_fee: securityPrice,
      service_fee: servicePrice,
      custom_utilities: customUtilityValues,
      other_charges: 0,
      status: 'pending',
    });
    setShowForm(true);
  };

  const handleEditReading = (reading: UtilityReading) => {
    const customUtilityValues = buildCustomUtilityValues();
    const electricityConstant = getUtilityConstant('Electricity')?.constant || utilitySettings.electricity_constant || 1;
    const waterConstant = getUtilityConstant('Water')?.constant || utilitySettings.water_constant || 1;

    setEditingReading(reading);
    setFormData({
      ...reading,
      reading_month: (reading.reading_month || '').substring(0, 7),
      electricity_rate: electricityConstant,
      water_rate: waterConstant,
      custom_utilities: customUtilityValues,
      garbage_fee: getUtilityConstant('Garbage')?.price || reading.garbage_fee,
      security_fee: getUtilityConstant('Security')?.price || reading.security_fee,
      service_fee: getUtilityConstant('Service')?.price || (reading.service_fee || 0),
    });
    setShowForm(true);
  };

  const handleUnitChange = (unitId: string) => {
    const selectedUnit = units.find(u => u.id === unitId);
    if (selectedUnit) {
      setFormData(prev => ({
        ...prev,
        unit_id: unitId,
        property_id: selectedUnit.property_id,
        tenant_id: selectedUnit.tenant_id || '',
      }));
    }
  };


  const handleSaveReading = async () => {
    if (!formData.unit_id || !formData.property_id || !formData.reading_month) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      const bills = calculateBills(formData);
      const payload = {
        tenant_id: formData.tenant_id || null,
        unit_id: formData.unit_id,
        property_id: formData.property_id,
        reading_month: `${formData.reading_month}-01`,
        previous_reading: formData.previous_reading,
        current_reading: formData.current_reading,
        electricity_rate: formData.electricity_rate,
        electricity_bill: bills.electricityBill,
        water_previous_reading: formData.water_previous_reading,
        water_current_reading: formData.water_current_reading,
        water_rate: formData.water_rate,
        water_bill: bills.waterBill,
        garbage_fee: formData.garbage_fee,
        security_fee: formData.security_fee,
        service_fee: formData.service_fee,
        other_charges: formData.other_charges,
        total_bill: bills.totalBill,
        status: formData.status,
        created_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (editingReading?.id) {
        const { error } = await supabase
          .from('utility_readings')
          .update(payload)
          .eq('id', editingReading.id);

        if (error) throw error;
        toast.success('Reading updated successfully');
      } else {
        // Check if a reading already exists for this unit and month
        const { data: existingReading, error: checkError } = await supabase
          .from('utility_readings')
          .select('id')
          .eq('unit_id', formData.unit_id)
          .eq('reading_month', `${formData.reading_month}-01`)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 means no rows found, which is expected
          throw checkError;
        }

        if (existingReading) {
          // Reading already exists, update it instead
          const { error: updateError } = await supabase
            .from('utility_readings')
            .update(payload)
            .eq('id', existingReading.id);

          if (updateError) throw updateError;
          toast.success('Reading updated successfully');
        } else {
          // No existing reading, insert it
          const { error: insertError, data } = await supabase
            .from('utility_readings')
            .insert([payload])
            .select();

          if (insertError) throw insertError;
          toast.success('Reading created successfully');
        }
      }

      // Close form and wait for real-time subscription to update data
      setShowForm(false);
      // The real-time subscription will automatically refresh the UI
      // No need for manual refresh anymore
      
    } catch (err: any) {
      console.error('Error saving reading:', err);
      toast.error(err.message || 'Failed to save reading');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReading = async (readingId: string) => {
    if (!window.confirm('Are you sure you want to delete this reading?')) return;

    try {
      const { error } = await supabase
        .from('utility_readings')
        .delete()
        .eq('id', readingId);

      if (error) throw error;
      setReadings(readings.filter(r => r.id !== readingId));
      toast.success('Reading deleted successfully');
    } catch (err: any) {
      console.error('Error deleting reading:', err);
      toast.error('Failed to delete reading');
    }
  };

  const properties = [...new Set(units.map(u => u.property_name))];

  const handleManualRefresh = async () => {
    if (!user?.id) return;
    try {
      const { data: assignments } = await supabase
        .from('property_manager_assignments')
        .select('property_id')
        .eq('property_manager_id', user.id);

      if (!assignments || assignments.length === 0) {
        setUnits([]);
        setReadings([]);
        return;
      }

      const propertyIds = assignments.map(a => a.property_id);

      // Fetch fresh data
      const { data: unitsData } = await supabase
        .from('units')
        .select(`
          id,
          unit_number,
          property_id,
          properties(name),
          property_unit_types(unit_type_name),
          tenants(user_id)
        `)
        .in('property_id', propertyIds)
        .order('unit_number');

      const tenantUserIds = unitsData
        ?.flatMap((u: any) => u.tenants)
        .filter((t: any) => t?.user_id)
        .map((t: any) => t.user_id) || [];

      let tenantProfiles: any = {};
      if (tenantUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, phone')
          .in('id', tenantUserIds);

        if (profiles) {
          tenantProfiles = Object.fromEntries(
            profiles.map((p: any) => [p.id, p])
          );
        }
      }

      const { data: readingsData } = await supabase
        .from('utility_readings')
        .select('*')
        .in('property_id', propertyIds)
        .order('reading_month', { ascending: false });

      let enrichedUnits: Unit[] = [];
      if (unitsData) {
        enrichedUnits = unitsData.map((unit: any) => {
          let tenantName = 'Vacant';
          let tenantNumber = '';
          let tenantId = '';

          if (unit.tenants && unit.tenants.length > 0) {
            const tenantUserId = unit.tenants[0].user_id;
            tenantId = tenantUserId;
            const tenant = tenantProfiles[tenantUserId];
            if (tenant) {
              tenantName = `${tenant.first_name} ${tenant.last_name}`;
              tenantNumber = tenant.phone || '';
            }
          }

          const unitReadings = (readingsData || []).filter(r => r.unit_id === unit.id);
          const latestReading = unitReadings.length > 0 ? unitReadings[0] : undefined;
          
          let totalBill = 0;
          if (latestReading) {
            const electricityUsage = Math.abs(latestReading.current_reading - latestReading.previous_reading);
            const electricityBill = electricityUsage * latestReading.electricity_rate;
            const waterUsage = Math.abs((latestReading.water_current_reading || 0) - (latestReading.water_previous_reading || 0));
            const waterBill = waterUsage * (latestReading.water_rate || 0);
            let customUtilitiesTotal = 0;
            if (latestReading.custom_utilities) {
              Object.values(latestReading.custom_utilities).forEach(val => {
                customUtilitiesTotal += Number(val) || 0;
              });
            }
            totalBill = electricityBill + waterBill + latestReading.garbage_fee + latestReading.security_fee + (latestReading.service_fee || 0) + customUtilitiesTotal + latestReading.other_charges;
          }

          return {
            id: unit.id,
            unit_number: unit.unit_number,
            unit_type: unit.property_unit_types?.unit_type_name || 'Unknown',
            property_id: unit.property_id,
            property_name: unit.properties?.name || 'Unknown',
            tenant_id: tenantId,
            tenant_name: tenantName,
            tenant_number: tenantNumber,
            latestReading: latestReading,
            totalBill: totalBill,
          };
        });
      }

      setUnits(enrichedUnits);
      setReadings(readingsData || []);
      toast.success('Data refreshed successfully');
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      toast.error('Failed to refresh data');
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <Zap className="w-10 h-10 text-amber-500" />
              Utility Management
            </h1>
            <p className="text-slate-600 mt-2">
              View all units and enter meter readings. Billing calculated automatically using the utility rate formula.
            </p>
          </div>
          <Button
            onClick={handleManualRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            title="Refresh data from database"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/60 flex items-start justify-center z-50"
          >
            <Card className="w-screen h-screen max-w-none rounded-none border-0 bg-slate-50">
              <CardHeader className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b flex flex-row items-center justify-between px-8 pt-6 pb-4 max-w-6xl w-full mx-auto">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Zap size={24} className="text-amber-500" />
                    {editingReading ? 'Edit Meter Reading' : 'Add Meter Reading'}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    Enter readings, review auto-calculated charges, and keep fixed prices visible in one view.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-slate-500 hover:text-slate-700 px-3 py-2 rounded-md border border-slate-200 bg-white shadow-sm"
                  >
                    <X size={18} />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="px-6 sm:px-8 pb-10 overflow-y-auto h-[calc(100vh-120px)]">
                <div className="max-w-6xl w-full mx-auto space-y-8">
                {/* Utility Constants Info */}
                {utilityConstants.length > 0 && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-900">Utility Calculation Guide</AlertTitle>
                    <AlertDescription className="text-green-800 mt-2 text-sm">
                      <div className="space-y-2">
                        {utilityConstants.filter(u => u.is_metered).map(u => (
                          <div key={u.id}>
                            <span className="font-semibold">{u.utility_name}:</span> (Current - Previous) × {u.constant} = Bill
                          </div>
                        ))}
                        {utilityConstants.filter(u => !u.is_metered).map(u => (
                          <div key={u.id}>
                            <span className="font-semibold">{u.utility_name}:</span> Fixed amount from settings
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Unit & Tenant Info */}
                {formData.unit_id && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Home className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-900">Unit Details</AlertTitle>
                    <AlertDescription className="text-blue-800 mt-2 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-semibold">Unit:</span> {units.find(u => u.id === formData.unit_id)?.unit_number}
                        </div>
                        <div>
                          <span className="font-semibold">Type:</span> {units.find(u => u.id === formData.unit_id)?.unit_type}
                        </div>
                        <div>
                          <span className="font-semibold">Tenant:</span> {units.find(u => u.id === formData.unit_id)?.tenant_name}
                        </div>
                        <div>
                          <span className="font-semibold">Property:</span> {units.find(u => u.id === formData.unit_id)?.property_name}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-lg border border-slate-200 p-4">
                  <div>
                    <Label htmlFor="unit_id">Unit *</Label>
                    <select
                      id="unit_id"
                      value={formData.unit_id}
                      onChange={e => handleUnitChange(e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg"
                      disabled={!!editingReading}
                    >
                      <option value="">Select Unit</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.unit_number} - {unit.property_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="reading_month">Reading Month *</Label>
                    <input
                      id="reading_month"
                      type="month"
                      value={formData.reading_month}
                      onChange={e =>
                        setFormData(prev => ({...prev, reading_month: e.target.value}))
                      }
                      className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Electricity Section */}
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-lg border border-amber-200 space-y-4 shadow-sm">
                  <h4 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    Electricity Meter Readings
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="previous_reading" className="font-medium">Previous Reading</Label>
                      <Input
                        id="previous_reading"
                        type="number"
                        step="0.01"
                        value={formData.previous_reading}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            previous_reading: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="mt-3 text-lg p-3"
                      />
                    </div>

                    <div>
                      <Label htmlFor="current_reading" className="font-medium text-red-600">Current Reading *</Label>
                      <Input
                        id="current_reading"
                        type="number"
                        step="0.01"
                        value={formData.current_reading}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            current_reading: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="mt-3 text-lg p-3 border-2 border-amber-400"
                      />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-amber-200">
                    <Label className="text-sm text-slate-600 font-medium">Metering Constant (Set by SuperAdmin)</Label>
                    <div className="mt-3 text-2xl font-bold text-amber-700">
                      {getUtilityConstant('Electricity')?.constant || utilitySettings.electricity_constant || 1}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Fixed by admin - cannot be changed</p>
                  </div>
                </div>

                {/* Water Section */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200 space-y-4 shadow-sm">
                  <h4 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    Water Meter Readings
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="water_previous_reading" className="font-medium">Previous Reading</Label>
                      <Input
                        id="water_previous_reading"
                        type="number"
                        step="0.01"
                        value={formData.water_previous_reading || 0}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            water_previous_reading: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="mt-3 text-lg p-3"
                      />
                    </div>

                    <div>
                      <Label htmlFor="water_current_reading" className="font-medium text-red-600">Current Reading *</Label>
                      <Input
                        id="water_current_reading"
                        type="number"
                        step="0.01"
                        value={formData.water_current_reading || 0}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            water_current_reading: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="mt-3 text-lg p-3 border-2 border-blue-400"
                      />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <Label className="text-sm text-slate-600 font-medium">Metering Constant (Set by SuperAdmin)</Label>
                    <div className="mt-3 text-2xl font-bold text-blue-700">
                      {getUtilityConstant('Water')?.constant || utilitySettings.water_constant || 1}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Fixed by admin - cannot be changed</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200 space-y-4 shadow-sm">
                  <h4 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Fixed Utility Fees (Set by SuperAdmin)
                  </h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <Label className="text-sm text-slate-600 font-medium">Garbage Fee</Label>
                      <div className="mt-3 text-3xl font-bold text-green-700">
                        {formatKES(getUtilityConstant('Garbage')?.price)}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Cannot be modified - set by admin</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <Label className="text-sm text-slate-600 font-medium">Security Fee</Label>
                      <div className="mt-3 text-3xl font-bold text-blue-700">
                        {formatKES(getUtilityConstant('Security')?.price)}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Cannot be modified - set by admin</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <Label className="text-sm text-slate-600 font-medium">Service Fee</Label>
                      <div className="mt-3 text-3xl font-bold text-purple-700">
                        {formatKES(getUtilityConstant('Service')?.price)}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Cannot be modified - set by admin</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h4 className="font-semibold text-slate-900 text-lg flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    Additional Charges
                  </h4>
                  <div>
                    <Label htmlFor="other_charges" className="font-medium">Other Charges (Additional)</Label>
                    <Input
                      id="other_charges"
                      type="number"
                      step="0.01"
                      value={formData.other_charges}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          other_charges: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="mt-3 text-lg p-3"
                      placeholder="Enter any additional charges"
                    />
                  </div>
                </div>

                {/* All Custom Utilities from Database */}
                {utilityConstants.filter(u => !['Electricity', 'Water', 'Garbage', 'Security', 'Service'].includes(u.utility_name)).length > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-slate-700">Custom Utilities (Added by SuperAdmin)</h4>
                      <span className="text-xs text-slate-500">Read-only constants and fixed prices</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {utilityConstants
                        .filter(u => !['Electricity', 'Water', 'Garbage', 'Security', 'Service'].includes(u.utility_name))
                        .map(utility => (
                          <div key={utility.id}>
                            <Label htmlFor={`utility_${utility.utility_name}`} className="capitalize">
                              {utility.utility_name}
                              {utility.is_metered ? ' (Metered)' : ' (Fixed)'}
                            </Label>
                            <Input
                              id={`utility_${utility.utility_name}`}
                              type="number"
                              step="0.01"
                              placeholder={utility.is_metered ? 'Metering constant' : utility.price?.toString()}
                              value={utility.is_metered ? (utility.constant || 0) : (utility.price || 0)}
                              readOnly
                              disabled
                              className="mt-2 bg-slate-50 text-slate-700 cursor-not-allowed"
                              title={utility.is_metered ? `Constant for ${utility.utility_name}` : `Fixed price: ${utility.price}`}
                            />
                            <p className="text-xs text-slate-500 mt-1">Set by admin · read-only</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Bill Summary */}
                {(formData.current_reading > 0 || (formData.water_current_reading || 0) > 0) && (
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm">
                    <CardContent className="pt-6">
                      <div className="space-y-4 text-sm">
                        <div className="flex items-center justify-between pb-3 border-b border-green-200">
                          <h3 className="font-bold text-green-900">Bill Calculation Breakdown</h3>
                          <span className="text-xs text-green-700">Live preview</span>
                        </div>

                        {/* Electricity Calculation */}
                        <div className="bg-white/60 p-3 rounded border border-green-100">
                          <div className="font-semibold text-green-800 mb-2">Electricity:</div>
                          <div className="space-y-1 text-xs ml-2">
                            <div className="flex justify-between text-slate-700">
                              <span>Current Reading:</span>
                              <span className="font-mono font-semibold">{formData.current_reading}</span>
                            </div>
                            <div className="flex justify-between text-slate-700">
                              <span>Previous Reading:</span>
                              <span className="font-mono font-semibold">{formData.previous_reading}</span>
                            </div>
                            <div className="flex justify-between text-slate-700 py-1 border-t border-slate-200">
                              <span>Usage (Units):</span>
                              <span className="font-mono font-semibold">
                                {Math.abs(formData.current_reading - formData.previous_reading).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-700">
                              <span>Rate per unit:</span>
                              <span className="font-mono font-semibold">KES {formData.electricity_rate}</span>
                            </div>
                            <div className="flex justify-between text-green-700 font-bold py-1 border-t border-slate-200 bg-green-100/50 px-2 rounded">
                              <span>Electricity Bill:</span>
                              <span className="font-mono">
                                KES {(Math.abs(formData.current_reading - formData.previous_reading) * formData.electricity_rate).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Water Calculation */}
                        <div className="bg-white/60 p-3 rounded border border-blue-100 mt-2">
                          <div className="font-semibold text-blue-800 mb-2">Water:</div>
                          <div className="space-y-1 text-xs ml-2">
                            <div className="flex justify-between text-slate-700">
                              <span>Current Reading:</span>
                              <span className="font-mono font-semibold">{formData.water_current_reading || 0}</span>
                            </div>
                            <div className="flex justify-between text-slate-700">
                              <span>Previous Reading:</span>
                              <span className="font-mono font-semibold">{formData.water_previous_reading || 0}</span>
                            </div>
                            <div className="flex justify-between text-slate-700 py-1 border-t border-slate-200">
                              <span>Usage (Units):</span>
                              <span className="font-mono font-semibold">
                                {Math.abs((formData.water_current_reading || 0) - (formData.water_previous_reading || 0)).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-700">
                              <span>Rate per unit:</span>
                              <span className="font-mono font-semibold">KES {formData.water_rate || 0}</span>
                            </div>
                            <div className="flex justify-between text-blue-700 font-bold py-1 border-t border-slate-200 bg-blue-100/50 px-2 rounded">
                              <span>Water Bill:</span>
                              <span className="font-mono">
                                KES {(Math.abs((formData.water_current_reading || 0) - (formData.water_previous_reading || 0)) * (formData.water_rate || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Other Charges */}
                        <div className="space-y-2 border-t border-green-200 pt-3">
                          <div className="flex justify-between">
                            <span className="text-slate-700">Garbage Fee</span>
                            <span className="font-semibold">KES {billDetails.garbagePrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Security Fee</span>
                            <span className="font-semibold">KES {billDetails.securityPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-700">Service Fee</span>
                            <span className="font-semibold">KES {billDetails.servicePrice.toFixed(2)}</span>
                          </div>
                          {billDetails.customUtilityValues && Object.entries(billDetails.customUtilityValues).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-slate-700 capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="font-semibold">KES {Number(value || 0).toFixed(2)}</span>
                            </div>
                          ))}
                          {formData.other_charges > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-700">Other Charges</span>
                              <span className="font-semibold">KES {formData.other_charges.toFixed(2)}</span>
                            </div>
                          )}
                        </div>

                        {/* Total */}
                        <div className="flex justify-between border-t border-green-200 pt-3 text-base font-bold text-green-700 bg-white/80 p-3 rounded">
                          <span>TOTAL BILL</span>
                          <span className="font-mono">
                            KES {billDetails.totalBill.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        status: e.target.value as 'pending' | 'paid',
                      }))
                    }
                    className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                </div>
              </CardContent>

              <CardFooter className="gap-3 max-w-6xl w-full mx-auto px-8 pb-6">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveReading}
                  disabled={saving}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {saving ? 'Saving...' : 'Save Reading'}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}



        {/* Units & Tenants List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home size={20} />
              Tenants & Units
            </CardTitle>
            <CardDescription>
              Manage utility readings for {units.length} unit{units.length !== 1 ? 's' : ''} in your properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : units.length === 0 ? (
              <div className="text-center py-12">
                <Home size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 text-lg">No units assigned to you yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50">
                      <th className="text-left py-4 px-4 font-semibold text-slate-800">
                        Unit Number
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-800">
                        Unit Type
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-800">
                        Tenant Name
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-800">
                        Tenant Number
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-800">
                        Property
                      </th>
                      <th className="text-right py-4 px-4 font-semibold text-slate-800">
                        Current Bill
                      </th>
                      <th className="text-center py-4 px-4 font-semibold text-slate-800">
                        Last Read
                      </th>
                      <th className="text-center py-4 px-4 font-semibold text-slate-800">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map(unit => (
                      <tr
                        key={unit.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition"
                      >
                        <td className="py-4 px-4 font-bold text-slate-900">
                          {unit.unit_number}
                        </td>
                        <td className="py-4 px-4 text-slate-700">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {unit.unit_type}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-slate-700 font-medium">
                          {unit.tenant_name === 'Vacant' ? (
                            <span className="text-slate-500 italic">Vacant</span>
                          ) : (
                            unit.tenant_name
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-700">
                          {unit.tenant_number || '-'}
                        </td>
                        <td className="py-4 px-4 text-slate-700">
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                            {unit.property_name}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {unit.latestReading ? (
                            <div className="font-semibold text-slate-900">
                              KES {unit.totalBill?.toFixed(2)}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">No reading</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center text-slate-700">
                          {unit.latestReading ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">
                                {new Date(unit.latestReading.reading_month).toLocaleDateString('en-US', {
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              <span className="text-xs text-slate-500">
                                Status: <span className="font-semibold">{unit.latestReading.status}</span>
                              </span>
                            </div>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  unit_id: unit.id,
                                  property_id: unit.property_id,
                                  tenant_id: unit.tenant_id || '',
                                  reading_month: new Date().toISOString().split('T')[0].substring(0, 7),
                                }));
                                setEditingReading(null);
                                setShowForm(true);
                              }}
                              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium gap-1 flex items-center"
                              title="Add/Edit Reading"
                            >
                              <Plus size={14} />
                              {unit.latestReading ? 'Edit' : 'Add'} Reading
                            </button>
                            {unit.latestReading && (
                              <button
                                onClick={() => handleEditReading(unit.latestReading!)}
                                className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ManagerUtilityReadings;
