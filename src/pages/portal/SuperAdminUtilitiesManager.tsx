import { saveAs } from "file-saver";
import React, { useState, useEffect, useMemo } from "react";
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
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadReceiptPDF, formatReceiptData } from "@/utils/receiptGenerator";

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
import DepositRefundSheet, { DepositRefundCase } from "@/components/portal/shared/DepositRefundSheet";

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
  latest_receipt?: any;
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

type BillingEventType = 'first_payment' | 'vacating_switching';

interface FirstPaymentCandidate {
  lease_id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  property_id: string;
  property_name: string;
  unit_id: string;
  unit_number: string;
  rent_amount: number;
  lease_start_date?: string;
  assigned_at?: string;
}

interface InitialChargeLineItem {
  id: string;
  name: string;
  charge_type: 'deposit' | 'fee';
  amount: number;
}

interface TransitionBillingCandidate {
  vacancy_notice_id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  property_id: string;
  property_name: string;
  unit_id: string;
  unit_number: string;
  move_out_date?: string;
  status: string;
  reason?: string;
}

interface SpecialInvoiceDraft {
  eventType: BillingEventType;
  sourceId: string;
  tenant_id: string;
  tenant_name: string;
  property_id: string;
  property_name: string;
  unit_id: string;
  unit_number: string;
  baseRent: number;
  securityDeposit: number;
  initialCharges: InitialChargeLineItem[];
  cleaningFee: number;
  damageCharges: number;
  utilityClearance: number;
  switchingFee: number;
  refundCredit: number;
  customCharges: Record<string, number>;
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
  const [deletingUtilityId, setDeletingUtilityId] = useState<string | null>(null);
  const [utilityDrafts, setUtilityDrafts] = useState<Record<string, { constant: string; price: string }>>({});
  const [invoiceDraft, setInvoiceDraft] = useState<InvoiceDraft | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [firstPaymentCandidates, setFirstPaymentCandidates] = useState<FirstPaymentCandidate[]>([]);
  const [transitionCandidates, setTransitionCandidates] = useState<TransitionBillingCandidate[]>([]);
  const [specialInvoiceDraft, setSpecialInvoiceDraft] = useState<SpecialInvoiceDraft | null>(null);
  const [savingSpecialInvoice, setSavingSpecialInvoice] = useState(false);
  const [propertyInitialChargesMap, setPropertyInitialChargesMap] = useState<Record<string, InitialChargeLineItem[]>>({});
  const [newInitialChargeName, setNewInitialChargeName] = useState('');
  const [newInitialChargeAmount, setNewInitialChargeAmount] = useState('');
  const [newInitialChargeType, setNewInitialChargeType] = useState<'deposit' | 'fee'>('deposit');
  const [newSpecialChargeName, setNewSpecialChargeName] = useState('');
  const [newSpecialChargeAmount, setNewSpecialChargeAmount] = useState('');
  const [autoChecklistDamageByUnit, setAutoChecklistDamageByUnit] = useState<Record<string, number>>({});

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

        const { data: propertyTemplatesData, error: propertyTemplatesError } = await supabase
          .from('properties')
          .select('id, initial_charge_templates');

