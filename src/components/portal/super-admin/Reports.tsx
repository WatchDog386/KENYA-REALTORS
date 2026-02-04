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
import { Separator } from "@/components/ui/separator";
import { HeroBackground } from "@/components/ui/HeroBackground";

interface ReportData {
  units: UnitReport[];
  summary: SummaryData;
  property: PropertyData;
  generatedAt: string;
}

interface UnitReport {
  unit_type: string;
  monthly_rent: number;
  paid_water_bill: number;
  water_bill_arrears: number;
  paid_rent: number;
  rent_arrears: number;
  total_arrears_per_unit: number;
  payment_date: string;
  remarks: string;
  status?: 'paid' | 'partial' | 'unpaid' | 'vacant';
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
        .select("id, name, location, total_units, type")
        .order("name");

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error loading properties:", error);
      toast.error("Failed to load properties");
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
      // Generate mock report data - replace with actual Supabase queries
      const mockUnits = generateMockUnits();
      const summary = calculateSummary(mockUnits);
      const propertyData = await getPropertyData(selectedProperty);

      const reportData: ReportData = {
        units: mockUnits,
        summary,
        property: propertyData,
        generatedAt: new Date().toISOString(),
      };

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setReportData(reportData);
      setFilteredUnits(mockUnits);
      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setGeneratingReport(false);
      setLoading(false);
    }
  };

  const generateMockUnits = (): UnitReport[] => {
    // Generate comprehensive mock data
    const units: UnitReport[] = [];
    const unitTypes = [
      { type: "TWO BDR", baseRent: 40000 },
      { type: "ONE BDR", baseRent: 30000 },
      { type: "BEDSITTER", baseRent: 20000 },
    ];

    const statuses: Array<'paid' | 'partial' | 'unpaid' | 'vacant'> = ['paid', 'partial', 'unpaid', 'vacant'];
    const paymentDates = ["05/12/2025", "06/12/2025", "07/12/2025", "08/12/2025", "09/12/2025"];
    const remarks = ["", "Paid via M-Pesa", "Bank transfer", "Cash payment", "Vacant", "Defaulted"];

    for (let i = 1; i <= 40; i++) {
      const unitType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const monthlyRent = unitType.baseRent + Math.floor(Math.random() * 5000);
      const paidRent = status === 'paid' ? monthlyRent : 
                      status === 'partial' ? monthlyRent * 0.5 : 
                      status === 'vacant' ? 0 : 0;
      const rentArrears = monthlyRent - paidRent;
      const paidWaterBill = Math.floor(Math.random() * 3000);
      const waterBillArrears = Math.floor(Math.random() * 1000);
      const totalArrears = rentArrears + waterBillArrears;

      units.push({
        unit_type: `UNIT-${i.toString().padStart(3, '0')}: ${unitType.type}`,
        monthly_rent: monthlyRent,
        paid_water_bill: paidWaterBill,
        water_bill_arrears: waterBillArrears,
        paid_rent: paidRent,
        rent_arrears: rentArrears,
        total_arrears_per_unit: totalArrears,
        payment_date: paymentDates[Math.floor(Math.random() * paymentDates.length)],
        remarks: remarks[Math.floor(Math.random() * remarks.length)],
        status,
      });
    }

    return units.sort((a, b) => a.unit_type.localeCompare(b.unit_type));
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
      return {
        name: "All Properties - Ayden Homes Ltd",
        location: "Multiple Locations, Nairobi",
        total_units: 40,
        occupied_units: 32,
        manager_name: "Duncan Marshel Agiro",
        manager_contact: "+254 712 345 678",
        manager_email: "duncan.agiro@aydenhomes.co.ke",
      };
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

      return {
        name: data.name || "Unknown Property",
        location: data.location || "Nairobi",
        total_units: data.total_units || 0,
        occupied_units: Math.floor((data.total_units || 0) * 0.8), // Calculate estimated occupied units
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
      
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] overflow-hidden py-10 shadow-lg mb-8 print:hidden relative">
        <HeroBackground />
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between gap-10"
          >
            <div className="md:w-1/2">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/30">
                  Analytics
                </span>
                <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">
                  Reports
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                System <span className="text-[#F96302]">Reports</span>
              </h1>
              
              <p className="text-sm text-blue-100 leading-relaxed mb-8 max-w-lg font-medium">
                Generate detailed financial, rental, and occupancy reports for your properties.
              </p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={printReport}
                  className="group flex items-center gap-2 bg-white text-[#154279] px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Printer className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  Print Report
                </button>
              </div>
            </div>
            
             <div className="md:w-1/2 w-full mt-6 md:mt-0 flex justify-end">
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white max-w-xs w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-blue-100 uppercase tracking-wider">Generated</div>
                      <div className="text-xl font-bold">{reportData ? "1 Report" : "0 Reports"}</div>
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

      <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8 print:space-y-2">

      {/* Report Controls */}
      <Card className="print:hidden border-2 border-slate-200 bg-white shadow-lg">
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            Select report parameters and generate reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Report Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="bg-white hover:border-[#154279] hover:text-[#154279] transition-colors border-slate-200">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-lg z-50">
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id} className="focus:bg-[#154279] focus:text-white cursor-pointer">
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        <div>
                          <div>{type.name}</div>
                          <div className="text-xs opacity-80">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Property */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Property</label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="bg-white hover:border-[#154279] hover:text-[#154279] transition-colors border-slate-200">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-lg z-50">
                  <SelectItem value="all" className="focus:bg-[#154279] focus:text-white cursor-pointer">All Properties</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id} className="focus:bg-[#154279] focus:text-white cursor-pointer">
                      {property.name} ({property.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="bg-white hover:border-[#154279] hover:text-[#154279] transition-colors border-slate-200">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-lg z-50">
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const value = date.toISOString().slice(0, 7);
                    const label = date.toLocaleDateString("en-KE", {
                      month: "long",
                      year: "numeric",
                    });
                    return (
                      <SelectItem key={value} value={value} className="focus:bg-[#154279] focus:text-white cursor-pointer">
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Action</label>
              <Button
                onClick={generateReport}
                className="w-full bg-[#154279] hover:bg-[#0f325e] text-white font-bold rounded-xl"
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
        </CardContent>
      </Card>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : reportData ? (
        <div className="space-y-6 print:space-y-4">
          {/* Report Header */}
          <div className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm print:border-0 print:p-4 print:shadow-none">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 print:mb-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:grid-cols-2 print:gap-2 print:mb-4">
              <Card className="bg-blue-50 border-blue-200 print:border print:p-2">
                <CardHeader className="pb-2 print:pb-1">
                  <CardTitle className="text-sm font-medium text-blue-800">
                    Total Rent Collected
                  </CardTitle>
                </CardHeader>
                <CardContent className="print:p-0">
                  <div className="text-2xl font-bold text-blue-900">
                    {formatCurrency(reportData.summary.total_paid_rent)}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    Collection Rate: {reportData.summary.collection_rate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200 print:border print:p-2">
                <CardHeader className="pb-2 print:pb-1">
                  <CardTitle className="text-sm font-medium text-green-800">
                    Occupancy Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="print:p-0">
                  <div className="text-2xl font-bold text-green-900">
                    {(100 - reportData.summary.vacancy_rate).toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    {reportData.property.occupied_units}/{reportData.property.total_units} units
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200 print:border print:p-2">
                <CardHeader className="pb-2 print:pb-1">
                  <CardTitle className="text-sm font-medium text-red-800">
                    Total Arrears
                  </CardTitle>
                </CardHeader>
                <CardContent className="print:p-0">
                  <div className="text-2xl font-bold text-red-900">
                    {formatCurrency(reportData.summary.total_arrears)}
                  </div>
                  <div className="text-sm text-red-700 mt-1">
                    {reportData.summary.total_vacant_units} vacant units
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200 print:border print:p-2">
                <CardHeader className="pb-2 print:pb-1">
                  <CardTitle className="text-sm font-medium text-yellow-800">
                    Water Bills
                  </CardTitle>
                </CardHeader>
                <CardContent className="print:p-0">
                  <div className="text-2xl font-bold text-yellow-900">
                    {formatCurrency(reportData.summary.total_paid_water_bill)}
                  </div>
                  <div className="text-sm text-yellow-700 mt-1">
                    {formatCurrency(reportData.summary.total_water_bill_arrears)} arrears
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 print:hidden">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search units by type or remarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-700">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 shadow-lg z-50">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id} className="hover:bg-slate-50 focus:bg-slate-50 cursor-pointer">
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white border-slate-200 text-[#154279] hover:bg-slate-50 hover:text-[#154279] font-medium rounded-xl">
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

            {/* Report Table */}
            <div className="overflow-x-auto print:overflow-visible">
              <Table className="print:text-xs">
                <TableHeader className="bg-gray-50 print:bg-gray-100">
                  <TableRow>
                    <TableHead className="font-bold w-[180px]">UNIT TYPE</TableHead>
                    <TableHead className="text-right font-bold">MONTHLY RENT</TableHead>
                    <TableHead className="text-right font-bold">PAID WATER BILL</TableHead>
                    <TableHead className="text-right font-bold">WATER BILL ARREARS</TableHead>
                    <TableHead className="text-right font-bold">PAID RENT</TableHead>
                    <TableHead className="text-right font-bold">RENT ARREARS</TableHead>
                    <TableHead className="text-right font-bold">TOTAL ARREARS</TableHead>
                    <TableHead className="font-bold">PAYMENT DATE</TableHead>
                    <TableHead className="font-bold">STATUS</TableHead>
                    <TableHead className="font-bold">REMARKS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.map((unit, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 print:hover:bg-transparent">
                      <TableCell className="font-medium">{unit.unit_type}</TableCell>
                      <TableCell className="text-right">{formatCurrency(unit.monthly_rent)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(unit.paid_water_bill)}</TableCell>
                      <TableCell className="text-right">
                        {unit.water_bill_arrears > 0 ? (
                          <span className="text-red-600 font-medium">
                            {formatCurrency(unit.water_bill_arrears)}
                          </span>
                        ) : (
                          formatCurrency(unit.water_bill_arrears)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={unit.status === 'paid' ? 'text-green-600 font-medium' : ''}>
                          {formatCurrency(unit.paid_rent)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {unit.rent_arrears > 0 ? (
                          <span className="text-red-600 font-medium">
                            {formatCurrency(unit.rent_arrears)}
                          </span>
                        ) : (
                          formatCurrency(unit.rent_arrears)
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {unit.total_arrears_per_unit > 0 ? (
                          <span className="text-red-600">
                            {formatCurrency(unit.total_arrears_per_unit)}
                          </span>
                        ) : (
                          formatCurrency(unit.total_arrears_per_unit)
                        )}
                      </TableCell>
                      <TableCell>{unit.payment_date}</TableCell>
                      <TableCell>{getStatusBadge(unit.status)}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{unit.remarks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary Section */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border print:p-4 print:break-inside-avoid">
              <h3 className="font-bold text-lg mb-4 print:mb-2">SUMMARY</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Total Monthly Rent:</span>
                    <span className="font-bold text-lg">{formatCurrency(reportData.summary.total_monthly_rent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Paid Water Bill:</span>
                    <span className="font-semibold">{formatCurrency(reportData.summary.total_paid_water_bill)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Water Bill Arrears:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(reportData.summary.total_water_bill_arrears)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Paid Rent:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(reportData.summary.total_paid_rent)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Rent Arrears:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(reportData.summary.total_rent_arrears)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vacant Units:</span>
                    <span className="font-semibold">{reportData.summary.total_vacant_units} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Defaulted Units:</span>
                    <span className="font-semibold">{reportData.summary.defaulted_units} units</span>
                  </div>
                  <div className="flex justify-between pt-3 mt-3 border-t">
                    <span className="font-bold text-lg">TOTAL ARREARS:</span>
                    <span className="font-bold text-red-600 text-xl">
                      {formatCurrency(reportData.summary.total_arrears)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Summary Info */}
              <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4 print:mt-4 print:pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{reportData.summary.vacancy_rate.toFixed(2)}%</div>
                  <div className="text-sm text-gray-600">Vacancy Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{reportData.summary.collection_rate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Collection Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {reportData.property.occupied_units}/{reportData.property.total_units}
                  </div>
                  <div className="text-sm text-gray-600">Units Occupied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {filteredUnits.length}
                  </div>
                  <div className="text-sm text-gray-600">Units in Report</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-sm text-gray-600 print:mt-6 print:pt-4">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <p className="font-medium">Yours Faithfully,</p>
                  <p className="mt-2 font-semibold">{reportData.property.manager_name}</p>
                  <p className="text-gray-500">For: {reportData.property.name}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Contact: {reportData.property.manager_contact} | {reportData.property.manager_email}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <p className="font-medium">Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                  <p className="text-gray-500 text-xs">System Generated Report • {reportData.property.location}</p>
                  <p className="text-gray-400 text-xs mt-1">Page 1 of 1</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Panel (Non-printable) */}
          <Card className="print:hidden border-2 border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Report Statistics</CardTitle>
                  <CardDescription>Key metrics from generated report</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-700">
                    {formatForDisplay(reportData.summary.total_paid_rent, 'KSH', true)}
                  </div>
                  <div className="text-sm text-blue-600 mt-2">Total Collection</div>
                  <div className="text-xs text-blue-500">
                    {reportData.summary.collection_rate.toFixed(1)}% collection rate
                  </div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-700">
                    {formatForDisplay(reportData.summary.total_arrears, 'KSH', true)}
                  </div>
                  <div className="text-sm text-green-600 mt-2">Outstanding Arrears</div>
                  <div className="text-xs text-green-500">
                    {reportData.summary.total_vacant_units} vacant units
                  </div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-700">
                    {(100 - reportData.summary.vacancy_rate).toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-600 mt-2">Occupancy Rate</div>
                  <div className="text-xs text-purple-500">
                    {reportData.property.occupied_units} of {reportData.property.total_units} units
                  </div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-700">
                    {filteredUnits.length}
                  </div>
                  <div className="text-sm text-yellow-600 mt-2">Units in Report</div>
                  <div className="text-xs text-yellow-500">
                    {reportData.summary.defaulted_units} defaulted units
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="print:hidden border-2 border-slate-200 bg-white shadow-lg">
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
    </div>
  );
};

export default Reports;