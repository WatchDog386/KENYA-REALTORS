import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Download, 
  Filter, 
  Search, 
  Calendar,
  Loader2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatCurrency';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DepositRefundSheet, { DepositRefundCase } from '@/components/portal/shared/DepositRefundSheet';

interface BillingRecord {
  id: string;
  unit_id: string;
  unit_number: string;
  unit_type: string;
  tenant_name: string;
  tenant_email: string;
  monthly_rent: number;
  paid_rent: number;
  rent_arrears: number;
  water_bill: number;
  paid_water_bill: number;
  water_bill_arrears: number;
  other_utilities: number;
  paid_utilities: number;
  utilities_arrears: number;
  total_arrears: number;
  total_paid: number;
  overpayment: number;
  payment_date: string;
  remarks: string;
  property_id: string;
  property_name: string;
}

const BillingAndInvoicing = () => {
  const [billings, setBillings] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProperty, setFilterProperty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [properties, setProperties] = useState<any[]>([]);
  const [refundCases, setRefundCases] = useState<DepositRefundCase[]>([]);
  const [stats, setStats] = useState({
    totalExpected: 0,
    totalPaid: 0,
    totalArrears: 0,
    totalOverpayment: 0,
    unitsWithArrears: 0,
  });

  useEffect(() => {
    fetchBillings();
  }, []);

  const fetchBillings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get manager's properties
      const { data: managerProps } = await supabase
        .from('properties')
        .select('id, name')
        .eq('property_manager_id', user.id);

      if (managerProps) {
        setProperties(managerProps);
      }
      const propIds = managerProps?.map(p => p.id) || [];

      // Get units with tenant info
      const { data: units } = await supabase
        .from('units')
        .select(`
          id,
          unit_number,
          price,
          property_id,
          property_unit_types(unit_type_name),
          tenants (
            id,
            first_name,
            last_name,
            email,
            user_id
          )
        `)
        .in('property_id', propIds);

      // Get utility readings for bills
      const { data: readings } = await supabase
        .from('utility_readings')
        .select('*')
        .in('unit_id', units?.map(u => u.id) || [])
        .order('reading_month', { ascending: false });

      // Get rent payments
      const { data: rentPayments } = await supabase
        .from('rent_payments')
        .select('*')
        .in('property_id', propIds);

      // Get bill payments
      const { data: billPayments } = await supabase
        .from('bills_and_utilities')
        .select('*')
        .in('property_id', propIds);

      // Vacancy notices trigger deposit-refund processing
      const { data: vacancyNotices } = await supabase
        .from('vacancy_notices')
        .select('id, tenant_id, unit_id, property_id, status, move_out_date, created_at, updated_at')
        .in('property_id', propIds);

      // Manager checklist damages (auto deduction source): completion reports -> maintenance request unit
      const { data: completionReports } = await supabase
        .from('maintenance_completion_reports')
        .select('maintenance_request_id, cost_estimate, actual_cost, status')
        .in('property_id', propIds);

      const completionRequestIds = (completionReports || [])
        .map((row: any) => row?.maintenance_request_id)
        .filter(Boolean);

      const { data: completionRequests } = completionRequestIds.length > 0
        ? await supabase
            .from('maintenance_requests')
            .select('id, unit_id')
            .in('id', completionRequestIds)
        : { data: [] as any[] };

      // Construct billing records
      const billingRecords: BillingRecord[] = (units || []).map((unit: any) => {
        const tenant = unit.tenants?.[0];
        const property = managerProps?.find(p => p.id === unit.property_id);
        
        // Get the latest reading for this unit
        const latestReading = readings?.find(r => r.unit_id === unit.id);
        const relatedRentPayments = rentPayments?.filter(p => 
          p.property_id === unit.property_id && 
          (p.tenant_id === tenant?.id || p.tenant_id === tenant?.user_id)
        ) || [];
        const relatedBillPayments = billPayments?.filter(p => 
          p.property_id === unit.property_id && 
          p.unit_id === unit.id
        ) || [];

        // Align calculations with tenant payment page ledger logic
        const rentExpectedFromRentPayments = relatedRentPayments.reduce(
          (sum: number, payment: any) => sum + (Number(payment.amount) || 0),
          0
        );
        const rentPaidFromRentPayments = relatedRentPayments.reduce(
          (sum: number, payment: any) => sum + (Number(payment.amount_paid) || 0),
          0
        );
        const rentArrearsFromRentPayments = Math.max(0, rentExpectedFromRentPayments - rentPaidFromRentPayments);

        const rentBills = relatedBillPayments.filter((payment: any) => {
          const type = String(payment.bill_type || '').toLowerCase();
          return type === 'rent' || String(payment.remarks || '').toLowerCase().includes('rent');
        });
        const rentExpectedFromBills = rentBills.reduce(
          (sum: number, payment: any) => sum + (Number(payment.amount) || 0),
          0
        );
        const rentPaidFromBills = rentBills.reduce(
          (sum: number, payment: any) => sum + (Number(payment.paid_amount) || 0),
          0
        );
        const rentArrearsFromBills = Math.max(0, rentExpectedFromBills - rentPaidFromBills);

        const monthlyRent = Math.max(Number(unit.price || 0), rentExpectedFromRentPayments, rentExpectedFromBills);
        const paidRent = Math.max(rentPaidFromRentPayments, rentPaidFromBills);
        const rentArrears = Math.max(rentArrearsFromRentPayments, rentArrearsFromBills);

        const utilityOnlyBills = relatedBillPayments.filter((payment: any) => {
          const type = String(payment.bill_type || '').toLowerCase();
          return type !== 'all' && type !== 'rent';
        });

        const waterBills = utilityOnlyBills.filter((payment: any) =>
          String(payment.bill_type || '').toLowerCase().includes('water')
        );
        const nonWaterBills = utilityOnlyBills.filter((payment: any) =>
          !String(payment.bill_type || '').toLowerCase().includes('water')
        );

        const waterBill = waterBills.reduce((sum: number, payment: any) => sum + (Number(payment.amount) || 0), 0);
        const paidWaterBill = waterBills.reduce((sum: number, payment: any) => sum + (Number(payment.paid_amount) || 0), 0);
        const waterArrears = Math.max(0, waterBill - paidWaterBill);

        const otherUtilities = nonWaterBills.reduce((sum: number, payment: any) => sum + (Number(payment.amount) || 0), 0);
        const paidUtilities = nonWaterBills.reduce((sum: number, payment: any) => sum + (Number(payment.paid_amount) || 0), 0);
        const utilitiesArrears = Math.max(0, otherUtilities - paidUtilities);

        const totalExpected = monthlyRent + waterBill + otherUtilities;
        const totalPaid = paidRent + paidWaterBill + paidUtilities;
        const totalArrears = rentArrears + waterArrears + utilitiesArrears;
        const overpayment = Math.max(0, totalPaid - totalExpected);

        return {
          id: unit.id,
          unit_id: unit.id,
          unit_number: unit.unit_number,
          unit_type: unit.property_unit_types?.unit_type_name || 'N/A',
          tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Vacant',
          tenant_email: tenant?.email || '',
          monthly_rent: monthlyRent,
          paid_rent: paidRent,
          rent_arrears: rentArrears,
          water_bill: waterBill,
          paid_water_bill: paidWaterBill,
          water_bill_arrears: waterArrears,
          other_utilities: otherUtilities,
          paid_utilities: paidUtilities,
          utilities_arrears: utilitiesArrears,
          total_arrears: totalArrears,
          total_paid: totalPaid,
          overpayment: overpayment,
          payment_date: relatedRentPayments[0]?.paid_date || relatedBillPayments[0]?.payment_date || '',
          remarks: latestReading?.remarks || '',
          property_id: unit.property_id,
          property_name: property?.name || 'N/A',
        };
      });

      // Sort chronologically/numerically by unit number
      billingRecords.sort((a, b) => {
        return String(a.unit_number).localeCompare(String(b.unit_number), undefined, {numeric: true, sensitivity: 'base'});
      });

      setBillings(billingRecords);

      const requestUnitById = new Map<string, string>(
        (completionRequests || [])
          .filter((row: any) => row?.id && row?.unit_id)
          .map((row: any) => [row.id, row.unit_id])
      );

      const damageByUnit = new Map<string, number>();
      (completionReports || []).forEach((report: any) => {
        const requestId = report?.maintenance_request_id;
        const unitId = requestId ? requestUnitById.get(requestId) : undefined;
        if (!unitId) return;
        const status = String(report?.status || '').toLowerCase();
        if (['rejected', 'cancelled', 'void'].includes(status)) return;
        const previous = damageByUnit.get(unitId) || 0;
        const amount = Number(report?.actual_cost ?? report?.cost_estimate ?? 0) || 0;
        damageByUnit.set(unitId, previous + amount);
      });

      // Also include manager dashboard quick-entry damages saved per property
      if (typeof window !== 'undefined') {
        propIds.forEach((propertyId: string) => {
          const raw = window.localStorage.getItem(`manager-vacancy-damages:${propertyId}`);
          if (!raw) return;
          try {
            const localEntries = JSON.parse(raw) as Array<{ unitId?: string; total?: number }>;
            (localEntries || []).forEach((entry) => {
              if (!entry?.unitId) return;
              const previous = damageByUnit.get(entry.unitId) || 0;
              damageByUnit.set(entry.unitId, previous + (Number(entry.total) || 0));
            });
          } catch {
            // Ignore malformed local entries
          }
        });
      }

      const unitById = new Map<string, any>((units || []).map((unit: any) => [unit.id, unit]));
      const billingByUnit = new Map<string, BillingRecord>(billingRecords.map((record) => [record.unit_id, record]));

      const mappedRefundCases: DepositRefundCase[] = (vacancyNotices || []).map((notice: any) => {
        const unit = unitById.get(notice.unit_id);
        const billing = billingByUnit.get(notice.unit_id);
        const tenant = unit?.tenants?.find((t: any) => t?.id === notice.tenant_id || t?.user_id === notice.tenant_id) || unit?.tenants?.[0];

        return {
          id: notice.id,
          unitNumber: String(unit?.unit_number || '-'),
          tenantName: tenant ? `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() : (billing?.tenant_name || 'Former Tenant'),
          propertyName: managerProps?.find((p: any) => p.id === notice.property_id)?.name || billing?.property_name || 'N/A',
          noticeDate: notice.updated_at || notice.created_at,
          moveOutDate: notice.move_out_date,
          status: notice.status,
          securityDeposit: Number(billing?.monthly_rent || unit?.price || 0),
          rentArrears: Number(billing?.rent_arrears || 0),
          billNameArrears: Number((billing?.water_bill_arrears || 0) + (billing?.utilities_arrears || 0)),
          autoChecklistDamages: Number(damageByUnit.get(notice.unit_id) || 0),
        };
      });

      setRefundCases(mappedRefundCases);

      // Calculate stats
      const totalExpected = billingRecords.reduce((sum, b) => sum + (b.monthly_rent + b.water_bill + b.other_utilities), 0);
      const totalPaid = billingRecords.reduce((sum, b) => sum + b.total_paid, 0);
      const totalArrears = billingRecords.reduce((sum, b) => sum + b.total_arrears, 0);
      const totalOverpayment = billingRecords.reduce((sum, b) => sum + b.overpayment, 0);
      const unitsWithArrears = billingRecords.filter(b => b.total_arrears > 0).length;

      setStats({
        totalExpected,
        totalPaid,
        totalArrears,
        totalOverpayment,
        unitsWithArrears,
      });
    } catch (err) {
      console.error('Error fetching billings:', err);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const filteredBillings = billings.filter(b => {
    const matchesSearch = 
      b.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.unit_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProperty = filterProperty === 'all' || b.property_id === filterProperty;
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'paid' && b.total_arrears === 0) ||
      (filterStatus === 'arrears' && b.total_arrears > 0) ||
      (filterStatus === 'overpaid' && b.overpayment > 0);

    return matchesSearch && matchesProperty && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#00356B]" />
          <p className="text-gray-600">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight">Billing & Invoicing</h1>
          <p className="text-gray-600 text-[13px] font-medium">Rent, bill names, and payment tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expected</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalExpected)}</div>
            <p className="text-xs text-gray-500">All charges</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPaid)}</div>
            <p className="text-xs text-gray-500">Received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Arrears</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalArrears)}</div>
            <p className="text-xs text-gray-500">{stats.unitsWithArrears} units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overpayment</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalOverpayment)}</div>
            <p className="text-xs text-gray-500">Credit balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalExpected > 0 ? `${Math.round((stats.totalPaid / stats.totalExpected) * 100)}%` : '0%'}
            </div>
            <p className="text-xs text-gray-500">Payment efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Billing Details</CardTitle>
              <CardDescription>{filteredBillings.length} units found</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Search units..." 
                  className="pl-9 w-full sm:w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={filterProperty}
                onChange={(e) => setFilterProperty(e.target.value)}
              >
                <option value="all">All Properties</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="arrears">With Arrears</option>
                <option value="overpaid">Overpaid</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Unit Type</TableHead>
                  <TableHead>Unit #</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Monthly Rent</TableHead>
                  <TableHead className="text-right">Paid Rent</TableHead>
                  <TableHead className="bg-yellow-50 text-right">Rent Arrears</TableHead>
                  <TableHead className="text-right">Water Bill</TableHead>
                  <TableHead className="text-right">Paid Water</TableHead>
                  <TableHead className="text-right">Water Arrears</TableHead>
                  <TableHead className="text-right">Other Bill Names</TableHead>
                  <TableHead className="text-right">Paid Bill Names</TableHead>
                  <TableHead className="text-right">Bill Name Arrears</TableHead>
                  <TableHead className="bg-red-50 text-right font-bold">Total Arrears</TableHead>
                  <TableHead className="bg-emerald-50 text-right">Overpayment</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBillings.map((billing) => (
                  <TableRow key={billing.id} className={billing.total_arrears > 0 ? 'bg-red-50' : ''}>
                    <TableCell className="font-semibold">{billing.unit_type}</TableCell>
                    <TableCell className="font-bold text-[#00356B]">{billing.unit_number}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="font-medium">{billing.tenant_name}</p>
                        <p className="text-gray-500">{billing.tenant_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(billing.monthly_rent)}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-semibold">{formatCurrency(billing.paid_rent)}</TableCell>
                    <TableCell className="bg-yellow-100 text-right font-bold text-amber-700">{formatCurrency(billing.rent_arrears)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(billing.water_bill)}</TableCell>
                    <TableCell className="text-right text-emerald-600">{formatCurrency(billing.paid_water_bill)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(billing.water_bill_arrears)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(billing.other_utilities)}</TableCell>
                    <TableCell className="text-right text-emerald-600">{formatCurrency(billing.paid_utilities)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(billing.utilities_arrears)}</TableCell>
                    <TableCell className="bg-red-200 text-right font-black text-red-800">{formatCurrency(billing.total_arrears)}</TableCell>
                    <TableCell className="bg-emerald-100 text-right font-semibold text-emerald-700">{formatCurrency(billing.overpayment)}</TableCell>
                    <TableCell className="text-xs">
                      {billing.payment_date ? new Date(billing.payment_date).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      {billing.total_arrears === 0 && billing.overpayment === 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-800">Balanced</Badge>
                      ) : billing.overpayment > 0 ? (
                        <Badge className="bg-blue-100 text-blue-800">Overpaid</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Arrears</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DepositRefundSheet
        cases={refundCases}
        title="Deposit Refund Sheet"
        description="Auto-generated when a vacancy notice is received. Includes manager checklist damages and manual repair deductions: (cost per item x quantity) + labour cost."
      />
    </div>
  );
};

export default BillingAndInvoicing;