        if (propertyTemplatesError) {
          const missingColumn = String(propertyTemplatesError.message || '').toLowerCase().includes('initial_charge_templates');
          if (!missingColumn) throw propertyTemplatesError;
          setPropertyInitialChargesMap({});
        } else {
          const templateMap: Record<string, InitialChargeLineItem[]> = {};
          (propertyTemplatesData || []).forEach((row: any) => {
            const templates = Array.isArray(row?.initial_charge_templates) ? row.initial_charge_templates : [];
            templateMap[row.id] = templates
              .map((item: any, index: number) => ({
                id: String(item?.id || `tpl-${row.id}-${index}`),
                name: String(item?.name || '').trim(),
                charge_type: item?.charge_type === 'fee' ? 'fee' : 'deposit',
                amount: Number(item?.amount || 0),
              }))
              .filter((item: InitialChargeLineItem) => item.name && item.amount >= 0);
          });
          setPropertyInitialChargesMap(templateMap);
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

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('tenant_id, status, issued_date, created_at')
        .order('issued_date', { ascending: false })
        .order('created_at', { ascending: false });

      const latestInvoiceStatusByTenant = new Map<string, 'pending' | 'paid'>();
      (invoicesData || []).forEach((invoice: any) => {
        if (!invoice?.tenant_id || latestInvoiceStatusByTenant.has(invoice.tenant_id)) return;
        latestInvoiceStatusByTenant.set(
          invoice.tenant_id,
          String(invoice.status || '').toLowerCase() === 'paid' ? 'paid' : 'pending'
        );
      });

      const { data: billsData } = await supabase
        .from('bills_and_utilities')
        .select('id, unit_id, amount, paid_amount, status, bill_type, created_at')
        .order('created_at', { ascending: false });

      const latestBillStatusByUnit = new Map<string, 'pending' | 'paid'>();
      (billsData || []).forEach((bill: any) => {
        if (!bill?.unit_id || latestBillStatusByUnit.has(bill.unit_id)) return;
        latestBillStatusByUnit.set(
          bill.unit_id,
          String(bill.status || '').toLowerCase() === 'paid' ? 'paid' : 'pending'
        );
      });

      const { data: rentPaymentsData } = await supabase
        .from('rent_payments')
        .select('id, unit_id, amount, amount_paid, status, created_at')
        .order('created_at', { ascending: false });

      const rentDueByUnit = new Map<string, number>();
      (rentPaymentsData || []).forEach((payment: any) => {
        if (!payment?.unit_id) return;
        const previous = rentDueByUnit.get(payment.unit_id) || 0;
        const amount = Number(payment.amount) || 0;
        const amountPaid = Number(payment.amount_paid) || 0;
        rentDueByUnit.set(payment.unit_id, previous + Math.max(0, amount - amountPaid));
      });

      const utilityDueByUnit = new Map<string, number>();
      (billsData || []).forEach((bill: any) => {
        if (!bill?.unit_id) return;
        if (String(bill.bill_type || '').toLowerCase() === 'all') return;
        const previous = utilityDueByUnit.get(bill.unit_id) || 0;
        const amount = Number(bill.amount) || 0;
        const paidAmount = Number(bill.paid_amount) || 0;
        utilityDueByUnit.set(bill.unit_id, previous + Math.max(0, amount - paidAmount));
      });

      const { data: receiptsData } = await supabase
        .from('receipts')
        .select('id, tenant_id, unit_id, amount_paid, payment_method, payment_date, transaction_reference, status, metadata, created_at, receipt_number')
        .order('payment_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      const latestReceiptByUnit = new Map<string, any>();
      (receiptsData || []).forEach((receipt: any) => {
        if (!receipt?.unit_id || latestReceiptByUnit.has(receipt.unit_id)) return;
        latestReceiptByUnit.set(receipt.unit_id, receipt);
      });

            // 1. Fetch all tenants with their units
      const { data: allTenants, error: tenantsError } = await supabase
        .from('tenant_leases')
        .select(`
          id,
          user_id:tenant_id,
          unit_id,
          status,
          units:unit_id(unit_number, price, property_id, properties:property_id(name))
        `)
        .eq('status', 'active');
        
      // Also fetch profiles manually since foreign key from tenants to profiles might not exist directly
      let profilesMap = new Map();
      if (allTenants && allTenants.length > 0) {
        const userIds = [...new Set(allTenants.map(t => t.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone')
            .in('id', userIds);
          (profiles || []).forEach(p => profilesMap.set(p.id, p));
        }
      }

      // 2. Fetch all properties for the filter list
      const { data: allProperties } = await supabase.from('properties').select('name').order('name');
      const propertyNamesList = allProperties ? allProperties.map(p => p.name) : [];
      setProperties(propertyNamesList);

      const { data: readings, error: readingsError } = await supabase
        .from('utility_readings')
        .select('*')
        .order('reading_month', { ascending: false });

      if (readingsError && readingsError.code !== 'PGRST116') {
        throw readingsError;
      }

      const tenantMap = new Map<string, TenantWithReadings>();

      // Initialize all active tenants in the map first
      if (allTenants) {
        for (const tenant of allTenants) {
          if (!tenant.units) continue;
          
          const profile = profilesMap.get(tenant.user_id) || {};
          const unit = Array.isArray(tenant.units) ? tenant.units[0] : tenant.units;
          const propertyName = unit.properties ? (Array.isArray(unit.properties) ? unit.properties[0].name : unit.properties.name) : 'Unknown Property';
          if (propertyName === 'Unknown Property') continue;

          const key = `${tenant.user_id}-${tenant.unit_id}`;
          const rentAmount = Number(unit.price || 0);

          const calculatedRentDue = rentDueByUnit.get(tenant.unit_id) ?? 0;
          const calculatedUtilityDue = utilityDueByUnit.get(tenant.unit_id) ?? 0;
          const hasRentLedger = rentDueByUnit.has(tenant.unit_id);
          const outstandingRentDue = hasRentLedger ? calculatedRentDue : rentAmount;
          
          tenantMap.set(key, {
            tenant_id: tenant.user_id,
            tenant_name: profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : 'Unknown Tenant',
            tenant_email: profile.email || '',
            tenant_phone: profile.phone || '',
            unit_number: unit.unit_number,
            property_name: propertyName,
            property_id: unit.property_id,
            unit_id: tenant.unit_id,
            rent_amount: rentAmount,
            utility_total: 0,
            total_due: rentAmount,
            status: calculatedRentDue <= 0 && calculatedUtilityDue <= 0 ? 'paid' : 'pending',
            readings: [],
            latest_reading: undefined,
            latest_receipt: latestReceiptByUnit.get(tenant.unit_id),
          });
        }
      }

      if (readings) {
        for (const reading of readings) {
          try {
            const key = `${reading.tenant_id}-${reading.unit_id}`;
            
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

            const invoiceStatus = reading.tenant_id
              ? latestInvoiceStatusByTenant.get(reading.tenant_id)
              : undefined;
            const billStatus = reading.unit_id
              ? latestBillStatusByUnit.get(reading.unit_id)
              : undefined;
            const readingStatus = String(reading.status || '').toLowerCase() === 'paid' ? 'paid' : 'pending';
            const resolvedStatus =
              invoiceStatus === 'paid' || billStatus === 'paid' || readingStatus === 'paid'
                ? 'paid'
                : 'pending';

            const enrichedReading: UtilityReading = {
              ...reading,
              electricity_usage: electricityUsage,
              electricity_bill: electricityBill,
              water_bill: waterBill,
              total_bill: utilityTotal,
            };

            const existing = tenantMap.get(key);
            if (existing) {
              existing.readings.push(enrichedReading);
              if (!existing.latest_reading || new Date(enrichedReading.reading_month) > new Date(existing.latest_reading.reading_month)) {
                existing.latest_reading = enrichedReading;
                existing.utility_total = utilityTotal;
                existing.total_due = existing.rent_amount + utilityTotal;
                // Calculate outstanding if applicable
                const calculatedRentDue = rentDueByUnit.get(reading.unit_id) ?? 0;
                const calculatedUtilityDue = utilityDueByUnit.get(reading.unit_id) ?? 0;
                const outstandingTotalDue = Math.max(0, calculatedRentDue + calculatedUtilityDue);
                existing.status = outstandingTotalDue <= 0 ? 'paid' : resolvedStatus;
              }
            } else {
              // Ignore old readings without active tenants
            }
          } catch (itemError) {
            console.error('Error processing reading item:', itemError);
            continue;
          }
        }
      }

      const tenantList = Array.from(tenantMap.values());
      const propertyNames = propertyNamesList;
      setTenantsWithReadings(tenantList);
      // setProperties is already called;
    } catch (err: any) {
      console.error("Error fetching readings:", err);
      setError(err.message || "Failed to load utility readings. Please check your database setup.");
      toast.error(err.message || "Failed to load utility readings");
    } finally {
      setLoading(false);
    }
  };

  const loadSpecialBillingCandidates = async () => {
    try {
      const { data: leaseRows, error: leaseError } = await supabase
        .from('tenant_leases')
        .select(`
          id,
          tenant_id,
          unit_id,
          rent_amount,
          start_date,
          created_at,
          status,
          units:unit_id(
            id,
            unit_number,
            property_id,
            properties:property_id(name)
          )
        `)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false });

      if (leaseError) throw leaseError;

      const { data: vacancyRows, error: vacancyError } = await supabase
        .from('vacancy_notices')
        .select('id, tenant_id, property_id, unit_id, move_out_date, status, reason, created_at')
        .in('status', ['pending', 'inspection_scheduled', 'approved'])
        .order('created_at', { ascending: false });

      if (vacancyError && vacancyError.code !== 'PGRST116') throw vacancyError;

      const tenantIds = new Set<string>();
      (leaseRows || []).forEach((row: any) => row?.tenant_id && tenantIds.add(row.tenant_id));
      (vacancyRows || []).forEach((row: any) => row?.tenant_id && tenantIds.add(row.tenant_id));

      let profilesMap = new Map<string, any>();
      if (tenantIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone')
          .in('id', Array.from(tenantIds));
        profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      }

      const { data: existingInvoices } = await supabase
        .from('invoices')
        .select('id, notes')
        .order('created_at', { ascending: false })
        .limit(1000);

      const firstPaymentMarkers = new Set<string>();
      const transitionMarkers = new Set<string>();

      (existingInvoices || []).forEach((inv: any) => {
        const notes = String(inv?.notes || '');
        const firstMatch = notes.match(/LEASE_ID:([a-f0-9-]+)/i);
        if (firstMatch?.[1]) firstPaymentMarkers.add(firstMatch[1]);
        const transitionMatch = notes.match(/VACANCY_NOTICE_ID:([a-f0-9-]+)/i);
        if (transitionMatch?.[1]) transitionMarkers.add(transitionMatch[1]);
      });

      const now = Date.now();
      const recentWindowMs = 45 * 24 * 60 * 60 * 1000;

      const firstCandidates: FirstPaymentCandidate[] = (leaseRows || [])
        .filter((lease: any) => {
          if (!lease?.id || firstPaymentMarkers.has(lease.id)) return false;
          const leaseCreatedAt = lease?.created_at ? new Date(lease.created_at).getTime() : 0;
          const leaseStart = lease?.start_date ? new Date(lease.start_date).getTime() : 0;
          const leaseRecency = Math.max(leaseCreatedAt, leaseStart);
          return leaseRecency > 0 && now - leaseRecency <= recentWindowMs;
        })
        .map((lease: any) => {
          const profile = profilesMap.get(lease.tenant_id) || {};
          const unit = Array.isArray(lease.units) ? lease.units[0] : lease.units;
          const propertyName = unit?.properties
            ? (Array.isArray(unit.properties) ? unit.properties[0]?.name : unit.properties?.name)
            : 'Unknown Property';

          return {
            lease_id: lease.id,
            tenant_id: lease.tenant_id,
            tenant_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown Tenant',
            tenant_email: profile.email || '',
            tenant_phone: profile.phone || '',
            property_id: unit?.property_id || '',
            property_name: propertyName || 'Unknown Property',
            unit_id: lease.unit_id,
            unit_number: unit?.unit_number || 'N/A',
            rent_amount: Number(lease.rent_amount || 0),
            lease_start_date: lease.start_date,
            assigned_at: lease.created_at,
          };
        })
        .filter((c) => c.tenant_id && c.property_id && c.unit_id);

      const transitionList: TransitionBillingCandidate[] = (vacancyRows || [])
        .filter((notice: any) => notice?.id && !transitionMarkers.has(notice.id))
        .map((notice: any) => {
          const profile = profilesMap.get(notice.tenant_id) || {};
          const firstLeaseForUnit = (leaseRows || []).find((lease: any) => lease.unit_id === notice.unit_id);
          const unit = Array.isArray(firstLeaseForUnit?.units) ? firstLeaseForUnit?.units?.[0] : firstLeaseForUnit?.units;
          const propertyName = unit?.properties
            ? (Array.isArray(unit.properties) ? unit.properties[0]?.name : unit.properties?.name)
            : 'Unknown Property';

          return {
            vacancy_notice_id: notice.id,
            tenant_id: notice.tenant_id,
            tenant_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown Tenant',
            tenant_email: profile.email || '',
            tenant_phone: profile.phone || '',
            property_id: notice.property_id || unit?.property_id || '',
            property_name: propertyName || 'Unknown Property',
            unit_id: notice.unit_id,
            unit_number: unit?.unit_number || 'N/A',
            move_out_date: notice.move_out_date,
            status: notice.status || 'pending',
            reason: notice.reason || '',
          };
        })
        .filter((c) => c.tenant_id && c.property_id && c.unit_id);

      const transitionUnitIds = transitionList.map((entry) => entry.unit_id).filter(Boolean);
      let checklistDamageByUnit: Record<string, number> = {};
      if (transitionUnitIds.length > 0) {
        const { data: completionReports } = await supabase
          .from('maintenance_completion_reports')
          .select('maintenance_request_id, cost_estimate, actual_cost, status')
          .in('property_id', transitionList.map((entry) => entry.property_id).filter(Boolean));

        const requestIds = (completionReports || [])
          .map((row: any) => row?.maintenance_request_id)
          .filter(Boolean);

        const { data: maintenanceRows } = requestIds.length > 0
          ? await supabase
              .from('maintenance_requests')
              .select('id, unit_id')
              .in('id', requestIds)
          : { data: [] as any[] };

        const requestUnitById = new Map<string, string>(
          (maintenanceRows || [])
            .filter((row: any) => row?.id && row?.unit_id)
            .map((row: any) => [row.id, row.unit_id])
        );

        checklistDamageByUnit = (completionReports || []).reduce((acc: Record<string, number>, row: any) => {
          const requestId = row?.maintenance_request_id;
          const unitId = requestId ? requestUnitById.get(requestId) : undefined;
          if (!unitId || !transitionUnitIds.includes(unitId)) return acc;
          const status = String(row?.status || '').toLowerCase();
          if (['rejected', 'cancelled', 'void'].includes(status)) return acc;
          const amount = Number(row?.actual_cost ?? row?.cost_estimate ?? 0) || 0;
          acc[unitId] = (acc[unitId] || 0) + amount;
          return acc;
        }, {});
      }

      setFirstPaymentCandidates(firstCandidates);
      setTransitionCandidates(transitionList);
      setAutoChecklistDamageByUnit(checklistDamageByUnit);
    } catch (err: any) {
      console.error('Error loading special billing candidates:', err);
      toast.error(err.message || 'Failed to load first payment and transition billing candidates');
    }
  };

