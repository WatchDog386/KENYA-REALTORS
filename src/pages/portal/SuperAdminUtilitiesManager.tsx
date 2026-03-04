import React, { useState, useEffect } from "react";
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
  Edit3,
  Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  property_id?: string;
  unit_id?: string;
  rent_amount: number;
  utility_total: number;
  total_due: number;
  status: 'pending' | 'paid';
  readings: UtilityReading[];
  latest_reading?: UtilityReading;
}

interface PropertyOption {
  id: string;
  name: string;
}

interface InvoiceDraft {
  tenant: TenantWithReadings;
  reading: UtilityReading;
  rentAmount: number;
  electricityBill: number;
  waterBill: number;
  garbageFee: number;
  securityFee: number;
  serviceFee: number;
  otherCharges: number;
  customUtilities: Record<string, number>;
  dueDate: string;
  notes: string;
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
  const [propertyOptions, setPropertyOptions] = useState<PropertyOption[]>([]);
  const [showAddUtility, setShowAddUtility] = useState(false);
  const [newUtilityName, setNewUtilityName] = useState('');
  const [newUtilityConstant, setNewUtilityConstant] = useState(1);
  const [newUtilityPrice, setNewUtilityPrice] = useState(0);
  const [newUtilityIsMetered, setNewUtilityIsMetered] = useState(false);
  const [newUtilityPropertyId, setNewUtilityPropertyId] = useState('');
  const [updatingUtilityId, setUpdatingUtilityId] = useState<string | null>(null);
  const [utilityDrafts, setUtilityDrafts] = useState<Record<string, { constant: string; price: string }>>({});
  const [invoiceDraft, setInvoiceDraft] = useState<InvoiceDraft | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

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

        const { data: propertyData, error: propertiesError } = await supabase
          .from("properties")
          .select("id, name")
          .order("name", { ascending: true });

        if (propertiesError) throw propertiesError;

