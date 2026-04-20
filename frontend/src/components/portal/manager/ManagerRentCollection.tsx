import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Download, FileText, Loader2, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatCurrency';

type BillCategoryKey =
  | 'lease_charge'
  | 'lease_deposit'
  | 'water'
  | 'other_bill'
  | 'paint'
  | 'rent_adjustment'
  | 'advance'
  | 'penalty';

type CategoryFilterMode = 'all' | 'with' | 'without';

interface LedgerRow {
  unit_id: string;
  property_id: string;
  unit_number: string;
  floor_number?: number | string | null;
  unit_type: string;
  unit_label: string;

  monthly_rent: number;
  tenant_name: string;
  tenant_phone: string;
  tenant_profile_id?: string;

  lease_charge: number;
  lease_deposit: number;
  water_charge: number;
  water_paid: number;
  other_bill: number;
  paint: number;
  rent_due: number;
  rent_top_up: number;
  rent_paid: number;
  rent_balance: number;
  advance: number;
  total_per_unit: number;
  arrears_per_unit: number;
  payment_date: string;
  penalty: number;
  remarks: string;

  rent_payment_id?: string;
  bill_record_ids: Partial<Record<BillCategoryKey, string>>;
}

interface CategoryFilterState {
  lease_charge: CategoryFilterMode;
  lease_deposit: CategoryFilterMode;
  water_charge: CategoryFilterMode;
  water_paid: CategoryFilterMode;
  other_bill: CategoryFilterMode;
  paint: CategoryFilterMode;
  rent_due: CategoryFilterMode;
  rent_paid: CategoryFilterMode;
  rent_balance: CategoryFilterMode;
  advance: CategoryFilterMode;
  total_per_unit: CategoryFilterMode;
  arrears_per_unit: CategoryFilterMode;
  penalty: CategoryFilterMode;
}

const ZERO_CATEGORY_FILTERS: CategoryFilterState = {
  lease_charge: 'all',
  lease_deposit: 'all',
  water_charge: 'all',
  water_paid: 'all',
  other_bill: 'all',
  paint: 'all',
  rent_due: 'all',
  rent_paid: 'all',
  rent_balance: 'all',
  advance: 'all',
  total_per_unit: 'all',
  arrears_per_unit: 'all',
  penalty: 'all',
};

const BILL_CATEGORY_META: Array<{ key: keyof CategoryFilterState; label: string }> = [
  { key: 'lease_charge', label: 'Lease Charge' },
  { key: 'lease_deposit', label: 'Lease Deposit' },
  { key: 'water_charge', label: 'Water' },
  { key: 'water_paid', label: 'Paid Water' },
  { key: 'other_bill', label: 'Bill' },
  { key: 'paint', label: 'Paint' },
  { key: 'rent_due', label: 'Rent Due' },
  { key: 'rent_paid', label: 'Paid Rent' },
  { key: 'rent_balance', label: 'Rent Balance' },
  { key: 'advance', label: 'Advance' },
  { key: 'total_per_unit', label: 'Per Unit' },
  { key: 'arrears_per_unit', label: 'Arrears Per Unit' },
  { key: 'penalty', label: 'Penalty' },
];

const BILL_KEY_TO_TYPE: Record<BillCategoryKey, string> = {
  lease_charge: 'lease_charge',
  lease_deposit: 'lease_deposit',
  water: 'water',
  other_bill: 'other_bill',
  paint: 'paint',
  rent_adjustment: 'rent_adjustment',
  advance: 'advance',
  penalty: 'penalty',
};

