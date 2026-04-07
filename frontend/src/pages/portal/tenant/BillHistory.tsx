import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  Calendar,
  DollarSign,
  Home,
  TrendingUp,
  Zap,
  FileText,
  ChevronRight,
  Search,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  unit_number?: string;
  property_name?: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue' | 'failed';
  payment_method?: string;
  description?: string;
  created_at: string;
  related_reading_id?: string;
}

interface TenantBillSummary {
  totalBilled: number;
  totalPaid: number;
  totalArrears: number;
  pendingBills: number;
  paidBills: number;
  overdueAmount: number;
}

const TenantBillHistory = () => {
  const { user } = useAuth();
  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReading, setSelectedReading] = useState<UtilityReading | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [summary, setSummary] = useState<TenantBillSummary>({
    totalBilled: 0,
    totalPaid: 0,
    totalArrears: 0,
    pendingBills: 0,
    paidBills: 0,
    overdueAmount: 0,
  });
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [unitInfo, setUnitInfo] = useState<any>(null);

  // Fetch tenant readings and payments
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Fetch tenant info
        const { data: tenantData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone')
          .eq('id', user.id)
          .single();

        if (tenantData) {
          setTenantInfo(tenantData);
        }

        // Fetch utility readings for this tenant
        const { data: readingsData, error: readingsError } = await supabase
          .from('utility_readings')
          .select('*')
          .eq('tenant_id', user.id)
          .order('reading_month', { ascending: false });

        if (readingsError) throw readingsError;

        // Enrich readings with unit and property info
        let enrichedReadings: UtilityReading[] = [];
        if (readingsData && readingsData.length > 0) {
          enrichedReadings = await Promise.all(
            readingsData.map(async (reading: any) => {
              let unitNumber = 'Unknown';
              let propertyName = 'Unknown';

              // Fetch unit info
              const { data: unit } = await supabase
                .from('units')
                .select('unit_number, properties(name)')
                .eq('id', reading.unit_id)
                .single();

              if (unit) {
                unitNumber = unit.unit_number;
                propertyName = (unit.properties as any)?.name || 'Unknown';
              }

              // Calculate electricity bill if not already calculated
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

              const totalBill =
                electricityBill +
                waterBill +
                reading.garbage_fee +
                reading.security_fee +
                (reading.service_fee || 0) +
                customUtilitiesTotal +
                reading.other_charges;

              return {
                ...reading,
                electricity_usage: electricityUsage,
                electricity_bill: electricityBill,
                total_bill: totalBill,
                unit_number: unitNumber,
                property_name: propertyName,
              };
            })
          );

          setReadings(enrichedReadings);

          // If no unit info set yet, set it from first reading
          if (enrichedReadings.length > 0 && !unitInfo) {
            setUnitInfo({
              unit_number: enrichedReadings[0].unit_number,
              property_name: enrichedReadings[0].property_name,
            });
          }

          // Calculate summary
          const paidReadings = enrichedReadings.filter(r => r.status === 'paid');
          const pendingReadings = enrichedReadings.filter(r => r.status === 'pending');
          const totalBilled = enrichedReadings.reduce((sum, r) => sum + (r.total_bill || 0), 0);
          const totalPaid = paidReadings.reduce((sum, r) => sum + (r.total_bill || 0), 0);
          const totalArrears = pendingReadings.reduce((sum, r) => sum + (r.total_bill || 0), 0);

          setSummary({
            totalBilled,
            totalPaid,
            totalArrears,
            pendingBills: pendingReadings.length,
            paidBills: paidReadings.length,
            overdueAmount: totalArrears, // Simplified - in real scenario, check due dates
          });
        }

        // Fetch payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('tenant_id', user.id)
          .order('payment_date', { ascending: false });

        if (paymentsError && paymentsError.code !== 'PGRST116') {
          console.error('Error fetching payments:', paymentsError);
        } else if (paymentsData) {
          setPayments(paymentsData);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load bill information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const handleDownloadBill = (reading: UtilityReading) => {
    let customUtilitiesText = '';
    if (reading.custom_utilities) {
      Object.entries(reading.custom_utilities).forEach(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        customUtilitiesText += `${formattedKey.padEnd(40)} KES ${Number(value || 0).toFixed(2)}\n`;
      });
    }

    const billContent = `
================================
     UTILITY BILL STATEMENT
================================

TENANT INFORMATION:
Name: ${tenantInfo?.first_name} ${tenantInfo?.last_name}
Email: ${tenantInfo?.email}
Phone: ${tenantInfo?.phone}

PROPERTY & UNIT:
Property: ${reading.property_name}
Unit: ${reading.unit_number}

METER READINGS:
Month: ${new Date(reading.reading_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
Electricity Previous Reading: ${reading.previous_reading.toFixed(2)}
Electricity Current Reading: ${reading.current_reading.toFixed(2)}
Electricity Usage: ${reading.electricity_usage?.toFixed(2)} units

Water Previous Reading: ${(reading.water_previous_reading || 0).toFixed(2)}
Water Current Reading: ${(reading.water_current_reading || 0).toFixed(2)}
Water Usage: ${Math.abs((reading.water_current_reading || 0) - (reading.water_previous_reading || 0)).toFixed(2)} units

CHARGE BREAKDOWN:
Electricity (${reading.electricity_usage?.toFixed(2)} units @ KES ${reading.electricity_rate}):  KES ${reading.electricity_bill?.toFixed(2)}
Water (${Math.abs((reading.water_current_reading || 0) - (reading.water_previous_reading || 0)).toFixed(2)} units @ KES ${reading.water_rate || 0}):  KES ${reading.water_bill.toFixed(2)}
Garbage Fee:                              KES ${reading.garbage_fee.toFixed(2)}
Security Fee:                             KES ${reading.security_fee.toFixed(2)}
Service Fee:                              KES ${(reading.service_fee || 0).toFixed(2)}
${customUtilitiesText}Other Charges:                            KES ${reading.other_charges.toFixed(2)}

================================
TOTAL AMOUNT DUE:                  KES ${reading.total_bill?.toFixed(2)}
================================

Status: ${reading.status === 'paid' ? 'PAID' : 'PENDING'}

Generated: ${new Date().toLocaleDateString('en-US')}
================================
    Thank you for your payment!
================================
`;

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(billContent)
    );
    element.setAttribute(
      'download',
      `Bill_${new Date(reading.reading_month).toISOString().split('T')[0]}.txt`
    );
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success('Bill downloaded successfully');
  };

  const filteredReadings = readings.filter(r => {
    let matches = true;

    if (searchTerm) {
      const month = new Date(r.reading_month).toLocaleDateString();
      matches = month.includes(searchTerm);
    }

    if (filterStatus !== 'all') {
      matches = matches && r.status === filterStatus;
    }

    return matches;
  });

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
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
          <FileText className="w-10 h-10 text-blue-600" />
          Bill History & Statements
        </h1>
        <p className="text-slate-600 mt-2">
          View your utility bills and payment history
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Billed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                KES {summary.totalBilled.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">All time</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Total Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                KES {summary.totalPaid.toFixed(2)}
              </div>
              <p className="text-xs text-green-600 mt-1">{summary.paidBills} bills</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700">
                Outstanding Bills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                KES {summary.totalArrears.toFixed(2)}
              </div>
              <p className="text-xs text-red-600 mt-1">{summary.pendingBills} bills</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Payment Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {summary.totalBilled > 0
                  ? ((summary.totalPaid / summary.totalBilled) * 100).toFixed(1)
                  : '0'}
                %
              </div>
              <p className="text-xs text-slate-500 mt-1">of total bills paid</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Arrears Alert */}
      {summary.totalArrears > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Outstanding Balance</AlertTitle>
          <AlertDescription>
            You have KES {summary.totalArrears.toFixed(2)} in outstanding bills.
            Please make payment to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      {/* Bills List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Utility Bills</CardTitle>
              <CardDescription>
                View and download your monthly utility bills
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">
                Property: {unitInfo?.property_name}
              </p>
              <p className="text-sm text-slate-600">Unit: {unitInfo?.unit_number}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 pb-4 border-b">
            <div className="flex-1 min-w-[150px]">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="all">All Bills</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Bills Display */}
          {filteredReadings.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg">No bills found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReadings.map((reading, idx) => (
                <motion.div
                  key={reading.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition cursor-pointer"
                  onClick={() => setSelectedReading(reading)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-blue-100 rounded-lg p-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">
                          {new Date(reading.reading_month).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </h3>
                        <div className="text-sm text-slate-600 mt-1">
                          <p>Usage: {reading.electricity_usage?.toFixed(2)} units</p>
                          <p>
                            Reading: {reading.previous_reading.toFixed(2)} →{' '}
                            {reading.current_reading.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="font-bold text-slate-900 text-lg">
                          KES {reading.total_bill?.toFixed(2)}
                        </p>
                        <Badge
                          variant={reading.status === 'paid' ? 'default' : 'outline'}
                          className="mt-2"
                        >
                          {reading.status === 'paid' ? (
                            <CheckCircle2 size={14} className="mr-1" />
                          ) : null}
                          {reading.status}
                        </Badge>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDownloadBill(reading);
                        }}
                        className="p-2 hover:bg-blue-100 rounded text-blue-600 transition"
                        title="Download Bill"
                      >
                        <Download size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bill Details Modal */}
      {selectedReading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedReading(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <CardHeader className="border-b">
              <CardTitle>
                Bill for{' '}
                {new Date(selectedReading.reading_month).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </CardTitle>
              <CardDescription>
                {selectedReading.property_name} - Unit {selectedReading.unit_number}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Meter Reading Info */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Electricity Reading</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm text-slate-600">Previous Reading</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedReading.previous_reading.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm text-slate-600">Current Reading</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedReading.current_reading.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Usage:</strong> {selectedReading.electricity_usage?.toFixed(2)}{' '}
                    units
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Water Reading</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm text-slate-600">Previous Reading</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {(selectedReading.water_previous_reading || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm text-slate-600">Current Reading</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {(selectedReading.water_current_reading || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Usage:</strong> {Math.abs((selectedReading.water_current_reading || 0) - (selectedReading.water_previous_reading || 0)).toFixed(2)}{' '}
                    units
                  </p>
                </div>
              </div>

              {/* Charges Breakdown */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Charge Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      Electricity ({selectedReading.electricity_usage?.toFixed(2)} units @
                      KES {selectedReading.electricity_rate})
                    </span>
                    <span className="font-semibold">
                      KES {selectedReading.electricity_bill?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      Water ({Math.abs((selectedReading.water_current_reading || 0) - (selectedReading.water_previous_reading || 0)).toFixed(2)} units @
                      KES {selectedReading.water_rate || 0})
                    </span>
                    <span className="font-semibold">
                      KES {selectedReading.water_bill.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Garbage Fee</span>
                    <span className="font-semibold">
                      KES {selectedReading.garbage_fee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Security Fee</span>
                    <span className="font-semibold">
                      KES {selectedReading.security_fee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Service Fee</span>
                    <span className="font-semibold">
                      KES {(selectedReading.service_fee || 0).toFixed(2)}
                    </span>
                  </div>
                  {selectedReading.custom_utilities && Object.entries(selectedReading.custom_utilities).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-semibold">
                        KES {Number(value || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Other Charges</span>
                    <span className="font-semibold">
                      KES {selectedReading.other_charges.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-base font-bold text-slate-900">
                    <span>Total Amount Due</span>
                    <span>KES {selectedReading.total_bill?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                {selectedReading.status === 'paid' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-600">Bill Paid</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-600">Payment Pending</span>
                  </>
                )}
              </div>
            </CardContent>

            <CardFooter className="gap-3 justify-between">
              <Button variant="outline" onClick={() => setSelectedReading(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  handleDownloadBill(selectedReading);
                  setSelectedReading(null);
                }}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Download size={18} />
                Download Bill
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TenantBillHistory;
