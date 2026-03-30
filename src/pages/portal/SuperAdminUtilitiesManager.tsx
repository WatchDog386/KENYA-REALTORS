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
  Check,
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
import { downloadReceiptPDF, formatReceiptData, generateReceiptPDF } from "@/utils/receiptGenerator";

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
  lease_application_id?: string;
  tenant_id: string;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  property_id: string;
  property_name: string;
  unit_id: string;
  unit_number: string;
  unit_type_id?: string;
  unit_type_name?: string;
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
  lease_application_id?: string;
  tenant_id: string;
  tenant_name: string;
  tenant_email?: string;
  property_id: string;
  property_name: string;
  unit_id: string;
  unit_number: string;
  unit_type_id?: string;
  unit_type_name?: string;
  baseRent: number;
  securityDeposit: number;
  securityDepositMonths: number;
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

const DEFAULT_SECURITY_DEPOSIT_MONTHS = 1;

const normalizeSecurityDepositMonths = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_SECURITY_DEPOSIT_MONTHS;
  return Math.max(DEFAULT_SECURITY_DEPOSIT_MONTHS, Math.round(parsed));
};

const calculateSecurityDepositAmount = (baseRent: number, months: number): number => {
  return Number(baseRent || 0) * normalizeSecurityDepositMonths(months);
};

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
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [filterProperty, setFilterProperty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState<TenantWithReadings | null>(null);
  const [propertyOptions, setPropertyOptions] = useState<PropertyOption[]>([]);
  const [propertyUtilityMap, setPropertyUtilityMap] = useState<Record<string, string[]>>({});
  const [showAddUtility, setShowAddUtility] = useState(false);
  const [newUtilityName, setNewUtilityName] = useState('');
  const [newUtilityConstant, setNewUtilityConstant] = useState(1);
  const [newUtilityPrice, setNewUtilityPrice] = useState(0);
  const [newUtilityIsMetered, setNewUtilityIsMetered] = useState(false);
  const [newUtilityPropertyId, setNewUtilityPropertyId] = useState('');
  const [updatingUtilityId, setUpdatingUtilityId] = useState<string | null>(null);
  const [deletingUtilityId, setDeletingUtilityId] = useState<string | null>(null);
  const [isolatingUtilities, setIsolatingUtilities] = useState(false);
  const [utilityDrafts, setUtilityDrafts] = useState<Record<string, { constant: string; price: string }>>({});
  const [invoiceDraft, setInvoiceDraft] = useState<InvoiceDraft | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [firstPaymentCandidates, setFirstPaymentCandidates] = useState<FirstPaymentCandidate[]>([]);
  const [transitionCandidates, setTransitionCandidates] = useState<TransitionBillingCandidate[]>([]);
  const [specialInvoiceDraft, setSpecialInvoiceDraft] = useState<SpecialInvoiceDraft | null>(null);
  const [savingSpecialInvoice, setSavingSpecialInvoice] = useState(false);
  const [savingFirstPaymentDefaults, setSavingFirstPaymentDefaults] = useState(false);
  const [propertyInitialChargesMap, setPropertyInitialChargesMap] = useState<Record<string, InitialChargeLineItem[]>>({});
  const [propertyDepositMonthsMap, setPropertyDepositMonthsMap] = useState<Record<string, number>>({});
  const [selectedPropertyForInitialConfig, setSelectedPropertyForInitialConfig] = useState<string>('');
  const [tempDepositMonths, setTempDepositMonths] = useState(1);
  const [tempAdditionalCharges, setTempAdditionalCharges] = useState<Array<{ name: string; type: 'deposit' | 'fee'; amount: number }>>([]);
  const [newChargeNameStandard, setNewChargeNameStandard] = useState('');
  const [newChargeTypeStandard, setNewChargeTypeStandard] = useState<'deposit' | 'fee'>('deposit');
  const [newChargeAmountStandard, setNewChargeAmountStandard] = useState('');
  const [newInitialChargeName, setNewInitialChargeName] = useState('');
  const [newInitialChargeAmount, setNewInitialChargeAmount] = useState('');
  const [newInitialChargeType, setNewInitialChargeType] = useState<'deposit' | 'fee'>('deposit');
  const [newSpecialChargeName, setNewSpecialChargeName] = useState('');
  const [newSpecialChargeAmount, setNewSpecialChargeAmount] = useState('');
  const [autoChecklistDamageByUnit, setAutoChecklistDamageByUnit] = useState<Record<string, number>>({});
  const [existingFirstPaymentInvoice, setExistingFirstPaymentInvoice] = useState<any>(null);
  const [editingLineItemId, setEditingLineItemId] = useState<string | null>(null);
  const [loadingExistingInvoice, setLoadingExistingInvoice] = useState(false);
  const [existingFirstPaymentInvoicesList, setExistingFirstPaymentInvoicesList] = useState<any[]>([]);
  const [loadingExistingInvoicesList, setLoadingExistingInvoicesList] = useState(false);
  const [selectedExistingInvoiceForEdit, setSelectedExistingInvoiceForEdit] = useState<any>(null);

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
        if (!selectedPropertyForInitialConfig && mappedProperties.length > 0) {
          setSelectedPropertyForInitialConfig(mappedProperties[0].id);
        }

        const { data: propertyUtilitiesData, error: propertyUtilitiesError } = await supabase
          .from('property_utilities')
          .select('property_id, utility_constant_id');

        if (propertyUtilitiesError && propertyUtilitiesError.code !== 'PGRST116') {
          throw propertyUtilitiesError;
        }

        const utilityMap: Record<string, string[]> = {};
        (propertyUtilitiesData || []).forEach((row: any) => {
          if (!row?.property_id || !row?.utility_constant_id) return;
          if (!utilityMap[row.property_id]) {
            utilityMap[row.property_id] = [];
          }
          utilityMap[row.property_id].push(row.utility_constant_id);
        });
        setPropertyUtilityMap(utilityMap);

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

        const db = supabase as any;
        const { data: propertyDefaultsData, error: propertyDefaultsError } = await db
          .from('properties')
          .select('id, first_payment_defaults');

        if (propertyDefaultsError) {
          const missingColumn = String(propertyDefaultsError.message || '').toLowerCase().includes('first_payment_defaults');
          if (!missingColumn) throw propertyDefaultsError;
          setPropertyDepositMonthsMap({});
        } else {
          const defaultsMap: Record<string, number> = {};
          (propertyDefaultsData || []).forEach((row: any) => {
            const months = normalizeSecurityDepositMonths(row?.first_payment_defaults?.security_deposit_months);
            defaultsMap[String(row.id)] = months;
          });
          setPropertyDepositMonthsMap(defaultsMap);
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

  // Load property-specific initial invoice configuration
  useEffect(() => {
    if (!selectedPropertyForInitialConfig) {
      setTempDepositMonths(1);
      setTempAdditionalCharges([]);
      return;
    }

    const loadPropertyConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('first_payment_defaults, initial_charge_templates')
          .eq('id', selectedPropertyForInitialConfig)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          // Load security deposit months
          const months = normalizeSecurityDepositMonths(data?.first_payment_defaults?.security_deposit_months);
          setTempDepositMonths(months);

          // Load additional charges
          const templates = Array.isArray(data?.initial_charge_templates) ? data.initial_charge_templates : [];
          const charges = templates
            .map((item: any) => ({
              name: String(item?.name || '').trim(),
              type: item?.charge_type === 'fee' ? 'fee' : 'deposit',
              amount: Number(item?.amount || 0),
            }))
            .filter((item: any) => item.name && item.amount >= 0);
          setTempAdditionalCharges(charges);
        }
      } catch (err: any) {
        console.error('Error loading property configuration:', err);
      }
    };

    loadPropertyConfig();
  }, [selectedPropertyForInitialConfig]);

  useEffect(() => {
    if (selectedPropertyId === 'all') return;
    if (selectedPropertyForInitialConfig === selectedPropertyId) return;
    setSelectedPropertyForInitialConfig(selectedPropertyId);
  }, [selectedPropertyId, selectedPropertyForInitialConfig]);


  const loadTenantReadings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('tenant_id, property_id, status, issued_date, created_at')
        .order('issued_date', { ascending: false })
        .order('created_at', { ascending: false });

      const buildTenantPropertyKey = (tenantId?: string | null, propertyId?: string | null) =>
        `${String(tenantId || '')}::${String(propertyId || '')}`;

      const latestInvoiceStatusByTenantProperty = new Map<string, 'pending' | 'paid'>();
      (invoicesData || []).forEach((invoice: any) => {
        if (!invoice?.tenant_id) return;

        const scopedKey = buildTenantPropertyKey(invoice.tenant_id, invoice.property_id);
        if (!latestInvoiceStatusByTenantProperty.has(scopedKey)) {
          latestInvoiceStatusByTenantProperty.set(
            scopedKey,
            String(invoice.status || '').toLowerCase() === 'paid' ? 'paid' : 'pending'
          );
        }

        // Fallback bucket for legacy rows where property_id might be absent.
        const tenantOnlyKey = buildTenantPropertyKey(invoice.tenant_id, null);
        if (!latestInvoiceStatusByTenantProperty.has(tenantOnlyKey)) {
          latestInvoiceStatusByTenantProperty.set(
            tenantOnlyKey,
            String(invoice.status || '').toLowerCase() === 'paid' ? 'paid' : 'pending'
          );
        }
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
              ? (
                  latestInvoiceStatusByTenantProperty.get(
                    buildTenantPropertyKey(reading.tenant_id, reading.property_id)
                  ) ||
                  latestInvoiceStatusByTenantProperty.get(
                    buildTenantPropertyKey(reading.tenant_id, null)
                  )
                )
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
            unit_type_id,
            property_unit_types:unit_type_id(name, unit_type_name),
            properties:property_id(name)
          )
        `)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false });

      if (leaseError) throw leaseError;

      const { data: applicationRows, error: appError } = await supabase
        .from('lease_applications')
        .select(`
          id,
          applicant_id,
          unit_id,
          property_id,
          status,
          created_at
        `)
        .in('status', ['manager_approved', 'approved', 'under_review', 'invoice_sent'])
        .order('created_at', { ascending: false });

      if (appError) throw appError;

      const { data: vacancyRows, error: vacancyError } = await supabase
        .from('vacancy_notices')
        .select('id, tenant_id, property_id, unit_id, move_out_date, status, reason, created_at')
        .in('status', ['pending', 'inspection_scheduled', 'approved'])
        .order('created_at', { ascending: false });

      if (vacancyError && vacancyError.code !== 'PGRST116') throw vacancyError;

      const unitIds = Array.from(
        new Set(
          [
            ...(leaseRows || []).map((row: any) => row?.unit_id),
            ...(applicationRows || []).map((row: any) => row?.unit_id),
            ...(vacancyRows || []).map((row: any) => row?.unit_id),
          ].filter(Boolean)
        )
      ) as string[];

      let unitById = new Map<string, any>();
      if (unitIds.length > 0) {
        const { data: unitsData, error: unitsError } = await supabase
          .from('units')
          .select(`
            id,
            unit_number,
            property_id,
            unit_type_id,
            price,
            property_unit_types:unit_type_id(name, unit_type_name, price_per_unit),
            properties:property_id(name)
          `)
          .in('id', unitIds);

        if (unitsError && unitsError.code !== 'PGRST116') throw unitsError;
        unitById = new Map((unitsData || []).map((row: any) => [row.id, row]));
      }

      const tenantIds = new Set<string>();
      (leaseRows || []).forEach((row: any) => row?.tenant_id && tenantIds.add(row.tenant_id));
      (applicationRows || []).forEach((row: any) => row?.applicant_id && tenantIds.add(row.applicant_id));
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
        const firstAppMatch = notes.match(/LEASE_APPLICATION_ID:([a-f0-9-]+)/i);
        if (firstAppMatch?.[1]) firstPaymentMarkers.add(firstAppMatch[1]);
        const transitionMatch = notes.match(/VACANCY_NOTICE_ID:([a-f0-9-]+)/i);
        if (transitionMatch?.[1]) transitionMarkers.add(transitionMatch[1]);
      });

      const now = Date.now();
      const recentWindowMs = 45 * 24 * 60 * 60 * 1000;

      const firstCandidatesFromLeases: FirstPaymentCandidate[] = (leaseRows || [])
        .filter((lease: any) => {
          if (!lease?.id || firstPaymentMarkers.has(lease.id)) return false;
          const leaseCreatedAt = lease?.created_at ? new Date(lease.created_at).getTime() : 0;
          const leaseStart = lease?.start_date ? new Date(lease.start_date).getTime() : 0;
          const leaseRecency = Math.max(leaseCreatedAt, leaseStart);
          return leaseRecency > 0 && now - leaseRecency <= recentWindowMs;
        })
        .map((lease: any) => {
          const profile = profilesMap.get(lease.tenant_id) || {};
          const unit = unitById.get(lease.unit_id) || (Array.isArray(lease.units) ? lease.units[0] : lease.units);
          const propertyName = unit?.properties
            ? (Array.isArray(unit.properties) ? unit.properties[0]?.name : unit.properties?.name)
            : 'Unknown Property';
          const unitType = unit?.property_unit_types
            ? (Array.isArray(unit.property_unit_types) ? unit.property_unit_types[0] : unit.property_unit_types)
            : null;

          return {
            lease_id: lease.id,
            lease_application_id: undefined,
            tenant_id: lease.tenant_id,
            tenant_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown Tenant',
            tenant_email: profile.email || '',
            tenant_phone: profile.phone || '',
            property_id: unit?.property_id || '',
            property_name: propertyName || 'Unknown Property',
            unit_id: lease.unit_id,
            unit_number: unit?.unit_number || 'N/A',
            unit_type_id: unit?.unit_type_id || '',
            unit_type_name: unitType?.name || unitType?.unit_type_name || '',
            rent_amount: Number(lease.rent_amount || 0),
            lease_start_date: lease.start_date,
            assigned_at: lease.created_at,
          };
        })
        .filter((c) => c.tenant_id && c.property_id && c.unit_id);

      const firstCandidatesFromApplications: FirstPaymentCandidate[] = (applicationRows || [])
        .filter((application: any) => {
          if (!application?.id || firstPaymentMarkers.has(application.id)) return false;
          const applicationCreatedAt = application?.created_at ? new Date(application.created_at).getTime() : 0;
          return applicationCreatedAt > 0 && now - applicationCreatedAt <= recentWindowMs;
        })
        .map((application: any) => {
          const profile = profilesMap.get(application.applicant_id) || {};
          const unit = unitById.get(application.unit_id);
          const propertyName = unit?.properties
            ? (Array.isArray(unit.properties) ? unit.properties[0]?.name : unit.properties?.name)
            : 'Unknown Property';
          const unitType = unit?.property_unit_types
            ? (Array.isArray(unit.property_unit_types) ? unit.property_unit_types[0] : unit.property_unit_types)
            : null;

          return {
            lease_id: application.id,
            lease_application_id: application.id,
            tenant_id: application.applicant_id,
            tenant_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown Tenant',
            tenant_email: profile.email || '',
            tenant_phone: profile.phone || '',
            property_id: application.property_id || unit?.property_id || '',
            property_name: propertyName || 'Unknown Property',
            unit_id: application.unit_id,
            unit_number: unit?.unit_number || 'N/A',
            unit_type_id: unit?.unit_type_id || '',
            unit_type_name: unitType?.name || unitType?.unit_type_name || '',
            rent_amount: Number(unit?.price ?? unitType?.price_per_unit ?? 0),
            lease_start_date: undefined,
            assigned_at: application.created_at,
          };
        })
        .filter((c) => c.tenant_id && c.property_id && c.unit_id);

      const firstCandidateMap = new Map<string, FirstPaymentCandidate>();
      [...firstCandidatesFromApplications, ...firstCandidatesFromLeases].forEach((candidate) => {
        const key = `${candidate.tenant_id}:${candidate.unit_id}`;
        const existing = firstCandidateMap.get(key);
        if (!existing) {
          firstCandidateMap.set(key, candidate);
          return;
        }

        const existingTime = new Date(existing.assigned_at || 0).getTime();
        const nextTime = new Date(candidate.assigned_at || 0).getTime();
        const prefersLeaseCandidate = Boolean(existing.lease_application_id) && !candidate.lease_application_id;

        if (prefersLeaseCandidate || nextTime > existingTime) {
          firstCandidateMap.set(key, candidate);
        }
      });

      const firstCandidates = Array.from(firstCandidateMap.values()).sort((a, b) => {
        const aTime = new Date(a.assigned_at || a.lease_start_date || 0).getTime();
        const bTime = new Date(b.assigned_at || b.lease_start_date || 0).getTime();
        return bTime - aTime;
      });

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
    loadExistingFirstPaymentInvoicesList();

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
          await loadExistingFirstPaymentInvoicesList();
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
    const securityDepositMonths = normalizeSecurityDepositMonths(propertyDepositMonthsMap[candidate.property_id]);
    const baseRent = Number(candidate.rent_amount || 0);

    setNewInitialChargeName('');
    setNewInitialChargeAmount('');
    setNewInitialChargeType('deposit');
    setNewSpecialChargeName('');
    setNewSpecialChargeAmount('');
    setSpecialInvoiceDraft({
      eventType: 'first_payment',
      sourceId: candidate.lease_id,
      lease_application_id: candidate.lease_application_id,
      tenant_id: candidate.tenant_id,
      tenant_name: candidate.tenant_name,
      tenant_email: candidate.tenant_email,
      property_id: candidate.property_id,
      property_name: candidate.property_name,
      unit_id: candidate.unit_id,
      unit_number: candidate.unit_number,
      unit_type_id: candidate.unit_type_id,
      unit_type_name: candidate.unit_type_name,
      baseRent,
      securityDeposit: calculateSecurityDepositAmount(baseRent, securityDepositMonths),
      securityDepositMonths,
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

  const openAutoGeneratedFirstPaymentInvoice = async (candidate: FirstPaymentCandidate) => {
    if (selectedPropertyId === 'all') {
      toast.info('All Properties workspace is read-only. Select one property to view and edit invoices.');
      return;
    }

    try {
      const parseMeta = (notes?: string | null) => {
        const normalized = String(notes || '').replace(/[\r\n]+/g, ';');
        const map: Record<string, string> = {};
        normalized.split(';').forEach((entry) => {
          const [rawKey, ...rest] = entry.split(':');
          if (!rawKey || rest.length === 0) return;
          const key = rawKey.trim().toUpperCase();
          const value = rest.join(':').trim();
          if (!value) return;
          map[key] = value;
        });
        return map;
      };

      const existingFromList = (existingFirstPaymentInvoicesList || []).find((invoice: any) => {
        const notes = String(invoice?.notes || '');
        const meta = parseMeta(notes);
        const sameProperty = String(invoice?.property_id || '') === String(candidate.property_id || '');
        if (!sameProperty) return false;

        const matchesUnit =
          String(meta.UNIT_ID || '') === String(candidate.unit_id || '') ||
          String(invoice?.unit_number || '').toLowerCase() === String(candidate.unit_number || '').toLowerCase();
        const matchesApplicant = String(meta.APPLICANT_ID || '') === String(candidate.tenant_id || '');
        const matchesLease =
          String(meta.LEASE_ID || '') === String(candidate.lease_id || '') ||
          (candidate.lease_application_id && String(meta.LEASE_APPLICATION_ID || '') === String(candidate.lease_application_id));

        return matchesUnit || matchesApplicant || matchesLease;
      });

      if (existingFromList) {
        setSelectedExistingInvoiceForEdit(existingFromList);
        return;
      }

      const { data, error } = await supabase
        .from('invoices')
        .select('id, reference_number, tenant_id, property_id, amount, due_date, status, items, notes, created_at')
        .eq('property_id', candidate.property_id)
        .ilike('notes', '%BILLING_EVENT:first_payment%')
        .in('status', ['unpaid', 'overdue', 'pending', 'paid'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const invoices = data || [];
      const matchedInvoice = invoices.find((invoice: any) => {
        const notes = String(invoice?.notes || '');
        const meta = parseMeta(notes);

        const matchesUnit = String(meta.UNIT_ID || '') === String(candidate.unit_id || '');
        const matchesApplicant = String(meta.APPLICANT_ID || '') === String(candidate.tenant_id || '');
        const matchesLease =
          String(meta.LEASE_ID || '') === String(candidate.lease_id || '') ||
          (candidate.lease_application_id && String(meta.LEASE_APPLICATION_ID || '') === String(candidate.lease_application_id));

        return matchesUnit || matchesApplicant || matchesLease;
      }) || null;

      if (!matchedInvoice) {
        toast.info('Auto-generated invoice was not found yet for this tenant/unit. Refreshing invoice list...');
        await loadExistingFirstPaymentInvoicesList();
        return;
      }

      setSelectedExistingInvoiceForEdit({
        ...matchedInvoice,
        tenant_name: candidate.tenant_name,
        tenant_email: candidate.tenant_email,
        property_name: candidate.property_name,
        unit_number: candidate.unit_number,
      });
    } catch (err: any) {
      console.error('Error opening auto-generated first-payment invoice:', err);
      toast.error('Failed to open first-time invoice');
    }
  };

  const openTransitionInvoice = (candidate: TransitionBillingCandidate) => {
    if (selectedPropertyId === 'all') {
      toast.info('All Properties workspace is read-only. Select one property to generate transition invoices.');
      return;
    }

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
      securityDepositMonths: DEFAULT_SECURITY_DEPOSIT_MONTHS,
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
      const numericValue = Number.isNaN(parsed) ? 0 : parsed;
      const nextDraft = { ...prev, [field]: numericValue } as SpecialInvoiceDraft;

      if (field === 'baseRent' && prev.eventType === 'first_payment') {
        nextDraft.securityDeposit = calculateSecurityDepositAmount(
          numericValue,
          prev.securityDepositMonths || DEFAULT_SECURITY_DEPOSIT_MONTHS
        );
      }

      return nextDraft;
    });
  };

  const handleSecurityDepositMonthsChange = (value: string) => {
    setSpecialInvoiceDraft((prev) => {
      if (!prev || prev.eventType !== 'first_payment') return prev;
      const months = normalizeSecurityDepositMonths(value);
      return {
        ...prev,
        securityDepositMonths: months,
        securityDeposit: calculateSecurityDepositAmount(prev.baseRent, months),
      };
    });
  };

  const persistFirstPaymentDefaultsForProperty = async (
    propertyId: string,
    initialCharges: InitialChargeLineItem[],
    securityDepositMonths: number
  ) => {
    if (!propertyId) return;

    const sanitizedCharges = (initialCharges || [])
      .map((item, index) => ({
        id: String(item.id || `tpl-${Date.now()}-${index}`),
        name: String(item.name || '').trim(),
        charge_type: item.charge_type === 'fee' ? 'fee' : 'deposit',
        amount: Number(item.amount || 0),
      }))
      .filter((item) => item.name && item.amount >= 0);

    const normalizedMonths = normalizeSecurityDepositMonths(securityDepositMonths);

    const applyLocalPropertyState = () => {
      setPropertyInitialChargesMap((prev) => ({
        ...prev,
        [propertyId]: sanitizedCharges,
      }));
      setPropertyDepositMonthsMap((prev) => ({
        ...prev,
        [propertyId]: normalizedMonths,
      }));
    };

    const db = supabase as any;
    const fullPayload = {
      initial_charge_templates: sanitizedCharges,
      first_payment_defaults: { security_deposit_months: normalizedMonths },
    };

    const updatePropertyConfig = async (payload: Record<string, unknown>) => {
      const { data, error } = await db
        .from('properties')
        .update(payload)
        .eq('id', propertyId)
        .select('id')
        .maybeSingle();

      return {
        data,
        error,
        matched: Boolean(data?.id),
      };
    };

    const { error: updateError, matched } = await updatePropertyConfig(fullPayload);

    if (!updateError) {
      if (!matched) {
        throw new Error('No property row was updated. Re-select the property and save again.');
      }
      applyLocalPropertyState();
      return;
    }

    const errorText = String(updateError.message || '').toLowerCase();
    const missingTemplates = errorText.includes('initial_charge_templates');
    const missingDefaults = errorText.includes('first_payment_defaults');

    if (missingTemplates && missingDefaults) {
      throw new Error('Property invoice configuration columns are missing in the database. Run the latest migration and retry.');
    }

    if (missingDefaults) {
      const { error: fallbackError, matched: fallbackMatched } = await updatePropertyConfig({ initial_charge_templates: sanitizedCharges });
      if (!fallbackError) {
        if (!fallbackMatched) {
          throw new Error('No property row was updated. Re-select the property and save again.');
        }
        applyLocalPropertyState();
        return;
      }
      if (String(fallbackError.message || '').toLowerCase().includes('initial_charge_templates')) return;
      throw fallbackError;
    }

    if (missingTemplates) {
      const { error: fallbackError, matched: fallbackMatched } = await updatePropertyConfig({ first_payment_defaults: { security_deposit_months: normalizedMonths } });
      if (!fallbackError) {
        if (!fallbackMatched) {
          throw new Error('No property row was updated. Re-select the property and save again.');
        }
        applyLocalPropertyState();
        return;
      }
      if (String(fallbackError.message || '').toLowerCase().includes('first_payment_defaults')) return;
      throw fallbackError;
    }

    throw updateError;
  };

  const handleSaveFirstPaymentDefaults = async () => {
    if (!specialInvoiceDraft || specialInvoiceDraft.eventType !== 'first_payment') return;

    try {
      setSavingFirstPaymentDefaults(true);
      await persistFirstPaymentDefaultsForProperty(
        specialInvoiceDraft.property_id,
        specialInvoiceDraft.initialCharges || [],
        specialInvoiceDraft.securityDepositMonths
      );
      toast.success('First-payment defaults saved for this property.');
    } catch (error: any) {
      console.error('Error saving first-payment defaults:', error);
      toast.error(error?.message || 'Failed to save first-payment defaults');
    } finally {
      setSavingFirstPaymentDefaults(false);
    }
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
      const cleanMetadata = (value?: string | null) => String(value || '').replace(/[;\r\n]/g, ' ').trim();
      const leaseApplicationTag = specialInvoiceDraft.eventType === 'first_payment' && specialInvoiceDraft.lease_application_id
        ? `;LEASE_APPLICATION_ID:${specialInvoiceDraft.lease_application_id}`
        : '';
      const marker = specialInvoiceDraft.eventType === 'first_payment'
        ? `BILLING_EVENT:first_payment;LEASE_ID:${specialInvoiceDraft.sourceId}${leaseApplicationTag};UNIT_ID:${specialInvoiceDraft.unit_id};PROPERTY_ID:${specialInvoiceDraft.property_id};APPLICANT_ID:${specialInvoiceDraft.tenant_id};UNIT_NUMBER:${cleanMetadata(specialInvoiceDraft.unit_number)};UNIT_TYPE_ID:${cleanMetadata(specialInvoiceDraft.unit_type_id)};UNIT_TYPE_NAME:${cleanMetadata(specialInvoiceDraft.unit_type_name)};PROPERTY_NAME:${cleanMetadata(specialInvoiceDraft.property_name)};APPLICANT_NAME:${cleanMetadata(specialInvoiceDraft.tenant_name)};APPLICANT_EMAIL:${cleanMetadata(specialInvoiceDraft.tenant_email)};SECURITY_DEPOSIT_MONTHS:${normalizeSecurityDepositMonths(specialInvoiceDraft.securityDepositMonths)}`
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

      if (specialInvoiceDraft.eventType === 'first_payment') {
        try {
          await persistFirstPaymentDefaultsForProperty(
            specialInvoiceDraft.property_id,
            initialCharges,
            specialInvoiceDraft.securityDepositMonths
          );
        } catch (defaultsError) {
          console.warn('Invoice was created, but first-payment defaults could not be saved:', defaultsError);
          toast.warning('Invoice created, but property defaults were not saved. You can retry with Save Defaults.');
        }
      }

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

  const loadExistingFirstPaymentInvoice = async (candidate: FirstPaymentCandidate) => {
    setLoadingExistingInvoice(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, reference_number, amount, due_date, status, items, notes, created_at')
        .eq('tenant_id', candidate.tenant_id)
        .eq('property_id', candidate.property_id)
        .or('notes.ilike.%BILLING_EVENT:first_payment%')
        .eq('status', 'unpaid')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setExistingFirstPaymentInvoice(data);
      } else {
        toast.info('No existing first-payment invoice found for this tenant');
        setExistingFirstPaymentInvoice(null);
      }
    } catch (err: any) {
      console.error('Error loading invoice:', err);
      toast.error('Failed to load invoice');
    } finally {
      setLoadingExistingInvoice(false);
    }
  };

  const deleteLineItemFromInvoice = async (invoiceId: string, lineItemIndex: number) => {
    try {
      if (!existingFirstPaymentInvoice?.items) return;
      
      const updatedItems = { ...existingFirstPaymentInvoice.items };
      const initialCharges = updatedItems.initial_charges || [];
      
      if (initialCharges[lineItemIndex]) {
        initialCharges.splice(lineItemIndex, 1);
        updatedItems.initial_charges = initialCharges;
        
        // Recalculate additional_charges map
        const additionalChargesMap: Record<string, number> = {};
        initialCharges.forEach((item: any) => {
          additionalChargesMap[item.name] = Number(item.amount || 0);
        });
        updatedItems.additional_charges = additionalChargesMap;

        // Recalculate invoice amount
        const newAmount = 
          (Number(updatedItems.monthly_rent) || 0) +
          (Number(updatedItems.security_deposit) || 0) +
          initialCharges.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

        const { error } = await supabase
          .from('invoices')
          .update({
            items: updatedItems,
            amount: newAmount,
          })
          .eq('id', invoiceId);

        if (error) throw error;
        
        setExistingFirstPaymentInvoice({
          ...existingFirstPaymentInvoice,
          items: updatedItems,
          amount: newAmount,
        });
        toast.success('Line item deleted');
      }
    } catch (err: any) {
      console.error('Error deleting line item:', err);
      toast.error('Failed to delete line item');
    }
  };

  const updateLineItemInInvoice = async (invoiceId: string, lineItemIndex: number, field: string, value: any) => {
    try {
      if (!existingFirstPaymentInvoice?.items) return;
      
      const updatedItems = { ...existingFirstPaymentInvoice.items };
      const initialCharges = updatedItems.initial_charges || [];
      
      if (initialCharges[lineItemIndex]) {
        initialCharges[lineItemIndex] = {
          ...initialCharges[lineItemIndex],
          [field]: field === 'amount' ? Number(value) : value,
        };
        updatedItems.initial_charges = initialCharges;
        
        // Update additional_charges map
        const additionalChargesMap: Record<string, number> = {};
        initialCharges.forEach((item: any) => {
          additionalChargesMap[item.name] = Number(item.amount || 0);
        });
        updatedItems.additional_charges = additionalChargesMap;

        // Recalculate invoice amount
        const newAmount = 
          (Number(updatedItems.monthly_rent) || 0) +
          (Number(updatedItems.security_deposit) || 0) +
          initialCharges.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

        const { error } = await supabase
          .from('invoices')
          .update({
            items: updatedItems,
            amount: newAmount,
          })
          .eq('id', invoiceId);

        if (error) throw error;
        
        setExistingFirstPaymentInvoice({
          ...existingFirstPaymentInvoice,
          items: updatedItems,
          amount: newAmount,
        });
        toast.success('Line item updated');
      }
    } catch (err: any) {
      console.error('Error updating line item:', err);
      toast.error('Failed to update line item');
    }
  };

  const loadExistingFirstPaymentInvoicesList = async () => {
    setLoadingExistingInvoicesList(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, reference_number, tenant_id, property_id, amount, due_date, status, items, notes, created_at')
        .or('notes.ilike.%BILLING_EVENT:first_payment%')
        .eq('status', 'unpaid')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Hide legacy invoices generated before metadata tags were standardized.
      const modernInvoices = (data || []).filter((invoice: any) => {
        const notes = String(invoice?.notes || '');
        if (!/BILLING_EVENT:first_payment/i.test(notes)) return false;
        return /UNIT_ID:/i.test(notes) && /PROPERTY_ID:/i.test(notes) && /APPLICANT_ID:/i.test(notes);
      });

      // Fetch tenant and profile names
      const tenantIds = modernInvoices.map(inv => inv.tenant_id).filter(Boolean);
      let tenantMap = new Map<string, any>();
      let profileMap = new Map<string, any>();
      let unitNumberMap = new Map<string, string>();
      
      if (tenantIds.length > 0) {
        const { data: tenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('id, user_id, property_id, unit_id, status')
          .in('id', tenantIds);

        if (tenantsError && tenantsError.code !== 'PGRST116') {
          throw tenantsError;
        }
        
        if (tenants) {
          tenantMap = new Map(tenants.map(t => [t.id, t]));

          // Resolve unit numbers separately to avoid relying on a tenants->units embedded relation.
          const unitIds = Array.from(new Set(tenants.map(t => t.unit_id).filter(Boolean)));
          if (unitIds.length > 0) {
            const { data: units } = await supabase
              .from('units')
              .select('id, unit_number')
              .in('id', unitIds);

            if (units) {
              unitNumberMap = new Map(units.map((u: any) => [u.id, u.unit_number || 'N/A']));
            }
          }
          
          // Fetch profiles for additional name details
          const userIds = Array.from(new Set([
            ...tenants.map(t => t.user_id).filter(Boolean),
            ...tenantIds,
          ]));
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, email, phone')
              .in('id', userIds);
            
            if (profiles) {
              profileMap = new Map(profiles.map(p => [p.id, p]));
            }
          }
        }
      }

      // Fetch property names
      const propertyIds = modernInvoices.map(inv => inv.property_id).filter(Boolean);
      let propertyMap = new Map<string, any>();
      if (propertyIds.length > 0) {
        const { data: properties } = await supabase
          .from('properties')
          .select('id, name')
          .in('id', propertyIds);
        
        if (properties) {
          propertyMap = new Map(properties.map(p => [p.id, p]));
        }
      }

      // Format invoices with proper tenant/property names
      const formatted = modernInvoices.map(inv => {
        const tenant = tenantMap.get(inv.tenant_id);
        const profile = tenant?.user_id ? profileMap.get(tenant.user_id) : profileMap.get(inv.tenant_id);
        
        // Resolve tenant identity from linked profile row.
        const firstName = profile?.first_name || '';
        const lastName = profile?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const tenantName = fullName && fullName !== '' ? fullName : profile?.email || 'Unknown Tenant';
        
        return {
          ...inv,
          tenant_name: tenantName,
          tenant_email: profile?.email || '',
          unit_number: tenant?.unit_id ? (unitNumberMap.get(tenant.unit_id) || 'N/A') : 'N/A',
          property_name: propertyMap.get(inv.property_id)?.name || 'Unknown Property',
        };
      });

      setExistingFirstPaymentInvoicesList(formatted);
    } catch (err: any) {
      console.error('Error loading existing invoices:', err);
      toast.error('Failed to load existing invoices');
    } finally {
      setLoadingExistingInvoicesList(false);
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
      filtered = filtered.filter(t => t.property_id === filterProperty);
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
    if (selectedPropertyId === 'all') {
      toast.info('Select a specific property workspace to add billing utilities');
      return;
    }

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

      const scopedUtilities = utilityConstants.filter((utility) =>
        (propertyUtilityMap[newUtilityPropertyId] || []).includes(utility.id)
      );
      const existingInProperty = scopedUtilities.find(
        (utility) => String(utility.utility_name || '').trim().toLowerCase() === String(newUtilityName || '').trim().toLowerCase()
      );

      if (existingInProperty) {
        toast.error('This billing utility already exists for the selected property');
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

        setPropertyUtilityMap((prev) => ({
          ...prev,
          [newUtilityPropertyId]: [...(prev[newUtilityPropertyId] || []), newUtility.id],
        }));

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
      const message = String(err?.message || '');
      if (message.toLowerCase().includes('utility_name') && message.toLowerCase().includes('duplicate')) {
        setError('Database still enforces globally unique utility names. Apply the property-scoped utility migration, then try again.');
        toast.error('Global utility-name uniqueness is still active in DB. Run latest migration and retry.');
      } else {
        setError(err.message || "Failed to add utility");
        toast.error("Failed to add utility");
      }
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

  const ensurePropertyScopedUtility = async (utility: UtilityConstant, propertyId: string): Promise<string> => {
    const { data: assignments, error: assignmentsError } = await supabase
      .from('property_utilities')
      .select('property_id')
      .eq('utility_constant_id', utility.id);

    if (assignmentsError) throw assignmentsError;

    const assignedPropertyIds = (assignments || []).map((row: any) => String(row.property_id));
    const isAssignedToCurrentProperty = assignedPropertyIds.includes(String(propertyId));
    if (!isAssignedToCurrentProperty) {
      throw new Error('This billing utility is not assigned to the current property workspace.');
    }

    if (assignedPropertyIds.length <= 1) {
      return utility.id;
    }

    const { data: clonedUtility, error: cloneError } = await supabase
      .from('utility_constants')
      .insert([
        {
          utility_name: utility.utility_name,
          constant: utility.constant,
          price: utility.price ?? null,
          is_metered: utility.is_metered,
          description: utility.description || null,
        },
      ])
      .select('*')
      .single();

    if (cloneError) {
      const message = String(cloneError?.message || '');
      if (message.toLowerCase().includes('utility_name') && message.toLowerCase().includes('duplicate')) {
        throw new Error('Global utility-name uniqueness is still enabled in database. Apply latest migration before property-scoped edits.');
      }
      throw cloneError;
    }

    const { error: reassignmentError } = await supabase
      .from('property_utilities')
      .update({ utility_constant_id: clonedUtility.id })
      .eq('property_id', propertyId)
      .eq('utility_constant_id', utility.id);

    if (reassignmentError) throw reassignmentError;

    setPropertyUtilityMap((prev) => ({
      ...prev,
      [propertyId]: (prev[propertyId] || []).map((id) => (id === utility.id ? clonedUtility.id : id)),
    }));

    setUtilityConstants((prev) => {
      const hasCloneAlready = prev.some((row) => row.id === clonedUtility.id);
      if (hasCloneAlready) return prev;
      return [...prev, clonedUtility].sort((a, b) => String(a.utility_name || '').localeCompare(String(b.utility_name || '')));
    });

    setUtilityDrafts((prev) => ({
      ...prev,
      [clonedUtility.id]: {
        constant: String(clonedUtility.constant ?? utility.constant ?? 0),
        price: String(clonedUtility.price ?? utility.price ?? 0),
      },
    }));

    return clonedUtility.id;
  };

  const handleSaveUtility = async (utility: UtilityConstant) => {
    if (isRentUtility(utility.utility_name)) {
      toast.info('Rent is derived from the assigned unit price and cannot be saved here');
      return;
    }

    if (selectedPropertyId === 'all') {
      toast.info('Select a specific property workspace to edit billing utilities');
      return;
    }

    const utilityAssignedToProperty = (propertyUtilityMap[selectedPropertyId] || []).includes(utility.id);
    if (!utilityAssignedToProperty) {
      toast.error('This billing utility is outside the selected property workspace.');
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

      const utilityIdToUpdate = await ensurePropertyScopedUtility(utility, selectedPropertyId);

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
        .eq('id', utilityIdToUpdate)
        .select('id, constant, price, updated_at')
        .maybeSingle();

      if (error) throw error;
      if (!updatedRow) {
        throw new Error('No row was updated. Please check database permissions (RLS) for utility constants update.');
      }

      setUtilityConstants((prev) =>
        prev.map((item) =>
          item.id === utilityIdToUpdate
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
        [utilityIdToUpdate]: {
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

    if (selectedPropertyId === 'all') {
      toast.info('All Properties view is analytics-only. Select one property to remove a billing utility.');
      return;
    }

    const selectedPropertyName = propertyOptions.find((p) => p.id === selectedPropertyId)?.name || 'selected property';
    const confirmed = window.confirm(`Remove "${utility.utility_name}" from ${selectedPropertyName}?`);

    if (!confirmed) return;

    try {
      setDeletingUtilityId(utility.id);

      const { error: unassignError } = await supabase
        .from('property_utilities')
        .delete()
        .eq('property_id', selectedPropertyId)
        .eq('utility_constant_id', utility.id);

      if (unassignError) throw unassignError;

      setPropertyUtilityMap((prev) => ({
        ...prev,
        [selectedPropertyId]: (prev[selectedPropertyId] || []).filter((id) => id !== utility.id),
      }));

      toast.success('Billing utility removed from selected property');
    } catch (err: any) {
      console.error('Error deleting utility:', err);
      toast.error(err.message || 'Failed to delete utility');
    } finally {
      setDeletingUtilityId(null);
    }
  };

  const handleIsolateSharedUtilities = async () => {
    if (selectedPropertyId === 'all') {
      toast.info('Select a specific property workspace to isolate recurring utilities.');
      return;
    }

    const selectedUtilityIds = new Set(propertyUtilityMap[selectedPropertyId] || []);
    const sharedUtilities = utilityConstants.filter((utility) => {
      if (!selectedUtilityIds.has(utility.id)) return false;
      const assignmentCount = Object.values(propertyUtilityMap).reduce(
        (sum, utilityIds) => sum + (utilityIds.includes(utility.id) ? 1 : 0),
        0
      );
      return assignmentCount > 1;
    });

    if (sharedUtilities.length === 0) {
      toast.success('This property already has isolated billing utilities.');
      return;
    }

    try {
      setIsolatingUtilities(true);

      for (const utility of sharedUtilities) {
        await ensurePropertyScopedUtility(utility, selectedPropertyId);
      }

      const { data: propertyUtilitiesData, error: propertyUtilitiesError } = await supabase
        .from('property_utilities')
        .select('property_id, utility_constant_id');

      if (propertyUtilitiesError) throw propertyUtilitiesError;

      const utilityMap: Record<string, string[]> = {};
      (propertyUtilitiesData || []).forEach((row: any) => {
        if (!row?.property_id || !row?.utility_constant_id) return;
        if (!utilityMap[row.property_id]) {
          utilityMap[row.property_id] = [];
        }
        utilityMap[row.property_id].push(row.utility_constant_id);
      });
      setPropertyUtilityMap(utilityMap);

      toast.success(`Isolated ${sharedUtilities.length} shared billing utilit${sharedUtilities.length === 1 ? 'y' : 'ies'} for this property.`);
    } catch (err: any) {
      console.error('Error isolating shared utilities:', err);
      toast.error(err.message || 'Failed to isolate shared billing utilities');
    } finally {
      setIsolatingUtilities(false);
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

  const buildInvoiceDraftForDownload = (tenant: TenantWithReadings): InvoiceDraft => {
    const draft = buildInvoiceDraft(tenant);
    if (draft) return draft;

    const nowIso = new Date().toISOString();
    const fallbackReading: UtilityReading = {
      id: '',
      tenant_id: tenant.tenant_id,
      unit_id: tenant.unit_id || '',
      property_id: tenant.property_id || '',
      reading_month: nowIso,
      previous_reading: 0,
      current_reading: 0,
      electricity_usage: 0,
      electricity_bill: 0,
      electricity_rate: 0,
      water_previous_reading: 0,
      water_current_reading: 0,
      water_rate: 0,
      water_bill: 0,
      garbage_fee: 0,
      security_fee: 0,
      service_fee: 0,
      custom_utilities: {},
      other_charges: Number(tenant.utility_total || 0),
      total_bill: Number(tenant.utility_total || 0),
      status: tenant.status,
      tenant_name: tenant.tenant_name,
      tenant_email: tenant.tenant_email,
      tenant_phone: tenant.tenant_phone,
      unit_number: tenant.unit_number,
      property_name: tenant.property_name,
    };

    return {
      tenant,
      reading: fallbackReading,
      rentAmount: Number(tenant.rent_amount || 0),
      electricityBill: 0,
      waterBill: 0,
      garbageFee: 0,
      securityFee: 0,
      serviceFee: 0,
      otherCharges: Number(tenant.utility_total || 0),
      customUtilities: {},
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
      notes: 'Generated without a recorded utility reading. Utility breakdown was unavailable for this billing period.',
    };
  };

  const openInvoiceEditor = (tenant: TenantWithReadings) => {
    if (selectedPropertyId === 'all') {
      toast.info('All Properties workspace is read-only. Select one property to edit monthly invoices.');
      return;
    }

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
    try {
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

      const safeTenantName = String(draft.tenant.tenant_name || 'Tenant').trim() || 'Tenant';
      const fileName = `Invoice_${safeTenantName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('Invoice PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      toast.error('Failed to download invoice PDF');
    }
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

  const isAllPropertiesWorkspace = selectedPropertyId === 'all';

  const selectedPropertyName = isAllPropertiesWorkspace
    ? 'All Properties'
    : (propertyOptions.find((property) => property.id === selectedPropertyId)?.name || 'Selected Property');

  const scopedUtilityConstants = isAllPropertiesWorkspace
    ? []
    : utilityConstants.filter((utility) => (propertyUtilityMap[selectedPropertyId] || []).includes(utility.id));

  const sharedScopedUtilities = isAllPropertiesWorkspace
    ? []
    : scopedUtilityConstants.filter((utility) => {
        const assignmentCount = Object.values(propertyUtilityMap).reduce(
          (sum, utilityIds) => sum + (utilityIds.includes(utility.id) ? 1 : 0),
          0
        );
        return assignmentCount > 1;
      });

  const scopedFirstPaymentCandidates = isAllPropertiesWorkspace
    ? firstPaymentCandidates
    : firstPaymentCandidates.filter((candidate) => candidate.property_id === selectedPropertyId);

  const scopedTransitionCandidates = isAllPropertiesWorkspace
    ? transitionCandidates
    : transitionCandidates.filter((candidate) => candidate.property_id === selectedPropertyId);

  const scopedDepositRefundCases = isAllPropertiesWorkspace
    ? depositRefundCases
    : depositRefundCases.filter((item) => {
      const candidate = transitionCandidates.find((entry) => entry.vacancy_notice_id === item.id);
      return candidate?.property_id === selectedPropertyId;
    });

  const scopedExistingFirstPaymentInvoicesList = isAllPropertiesWorkspace
    ? existingFirstPaymentInvoicesList
    : existingFirstPaymentInvoicesList.filter((invoice: any) => String(invoice?.property_id || '') === String(selectedPropertyId));

  const allPropertiesBreakdown = useMemo(() => {
    return propertyOptions.map((property) => {
      const propertyTenants = tenantsWithReadings.filter((tenant) => tenant.property_id === property.id);
      const tenantCount = propertyTenants.length;
      const paidTenants = propertyTenants.filter((tenant) => tenant.status === 'paid').length;
      const pendingTenants = propertyTenants.filter((tenant) => tenant.status !== 'paid').length;

      const rentTotal = propertyTenants.reduce((sum, tenant) => sum + Number(tenant.rent_amount || 0), 0);
      const utilityTotal = propertyTenants.reduce((sum, tenant) => sum + Number(tenant.utility_total || 0), 0);
      const invoiceTotal = propertyTenants.reduce((sum, tenant) => sum + Number(tenant.total_due || 0), 0);

      const firstPaymentPending = firstPaymentCandidates.filter((item) => item.property_id === property.id).length;
      const transitionPending = transitionCandidates.filter((item) => item.property_id === property.id).length;
      const utilityTypesCount = (propertyUtilityMap[property.id] || []).length;
      const initialChargesCount = (propertyInitialChargesMap[property.id] || []).length;

      return {
        propertyId: property.id,
        propertyName: property.name,
        tenantCount,
        paidTenants,
        pendingTenants,
        rentTotal,
        utilityTotal,
        invoiceTotal,
        firstPaymentPending,
        transitionPending,
        utilityTypesCount,
        initialChargesCount,
      };
    });
  }, [propertyOptions, tenantsWithReadings, firstPaymentCandidates, transitionCandidates, propertyUtilityMap, propertyInitialChargesMap]);

  const allPropertiesSummary = useMemo(() => {
    return allPropertiesBreakdown.reduce(
      (acc, item) => {
        acc.properties += 1;
        acc.tenants += item.tenantCount;
        acc.paid += item.paidTenants;
        acc.pending += item.pendingTenants;
        acc.rent += item.rentTotal;
        acc.utilities += item.utilityTotal;
        acc.total += item.invoiceTotal;
        acc.firstPayments += item.firstPaymentPending;
        acc.transitions += item.transitionPending;
        return acc;
      },
      {
        properties: 0,
        tenants: 0,
        paid: 0,
        pending: 0,
        rent: 0,
        utilities: 0,
        total: 0,
        firstPayments: 0,
        transitions: 0,
      }
    );
  }, [allPropertiesBreakdown]);

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
        <div className="mt-3 inline-flex items-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          Property-isolated recurring billing mode is active
        </div>
      </div>

      {/* Property Switcher */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Home className="w-5 h-5 text-[#154279]" />
              Property Billing Workspace
            </CardTitle>
            <CardDescription>
              Select a property to manage billing and utilities independently. Current scope: {selectedPropertyName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedPropertyId('all');
                  setFilterProperty('all');
                }}
                className={`text-left rounded-xl border px-4 py-3 transition ${
                  selectedPropertyId === 'all'
                    ? 'border-[#154279] bg-[#154279] text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-[#154279]/50 hover:bg-slate-50'
                }`}
              >
                <p className="text-xs uppercase tracking-wider opacity-80">Workspace</p>
                <p className="font-bold">All Properties</p>
              </button>

              {propertyOptions.map((property) => (
                <button
                  key={property.id}
                  type="button"
                  onClick={() => {
                    setSelectedPropertyId(property.id);
                    setFilterProperty(property.id);
                    setNewUtilityPropertyId(property.id);
                  }}
                  className={`text-left rounded-xl border px-4 py-3 transition ${
                    selectedPropertyId === property.id
                      ? 'border-[#154279] bg-[#154279] text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-[#154279]/50 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs uppercase tracking-wider opacity-80">Property</p>
                  <p className="font-bold truncate">{property.name}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {selectedPropertyId === 'all' && (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <DollarSign className="w-5 h-5 text-[#154279]" />
                All Properties Billing Breakdown
              </CardTitle>
              <CardDescription>
                Detailed combined billing view across every property. Select any property card above for independent editing and management.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Properties</p>
                  <p className="text-2xl font-black text-slate-900">{allPropertiesSummary.properties}</p>
                  <p className="text-xs text-slate-500 mt-1">Active property workspaces</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Tenants</p>
                  <p className="text-2xl font-black text-slate-900">{allPropertiesSummary.tenants}</p>
                  <p className="text-xs text-slate-500 mt-1">Paid: {allPropertiesSummary.paid} | Pending: {allPropertiesSummary.pending}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Total Rent</p>
                  <p className="text-2xl font-black text-slate-900">{formatKES(allPropertiesSummary.rent)}</p>
                  <p className="text-xs text-slate-500 mt-1">Base rent across all units</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Total Bill Names</p>
                  <p className="text-2xl font-black text-slate-900">{formatKES(allPropertiesSummary.utilities)}</p>
                  <p className="text-xs text-slate-500 mt-1">Utilities + service charges</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
                <table className="w-full text-sm min-w-[1050px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left py-3 px-3 font-semibold text-slate-700">Property</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-700">Tenants</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-700">Paid/Pending</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-700">Rent Total</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-700">Utilities Total</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-700">Invoice Total</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-700">1st Payment Queue</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-700">Transition Queue</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-700">Billing Types</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-700">Initial Charges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPropertiesBreakdown.map((item) => (
                      <tr key={item.propertyId} className="border-b border-slate-100 hover:bg-slate-50/70">
                        <td className="py-3 px-3 font-semibold text-slate-900">{item.propertyName}</td>
                        <td className="py-3 px-3 text-center text-slate-700">{item.tenantCount}</td>
                        <td className="py-3 px-3 text-center text-slate-700">{item.paidTenants} / {item.pendingTenants}</td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-900">{formatKES(item.rentTotal)}</td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-900">{formatKES(item.utilityTotal)}</td>
                        <td className="py-3 px-3 text-right font-bold text-[#154279]">{formatKES(item.invoiceTotal)}</td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant={item.firstPaymentPending > 0 ? 'outline' : 'secondary'}>{item.firstPaymentPending}</Badge>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant={item.transitionPending > 0 ? 'outline' : 'secondary'}>{item.transitionPending}</Badge>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-700">{item.utilityTypesCount}</td>
                        <td className="py-3 px-3 text-center text-slate-700">{item.initialChargesCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 font-medium">
                Grand Invoice Total Across All Properties: {formatKES(allPropertiesSummary.total)}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 font-medium">
                Management sections are hidden in All Properties workspace. Select one property workspace above to manage billing constants, invoice configuration, and invoice actions.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}



      {!isAllPropertiesWorkspace && (
      <>
      {/* Utility Constants Management Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Manage Billing Constants
            </CardTitle>
            <CardDescription>
              {selectedPropertyId === 'all'
                ? 'All Properties is a reporting scope only. Select one property card to create or edit bill names and rates independently.'
                : `Configure bill names and rates for ${selectedPropertyName}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedPropertyId === 'all' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Property isolation enabled</AlertTitle>
                <AlertDescription>
                  Select a specific property above to edit recurring billing utilities. This all-properties view is strictly for breakdown visibility.
                </AlertDescription>
              </Alert>
            )}

            {selectedPropertyId !== 'all' && sharedScopedUtilities.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{sharedScopedUtilities.length} shared billing utilit{sharedScopedUtilities.length === 1 ? 'y is' : 'ies are'} linked to other properties</AlertTitle>
                <AlertDescription>
                  This can mix recurring rates between properties. Isolate them so this property keeps fully independent billing values.
                </AlertDescription>
                <div className="mt-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleIsolateSharedUtilities}
                    disabled={isolatingUtilities}
                    className="bg-[#154279] text-white hover:bg-[#0f325e]"
                  >
                    {isolatingUtilities ? 'Isolating...' : 'Isolate Shared Utilities'}
                  </Button>
                </div>
              </Alert>
            )}

            {scopedUtilityConstants.length > 0 ? (
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
                    {scopedUtilityConstants.map(constant => (
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
              <p className="text-slate-600">
                {selectedPropertyId === 'all'
                  ? 'Select a property workspace to manage recurring billing constants.'
                  : 'No bill name constants found for this property scope.'}
              </p>
            )}

            {/* Add Custom Bill */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Add Custom Bill</h3>
                <Button
                  onClick={() => setShowAddUtility(!showAddUtility)}
                  size="sm"
                  disabled={selectedPropertyId === 'all'}
                  className="gap-2"
                >
                  <Plus size={16} />
                  {showAddUtility ? 'Cancel' : 'Add Custom Bill'}
                </Button>
              </div>

              {selectedPropertyId === 'all' && (
                <p className="text-xs text-slate-500 mb-3">
                  Choose one property card above to add recurring billing utilities without affecting other properties.
                </p>
              )}

              {showAddUtility && selectedPropertyId !== 'all' && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                  <div>
                    <Label htmlFor="utility_property">Property</Label>
                    <select
                      id="utility_property"
                      value={newUtilityPropertyId}
                      onChange={(e) => setNewUtilityPropertyId(e.target.value)}
                      disabled={selectedPropertyId !== 'all'}
                      className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">Select property</option>
                      {propertyOptions.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                    {selectedPropertyId !== 'all' && (
                      <p className="text-xs text-slate-500 mt-2">Property is locked to the selected workspace card.</p>
                    )}
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

      {/* PROPERTY-SPECIFIC INITIAL INVOICE CONFIGURATION */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30 }}>
        <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Settings className="w-5 h-5" />
              Property-Specific Initial Invoice Configuration
            </CardTitle>
            <CardDescription>
              Configure first-time tenant invoice deposits and charges per property
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAllPropertiesWorkspace && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>All Properties mode is read-only</AlertTitle>
                <AlertDescription>
                  This section shows cross-property configuration context only. Select one property workspace above to edit and save initial invoice configuration.
                </AlertDescription>
              </Alert>
            )}

            {/* Property Selector */}
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <Label className="text-base font-semibold text-purple-900 mb-2 block">
                Select Property
              </Label>
              {selectedPropertyId !== 'all' ? (
                <>
                  <Input
                    readOnly
                    value={propertyOptions.find((prop) => prop.id === selectedPropertyId)?.name || 'Selected Property'}
                    className="w-full h-11 border border-purple-300 rounded-md px-3 bg-purple-50 text-slate-900 font-semibold"
                  />
                  <p className="text-xs text-purple-700 mt-2">Property is locked to the selection from the workspace cards above.</p>
                </>
              ) : (
                <select
                  value={selectedPropertyForInitialConfig}
                  onChange={(e) => setSelectedPropertyForInitialConfig(e.target.value)}
                  className="w-full h-11 border border-purple-300 rounded-md px-3 bg-white text-slate-900 font-semibold"
                >
                  <option value="">Choose a property...</option>
                  {propertyOptions.map(prop => (
                    <option key={prop.id} value={prop.id}>
                      {prop.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedPropertyForInitialConfig && (
              <>
                <div className={isAllPropertiesWorkspace ? 'opacity-70 pointer-events-none select-none' : ''}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Security Deposit Months */}
                  <div>
                    <Label className="text-base font-semibold text-purple-900 mb-3 block">
                      Security Deposit (Months of Rent)
                    </Label>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={tempDepositMonths}
                          onChange={(e) => setTempDepositMonths(normalizeSecurityDepositMonths(e.target.value))}
                          className="w-full h-10 border border-purple-300 rounded-md px-3 bg-white text-slate-900 font-semibold"
                        />
                      </div>
                      <span className="text-sm text-purple-700 font-semibold">For this property</span>
                    </div>
                  </div>

                  {/* Right: Additional Charges Header */}
                  <div>
                    <Label className="text-base font-semibold text-purple-900 mb-3 block">
                      Additional Charges
                    </Label>
                    <p className="text-xs text-purple-700">Add deposits, fees, and other charges</p>
                  </div>
                </div>

                {/* Additional Charges List */}
                {tempAdditionalCharges.length > 0 && (
                  <div className="border-t border-purple-200 pt-4">
                    <p className="text-sm font-semibold text-slate-900 mb-3">Current Charges:</p>
                    <div className="space-y-2">
                      {tempAdditionalCharges.map((charge, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border border-purple-200">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{charge.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{charge.type}</p>
                          </div>
                          <p className="font-bold text-purple-700">{formatKES(charge.amount)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTempAdditionalCharges(tempAdditionalCharges.filter((_, i) => i !== idx))}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Charge */}
                <div className="border-t border-purple-200 pt-4">
                  <p className="text-sm font-semibold text-slate-900 mb-3">Add New Charge:</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input
                      type="text"
                      value={newChargeNameStandard}
                      onChange={(e) => setNewChargeNameStandard(e.target.value)}
                      placeholder="e.g., Water Deposit"
                      className="h-10"
                    />
                    <select
                      value={newChargeTypeStandard}
                      onChange={(e) => setNewChargeTypeStandard(e.target.value as 'deposit' | 'fee')}
                      className="h-10 border border-slate-300 rounded-md px-2 bg-white"
                    >
                      <option value="deposit">Deposit</option>
                      <option value="fee">Fee</option>
                    </select>
                    <Input
                      type="number"
                      value={newChargeAmountStandard}
                      onChange={(e) => setNewChargeAmountStandard(e.target.value)}
                      placeholder="Amount"
                      className="h-10"
                    />
                    <Button
                      onClick={() => {
                        if (newChargeNameStandard && newChargeAmountStandard) {
                          setTempAdditionalCharges([...tempAdditionalCharges, {
                            name: newChargeNameStandard,
                            type: newChargeTypeStandard,
                            amount: Number(newChargeAmountStandard)
                          }]);
                          setNewChargeNameStandard('');
                          setNewChargeAmountStandard('');
                          setNewChargeTypeStandard('deposit');
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={async () => {
                      try {
                        setSavingFirstPaymentDefaults(true);
                        const effectivePropertyId = selectedPropertyId !== 'all'
                          ? selectedPropertyId
                          : selectedPropertyForInitialConfig;

                        if (!effectivePropertyId) {
                          throw new Error('Please select a property before saving.');
                        }

                        const normalizedCharges: InitialChargeLineItem[] = (tempAdditionalCharges || [])
                          .map((charge, idx) => ({
                            id: `${effectivePropertyId}-${idx}-${Date.now()}`,
                            name: String(charge.name || '').trim(),
                            charge_type: charge.type === 'fee' ? 'fee' : 'deposit',
                            amount: Number(charge.amount || 0),
                          }))
                          .filter((charge) => charge.name && charge.amount >= 0);

                        await persistFirstPaymentDefaultsForProperty(
                          effectivePropertyId,
                          normalizedCharges,
                          tempDepositMonths
                        );

                        setSelectedPropertyForInitialConfig(effectivePropertyId);
                        setTempAdditionalCharges(
                          normalizedCharges.map((charge) => ({
                            name: charge.name,
                            type: charge.charge_type,
                            amount: Number(charge.amount || 0),
                          }))
                        );
                        setTempDepositMonths(normalizeSecurityDepositMonths(tempDepositMonths));
                        
                        toast.success('Property configuration saved successfully');
                      } catch (err: any) {
                        console.error('Error saving property configuration:', err);
                        toast.error('Failed to save configuration');
                      } finally {
                        setSavingFirstPaymentDefaults(false);
                      }
                    }}
                    disabled={savingFirstPaymentDefaults}
                    className="bg-purple-600 hover:bg-purple-700 gap-2"
                  >
                    {savingFirstPaymentDefaults ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Save Configuration for This Property
                      </>
                    )}
                  </Button>
                </div>

                {/* Current Status */}
                <div className="bg-purple-100 border border-purple-300 rounded p-3">
                  <p className="text-sm text-purple-900">
                    ✓ Configuration: <span className="font-semibold">{tempDepositMonths} month(s) deposit</span> + {tempAdditionalCharges.length} additional charge(s)
                  </p>
                </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Existing First-Time Move-In Invoices */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Edit3 className="w-5 h-5" />
              Existing First-Time Invoices (View / Edit)
            </CardTitle>
            <CardDescription>
              View and edit line items on unpaid initial invoices. Changes save immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAllPropertiesWorkspace && (
              <p className="text-xs text-blue-800 mb-3 font-medium">
                All Properties mode is read-only. Select one property workspace to edit an invoice.
              </p>
            )}
            {loadingExistingInvoicesList ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : scopedExistingFirstPaymentInvoicesList.length === 0 ? (
              <p className="text-sm text-blue-700">No existing unpaid first-time invoices found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-blue-300 bg-blue-100">
                      <th className="text-left py-2 px-3 font-semibold text-blue-900">Tenant</th>
                      <th className="text-left py-2 px-3 font-semibold text-blue-900">Property / Unit</th>
                      <th className="text-left py-2 px-3 font-semibold text-blue-900">Invoice</th>
                      <th className="text-right py-2 px-3 font-semibold text-blue-900">Amount (KES)</th>
                      <th className="text-left py-2 px-3 font-semibold text-blue-900">Due Date</th>
                      <th className="text-center py-2 px-3 font-semibold text-blue-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedExistingFirstPaymentInvoicesList.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-blue-200 hover:bg-blue-100 transition">
                        <td className="py-2 px-3">
                          <p className="font-semibold text-slate-900">{invoice.tenant_name}</p>
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {invoice.property_name && invoice.unit_number ? `${invoice.property_name} - ${invoice.unit_number}` : 'N/A'}
                        </td>
                        <td className="py-2 px-3 text-slate-600 font-mono text-xs">
                          {invoice.reference_number}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-900">
                          {Number(invoice.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedExistingInvoiceForEdit(invoice)}
                            disabled={isAllPropertiesWorkspace}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Edit3 size={14} className="mr-1" />
                            {isAllPropertiesWorkspace ? 'Select Property' : 'Edit'}
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

      {/* Existing Invoice Edit Modal */}
      {selectedExistingInvoiceForEdit && !isAllPropertiesWorkspace && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle>Edit First-Time Invoice</CardTitle>
                <CardDescription>
                  {selectedExistingInvoiceForEdit.reference_number} - {selectedExistingInvoiceForEdit.tenant_name}
                </CardDescription>
              </div>
              <button onClick={() => setSelectedExistingInvoiceForEdit(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50 rounded border border-blue-200">
                <div>
                  <p className="text-xs text-blue-600 font-semibold">Total Amount</p>
                  <p className="font-bold text-lg text-blue-900">{formatKES(selectedExistingInvoiceForEdit.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-semibold">Due Date</p>
                  <p className="font-semibold text-slate-900">{new Date(selectedExistingInvoiceForEdit.due_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-semibold">Status</p>
                  <Badge className="capitalize">{selectedExistingInvoiceForEdit.status}</Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-slate-900 mb-3">Line Items</h3>
                <div className="space-y-3">
                  {/* Rent and Deposit */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                    <div>
                      <p className="text-xs text-slate-600">Monthly Rent</p>
                      <p className="font-semibold text-slate-900">{formatKES(selectedExistingInvoiceForEdit.items?.monthly_rent || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Security Deposit</p>
                      <p className="font-semibold text-slate-900">{formatKES(selectedExistingInvoiceForEdit.items?.security_deposit || 0)}</p>
                    </div>
                  </div>

                  {/* Additional Charges */}
                  {(selectedExistingInvoiceForEdit.items?.initial_charges || []).length > 0 ? (
                    <div className="space-y-2 p-3 bg-slate-50 rounded border border-slate-200">
                      <p className="text-sm font-semibold text-slate-900">Additional Charges (Editable)</p>
                      {(selectedExistingInvoiceForEdit.items.initial_charges || []).map((item: any, idx: number) => (
                        <div key={`edit-line-${idx}`} className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200">
                          <Input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const updated = { ...selectedExistingInvoiceForEdit };
                              updated.items.initial_charges[idx].name = e.target.value;
                              setSelectedExistingInvoiceForEdit(updated);
                            }}
                            placeholder="Charge name"
                            className="flex-1 h-8 text-sm"
                          />
                          <select
                            value={item.charge_type}
                            onChange={(e) => {
                              const updated = { ...selectedExistingInvoiceForEdit };
                              updated.items.initial_charges[idx].charge_type = e.target.value;
                              setSelectedExistingInvoiceForEdit(updated);
                            }}
                            className="h-8 border border-slate-300 rounded px-2 bg-white text-sm"
                          >
                            <option value="deposit">Deposit</option>
                            <option value="fee">Fee</option>
                          </select>
                          <Input
                            type="number"
                            value={item.amount}
                            onChange={(e) => {
                              const updated = { ...selectedExistingInvoiceForEdit };
                              updated.items.initial_charges[idx].amount = Number(e.target.value);
                              setSelectedExistingInvoiceForEdit(updated);
                            }}
                            placeholder="Amount"
                            className="w-24 h-8 text-sm"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteLineItemFromInvoice(selectedExistingInvoiceForEdit.id, idx)}
                          >
                            Delete
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 p-3 bg-slate-50 rounded border border-slate-200">No additional charges on this invoice</p>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="gap-3 border-t">
              <Button variant="outline" onClick={() => setSelectedExistingInvoiceForEdit(null)}>
                Close
              </Button>
              <Button onClick={() => {
                setSelectedExistingInvoiceForEdit(null);
                loadExistingFirstPaymentInvoicesList();
              }} className="bg-blue-600 hover:bg-blue-700">
                <Check size={16} className="mr-1" />
                Done
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}

      {/* First-Time Move-In Payments */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              First-Time Move-In Payments
            </CardTitle>
            <CardDescription>
              First-time invoices are auto-generated after manager approval and sent to tenant dashboards. Use this section to view or update invoice details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAllPropertiesWorkspace && (
              <p className="text-xs text-slate-600 mb-3 font-medium">
                Breakdown mode only. Select one property workspace to open and edit invoice details.
              </p>
            )}
            {scopedFirstPaymentCandidates.length === 0 ? (
              <p className="text-sm text-slate-600">No newly assigned tenants with pending first-time payment invoices.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Tenant</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Property / Unit</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Assigned</th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-700">Rent (KES)</th>
                      <th className="text-center py-2 px-3 font-semibold text-slate-700">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedFirstPaymentCandidates.map((candidate) => (
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
                          <Button size="sm" onClick={() => openAutoGeneratedFirstPaymentInvoice(candidate)} disabled={isAllPropertiesWorkspace} className="bg-blue-600 hover:bg-blue-700">
                            <Edit3 size={14} className="mr-1" />
                            {isAllPropertiesWorkspace ? 'Select Property' : 'View / Edit Invoice'}
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
            {isAllPropertiesWorkspace && (
              <p className="text-xs text-slate-600 mb-3 font-medium">
                Breakdown mode only. Select one property workspace to generate transition invoices.
              </p>
            )}
            {scopedTransitionCandidates.length === 0 ? (
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
                    {scopedTransitionCandidates.map((candidate) => (
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
                          <Button size="sm" onClick={() => openTransitionInvoice(candidate)} disabled={isAllPropertiesWorkspace} className="bg-amber-600 hover:bg-amber-700">
                            {isAllPropertiesWorkspace ? 'Select Property' : 'Generate Transition Invoice'}
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
            {isAllPropertiesWorkspace && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Read-only cross-property view</AlertTitle>
                <AlertDescription>
                  You can review totals and statuses here. Select a single property workspace to edit invoices, send invoices, or modify tenant billing details.
                </AlertDescription>
              </Alert>
            )}

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
                  onChange={e => {
                    const nextPropertyId = e.target.value;
                    setFilterProperty(nextPropertyId);
                    setSelectedPropertyId(nextPropertyId);
                    if (nextPropertyId !== 'all') {
                      setNewUtilityPropertyId(nextPropertyId);
                    }
                  }}
                  disabled={selectedPropertyId !== 'all'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">All Properties</option>
                  {propertyOptions.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                {selectedPropertyId !== 'all' && (
                  <p className="text-xs text-slate-500 mt-2">Property is controlled by the workspace card selector above.</p>
                )}
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
                              disabled={isAllPropertiesWorkspace}
                              className="p-2 hover:bg-blue-50 rounded text-blue-600 transition"
                              title="Edit Invoice"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                const hasReading = Boolean(tenant.latest_reading);
                                const draft = buildInvoiceDraftForDownload(tenant);
                                if (!hasReading) {
                                  toast.warning('No utility reading found. Downloading invoice with rent and total utility amount only.');
                                }
                                downloadInvoicePdf(draft);
                              }}
                              disabled={isAllPropertiesWorkspace}
                              className="inline-flex items-center gap-1 px-2 py-1 hover:bg-green-50 rounded text-green-700 transition text-xs font-semibold"
                              title="Download Invoice"
                            >
                              <FileDown size={16} />
                              Invoice
                            </button>
                            <button
                              onClick={() => downloadReceiptPdf(tenant)}
                              disabled={isAllPropertiesWorkspace}
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
          cases={scopedDepositRefundCases}
          title="Deposit Refund Sheet"
          description="Generated from vacancy notices. Automatically includes manager checklist damages, with manual item deductions calculated as (unit cost x quantity) + labour cost."
        />
      </motion.div>
      </>
      )}

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

            {specialInvoiceDraft.eventType === 'first_payment' && (
              <div className="border-b bg-blue-50 p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const candidate = firstPaymentCandidates.find(c => c.tenant_id === specialInvoiceDraft.tenant_id);
                    if (candidate) loadExistingFirstPaymentInvoice(candidate);
                  }}
                  disabled={loadingExistingInvoice}
                  className="gap-2"
                >
                  {loadingExistingInvoice ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                  {existingFirstPaymentInvoice ? 'Viewing Existing Invoice' : 'View Existing Invoice'}
                </Button>
                {existingFirstPaymentInvoice && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExistingFirstPaymentInvoice(null)}
                    className="ml-2"
                  >
                    Close Invoice View
                  </Button>
                )}
              </div>
            )}

            {existingFirstPaymentInvoice && specialInvoiceDraft.eventType === 'first_payment' && (
              <div className="border-b bg-slate-50 p-4 space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">Current Invoice Line Items</h3>
                  <p className="text-xs text-slate-500 mb-3">Invoice: {existingFirstPaymentInvoice.reference_number}</p>
                  
                  <div className="space-y-3">
                    {/* Rent and Deposit Summary */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded border border-slate-200">
                      <div>
                        <p className="text-xs text-slate-500">Monthly Rent</p>
                        <p className="font-semibold text-slate-900">{formatKES(existingFirstPaymentInvoice.items?.monthly_rent || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Security Deposit</p>
                        <p className="font-semibold text-slate-900">{formatKES(existingFirstPaymentInvoice.items?.security_deposit || 0)}</p>
                      </div>
                    </div>

                    {/* Initial Charges (Editable) */}
                    {(existingFirstPaymentInvoice.items?.initial_charges || []).length > 0 ? (
                      <div className="space-y-2 p-3 bg-white rounded border border-slate-200">
                        <p className="text-sm font-semibold text-slate-900">Additional Charges</p>
                        {(existingFirstPaymentInvoice.items.initial_charges || []).map((item: any, idx: number) => (
                          <div key={`existing-line-${idx}`} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                            <Input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateLineItemInInvoice(existingFirstPaymentInvoice.id, idx, 'name', e.target.value)}
                              placeholder="Charge name"
                              className="flex-1 h-8 text-sm"
                            />
                            <select
                              value={item.charge_type}
                              onChange={(e) => updateLineItemInInvoice(existingFirstPaymentInvoice.id, idx, 'charge_type', e.target.value)}
                              className="h-8 border border-slate-300 rounded px-2 bg-white text-sm"
                            >
                              <option value="deposit">Deposit</option>
                              <option value="fee">Fee</option>
                            </select>
                            <Input
                              type="number"
                              value={item.amount}
                              onChange={(e) => updateLineItemInInvoice(existingFirstPaymentInvoice.id, idx, 'amount', e.target.value)}
                              placeholder="Amount"
                              className="w-24 h-8 text-sm"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteLineItemFromInvoice(existingFirstPaymentInvoice.id, idx)}
                            >
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 p-3 bg-white rounded border border-slate-200">No additional charges on this invoice</p>
                    )}

                    {/* Total */}
                    <div className="p-3 bg-blue-50 rounded border border-blue-200 font-bold text-slate-900">
                      Total Invoice: {formatKES(existingFirstPaymentInvoice.amount)}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>First Month Rent</Label>
                      <Input type="number" value={specialInvoiceDraft.baseRent} onChange={(e) => handleSpecialInvoiceDraftChange('baseRent', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Security Deposit Months</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={specialInvoiceDraft.securityDepositMonths}
                        onChange={(e) => handleSecurityDepositMonthsChange(e.target.value)}
                        className="mt-1 h-10 w-full border border-slate-300 rounded-md px-2 bg-white"
                      />
                    </div>
                    <div>
                      <Label>Security Deposit (Auto)</Label>
                      <Input type="number" value={specialInvoiceDraft.securityDeposit} readOnly disabled className="mt-1 bg-slate-100" />
                      <p className="text-[11px] text-slate-500 mt-1">Calculated as first month rent x selected months.</p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Property Initial Charges (Deposits / Fees)</Label>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">Saved to this property and reused for future first-time tenants</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSaveFirstPaymentDefaults}
                          disabled={savingFirstPaymentDefaults}
                        >
                          {savingFirstPaymentDefaults ? (
                            <>
                              <Loader2 size={14} className="animate-spin mr-1" />
                              Saving...
                            </>
                          ) : (
                            'Save Defaults'
                          )}
                        </Button>
                      </div>
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
