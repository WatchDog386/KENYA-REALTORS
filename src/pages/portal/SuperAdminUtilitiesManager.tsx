import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Droplets,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Filter,
  Eye,
  ChevronRight,
  Calendar,
  DollarSign,
  Home,
  User,
  FileDown,
  Plus,
  X,
  Users,
  Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface UtilityReading {
  id: string;
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
  tenant_email?: string;
  tenant_phone?: string;
  unit_number?: string;
  property_name?: string;
}

interface UtilitySettings {
  id?: string;
  water_fee: number;
  electricity_fee: number;
  garbage_fee: number;
  security_fee: number;
  service_fee: number;
  water_constant: number;
  electricity_constant: number;
  updated_at?: string;
}

interface UtilityConstant {
  id: string;
  utility_name: string;
  constant: number;
  price?: number;
  is_metered: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface TenantWithReadings {
  tenant_id: string;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  unit_number: string;
  property_name: string;
  total_due: number;
  status: 'pending' | 'paid';
  readings: UtilityReading[];
  latest_reading?: UtilityReading;
}

const SuperAdminUtilitiesManager = () => {
  const [settings, setSettings] = useState<UtilitySettings>({
    water_fee: 0,
    electricity_fee: 0,
    garbage_fee: 0,
    security_fee: 0,
    service_fee: 0,
    water_constant: 1,
    electricity_constant: 1,
  });
  const [utilityConstants, setUtilityConstants] = useState<UtilityConstant[]>([]);
  const [tenantsWithReadings, setTenantsWithReadings] = useState<TenantWithReadings[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<TenantWithReadings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProperty, setFilterProperty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState<TenantWithReadings | null>(null);
  const [properties, setProperties] = useState<string[]>([]);
  const [showAddUtility, setShowAddUtility] = useState(false);
  const [newUtilityName, setNewUtilityName] = useState('');
  const [newUtilityConstant, setNewUtilityConstant] = useState(1);
  const [newUtilityPrice, setNewUtilityPrice] = useState(0);
  const [newUtilityIsMetered, setNewUtilityIsMetered] = useState(false);
  const [updatingUtilityId, setUpdatingUtilityId] = useState<string | null>(null);
  const [updatingField, setUpdatingField] = useState<string | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch utility settings and constants
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("utility_settings")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setSettings({
            id: data.id,
            water_fee: Number(data.water_fee) || 0,
            electricity_fee: Number(data.electricity_fee) || 0,
            garbage_fee: Number(data.garbage_fee) || 0,
            security_fee: Number(data.security_fee) || 0,
            service_fee: Number(data.service_fee) || 0,
            water_constant: Number(data.water_constant) || 1,
            electricity_constant: Number(data.electricity_constant) || 1,
          });
        }

        // Fetch utility constants - ALWAYS get fresh data
        const { data: constants, error: constantsError } = await supabase
          .from("utility_constants")
          .select("*")
          .order("utility_name");

        if (constantsError && constantsError.code !== 'PGRST116') throw constantsError;

        if (constants) {
          console.log("Fetched utility constants:", constants);
          setUtilityConstants(constants);
        }
      } catch (err: any) {
        console.error("Error fetching utility settings:", err);
        setError(err.message || "Failed to load utility settings");
      }
    };

    fetchSettings();

    // Setup real-time subscription for utility constants
    const channel = supabase
      .channel('utility_constants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'utility_constants',
        },
        async (payload) => {
          // Refresh all constants when any change occurs
          const { data: updatedConstants } = await supabase
            .from('utility_constants')
            .select('*')
            .order('utility_name');

          if (updatedConstants) {
            console.log('Real-time update received. Updated constants:', updatedConstants);
            setUtilityConstants(updatedConstants);
          }
        }
      )
      .subscribe();

    // Cleanup: unsubscribe and clear any pending timeouts on unmount
    return () => {
      channel.unsubscribe();
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, []);

  // Fetch all utility readings with tenant details
  useEffect(() => {
    const fetchAllReadings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all utility readings
        const { data: readings, error: readingsError } = await supabase
          .from("utility_readings")
          .select("*")
          .order("reading_month", { ascending: false });

        if (readingsError) {
          console.error("Readings error details:", readingsError);
          
          // Handle common errors
          if (readingsError.code === 'PGRST116') {
            // Table doesn't exist or no rows
            console.warn("No utility readings found or table issue");
            setTenantsWithReadings([]);
            setProperties([]);
            setLoading(false);
            return;
          }
          
          throw readingsError;
        }

        if (!readings || readings.length === 0) {
          console.log("No utility readings in database yet");
          setTenantsWithReadings([]);
          setProperties([]);
          setLoading(false);
          return;
        }

        // Fetch unit details for each reading
        const tenantMap = new Map<string, TenantWithReadings>();

        for (const reading of readings) {
          try {
            // Fetch unit details
            const { data: unit, error: unitError } = await supabase
              .from("units")
              .select("unit_number, property_id")
              .eq("id", reading.unit_id)
              .single();

            if (unitError) {
              console.error("Error fetching unit:", unitError);
              continue;
            }

            // Fetch property details
            const { data: property, error: propertyError } = await supabase
              .from("properties")
              .select("name")
              .eq("id", reading.property_id)
              .single();

            if (propertyError) {
              console.error("Error fetching property:", propertyError);
              continue;
            }

            // Fetch tenant details
            let tenantName = 'Unknown';
            let tenantEmail = '';
            let tenantPhone = '';

            if (reading.tenant_id) {
              const { data: tenant, error: tenantError } = await supabase
                .from("profiles")
                .select("first_name, last_name, email, phone")
                .eq("id", reading.tenant_id)
                .single();

              if (!tenantError && tenant) {
                tenantName = tenant.first_name && tenant.last_name 
                  ? `${tenant.first_name} ${tenant.last_name}`
                  : 'Unknown Tenant';
                tenantEmail = tenant.email || '';
                tenantPhone = tenant.phone || '';
              }
            }

            const key = `${reading.tenant_id}-${reading.unit_id}`;
            
            // Calculate bills
            const electricityUsage = Math.abs(reading.current_reading - reading.previous_reading);
            const electricityBill = electricityUsage * reading.electricity_rate;
            
            const waterUsage = Math.abs((reading.water_current_reading || 0) - (reading.water_previous_reading || 0));
            const waterBill = waterUsage * (reading.water_rate || 0);

            let customUtilitiesTotal = 0;
            if (reading.custom_utilities) {
              Object.values(reading.custom_utilities).forEach(val => {
                customUtilitiesTotal += Number(val) || 0;
              });
            }

            const totalBill = electricityBill + waterBill + reading.garbage_fee + 
                             reading.security_fee + (reading.service_fee || 0) + customUtilitiesTotal + reading.other_charges;

            const enrichedReading = {
              ...reading,
              electricity_usage: electricityUsage,
              electricity_bill: electricityBill,
              total_bill: totalBill,
              tenant_name: tenantName,
              tenant_email: tenantEmail,
              tenant_phone: tenantPhone,
              unit_number: unit.unit_number,
              property_name: property.name,
            };

            if (!tenantMap.has(key)) {
              tenantMap.set(key, {
                tenant_id: reading.tenant_id,
                tenant_name: tenantName,
                tenant_email: tenantEmail,
                tenant_phone: tenantPhone,
                unit_number: unit.unit_number,
                property_name: property.name,
                total_due: totalBill,
                status: reading.status,
                readings: [enrichedReading],
                latest_reading: enrichedReading,
              });
            } else {
              const existing = tenantMap.get(key)!;
              existing.readings.push(enrichedReading);
              existing.total_due += totalBill;
              if (!existing.latest_reading || 
                  new Date(enrichedReading.reading_month) > new Date(existing.latest_reading.reading_month)) {
                existing.latest_reading = enrichedReading;
              }
            }
          } catch (itemError) {
            console.error("Error processing reading item:", itemError);
            continue;
          }
        }

        const tenantList = Array.from(tenantMap.values());
        const propertyNames = [...new Set(tenantList.map(t => t.property_name))];

        setTenantsWithReadings(tenantList);
        setProperties(propertyNames.sort());
      } catch (err: any) {
        console.error("Error fetching readings:", err);
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);
        setError(err.message || "Failed to load utility readings. Please check your database setup.");
        toast.error(err.message || "Failed to load utility readings");
      } finally {
        setLoading(false);
      }
    };

    fetchAllReadings();
  }, []);

  // Filter tenants
  useEffect(() => {
    let filtered = tenantsWithReadings;

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tenant_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterProperty !== 'all') {
      filtered = filtered.filter(t => t.property_name === filterProperty);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    setFilteredTenants(filtered);
  }, [tenantsWithReadings, searchTerm, filterProperty, filterStatus]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        water_fee: settings.water_fee,
        electricity_fee: settings.electricity_fee,
        garbage_fee: settings.garbage_fee,
        security_fee: settings.security_fee,
        service_fee: settings.service_fee,
        water_constant: settings.water_constant,
        electricity_constant: settings.electricity_constant,
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        // Update existing record
        const { error } = await supabase
          .from("utility_settings")
          .update(payload)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from("utility_settings")
          .insert([payload])
          .select();

        if (error) throw error;

        // Update state with the new record's ID
        if (data && data.length > 0) {
          setSettings(prev => ({
            ...prev,
            id: data[0].id,
          }));
        }
      }

      // Refetch to confirm save
      const { data, error: fetchError } = await supabase
        .from("utility_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (data) {
        setSettings({
          id: data.id,
          water_fee: Number(data.water_fee) || 0,
          electricity_fee: Number(data.electricity_fee) || 0,
          garbage_fee: Number(data.garbage_fee) || 0,
          security_fee: Number(data.security_fee) || 0,
          service_fee: Number(data.service_fee) || 0,
          water_constant: Number(data.water_constant) || 1,
          electricity_constant: Number(data.electricity_constant) || 1,
        });
      }

      toast.success("Utility settings saved successfully");
    } catch (err: any) {
      console.error("Error saving utility settings:", err);
      setError(err.message || "Failed to save utility settings");
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddUtility = async () => {
    if (!newUtilityName.trim()) {
      toast.error("Please enter a utility name");
      return;
    }

    if (!newUtilityIsMetered && newUtilityPrice === 0) {
      toast.error("Please enter a price for fixed utilities");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Check if utility already exists
      const existing = utilityConstants.find(u => u.utility_name.toLowerCase() === newUtilityName.toLowerCase());
      if (existing) {
        toast.error("This utility already exists");
        return;
      }

      // Insert new utility constant
      const { data, error } = await supabase
        .from("utility_constants")
        .insert([{
          utility_name: newUtilityName,
          constant: newUtilityConstant,
          price: !newUtilityIsMetered ? newUtilityPrice : null,
          is_metered: newUtilityIsMetered,
          description: `${newUtilityIsMetered ? 'Metered' : 'Fixed'} utility - ${newUtilityName}`,
        }])
        .select();

      if (error) throw error;

      if (data) {
        // Refresh all constants from database to ensure persistence
        const { data: refreshedConstants, error: refreshError } = await supabase
          .from('utility_constants')
          .select('*')
          .order('utility_name');

        if (refreshError) throw refreshError;

        if (refreshedConstants) {
          setUtilityConstants(refreshedConstants);
        }

        setNewUtilityName('');
        setNewUtilityConstant(1);
        setNewUtilityPrice(0);
        setNewUtilityIsMetered(false);
        setShowAddUtility(false);
        toast.success("Utility added successfully");
      }
    } catch (err: any) {
      console.error("Error adding utility:", err);
      setError(err.message || "Failed to add utility");
      toast.error("Failed to add utility");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConstant = async (utilityId: string, newConstant: number) => {
    // Clear previous timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }

    // Update local state immediately for UI feedback
    setUtilityConstants(prev => prev.map(u => u.id === utilityId ? { ...u, constant: newConstant } : u));
    
    // Set updating state
    setUpdatingUtilityId(utilityId);
    setUpdatingField('constant');

    // Debounce the database update
    updateTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("utility_constants")
          .update({ 
            constant: newConstant,
            updated_at: new Date().toISOString(),
          })
          .eq("id", utilityId);

        if (error) {
          console.error("Update error:", error);
          throw error;
        }

        // Refresh all constants from database to ensure persistence
        const { data: refreshedConstants, error: refreshError } = await supabase
          .from('utility_constants')
          .select('*')
          .order('utility_name');

        if (refreshError) throw refreshError;

        if (refreshedConstants) {
          console.log('Constants refreshed from database:', refreshedConstants);
          setUtilityConstants(refreshedConstants);
        }

        toast.success("Constant updated successfully");
      } catch (err: any) {
        console.error("Error updating constant:", err);
        toast.error(`Failed to update constant: ${err.message}`);
        // Refresh to get current state from database
        const { data: refreshedConstants } = await supabase
          .from('utility_constants')
          .select('*')
          .order('utility_name');
        if (refreshedConstants) {
          setUtilityConstants(refreshedConstants);
        }
      } finally {
        setUpdatingUtilityId(null);
        setUpdatingField(null);
      }
    }, 800); // Wait 800ms after user stops typing
  };

  const handleUpdatePrice = async (utilityId: string, newPrice: number) => {
    // Clear previous timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }

    // Update local state immediately for UI feedback
    setUtilityConstants(prev => prev.map(u => u.id === utilityId ? { ...u, price: newPrice } : u));
    
    // Set updating state
    setUpdatingUtilityId(utilityId);
    setUpdatingField('price');

    // Debounce the database update
    updateTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("utility_constants")
          .update({ 
            price: newPrice,
            updated_at: new Date().toISOString(),
          })
          .eq("id", utilityId);

        if (error) {
          console.error("Update error:", error);
          throw error;
        }

        // Refresh all constants from database to ensure persistence
        const { data: refreshedConstants, error: refreshError } = await supabase
          .from('utility_constants')
          .select('*')
          .order('utility_name');

        if (refreshError) throw refreshError;

        if (refreshedConstants) {
          console.log('Constants refreshed from database:', refreshedConstants);
          setUtilityConstants(refreshedConstants);
        }

        toast.success("Price updated successfully");
      } catch (err: any) {
        console.error("Error updating price:", err);
        toast.error(`Failed to update price: ${err.message}`);
        // Refresh to get current state from database
        const { data: refreshedConstants } = await supabase
          .from('utility_constants')
          .select('*')
          .order('utility_name');
        if (refreshedConstants) {
          setUtilityConstants(refreshedConstants);
        }
      } finally {
        setUpdatingUtilityId(null);
        setUpdatingField(null);
      }
    }, 800); // Wait 800ms after user stops typing
  };

  const handleChange = (field: keyof UtilitySettings, value: string) => {
    const numValue = parseFloat(value);
    setSettings(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const totalFees =
    settings.water_fee +
    settings.electricity_fee +
    settings.garbage_fee +
    settings.security_fee +
    settings.service_fee;

  const handleDownloadBill = (tenant: TenantWithReadings) => {
    // Generate a simple bill text
    const latestReading = tenant.latest_reading;
    if (!latestReading) return;

    let customUtilitiesText = '';
    if (latestReading.custom_utilities) {
      Object.entries(latestReading.custom_utilities).forEach(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        customUtilitiesText += `${formattedKey.padEnd(40)} KES ${Number(value || 0).toFixed(2)}\n`;
      });
    }

    const billContent = `
================================
     UTILITY BILL STATEMENT
================================

TENANT INFORMATION:
Name: ${tenant.tenant_name}
Email: ${tenant.tenant_email}
Phone: ${tenant.tenant_phone}

PROPERTY & UNIT:
Property: ${tenant.property_name}
Unit: ${tenant.unit_number}

METER READINGS:
Month: ${new Date(latestReading.reading_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
Electricity Previous Reading: ${latestReading.previous_reading.toFixed(2)}
Electricity Current Reading: ${latestReading.current_reading.toFixed(2)}
Electricity Usage: ${latestReading.electricity_usage?.toFixed(2)} units

Water Previous Reading: ${(latestReading.water_previous_reading || 0).toFixed(2)}
Water Current Reading: ${(latestReading.water_current_reading || 0).toFixed(2)}
Water Usage: ${Math.abs((latestReading.water_current_reading || 0) - (latestReading.water_previous_reading || 0)).toFixed(2)} units

CHARGE BREAKDOWN:
Electricity (${latestReading.electricity_usage?.toFixed(2)} units @ KES ${latestReading.electricity_rate}):  KES ${latestReading.electricity_bill?.toFixed(2)}
Water (${Math.abs((latestReading.water_current_reading || 0) - (latestReading.water_previous_reading || 0)).toFixed(2)} units @ KES ${latestReading.water_rate || 0}):  KES ${latestReading.water_bill.toFixed(2)}
Garbage Fee:                              KES ${latestReading.garbage_fee.toFixed(2)}
Security Fee:                             KES ${latestReading.security_fee.toFixed(2)}
Service Fee:                              KES ${(latestReading.service_fee || 0).toFixed(2)}
${customUtilitiesText}Other Charges:                            KES ${latestReading.other_charges.toFixed(2)}

================================
TOTAL AMOUNT DUE:                  KES ${tenant.total_due.toFixed(2)}
================================

Status: ${tenant.status === 'paid' ? 'PAID' : 'PENDING'}

Generated: ${new Date().toLocaleDateString('en-US')}
`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(billContent));
    element.setAttribute('download', `Bill_${tenant.tenant_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success('Bill downloaded successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
          <Zap className="w-10 h-10 text-amber-500" />
          Utility Management
        </h1>
        <p className="text-slate-600 mt-2">
          Monitor and manage all utility readings, charges, and tenant billing
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}



      {/* Utility Constants Management Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Manage Utility Constants
            </CardTitle>
            <CardDescription>
              Configure constants for all available utilities (metered and fixed)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {utilityConstants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Utility Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Multiplier</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Fixed Price (KES)</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilityConstants.map(constant => (
                      <tr key={constant.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">{constant.utility_name}</td>
                        <td className="py-3 px-4">
                          <Badge variant={constant.is_metered ? "default" : "outline"}>
                            {constant.is_metered ? "Metered" : "Fixed"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={constant.constant}
                            onChange={e => handleUpdateConstant(constant.id, parseFloat(e.target.value))}
                            disabled={updatingUtilityId === constant.id && updatingField === 'constant'}
                            className={`w-24 px-2 py-1 border rounded text-center font-semibold transition-all ${
                              updatingUtilityId === constant.id && updatingField === 'constant'
                                ? 'border-blue-400 bg-blue-50 opacity-75'
                                : 'border-slate-300 hover:border-slate-400'
                            }`}
                            title={updatingUtilityId === constant.id ? 'Saving...' : 'Edit multiplier value'}
                          />
                          {updatingUtilityId === constant.id && updatingField === 'constant' && (
                            <span className="ml-2 text-xs text-blue-600">saving...</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {!constant.is_metered ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={constant.price || 0}
                              onChange={e => handleUpdatePrice(constant.id, parseFloat(e.target.value))}
                              disabled={updatingUtilityId === constant.id && updatingField === 'price'}
                              className={`w-28 px-2 py-1 border rounded text-center font-semibold transition-all ${
                                updatingUtilityId === constant.id && updatingField === 'price'
                                  ? 'border-green-400 bg-green-50 opacity-75'
                                  : 'border-slate-300 hover:border-slate-400'
                              }`}
                              title={updatingUtilityId === constant.id ? 'Saving...' : 'Edit fixed price'}
                            />
                          ) : (
                            <span className="text-slate-400 text-xs italic">N/A (Metered)</span>
                          )}
                          {updatingUtilityId === constant.id && updatingField === 'price' && (
                            <span className="ml-2 text-xs text-green-600">saving...</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs">{constant.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-600">No utility constants found.</p>
            )}

            {/* Add Custom Utility */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Add Custom Utility</h3>
                <Button
                  onClick={() => setShowAddUtility(!showAddUtility)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus size={16} />
                  {showAddUtility ? 'Cancel' : 'Add Utility'}
                </Button>
              </div>

              {showAddUtility && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                  <div>
                    <Label htmlFor="utility_name">Utility Name</Label>
                    <Input
                      id="utility_name"
                      placeholder="e.g., WIFI, Parking, Maintenance Fund"
                      value={newUtilityName}
                      onChange={e => setNewUtilityName(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="utility_constant">Constant Value</Label>
                      <Input
                        id="utility_constant"
                        type="number"
                        step="0.0001"
                        min="0"
                        value={newUtilityConstant}
                        onChange={e => setNewUtilityConstant(parseFloat(e.target.value))}
                        className="mt-2"
                      />
                      <p className="text-xs text-slate-500 mt-1">Usage × Constant = Bill (for metered)</p>
                    </div>

                    <div>
                      <Label htmlFor="utility_price">
                        {newUtilityIsMetered ? 'N/A - Metered' : 'Fixed Price (KES)'}
                      </Label>
                      <Input
                        id="utility_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newUtilityPrice}
                        onChange={e => setNewUtilityPrice(parseFloat(e.target.value))}
                        disabled={newUtilityIsMetered}
                        className="mt-2"
                        placeholder="Enter fixed fee amount"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {newUtilityIsMetered ? 'Price field disabled for metered utilities' : 'Flat fee charged to all tenants'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Utility Type</Label>
                    <div className="flex gap-4 mt-2 items-center">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newUtilityIsMetered}
                          onChange={e => {
                            setNewUtilityIsMetered(e.target.checked);
                            if (e.target.checked) setNewUtilityPrice(0);
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">Metered (usage-based)</span>
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {newUtilityIsMetered ? 'Usage will be multiplied by constant' : 'Fixed fee, no usage calculation'}
                    </p>
                  </div>

                  <Button
                    onClick={handleAddUtility}
                    disabled={saving}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? 'Adding...' : 'Add Utility'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tenants & Readings Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Tenant Utility Summary
            </CardTitle>
            <CardDescription>
              View all tenants with their utility readings and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs font-semibold text-slate-700 mb-2 block">
                  Search
                </Label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <Input
                    placeholder="Search tenant or unit..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs font-semibold text-slate-700 mb-2 block">
                  Property
                </Label>
                <select
                  value={filterProperty}
                  onChange={e => setFilterProperty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">All Properties</option>
                  {properties.map(prop => (
                    <option key={prop} value={prop}>
                      {prop}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs font-semibold text-slate-700 mb-2 block">
                  Status
                </Label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            {/* Tenants List */}
            {filteredTenants.length === 0 ? (
              <div className="text-center py-12">
                <Zap size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 text-lg">No utility readings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Tenant
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Unit
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Property
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Latest Usage
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Total Due
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">
                        Status
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map(tenant => (
                      <tr
                        key={`${tenant.tenant_id}-${tenant.unit_number}`}
                        className="border-b border-slate-100 hover:bg-slate-50 transition"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {tenant.tenant_name}
                            </p>
                            <p className="text-xs text-slate-500">{tenant.tenant_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">
                          {tenant.unit_number}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {tenant.property_name}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700">
                          {tenant.latest_reading?.electricity_usage?.toFixed(2) || '0.00'} units
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          KES {tenant.total_due.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={tenant.status === 'paid' ? 'default' : 'outline'}
                          >
                            {tenant.status === 'paid' ? (
                              <CheckCircle2 size={14} className="mr-1" />
                            ) : null}
                            {tenant.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => setSelectedTenant(tenant)}
                              className="p-2 hover:bg-blue-50 rounded text-blue-600 transition"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDownloadBill(tenant)}
                              className="p-2 hover:bg-green-50 rounded text-green-600 transition"
                              title="Download Bill"
                            >
                              <FileDown size={16} />
                            </button>
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

      {/* Tenant Detail Modal */}
      {selectedTenant && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle>{selectedTenant.tenant_name}</CardTitle>
                <CardDescription>{selectedTenant.unit_number} - {selectedTenant.property_name}</CardDescription>
              </div>
              <button
                onClick={() => setSelectedTenant(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Tenant Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="font-semibold text-slate-900">{selectedTenant.tenant_email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Phone</p>
                  <p className="font-semibold text-slate-900">{selectedTenant.tenant_phone}</p>
                </div>
              </div>

              {/* Readings History */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Reading History</h3>
                <div className="space-y-4">
                  {selectedTenant.readings.map((reading, idx) => (
                    <div key={reading.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {new Date(reading.reading_month).toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-slate-500">
                            Usage: {reading.electricity_usage?.toFixed(2)} units
                          </p>
                        </div>
                        <Badge variant={reading.status === 'paid' ? 'default' : 'outline'}>
                          {reading.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm border-t pt-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Electricity Bill:</span>
                          <span className="font-semibold">KES {reading.electricity_bill?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Water Bill:</span>
                          <span className="font-semibold">KES {reading.water_bill.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Garbage Fee:</span>
                          <span className="font-semibold">KES {reading.garbage_fee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Security Fee:</span>
                          <span className="font-semibold">KES {reading.security_fee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Service Fee:</span>
                          <span className="font-semibold">KES {(reading.service_fee || 0).toFixed(2)}</span>
                        </div>
                        {reading.custom_utilities && Object.entries(reading.custom_utilities).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="font-semibold">KES {Number(value || 0).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between">
                          <span className="text-slate-600">Other Charges:</span>
                          <span className="font-semibold">KES {reading.other_charges.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-bold text-slate-900">
                          <span>Total:</span>
                          <span>KES {reading.total_bill?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600">Total Amount Due</p>
                    <p className="text-3xl font-bold text-blue-600">
                      KES {selectedTenant.total_due.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign size={48} className="text-blue-300" />
                </div>
              </div>
            </CardContent>

            <CardFooter className="gap-3 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedTenant(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  handleDownloadBill(selectedTenant);
                  setSelectedTenant(null);
                }}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <FileDown size={18} />
                Download Bill
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SuperAdminUtilitiesManager;