  useEffect(() => {
    loadTenantReadings();
    loadSpecialBillingCandidates();

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
          await loadSpecialBillingCandidates();
        }
      )
      .subscribe();

    // Cleanup: unsubscribe on unmount
    return () => {
      readingsChannel.unsubscribe();
    };
  }, []);

  const depositRefundCases: DepositRefundCase[] = useMemo(() => {
    return transitionCandidates.map((candidate) => {
      const matchingTenant = tenantsWithReadings.find((tenant) => {
        const sameUnit = tenant.unit_id && candidate.unit_id && tenant.unit_id === candidate.unit_id;
        const sameTenantAndUnit = tenant.tenant_id === candidate.tenant_id && tenant.unit_number === candidate.unit_number;
        return sameUnit || sameTenantAndUnit;
      });

      return {
        id: candidate.vacancy_notice_id,
        unitNumber: candidate.unit_number,
        tenantName: candidate.tenant_name,
        propertyName: candidate.property_name,
        noticeDate: candidate.move_out_date,
        moveOutDate: candidate.move_out_date,
        status: candidate.status,
        securityDeposit: Number(matchingTenant?.rent_amount || 0),
        rentArrears: Math.max(0, Number(matchingTenant?.total_due || 0) - Number(matchingTenant?.utility_total || 0)),
        billNameArrears: Math.max(0, Number(matchingTenant?.utility_total || 0)),
        autoChecklistDamages: Number(autoChecklistDamageByUnit[candidate.unit_id] || 0),
      };
    });
  }, [transitionCandidates, tenantsWithReadings, autoChecklistDamageByUnit]);

  const openFirstPaymentInvoice = (candidate: FirstPaymentCandidate) => {
    const propertyTemplates = (propertyInitialChargesMap[candidate.property_id] || []).map((item, index) => ({
      id: item.id || `tpl-${candidate.property_id}-${index}`,
      name: item.name,
      charge_type: item.charge_type,
      amount: Number(item.amount || 0),
    }));

    setNewInitialChargeName('');
    setNewInitialChargeAmount('');
    setNewInitialChargeType('deposit');
    setNewSpecialChargeName('');
    setNewSpecialChargeAmount('');
    setSpecialInvoiceDraft({
      eventType: 'first_payment',
      sourceId: candidate.lease_id,
      tenant_id: candidate.tenant_id,
      tenant_name: candidate.tenant_name,
      property_id: candidate.property_id,
      property_name: candidate.property_name,
      unit_id: candidate.unit_id,
      unit_number: candidate.unit_number,
      baseRent: Number(candidate.rent_amount || 0),
      securityDeposit: Number(candidate.rent_amount || 0),
      initialCharges: propertyTemplates,
      cleaningFee: 0,
      damageCharges: 0,
      utilityClearance: 0,
      switchingFee: 0,
      refundCredit: 0,
      customCharges: {},
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
      notes: '',
    });
  };

  const openTransitionInvoice = (candidate: TransitionBillingCandidate) => {
    setNewSpecialChargeName('');
    setNewSpecialChargeAmount('');
    setSpecialInvoiceDraft({
      eventType: 'vacating_switching',
      sourceId: candidate.vacancy_notice_id,
      tenant_id: candidate.tenant_id,
      tenant_name: candidate.tenant_name,
      property_id: candidate.property_id,
      property_name: candidate.property_name,
      unit_id: candidate.unit_id,
      unit_number: candidate.unit_number,
      baseRent: 0,
      securityDeposit: 0,
      initialCharges: [],
      cleaningFee: 0,
      damageCharges: 0,
      utilityClearance: 0,
      switchingFee: 0,
      refundCredit: 0,
      customCharges: {},
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
      notes: `Transition notice: ${candidate.status}${candidate.reason ? ` | ${candidate.reason}` : ''}`,
    });
  };

  const handleSpecialInvoiceDraftChange = (field: keyof SpecialInvoiceDraft, value: string) => {
    setSpecialInvoiceDraft((prev) => {
      if (!prev) return prev;
      if (field === 'dueDate' || field === 'notes') {
        return { ...prev, [field]: value };
      }
      if (field === 'initialCharges') {
        return prev;
      }
      const parsed = Number(value);
      return { ...prev, [field]: Number.isNaN(parsed) ? 0 : parsed } as SpecialInvoiceDraft;
    });
  };

  const calculateSpecialInvoiceTotal = (draft: SpecialInvoiceDraft) => {
    const initialChargesTotal = (draft.initialCharges || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const extraCharges = Object.values(draft.customCharges || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    if (draft.eventType === 'first_payment') {
      return (
        Number(draft.baseRent || 0) +
        Number(draft.securityDeposit || 0) +
        initialChargesTotal
      );
    }

    return (
      Number(draft.cleaningFee || 0) +
      Number(draft.damageCharges || 0) +
      Number(draft.utilityClearance || 0) +
      Number(draft.switchingFee || 0) -
      Number(draft.refundCredit || 0) +
      extraCharges
    );
  };

  const handleAddInitialCharge = () => {
    const name = newInitialChargeName.trim();
    const amount = Number(newInitialChargeAmount || 0);

    if (!specialInvoiceDraft || specialInvoiceDraft.eventType !== 'first_payment') return;
    if (!name) {
      toast.error('Enter a charge name');
      return;
    }
    if (Number.isNaN(amount) || amount < 0) {
      toast.error('Enter a valid charge amount');
      return;
    }

    setSpecialInvoiceDraft((prev) => {
      if (!prev || prev.eventType !== 'first_payment') return prev;
      return {
        ...prev,
        initialCharges: [
          ...(prev.initialCharges || []),
          {
            id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name,
            charge_type: newInitialChargeType,
            amount,
          },
        ],
      };
    });

    setNewInitialChargeName('');
    setNewInitialChargeAmount('');
    setNewInitialChargeType('deposit');
  };

  const handleInitialChargeChange = (
    id: string,
    field: 'name' | 'charge_type' | 'amount',
    value: string
  ) => {
    setSpecialInvoiceDraft((prev) => {
      if (!prev || prev.eventType !== 'first_payment') return prev;
      return {
        ...prev,
        initialCharges: (prev.initialCharges || []).map((item) => {
          if (item.id !== id) return item;
          if (field === 'name') return { ...item, name: value };
          if (field === 'charge_type') return { ...item, charge_type: value === 'fee' ? 'fee' : 'deposit' };
          const parsed = Number(value);
          return { ...item, amount: Number.isNaN(parsed) ? 0 : parsed };
        }),
      };
    });
  };

  const handleRemoveInitialCharge = (id: string) => {
    setSpecialInvoiceDraft((prev) => {
      if (!prev || prev.eventType !== 'first_payment') return prev;
      return {
        ...prev,
        initialCharges: (prev.initialCharges || []).filter((item) => item.id !== id),
      };
    });
  };

  const handleAddSpecialCharge = () => {
    const name = newSpecialChargeName.trim();
    const amount = Number(newSpecialChargeAmount || 0);

    if (!specialInvoiceDraft) return;
    if (!name) {
      toast.error('Enter a charge name');
      return;
    }
    if (Number.isNaN(amount)) {
      toast.error('Enter a valid charge amount');
      return;
    }

    setSpecialInvoiceDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customCharges: {
          ...prev.customCharges,
          [name]: amount,
        },
      };
    });

    setNewSpecialChargeName('');
    setNewSpecialChargeAmount('');
  };

  const handleSpecialChargeAmountChange = (key: string, value: string) => {
    setSpecialInvoiceDraft((prev) => {
      if (!prev) return prev;
      const parsed = Number(value);
      return {
        ...prev,
        customCharges: {
          ...prev.customCharges,
          [key]: Number.isNaN(parsed) ? 0 : parsed,
        },
      };
    });
  };

  const handleRemoveSpecialCharge = (key: string) => {
    setSpecialInvoiceDraft((prev) => {
      if (!prev) return prev;
      const nextCharges = { ...prev.customCharges };
      delete nextCharges[key];
      return {
        ...prev,
        customCharges: nextCharges,
      };
    });
  };

  const handleGenerateSpecialInvoice = async () => {
    if (!specialInvoiceDraft) return;
    try {
      setSavingSpecialInvoice(true);

      const totalAmount = calculateSpecialInvoiceTotal(specialInvoiceDraft);
      if (totalAmount < 0) {
        toast.error('Total invoice amount cannot be negative');
        return;
      }

      const reference = `INV-${Date.now()}`;
      const marker = specialInvoiceDraft.eventType === 'first_payment'
        ? `BILLING_EVENT:first_payment;LEASE_ID:${specialInvoiceDraft.sourceId}`
        : `BILLING_EVENT:vacating_switching;VACANCY_NOTICE_ID:${specialInvoiceDraft.sourceId}`;

      const initialCharges = (specialInvoiceDraft.initialCharges || [])
        .map((item) => ({
          id: item.id,
          name: String(item.name || '').trim(),
          charge_type: item.charge_type === 'fee' ? 'fee' : 'deposit',
          amount: Number(item.amount || 0),
        }))
        .filter((item) => item.name && item.amount >= 0);

      const additionalChargesMapFromInitial = initialCharges.reduce((acc: Record<string, number>, item) => {
        acc[item.name] = Number(item.amount || 0);
        return acc;
      }, {});

      const firstPaymentItems = {
        monthly_rent: Number(specialInvoiceDraft.baseRent || 0),
        security_deposit: Number(specialInvoiceDraft.securityDeposit || 0),
        initial_charges: initialCharges,
        additional_charges: additionalChargesMapFromInitial,
      };

      const transitionItems = {
        cleaning_fee: Number(specialInvoiceDraft.cleaningFee || 0),
        damage_charges: Number(specialInvoiceDraft.damageCharges || 0),
        utility_clearance: Number(specialInvoiceDraft.utilityClearance || 0),
        switching_fee: Number(specialInvoiceDraft.switchingFee || 0),
        refund_credit: Number(specialInvoiceDraft.refundCredit || 0),
        additional_charges: specialInvoiceDraft.customCharges || {},
      };

      const { error } = await supabase
        .from('invoices')
        .insert([
          {
            reference_number: reference,
            property_id: specialInvoiceDraft.property_id,
            tenant_id: specialInvoiceDraft.tenant_id,
            amount: totalAmount,
            due_date: specialInvoiceDraft.dueDate,
            issued_date: new Date().toISOString().split('T')[0],
            status: 'unpaid',
            items: specialInvoiceDraft.eventType === 'first_payment' ? firstPaymentItems : transitionItems,
            notes: `${marker}\n${specialInvoiceDraft.notes || ''}`.trim(),
          },
        ]);

      if (error) throw error;

      toast.success('Invoice generated successfully');
      setSpecialInvoiceDraft(null);
      await loadSpecialBillingCandidates();
    } catch (err: any) {
      console.error('Error generating special invoice:', err);
      toast.error(err.message || 'Failed to generate invoice');
    } finally {
      setSavingSpecialInvoice(false);
    }
  };

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

  const handleDeleteUtility = async (utility: UtilityConstant) => {
    if (isRentUtility(utility.utility_name)) {
      toast.info('Rent is derived from the assigned unit price and cannot be deleted here');
      return;
    }

    const confirmed = window.confirm(
      `Delete "${utility.utility_name}" from billing constants? This removes it from property assignments.`
    );

    if (!confirmed) return;

    try {
      setDeletingUtilityId(utility.id);

      const { error: assignmentError } = await supabase
        .from('property_utilities')
        .delete()
        .eq('utility_constant_id', utility.id);

      if (assignmentError) throw assignmentError;

      const { error: utilityError } = await supabase
        .from('utility_constants')
        .delete()
        .eq('id', utility.id);

      if (utilityError) throw utilityError;

      setUtilityConstants((prev) => prev.filter((item) => item.id !== utility.id));
      setUtilityDrafts((prev) => {
        const next = { ...prev };
        delete next[utility.id];
        return next;
      });

      toast.success('Billing utility deleted successfully');
    } catch (err: any) {
      console.error('Error deleting utility:', err);
      toast.error(err.message || 'Failed to delete utility');
    } finally {
      setDeletingUtilityId(null);
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
    doc.text('support@kenyarealtors.com  •  0711493222  •  www.kenyarealtors.com', 105, footerY + 6, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, footerY + 12, { align: 'center' });

    const fileName = `Invoice_${draft.tenant.tenant_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast.success('Invoice PDF downloaded successfully');
  };

  const downloadReceiptPdf = (tenant: TenantWithReadings) => {
    if (!tenant.latest_receipt) {
      toast.error("No receipt found yet for this tenant");
      return;
    }

    // Attempt to pull exact breakdown from latest reading
    const items = [];
    if (tenant.rent_amount > 0) {
      items.push({ description: "Rent (Fixed from Unit Price)", amount: tenant.rent_amount, type: "rent" });
    }
    if (tenant.latest_reading?.electricity_bill !== undefined) {
      items.push({ description: "Electricity", amount: tenant.latest_reading.electricity_bill, type: "electricity" });
    }
    if (tenant.latest_reading?.water_bill !== undefined) {
      items.push({ description: "Water", amount: tenant.latest_reading.water_bill, type: "water" });
    }
    if (tenant.latest_reading?.garbage_fee !== undefined) {
      items.push({ description: "Garbage", amount: tenant.latest_reading.garbage_fee, type: "garbage" });
    }
    if (tenant.latest_reading?.security_fee !== undefined) {
      items.push({ description: "Security", amount: tenant.latest_reading.security_fee, type: "security" });
    }
    if (tenant.latest_reading?.service_fee !== undefined) {
      items.push({ description: "Service", amount: tenant.latest_reading.service_fee, type: "service" });
    }
    if (tenant.latest_reading?.other_charges !== undefined) {
      items.push({ description: "Other Charges", amount: tenant.latest_reading.other_charges, type: "other" });
    }

    // Embed missing metadata directly from the tenant object
    const enrichedReceipt = {
      ...tenant.latest_receipt,
      metadata: {
        ...(tenant.latest_receipt.metadata || {}),
        items: items, // <--- Injection of items
        tenant_name: tenant.tenant_name,
        property_name: tenant.property_name,
        unit_number: tenant.unit_number || "N/A"
      }
    };

    const receiptData = formatReceiptData(enrichedReceipt, {
      name: "KENYA REALTORS",
      address: "Nairobi, Kenya",
      phone: "0711493222",
    });

    try {
        const pBlob = generateReceiptPDF(receiptData);
        const name = tenant.tenant_name ? tenant.tenant_name.replace(/\s+/g, "_") : "N_A";
        saveAs(pBlob, "Receipt_" + name + "_" + new Date().toISOString().split("T")[0] + ".pdf");
        toast.success("Receipt downloaded successfully");
    } catch(err) {
        console.error("Using fallback download Receipt PDF");
        downloadReceiptPDF(receiptData);
    }
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
              Manage Billing Constants
            </CardTitle>
            <CardDescription>
              Configure global prices/rates, then assign bill names to specific properties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {utilityConstants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Bill Name</th>
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
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              onClick={() => handleSaveUtility(constant)}
                              disabled={updatingUtilityId === constant.id || deletingUtilityId === constant.id || rentUtility}
                              className="h-8 bg-[#154279] text-white hover:bg-[#0f325e]"
                            >
                              {updatingUtilityId === constant.id ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUtility(constant)}
                              disabled={updatingUtilityId === constant.id || deletingUtilityId === constant.id || rentUtility}
                              className="h-8"
                            >
                              {deletingUtilityId === constant.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                        );
                      })()
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-600">No bill name constants found.</p>
            )}

            {/* Add Custom Bill */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Add Custom Bill</h3>
                <Button
                  onClick={() => setShowAddUtility(!showAddUtility)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus size={16} />
                  {showAddUtility ? 'Cancel' : 'Add Custom Bill'}
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
                    <Label htmlFor="utility_name">Bill Name</Label>
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
                        {newUtilityIsMetered ? 'Price field disabled for metered bill names' : 'Flat fee charged to all tenants'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Bill Type</Label>
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
                    {saving ? 'Adding...' : 'Add Bill Name'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* First-Time Move-In Payments */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              First-Time Move-In Payments
            </CardTitle>
            <CardDescription>
              Newly assigned tenants appear here for first invoice generation (rent + deposits + onboarding charges).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {firstPaymentCandidates.length === 0 ? (
              <p className="text-sm text-slate-600">No newly assigned tenants pending first-payment invoicing.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Tenant</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Property / Unit</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Assigned</th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-700">Rent (KES)</th>
                      <th className="text-center py-2 px-3 font-semibold text-slate-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firstPaymentCandidates.map((candidate) => (
                      <tr key={candidate.lease_id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <p className="font-semibold text-slate-900">{candidate.tenant_name}</p>
                          <p className="text-xs text-slate-500">{candidate.tenant_email}</p>
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {candidate.property_name} - {candidate.unit_number}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {candidate.assigned_at ? new Date(candidate.assigned_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-900">
                          {Number(candidate.rent_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Button size="sm" onClick={() => openFirstPaymentInvoice(candidate)} className="bg-[#154279] hover:bg-[#0f325e]">
                            Generate First Invoice
                          </Button>
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

      {/* Vacating / Switching Payments */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChevronRight className="w-5 h-5" />
              Vacating / Unit Or Property Switching
            </CardTitle>
            <CardDescription>
              Transition cases (vacating or switching) appear here for final settlement invoices and adjustment credits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transitionCandidates.length === 0 ? (
              <p className="text-sm text-slate-600">No pending vacating or switching notices awaiting invoicing.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Tenant</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Property / Unit</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Move Out</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Status</th>
                      <th className="text-center py-2 px-3 font-semibold text-slate-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transitionCandidates.map((candidate) => (
                      <tr key={candidate.vacancy_notice_id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <p className="font-semibold text-slate-900">{candidate.tenant_name}</p>
                          <p className="text-xs text-slate-500">{candidate.tenant_email}</p>
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {candidate.property_name} - {candidate.unit_number}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {candidate.move_out_date ? new Date(candidate.move_out_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="capitalize">{candidate.status}</Badge>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Button size="sm" onClick={() => openTransitionInvoice(candidate)} className="bg-amber-600 hover:bg-amber-700">
                            Generate Transition Invoice
                          </Button>
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

      {/* Tenants & Readings Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Tenant Billing Summary
            </CardTitle>
            <CardDescription>
              View all tenants with their bill name readings and billing information
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
                <p className="text-slate-600 text-lg">No bill name readings found</p>
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
                        Bill Names
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
                              className="inline-flex items-center gap-1 px-2 py-1 hover:bg-green-50 rounded text-green-700 transition text-xs font-semibold"
                              title="Download Invoice"
                            >
                              <FileDown size={16} />
                              Invoice
                            </button>
                            <button
                              onClick={() => downloadReceiptPdf(tenant)}
                              className="inline-flex items-center gap-1 px-2 py-1 hover:bg-emerald-50 rounded text-emerald-700 transition text-xs font-semibold"
                              title="Download Receipt"
                            >
                              <FileText size={16} />
                              Receipt
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
        <DepositRefundSheet
          cases={depositRefundCases}
          title="Deposit Refund Sheet"
          description="Generated from vacancy notices. Automatically includes manager checklist damages, with manual item deductions calculated as (unit cost x quantity) + labour cost."
        />
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

      {/* Special Invoice Modal */}
      {specialInvoiceDraft && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle>
                  {specialInvoiceDraft.eventType === 'first_payment' ? 'First-Time Move-In Invoice' : 'Vacating/Switching Settlement Invoice'}
                </CardTitle>
                <CardDescription>
                  {specialInvoiceDraft.tenant_name} - {specialInvoiceDraft.property_name} ({specialInvoiceDraft.unit_number})
                </CardDescription>
              </div>
              <button onClick={() => setSpecialInvoiceDraft(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </CardHeader>

            <CardContent className="pt-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={specialInvoiceDraft.dueDate}
                    onChange={(e) => handleSpecialInvoiceDraftChange('dueDate', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {specialInvoiceDraft.eventType === 'first_payment' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>First Month Rent</Label>
                      <Input type="number" value={specialInvoiceDraft.baseRent} onChange={(e) => handleSpecialInvoiceDraftChange('baseRent', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Security Deposit</Label>
                      <Input type="number" value={specialInvoiceDraft.securityDeposit} onChange={(e) => handleSpecialInvoiceDraftChange('securityDeposit', e.target.value)} className="mt-1" />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Property Initial Charges (Deposits / Fees)</Label>
                      <span className="text-xs text-slate-500">These are linked to this property profile</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_180px_auto] gap-2">
                      <Input
                        type="text"
                        value={newInitialChargeName}
                        onChange={(e) => setNewInitialChargeName(e.target.value)}
                        placeholder="Charge name (e.g. Water Deposit)"
                      />
                      <select
                        value={newInitialChargeType}
                        onChange={(e) => setNewInitialChargeType(e.target.value === 'fee' ? 'fee' : 'deposit')}
                        className="h-10 border border-slate-300 rounded-md px-2 bg-white"
                      >
                        <option value="deposit">Deposit</option>
                        <option value="fee">Fee</option>
                      </select>
                      <Input
                        type="number"
                        value={newInitialChargeAmount}
                        onChange={(e) => setNewInitialChargeAmount(e.target.value)}
                        placeholder="Amount"
                      />
                      <Button type="button" onClick={handleAddInitialCharge} className="bg-[#154279] hover:bg-[#0f325e]">
                        Add
                      </Button>
                    </div>

                    {(specialInvoiceDraft.initialCharges || []).length > 0 ? (
                      <div className="space-y-2">
                        {(specialInvoiceDraft.initialCharges || []).map((item) => (
                          <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_180px_auto] gap-2 items-center">
                            <Input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleInitialChargeChange(item.id, 'name', e.target.value)}
                            />
                            <select
                              value={item.charge_type}
                              onChange={(e) => handleInitialChargeChange(item.id, 'charge_type', e.target.value)}
                              className="h-10 border border-slate-300 rounded-md px-2 bg-white"
                            >
                              <option value="deposit">Deposit</option>
                              <option value="fee">Fee</option>
                            </select>
                            <Input
                              type="number"
                              value={Number(item.amount || 0)}
                              onChange={(e) => handleInitialChargeChange(item.id, 'amount', e.target.value)}
                            />
                            <Button type="button" variant="outline" onClick={() => handleRemoveInitialCharge(item.id)}>
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No extra initial charges. Add deposits/fees if needed.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Cleaning Fee</Label>
                    <Input type="number" value={specialInvoiceDraft.cleaningFee} onChange={(e) => handleSpecialInvoiceDraftChange('cleaningFee', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Damage Charges</Label>
                    <Input type="number" value={specialInvoiceDraft.damageCharges} onChange={(e) => handleSpecialInvoiceDraftChange('damageCharges', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Utility Clearance</Label>
                    <Input type="number" value={specialInvoiceDraft.utilityClearance} onChange={(e) => handleSpecialInvoiceDraftChange('utilityClearance', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Switching Fee</Label>
                    <Input type="number" value={specialInvoiceDraft.switchingFee} onChange={(e) => handleSpecialInvoiceDraftChange('switchingFee', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Refund Credit (Subtract)</Label>
                    <Input type="number" value={specialInvoiceDraft.refundCredit} onChange={(e) => handleSpecialInvoiceDraftChange('refundCredit', e.target.value)} className="mt-1" />
                  </div>
                </div>
              )}

              <div>
                <Label>Notes</Label>
                <textarea
                  value={specialInvoiceDraft.notes}
                  onChange={(e) => handleSpecialInvoiceDraftChange('notes', e.target.value)}
                  className="w-full mt-1 min-h-[80px] px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="Optional notes"
                />
              </div>

              {specialInvoiceDraft.eventType !== 'first_payment' && (
                <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Additional / Missing Charges</Label>
                    <span className="text-xs text-slate-500">Add any other line item not listed above</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2">
                    <Input
                      type="text"
                      value={newSpecialChargeName}
                      onChange={(e) => setNewSpecialChargeName(e.target.value)}
                      placeholder="Charge name (e.g. Key card fee)"
                    />
                    <Input
                      type="number"
                      value={newSpecialChargeAmount}
                      onChange={(e) => setNewSpecialChargeAmount(e.target.value)}
                      placeholder="Amount"
                    />
                    <Button type="button" onClick={handleAddSpecialCharge} className="bg-[#154279] hover:bg-[#0f325e]">
                      Add
                    </Button>
                  </div>

                  {Object.keys(specialInvoiceDraft.customCharges || {}).length > 0 && (
                    <div className="space-y-2">
                      {Object.entries(specialInvoiceDraft.customCharges).map(([key, amount]) => (
                        <div key={key} className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2 items-center">
                          <Input type="text" value={key} disabled className="bg-slate-50" />
                          <Input
                            type="number"
                            value={Number(amount || 0)}
                            onChange={(e) => handleSpecialChargeAmountChange(key, e.target.value)}
                          />
                          <Button type="button" variant="outline" onClick={() => handleRemoveSpecialCharge(key)}>
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-slate-600">Invoice Total</p>
                <p className="text-3xl font-bold text-blue-700">{formatKES(calculateSpecialInvoiceTotal(specialInvoiceDraft))}</p>
              </div>
            </CardContent>

            <CardFooter className="gap-3 border-t flex-wrap justify-end">
              <Button variant="outline" onClick={() => setSpecialInvoiceDraft(null)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateSpecialInvoice} disabled={savingSpecialInvoice} className="gap-2 bg-[#154279] hover:bg-[#0f325e]">
                {savingSpecialInvoice ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {savingSpecialInvoice ? 'Generating...' : 'Generate Invoice'}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SuperAdminUtilitiesManager;
