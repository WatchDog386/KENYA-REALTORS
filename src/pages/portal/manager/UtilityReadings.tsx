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
  rent_amount?: number;
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
  floor_number?: string | number | null;
  unit_type?: string;
  property_id: string;
  property_name: string;
  tenant_id?: string;
  tenant_name?: string;
  tenant_number?: string;
  rent_amount?: number;
  unit_price?: number;
  unit_type_price?: number;
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
  const [propertyUtilityMap, setPropertyUtilityMap] = useState<Record<string, string[]>>({});
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
    rent_amount: 0,
    custom_utilities: {},
    other_charges: 0,
    status: 'pending',
  });

  const getFloorSortValue = (floor: string | number | null | undefined): number => {
    const floorKey = String(floor ?? 'G').trim().toUpperCase();
    const floorOrder: Record<string, number> = {
      B5: -5,
      B4: -4,
      B3: -3,
      B2: -2,
      B1: -1,
      B: -1,
      G: 0,
      M: 0.5,
      R: 10000,
      ROOFTOP: 10000,
      PH: 10001,
      PENTHOUSE: 10001,
    };

    if (floorOrder[floorKey] !== undefined) {
      return floorOrder[floorKey];
    }

    const parsed = Number(floorKey);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }

    return 9999;
  };

  const sortUnitsChronologically = (items: Unit[]) => {
    return [...items].sort((a, b) => {
      const propertyDiff = String(a.property_name || '').localeCompare(String(b.property_name || ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      if (propertyDiff !== 0) return propertyDiff;

      const floorDiff = getFloorSortValue(a.floor_number) - getFloorSortValue(b.floor_number);
      if (floorDiff !== 0) return floorDiff;

      return String(a.unit_number || '').trim().localeCompare(String(b.unit_number || '').trim(), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
  };

  // Helpers are declared early to avoid TDZ issues when used for derived state
  function buildCustomUtilityValues(propertyId?: string) {
    const hasAssignments = Object.keys(propertyUtilityMap).length > 0;
    const assignedIds = propertyId ? (propertyUtilityMap[propertyId] || []) : [];
    const values: Record<string, number> = {};
    utilityConstants
      .filter(u => {
        const isCustom = !['Electricity', 'Water', 'Garbage', 'Security', 'Service'].includes(u.utility_name);
        if (!isCustom) return false;
        if (!hasAssignments) return true;
        if (!propertyId) return false;
        return assignedIds.includes(u.id);
      })
      .forEach(u => {
        values[u.utility_name] = u.is_metered ? (u.constant || 0) : (u.price || 0);
      });
    return values;
  }

  const getUtilityConstant = (name: string, propertyId?: string) => {
    const candidates = utilityConstants.filter((u) => u.utility_name === name);
    if (candidates.length === 0) return undefined;

    const hasAnyAssignments = Object.keys(propertyUtilityMap).length > 0;
    if (!hasAnyAssignments) return candidates[0];

    const resolvedPropertyId =
      propertyId ||
      formData.property_id ||
      units.find((u) => u.id === formData.unit_id)?.property_id;

    if (!resolvedPropertyId) {
      return hasAnyAssignments ? undefined : candidates[0];
    }

    const assignedIds = new Set(propertyUtilityMap[resolvedPropertyId] || []);
    const assignedMatch = candidates.find((u) => assignedIds.has(u.id));
    if (assignedMatch) return assignedMatch;

    return hasAnyAssignments ? undefined : candidates[0];
  };

  const CORE_UTILITY_NAMES = ['Electricity', 'Water', 'Garbage', 'Security', 'Service'];

  function isUtilityActiveForProperty(utilityName: string, propertyId?: string) {
    const utility = getUtilityConstant(utilityName, propertyId);
    if (!utility) return false;

    // Core utilities should always be available for billing forms.
    // Property assignments are mainly used to scope custom utilities.
    if (CORE_UTILITY_NAMES.includes(utilityName)) return true;

    const hasAnyAssignments = Object.keys(propertyUtilityMap).length > 0;
    if (!hasAnyAssignments) return true;
    if (!propertyId) return false;

    const assignedIds = propertyUtilityMap[propertyId] || [];
    return assignedIds.includes(utility.id);
  }

  function getActiveUtilitiesForProperty(propertyId?: string) {
    const coreUtilities = CORE_UTILITY_NAMES
      .map((name) => getUtilityConstant(name, propertyId))
      .filter((utility): utility is UtilityConstant => Boolean(utility));

    const hasAnyAssignments = Object.keys(propertyUtilityMap).length > 0;
    if (!hasAnyAssignments) return utilityConstants;
    if (!propertyId) return coreUtilities;

    const assignedIds = propertyUtilityMap[propertyId] || [];
    const assignedCustomUtilities = utilityConstants.filter(
      (u) => !CORE_UTILITY_NAMES.includes(u.utility_name) && assignedIds.includes(u.id)
    );

    return [...coreUtilities, ...assignedCustomUtilities];
  }

  function getUnitRent(unitId?: string, propertyId?: string) {
    if (!unitId) return 0;
    const unit = units.find(u => u.id === unitId && (!propertyId || u.property_id === propertyId));
    if (!unit) return 0;
    return Math.abs(unit.rent_amount ?? unit.unit_price ?? unit.unit_type_price ?? 0);
  }

  async function buildLeaseRentByUnit(unitIds: string[]) {
    if (!unitIds.length) return {} as Record<string, number>;

    const { data: activeTenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, unit_id')
      .in('unit_id', unitIds)
      .eq('status', 'active');

    if (tenantError || !activeTenants?.length) {
      if (tenantError) {
        console.warn('Unable to fetch active tenants for lease rent lookup:', tenantError);
      }
      return {} as Record<string, number>;
    }

    const tenantIds = activeTenants.map(t => t.id);
    const tenantUnitMap = new Map(activeTenants.map(t => [t.id, t.unit_id]));

    const { data: leaseRows, error: leaseError } = await supabase
      .from('tenant_leases')
      .select('tenant_id, unit_id, rent_amount, updated_at')
      .in('tenant_id', tenantIds)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (leaseError || !leaseRows?.length) {
      if (leaseError) {
        console.warn('Unable to fetch active lease rent amounts:', leaseError);
      }
      return {} as Record<string, number>;
    }

    const leaseRentByUnit: Record<string, number> = {};
    for (const lease of leaseRows) {
      const unitId = (lease as any).unit_id || tenantUnitMap.get((lease as any).tenant_id);
      if (!unitId || leaseRentByUnit[unitId] !== undefined) continue;
      const amount = Math.abs(Number((lease as any).rent_amount) || 0);
      if (amount > 0) {
        leaseRentByUnit[unitId] = amount;
      }
    }

    return leaseRentByUnit;
  }

  function calculateBills(reading: UtilityReading) {
    const propertyId = reading.property_id || formData.property_id;
    const rentAmount = Math.abs(
      reading.rent_amount ?? getUnitRent(reading.unit_id, propertyId)
    );
    const electricityEnabled = isUtilityActiveForProperty('Electricity', propertyId);
    const waterEnabled = isUtilityActiveForProperty('Water', propertyId);
    const garbageEnabled = isUtilityActiveForProperty('Garbage', propertyId);
    const securityEnabled = isUtilityActiveForProperty('Security', propertyId);
    const serviceEnabled = isUtilityActiveForProperty('Service', propertyId);

    // Get constants from utility_constants table with utility_settings fallback
    const waterConstant = getUtilityConstant('Water', propertyId)?.constant || utilitySettings.water_constant || 1;
    const electricityConstant = getUtilityConstant('Electricity', propertyId)?.constant || utilitySettings.electricity_constant || 1;
    const garbagePrice = garbageEnabled ? Math.abs(getUtilityConstant('Garbage', propertyId)?.price ?? utilitySettings.garbage_fee ?? reading.garbage_fee ?? 0) : 0;
    const securityPrice = securityEnabled ? Math.abs(getUtilityConstant('Security', propertyId)?.price ?? utilitySettings.security_fee ?? reading.security_fee ?? 0) : 0;
    const servicePrice = serviceEnabled ? Math.abs(getUtilityConstant('Service', propertyId)?.price ?? utilitySettings.service_fee ?? (reading.service_fee ?? 0)) : 0;
    
    // Calculate usage as the range/magnitude between readings (absolute difference)
    const electricityUsage = electricityEnabled ? Math.abs(reading.current_reading - reading.previous_reading) : 0;
    const electricityBill = electricityEnabled ? electricityUsage * (reading.electricity_rate || electricityConstant) : 0;
    
    const waterUsage = waterEnabled ? Math.abs((reading.water_current_reading || 0) - (reading.water_previous_reading || 0)) : 0;
    const waterBill = waterEnabled ? waterUsage * (reading.water_rate || waterConstant) : 0;

    const customUtilityValues = buildCustomUtilityValues(propertyId);
    let customUtilitiesTotal = 0;
    Object.values(customUtilityValues).forEach(val => {
      customUtilitiesTotal += Math.abs(Number(val) || 0);
    });

    const totalBill =
      rentAmount +
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
      rentAmount,
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

        const finalConstants = constants || [];
        setUtilityConstants(finalConstants);
        console.log('Final utility constants:', finalConstants);

        const { data: propertyUtilities, error: propertyUtilitiesError } = await supabase
          .from('property_utilities')
          .select('property_id, utility_constant_id');

        if (!propertyUtilitiesError && propertyUtilities) {
          const mapped: Record<string, string[]> = {};
          propertyUtilities.forEach((item: any) => {
            if (!mapped[item.property_id]) mapped[item.property_id] = [];
            mapped[item.property_id].push(item.utility_constant_id);
          });
          setPropertyUtilityMap(mapped);
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
    const resolvedPropertyId = formData.property_id || units.find((u) => u.id === formData.unit_id)?.property_id;
    const garbagePrice = getUtilityConstant('Garbage', resolvedPropertyId)?.price || 0;
    const securityPrice = getUtilityConstant('Security', resolvedPropertyId)?.price || 0;
    const servicePrice = getUtilityConstant('Service', resolvedPropertyId)?.price || 0;
    const electricityConstant = getUtilityConstant('Electricity', resolvedPropertyId)?.constant || utilitySettings.electricity_constant || 1;
    const waterConstant = getUtilityConstant('Water', resolvedPropertyId)?.constant || utilitySettings.water_constant || 1;
    const customUtilityValues = buildCustomUtilityValues(resolvedPropertyId);

    setFormData(prev => ({
      ...prev,
      garbage_fee: garbagePrice,
      security_fee: securityPrice,
      service_fee: servicePrice,
      custom_utilities: customUtilityValues,
      electricity_rate: electricityConstant,
      water_rate: waterConstant,
    }));
  }, [utilityConstants, propertyUtilityMap, formData.property_id, formData.unit_id, units, utilitySettings.electricity_constant, utilitySettings.water_constant]);

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
            floor_number,
            property_id,
            price,
            properties(name),
            property_unit_types(unit_type_name, price_per_unit),
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
        const leaseRentByUnit = await buildLeaseRentByUnit((unitsData || []).map((u: any) => u.id));

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
            const rentAmount = Math.abs(leaseRentByUnit[unit.id] ?? unit.price ?? unit.property_unit_types?.price_per_unit ?? 0);
            
            let totalBill = 0;
            if (latestReading) {
              const electricityUsage = Math.abs(latestReading.current_reading - latestReading.previous_reading);
              const electricityBill = electricityUsage * latestReading.electricity_rate;
              
              const waterUsage = Math.abs((latestReading.water_current_reading || 0) - (latestReading.water_previous_reading || 0));
              const waterBill = waterUsage * (latestReading.water_rate || 0);

              const readingRent = Math.abs(latestReading.rent_amount ?? rentAmount);

              // Fetch fresh prices from superadmin settings
              const garbagePrice = Math.abs(getUtilityConstant('Garbage', unit.property_id)?.price ?? utilitySettings.garbage_fee ?? latestReading.garbage_fee ?? 0);
              const securityPrice = Math.abs(getUtilityConstant('Security', unit.property_id)?.price ?? utilitySettings.security_fee ?? latestReading.security_fee ?? 0);
              const servicePrice = Math.abs(getUtilityConstant('Service', unit.property_id)?.price ?? utilitySettings.service_fee ?? (latestReading.service_fee ?? 0));

              let customUtilitiesTotal = 0;
              if (latestReading.custom_utilities) {
                Object.values(latestReading.custom_utilities).forEach(val => {
                  customUtilitiesTotal += Math.abs(Number(val) || 0);
                });
              }

              totalBill = readingRent + electricityBill + waterBill + garbagePrice + securityPrice + servicePrice + customUtilitiesTotal + (latestReading.other_charges || 0);
            }

            return {
              id: unit.id,
              unit_number: unit.unit_number,
              floor_number: unit.floor_number,
              unit_type: unit.property_unit_types?.unit_type_name || 'Unknown',
              property_id: unit.property_id,
              property_name: unit.properties?.name || 'Unknown',
              tenant_id: tenantId,
              tenant_name: tenantName,
              tenant_number: tenantNumber,
              rent_amount: rentAmount,
              unit_price: unit.price || 0,
              unit_type_price: unit.property_unit_types?.price_per_unit || 0,
              latestReading: latestReading,
              totalBill: totalBill,
            };
          });
        }

        setUnits(sortUnitsChronologically(enrichedUnits));
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
                    const rentAmount = Math.abs(unit.rent_amount ?? unit.unit_price ?? unit.unit_type_price ?? 0);
                    const electricityUsage = Math.abs(newLatestReading.current_reading - newLatestReading.previous_reading);
                    const electricityBill = electricityUsage * newLatestReading.electricity_rate;
                    const waterUsage = Math.abs((newLatestReading.water_current_reading || 0) - (newLatestReading.water_previous_reading || 0));
                    const waterBill = waterUsage * (newLatestReading.water_rate || 0);
                    const readingRent = Math.abs(newLatestReading.rent_amount ?? rentAmount);
                    
                    // Fetch fresh garbage/security/service fees from superadmin settings
                    const garbagePrice = Math.abs(getUtilityConstant('Garbage', unit.property_id)?.price ?? utilitySettings.garbage_fee ?? newLatestReading.garbage_fee ?? 0);
                    const securityPrice = Math.abs(getUtilityConstant('Security', unit.property_id)?.price ?? utilitySettings.security_fee ?? newLatestReading.security_fee ?? 0);
                    const servicePrice = Math.abs(getUtilityConstant('Service', unit.property_id)?.price ?? utilitySettings.service_fee ?? (newLatestReading.service_fee ?? 0));
                    
                    let customUtilitiesTotal = 0;
                    if (newLatestReading.custom_utilities) {
                      Object.values(newLatestReading.custom_utilities).forEach(val => {
                        customUtilitiesTotal += Math.abs(Number(val) || 0);
                      });
                    }
                    const totalBill = readingRent + electricityBill + waterBill + garbagePrice + securityPrice + servicePrice + customUtilitiesTotal + (newLatestReading.other_charges || 0);
                    return { ...unit, latestReading: newLatestReading, totalBill };
                  }
                  return unit;
                });
                setUnits(sortUnitsChronologically(updatedUnits));
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
    
    // Get fixed utility prices from database via utility_constants
    const currentPropertyId = formData.property_id || units.find((u) => u.id === formData.unit_id)?.property_id;
    const garbagePrice = getUtilityConstant('Garbage', currentPropertyId)?.price || utilitySettings.garbage_fee || 0;
    const securityPrice = getUtilityConstant('Security', currentPropertyId)?.price || utilitySettings.security_fee || 0;
    const servicePrice = getUtilityConstant('Service', currentPropertyId)?.price || utilitySettings.service_fee || 0;
    const electricityConstant = getUtilityConstant('Electricity', currentPropertyId)?.constant || utilitySettings.electricity_constant || 1;
    const waterConstant = getUtilityConstant('Water', currentPropertyId)?.constant || utilitySettings.water_constant || 1;
    const customUtilityValues = buildCustomUtilityValues(currentPropertyId);
    
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
      rent_amount: 0,
      custom_utilities: customUtilityValues,
      other_charges: 0,
      status: 'pending',
    });
    setShowForm(true);
  };

  const handleEditReading = (reading: UtilityReading) => {
    const customUtilityValues = buildCustomUtilityValues(reading.property_id);
    const electricityConstant = getUtilityConstant('Electricity', reading.property_id)?.constant || utilitySettings.electricity_constant || 1;
    const waterConstant = getUtilityConstant('Water', reading.property_id)?.constant || utilitySettings.water_constant || 1;

    setEditingReading(reading);
    setFormData({
      ...reading,
      reading_month: (reading.reading_month || '').substring(0, 7),
      electricity_rate: electricityConstant,
      water_rate: waterConstant,
      rent_amount: reading.rent_amount ?? getUnitRent(reading.unit_id, reading.property_id),
      custom_utilities: customUtilityValues,
      garbage_fee: getUtilityConstant('Garbage', reading.property_id)?.price ?? utilitySettings.garbage_fee ?? reading.garbage_fee ?? 0,
      security_fee: getUtilityConstant('Security', reading.property_id)?.price ?? utilitySettings.security_fee ?? reading.security_fee ?? 0,
      service_fee: getUtilityConstant('Service', reading.property_id)?.price ?? utilitySettings.service_fee ?? (reading.service_fee ?? 0),
    });
    setShowForm(true);
  };

  const handleUnitChange = (unitId: string) => {
    const selectedUnit = units.find(u => u.id === unitId);
    if (selectedUnit) {
      const customUtilityValues = buildCustomUtilityValues(selectedUnit.property_id);
      const rentAmount = Math.abs(selectedUnit.rent_amount ?? selectedUnit.unit_price ?? selectedUnit.unit_type_price ?? 0);
      
      // Get fixed utility prices from superadmin settings (utility_constants table)
      const garbagePrice = getUtilityConstant('Garbage', selectedUnit.property_id)?.price || utilitySettings.garbage_fee || 0;
      const securityPrice = getUtilityConstant('Security', selectedUnit.property_id)?.price || utilitySettings.security_fee || 0;
      const servicePrice = getUtilityConstant('Service', selectedUnit.property_id)?.price || utilitySettings.service_fee || 0;
      const electricityConstant = getUtilityConstant('Electricity', selectedUnit.property_id)?.constant || utilitySettings.electricity_constant || 1;
      const waterConstant = getUtilityConstant('Water', selectedUnit.property_id)?.constant || utilitySettings.water_constant || 1;
      
      setFormData(prev => ({
        ...prev,
        unit_id: unitId,
        property_id: selectedUnit.property_id,
        tenant_id: selectedUnit.tenant_id || '',
        rent_amount: rentAmount,
        custom_utilities: customUtilityValues,
        garbage_fee: garbagePrice,
        security_fee: securityPrice,
        service_fee: servicePrice,
        electricity_rate: electricityConstant,
        water_rate: waterConstant,
      }));
    }
  };


  const handleSaveReading = async () => {
    if (!formData.unit_id || !formData.property_id || !formData.reading_month) {
      toast.error('Please fill in all required fields');
      return;
    }

    let saveToastId: string | number | undefined;

    try {
      setSaving(true);
      saveToastId = toast.loading('Saving reading...');

      const electricityEnabled = isUtilityActiveForProperty('Electricity', formData.property_id);
      const waterEnabled = isUtilityActiveForProperty('Water', formData.property_id);

      const normalizedReading: UtilityReading = {
        ...formData,
        previous_reading: electricityEnabled ? Number(formData.previous_reading || 0) : 0,
        current_reading: electricityEnabled ? Number(formData.current_reading || 0) : 0,
        water_previous_reading: waterEnabled ? Number(formData.water_previous_reading || 0) : 0,
        water_current_reading: waterEnabled ? Number(formData.water_current_reading || 0) : 0,
        rent_amount: getUnitRent(formData.unit_id, formData.property_id),
      };

      const bills = calculateBills(normalizedReading);
      const payload = {
        tenant_id: formData.tenant_id || null,
        unit_id: formData.unit_id,
        property_id: formData.property_id,
        reading_month: `${formData.reading_month}-01`,
        previous_reading: normalizedReading.previous_reading,
        current_reading: normalizedReading.current_reading,
        electricity_rate: normalizedReading.electricity_rate,
        water_previous_reading: normalizedReading.water_previous_reading,
        water_current_reading: normalizedReading.water_current_reading,
        water_rate: normalizedReading.water_rate,
        water_bill: bills.waterBill,
        garbage_fee: bills.garbagePrice,
        security_fee: bills.securityPrice,
        service_fee: bills.servicePrice,
        custom_utilities: bills.customUtilityValues || {},
        other_charges: Math.abs(normalizedReading.other_charges || 0),
        status: formData.status,
      };

      if (editingReading?.id) {
        const { data: updatedReading, error } = await supabase
          .from('utility_readings')
          .update(payload)
          .eq('id', editingReading.id)
          .select('*')
          .single();

        if (error) throw error;
        if (!updatedReading) throw new Error('Reading was not updated. Please check access permissions.');
        
        // Update readings state immediately for instant UI feedback
        setReadings(prevReadings =>
          prevReadings.map(r => r.id === updatedReading.id ? updatedReading : r)
        );
        
        // Update units with new calculation
        setUnits(prevUnits =>
          sortUnitsChronologically(prevUnits.map(unit => {
            if (unit.id === updatedReading.unit_id) {
              const rentAmount = Math.abs(unit.rent_amount ?? unit.unit_price ?? unit.unit_type_price ?? 0);
              const electricityUsage = Math.abs(updatedReading.current_reading - updatedReading.previous_reading);
              const electricityBill = electricityUsage * updatedReading.electricity_rate;
              const waterUsage = Math.abs((updatedReading.water_current_reading || 0) - (updatedReading.water_previous_reading || 0));
              const waterBill = waterUsage * (updatedReading.water_rate || 0);
              const garbagePrice = Math.abs(getUtilityConstant('Garbage', unit.property_id)?.price ?? utilitySettings.garbage_fee ?? updatedReading.garbage_fee ?? 0);
              const securityPrice = Math.abs(getUtilityConstant('Security', unit.property_id)?.price ?? utilitySettings.security_fee ?? updatedReading.security_fee ?? 0);
              const servicePrice = Math.abs(getUtilityConstant('Service', unit.property_id)?.price ?? utilitySettings.service_fee ?? (updatedReading.service_fee ?? 0));
              let customUtilitiesTotal = 0;
              if (updatedReading.custom_utilities) {
                Object.values(updatedReading.custom_utilities).forEach(val => {
                  customUtilitiesTotal += Math.abs(Number(val) || 0);
                });
              }
              const readingRent = Math.abs(updatedReading.rent_amount ?? rentAmount);
              const totalBill = readingRent + electricityBill + waterBill + garbagePrice + securityPrice + servicePrice + customUtilitiesTotal + (updatedReading.other_charges || 0);
              return { ...unit, latestReading: updatedReading, totalBill };
            }
            return unit;
          }))
        );
        
        toast.success('Reading updated successfully', { id: saveToastId });
      } else {
        // Check if a reading already exists for this unit and month
        const { data: existingReading, error: checkError } = await supabase
          .from('utility_readings')
          .select('id')
          .eq('unit_id', formData.unit_id)
          .eq('reading_month', `${formData.reading_month}-01`)
          .maybeSingle();

        if (checkError) {
          throw checkError;
        }

        if (existingReading) {
          // Reading already exists, update it instead
          const { data: overwrittenReading, error: updateError } = await supabase
            .from('utility_readings')
            .update(payload)
            .eq('id', existingReading.id)
            .select('*')
            .single();

          if (updateError) throw updateError;
          if (!overwrittenReading) throw new Error('Reading was not updated. Please check access permissions.');
          
          // Update readings state immediately
          setReadings(prevReadings =>
            prevReadings.map(r => r.id === overwrittenReading.id ? overwrittenReading : r)
          );
          
          // Update units with new calculation
          setUnits(prevUnits =>
            sortUnitsChronologically(prevUnits.map(unit => {
              if (unit.id === overwrittenReading.unit_id) {
                const rentAmount = Math.abs(unit.rent_amount ?? unit.unit_price ?? unit.unit_type_price ?? 0);
                const electricityUsage = Math.abs(overwrittenReading.current_reading - overwrittenReading.previous_reading);
                const electricityBill = electricityUsage * overwrittenReading.electricity_rate;
                const waterUsage = Math.abs((overwrittenReading.water_current_reading || 0) - (overwrittenReading.water_previous_reading || 0));
                const waterBill = waterUsage * (overwrittenReading.water_rate || 0);
                const garbagePrice = Math.abs(getUtilityConstant('Garbage', unit.property_id)?.price ?? utilitySettings.garbage_fee ?? overwrittenReading.garbage_fee ?? 0);
                const securityPrice = Math.abs(getUtilityConstant('Security', unit.property_id)?.price ?? utilitySettings.security_fee ?? overwrittenReading.security_fee ?? 0);
                const servicePrice = Math.abs(getUtilityConstant('Service', unit.property_id)?.price ?? utilitySettings.service_fee ?? (overwrittenReading.service_fee ?? 0));
                let customUtilitiesTotal = 0;
                if (overwrittenReading.custom_utilities) {
                  Object.values(overwrittenReading.custom_utilities).forEach(val => {
                    customUtilitiesTotal += Math.abs(Number(val) || 0);
                  });
                }
                const readingRent = Math.abs(overwrittenReading.rent_amount ?? rentAmount);
                const totalBill = readingRent + electricityBill + waterBill + garbagePrice + securityPrice + servicePrice + customUtilitiesTotal + (overwrittenReading.other_charges || 0);
                return { ...unit, latestReading: overwrittenReading, totalBill };
              }
              return unit;
            }))
          );
          
          toast.success('Reading updated successfully', { id: saveToastId });
        } else {
          // No existing reading, insert it
          const { error: insertError, data } = await supabase
            .from('utility_readings')
            .insert([payload])
            .select('*');

          if (insertError) throw insertError;
          if (!data || data.length === 0) throw new Error('Reading was not created. Please try again.');
          
          const newReading = data[0];
          
          // Add to readings state immediately
          setReadings(prevReadings => [newReading, ...prevReadings]);
          
          // Update units with new reading
          setUnits(prevUnits =>
            sortUnitsChronologically(prevUnits.map(unit => {
              if (unit.id === newReading.unit_id) {
                const rentAmount = Math.abs(unit.rent_amount ?? unit.unit_price ?? unit.unit_type_price ?? 0);
                const electricityUsage = Math.abs(newReading.current_reading - newReading.previous_reading);
                const electricityBill = electricityUsage * newReading.electricity_rate;
                const waterUsage = Math.abs((newReading.water_current_reading || 0) - (newReading.water_previous_reading || 0));
                const waterBill = waterUsage * (newReading.water_rate || 0);
                const garbagePrice = Math.abs(getUtilityConstant('Garbage', unit.property_id)?.price ?? utilitySettings.garbage_fee ?? newReading.garbage_fee ?? 0);
                const securityPrice = Math.abs(getUtilityConstant('Security', unit.property_id)?.price ?? utilitySettings.security_fee ?? newReading.security_fee ?? 0);
                const servicePrice = Math.abs(getUtilityConstant('Service', unit.property_id)?.price ?? utilitySettings.service_fee ?? (newReading.service_fee ?? 0));
                let customUtilitiesTotal = 0;
                if (newReading.custom_utilities) {
                  Object.values(newReading.custom_utilities).forEach(val => {
                    customUtilitiesTotal += Math.abs(Number(val) || 0);
                  });
                }
                const readingRent = Math.abs(newReading.rent_amount ?? rentAmount);
                const totalBill = readingRent + electricityBill + waterBill + garbagePrice + securityPrice + servicePrice + customUtilitiesTotal + (newReading.other_charges || 0);
                return { ...unit, latestReading: newReading, totalBill };
              }
              return unit;
            }))
          );
          
          toast.success('Reading created successfully', { id: saveToastId });
        }
      }

      // Close form
      setShowForm(false);
      
    } catch (err: any) {
      console.error('Error saving reading:', err);
      const detailedMessage = err?.message || err?.details || err?.hint || 'Failed to save reading';
      toast.error(detailedMessage, saveToastId ? { id: saveToastId } : undefined);
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

  const displayedUnits = sortUnitsChronologically(units);
  const properties = [...new Set(displayedUnits.map(u => u.property_name))];
  const currentPropertyId = formData.property_id || displayedUnits.find(u => u.id === formData.unit_id)?.property_id;
  const activeUtilitiesForCurrentProperty = getActiveUtilitiesForProperty(currentPropertyId);
  const activeCustomUtilitiesForCurrentProperty = activeUtilitiesForCurrentProperty.filter(
    (u) => !['Electricity', 'Water', 'Garbage', 'Security', 'Service'].includes(u.utility_name)
  );

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
          floor_number,
          property_id,
          price,
          properties(name),
          property_unit_types(unit_type_name, price_per_unit),
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

      const leaseRentByUnit = await buildLeaseRentByUnit((unitsData || []).map((u: any) => u.id));

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
          const rentAmount = Math.abs(leaseRentByUnit[unit.id] ?? unit.price ?? unit.property_unit_types?.price_per_unit ?? 0);
          
          let totalBill = 0;
          if (latestReading) {
            const electricityUsage = Math.abs(latestReading.current_reading - latestReading.previous_reading);
            const electricityBill = electricityUsage * latestReading.electricity_rate;
            const waterUsage = Math.abs((latestReading.water_current_reading || 0) - (latestReading.water_previous_reading || 0));
            const waterBill = waterUsage * (latestReading.water_rate || 0);
            const readingRent = Math.abs(latestReading.rent_amount ?? rentAmount);
            let customUtilitiesTotal = 0;
            if (latestReading.custom_utilities) {
              Object.values(latestReading.custom_utilities).forEach(val => {
                customUtilitiesTotal += Number(val) || 0;
              });
            }
            totalBill = readingRent + electricityBill + waterBill + latestReading.garbage_fee + latestReading.security_fee + (latestReading.service_fee || 0) + customUtilitiesTotal + latestReading.other_charges;
          }

          return {
            id: unit.id,
            unit_number: unit.unit_number,
            floor_number: unit.floor_number,
            unit_type: unit.property_unit_types?.unit_type_name || 'Unknown',
            property_id: unit.property_id,
            property_name: unit.properties?.name || 'Unknown',
            tenant_id: tenantId,
            tenant_name: tenantName,
            tenant_number: tenantNumber,
            rent_amount: rentAmount,
            unit_price: unit.price || 0,
            unit_type_price: unit.property_unit_types?.price_per_unit || 0,
            latestReading: latestReading,
            totalBill: totalBill,
          };
        });
      }

      setUnits(sortUnitsChronologically(enrichedUnits));
      setReadings(readingsData || []);
      toast.success('Data refreshed successfully');
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      toast.error('Failed to refresh data');
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-100 via-white to-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <Zap className="w-10 h-10 text-amber-500" />
              Billing and Invoicing
            </h1>
            <p className="text-slate-600 mt-2">
              View all units and manage billing details. Invoicing is calculated automatically using configured rates.
            </p>
            <div className="mt-3 inline-flex items-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              Property-specific utility rates are now enforced per unit property
            </div>
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
            className="fixed inset-0 bg-black/45 flex items-start justify-center z-50"
          >
            <Card className="w-screen h-screen max-w-none rounded-none border-0 bg-gradient-to-b from-slate-50 to-white flex flex-col">
              <CardHeader className="shrink-0 backdrop-blur bg-white/90 border-b px-4 sm:px-6 lg:px-8 pt-6 pb-4">
                <div className="w-full flex flex-row items-center justify-between">
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
                </div>
              </CardHeader>

              <CardContent className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="w-full space-y-6">
                {/* Utility Constants Info */}
                {activeUtilitiesForCurrentProperty.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Utility Calculation Guide
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      {activeUtilitiesForCurrentProperty.filter(u => u.is_metered).map(u => (
                        <div key={u.id}>
                          <span className="font-semibold text-slate-800">{u.utility_name}:</span> (Current - Previous) × {u.constant} = Bill
                        </div>
                      ))}
                      {activeUtilitiesForCurrentProperty.filter(u => !u.is_metered).map(u => (
                        <div key={u.id}>
                          <span className="font-semibold text-slate-800">{u.utility_name}:</span> Fixed amount from settings
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unit & Tenant Info */}
                {formData.unit_id && (
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <Home className="h-4 w-4 text-blue-600" />
                      Unit Details
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-semibold text-slate-800">Unit:</span> {units.find(u => u.id === formData.unit_id)?.unit_number}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Type:</span> {units.find(u => u.id === formData.unit_id)?.unit_type}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Tenant:</span> {units.find(u => u.id === formData.unit_id)?.tenant_name}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Property:</span> {units.find(u => u.id === formData.unit_id)?.property_name}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Monthly Rent:</span> {formatKES(billDetails.rentAmount)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-white rounded-lg border border-slate-200 p-4">
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
                      {displayedUnits.map(unit => (
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

                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                {/* Electricity Section */}
                {isUtilityActiveForProperty('Electricity', currentPropertyId) && (
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 h-full">
                  <h4 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    Electricity Meter Readings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="mt-2"
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
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <Label className="text-sm text-slate-600 font-medium">Metering Constant (Set by SuperAdmin)</Label>
                    <div className="mt-2 text-xl font-semibold text-slate-900">
                      {getUtilityConstant('Electricity', currentPropertyId)?.constant || utilitySettings.electricity_constant || 1}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Fixed by admin - cannot be changed</p>
                  </div>
                </div>
                )}

                {/* Water Section */}
                {isUtilityActiveForProperty('Water', currentPropertyId) && (
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 h-full">
                  <h4 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    Water Meter Readings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="mt-2"
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
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <Label className="text-sm text-slate-600 font-medium">Metering Constant (Set by SuperAdmin)</Label>
                    <div className="mt-2 text-xl font-semibold text-slate-900">
                      {getUtilityConstant('Water', currentPropertyId)?.constant || utilitySettings.water_constant || 1}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Fixed by admin - cannot be changed</p>
                  </div>
                </div>
                )}
                </div>

                {(isUtilityActiveForProperty('Garbage', currentPropertyId) || isUtilityActiveForProperty('Security', currentPropertyId) || isUtilityActiveForProperty('Service', currentPropertyId)) && (
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                  <h4 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Fixed Utility Fees (Set by SuperAdmin)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {isUtilityActiveForProperty('Garbage', currentPropertyId) && (
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <Label className="text-sm text-slate-600 font-medium">Garbage Fee</Label>
                        <div className="mt-2 text-2xl font-semibold text-slate-900">
                          {formatKES(getUtilityConstant('Garbage', currentPropertyId)?.price ?? utilitySettings.garbage_fee ?? 0)}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Cannot be modified - set by admin</p>
                      </div>
                    )}

                    {isUtilityActiveForProperty('Security', currentPropertyId) && (
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <Label className="text-sm text-slate-600 font-medium">Security Fee</Label>
                        <div className="mt-2 text-2xl font-semibold text-slate-900">
                          {formatKES(getUtilityConstant('Security', currentPropertyId)?.price ?? utilitySettings.security_fee ?? 0)}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Cannot be modified - set by admin</p>
                      </div>
                    )}

                    {isUtilityActiveForProperty('Service', currentPropertyId) && (
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <Label className="text-sm text-slate-600 font-medium">Service Fee</Label>
                        <div className="mt-2 text-2xl font-semibold text-slate-900">
                          {formatKES(getUtilityConstant('Service', currentPropertyId)?.price ?? utilitySettings.service_fee ?? 0)}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Cannot be modified - set by admin</p>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {formData.unit_id && (
                  <div className="bg-white p-5 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-900 text-base mb-2">Monthly Rent (Auto)</h4>
                    <div className="text-2xl font-semibold text-slate-900">{formatKES(billDetails.rentAmount)}</div>
                    <p className="text-xs text-slate-500 mt-1">Derived from the assigned unit's type; locked for managers.</p>
                  </div>
                )}

                <div className="bg-white p-5 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900 text-base flex items-center gap-2 mb-3">
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
                      className="mt-2"
                      placeholder="Enter any additional charges"
                    />
                  </div>
                </div>

                {/* All Custom Utilities from Database */}
                {activeCustomUtilitiesForCurrentProperty.length > 0 && (
                  <div className="space-y-4 border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-slate-700">Custom Utilities (Added by SuperAdmin)</h4>
                      <span className="text-xs text-slate-500">Read-only constants and fixed prices</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {activeCustomUtilitiesForCurrentProperty.map(utility => (
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
                {formData.unit_id && (
                  <Card className="bg-white border-slate-200">
                    <CardContent className="pt-6">
                      <div className="space-y-4 text-sm">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <h3 className="font-semibold text-slate-900">Bill Calculation Breakdown</h3>
                          <span className="text-xs text-slate-500">Live preview</span>
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
                        <div className="space-y-2 border-t border-slate-200 pt-3">
                          <div className="flex justify-between">
                            <span className="text-slate-700">Monthly Rent</span>
                            <span className="font-semibold">KES {billDetails.rentAmount.toFixed(2)}</span>
                          </div>
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
                        <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900 bg-slate-50 p-3 rounded">
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

              <CardFooter className="shrink-0 border-t bg-white/95 backdrop-blur px-4 sm:px-6 lg:px-8 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
                <div className="w-full flex justify-end gap-3">
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
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}



        {/* Units & Tenants List */}
        <Card className="border-slate-200 shadow-sm">
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
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
                    {displayedUnits.map(unit => (
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
                                  rent_amount: Math.abs(unit.rent_amount ?? unit.unit_price ?? unit.unit_type_price ?? 0),
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
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ManagerUtilityReadings;
