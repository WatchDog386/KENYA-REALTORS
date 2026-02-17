// src/components/portal/super-admin/Reports.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Building,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Printer,
  ChevronDown,
  Search,
  FileOutput,
  BarChart3,
  Loader2,
  Eye,
  FilePieChart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatNumber, formatForDisplay } from "@/utils/formatCurrency";
import { toast } from "sonner";

// Import UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { HeroBackground } from "@/components/ui/HeroBackground";

interface ReportData {
  units: UnitReport[];
  summary: SummaryData;
  property: PropertyData;
  generatedAt: string;
}

interface UnitReport {
  unit_id: string;
  payment_id?: string; // ID of the rent payment if it exists
  unit_type: string;
  monthly_rent: number;
  paid_water_bill: number;
  water_bill_arrears: number;
  paid_rent: number;
  rent_arrears: number;
  total_arrears_per_unit: number;
  payment_date: string;
  remarks: string; // Display remarks
  raw_remarks?: string; // Actual DB remarks
  status?: 'paid' | 'partial' | 'unpaid' | 'vacant';
  property_name: string;
}

interface SummaryData {
  total_monthly_rent: number;
  total_paid_water_bill: number;
  total_water_bill_arrears: number;
  total_paid_rent: number;
  total_rent_arrears: number;
  total_arrears: number;
  vacancy_rate: number;
  total_vacant_units: number;
  defaulted_units: number;
  total_vacant_amount: number;
  collection_rate: number;
}

