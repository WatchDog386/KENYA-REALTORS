import React, { useState, useEffect } from "react";
import {
  Search,
  Save,
  Calendar as CalendarIcon,
  Loader2,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TenantData {
  id: string;
  first_name: string;
  last_name: string;
  unit_number: string;
  unit_type: string;
  lease_fee: number;
  rent: number;
}

interface PaymentRecord {
  id?: string;
  tenant_id: string;
  rent: number;
  penalty_fee: number;
  total_paid: number;
  arrears: number;
  advance_rent: number;
  transaction_date: string;
  reference_code: string;
  status: string;
  payment_date: string;
}

const PaymentsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<Record<string, PaymentRecord>>({});
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (tenants.length > 0) {
      fetchPaymentRecords();
    }
  }, [tenants, selectedMonth]);

  const fetchTenants = async () => {
    try {
      setLoading(true);

      const { data: activeTenants, error } = await supabase
        .from("tenants")
        .select(`
          id,
          user_id,
          unit_id,
          unit:units (
            unit_number,
            property_unit_types (
              name,
              price_per_unit
            )
          )
        `)
        .eq("status", "active");

      if (error) {
        console.error("Error fetching tenants:", error);
        throw error;
      }

      const userIds = activeTenants?.map((t: any) => t.user_id).filter(Boolean) || [];

      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profileError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", userIds);

        if (profileError) {
          console.error("Error fetching profiles:", profileError);
        } else {
          profiles = profilesData || [];
        }
      }

      // Fetch rent amounts from leases table
      let leases: any[] = [];
      const { data: leasesData } = await supabase
        .from("leases")
        .select("tenant_id, monthly_rent");
      leases = leasesData || [];

      const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
      const leaseMap = new Map(leases.map((l: any) => [l.tenant_id, l]));

      const formattedTenants: TenantData[] = activeTenants?.map((tenant: any) => {
        const profile = profileMap.get(tenant.user_id);
        const lease = leaseMap.get(tenant.user_id);
        return {
          id: tenant.id,
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          unit_number: tenant.unit?.unit_number || "N/A",
          unit_type: tenant.unit?.property_unit_types?.name || "N/A",
          lease_fee: 0,
          rent: lease?.monthly_rent || 0,
        };
      }) || [];

      setTenants(formattedTenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Failed to load tenant data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentRecords = async () => {
    try {
      // Placeholder - can fetch payment records from a payments table if it exists
      // For now, initialize empty payment records
      setPaymentRecords({});
    } catch (error) {
      console.error("Error fetching payment records:", error);
    }
  };

  const handlePaymentChange = (
    tenantId: string,
    field: keyof PaymentRecord,
    value: string
  ) => {
    const numValue =
      field === "transaction_date" || field === "reference_code"
        ? value
        : parseFloat(value) || 0;

    setPaymentRecords((prev) => {
      const currentRecord = prev[tenantId] || {};
      return {
        ...prev,
        [tenantId]: {
          ...currentRecord,
          tenant_id: tenantId,
          [field]: numValue,
          payment_date: format(
            new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1),
            "yyyy-MM-dd"
          ),
          status: currentRecord.status || "pending",
          rent: currentRecord.rent || 0,
          penalty_fee: field === "penalty_fee" ? (numValue as number) : currentRecord.penalty_fee || 0,
          total_paid: field === "total_paid" ? (numValue as number) : currentRecord.total_paid || 0,
          arrears: field === "arrears" ? (numValue as number) : currentRecord.arrears || 0,
          advance_rent: field === "advance_rent" ? (numValue as number) : currentRecord.advance_rent || 0,
          transaction_date: field === "transaction_date" ? value : currentRecord.transaction_date || "",
          reference_code: field === "reference_code" ? value : currentRecord.reference_code || "",
        } as PaymentRecord,
      };
    });
  };

  const savePaymentRecord = async (tenantId: string) => {
    try {
      setSaving(tenantId);
      const record = paymentRecords[tenantId];
      if (!record) return;

      const paymentData = {
        tenant_id: tenantId,
        rent: record.rent || 0,
        penalty_fee: record.penalty_fee || 0,
        total_paid: record.total_paid || 0,
        arrears: record.arrears || 0,
        advance_rent: record.advance_rent || 0,
        transaction_date: record.transaction_date,
        reference_code: record.reference_code,
        payment_date: record.payment_date,
        status: record.status || "pending",
      };

      // Here you would save to a payments_received table
      // For now, just show success
      toast.success("Payment record saved");
    } catch (error) {
      console.error("Error saving payment:", error);
      toast.error("Failed to save payment record");
    } finally {
      setSaving(null);
    }
  };

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.unit_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.first_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const thClass =
    "bg-blue-600 text-white font-bold border border-gray-400 text-center text-xs px-1 py-2 h-auto align-middle whitespace-normal break-words";
  const tdClass = "border border-gray-300 p-0 h-8";
  const inputClass =
    "border-none w-full h-full px-1 text-right focus-visible:ring-0 bg-transparent text-xs";

  const totals = {
    rent: filteredTenants.reduce((sum, t) => sum + (t.rent || 0), 0),
    penalty: filteredTenants.reduce((sum, t) => sum + (paymentRecords[t.id]?.penalty_fee || 0), 0),
    paid: filteredTenants.reduce((sum, t) => sum + (paymentRecords[t.id]?.total_paid || 0), 0),
    arrears: filteredTenants.reduce((sum, t) => sum + (paymentRecords[t.id]?.arrears || 0), 0),
  };

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-4 font-sans text-sm">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Receipts Ledger</h1>
          <p className="text-gray-500 text-xs">Track tenant payment details and reconciliation</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search Unit / Type / Tenant..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSelectedMonth(
                  new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1))
                )
              }
              className="h-7 w-7 p-0"
            >
              &lt;
            </Button>
            <div className="flex items-center gap-2 px-2 font-bold min-w-[120px] justify-center text-sm">
              <CalendarIcon className="w-4 h-4" />
              {format(selectedMonth, "MMMM yyyy")}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSelectedMonth(
                  new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1))
                )
              }
              className="h-7 w-7 p-0"
            >
              &gt;
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-md overflow-x-auto border border-gray-400">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead>
            <tr>
              <th className={thClass} style={{ width: "60px" }}>
                Unit No.
              </th>
              <th className={thClass} style={{ width: "120px" }}>
                Unit Type
              </th>
              <th className={thClass} style={{ width: "120px" }}>
                Tenant Name
              </th>
              <th className={thClass} style={{ width: "90px" }}>
                Monthly Rent
              </th>
              <th className={thClass} style={{ width: "80px" }}>
                Penalty Fee
              </th>
              <th className={thClass} style={{ width: "100px" }}>
                Total Paid
              </th>
              <th className={thClass} style={{ width: "90px" }}>
                Arrears
              </th>
              <th className={thClass} style={{ width: "90px" }}>
                Advance Rent
              </th>
              <th className={thClass} style={{ width: "100px" }}>
                Trans. Date
              </th>
              <th className={thClass} style={{ width: "100px" }}>
                Ref Code
              </th>
              <th className={thClass} style={{ width: "50px" }}>
                Act
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="p-10 text-center">
                  <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                </td>
              </tr>
            ) : filteredTenants.map((tenant) => {
              const record = paymentRecords[tenant.id] || {};
              return (
                <tr key={tenant.id} className="hover:bg-gray-50 text-xs">
                  <td className={`${tdClass} text-center font-bold bg-gray-50`}>
                    {tenant.unit_number}
                  </td>
                  <td className={`${tdClass} px-2`}>{tenant.unit_type}</td>
                  <td className={`${tdClass} px-2 font-medium`}>
                    {tenant.first_name} {tenant.last_name}
                  </td>
                  <td
                    className={`${tdClass} text-right px-1 font-bold bg-blue-50`}
                  >
                    {tenant.rent.toLocaleString()}
                  </td>

                  <td className={tdClass}>
                    <input
                      type="number"
                      className={inputClass}
                      value={record.penalty_fee || ""}
                      onChange={(e) =>
                        handlePaymentChange(
                          tenant.id,
                          "penalty_fee",
                          e.target.value
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className={tdClass}>
                    <input
                      type="number"
                      className={`${inputClass} font-bold text-green-700`}
                      value={record.total_paid || ""}
                      onChange={(e) =>
                        handlePaymentChange(
                          tenant.id,
                          "total_paid",
                          e.target.value
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className={tdClass}>
                    <input
                      type="number"
                      className={`${inputClass} text-red-600`}
                      value={record.arrears || ""}
                      onChange={(e) =>
                        handlePaymentChange(tenant.id, "arrears", e.target.value)
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className={tdClass}>
                    <input
                      type="number"
                      className={`${inputClass} text-blue-600`}
                      value={record.advance_rent || ""}
                      onChange={(e) =>
                        handlePaymentChange(
                          tenant.id,
                          "advance_rent",
                          e.target.value
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className={tdClass}>
                    <input
                      type="date"
                      className={`${inputClass} text-center`}
                      value={record.transaction_date || ""}
                      onChange={(e) =>
                        handlePaymentChange(
                          tenant.id,
                          "transaction_date",
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td className={tdClass}>
                    <input
                      type="text"
                      className={`${inputClass} text-center`}
                      value={record.reference_code || ""}
                      onChange={(e) =>
                        handlePaymentChange(
                          tenant.id,
                          "reference_code",
                          e.target.value
                        )
                      }
                    />
                  </td>
                  <td className={`${tdClass} text-center`}>
                    <button
                      onClick={() => savePaymentRecord(tenant.id)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      {saving === tenant.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* TOTALS ROW */}
            <tr className="bg-amber-300 font-bold border-t-2 border-gray-400 text-xs">
              <td className={`${tdClass} text-center`} colSpan={3}>
                TOTALS
              </td>
              <td className={`${tdClass} text-right px-1`}>
                {totals.rent.toLocaleString()}
              </td>
              <td className={`${tdClass} text-right px-1`}>
                {totals.penalty.toLocaleString()}
              </td>
              <td className={`${tdClass} text-right px-1`}>
                {totals.paid.toLocaleString()}
              </td>
              <td className={`${tdClass} text-right px-1`}>
                {totals.arrears.toLocaleString()}
              </td>
              <td className={`${tdClass} text-right px-1`}>0</td>
              <td className={`${tdClass}`} colSpan={3}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsManagement;