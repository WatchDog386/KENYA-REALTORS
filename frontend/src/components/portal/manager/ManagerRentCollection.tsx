import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Loader2, Calendar, FileText, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatCurrency";

interface BillingRow {
  unit_id: string;
  unit_number: string;
  unit_type: string;
  monthly_rent: number;
  
  // Water Bill
  water_bill_id?: string;
  water_bill_amount: number;
  paid_water_bill: number;
  water_bill_arrears: number;

  // Rent
  rent_payment_id?: string;
  expected_rent: number;
  paid_rent: number;
  rent_arrears: number;

  total_arrears: number;
  payment_date: string;
  remarks: string;
  
  // Status check
  tenant_id?: string;
  status?: string;
}

const ManagerRentCollection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [propertyId, setPropertyId] = useState<string>('');
  const [propertyName, setPropertyName] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBillingData();
  }, [user?.id, selectedMonth]);

  // Realtime subscription for auto-updates
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
          filter: `property_id=eq.${propertyId}`
        },
        () => {
          loadBillingData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills_and_utilities',
          filter: `property_id=eq.${propertyId}`
        },
        () => {
          loadBillingData();
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
      
      // 1. Get Manager's Property
      const { data: assignments, error: assignError } = await supabase
        .from('property_manager_assignments')
        .select('property_id, properties(name)')
        .eq('property_manager_id', user.id)
        .eq('status', 'active')
        .single();

      if (assignError || !assignments) {
        toast.error('No active property assignment found');
        setLoading(false);
        return;
      }

      setPropertyId(assignments.property_id);
      setPropertyName(assignments.properties?.name || 'Managed Property');

      // 2. Fetch ALL Units with Type Info and Leases
      // Using left join to leases manually or verify filtered lease
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select(`
          id, unit_number, status, property_id,
          property_unit_types (name, price_per_unit),
          leases:tenant_leases (tenant_id, rent_amount, status)
        `)
        .eq('property_id', assignments.property_id)
        .order('unit_number');

      if (unitsError) {
          console.error("Units fetch error:", unitsError);
          // throw unitsError; // Don't crash, just log.
      }
      
      const safeUnits = units || [];

      // 3. Fetch Rent Payments and Bills for the selected month
      const startOfMonth = `${selectedMonth}-01`;
      const dateObj = new Date(startOfMonth);
      const nextMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 1);
      const endOfMonth = nextMonth.toISOString().split('T')[0];

      const { data: rentPayments, error: rentError } = await supabase
        .from('rent_payments')
        .select('*')
        .eq('property_id', assignments.property_id)
        .gte('due_date', startOfMonth)
        .lt('due_date', endOfMonth);
        
      if (rentError) console.error("Rent fetch error:", rentError);

      const { data: bills, error: billsError } = await supabase
        .from('bills_and_utilities')
        .select('*')
        .eq('property_id', assignments.property_id)
        .eq('bill_type', 'water')
        .gte('bill_period_start', startOfMonth)
        .lt('bill_period_start', endOfMonth);
        
      if (billsError) console.error("Bills fetch error:", billsError);

      // 4. Merge Data
      const processedRows: BillingRow[] = safeUnits.map((unit: any) => {
        // Active lease check: check explicit 'active' status
        // Note: unit.leases comes from 'tenant_leases' table now (based on assumption) or 'leases' is correct?
        // Let's use flexible check.
        const leasesList = Array.isArray(unit.leases) ? unit.leases : [];
        const activeLease = leasesList.find((l: any) => l.status === 'active');
        
        const unitType = unit.property_unit_types?.name || 'Standard';
        // Base rent from lease OR unit type price
        const monthlyRent = activeLease?.rent_amount || unit.property_unit_types?.price_per_unit || 0;

        // ... rest calculation...
        // Find records
        const rentRecord = rentPayments?.find((r: any) => r.unit_id === unit.id);
        const waterRecord = bills?.find((b: any) => b.unit_id === unit.id);

        // Water Calcs
        const waterBillAmount = waterRecord?.amount || 0;
        const paidWaterBill = waterRecord?.paid_amount || 0;
        const waterArrears = waterBillAmount - paidWaterBill;

        // Rent Calcs
        const expectedRent = rentRecord?.amount || monthlyRent; // Use record amount if generated, else mock expected
        const paidRent = rentRecord?.amount_paid || 0;
        
        // If lease exists, expect rent. 
        // If NO active lease, unit is Vacant -> Expect 0 rent unless manually overridden in DB
        const isVacant = !activeLease;
        // NOTE: We rely on activeLease presence. If status is NOT 'active' in DB, it's not active.

        const finalExpectedRent = isVacant ? 0 : expectedRent;
        const rentArrears = finalExpectedRent - paidRent;
        
        // Determine display status
        const statusDisplay = activeLease ? 'Occupied' : (unit.status === 'maintenance' ? 'Maintenance' : 'Vacant');

        return {
          unit_id: unit.id,
          unit_number: unit.unit_number,
          unit_type: unitType,
          monthly_rent: monthlyRent,
          
          water_bill_id: waterRecord?.id,
          water_bill_amount: waterBillAmount,
          paid_water_bill: paidWaterBill,
          water_bill_arrears: Math.max(0, waterArrears),

          rent_payment_id: rentRecord?.id,
          expected_rent: finalExpectedRent,
          paid_rent: paidRent,
          rent_arrears: Math.max(0, rentArrears),

          total_arrears: Math.max(0, waterArrears + rentArrears),
          payment_date: rentRecord?.paid_date || waterRecord?.updated_at || '-',
          remarks: rentRecord?.remarks || waterRecord?.remarks || statusDisplay,
          
          tenant_id: activeLease?.tenant_id,
          status: isVacant ? 'Vacant' : (rentArrears <= 0 && waterArrears <= 0 ? 'Paid' : 'Arrears')
        };
      });

      setRows(processedRows);

    } catch (err) {
      console.error('Error loading billing data:', err);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (row: BillingRow, field: string, value: any) => {
    try {
      
      // We store temporary input state if needed but syncing whole row state is simpler for now
      setRows(prev => prev.map(r => {
        if (r.unit_id === row.unit_id) {
            // Local state recalculation
            
            // 1. Get numeric value (preserve 0 for logic, but might handle 'empty' visually via conditional rendering if needed)
            const numericVal = value === '' ? 0 : value; // field is string for remarks, but numbers here comes from updateRecord? No updateRecord takes any.
            // Wait, updateRecord is called by onBlur. I need to change this logic to onChange.
            return r; // Placeholder
        }
        return r;
      }));
      // ... existing code ...
    } catch (error) {
       // ...
    }
  };

  const handleChange = (unitId: string, field: string, value: string) => {
    setRows(prev => prev.map(row => {
        if (row.unit_id !== unitId) return row;

        const newRow = { ...row };
        if (field === 'remarks') {
            newRow.remarks = value;
            return newRow;
        }

        const numValue = value === '' ? 0 : parseFloat(value);
        if (isNaN(numValue)) return row; // validation

        if (field === 'water_bill_amount') {
            newRow.water_bill_amount = numValue;
            newRow.water_bill_arrears = Math.max(0, numValue - newRow.paid_water_bill);
        } else if (field === 'paid_water_bill') {
            newRow.paid_water_bill = numValue;
            newRow.water_bill_arrears = Math.max(0, newRow.water_bill_amount - numValue);
        } else if (field === 'paid_rent') {
            newRow.paid_rent = numValue;
            newRow.rent_arrears = Math.max(0, newRow.expected_rent - numValue);
        }
        
        newRow.total_arrears = newRow.water_bill_arrears + newRow.rent_arrears;
        return newRow;
    }));
  };

  const handleBlur = (row: BillingRow, field: string, e: React.FocusEvent<HTMLInputElement>) => {
      // Trigger save
      updateRecord(row, field, (row as any)[field]);
  };


  const filteredRows = rows.filter(row => 
     row.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
     row.remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
     row.unit_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate Totals
  const totalStats = filteredRows.reduce((acc, row) => ({
      monthlyRent: acc.monthlyRent + row.monthly_rent,
      paidWater: acc.paidWater + row.paid_water_bill,
      waterArrears: acc.waterArrears + row.water_bill_arrears,
      paidRent: acc.paidRent + row.paid_rent,
      rentArrears: acc.rentArrears + row.rent_arrears,
      totalArrears: acc.totalArrears + row.total_arrears
  }), { monthlyRent: 0, paidWater: 0, waterArrears: 0, paidRent: 0, rentArrears: 0, totalArrears: 0 });

  return (
    <div className="min-h-screen bg-slate-50 py-4 px-2">
        <div className="w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 px-2">
                <div>
                   <div className="flex items-center gap-3 mb-1">
                       <DollarSign className="w-6 h-6 text-blue-600" />
                       <h1 className="text-2xl font-bold text-slate-900">Billing & Collections</h1>
                   </div>
                   <p className="text-sm text-slate-600">
                       Managing payments for <span className="font-semibold text-blue-700">{propertyName}</span>
                   </p>
                </div>
                
                <div className="flex items-center gap-3 bg-white p-1.5 rounded border border-slate-300 shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <Input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-transparent border-none focus-visible:ring-0 w-36 h-8 text-sm"
                    />
                </div>
            </div>

            {/* Stats Summary - Compact Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 px-2">
                <Card className="bg-white border rounded shadow-sm">
                    <CardHeader className="py-2 px-3"><CardTitle className="text-xs font-semibold uppercase text-slate-500">Monthly Rent (Exp)</CardTitle></CardHeader>
                    <CardContent className="py-1 px-3 pb-3"><div className="text-xl font-bold text-slate-800">{formatCurrency(totalStats.monthlyRent)}</div></CardContent>
                </Card>
                <Card className="bg-white border rounded shadow-sm">
                    <CardHeader className="py-2 px-3"><CardTitle className="text-xs font-semibold uppercase text-slate-500">Total Collected</CardTitle></CardHeader>
                    <CardContent className="py-1 px-3 pb-3">
                        <div className="text-xl font-bold text-green-600">{formatCurrency(totalStats.paidRent + totalStats.paidWater)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-white border rounded shadow-sm">
                    <CardHeader className="py-2 px-3"><CardTitle className="text-xs font-semibold uppercase text-slate-500">Total Arrears</CardTitle></CardHeader>
                    <CardContent className="py-1 px-3 pb-3"><div className="text-xl font-bold text-red-600">{formatCurrency(totalStats.totalArrears)}</div></CardContent>
                </Card>
                <Card className="bg-white border rounded shadow-sm">
                    <CardHeader className="py-2 px-3"><CardTitle className="text-xs font-semibold uppercase text-slate-500">Collection Rate</CardTitle></CardHeader>
                    <CardContent className="py-1 px-3 pb-3">
                        <div className="text-xl font-bold text-blue-600">
                            {totalStats.monthlyRent > 0 
                                ? Math.round((totalStats.paidRent / totalStats.monthlyRent) * 100) 
                                : 0}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table */}
            <Card className="shadow-none border border-black rounded-none overflow-hidden bg-white mx-2">
                <div className="p-2 border-b border-black flex justify-between items-center bg-white h-12">
                    <h3 className="font-semibold text-base flex items-center gap-2 text-slate-800">
                        <FileText className="w-4 h-4 text-slate-500" />
                        Unit Billing Details
                    </h3>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-2.5 h-3 w-3 text-slate-400" />
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 bg-slate-50 border-slate-300 focus-visible:ring-slate-400 h-8 text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table className="border-collapse border border-black">
                        <TableHeader>
                            <TableRow className="border-b border-black">
                                <TableHead className="font-bold text-blue-900 border-r border-black min-w-[120px] h-10 bg-[#70ad47]">UNIT TYPE</TableHead>
                                <TableHead className="font-bold text-blue-900 border-r border-black min-w-[100px] h-10 text-center bg-[#70ad47]">MONTHLY RENT</TableHead>
                                <TableHead className="font-bold text-blue-900 border-r border-black min-w-[100px] h-10 text-center bg-[#70ad47] whitespace-nowrap">BILL WATER</TableHead>
                                <TableHead className="font-bold text-blue-900 border-r border-black min-w-[100px] h-10 text-center bg-[#70ad47] whitespace-nowrap">PAID WATER BILL</TableHead>
                                <TableHead className="font-bold text-blue-900 border-r border-black min-w-[110px] h-10 text-center bg-[#70ad47] whitespace-nowrap">WATER BILL ARREARS</TableHead>
                                <TableHead className="font-bold text-blue-900 border-r border-black min-w-[100px] h-10 text-center bg-[#70ad47]">PAID RENT</TableHead>
                                <TableHead className="font-bold text-blue-900 border-r border-black min-w-[100px] h-10 text-center bg-[#ffff00]">RENT ARREARS</TableHead>
                                <TableHead className="font-bold text-blue-900 border-r border-black min-w-[100px] h-10 text-center bg-[#ff0000] whitespace-nowrap">TOTAL ARREARS PER UNIT</TableHead>
                                <TableHead className="font-bold text-blue-900 border-r border-black min-w-[100px] h-10 text-center bg-[#70ad47]">PAYMENT DATE</TableHead>
                                <TableHead className="font-bold text-blue-900 min-w-[180px] h-10 bg-[#70ad47]">REMARKS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-32 text-center border border-slate-200">
                                        <div className="flex flex-col justify-center items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                                            <span className="text-slate-500">Loading records...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-32 text-center text-slate-500 border border-slate-200">
                                        No billing records found for this period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRows.map((row, index) => (
                                    <TableRow key={row.unit_id} className={`group border-b border-black ${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                                        <TableCell className="font-bold text-blue-900 border-r border-black py-1 px-3">
                                            {row.unit_number}: <span className="text-xs uppercase ml-1">{row.unit_type}</span>
                                        </TableCell>
                                        <TableCell className="border-r border-black py-1 px-3 text-center font-mono text-blue-900 font-medium">
                                            {(row.monthly_rent).toLocaleString()}
                                        </TableCell>
                                        
                                        <TableCell className="border-r border-black p-0 relative">
                                            <input 
                                                className="w-full h-full bg-transparent p-2 text-center font-mono text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                                                value={row.water_bill_amount === 0 ? '' : row.water_bill_amount}
                                                onChange={(e) => handleChange(row.unit_id, 'water_bill_amount', e.target.value)}
                                                onBlur={(e) => handleBlur(row, 'water_bill_amount', e)}
                                            />
                                        </TableCell>
                                        <TableCell className="border-r border-black p-0 relative">
                                            <input 
                                                className="w-full h-full bg-transparent p-2 text-center font-mono text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                                                value={row.paid_water_bill === 0 ? '' : row.paid_water_bill}
                                                onChange={(e) => handleChange(row.unit_id, 'paid_water_bill', e.target.value)}
                                                onBlur={(e) => handleBlur(row, 'paid_water_bill', e)}
                                            />
                                        </TableCell>
                                        <TableCell className="border-r border-black py-1 px-3 text-center font-mono text-blue-900 bg-[#edebe9]">
                                            {(row.water_bill_arrears === 0 ? '' : row.water_bill_arrears.toLocaleString())}
                                        </TableCell>

                                        <TableCell className="p-0 border-r border-black relative">
                                            <input 
                                                className="w-full h-full bg-transparent p-2 text-center font-mono text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-green-600 focus:ring-inset"
                                                value={row.paid_rent === 0 ? '' : row.paid_rent}
                                                onChange={(e) => handleChange(row.unit_id, 'paid_rent', e.target.value)}
                                                onBlur={(e) => handleBlur(row, 'paid_rent', e)}
                                            />
                                        </TableCell>
                                        <TableCell className="border-r border-black py-1 px-3 text-center font-mono font-bold text-blue-900 bg-[#ffff00]">
                                            {row.rent_arrears}
                                        </TableCell>
                                        <TableCell className="border-r border-black py-1 px-3 text-center font-mono font-bold text-blue-900 bg-[#ff0000]">
                                            {row.total_arrears}
                                        </TableCell>
                                        <TableCell className="border-r border-black py-1 px-3 text-center text-xs text-blue-900 whitespace-nowrap">
                                            {row.payment_date !== '-' ? new Date(row.payment_date).toLocaleDateString() : ''}
                                        </TableCell>
                                        <TableCell className="p-0 min-w-[150px] relative">
                                            <input 
                                                className="w-full h-full bg-transparent p-2 text-sm text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-slate-500 focus:ring-inset"
                                                value={row.remarks || ''}
                                                onChange={(e) => handleChange(row.unit_id, 'remarks', e.target.value)}
                                                onBlur={(e) => handleBlur(row, 'remarks', e)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            
                            {/* Totals Row */}
                            {filteredRows.length > 0 && (
                                <TableRow className="bg-[#70ad47] border-t-2 border-black">
                                    <TableCell className="font-bold text-blue-900 border-r border-black py-3">TOTALS</TableCell>
                                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{(totalStats.monthlyRent).toLocaleString()}</TableCell>
                                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">-</TableCell>
                                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{(totalStats.paidWater).toLocaleString()}</TableCell>
                                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{(totalStats.waterArrears).toLocaleString()}</TableCell>
                                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono">{(totalStats.paidRent).toLocaleString()}</TableCell>
                                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono bg-[#ffff00]">{(totalStats.rentArrears).toLocaleString()}</TableCell>
                                    <TableCell className="font-bold text-blue-900 text-center border-r border-black px-3 font-mono bg-[#ff0000]">{(totalStats.totalArrears).toLocaleString()}</TableCell>
                                    <TableCell colSpan={2} className="bg-[#70ad47]"></TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    </div>
  );
};

export default ManagerRentCollection;