interface PropertyData {
  name: string;
  location: string;
  total_units: number;
  occupied_units: number;
  manager_name: string;
  manager_contact: string;
  manager_email: string;
}

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // Current month in YYYY-MM format
  );
  const [reportType, setReportType] = useState<string>("rental");
  const [properties, setProperties] = useState<any[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [filteredUnits, setFilteredUnits] = useState<UnitReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit State
  const [editingUnit, setEditingUnit] = useState<UnitReport | null>(null);
  const [editRemarks, setEditRemarks] = useState("");
  const [editAmount, setEditAmount] = useState(""); // For editing paid amount if needed
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);


  // Available report types
  const reportTypes = [
    { id: "rental", name: "Rental Report", icon: FileText, description: "Monthly rent collection" },
    { id: "financial", name: "Financial Report", icon: DollarSign, description: "Complete financial overview" },
    { id: "occupancy", name: "Occupancy Report", icon: Building, description: "Property occupancy status" },
    { id: "maintenance", name: "Maintenance Report", icon: FilePieChart, description: "Maintenance requests & costs" },
    { id: "summary", name: "Summary Report", icon: BarChart3, description: "Monthly performance summary" },
  ];

  // Status filter options
  const statusOptions = [
    { id: "all", name: "All Units" },
    { id: "paid", name: "Fully Paid" },
    { id: "partial", name: "Partially Paid" },
    { id: "unpaid", name: "With Arrears" },
    { id: "vacant", name: "Vacant Units" },
  ];

  // Load properties on component mount
  useEffect(() => {
    loadProperties();
  }, []);

  // Filter units when search query or status filter changes
  useEffect(() => {
    if (reportData) {
      let filtered = reportData.units;

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(
          (unit) =>
            unit.unit_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            unit.remarks.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter((unit) => unit.status === statusFilter);
      }

      setFilteredUnits(filtered);
    }
  }, [searchQuery, statusFilter, reportData]);

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, location, type")
        .order("name");

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error loading properties:", error);
      toast.error("Failed to load properties");
    }
  };

  const handleEditClick = (unit: UnitReport) => {
    setEditingUnit(unit);
    setEditRemarks(unit.raw_remarks || "");
    setEditAmount(unit.paid_rent.toString());
    setIsEditDialogOpen(true);
  };

  const handleSavePayment = async () => {
    if (!editingUnit) return;
    
    try {
      if (editingUnit.payment_id) {
        // Update existing payment
        const newPaidAmount = parseFloat(editAmount) || 0;
        const newStatus = newPaidAmount >= editingUnit.monthly_rent ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';

        const { error } = await supabase
          .from('rent_payments')
          .update({
             remarks: editRemarks,
             amount_paid: newPaidAmount,
             status: newStatus
          })
          .eq('id', editingUnit.payment_id);
        
        if (error) throw error;
        toast.success("Payment record updated");
      } else {
        // If the user wants to add a remark/payment to a unit that has no record yet (e.g. Unpaid)
        // We need to create a record.
        // Assuming we have enough info to create it.
        if (!selectedMonth) return;
        
        // This logic mimics creating a payment in Rent Collection but simplified
        const startOfMonth = `${selectedMonth}-01`;
        
        const { error } = await supabase
          .from('rent_payments')
          .insert({
             unit_id: editingUnit.unit_id,
             amount: editingUnit.monthly_rent,
             amount_paid: parseFloat(editAmount) || 0,
             status: (parseFloat(editAmount) || 0) >= editingUnit.monthly_rent ? 'paid' : (parseFloat(editAmount) || 0) > 0 ? 'partial' : 'unpaid',
             payment_date: new Date().toISOString(), // Today as payment date if just created
             due_date: startOfMonth, // Assign to this month
             remarks: editRemarks,
             tenant_id: null // Ideally we should fetch tenant_id but for now let it be null or handle by triggers if any
          });

         if (error) throw error;
         toast.success("Payment record created");
      }
      
      setIsEditDialogOpen(false);
      generateReport(); // Refresh data
    } catch (e) {
      console.error(e);
      toast.error("Failed to update payment");
    }
  };
  
  const handleDeletePayment = async () => {
     if (!editingUnit?.payment_id) return;
     if (!confirm("Are you sure you want to delete this payment record? This will reset the unit status to Unpaid for this month.")) return;

     try {
       const { error } = await supabase.from('rent_payments').delete().eq('id', editingUnit.payment_id);
       if (error) throw error;
       toast.success("Payment record deleted");
       setIsEditDialogOpen(false);
       generateReport();
     } catch (e) {
       console.error(e);
       toast.error("Failed to delete payment");
     }
  };

  const generateReport = async () => {
    if (!selectedMonth) {
      toast.error("Please select a month");
      return;
    }

    setGeneratingReport(true);
    setLoading(true);

    try {
      // Fetch real data from Supabase
      const reportUnits = await fetchReportData(selectedProperty, selectedMonth);
      const summary = calculateSummary(reportUnits);
      const propertyData = await getPropertyData(selectedProperty);

      const reportData: ReportData = {
        units: reportUnits,
        summary,
        property: propertyData,
        generatedAt: new Date().toISOString(),
      };

      setReportData(reportData);
      setFilteredUnits(reportUnits);
      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setGeneratingReport(false);
      setLoading(false);
    }
  };

  const fetchReportData = async (propertyId: string, month: string): Promise<UnitReport[]> => {
    try {
      // 1. Fetch Units with Type Info
      let unitsQuery = supabase
        .from('units')
        .select(`
          id, 
          unit_number, 
          status, 
          property_id,
          property_unit_types (
            name,
            price_per_unit
          ),
          properties (
            name
          )
        `);
      
      if (propertyId !== "all") {
        unitsQuery = unitsQuery.eq('property_id', propertyId);
      }
      
      const { data: unitsData, error: unitsError } = await unitsQuery;
      if (unitsError) throw unitsError;
      
      if (!unitsData || unitsData.length === 0) return [];

      // 2. Fetch Payments & Bills for the selected month to determine paid status
      // Calculate date range for the selected month
      const startOfMonth = `${month}-01`;
      const dateObj = new Date(startOfMonth);
      const nextMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 1);
      const endOfMonth = nextMonth.toISOString().split('T')[0];
      
      // Use due_date to find the rent record specifically FOR this month
      let paymentsQuery = supabase
          .from('rent_payments')
          .select('id, unit_id, amount, status, payment_date, amount_paid, remarks')
          .gte('due_date', startOfMonth)
          .lt('due_date', endOfMonth);

      // Use bill_period_start to find the bill FOR this month (matching Manager Dashboard)
      let billsQuery = supabase
          .from('bills_and_utilities')
          .select('unit_id, amount, paid_amount, status, created_at')
          .eq('bill_type', 'water')
          .gte('bill_period_start', startOfMonth)
          .lt('bill_period_start', endOfMonth);

      if (propertyId !== "all") {
          paymentsQuery = paymentsQuery.eq('property_id', propertyId);
          // bills query doesn't always have property_id in strict schema, but usually does.
          // We'll filter map side to be safe or rely on unit_id join if we did a join.
          // For safety in this context without checking schema for property_id on bills:
          // We will filter bills by unit_id in the map loop.
      }

      const [{ data: paymentsData }, { data: billsData }] = await Promise.all([
          paymentsQuery,
          billsQuery
      ]);

      // 3. Map units to report format
      return unitsData.map((unit: any) => {
        const unitType = unit.property_unit_types?.name || 'Standard';
        const price = unit.property_unit_types?.price_per_unit || 0;
        
        // Find rent payment for this unit in this month
        const payment = paymentsData?.find((p: any) => p.unit_id === unit.id);
        
        // Find bills for this unit
        const unitBills = billsData?.filter((b: any) => b.unit_id === unit.id) || [];
        const waterBillTotal = unitBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        const waterBillPaid = unitBills.reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0);
        const waterBillArrears = Math.max(0, waterBillTotal - waterBillPaid); // Simple calculation for this month

        const monthlyRent = Number(price);
        // Use amount_paid if available (partial support), else full amount if 'paid'
        let paidRent = 0;
        if (payment) {
             if (payment.amount_paid !== undefined && payment.amount_paid !== null) {
                 paidRent = Number(payment.amount_paid);
             } else {
                 paidRent = payment.status === 'paid' ? Number(payment.amount || 0) : 0;
             }
        }
        
        // Calculate status and arrears
        // If vacant, no rent expected 
        const isVacant = unit.status === 'available' || unit.status === 'maintenance';
        
        let status: 'paid' | 'partial' | 'unpaid' | 'vacant' = 'unpaid';
        let rentArrears = 0;

        if (isVacant) {
           status = 'vacant';
           rentArrears = 0; 
        } else {
           if (paidRent >= monthlyRent) {
             status = 'paid';
             rentArrears = 0;
           } else if (paidRent > 0) {
             status = 'partial';
             rentArrears = monthlyRent - paidRent;
           } else {
             status = 'unpaid';
             rentArrears = monthlyRent;
           }
        }
        
        const totalArrears = rentArrears + waterBillArrears;

        return {
          unit_id: unit.id,
          payment_id: payment?.id,
          unit_type: `${unit.unit_number}: ${unitType.toUpperCase()}`,
          monthly_rent: monthlyRent,
          paid_water_bill: waterBillPaid,
          water_bill_arrears: waterBillArrears,
          paid_rent: paidRent,
          rent_arrears: rentArrears,
          total_arrears_per_unit: totalArrears,
          payment_date: payment?.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-',
          remarks: payment?.remarks || formatStatus(status),
          raw_remarks: payment?.remarks,
          status: status,
          property_name: unit.properties?.name || 'Unknown Property',
        };
      });

    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to load report data");
      return [];
    }
  };

  const formatStatus = (status: string) => {
      switch(status) {
          case 'paid': return 'Fully Paid';
          case 'partial': return 'Partially Paid';
          case 'unpaid': return 'Pending Payment';
          case 'vacant': return 'Vacant Unit';
          default: return status;
      }
  };

  const calculateSummary = (units: UnitReport[]): SummaryData => {
    const totalMonthlyRent = units.reduce((sum, unit) => sum + unit.monthly_rent, 0);
    const totalPaidWaterBill = units.reduce((sum, unit) => sum + unit.paid_water_bill, 0);
    const totalWaterBillArrears = units.reduce((sum, unit) => sum + unit.water_bill_arrears, 0);
    const totalPaidRent = units.reduce((sum, unit) => sum + unit.paid_rent, 0);
    const totalRentArrears = units.reduce((sum, unit) => sum + unit.rent_arrears, 0);
    const totalArrears = totalWaterBillArrears + totalRentArrears;
    const vacantUnits = units.filter(unit => unit.status === 'vacant').length;
    const defaultedUnits = units.filter(unit => unit.remarks.includes('Defaulted')).length;
    const totalVacantAmount = units
      .filter(unit => unit.status === 'vacant')
      .reduce((sum, unit) => sum + unit.monthly_rent, 0);
    const vacancyRate = (vacantUnits / units.length) * 100;
    const collectionRate = (totalPaidRent / totalMonthlyRent) * 100;

    return {
      total_monthly_rent: totalMonthlyRent,
      total_paid_water_bill: totalPaidWaterBill,
      total_water_bill_arrears: totalWaterBillArrears,
      total_paid_rent: totalPaidRent,
      total_rent_arrears: totalRentArrears,
      total_arrears: totalArrears,
      vacancy_rate: parseFloat(vacancyRate.toFixed(2)),
      total_vacant_units: vacantUnits,
      defaulted_units: defaultedUnits,
      total_vacant_amount: totalVacantAmount,
      collection_rate: parseFloat(collectionRate.toFixed(2)),
    };
  };

  const getPropertyData = async (propertyId: string): Promise<PropertyData> => {
    if (propertyId === "all") {
       try {
        const { count: totalUnits } = await supabase
          .from('units')
          .select('*', { count: 'exact', head: true });
          
        const { count: occupiedUnits } = await supabase
          .from('units')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'occupied');

        return {
          name: "All Properties - Ayden Homes Ltd",
          location: "Multiple Locations, Nairobi",
          total_units: totalUnits || 0,
          occupied_units: occupiedUnits || 0,
          manager_name: "Duncan Marshel Agiro",
          manager_contact: "+254 712 345 678",
          manager_email: "duncan.agiro@aydenhomes.co.ke",
        };
      } catch (err) {
        console.error("Error fetching aggregate data:", err);
        // Fallback
        return {
          name: "All Properties - Ayden Homes Ltd",
          location: "Multiple Locations, Nairobi",
          total_units: 0,
          occupied_units: 0,
          manager_name: "Duncan Marshel Agiro",
          manager_contact: "+254 712 345 678",
          manager_email: "duncan.agiro@aydenhomes.co.ke",
        };
      }
    }

    // Fetch actual property data from Supabase
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, location, total_units, type")
        .eq("id", propertyId)
        .single();

      if (error) throw error;

      // Fetch assigned manager for this property
      let managerName = "No Manager Assigned";
      let managerContact = "+254 700 000 000";
      let managerEmail = "manager@aydenhomes.co.ke";

      try {
        const { data: assignmentData } = await supabase
          .from("property_manager_assignments")
          .select(`
            property_manager_id,
            profiles!inner(first_name, last_name, email, phone)
          `)
          .eq("property_id", propertyId)
          .eq("status", "active")
          .single();

        if (assignmentData?.profiles) {
          const profile = assignmentData.profiles;
          managerName = `${profile.first_name} ${profile.last_name}`;
          managerContact = profile.phone || "+254 700 000 000";
          managerEmail = profile.email || "manager@aydenhomes.co.ke";
        }
      } catch (err) {
        console.warn("No manager assigned to this property:", err);
      }

      // Fetch occupied units count
      const { count: occupiedCount } = await supabase
        .from('units')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', propertyId)
        .eq('status', 'occupied');

      return {
        name: data.name || "Unknown Property",
        location: data.location || "Nairobi",
        total_units: data.total_units || 0,
        occupied_units: occupiedCount || 0,
        manager_name: managerName,
        manager_contact: managerContact,
        manager_email: managerEmail,
      };
    } catch (error) {
      console.error("Error fetching property data:", error);
      return {
        name: "Ayden Homes Ltd",
        location: "Nairobi",
        total_units: 40,
        occupied_units: 32,
        manager_name: "Duncan Marshel Agiro",
        manager_contact: "+254 712 345 678",
        manager_email: "duncan.agiro@aydenhomes.co.ke",
      };
    }
  };

  const exportToPDF = () => {
    if (!reportData) {
      toast.error("No report data to export");
      return;
    }

    toast.info("PDF export functionality coming soon!");
    // TODO: Implement PDF generation using jsPDF
  };

  const exportToCSV = () => {
    if (!reportData) {
      toast.error("No report data to export");
      return;
    }

    try {
      const headers = [
        "UNIT TYPE",
        "MONTHLY RENT (KSh)",
        "PAID WATER BILL (KSh)",
        "WATER BILL ARREARS (KSh)",
        "PAID RENT (KSh)",
        "RENT ARREARS (KSh)",
        "TOTAL ARREARS (KSh)",
        "PAYMENT DATE",
        "REMARKS",
        "STATUS"
      ];

      const csvRows = [
        headers.join(","),
        ...reportData.units.map((unit) =>
          [
            unit.unit_type,
            unit.monthly_rent,
            unit.paid_water_bill,
            unit.water_bill_arrears,
            unit.paid_rent,
            unit.rent_arrears,
            unit.total_arrears_per_unit,
            unit.payment_date,
            `"${unit.remarks}"`,
            unit.status
          ].join(",")
        ),
        "",
        "SUMMARY",
        `Total Monthly Rent,${reportData.summary.total_monthly_rent}`,
        `Total Paid Water Bill,${reportData.summary.total_paid_water_bill}`,
        `Total Water Bill Arrears,${reportData.summary.total_water_bill_arrears}`,
        `Total Paid Rent,${reportData.summary.total_paid_rent}`,
        `Total Rent Arrears,${reportData.summary.total_rent_arrears}`,
        `Total Arrears,${reportData.summary.total_arrears}`,
        `Vacancy Rate,${reportData.summary.vacancy_rate}%`,
        `Collection Rate,${reportData.summary.collection_rate}%`,
        `Vacant Units,${reportData.summary.total_vacant_units}`,
        `Defaulted Units,${reportData.summary.defaulted_units}`,
        `Vacant Amount,${reportData.summary.total_vacant_amount}`,
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `rental_report_${dateStr}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Report exported to CSV");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    }
  };

  const exportToExcel = () => {
    toast.info("Excel export functionality coming soon!");
  };

  const printReport = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Partial</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Unpaid</Badge>;
      case 'vacant':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Vacant</Badge>;
      default:
        return null;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50';
      case 'partial': return 'text-yellow-600 bg-yellow-50';
      case 'unpaid': return 'text-red-600 bg-red-50';
      case 'vacant': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen antialiased text-slate-900 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Nunito', sans-serif; }
      `}</style>
      
      <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] overflow-hidden py-4 shadow-lg mb-4 print:hidden relative">
        <HeroBackground />
        <div className="w-full px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="md:w-1/2">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 tracking-wide uppercase rounded-full border border-white/30">
                  Analytics
                </span>
                <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">
                  Reports
                </span>
              </div>
              
              <h1 className="text-xl md:text-2xl font-bold text-white mb-2 leading-[1.2] tracking-tight">
                System <span className="text-[#F96302]">Reports</span>
              </h1>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={printReport}
                  className="group flex items-center gap-2 bg-white text-[#154279] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all duration-300 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Printer className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  Print Report
                </button>
              </div>
            </div>
            
             <div className="md:w-1/2 w-full mt-2 md:mt-0 flex justify-end">
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-white max-w-xs w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-blue-100 uppercase tracking-wider">Generated</div>
                      <div className="text-sm font-bold">{reportData ? "1 Report" : "0 Reports"}</div>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#F96302] w-[70%]"></div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="w-full px-4 pb-12 space-y-6 print:space-y-4">

      {/* Report Controls */}
      {/* Report Controls - Flat Style */}
      <div className="print:hidden bg-transparent mb-8">
        <div className="w-full">
            <div className="flex flex-col md:flex-row items-end gap-4">
            {/* Report Type */}
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="h-10 bg-white border-slate-300 text-slate-900 focus:ring-1 focus:ring-[#154279] rounded font-medium shadow-sm">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-xl z-50">
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id} className="focus:bg-[#154279] focus:text-white cursor-pointer py-2">
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Property */}
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Property</label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="h-10 bg-white border-slate-300 text-slate-900 focus:ring-1 focus:ring-[#154279] rounded font-medium shadow-sm">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-xl z-50">
                  <SelectItem value="all" className="focus:bg-[#154279] focus:text-white cursor-pointer py-2 font-bold">All Properties</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id} className="focus:bg-[#154279] focus:text-white cursor-pointer py-2">
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month */}
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-10 bg-white border-slate-300 text-slate-900 focus:ring-1 focus:ring-[#154279] rounded font-medium shadow-sm">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-xl z-50">
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const value = date.toISOString().slice(0, 7);
                    const label = date.toLocaleDateString("en-KE", {
                      month: "long",
                      year: "numeric",
                    });
                    return (
                      <SelectItem key={value} value={value} className="focus:bg-[#154279] focus:text-white cursor-pointer py-2">
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider invisible">Action</label>
              <Button
                onClick={generateReport}
                className="w-full h-10 bg-[#154279] hover:bg-[#0f325e] text-white font-bold rounded shadow-md hover:shadow-lg transition-all"
                disabled={generatingReport || !selectedMonth}
              >
                {generatingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : reportData ? (
        <div className="space-y-6 print:space-y-4">
          {/* Report Content Wrapper - No Card Style */}
          <div className="print:border-0 print:p-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 print:mb-4 px-2">

              <div>
                <h2 className="text-2xl font-bold">RENTAL REMITTANCE REPORT</h2>
                <p className="text-gray-600">
                  {getMonthName(selectedMonth)} • {reportData.property.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Generated on {formatDate(reportData.generatedAt)}
                </p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <div className="text-sm font-medium">Property Manager</div>
                <div className="font-semibold">{reportData.property.manager_name}</div>
                <div className="text-sm text-gray-600">{reportData.property.manager_contact}</div>
                <div className="text-sm text-gray-600">{reportData.property.manager_email}</div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:grid-cols-4 print:gap-2 print:mb-4">
              <Card className="bg-blue-50 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-1 pt-4 px-5">
                  <CardTitle className="text-sm font-bold text-blue-900 uppercase tracking-wider">
                    Total Rent Collected
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 pt-0 px-5">
                  <div className="text-2xl font-bold text-blue-900 font-mono">
                    {formatCurrency(reportData.summary.total_paid_rent)}
                  </div>
                  <div className="text-xs text-blue-700 mt-1 font-medium">
                    Collection Rate: {reportData.summary.collection_rate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-1 pt-4 px-5">
                  <CardTitle className="text-sm font-bold text-green-900 uppercase tracking-wider">
                    Occupancy Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 pt-0 px-5">
                  <div className="text-2xl font-bold text-green-900 font-mono">
                    {(100 - reportData.summary.vacancy_rate).toFixed(1)}%
                  </div>
                  <div className="text-xs text-green-700 mt-1 font-medium">
                    {reportData.property.occupied_units}/{reportData.property.total_units} units occupied
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-1 pt-4 px-5">
                  <CardTitle className="text-sm font-bold text-red-900 uppercase tracking-wider">
                    Total Arrears
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 pt-0 px-5">
                  <div className="text-2xl font-bold text-red-900 font-mono">
                    {formatCurrency(reportData.summary.total_arrears)}
                  </div>
                  <div className="text-xs text-red-700 mt-1 font-medium">
                    {reportData.summary.total_vacant_units} vacant units contributing
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-1 pt-4 px-5">
                  <CardTitle className="text-sm font-bold text-yellow-900 uppercase tracking-wider">
                    Water Bills
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 pt-0 px-5">
                  <div className="text-2xl font-bold text-yellow-900 font-mono">
                    {formatCurrency(reportData.summary.total_paid_water_bill)}
                  </div>
                  <div className="text-xs text-yellow-700 mt-1 font-medium">
                    {formatCurrency(reportData.summary.total_water_bill_arrears)} in arrears
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 print:hidden">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search units by type or remarks..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-sm bg-white border-slate-300 focus:border-slate-500 rounded px-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-10 bg-white border-gray-300 text-gray-700 rounded shadow-sm">
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-xl z-50">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id} className="cursor-pointer py-2">
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 h-10 font-medium rounded shadow-sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border-slate-200 shadow-lg z-50">
                  <DropdownMenuItem onClick={exportToPDF} className="hover:bg-slate-50 focus:bg-slate-50 cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToCSV} className="hover:bg-slate-50 focus:bg-slate-50 cursor-pointer">
                    <FileOutput className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToExcel} className="hover:bg-slate-50 focus:bg-slate-50 cursor-pointer">
                    <FileOutput className="w-4 h-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Report Tables Grouped by Property */}
            <div className="space-y-12 print:space-y-8">
              {Object.entries(filteredUnits.reduce((groups, unit) => {
                const key = unit.property_name;
                if (!groups[key]) groups[key] = [];
                groups[key].push(unit);
                return groups;
              }, {} as Record<string, UnitReport[]>)).map(([propertyName, units]) => {
                
                // Calculate totals for this property group
                const groupMonthlyRent = units.reduce((s, u) => s + u.monthly_rent, 0);
                const groupPaidWater = units.reduce((s, u) => s + u.paid_water_bill, 0);
                const groupWaterArrears = units.reduce((s, u) => s + u.water_bill_arrears, 0);
                const groupPaidRent = units.reduce((s, u) => s + u.paid_rent, 0);
                const groupRentArrears = units.reduce((s, u) => s + u.rent_arrears, 0);
                const groupTotalArrears = units.reduce((s, u) => s + u.total_arrears_per_unit, 0);
                
                // Collection rate
                const collectionRate = groupMonthlyRent > 0 ? (groupPaidRent / groupMonthlyRent) * 100 : 0;

                return (
                  <div key={propertyName} className="break-inside-avoid mb-6">
                    <div className="flex justify-between items-end mb-1 border-b-2 border-black pb-1 bg-gray-100 px-2 pt-2">
                      <h3 className="text-lg font-bold uppercase text-blue-900">{propertyName}</h3>
                      <div className="text-right flex items-center gap-2">
                        <span className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Collection Rate:</span>
                        <span className="text-xl font-bold text-black">{collectionRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <Table className="border-collapse border border-black w-full text-sm">
                        <TableHeader>
                            <TableRow className="border-b border-black">
                                <TableHead className="font-bold border-r border-black min-w-[80px] h-10 bg-[#70ad47] px-2 text-left text-sm text-black">UNIT TYPE</TableHead>
                                <TableHead className="font-bold border-r border-black min-w-[80px] h-10 text-right bg-[#70ad47] px-2 text-sm text-black">MONTHLY RENT</TableHead>
                                <TableHead className="font-bold border-r border-black min-w-[80px] h-10 text-right bg-[#70ad47] whitespace-nowrap px-2 text-sm text-black">PAID WATER</TableHead>
                                <TableHead className="font-bold border-r border-black min-w-[80px] h-10 text-right bg-[#70ad47] whitespace-nowrap px-2 text-sm text-black">WATER ARREARS</TableHead>
                                <TableHead className="font-bold border-r border-black min-w-[80px] h-10 text-right bg-[#70ad47] px-2 text-sm text-black">PAID RENT</TableHead>
                                <TableHead className="font-bold border-r border-black min-w-[80px] h-10 text-right bg-[#ffff00] px-2 text-sm text-black">RENT ARREARS</TableHead>
                                <TableHead className="font-bold border-r border-black min-w-[90px] h-10 text-right bg-[#ff0000] whitespace-nowrap px-2 text-sm text-black">TOTAL ARREARS</TableHead>
                                <TableHead className="font-bold border-r border-black min-w-[80px] h-10 text-center bg-[#70ad47] px-2 text-sm text-black">PAYMENT DATE</TableHead>
                                <TableHead className="font-bold min-w-[150px] h-10 bg-[#70ad47] px-2 text-left text-sm text-black">REMARKS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                          {units.map((unit) => (
                              <TableRow 
                                key={unit.unit_id} 
                                className="group border-b border-black bg-white hover:bg-blue-50 cursor-pointer transition-colors"
                                onClick={() => handleEditClick(unit)}
                                title="Click to edit payment status and remarks"
                              >
                                  <TableCell className="font-bold text-slate-900 border-r border-black py-2 px-2 text-left bg-white text-sm group-hover:bg-blue-50">
                                      {unit.unit_type}
                                  </TableCell>
                                  <TableCell className="border-r border-black py-2 px-2 text-right font-mono text-slate-900 font-medium bg-white text-sm group-hover:bg-blue-50">
                                      {unit.monthly_rent.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="border-r border-black py-2 px-2 text-right font-mono text-slate-900 bg-white text-sm group-hover:bg-blue-50">
                                      {unit.paid_water_bill === 0 ? '-' : unit.paid_water_bill.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="border-r border-black py-2 px-2 text-right font-mono text-slate-900 bg-[#edebe9] text-sm group-hover:bg-blue-50">
                                      {unit.water_bill_arrears === 0 ? '' : unit.water_bill_arrears.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="border-r border-black py-2 px-2 text-right font-mono text-slate-900 bg-white text-sm group-hover:bg-blue-50">
                                      {unit.paid_rent === 0 ? '-' : unit.paid_rent.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="border-r border-black py-2 px-2 text-right font-mono font-bold text-slate-900 bg-[#ffff00] text-sm">
                                      {unit.rent_arrears}
                                  </TableCell>
                                  <TableCell className="border-r border-black py-2 px-2 text-right font-mono font-bold text-slate-900 bg-[#ff0000] text-sm">
                                      {unit.total_arrears_per_unit}
                                  </TableCell>
                                  <TableCell className="border-r border-black py-2 px-2 text-center text-xs text-slate-900 whitespace-nowrap bg-white group-hover:bg-blue-50">
                                      {unit.payment_date}
                                  </TableCell>
                                  <TableCell className="py-2 px-2 text-sm text-slate-900 bg-white truncate max-w-[200px] group-hover:bg-blue-50 font-medium">
                                      {unit.remarks}
                                  </TableCell>
                              </TableRow>
                          ))}
                          {/* Property Group Totals */}
                          <TableRow className="bg-[#70ad47] border-t-2 border-black">
                              <TableCell className="font-bold text-black border-r border-black py-2 px-2 text-sm">TOTALS</TableCell>
                              <TableCell className="font-bold text-black text-right border-r border-black px-2 font-mono text-sm">{groupMonthlyRent.toLocaleString()}</TableCell>
                              <TableCell className="font-bold text-black text-right border-r border-black px-2 font-mono text-sm">{groupPaidWater.toLocaleString()}</TableCell>
                              <TableCell className="font-bold text-black text-right border-r border-black px-2 font-mono text-sm">{groupWaterArrears.toLocaleString()}</TableCell>
                              <TableCell className="font-bold text-black text-right border-r border-black px-2 font-mono text-sm">{groupPaidRent.toLocaleString()}</TableCell>
                              <TableCell className="font-bold text-black text-right border-r border-black px-2 font-mono bg-[#ffff00] text-sm">{groupRentArrears.toLocaleString()}</TableCell>
                              <TableCell className="font-bold text-black text-right border-r border-black px-2 font-mono bg-[#ff0000] text-sm">{groupTotalArrears.toLocaleString()}</TableCell>
                              <TableCell colSpan={2} className="bg-[#70ad47]"></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Section - Updated to match screenshot clean style */}
            <div className="mt-8 mb-8 text-sm break-inside-avoid">
              <div className="border border-black rounded-lg p-6 bg-white">
                 <h3 className="font-bold text-base mb-4 uppercase border-b border-black pb-2 text-black">SUMMARY</h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {/* Left Column */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                            <span className="text-slate-600 font-medium">Total Monthly Rent:</span>
                            <span className="font-bold text-black">{formatForDisplay(reportData.summary.total_monthly_rent, 'KSH', true)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                            <span className="text-slate-600">Total Paid Water Bill:</span>
                            <span className="font-mono text-slate-900">{formatForDisplay(reportData.summary.total_paid_water_bill, 'KSH', true)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                            <span className="text-slate-600">Total Water Bill Arrears:</span>
                            <span className="font-mono text-[#ff0000] font-medium">{formatForDisplay(reportData.summary.total_water_bill_arrears, 'KSH', true)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                            <span className="text-slate-600">Total Paid Rent:</span>
                            <span className="font-mono text-[#70ad47] font-medium">{formatForDisplay(reportData.summary.total_paid_rent, 'KSH', true)}</span>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                            <span className="text-slate-600">Total Rent Arrears:</span>
                            <span className="font-mono text-[#ff0000] font-medium text-right">{formatForDisplay(reportData.summary.total_rent_arrears, 'KSH', true)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                            <span className="text-slate-600">Vacant Units:</span>
                            <span className="font-mono text-slate-900 text-right">{reportData.summary.total_vacant_units} units</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-black pb-1">
                            <span className="text-slate-600">Defaulted Units:</span>
                            <span className="font-mono text-slate-900 text-right">{reportData.summary.defaulted_units} units</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-black uppercase">TOTAL ARREARS:</span>
                            <span className="font-bold text-[#ff0000] text-lg font-mono text-right">
                                {formatForDisplay(reportData.summary.total_arrears, 'KSH', true)}
                            </span>
                        </div>
                    </div>
                 </div>

                 {/* Stats Footer in Summary Box */}
                 <div className="mt-8 pt-6 border-t border-black grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">{reportData.summary.vacancy_rate.toFixed(2)}%</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Vacancy Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-[#70ad47]">{reportData.summary.collection_rate.toFixed(1)}%</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Collection Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-purple-600">
                             {reportData.property.occupied_units}/{reportData.property.total_units}
                        </div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Units Occupied</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-[#F96302]">
                             {filteredUnits.length}
                        </div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Units in Report</div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Footer Signature Section - Matched Screenshot */}
            <div className="mt-4 pt-4 border-t-2 border-slate-800 text-xs text-slate-600 print:mt-4 print:pt-4 break-inside-avoid">
              <div className="flex flex-col md:flex-row justify-between items-end">
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">Yours Faithfully,</p>
                  <p className="pt-4 font-bold text-slate-900 text-sm uppercase">{reportData.property.manager_name}</p>
                  <p className="text-slate-500">For: {reportData.property.name}</p>
                  <p className="text-slate-500 mt-1">
                    Contact: {reportData.property.manager_contact} | {reportData.property.manager_email}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 text-right space-y-1">
                  <p className="font-mono text-slate-400">Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                  <p className="text-slate-500">System Generated Report • {reportData.property.location}</p>
                  <p className="text-slate-400 text-[10px] mt-1">Page 1 of 1</p>
                </div>
              </div>
            </div>
          </div>

          {[/* Hidden Stats Panel removed as per "remove the card" request if user meant that one */]}
        </div>
      ) : (
        <Card className="print:hidden border-2 border-slate-200 bg-white shadow-lg mx-auto max-w-2xl mt-12">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Report Generated</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Select report parameters and click "Generate Report" to create a detailed rental report.
              Reports can be exported to PDF, CSV, or printed for official use.
            </p>
            <div className="flex gap-3">
              <Button onClick={generateReport} className="bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline" onClick={() => setSelectedMonth('2025-12')} className="bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl border-none">
                <Calendar className="w-4 h-4 mr-2" />
                Use Sample Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
      {/* Edit Dialog - For Editing, Updating, Deleting Payment Details */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-black shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold text-[#154279]">
                Edit Unit Details
            </DialogTitle>
            <DialogDescription>
              {editingUnit?.unit_type} - {editingUnit?.property_name}
              <br/>
              <span className="text-xs text-slate-500">Modify rental payment details and remarks. This affects the generated report and financial records.</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount" className="font-semibold text-slate-700">Amount Paid (Rent)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">KSH</span>
                <Input
                  id="amount"
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-12 font-mono text-lg"
                />
              </div>
              <p className="text-xs text-slate-500">
                Monthly Rent: {formatCurrency(editingUnit?.monthly_rent || 0)}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="remarks" className="font-semibold text-slate-700">Remarks</Label>
              <Textarea
                id="remarks"
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                placeholder="Enter checking details, payment reference, or tenant notes..."
                className="resize-none h-32 font-normal"
              />
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between border-t pt-4">
             {editingUnit?.payment_id ? (
                <Button 
                    variant="destructive" 
                    onClick={handleDeletePayment} 
                    type="button"
                    className="flex items-center gap-2"
                >
                    Delete Record
                </Button>
             ) : (
                <div></div> // Spacer
             )}
            <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} type="button">Cancel</Button>
                <Button onClick={handleSavePayment} type="submit" className="bg-[#154279] hover:bg-[#0f325e]">
                    {editingUnit?.payment_id ? 'Update Record' : 'Create Record'}
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;