// src/components/portal/super-admin/AnalyticsDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Home,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeroBackground } from "@/components/ui/HeroBackground";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateHelpers";

// Recharts for charts
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsDashboardProps {
  timeframe?: "today" | "week" | "month" | "quarter" | "year";
  onTimeframeChange?: (timeframe: string) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  timeframe = "month",
  onTimeframeChange,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [selectedMetric, setSelectedMetric] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    stats: analytics,
    loading,
    refresh: fetchAnalytics,
    exportAnalytics,
  } = useDashboardAnalytics();

  // Load analytics data
  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeframe]);

  const loadAnalytics = async () => {
    try {
      fetchAnalytics();
    } catch (error) {
      toast.error("Failed to load analytics data");
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setIsRefreshing(false);
    toast.success("Analytics refreshed");
  };

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    const timeframeValue = value as "today" | "week" | "month" | "quarter" | "year"
    setSelectedTimeframe(timeframeValue)
    if (onTimeframeChange) {
      onTimeframeChange(value)
    }
  };

  // Handle export
  const handleExport = async (format: "csv" | "json") => {
    try {
      await exportAnalytics(format);
      toast.success(`Exporting analytics as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export analytics");
    }
  };

  // Get metrics
  const financialMetrics = {
    totalRevenue: analytics.totalRevenue,
    monthlyGrowth: analytics.monthlyGrowth,
    revenueChange: analytics.monthlyGrowth,
    rentCollected: analytics.totalRevenue * 0.7,
    maintenanceFees: analytics.totalRevenue * 0.15,
    otherIncome: analytics.totalRevenue * 0.15,
    netIncome: analytics.totalRevenue * 0.6,
    paymentStatus: {
      onTime: 75,
      late: 15,
      overdue: 10
    }
  };
  const occupancyMetrics = {
    activeProperties: analytics.propertiesByStatus.rented,
    totalProperties: analytics.totalProperties,
    occupancyRate: analytics.totalProperties > 0 ? (analytics.propertiesByStatus.rented / analytics.totalProperties) * 100 : 0,
    occupancyChange: 5.2
  };
  const userMetrics = {
    activeUsers: analytics.activeUsers,
    newUsers: analytics.newUsers,
    userGrowth: 12.5,
    dailyActiveUsers: Math.floor(analytics.activeUsers * 0.3),
    weeklyActiveUsers: Math.floor(analytics.activeUsers * 0.7),
    monthlyActiveUsers: analytics.activeUsers,
    avgSessionDuration: analytics.avgSessionDuration,
    roleDistribution: [
      { name: 'Super Admin', value: analytics.usersByRole.super_admin },
      { name: 'Property Manager', value: analytics.usersByRole.property_manager },
      { name: 'Tenant', value: analytics.usersByRole.tenant }
    ]
  };
  const propertyMetrics = {
    byStatus: analytics.propertiesByStatus,
    byType: analytics.propertyTypes,
    totalProperties: analytics.totalProperties,
    availableProperties: analytics.propertiesByStatus.active,
    occupiedProperties: analytics.propertiesByStatus.rented,
    statusDistribution: [
      { status: 'Active', value: analytics.propertiesByStatus.active },
      { status: 'Rented', value: analytics.propertiesByStatus.rented },
      { status: 'Pending', value: analytics.propertiesByStatus.pending },
      { status: 'Maintenance', value: analytics.propertiesByStatus.maintenance },
      { status: 'Sold', value: analytics.propertiesByStatus.sold }
    ],
    topProperties: [
      { id: 1, name: 'Luxury Apartment Complex', revenue: 45000, occupancy: 95 },
      { id: 2, name: 'Downtown Office Suite', revenue: 38000, occupancy: 88 },
      { id: 3, name: 'Suburban Family Homes', revenue: 32000, occupancy: 92 }
    ]
  };

  // Chart data
  const revenueData = analytics.monthlyRevenue || [];
  const occupancyData = [];
  const propertyTypeData = analytics.propertyTypes || [];
  const userGrowthData = [];

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
  const PROPERTY_TYPE_COLORS = {
    apartment: "#0088FE",
    house: "#00C49F",
    commercial: "#FFBB28",
    land: "#FF8042",
    other: "#8884D8",
  };

  // Calculate percentage change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#154279] to-[#0f325e] text-white py-12 px-6 shadow-xl mb-8 lg:rounded-b-3xl">
        <HeroBackground />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-[1400px] mx-auto">
          <div className="space-y-1">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-inner">
                    <BarChart3 className="w-5 h-5 text-white" />
                 </div>
                 <span className="text-blue-100 font-bold tracking-wider text-xs uppercase">Dashboard</span>
             </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Analytics <span className="text-[#F96302]">Overview</span>
            </h1>
            <p className="text-blue-100 text-sm mt-2 font-medium max-w-xl">
              Comprehensive system insights, financial metrics, and performance analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="group flex items-center gap-2 bg-white text-[#154279] px-5 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-blue-50 transition-all duration-300 rounded-xl shadow-lg border-2 border-white hover:shadow-xl hover:-translate-y-0.5"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
              />
              Refresh
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex items-center gap-2 bg-white/10 text-white px-5 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all duration-300 rounded-xl border border-white/20 hover:border-white/40 shadow-sm backdrop-blur-sm">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-2">
                <DropdownMenuLabel className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport("csv")} className="cursor-pointer font-medium">
                  CSV Format
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")} className="cursor-pointer font-medium">
                  JSON Format
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 space-y-8">
      {/* Timeframe Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border-2 border-slate-200">
        <Tabs
          value={selectedMetric}
          onValueChange={setSelectedMetric}
          className="w-full"
        >
          <TabsList className="bg-slate-100 rounded-lg p-1">
            <TabsTrigger value="overview" className="rounded-md transition-all">Overview</TabsTrigger>
            <TabsTrigger value="financial" className="rounded-md transition-all">Financial</TabsTrigger>
            <TabsTrigger value="properties" className="rounded-md transition-all">Properties</TabsTrigger>
            <TabsTrigger value="users" className="rounded-md transition-all">Users</TabsTrigger>
            <TabsTrigger value="performance" className="rounded-md transition-all">Performance</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 ml-auto">
          <Select
            value={selectedTimeframe}
            onValueChange={handleTimeframeChange}
          >
            <SelectTrigger className="w-[140px] bg-white border-2 border-slate-200 rounded-xl">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-slate-200 bg-white hover:border-[#154279] transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-bold text-slate-700">
                Total Revenue
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-black text-[#154279]">
                {formatCurrency(financialMetrics.totalRevenue || 0)}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium">
                {financialMetrics.revenueChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={
                    financialMetrics.revenueChange >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {Math.abs(financialMetrics.revenueChange)?.toFixed(1)}%
                </span>
                <span className="text-gray-500">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 bg-white hover:border-[#154279] transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Occupancy Rate
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {occupancyMetrics.occupancyRate?.toFixed(1)}%
              </div>
              <div className="flex items-center gap-2 text-xs font-medium">
                {occupancyMetrics.occupancyChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={
                    occupancyMetrics.occupancyChange >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {Math.abs(occupancyMetrics.occupancyChange)?.toFixed(1)}%
                </span>
                <span className="text-gray-500">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 bg-white hover:border-[#154279] transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Active Users
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {userMetrics.activeUsers}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium">
                {userMetrics.userGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={
                    userMetrics.userGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {Math.abs(userMetrics.userGrowth)?.toFixed(1)}%
                </span>
                <span className="text-gray-500">growth</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 bg-white hover:border-[#154279] transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Properties</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Home className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {propertyMetrics.totalProperties}
              </div>
              <div className="text-xs text-gray-600 font-medium">
                {propertyMetrics.availableProperties} available, {propertyMetrics.occupiedProperties} occupied
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Trend */}
          <Card className="border-2 border-slate-200 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Revenue Trend</CardTitle>
              <CardDescription className="text-gray-600">Monthly revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        "Revenue",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0088FE"
                      strokeWidth={2}
                      name="Revenue"
                      dot={{ r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Occupancy Trend */}
          <Card className="border-2 border-slate-200 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Occupancy Trend</CardTitle>
              <CardDescription className="text-gray-600">Property occupancy rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Occupancy"]}
                    />
                    <Legend />
                    <Bar
                      dataKey="occupancyRate"
                      fill="#00C49F"
                      name="Occupancy Rate"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Property Type Distribution */}
          <Card className="border-2 border-slate-200 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Property Type Distribution</CardTitle>
              <CardDescription className="text-gray-600">Breakdown by property type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={propertyTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100)?.toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {propertyTypeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} properties`, "Count"]}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* User Growth */}
          <Card className="border-2 border-slate-200 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">User Growth</CardTitle>
              <CardDescription className="text-gray-600">New user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newUsers" fill="#8884D8" name="New Users" />
                    <Bar
                      dataKey="activeUsers"
                      fill="#00C49F"
                      name="Active Users"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Financial Tab */}
      <TabsContent value="financial" className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-slate-200 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-semibold">
                    {formatCurrency(financialMetrics.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rent Collected</span>
                  <span className="font-semibold">
                    {formatCurrency(financialMetrics.rentCollected)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Maintenance Fees</span>
                  <span className="font-semibold">
                    {formatCurrency(financialMetrics.maintenanceFees)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Other Income</span>
                  <span className="font-semibold">
                    {formatCurrency(financialMetrics.otherIncome)}
                  </span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="font-medium">Net Income</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(financialMetrics.netIncome)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-2 border-slate-200 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>On Time</span>
                    <span>{financialMetrics.paymentStatus?.onTime || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${
                          financialMetrics.paymentStatus?.onTime || 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Late</span>
                    <span>{financialMetrics.paymentStatus?.late || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${financialMetrics.paymentStatus?.late || 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overdue</span>
                    <span>{financialMetrics.paymentStatus?.overdue || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${
                          financialMetrics.paymentStatus?.overdue || 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Properties Tab */}
      <TabsContent value="properties" className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-2 border-slate-200 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Property Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propertyMetrics.statusDistribution?.map((status: any) => (
                  <div
                    key={status.status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            status.status === "available"
                              ? "#10B981"
                              : status.status === "occupied"
                              ? "#3B82F6"
                              : status.status === "under_maintenance"
                              ? "#F59E0B"
                              : "#EF4444",
                        }}
                      />
                      <span className="capitalize">
                        {status.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{status.count}</span>
                      <span className="text-gray-500 text-sm">
                        ({status.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Top Performing Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propertyMetrics.topProperties?.map(
                  (property: any, index: number) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Home className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{property.name}</div>
                          <div className="text-sm text-gray-500">
                            {property.type}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatCurrency(property.revenue)}
                        </div>
                        <div className="text-sm text-green-600">
                          +{property.occupancyRate}% occupancy
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Users Tab */}
      <TabsContent value="users" className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-2 border-slate-200 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">User Distribution by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={userMetrics.roleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100)?.toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {userMetrics.roleDistribution?.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} users`, "Count"]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 bg-white shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">User Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Daily Active Users</span>
                  <span className="font-bold text-gray-900">
                    {userMetrics.dailyActiveUsers}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Weekly Active Users</span>
                  <span className="font-bold text-gray-900">
                    {userMetrics.weeklyActiveUsers}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Monthly Active Users</span>
                  <span className="font-bold text-gray-900">
                    {userMetrics.monthlyActiveUsers}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Avg Session Duration</span>
                  <span className="font-bold text-gray-900">
                    {userMetrics.avgSessionDuration}m
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </div>
    </div>
  );
};

export default AnalyticsDashboard;
