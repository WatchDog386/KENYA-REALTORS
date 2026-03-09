import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Zap, AlertCircle, CheckCircle, Droplets } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UtilityReadingPayment {
  id: string;
  unit_number: string;
  tenant_name: string;
  reading_month: string;
  previous_reading: number;
  current_reading: number;
  electricity_rate: number;
  electricity_usage: number;
  electricity_bill: number;
  water_previous_reading: number;
  water_current_reading: number;
  water_rate: number;
  water_usage: number;
  water_bill: number;
  garbage_fee: number;
  security_fee: number;
  service_fee: number;
  custom_utilities: Record<string, number>;
  other_charges: number;
  totalBill: number;
  payment_status: "pending" | "paid" | "partial" | "overdue";
  reading_status: string;
}

export const UtilityReadingsPaymentTracker: React.FC = () => {
  const [readings, setReadings] = useState<UtilityReadingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [expandedReadingId, setExpandedReadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReadingsWithPayments();

    // Setup real-time subscription for utility readings
    const channel = supabase
      .channel('utility_readings_tracker')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'utility_readings',
        },
        () => {
          // Refresh data when changes occur
          fetchReadingsWithPayments();
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchReadingsWithPayments = async () => {
    try {
      setLoading(true);

      // Fetch all utility readings with complete information
      const { data: readingsData, error: readingsError } = await supabase
        .from("utility_readings")
        .select("*")
        .order("reading_month", { ascending: false })
        .limit(100);

      if (readingsError) throw readingsError;

      if (!readingsData) {
        setReadings([]);
        return;
      }

      // Get all unit IDs and fetch unit numbers in batch
      const unitIds = [...new Set(readingsData.map((r: any) => r.unit_id))];
      const tenantIds = [...new Set(readingsData.map((r: any) => r.tenant_id).filter(Boolean))];

      const { data: unitsData = [] } = await supabase
        .from("units")
        .select("id, unit_number")
        .in("id", unitIds);

      const { data: profilesData = [] } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", tenantIds);

      // Create lookup maps
      const unitMap = Object.fromEntries(unitsData.map((u: any) => [u.id, u.unit_number]));
      const profileMap = Object.fromEntries(profilesData.map((p: any) => [p.id, `${p.first_name} ${p.last_name}`]));

      // Enrich with tenant and payment info
      const enrichedReadings = await Promise.all(
        readingsData.map(async (reading: any) => {
          // Use EXACT same calculation as tenant dashboard buildBillsFromReadings
          // Calculate usage as the absolute difference between readings
          const electricityUsage = Math.abs((reading.current_reading || 0) - (reading.previous_reading || 0));
          const electricityRate = reading.electricity_rate || 0;
          const electricityBill = electricityUsage * electricityRate;

          const waterUsage = Math.abs((reading.water_current_reading || 0) - (reading.water_previous_reading || 0));
          const waterRate = reading.water_rate || 0;
          // Water bill is calculated from usage * rate, not from the stored water_bill field
          const waterBill = typeof reading.water_bill === 'number'
            ? Math.abs(reading.water_bill)
            : waterUsage * waterRate;

          // Fixed fees - sum them all
          const garbageFee = Math.abs(reading.garbage_fee || 0);
          const securityFee = Math.abs(reading.security_fee || 0);
          const serviceFee = Math.abs(reading.service_fee || 0);
          const otherCharges = Math.abs(reading.other_charges || 0);

          // Custom utilities
          const customUtilities = reading.custom_utilities || {};
          let customUtilitiesTotal = 0;
          Object.values(customUtilities).forEach(val => {
            customUtilitiesTotal += Math.abs(Number(val) || 0);
          });

          // Total = electricity + water + all fees + custom + other
          const totalBill =
            electricityBill +
            waterBill +
            garbageFee +
            securityFee +
            serviceFee +
            customUtilitiesTotal +
            otherCharges;

          const unitNumber = unitMap[reading.unit_id] || "Unknown";
          const tenantName = reading.tenant_id ? (profileMap[reading.tenant_id] || "Unknown") : "Vacant";

          // Get payment status
          let paymentStatus = "pending";
          if (reading.tenant_id) {
            const { data: payment } = await supabase
              .from("rent_payments")
              .select("status, amount_paid")
              .eq("tenant_id", reading.tenant_id)
              .ilike("remarks", `%Unit: ${unitNumber}%`)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (payment) {
              paymentStatus = payment.status;
            }
          }

          return {
            id: reading.id,
            unit_number: unitNumber,
            tenant_name: tenantName,
            reading_month: reading.reading_month,
            previous_reading: reading.previous_reading || 0,
            current_reading: reading.current_reading || 0,
            electricity_rate: electricityRate,
            electricity_usage: electricityUsage,
            electricity_bill: electricityBill,
            water_previous_reading: reading.water_previous_reading || 0,
            water_current_reading: reading.water_current_reading || 0,
            water_rate: waterRate,
            water_usage: waterUsage,
            water_bill: waterBill,
            garbage_fee: garbageFee,
            security_fee: securityFee,
            service_fee: serviceFee,
            custom_utilities: customUtilities,
            other_charges: otherCharges,
            totalBill,
            payment_status: paymentStatus as any,
            reading_status: reading.status,
          };
        })
      );

      setReadings(enrichedReadings);

      // Calculate total pending
      const pending = enrichedReadings
        .filter((r) => r.payment_status === "pending")
        .reduce((sum, r) => sum + r.totalBill, 0);
      setTotalPending(pending);
    } catch (err: any) {
      console.error("Error fetching readings:", err);
      console.error("Error details:", err.message);
      toast.error("Failed to load utility readings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "partial":
        return "bg-orange-100 text-orange-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Utility Readings & Payments
        </h2>
        <p className="text-gray-500 mt-1">
          Track utility readings and their payment status across all units
        </p>
      </div>

      {totalPending > 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>Pending Collections:</strong> {formatCurrency(totalPending)} in
            unpaid utility bills across {readings.filter((r) => r.payment_status === "pending").length} units
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Recent Readings
          </CardTitle>
          <CardDescription>
            All utility readings and their corresponding payment status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-center">Electricity (Units)</TableHead>
                  <TableHead className="text-center">Electricity Rate</TableHead>
                  <TableHead className="text-right">Electricity Bill</TableHead>
                  <TableHead className="text-center">Water (Units)</TableHead>
                  <TableHead className="text-center">Water Rate</TableHead>
                  <TableHead className="text-right">Water Bill</TableHead>
                  <TableHead className="text-right">Fixed Fees</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                      No utility readings found
                    </TableCell>
                  </TableRow>
                ) : (
                  readings.map((reading) => {
                    const fixedFees = reading.garbage_fee + reading.security_fee + reading.service_fee;
                    const isExpanded = expandedReadingId === reading.id;
                    return (
                      <React.Fragment key={reading.id}>
                        <TableRow className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedReadingId(isExpanded ? null : reading.id)}>
                          <TableCell className="font-medium font-semibold">{reading.unit_number}</TableCell>
                          <TableCell className="text-sm">{reading.tenant_name}</TableCell>
                          <TableCell className="text-sm">{formatDate(reading.reading_month)}</TableCell>
                          <TableCell className="text-center text-sm">
                            <span className="font-medium">{reading.electricity_usage.toFixed(2)}</span>
                            <div className="text-xs text-gray-500">
                              ({reading.previous_reading} → {reading.current_reading})
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            <span className="font-medium">KES {reading.electricity_rate.toFixed(2)}</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(reading.electricity_bill)}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            <span className="font-medium">{reading.water_usage.toFixed(2)}</span>
                            <div className="text-xs text-gray-500">
                              ({reading.water_previous_reading} → {reading.water_current_reading})
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            <span className="font-medium">KES {reading.water_rate.toFixed(2)}</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(reading.water_bill)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            <div className="font-medium">{formatCurrency(fixedFees)}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {reading.garbage_fee > 0 && <div>Garbage: {formatCurrency(reading.garbage_fee)}</div>}
                              {reading.security_fee > 0 && <div>Security: {formatCurrency(reading.security_fee)}</div>}
                              {reading.service_fee > 0 && <div>Service: {formatCurrency(reading.service_fee)}</div>}
                              {reading.other_charges > 0 && <div>Other: {formatCurrency(reading.other_charges)}</div>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-base">
                            <div className="text-blue-600">{formatCurrency(reading.totalBill)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(reading.payment_status)}>
                              {reading.payment_status.charAt(0).toUpperCase() +
                                reading.payment_status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="bg-blue-50 border-l-4 border-l-blue-600">
                            <TableCell colSpan={12} className="p-4">
                              <div className="space-y-4">
                                <div className="font-bold text-blue-900 mb-3">📊 Detailed Bill Breakdown</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Electricity Details */}
                                  <div className="border border-blue-200 rounded-lg p-4 bg-white">
                                    <h4 className="font-bold text-yellow-700 mb-3 flex items-center gap-2">
                                      <Zap size={16} />
                                      Electricity
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-700">Previous Reading:</span>
                                        <span className="font-semibold">{reading.previous_reading} units</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-700">Current Reading:</span>
                                        <span className="font-semibold">{reading.current_reading} units</span>
                                      </div>
                                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                                        <span className="text-gray-700">Usage:</span>
                                        <span className="font-semibold">{reading.electricity_usage.toFixed(2)} units</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-700">Rate per Unit:</span>
                                        <span className="font-semibold">KES {reading.electricity_rate.toFixed(2)}</span>
                                      </div>
                                      <div className="bg-yellow-50 p-2 rounded border border-yellow-200 flex justify-between">
                                        <span className="text-gray-800 font-semibold">Bill Amount:</span>
                                        <span className="font-bold text-yellow-700">{formatCurrency(reading.electricity_bill)}</span>
                                      </div>
                                      <div className="text-xs text-gray-600 mt-2">
                                        Formula: {reading.electricity_usage.toFixed(2)} units × KES {reading.electricity_rate.toFixed(2)}/unit = {formatCurrency(reading.electricity_bill)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Water Details */}
                                  <div className="border border-blue-200 rounded-lg p-4 bg-white">
                                    <h4 className="font-bold text-cyan-700 mb-3 flex items-center gap-2">
                                      <Droplets size={16} />
                                      Water
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-700">Previous Reading:</span>
                                        <span className="font-semibold">{reading.water_previous_reading} units</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-700">Current Reading:</span>
                                        <span className="font-semibold">{reading.water_current_reading} units</span>
                                      </div>
                                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                                        <span className="text-gray-700">Usage:</span>
                                        <span className="font-semibold">{reading.water_usage.toFixed(2)} units</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-700">Rate per Unit:</span>
                                        <span className="font-semibold">KES {reading.water_rate.toFixed(2)}</span>
                                      </div>
                                      <div className="bg-cyan-50 p-2 rounded border border-cyan-200 flex justify-between">
                                        <span className="text-gray-800 font-semibold">Bill Amount:</span>
                                        <span className="font-bold text-cyan-700">{formatCurrency(reading.water_bill)}</span>
                                      </div>
                                      <div className="text-xs text-gray-600 mt-2">
                                        Formula: {reading.water_usage.toFixed(2)} units × KES {reading.water_rate.toFixed(2)}/unit = {formatCurrency(reading.water_bill)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Fixed Fees */}
                                <div className="border border-purple-200 rounded-lg p-4 bg-white">
                                  <h4 className="font-bold text-purple-700 mb-3">Fixed Fees</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {reading.garbage_fee > 0 && (
                                      <div className="border border-gray-200 rounded p-3 text-center">
                                        <div className="text-xs text-gray-600">Garbage Fee</div>
                                        <div className="font-bold text-lg text-gray-800">{formatCurrency(reading.garbage_fee)}</div>
                                      </div>
                                    )}
                                    {reading.security_fee > 0 && (
                                      <div className="border border-gray-200 rounded p-3 text-center">
                                        <div className="text-xs text-gray-600">Security Fee</div>
                                        <div className="font-bold text-lg text-gray-800">{formatCurrency(reading.security_fee)}</div>
                                      </div>
                                    )}
                                    {reading.service_fee > 0 && (
                                      <div className="border border-gray-200 rounded p-3 text-center">
                                        <div className="text-xs text-gray-600">Service Fee</div>
                                        <div className="font-bold text-lg text-gray-800">{formatCurrency(reading.service_fee)}</div>
                                      </div>
                                    )}
                                    {reading.other_charges > 0 && (
                                      <div className="border border-gray-200 rounded p-3 text-center">
                                        <div className="text-xs text-gray-600">Other Charges</div>
                                        <div className="font-bold text-lg text-gray-800">{formatCurrency(reading.other_charges)}</div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Total Summary */}
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
                                  <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold">Total Bill Amount:</span>
                                    <span className="text-3xl font-black">{formatCurrency(reading.totalBill)}</span>
                                  </div>
                                  <div className="mt-3 text-sm text-blue-100">
                                    This amount was calculated by the property manager recording the exact meter readings on {formatDate(reading.reading_month)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