        const mappedProperties = (propertyData || []).map((p: any) => ({ id: p.id, name: p.name }));
        setPropertyOptions(mappedProperties);
        if (!newUtilityPropertyId && mappedProperties.length > 0) {
          setNewUtilityPropertyId(mappedProperties[0].id);
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

    // Cleanup: unsubscribe on unmount
    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setUtilityDrafts((prev) => {
      const next: Record<string, { constant: string; price: string }> = { ...prev };

      for (const utility of utilityConstants) {
        if (updatingUtilityId === utility.id && prev[utility.id]) {
          continue;
        }

        next[utility.id] = {
          constant: String(utility.constant ?? 0),
          price: String(utility.price ?? 0),
        };
      }

      Object.keys(next).forEach((key) => {
        if (!utilityConstants.some((utility) => utility.id === key)) {
          delete next[key];
        }
      });

      return next;
    });
  }, [utilityConstants, updatingUtilityId]);

  // Render the index.html brand SVG into a PNG data URL for use in PDFs
  useEffect(() => {
    const svgMarkup = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="grad-front" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#E2D6B5"/></linearGradient><linearGradient id="grad-side" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#8A7D55"/></linearGradient><linearGradient id="grad-dark" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#998A5E"/><stop offset="100%" stop-color="#5C5035"/></linearGradient></defs><path fill="url(#grad-front)" d="M110 90 V170 L160 150 V70 L110 90 Z"/><path fill="url(#grad-dark)" d="M160 70 L180 80 V160 L160 150 Z"/><path fill="url(#grad-front)" d="M30 150 V50 L80 20 V120 L30 150 Z"/><path fill="url(#grad-side)" d="M80 20 L130 40 V140 L80 120 Z"/><g fill="#1a232e"><path d="M85 50 L100 56 V86 L85 80 Z"/><path d="M85 90 L100 96 V126 L85 120 Z"/><path d="M45 60 L55 54 V124 L45 130 Z"/><path d="M120 130 L140 122 V152 L120 160 Z"/></g></svg>`;

    const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 220;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, size, size);
        setLogoDataUrl(canvas.toDataURL('image/png'));
      }
      URL.revokeObjectURL(svgUrl);
    };
    img.onerror = () => URL.revokeObjectURL(svgUrl);
    img.src = svgUrl;
  }, []);


  const loadTenantReadings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: readings, error: readingsError } = await supabase
        .from("utility_readings")
        .select("*")
        .order("reading_month", { ascending: false });

      if (readingsError) {
        if (readingsError.code === 'PGRST116') {
          setTenantsWithReadings([]);
          setProperties([]);
          return;
        }
        throw readingsError;
      }

      if (!readings || readings.length === 0) {
        setTenantsWithReadings([]);
        setProperties([]);
        return;
      }

      const tenantMap = new Map<string, TenantWithReadings>();

      for (const reading of readings) {
        try {
          const { data: unit, error: unitError } = await supabase
            .from("units")
            .select("unit_number, property_id, price")
            .eq("id", reading.unit_id)
            .single();

          if (unitError || !unit) continue;

          const { data: property, error: propertyError } = await supabase
            .from("properties")
            .select("name")
            .eq("id", reading.property_id)
            .single();

          if (propertyError || !property) continue;

          let tenantName = 'Unknown';
          let tenantEmail = '';
          let tenantPhone = '';

          if (reading.tenant_id) {
            const { data: tenant } = await supabase
              .from("profiles")
              .select("first_name, last_name, email, phone")
              .eq("id", reading.tenant_id)
              .single();

            if (tenant) {
              tenantName = tenant.first_name && tenant.last_name
                ? `${tenant.first_name} ${tenant.last_name}`
                : 'Unknown Tenant';
              tenantEmail = tenant.email || '';
              tenantPhone = tenant.phone || '';
            }
          }

          const key = `${reading.tenant_id}-${reading.unit_id}`;
          const rentAmount = Number(unit.price || 0);

          const electricityUsage = Math.abs(reading.current_reading - reading.previous_reading);
          const electricityBill = Number(reading.electricity_bill || (electricityUsage * reading.electricity_rate));
          const waterUsage = Math.abs((reading.water_current_reading || 0) - (reading.water_previous_reading || 0));
          const waterBill = Number(reading.water_bill || (waterUsage * (reading.water_rate || 0)));

          let customUtilitiesTotal = 0;
          if (reading.custom_utilities) {
            Object.values(reading.custom_utilities).forEach((val) => {
              customUtilitiesTotal += Number(val) || 0;
            });
          }

          const utilityTotal =
            electricityBill +
            waterBill +
            Number(reading.garbage_fee || 0) +
            Number(reading.security_fee || 0) +
            Number(reading.service_fee || 0) +
            customUtilitiesTotal +
            Number(reading.other_charges || 0);

          const totalDue = rentAmount + utilityTotal;

          const enrichedReading: UtilityReading = {
            ...reading,
            electricity_usage: electricityUsage,
            electricity_bill: electricityBill,
            water_bill: waterBill,
            total_bill: utilityTotal,
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
              property_id: reading.property_id,
              unit_id: reading.unit_id,
              rent_amount: rentAmount,
              utility_total: utilityTotal,
              total_due: totalDue,
              status: reading.status,
              readings: [enrichedReading],
              latest_reading: enrichedReading,
            });
          } else {
            const existing = tenantMap.get(key)!;
            existing.readings.push(enrichedReading);
            if (!existing.latest_reading || new Date(enrichedReading.reading_month) > new Date(existing.latest_reading.reading_month)) {
              existing.latest_reading = enrichedReading;
              existing.utility_total = utilityTotal;
              existing.rent_amount = rentAmount;
              existing.total_due = totalDue;
              existing.status = reading.status;
            }
          }
        } catch (itemError) {
          console.error("Error processing reading item:", itemError);
          continue;
        }
      }

      const tenantList = Array.from(tenantMap.values());
      const propertyNames = [...new Set(tenantList.map((t) => t.property_name))];
      setTenantsWithReadings(tenantList);
      setProperties(propertyNames.sort());
    } catch (err: any) {
      console.error("Error fetching readings:", err);
      setError(err.message || "Failed to load utility readings. Please check your database setup.");
      toast.error(err.message || "Failed to load utility readings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenantReadings();

    // Setup real-time subscription for utility readings
    const readingsChannel = supabase
      .channel('utility_readings_superadmin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'utility_readings',
        },
        async (payload) => {
          console.log('Real-time utility reading change detected:', payload);
          // Refresh all readings when any change occurs
          await loadTenantReadings();
        }
      )
      .subscribe();

    // Cleanup: unsubscribe on unmount
    return () => {
      readingsChannel.unsubscribe();
    };
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

    if (!newUtilityPropertyId) {
      toast.error("Please select a property");
      return;
    }

    if (/\brent\b/i.test(newUtilityName.trim())) {
      toast.error("Rent is auto-fetched from tenant unit price and should not be added as a utility constant");
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

      if (data && data.length > 0) {
        const newUtility = data[0];

        const { error: assignmentError } = await supabase
          .from("property_utilities")
          .insert([
            {
              property_id: newUtilityPropertyId,
              utility_constant_id: newUtility.id,
            },
          ]);

        if (assignmentError) {
          throw assignmentError;
        }

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
        toast.success("Utility added and assigned to property successfully");
      }
    } catch (err: any) {
      console.error("Error adding utility:", err);
      setError(err.message || "Failed to add utility");
      toast.error("Failed to add utility");
    } finally {
      setSaving(false);
    }
  };

  const isRentUtility = (utilityName: string) => /\brent\b/i.test(utilityName.trim());

  const handleDraftConstantChange = (utilityId: string, value: string) => {
    setUtilityDrafts((prev) => ({
      ...prev,
      [utilityId]: {
        constant: value,
        price: prev[utilityId]?.price ?? '0',
      },
    }));
  };

  const handleDraftPriceChange = (utilityId: string, value: string) => {
    setUtilityDrafts((prev) => ({
      ...prev,
      [utilityId]: {
        constant: prev[utilityId]?.constant ?? '0',
        price: value,
      },
    }));
  };

  const handleSaveUtility = async (utility: UtilityConstant) => {
    if (isRentUtility(utility.utility_name)) {
      toast.info('Rent is derived from the assigned unit price and cannot be saved here');
      return;
    }

    const draft = utilityDrafts[utility.id];
    const parsedConstant = parseFloat(draft?.constant ?? String(utility.constant ?? 0));
    const parsedPrice = parseFloat(draft?.price ?? String(utility.price ?? 0));

    if (Number.isNaN(parsedConstant) || parsedConstant < 0) {
      toast.error('Please enter a valid multiplier');
      return;
    }

    if (!utility.is_metered && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      toast.error('Please enter a valid fixed price');
      return;
    }

    try {
      setUpdatingUtilityId(utility.id);

      const updatePayload: { constant: number; price?: number; updated_at: string } = {
        constant: parsedConstant,
        updated_at: new Date().toISOString(),
      };

      if (!utility.is_metered) {
        updatePayload.price = parsedPrice;
      }

      const { data: updatedRow, error } = await supabase
        .from('utility_constants')
        .update(updatePayload)
        .eq('id', utility.id)
        .select('id, constant, price, updated_at')
        .maybeSingle();

      if (error) throw error;
      if (!updatedRow) {
        throw new Error('No row was updated. Please check database permissions (RLS) for utility constants update.');
      }

      setUtilityConstants((prev) =>
        prev.map((item) =>
          item.id === utility.id
            ? {
                ...item,
                constant: Number(updatedRow.constant ?? item.constant),
                price: item.is_metered ? item.price : Number(updatedRow.price ?? item.price ?? 0),
                updated_at: updatedRow.updated_at || item.updated_at,
              }
            : item
        )
      );

      setUtilityDrafts((prev) => ({
        ...prev,
        [utility.id]: {
          constant: String(updatedRow.constant ?? parsedConstant),
          price: String(updatedRow.price ?? (utility.is_metered ? utility.price ?? 0 : parsedPrice)),
        },
      }));

      const { data: refreshedConstants, error: refreshError } = await supabase
        .from('utility_constants')
        .select('*')
        .order('utility_name');

      if (refreshError) throw refreshError;

      if (refreshedConstants) {
        setUtilityConstants(refreshedConstants);
      }

      toast.success('Utility settings saved successfully');
    } catch (err: any) {
      console.error('Error saving utility settings:', err);
      toast.error(`Failed to save utility settings: ${err.message}`);
    } finally {
      setUpdatingUtilityId(null);
    }
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

  const formatKES = (value: number) => `KES ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const calculateDraftTotal = (draft: InvoiceDraft) => {
    const customTotal = Object.values(draft.customUtilities || {}).reduce((sum, val) => sum + Number(val || 0), 0);
    return (
      Number(draft.rentAmount || 0) +
      Number(draft.electricityBill || 0) +
      Number(draft.waterBill || 0) +
      Number(draft.garbageFee || 0) +
      Number(draft.securityFee || 0) +
      Number(draft.serviceFee || 0) +
      Number(draft.otherCharges || 0) +
      customTotal
    );
  };

  const buildInvoiceDraft = (tenant: TenantWithReadings): InvoiceDraft | null => {
    if (!tenant.latest_reading) return null;
    const latest = tenant.latest_reading;
    return {
      tenant,
      reading: latest,
      rentAmount: Number(tenant.rent_amount || 0),
      electricityBill: Number(latest.electricity_bill || 0),
      waterBill: Number(latest.water_bill || 0),
      garbageFee: Number(latest.garbage_fee || 0),
      securityFee: Number(latest.security_fee || 0),
      serviceFee: Number(latest.service_fee || 0),
      otherCharges: Number(latest.other_charges || 0),
      customUtilities: { ...(latest.custom_utilities || {}) },
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
      notes: '',
    };
  };

  const openInvoiceEditor = (tenant: TenantWithReadings) => {
    const draft = buildInvoiceDraft(tenant);
    if (!draft) {
      toast.error('No latest reading available for this tenant');
      return;
    }
    setSelectedTenant(tenant);
    setInvoiceDraft(draft);
  };

  const handleDraftChange = (field: keyof Omit<InvoiceDraft, 'tenant' | 'reading' | 'customUtilities'>, value: string) => {
    setInvoiceDraft((prev) => {
      if (!prev) return prev;
      if (field === 'dueDate' || field === 'notes') {
        return { ...prev, [field]: value };
      }
      const parsed = parseFloat(value);
      return { ...prev, [field]: Number.isNaN(parsed) ? 0 : parsed } as InvoiceDraft;
    });
  };

  const handleDraftCustomUtilityChange = (key: string, value: string) => {
    setInvoiceDraft((prev) => {
      if (!prev) return prev;
      const parsed = parseFloat(value);
      return {
        ...prev,
        customUtilities: {
          ...prev.customUtilities,
          [key]: Number.isNaN(parsed) ? 0 : parsed,
        },
      };
    });
  };

  const handleSaveInvoiceChanges = async () => {
    if (!invoiceDraft?.reading?.id) return;
    try {
      const total = calculateDraftTotal(invoiceDraft);
      const utilityTotal = total - Number(invoiceDraft.rentAmount || 0);

      const { error: updateError } = await supabase
        .from('utility_readings')
        .update({
          electricity_bill: invoiceDraft.electricityBill,
          water_bill: invoiceDraft.waterBill,
          garbage_fee: invoiceDraft.garbageFee,
          security_fee: invoiceDraft.securityFee,
          service_fee: invoiceDraft.serviceFee,
          other_charges: invoiceDraft.otherCharges,
          custom_utilities: invoiceDraft.customUtilities,
          total_bill: utilityTotal,
        })
        .eq('id', invoiceDraft.reading.id);

      if (updateError) throw updateError;

      toast.success('Invoice changes saved successfully');
      await loadTenantReadings();
    } catch (error: any) {
      console.error('Error saving invoice changes:', error);
      toast.error(error.message || 'Failed to save invoice changes');
    }
  };

  const downloadInvoicePdf = (draft: InvoiceDraft) => {
    const total = calculateDraftTotal(draft);
    const doc = new jsPDF();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
    const issueDate = new Date().toLocaleDateString();
    const dueDate = new Date(draft.dueDate).toLocaleDateString();
    const primaryColor: [number, number, number] = [21, 66, 121];

    // Header bar
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 50, 'F');

    // Brand logo from index.html (vector rendered to PNG)
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', 12, 10, 30, 30, undefined, 'FAST');
      } catch (logoErr) {
        console.warn('Logo embed failed', logoErr);
      }
    } else {
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.8);
      doc.rect(12, 10, 30, 30);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.setFont(undefined, 'bold');
    doc.text('KENYA REALTORS', 48, 18);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Billing and Invoicing Department', 48, 25);
    doc.text('Nairobi, Kenya', 48, 31);

    doc.setFont(undefined, 'bold');
    doc.setFontSize(22);
    doc.text('INVOICE', 154, 20);
    doc.setFontSize(9.5);
    doc.setFont(undefined, 'normal');
    doc.text(`Invoice #: ${invoiceNumber}`, 144, 29);
    doc.text(`Issue Date: ${issueDate}`, 144, 34.5);
    doc.text(`Due Date: ${dueDate}`, 144, 40);

    doc.setTextColor(...primaryColor);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9.5);
    doc.text('Billed To', 16, 66);
    doc.text('Invoice Details', 112, 66);

    doc.setTextColor(51, 65, 85);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8.5);
    doc.text(draft.tenant.tenant_name, 16, 73);
    doc.text(draft.tenant.tenant_email || 'N/A', 16, 78);
    doc.text(draft.tenant.tenant_phone || 'N/A', 16, 83);
    doc.text(`Unit ${draft.tenant.unit_number} • ${draft.tenant.property_name}`, 16, 88);

    doc.text(`Status: ${draft.tenant.status.toUpperCase()}`, 112, 73);
    doc.text(`Tenant ID: ${draft.tenant.tenant_id}`, 112, 78);
    doc.text(`Property ID: ${draft.tenant.property_id || 'N/A'}`, 112, 83);
    doc.text('Currency: KES', 112, 88);

    const rows: Array<[string, string]> = [
      ['Rent (Fixed from Unit Price)', formatKES(draft.rentAmount)],
      ['Electricity', formatKES(draft.electricityBill)],
      ['Water', formatKES(draft.waterBill)],
      ['Garbage', formatKES(draft.garbageFee)],
      ['Security', formatKES(draft.securityFee)],
      ['Service', formatKES(draft.serviceFee)],
    ];

    Object.entries(draft.customUtilities || {}).forEach(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
      rows.push([label, formatKES(Number(value || 0))]);
    });

    rows.push(['Other Charges', formatKES(draft.otherCharges)]);

    autoTable(doc, {
      startY: 96,
      head: [['Description', 'Amount']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9, cellPadding: 3.6 },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 12, right: 12 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 134;
    const subtotalUtilities = total - Number(draft.rentAmount || 0);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(120, finalY + 6, 78, 22, 2, 2, 'F');

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8.5);
    doc.setFont(undefined, 'normal');
    doc.text('Utilities Subtotal:', 124, finalY + 13);
    doc.text(formatKES(subtotalUtilities), 194, finalY + 13, { align: 'right' });

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.6);
    doc.line(124, finalY + 16, 194, finalY + 16);

    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL DUE:', 124, finalY + 24);
    doc.text(formatKES(total), 194, finalY + 24, { align: 'right' });

    if (draft.notes?.trim()) {
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text('Notes:', 12, finalY + 16);
      doc.text(draft.notes, 12, finalY + 21, { maxWidth: 100 });
    }

    // Payment summary + details block
    let sectionStartY = draft.notes?.trim() ? finalY + 34 : finalY + 28;
    if (sectionStartY > 240) {
      doc.addPage();
      sectionStartY = 20;
    }

    const paymentBlockY = sectionStartY;
    doc.setFillColor(244, 247, 252);
    doc.roundedRect(12, paymentBlockY, 186, 38, 2, 2, 'F');

    doc.setTextColor(...primaryColor);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9.5);
    doc.text('PAYMENT DETAILS', 16, paymentBlockY + 9);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(8.5);
    doc.text('M-Pesa Paybill: 123456', 16, paymentBlockY + 17);
    doc.text(`Account Number: ${invoiceNumber}`, 16, paymentBlockY + 24);
    doc.text('Bank: KCB - 1234567890', 16, paymentBlockY + 31);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Include account/invoice number as payment reference', 16, paymentBlockY + 37);

    const footerY = paymentBlockY + 48 > 270 ? 282 : paymentBlockY + 48;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(12, footerY - 5, 198, footerY - 5);
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.setFont(undefined, 'bold');
    doc.text('Thank you for your business!', 105, footerY, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('support@kenyarealtors.com  •  +254 700 000 000  •  www.kenyarealtors.com', 105, footerY + 6, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, footerY + 12, { align: 'center' });

    const fileName = `Invoice_${draft.tenant.tenant_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast.success('Invoice PDF downloaded successfully');
  };

  const handleSendInvoice = async () => {
    if (!invoiceDraft) return;
    try {
      setSendingInvoice(true);
      const total = calculateDraftTotal(invoiceDraft);

      const reference = `INV-${Date.now()}`;
      const { error } = await supabase
        .from('invoices')
        .insert([
          {
            reference_number: reference,
            property_id: invoiceDraft.tenant.property_id,
            tenant_id: invoiceDraft.tenant.tenant_id,
            amount: total,
            due_date: invoiceDraft.dueDate,
            issued_date: new Date().toISOString().split('T')[0],
            status: invoiceDraft.tenant.status === 'paid' ? 'paid' : 'unpaid',
            items: {
              rent: invoiceDraft.rentAmount,
              electricity: invoiceDraft.electricityBill,
              water: invoiceDraft.waterBill,
              garbage: invoiceDraft.garbageFee,
              security: invoiceDraft.securityFee,
              service: invoiceDraft.serviceFee,
              other_charges: invoiceDraft.otherCharges,
              custom_utilities: invoiceDraft.customUtilities,
            },
            notes: invoiceDraft.notes || null,
          },
        ]);

      if (error) throw error;
      toast.success('Invoice saved and sent successfully');
      setSelectedTenant(null);
      setInvoiceDraft(null);
    } catch (err: any) {
      console.error('Error sending invoice:', err);
      toast.error(err.message || 'Failed to send invoice');
    } finally {
      setSendingInvoice(false);
    }
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
            Billing and Invoicing
        </h1>
        <p className="text-slate-600 mt-2">
            Monitor and manage all billing, charges, and tenant invoices
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
              Configure global prices/rates, then assign utilities to specific properties
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
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilityConstants.map(constant => (
                      (() => {
                        const rentUtility = isRentUtility(constant.utility_name);
                        const draft = utilityDrafts[constant.id] || {
                          constant: String(constant.constant ?? 0),
                          price: String(constant.price ?? 0),
                        };

                        return (
                      <tr key={constant.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">{constant.utility_name}</td>
                        <td className="py-3 px-4">
                          <Badge variant={rentUtility ? "secondary" : constant.is_metered ? "default" : "outline"}>
                            {rentUtility ? "Unit Rent (Auto)" : constant.is_metered ? "Metered" : "Fixed"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {rentUtility ? (
                            <span className="text-slate-400 text-xs italic">N/A (From unit rent)</span>
                          ) : (
                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              value={draft.constant}
                              onChange={e => handleDraftConstantChange(constant.id, e.target.value)}
                              disabled={updatingUtilityId === constant.id}
                              className={`w-24 px-2 py-1 border rounded text-center font-semibold transition-all ${
                                updatingUtilityId === constant.id
                                  ? 'border-blue-400 bg-blue-50 opacity-75'
                                  : 'border-slate-300 hover:border-slate-400'
                              }`}
                              title={updatingUtilityId === constant.id ? 'Saving...' : 'Edit multiplier value'}
                            />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {rentUtility ? (
                            <span className="text-slate-400 text-xs italic">N/A (From unit rent)</span>
                          ) : !constant.is_metered ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={draft.price}
                              onChange={e => handleDraftPriceChange(constant.id, e.target.value)}
                              disabled={updatingUtilityId === constant.id}
                              className={`w-28 px-2 py-1 border rounded text-center font-semibold transition-all ${
                                updatingUtilityId === constant.id
                                  ? 'border-green-400 bg-green-50 opacity-75'
                                  : 'border-slate-300 hover:border-slate-400'
                              }`}
                              title={updatingUtilityId === constant.id ? 'Saving...' : 'Edit fixed price'}
                            />
                          ) : (
                            <span className="text-slate-400 text-xs italic">N/A (Metered)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs">{constant.description}</td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveUtility(constant)}
                            disabled={updatingUtilityId === constant.id || rentUtility}
                            className="h-8"
                          >
                            {updatingUtilityId === constant.id ? 'Saving...' : 'Save'}
                          </Button>
                        </td>
                      </tr>
                        );
                      })()
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
                    <Label htmlFor="utility_property">Property</Label>
                    <select
                      id="utility_property"
                      value={newUtilityPropertyId}
                      onChange={(e) => setNewUtilityPropertyId(e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">Select property</option>
                      {propertyOptions.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>

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
                        Rent
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Utilities
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Invoice Total
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
                          KES {tenant.rent_amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800">
                          KES {tenant.utility_total.toFixed(2)}
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
                              onClick={() => openInvoiceEditor(tenant)}
                              className="p-2 hover:bg-blue-50 rounded text-blue-600 transition"
                              title="Edit Invoice"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                const draft = buildInvoiceDraft(tenant);
                                if (!draft) return;
                                downloadInvoicePdf(draft);
                              }}
                              className="p-2 hover:bg-green-50 rounded text-green-600 transition"
                              title="Download Invoice PDF"
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

      {/* Invoice Editor Modal */}
      {selectedTenant && invoiceDraft && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle>Edit Invoice - {selectedTenant.tenant_name}</CardTitle>
                <CardDescription>
                  {selectedTenant.unit_number} - {selectedTenant.property_name}
                </CardDescription>
              </div>
              <button
                onClick={() => {
                  setSelectedTenant(null);
                  setInvoiceDraft(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="font-semibold text-slate-900">{selectedTenant.tenant_email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Phone</p>
                  <p className="font-semibold text-slate-900">{selectedTenant.tenant_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Invoice Due Date</p>
                  <Input
                    type="date"
                    value={invoiceDraft.dueDate}
                    onChange={(e) => handleDraftChange('dueDate', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Invoice Line Items (Editable)</h3>
                  <Badge variant="outline">{new Date(invoiceDraft.reading.reading_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Monthly Rent (Auto from Tenant Unit)</Label>
                    <Input type="number" value={invoiceDraft.rentAmount} disabled className="mt-1 bg-slate-100" />
                    <p className="text-[11px] text-slate-500 mt-1">This value is fetched dynamically from the tenant's assigned unit rent.</p>
                  </div>
                  <div>
                    <Label>Electricity Bill</Label>
                    <Input type="number" value={invoiceDraft.electricityBill} onChange={(e) => handleDraftChange('electricityBill', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Water Bill</Label>
                    <Input type="number" value={invoiceDraft.waterBill} onChange={(e) => handleDraftChange('waterBill', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Garbage Fee</Label>
                    <Input type="number" value={invoiceDraft.garbageFee} onChange={(e) => handleDraftChange('garbageFee', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Security Fee</Label>
                    <Input type="number" value={invoiceDraft.securityFee} onChange={(e) => handleDraftChange('securityFee', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Service Fee</Label>
                    <Input type="number" value={invoiceDraft.serviceFee} onChange={(e) => handleDraftChange('serviceFee', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Other Charges</Label>
                    <Input type="number" value={invoiceDraft.otherCharges} onChange={(e) => handleDraftChange('otherCharges', e.target.value)} className="mt-1" />
                  </div>
                </div>

                {Object.keys(invoiceDraft.customUtilities || {}).length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <p className="text-sm font-semibold text-slate-700">Custom Utilities</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(invoiceDraft.customUtilities).map(([key, value]) => (
                        <div key={key}>
                          <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                          <Input
                            type="number"
                            value={Number(value || 0)}
                            onChange={(e) => handleDraftCustomUtilityChange(key, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Notes</Label>
                  <textarea
                    value={invoiceDraft.notes}
                    onChange={(e) => handleDraftChange('notes', e.target.value)}
                    className="w-full mt-1 min-h-[80px] px-3 py-2 border border-slate-300 rounded-md"
                    placeholder="Optional internal or invoice notes"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600">Total Amount Due</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatKES(calculateDraftTotal(invoiceDraft))}
                    </p>
                  </div>
                  <DollarSign size={48} className="text-blue-300" />
                </div>
              </div>
            </CardContent>

            <CardFooter className="gap-3 border-t flex-wrap justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTenant(null);
                  setInvoiceDraft(null);
                }}
              >
                Close
              </Button>
              <Button
                onClick={handleSaveInvoiceChanges}
                className="gap-2 bg-[#154279] hover:bg-[#0f325e]"
              >
                <Edit3 size={18} />
                Save Changes
              </Button>
              <Button
                onClick={() => downloadInvoicePdf(invoiceDraft)}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <FileDown size={18} />
                Download PDF
              </Button>
              <Button
                onClick={handleSendInvoice}
                disabled={sendingInvoice}
                className="gap-2 bg-amber-600 hover:bg-amber-700"
              >
                {sendingInvoice ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {sendingInvoice ? 'Sending...' : 'Save & Send'}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SuperAdminUtilitiesManager;