const ManagerRentCollection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [propertyId, setPropertyId] = useState<string>('');
  const [propertyName, setPropertyName] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [unitTypeFilter, setUnitTypeFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [remarkFilter, setRemarkFilter] = useState('');
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilterState>(ZERO_CATEGORY_FILTERS);
  const [savingCell, setSavingCell] = useState<string>('');

  const selectedMonthDate = useMemo(() => {
    const date = new Date(`${selectedMonth}-01T00:00:00`);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }, [selectedMonth]);

  const monthStart = useMemo(() => toDateOnlyIso(selectedMonthDate), [selectedMonthDate]);
  const monthEnd = useMemo(() => {
    const next = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + 1, 1);
    return toDateOnlyIso(new Date(next.getTime() - 86400000));
  }, [selectedMonthDate]);

  const getFloorSortValue = (floor: number | string | null | undefined) => {
    if (floor === null || floor === undefined || floor === '') return 0;
    const normalized = String(floor).trim().toUpperCase();
    const floorOrder: Record<string, number> = {
      B5: -5,
      B4: -4,
      B3: -3,
      B2: -2,
      B1: -1,
      B: -1,
      G: 0,
      M: 0.5,
    };

    if (Object.prototype.hasOwnProperty.call(floorOrder, normalized)) {
      return floorOrder[normalized];
    }

    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const sortRowsLikeUnitManagement = (items: LedgerRow[]) => {
    return [...items].sort((a, b) => {
      const floorDiff = getFloorSortValue(a.floor_number) - getFloorSortValue(b.floor_number);
      if (floorDiff !== 0) return floorDiff;
      return String(a.unit_number).localeCompare(String(b.unit_number), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
  };

  useEffect(() => {
    void loadBillingData();
  }, [user?.id, selectedMonth]);

  useEffect(() => {
    if (!propertyId) return;

    const channel = supabase
      .channel('billing_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rent_payments',
          filter: `property_id=eq.${propertyId}`,
        },
        () => {
          void loadBillingData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills_and_utilities',
          filter: `property_id=eq.${propertyId}`,
        },
        () => {
          void loadBillingData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId]);

  const loadBillingData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data: assignments, error: assignError } = await supabase
        .from('property_manager_assignments')
        .select('property_id, properties(name)')
        .eq('property_manager_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (assignError || !assignments) {
        setRows([]);
        setPropertyId('');
        setPropertyName('');
        setLoading(false);
        return;
      }

      const currentPropertyId = assignments.property_id;
      setPropertyId(currentPropertyId);
      setPropertyName((assignments as any).properties?.name || 'Managed Property');

      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select(`
          id, unit_number, floor_number, status, property_id, unit_type_id, price,
          leases:tenant_leases (tenant_id, rent_amount, status)
        `)
        .eq('property_id', currentPropertyId)
        .order('unit_number');

      if (unitsError) {
        console.error('Units fetch error:', unitsError);
      }

      const safeUnits = units || [];

      const { data: propertyUnitTypes, error: unitTypesError } = await supabase
        .from('property_unit_types')
        .select('id, name, unit_type_name, price_per_unit')
        .eq('property_id', currentPropertyId);

      if (unitTypesError) {
        console.error('Property unit types fetch error:', unitTypesError);
      }

      const unitTypeById = new Map(
        (propertyUnitTypes || []).map((unitType: any) => [unitType.id, unitType])
      );

      const { data: rentPayments, error: rentError } = await supabase
        .from('rent_payments')
        .select('*')
        .eq('property_id', currentPropertyId);

      if (rentError) {
        console.error('Rent fetch error:', rentError);
      }

      const { data: bills, error: billsError } = await supabase
        .from('bills_and_utilities')
        .select('*')
        .eq('property_id', currentPropertyId);

      if (billsError) {
        console.error('Bills fetch error:', billsError);
      }

      const tenantProfileIds = safeUnits
        .flatMap((unit: any) => (Array.isArray(unit.leases) ? unit.leases : []))
        .map((lease: any) => lease?.tenant_id)
        .filter(Boolean);

      const uniqueTenantIds = Array.from(new Set(tenantProfileIds));
      let profileById = new Map<string, any>();

      if (uniqueTenantIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, full_name, phone, phone_number, contact_number')
          .in('id', uniqueTenantIds as string[]);

        if (profilesError) {
          console.error('Profiles fetch error:', profilesError);
        } else {
          profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
        }
      }

      const rentInMonth = (rentPayments || []).filter((payment: any) =>
        isInSelectedMonth(payment?.due_date || payment?.created_at, selectedMonthDate)
      );
      const billsInMonth = (bills || []).filter((bill: any) =>
        isInSelectedMonth(bill?.bill_period_start || bill?.due_date || bill?.created_at, selectedMonthDate)
      );

      const processedRows: LedgerRow[] = safeUnits.map((unit: any) => {
        const leasesList = Array.isArray(unit.leases) ? unit.leases : [];
        const activeLease =
          leasesList.find((lease: any) => String(lease?.status || '').toLowerCase() === 'active') ||
          leasesList.find((lease: any) => String(lease?.status || '').toLowerCase() === 'pending') ||
          leasesList[0];

        const tenantProfile = activeLease?.tenant_id ? profileById.get(activeLease.tenant_id) : null;

        const tenantName = tenantProfile
          ? `${tenantProfile.first_name || ''} ${tenantProfile.last_name || ''}`.trim() ||
            String(tenantProfile.full_name || '').trim() ||
            'Unspecified Tenant'
          : 'Vacant';

        const tenantPhone = tenantProfile
          ? String(
              tenantProfile.phone ||
                tenantProfile.phone_number ||
                tenantProfile.contact_number ||
                ''
            ).trim()
          : '';

        const unitTypeMeta = unitTypeById.get(unit.unit_type_id);
        const unitType = unitTypeMeta?.name || unitTypeMeta?.unit_type_name || 'Standard';
        const monthlyRent = Number(unit.price ?? unitTypeMeta?.price_per_unit ?? 0);

        const rentRecords = rentInMonth
          .filter((record: any) => record.unit_id === unit.id)
          .sort((a: any, b: any) => {
            const aDate = new Date(a?.updated_at || a?.created_at || 0).getTime();
            const bDate = new Date(b?.updated_at || b?.created_at || 0).getTime();
            return bDate - aDate;
          });

        const rentRecord = rentRecords[0];
        const rentDueFromRecords = rentRecords.reduce(
          (sum: number, record: any) => sum + Number(record?.amount || 0),
          0
        );
        const paidRentFromRecords = rentRecords.reduce(
          (sum: number, record: any) => sum + Number(record?.amount_paid || 0),
          0
        );

        const unitBills = billsInMonth.filter((bill: any) => bill.unit_id === unit.id);

        const byCategory: Record<BillCategoryKey, any[]> = {
          lease_charge: [],
          lease_deposit: [],
          water: [],
          other_bill: [],
          paint: [],
          rent_adjustment: [],
          advance: [],
          penalty: [],
        };

        unitBills.forEach((bill: any) => {
          byCategory[normalizeBillType(String(bill?.bill_type || 'other_bill'))].push(bill);
        });

        const sumBillAmount = (entries: any[]) =>
          entries.reduce((sum: number, entry: any) => sum + Number(entry?.amount || 0), 0);
        const sumBillPaid = (entries: any[]) =>
          entries.reduce((sum: number, entry: any) => sum + Number(entry?.paid_amount || 0), 0);

        const leaseCharge = sumBillAmount(byCategory.lease_charge);
        const leaseDeposit = sumBillAmount(byCategory.lease_deposit);
        const waterCharge = sumBillAmount(byCategory.water);
        const waterPaid = sumBillPaid(byCategory.water);
        const otherBill = sumBillAmount(byCategory.other_bill);
        const paint = sumBillAmount(byCategory.paint);
        const rentTopUp = sumBillAmount(byCategory.rent_adjustment);
        const advance = sumBillAmount(byCategory.advance);
        const penalty = sumBillAmount(byCategory.penalty);

        const rentDue = rentDueFromRecords > 0 ? rentDueFromRecords : monthlyRent;

        const billRecordIds: Partial<Record<BillCategoryKey, string>> = {
          lease_charge: byCategory.lease_charge[0]?.id,
          lease_deposit: byCategory.lease_deposit[0]?.id,
          water: byCategory.water[0]?.id,
          other_bill: byCategory.other_bill[0]?.id,
          paint: byCategory.paint[0]?.id,
          rent_adjustment: byCategory.rent_adjustment[0]?.id,
          advance: byCategory.advance[0]?.id,
          penalty: byCategory.penalty[0]?.id,
        };

        const paymentDate =
          toDateOnlyIso(rentRecord?.paid_date || '') ||
          toDateOnlyIso(rentRecord?.payment_date || '') ||
          toDateOnlyIso(rentRecord?.updated_at || '') ||
          '';

        const remarks =
          String(rentRecord?.remarks || '').trim() ||
          String(unitBills.find((bill: any) => String(bill?.remarks || '').trim())?.remarks || '').trim();

        return recalculateRow({
          unit_id: unit.id,
          property_id: currentPropertyId,
          unit_number: unit.unit_number,
          floor_number: unit.floor_number,
          unit_label: `${unit.unit_number}: ${String(unitType).toUpperCase()}`,
          unit_type: unitType,
          monthly_rent: monthlyRent,
          tenant_name: tenantName,
          tenant_phone: tenantPhone,
          tenant_profile_id: activeLease?.tenant_id,

          lease_charge: leaseCharge,
          lease_deposit: leaseDeposit,
          water_charge: waterCharge,
          water_paid: waterPaid,
          other_bill: otherBill,
          paint,
          rent_due: rentDue,
          rent_top_up: rentTopUp,
          rent_paid: paidRentFromRecords,
          rent_balance: 0,
          advance,
          total_per_unit: 0,
          arrears_per_unit: 0,
          payment_date: paymentDate,
          penalty,
          remarks,

          rent_payment_id: rentRecord?.id,
          bill_record_ids: billRecordIds,
        });
      });

      setRows(sortRowsLikeUnitManagement(processedRows));
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('Failed to load payment ledger');
    } finally {
      setLoading(false);
    }
  };

  const persistRentPayment = async (row: LedgerRow) => {
    if (!row.tenant_profile_id) return;

    const status = getStatusFromAmounts(row.rent_due, row.rent_paid);
    const payload: Record<string, any> = {
      tenant_id: row.tenant_profile_id,
      unit_id: row.unit_id,
      property_id: row.property_id,
      amount: row.rent_due,
      amount_paid: row.rent_paid,
      due_date: monthStart,
      paid_date: row.payment_date || null,
      status,
      remarks: row.remarks || null,
      payment_method: row.rent_paid > 0 ? 'manual_entry' : null,
    };

    if (row.rent_payment_id) {
      const { error } = await supabase
        .from('rent_payments')
        .update(payload)
        .eq('id', row.rent_payment_id);

      if (error) throw error;
      return;
    }

    const { data, error } = await supabase
      .from('rent_payments')
      .insert([payload])
      .select('id')
      .single();

    if (error) throw error;

    if (data?.id) {
      setRows((previous) =>
        previous.map((item) =>
          item.unit_id === row.unit_id
            ? {
                ...item,
                rent_payment_id: data.id,
              }
            : item
        )
      );
    }
  };

  const persistBillCategory = async (row: LedgerRow, category: BillCategoryKey) => {
    const billType = BILL_KEY_TO_TYPE[category];
    const recordId = row.bill_record_ids[category];

    const amount =
      category === 'lease_charge'
        ? row.lease_charge
        : category === 'lease_deposit'
          ? row.lease_deposit
          : category === 'water'
            ? row.water_charge
            : category === 'other_bill'
              ? row.other_bill
              : category === 'paint'
                ? row.paint
                : category === 'rent_adjustment'
                  ? row.rent_top_up
                  : category === 'advance'
                    ? row.advance
                    : row.penalty;

    const paidAmount = category === 'water' ? row.water_paid : category === 'advance' ? row.advance : 0;
    const status = getStatusFromAmounts(amount, paidAmount);

    const payload: Record<string, any> = {
      unit_id: row.unit_id,
      property_id: row.property_id,
      bill_type: billType,
      amount,
      paid_amount: paidAmount,
      bill_period_start: monthStart,
      bill_period_end: monthEnd,
      due_date: monthEnd,
      status,
      remarks: row.remarks || `${billType} entry`,
    };

    if (recordId) {
      const { error } = await supabase
        .from('bills_and_utilities')
        .update(payload)
        .eq('id', recordId);

      if (error) throw error;
      return;
    }

    const { data, error } = await supabase
      .from('bills_and_utilities')
      .insert([payload])
      .select('id')
      .single();

    if (error) throw error;

    if (data?.id) {
      setRows((previous) =>
        previous.map((item) =>
          item.unit_id === row.unit_id
            ? {
                ...item,
                bill_record_ids: {
                  ...item.bill_record_ids,
                  [category]: data.id,
                },
              }
            : item
        )
      );
    }
  };

  const saveField = async (row: LedgerRow, field: string) => {
    if (!propertyId) return;

    const saveKey = `${row.unit_id}-${field}`;
    setSavingCell(saveKey);

    try {
      if (['rent_paid', 'payment_date', 'remarks'].includes(field)) {
        await persistRentPayment(row);
        return;
      }

      if (field === 'rent_top_up') {
        await persistBillCategory(row, 'rent_adjustment');
        await persistRentPayment(row);
        return;
      }

      if (field === 'lease_charge') {
        await persistBillCategory(row, 'lease_charge');
        return;
      }

      if (field === 'lease_deposit') {
        await persistBillCategory(row, 'lease_deposit');
        return;
      }

      if (field === 'water_charge' || field === 'water_paid') {
        await persistBillCategory(row, 'water');
        return;
      }

      if (field === 'other_bill') {
        await persistBillCategory(row, 'other_bill');
        return;
      }

      if (field === 'paint') {
        await persistBillCategory(row, 'paint');
        return;
      }

      if (field === 'advance') {
        await persistBillCategory(row, 'advance');
        return;
      }

      if (field === 'penalty') {
        await persistBillCategory(row, 'penalty');
      }
    } catch (error) {
      console.error('Error saving payment ledger field:', error);
      toast.error('Unable to save this field. Check permissions and try again.');
    } finally {
      setSavingCell('');
    }
  };

  const handleChange = (unitId: string, field: string, value: string) => {
    setRows((previous) =>
      previous.map((row) => {
        if (row.unit_id !== unitId) return row;

        const next = { ...row };

        if (field === 'remarks') {
          next.remarks = value;
          return recalculateRow(next);
        }

        if (field === 'payment_date') {
          next.payment_date = value;
          return recalculateRow(next);
        }

        const parsed = toNumber(value);
        if (parsed === null) return row;

        if (field === 'lease_charge') next.lease_charge = parsed;
        if (field === 'lease_deposit') next.lease_deposit = parsed;
        if (field === 'water_charge') next.water_charge = parsed;
        if (field === 'water_paid') next.water_paid = parsed;
        if (field === 'other_bill') next.other_bill = parsed;
        if (field === 'paint') next.paint = parsed;
        if (field === 'rent_top_up') next.rent_top_up = parsed;
        if (field === 'rent_paid') next.rent_paid = parsed;
        if (field === 'advance') next.advance = parsed;
        if (field === 'penalty') next.penalty = parsed;

        return recalculateRow(next);
      })
    );
  };

  const handleBlur = (unitId: string, field: string) => {
    const row = rows.find((item) => item.unit_id === unitId);
    if (!row) return;
    void saveField(row, field);
  };

  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return rows.filter((row) => {
      if (
        search &&
        ![
          row.unit_label,
          row.tenant_name,
          row.tenant_phone,
          row.remarks,
          row.unit_type,
          row.unit_number,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search)
      ) {
        return false;
      }

      if (unitTypeFilter.trim() && !row.unit_type.toLowerCase().includes(unitTypeFilter.trim().toLowerCase())) {
        return false;
      }

      if (tenantFilter.trim() && !row.tenant_name.toLowerCase().includes(tenantFilter.trim().toLowerCase())) {
        return false;
      }

      if (phoneFilter.trim() && !row.tenant_phone.toLowerCase().includes(phoneFilter.trim().toLowerCase())) {
        return false;
      }

      if (remarkFilter.trim() && !row.remarks.toLowerCase().includes(remarkFilter.trim().toLowerCase())) {
        return false;
      }

      for (const category of BILL_CATEGORY_META) {
        const mode = categoryFilters[category.key];
        const amount = Number((row as any)[category.key] || 0);
        if (mode === 'with' && amount <= 0) return false;
        if (mode === 'without' && amount > 0) return false;
      }

      return true;
    });
  }, [rows, searchTerm, unitTypeFilter, tenantFilter, phoneFilter, remarkFilter, categoryFilters]);

  const totals = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => ({
          monthlyRent: acc.monthlyRent + row.monthly_rent,
          leaseCharge: acc.leaseCharge + row.lease_charge,
          leaseDeposit: acc.leaseDeposit + row.lease_deposit,
          waterCharge: acc.waterCharge + row.water_charge,
          waterPaid: acc.waterPaid + row.water_paid,
          otherBill: acc.otherBill + row.other_bill,
          paint: acc.paint + row.paint,
          rentDue: acc.rentDue + row.rent_due,
          rentPaid: acc.rentPaid + row.rent_paid,
          advance: acc.advance + row.advance,
          penalty: acc.penalty + row.penalty,
          totalPerUnit: acc.totalPerUnit + row.total_per_unit,
          arrears: acc.arrears + row.arrears_per_unit,
        }),
        {
          monthlyRent: 0,
          leaseCharge: 0,
          leaseDeposit: 0,
          waterCharge: 0,
          waterPaid: 0,
          otherBill: 0,
          paint: 0,
          rentDue: 0,
          rentPaid: 0,
          advance: 0,
          penalty: 0,
          totalPerUnit: 0,
          arrears: 0,
        }
      ),
    [filteredRows]
  );

  const clearFilters = () => {
    setSearchTerm('');
    setUnitTypeFilter('');
    setTenantFilter('');
    setPhoneFilter('');
    setRemarkFilter('');
    setCategoryFilters(ZERO_CATEGORY_FILTERS);
  };

  const exportLedger = () => {
    const headers = [
      'UNIT TYPE',
      'MONTHLY',
      "TENANT'S NAME",
      "TENANT'S PHONE",
      'LEASE CHARGE',
      'LEASE DEPOSIT',
      'WATER',
      'PAID WATER',
      'BILL',
      'PAINT',
      'RENT DUE',
      'RENT TOP-UP',
      'PAID RENT',
      'RENT BAL',
      'ADVANCE',
      'PER UNIT',
      'ARREARS PER',
      'PAYMENT DATE',
      'PENALTY',
      'REMARKS',
    ];

    const exportRows = filteredRows.map((row) => [
      row.unit_label,
      row.monthly_rent,
      row.tenant_name,
      row.tenant_phone,
      row.lease_charge,
      row.lease_deposit,
      row.water_charge,
      row.water_paid,
      row.other_bill,
      row.paint,
      row.rent_due,
      row.rent_top_up,
      row.rent_paid,
      row.rent_balance,
      row.advance,
      row.total_per_unit,
      row.arrears_per_unit,
      row.payment_date,
      row.penalty,
      row.remarks,
    ]);

    const csv = [headers, ...exportRows]
      .map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `manager-payments-ledger-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!loading && !propertyId) {
    return (
      <div className="min-h-screen bg-[#d7dce1] p-6 font-['Poppins','Segoe_UI',sans-serif] text-[#243041]">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>
        <div className="mx-auto mt-10 max-w-2xl border border-[#e6bf6f] bg-[#fff4d8] p-6">
          <h2 className="text-lg font-bold text-[#7a3f00]">No active property assignment</h2>
          <p className="mt-2 text-sm text-[#8a4a00]">
          This page needs an active property assignment before payment ledger data can load.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 font-['Poppins','Segoe_UI',sans-serif] text-[#243041] md:p-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="w-full">
        <div className="mb-5 flex flex-col items-start justify-between gap-4 border-b border-[#bcc3cd] pb-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <FileText className="h-6 w-6 text-[#2f3d51]" />
              <h1 className="text-[34px] font-bold leading-none text-[#1f2937]">Payments Ledger</h1>
            </div>
            <p className="mt-1 text-[12px] font-medium uppercase tracking-wide text-[#5f6b7c]">
              Spreadsheet layout for {propertyName}
            </p>
            <p className="mt-1 text-[12px] font-medium text-[#5f6b7c]">
              Capture all categories and details. Changes save when you leave each edited cell.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#5f6b7c]" />
              <Input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="h-9 w-36 border border-[#b6bec8] bg-[#eef1f4] text-[12px] text-[#1f2937] focus-visible:ring-0"
              />
            </div>
            <button
              type="button"
              onClick={exportLedger}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#2f3d51] bg-[#2f3d51] px-3 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#243041]"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#9aa4b1] bg-[#eef1f4] px-3 text-[11px] font-semibold uppercase tracking-wide text-[#334155] transition-colors hover:bg-white"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="overflow-hidden rounded-none border-0 bg-[#35a8bd] text-[#081c2c] shadow-none">
            <CardHeader className="px-5 pb-1 pt-4">
              <CardTitle className="text-[12px] font-semibold uppercase tracking-wide text-[#0b2438]">Total Charges</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-1">
              <div className="text-[34px] font-extrabold leading-none text-[#031524]">{formatCurrency(totals.totalPerUnit)}</div>
            </CardContent>
            <div className="bg-[#2c95a7] px-5 py-1 text-[12px] font-medium text-[#062035]">More info -&gt;</div>
          </Card>
          <Card className="overflow-hidden rounded-none border-0 bg-[#2fb34a] text-[#081f17] shadow-none">
            <CardHeader className="px-5 pb-1 pt-4">
              <CardTitle className="text-[12px] font-semibold uppercase tracking-wide text-[#0c2e1f]">Rent Collected</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-1">
              <div className="text-[34px] font-extrabold leading-none text-[#041b12]">{formatCurrency(totals.rentPaid + totals.waterPaid)}</div>
            </CardContent>
            <div className="bg-[#28983f] px-5 py-1 text-[12px] font-medium text-[#062417]">More info -&gt;</div>
          </Card>
          <Card className="overflow-hidden rounded-none border-0 bg-[#f3c20f] text-[#1d1400] shadow-none">
            <CardHeader className="px-5 pb-1 pt-4">
              <CardTitle className="text-[12px] font-semibold uppercase tracking-wide text-[#3d2f00]">Collection Rate</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-1">
              <div className="text-[34px] font-extrabold leading-none text-[#231600]">
                {totals.totalPerUnit > 0
                  ? Math.round((((totals.rentPaid + totals.waterPaid + totals.advance) / totals.totalPerUnit) * 100))
                  : 0}
                %
              </div>
            </CardContent>
            <div className="bg-[#dcad08] px-5 py-1 text-[12px] font-medium text-[#352800]">More info -&gt;</div>
          </Card>
          <Card className="overflow-hidden rounded-none border-0 bg-[#de3346] text-[#220a10] shadow-none">
            <CardHeader className="px-5 pb-1 pt-4">
              <CardTitle className="text-[12px] font-semibold uppercase tracking-wide text-[#390d16]">Total Arrears</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-1">
              <div className="text-[34px] font-extrabold leading-none text-[#1f090f]">{formatCurrency(totals.arrears)}</div>
            </CardContent>
            <div className="bg-[#c92a3d] px-5 py-1 text-[12px] font-medium text-[#2b0c12]">More info -&gt;</div>
          </Card>
        </div>

        <Card className="mb-4 rounded-none border border-[#adb5bf] bg-gradient-to-r from-[#eef2f6] to-[#e8edf3] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px] font-bold text-[#263143]">Category Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-4 xl:grid-cols-6">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#7a8595]" />
                <Input
                  placeholder="Search everything"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-9 border border-[#b6bec8] bg-white pl-8 text-[12px] text-[#1f2937] placeholder:text-[#778396]"
                />
              </div>
              <Input
                placeholder="Filter unit type"
                value={unitTypeFilter}
                onChange={(event) => setUnitTypeFilter(event.target.value)}
                className="h-9 border border-[#b6bec8] bg-white text-[12px] text-[#1f2937] placeholder:text-[#778396]"
              />
              <Input
                placeholder="Filter tenant"
                value={tenantFilter}
                onChange={(event) => setTenantFilter(event.target.value)}
                className="h-9 border border-[#b6bec8] bg-white text-[12px] text-[#1f2937] placeholder:text-[#778396]"
              />
              <Input
                placeholder="Filter phone"
                value={phoneFilter}
                onChange={(event) => setPhoneFilter(event.target.value)}
                className="h-9 border border-[#b6bec8] bg-white text-[12px] text-[#1f2937] placeholder:text-[#778396]"
              />
              <Input
                placeholder="Filter remarks"
                value={remarkFilter}
                onChange={(event) => setRemarkFilter(event.target.value)}
                className="h-9 border border-[#b6bec8] bg-white text-[12px] text-[#1f2937] placeholder:text-[#778396]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
              {BILL_CATEGORY_META.map((item) => (
                <label key={item.key} className="flex items-center justify-between border border-[#cfd6df] bg-white px-2 py-1.5 text-[11px]">
                  <span className="font-medium text-[#334155]">{item.label}</span>
                  <select
                    value={categoryFilters[item.key]}
                    onChange={(event) =>
                      setCategoryFilters((previous) => ({
                        ...previous,
                        [item.key]: event.target.value as CategoryFilterMode,
                      }))
                    }
                    className="h-7 border border-[#b6bec8] bg-[#eef1f4] px-1 text-[11px] text-[#1f2937]"
                  >
                    <option value="all">All</option>
                    <option value="with">With Value</option>
                    <option value="without">No Value</option>
                  </select>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-none border border-[#adb4be] bg-white shadow-none">
          <div className="p-2 border-b border-black flex justify-between items-center bg-white h-12">
            <h3 className="font-semibold text-base flex items-center gap-2 text-slate-800">
              <FileText className="w-4 h-4 text-[#5f6b7c]" />
              Unit Payment Ledger
            </h3>
            <div className="text-[11px] font-medium text-[#5f6b7c]">
              {filteredRows.length} row(s)
              {savingCell ? <span className="ml-2 font-semibold text-[#25527b]">Saving...</span> : null}
            </div>
          </div>

          <div className="overflow-x-hidden">
            <Table className="w-full table-fixed border-collapse border border-black text-[11px] leading-tight">
              <TableHeader>
                <TableRow className="border-b border-black">
                  <TableHead className="w-[8%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 bg-[#70ad47]">UNIT TYPE</TableHead>
                  <TableHead className="w-[5%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">MONTHLY</TableHead>
                  <TableHead className="w-[8%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">TENANT'S NAME</TableHead>
                  <TableHead className="w-[5%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">TENANT'S PHONE</TableHead>
                  <TableHead className="w-[5%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">LEASE CHARGE</TableHead>
                  <TableHead className="w-[5%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">LEASE DEPOSIT</TableHead>
                  <TableHead className="w-[4%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">WATER</TableHead>
                  <TableHead className="w-[4%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">PAID</TableHead>
                  <TableHead className="w-[4%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">BILL</TableHead>
                  <TableHead className="w-[4%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">PAINT</TableHead>
                  <TableHead className="w-[5%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">RENT</TableHead>
                  <TableHead className="w-[5%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">RENT TOP-UP</TableHead>
                  <TableHead className="w-[5%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">PAID</TableHead>
                  <TableHead className="w-[5%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#ffff00]">RENT BAL</TableHead>
                  <TableHead className="w-[4%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">ADVANCE</TableHead>
                  <TableHead className="w-[5%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">PER UNIT</TableHead>
                  <TableHead className="w-[5%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#ff0000]">ARREARS PER</TableHead>
                  <TableHead className="w-[5%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">PAYMENT</TableHead>
                  <TableHead className="w-[4%] px-1 py-1 text-[10px] font-bold text-blue-900 border-r border-black h-9 text-center bg-[#70ad47]">PENALTY</TableHead>
                  <TableHead className="w-[5%] px-1 py-1 text-[10px] font-bold text-blue-900 h-9 bg-[#70ad47]">REMARKS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={20} className="h-32 text-center border border-slate-200">
                      <div className="flex flex-col justify-center items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                        <span className="text-slate-500">Loading records...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={20} className="h-32 text-center text-slate-500 border border-slate-200">
                      No payment records found for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row, index) => (
                    <TableRow key={row.unit_id} className={`group border-b border-black ${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                      <TableCell className="font-bold text-blue-900 border-r border-black py-1 px-1 truncate" title={row.unit_label}>
                        {row.unit_label}
                      </TableCell>
                      <TableCell className="border-r border-black py-1 px-1 text-center font-mono text-blue-900 font-medium">
                        {formatNumber(row.monthly_rent)}
                      </TableCell>
                      <TableCell className="border-r border-black py-1 px-1 text-center text-[11px] font-semibold text-blue-900 truncate" title={row.tenant_name}>
                        {row.tenant_name}
                      </TableCell>
                      <TableCell className="border-r border-black py-1 px-1 text-center text-[11px] text-blue-900 truncate" title={row.tenant_phone}>
                        {row.tenant_phone}
                      </TableCell>

                      <TableCell className="border-r border-black p-0 relative">
                        <input
                          className="w-full h-full bg-transparent p-1 text-center font-mono text-[11px] text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                          value={row.lease_charge === 0 ? '' : row.lease_charge}
                          onChange={(event) => handleChange(row.unit_id, 'lease_charge', event.target.value)}
                          onBlur={() => handleBlur(row.unit_id, 'lease_charge')}
                        />
                      </TableCell>
                      <TableCell className="border-r border-black p-0 relative">
                        <input
                          className="w-full h-full bg-transparent p-1 text-center font-mono text-[11px] text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                          value={row.lease_deposit === 0 ? '' : row.lease_deposit}
                          onChange={(event) => handleChange(row.unit_id, 'lease_deposit', event.target.value)}
                          onBlur={() => handleBlur(row.unit_id, 'lease_deposit')}
                        />
                      </TableCell>
                      <TableCell className="border-r border-black p-0 relative">
                        <input
                          className="w-full h-full bg-transparent p-1 text-center font-mono text-[11px] text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                          value={row.water_charge === 0 ? '' : row.water_charge}
                          onChange={(event) => handleChange(row.unit_id, 'water_charge', event.target.value)}
                          onBlur={() => handleBlur(row.unit_id, 'water_charge')}
                        />
                      </TableCell>
                      <TableCell className="border-r border-black p-0 relative">
                        <input
                          className="w-full h-full bg-transparent p-1 text-center font-mono text-[11px] text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                          value={row.water_paid === 0 ? '' : row.water_paid}
                          onChange={(event) => handleChange(row.unit_id, 'water_paid', event.target.value)}
                          onBlur={() => handleBlur(row.unit_id, 'water_paid')}
                        />
                      </TableCell>
                      <TableCell className="border-r border-black p-0 relative">
                        <input
                          className="w-full h-full bg-transparent p-1 text-center font-mono text-[11px] text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                          value={row.other_bill === 0 ? '' : row.other_bill}
                          onChange={(event) => handleChange(row.unit_id, 'other_bill', event.target.value)}
                          onBlur={() => handleBlur(row.unit_id, 'other_bill')}
                        />
                      </TableCell>
                      <TableCell className="border-r border-black p-0 relative">
                        <input
                          className="w-full h-full bg-transparent p-1 text-center font-mono text-[11px] text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                          value={row.paint === 0 ? '' : row.paint}
                          onChange={(event) => handleChange(row.unit_id, 'paint', event.target.value)}
                          onBlur={() => handleBlur(row.unit_id, 'paint')}
                        />
                      </TableCell>

                      <TableCell className="border-r border-black py-1 px-1 text-center font-mono text-blue-900 bg-[#edebe9]">
                        {formatNumber(row.rent_due)}
                      </TableCell>
                      <TableCell className="border-r border-black p-0 relative">
                        <input
                          className="w-full h-full bg-transparent p-1 text-center font-mono text-[11px] text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                          value={row.rent_top_up === 0 ? '' : row.rent_top_up}
                          onChange={(event) => handleChange(row.unit_id, 'rent_top_up', event.target.value)}
                          onBlur={() => handleBlur(row.unit_id, 'rent_top_up')}
                        />
                      </TableCell>
                      <TableCell className="p-0 border-r border-black relative">
                        <input
                          className="w-full h-full bg-transparent p-1 text-center font-mono text-[11px] text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-green-600 focus:ring-inset"
                          value={row.rent_paid === 0 ? '' : row.rent_paid}
                          onChange={(event) => handleChange(row.unit_id, 'rent_paid', event.target.value)}
                          onBlur={() => handleBlur(row.unit_id, 'rent_paid')}
                        />
                      </TableCell>
                      <TableCell className="border-r border-black py-1 px-1 text-center font-mono font-bold text-blue-900 bg-[#ffff00]">
                        {formatNumber(row.rent_balance)}
                      </TableCell>
                      <TableCell className="border-r border-black p-0 relative">
                        <input
                          className="w-full h-full bg-transparent p-1 text-center font-mono text-[11px] text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                          value={row.advance === 0 ? '' : row.advance}
                          onChange={(event) => handleChange(row.unit_id, 'advance', event.target.value)}
                          onBlur={() => handleBlur(row.unit_id, 'advance')}
                        />
                      </TableCell>
                      <TableCell className="border-r border-black py-1 px-1 text-center font-mono font-bold text-blue-900 bg-[#edebe9]">
                        {formatNumber(row.total_per_unit)}
                      </TableCell>
                      <TableCell className="border-r border-black py-1 px-1 text-center font-mono font-bold text-blue-900 bg-[#ff0000]">
                        {formatNumber(row.arrears_per_unit)}
                      </TableCell>
                      <TableCell className="border-r border-black p-0 relative">
                        <input
                          type="date"
                          className="w-full h-full bg-transparent p-1 text-center text-[11px] text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                          value={row.payment_date || ''}
                          onChange={(event) => handleChange(row.unit_id, 'payment_date', event.target.value)}
                          onBlur={() => handleBlur(row.unit_id, 'payment_date')}
                        />
                      </TableCell>
                      <TableCell className="border-r border-black p-0 relative">
                        <input
                          className="w-full h-full bg-transparent p-1 text-center font-mono text-[11px] text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                          value={row.penalty === 0 ? '' : row.penalty}
                          onChange={(event) => handleChange(row.unit_id, 'penalty', event.target.value)}
                          onBlur={() => handleBlur(row.unit_id, 'penalty')}
                        />
                      </TableCell>
                      <TableCell className="p-0 relative">
                        <input
                          className="w-full h-full bg-transparent p-1 text-[11px] text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-slate-500 focus:ring-inset"
                          value={row.remarks || ''}
                          onChange={(event) => handleChange(row.unit_id, 'remarks', event.target.value)}
                          onBlur={() => handleBlur(row.unit_id, 'remarks')}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {filteredRows.length > 0 && (
                  <TableRow className="bg-[#70ad47] border-t-2 border-black">
                    <TableCell className="font-bold text-blue-900 border-r border-black py-3">TOTALS</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{formatNumber(totals.monthlyRent)}</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono" colSpan={2}>-</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{formatNumber(totals.leaseCharge)}</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{formatNumber(totals.leaseDeposit)}</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{formatNumber(totals.waterCharge)}</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{formatNumber(totals.waterPaid)}</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{formatNumber(totals.otherBill)}</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{formatNumber(totals.paint)}</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{formatNumber(totals.rentDue)}</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">-</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{formatNumber(totals.rentPaid)}</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono bg-[#ffff00]">{formatNumber(Math.max(0, totals.rentDue - totals.rentPaid))}</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{formatNumber(totals.advance)}</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{formatNumber(totals.totalPerUnit)}</TableCell>
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono bg-[#ff0000]">{formatNumber(totals.arrears)}</TableCell>
                    <TableCell className="bg-[#70ad47]" />
                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{formatNumber(totals.penalty)}</TableCell>
                    <TableCell className="bg-[#70ad47]" />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="pt-3 text-[12px] font-medium text-[#5f6b7c]">
          Showing <span className="font-semibold text-[#334155]">{filteredRows.length}</span> row(s) for{' '}
          <span className="font-semibold text-[#334155]">{selectedMonth}</span>. Charges: {formatCurrency(totals.totalPerUnit)}. Arrears: {formatCurrency(totals.arrears)}.
        </div>
      </div>
    </div>
  );
};

const toNumber = (value: string): number | null => {
  if (value.trim() === '') return 0;
  const normalized = value.replace(/,/g, '').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const toDateOnlyIso = (value: string | Date | null | undefined): string => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const isInSelectedMonth = (value: string | null | undefined, selectedMonthDate: Date): boolean => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === selectedMonthDate.getFullYear() &&
    date.getMonth() === selectedMonthDate.getMonth()
  );
};

const normalizeBillType = (value: string): BillCategoryKey => {
  const normalized = value.toLowerCase().replace(/\s+/g, '_');
  if (normalized.includes('water')) return 'water';
  if (normalized.includes('lease') && normalized.includes('deposit')) return 'lease_deposit';
  if (normalized.includes('lease') && normalized.includes('charge')) return 'lease_charge';
  if (normalized.includes('paint')) return 'paint';
  if (normalized.includes('advance')) return 'advance';
  if (normalized.includes('penalt') || normalized.includes('late_fee')) return 'penalty';
  if (normalized.includes('rent_adjustment') || normalized.includes('top_up') || normalized.includes('adjustment')) return 'rent_adjustment';
  if (normalized === 'rent') return 'rent_adjustment';
  return 'other_bill';
};

const getStatusFromAmounts = (amount: number, paidAmount: number): 'open' | 'partial' | 'paid' => {
  const due = Number(amount || 0);
  const paid = Number(paidAmount || 0);

  if (due <= 0 && paid <= 0) return 'open';
  if (paid >= due && due > 0) return 'paid';
  if (paid > 0) return 'partial';
  return 'open';
};

const recalculateRow = (row: LedgerRow): LedgerRow => {
  const rentDue = Math.max(0, Number(row.monthly_rent || 0) + Number(row.rent_top_up || 0));
  const rentBalance = Math.max(0, rentDue - Number(row.rent_paid || 0));

  const totalPerUnit =
    Number(row.lease_charge || 0) +
    Number(row.lease_deposit || 0) +
    Number(row.water_charge || 0) +
    Number(row.other_bill || 0) +
    Number(row.paint || 0) +
    Number(row.penalty || 0) +
    rentDue;

  const credits = Number(row.water_paid || 0) + Number(row.rent_paid || 0) + Number(row.advance || 0);
  const arrearsPerUnit = Math.max(0, totalPerUnit - credits);

  return {
    ...row,
    rent_due: rentDue,
    rent_balance: rentBalance,
    total_per_unit: totalPerUnit,
    arrears_per_unit: arrearsPerUnit,
  };
};

const formatNumber = (value: number): string => {
  const amount = Number(value || 0);
  if (amount === 0) return '';
  return amount.toLocaleString('en-KE');
};

export default ManagerRentCollection;