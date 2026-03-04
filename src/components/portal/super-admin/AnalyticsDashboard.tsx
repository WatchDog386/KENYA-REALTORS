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
  Bell,
  Search
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
  Area,
  AreaChart,
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setIsRefreshing(false);
    toast.success("Analytics refreshed");
  };

  const handleTimeframeChange = (value: string) => {
    const timeframeValue = value as "today" | "week" | "month" | "quarter" | "year";
    setSelectedTimeframe(timeframeValue);
    if (onTimeframeChange) {
      onTimeframeChange(value);
    }
  };

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
    paymentStatus: analytics.paymentStatus || { onTime: 0, late: 0, overdue: 0 }
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
      { status: 'Active', value: analytics.propertiesByStatus.active, percentage: analytics.totalProperties > 0 ? Math.round((analytics.propertiesByStatus.active / analytics.totalProperties) * 100) : 0 },
      { status: 'Rented', value: analytics.propertiesByStatus.rented, percentage: analytics.totalProperties > 0 ? Math.round((analytics.propertiesByStatus.rented / analytics.totalProperties) * 100) : 0 },
      { status: 'Pending', value: analytics.propertiesByStatus.pending, percentage: analytics.totalProperties > 0 ? Math.round((analytics.propertiesByStatus.pending / analytics.totalProperties) * 100) : 0 },
      { status: 'Maintenance', value: analytics.propertiesByStatus.maintenance, percentage: analytics.totalProperties > 0 ? Math.round((analytics.propertiesByStatus.maintenance / analytics.totalProperties) * 100) : 0 },
      { status: 'Sold', value: analytics.propertiesByStatus.sold, percentage: analytics.totalProperties > 0 ? Math.round((analytics.propertiesByStatus.sold / analytics.totalProperties) * 100) : 0 }
    ],
    topProperties: analytics.topProperties || []
  };

  // Chart data
  const revenueData = analytics.monthlyRevenue || [];
  const occupancyData = analytics.occupancyData || [];
  const propertyTypeData = analytics.propertyTypes || [];
  const userGrowthData = analytics.userGrowthData || [];

  // Dark theme colors for charts
  const COLORS = ["#7B5CFF", "#00D09E", "#FFB038", "#FF4B4B", "#4A4A65"];
  
  // Custom tooltips and axis stylings for Recharts in dark mode
  const chartAxisProps = {
    stroke: "#4A4A65",
    tick: { fill: "#8A8A98", fontSize: 12 },
    tickLine: { stroke: "#2A2A35" },
    axisLine: { stroke: "#2A2A35" }
  };

  return (
    <div className="bg-[#0D0D12] min-h-screen pb-20 font-sans text-white selection:bg-[#7B5CFF]/30">
      
      {/* Top Navigation / Header Area */}
      <header className="px-8 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 bg-[#12121A]/50 backdrop-blur-md sticky top-0 z-50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-[#8A8A98] text-sm mt-1 font-medium">
            Welcome back! Here's your system analytics.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-[#1C1C26] rounded-full px-4 py-2 border border-white/5">
            <Search className="w-4 h-4 text-[#8A8A98] mr-2" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-[#8A8A98] w-48"
            />
          </div>
          
          <button className="p-2.5 rounded-full bg-[#1C1C26] border border-white/5 text-[#8A8A98] hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#FF4B4B] rounded-full"></span>
          </button>

          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#7B5CFF] to-[#00D09E] p-[2px] cursor-pointer">
            <div className="w-full h-full rounded-full bg-[#1C1C26] flex items-center justify-center border-2 border-[#1C1C26]">
              <span className="text-xs font-bold text-white">SA</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 md:px-8 mt-8 space-y-8">
        
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Tabs
            value={selectedMetric}
            onValueChange={setSelectedMetric}
            className="w-full md:w-auto"
          >
            <TabsList className="bg-[#1C1C26] rounded-xl p-1 border border-white/5 h-12">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-[#7B5CFF] data-[state=active]:text-white text-[#8A8A98] transition-all px-6 py-2">Overview</TabsTrigger>
              <TabsTrigger value="financial" className="rounded-lg data-[state=active]:bg-[#7B5CFF] data-[state=active]:text-white text-[#8A8A98] transition-all px-6 py-2">Financial</TabsTrigger>
              <TabsTrigger value="properties" className="rounded-lg data-[state=active]:bg-[#7B5CFF] data-[state=active]:text-white text-[#8A8A98] transition-all px-6 py-2">Properties</TabsTrigger>
              <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-[#7B5CFF] data-[state=active]:text-white text-[#8A8A98] transition-all px-6 py-2">Users</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center w-12 h-12 bg-[#1C1C26] text-white hover:bg-[#252533] transition-all duration-300 rounded-xl border border-white/5"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            
            <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="w-[160px] h-12 bg-[#1C1C26] border-white/5 rounded-xl text-white focus:ring-[#7B5CFF]">
                <Calendar className="w-4 h-4 mr-2 text-[#8A8A98]" />
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1C26] border-white/10 text-white rounded-xl">
                <SelectItem value="today" className="focus:bg-[#252533] focus:text-white">Today</SelectItem>
                <SelectItem value="week" className="focus:bg-[#252533] focus:text-white">This Week</SelectItem>
                <SelectItem value="month" className="focus:bg-[#252533] focus:text-white">This Month</SelectItem>
                <SelectItem value="quarter" className="focus:bg-[#252533] focus:text-white">This Quarter</SelectItem>
                <SelectItem value="year" className="focus:bg-[#252533] focus:text-white">This Year</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center w-12 h-12 bg-[#7B5CFF] hover:bg-[#6A4FE0] text-white transition-all duration-300 rounded-xl shadow-[0_4px_20px_rgba(123,92,255,0.3)]">
                  <Download className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-[#1C1C26] border-white/10 text-white rounded-xl p-2">
                <DropdownMenuLabel className="text-xs font-semibold text-[#8A8A98] mb-1">Export As</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => handleExport("csv")} className="focus:bg-[#252533] focus:text-white cursor-pointer rounded-lg">CSV Format</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")} className="focus:bg-[#252533] focus:text-white cursor-pointer rounded-lg">JSON Format</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 mt-0 focus:outline-none">
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-[#151520] border-none rounded-3xl p-2 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#7B5CFF]/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#7B5CFF]/20"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-[#8A8A98]">Total Revenue</CardTitle>
                <div className="h-10 w-10 rounded-2xl bg-[#7B5CFF]/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-[#7B5CFF]" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10 pb-4">
                <div className="text-3xl font-bold text-white tracking-tight">
                  {formatCurrency(financialMetrics.totalRevenue || 0)}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`flex items-center gap-1 font-semibold ${financialMetrics.revenueChange >= 0 ? "text-[#00D09E]" : "text-[#FF4B4B]"}`}>
                    {financialMetrics.revenueChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {Math.abs(financialMetrics.revenueChange)?.toFixed(1)}%
                  </span>
                  <span className="text-[#8A8A98]">vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#151520] border-none rounded-3xl p-2 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D09E]/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#00D09E]/20"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-[#8A8A98]">Occupancy Rate</CardTitle>
                <div className="h-10 w-10 rounded-2xl bg-[#00D09E]/10 flex items-center justify-center">
                  <Home className="h-5 w-5 text-[#00D09E]" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10 pb-4">
                <div className="text-3xl font-bold text-white tracking-tight">
                  {occupancyMetrics.occupancyRate?.toFixed(1)}%
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`flex items-center gap-1 font-semibold ${occupancyMetrics.occupancyChange >= 0 ? "text-[#00D09E]" : "text-[#FF4B4B]"}`}>
                    {occupancyMetrics.occupancyChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {Math.abs(occupancyMetrics.occupancyChange)?.toFixed(1)}%
                  </span>
                  <span className="text-[#8A8A98]">vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#151520] border-none rounded-3xl p-2 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB038]/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#FFB038]/20"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-[#8A8A98]">Active Users</CardTitle>
                <div className="h-10 w-10 rounded-2xl bg-[#FFB038]/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-[#FFB038]" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10 pb-4">
                <div className="text-3xl font-bold text-white tracking-tight">
                  {userMetrics.activeUsers}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`flex items-center gap-1 font-semibold ${userMetrics.userGrowth >= 0 ? "text-[#00D09E]" : "text-[#FF4B4B]"}`}>
                    {userMetrics.userGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {Math.abs(userMetrics.userGrowth)?.toFixed(1)}%
                  </span>
                  <span className="text-[#8A8A98]">growth</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#151520] border-none rounded-3xl p-2 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4B4B]/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-[#FF4B4B]/20"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-[#8A8A98]">Total Properties</CardTitle>
                <div className="h-10 w-10 rounded-2xl bg-[#FF4B4B]/10 flex items-center justify-center">
                  <Home className="h-5 w-5 text-[#FF4B4B]" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10 pb-4">
                <div className="text-3xl font-bold text-white tracking-tight">
                  {propertyMetrics.totalProperties}
                </div>
                <div className="text-sm text-[#8A8A98] font-medium flex gap-3">
                  <span className="flex items-center gap-1 text-[#00D09E]"><span className="w-2 h-2 rounded-full bg-[#00D09E]"></span> {propertyMetrics.availableProperties} Available</span>
                  <span className="flex items-center gap-1 text-[#FFB038]"><span className="w-2 h-2 rounded-full bg-[#FFB038]"></span> {propertyMetrics.occupiedProperties} Occupied</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Area Chart - Takes up 2/3 width */}
            <Card className="lg:col-span-2 bg-[#151520] border-none rounded-3xl shadow-sm">
              <CardHeader className="pb-4 pt-6 px-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-white">Revenue Statistics</CardTitle>
                  <CardDescription className="text-[#8A8A98]">Monthly revenue generation over time</CardDescription>
                </div>
                <button className="p-2 hover:bg-[#1C1C26] rounded-xl transition-colors">
                  <MoreVertical className="w-5 h-5 text-[#8A8A98]" />
                </button>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7B5CFF" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#7B5CFF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A35" />
                      <XAxis dataKey="month" {...chartAxisProps} />
                      <YAxis {...chartAxisProps} tickFormatter={(value) => `$${value/1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1C1C26', border: 'none', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#7B5CFF' }}
                        formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#7B5CFF" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Occupancy Trend - Bar Chart - Takes up 1/3 width */}
            <Card className="bg-[#151520] border-none rounded-3xl shadow-sm">
              <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-white">Occupancy Rate</CardTitle>
                  <CardDescription className="text-[#8A8A98]">Monthly averages</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-6">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A35" />
                      <XAxis dataKey="month" {...chartAxisProps} />
                      <YAxis {...chartAxisProps} />
                      <Tooltip
                         contentStyle={{ backgroundColor: '#1C1C26', border: 'none', borderRadius: '12px', color: '#fff' }}
                         cursor={{ fill: '#1C1C26' }}
                         formatter={(value) => [`${value}%`, "Occupancy"]}
                      />
                      <Bar dataKey="occupancyRate" fill="#00D09E" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Property Type Distribution */}
            <Card className="bg-[#151520] border-none rounded-3xl shadow-sm">
              <CardHeader className="pb-2 pt-6 px-8">
                <CardTitle className="text-lg font-bold text-white">Asset Distribution</CardTitle>
                <CardDescription className="text-[#8A8A98]">Breakdown by property category</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={propertyTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="count"
                        stroke="none"
                      >
                        {propertyTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1C1C26', border: 'none', borderRadius: '12px', color: '#fff' }}
                        formatter={(value) => [`${value} properties`, "Count"]}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ color: '#8A8A98', fontSize: '12px' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* User Growth */}
            <Card className="bg-[#151520] border-none rounded-3xl shadow-sm">
              <CardHeader className="pb-2 pt-6 px-8 flex flex-row items-center justify-between">
                 <div>
                   <CardTitle className="text-lg font-bold text-white">Platform Growth</CardTitle>
                   <CardDescription className="text-[#8A8A98]">User registration & activity</CardDescription>
                 </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userGrowthData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A35" />
                      <XAxis dataKey="month" {...chartAxisProps} />
                      <YAxis {...chartAxisProps} />
                      <Tooltip 
                         contentStyle={{ backgroundColor: '#1C1C26', border: 'none', borderRadius: '12px', color: '#fff' }}
                         cursor={{ fill: '#1C1C26' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ color: '#8A8A98', fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="newUsers" fill="#7B5CFF" name="New Users" radius={[4, 4, 0, 0]} barSize={16} />
                      <Bar dataKey="activeUsers" fill="#FFB038" name="Active Users" radius={[4, 4, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6 mt-0 focus:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#151520] border-none rounded-3xl shadow-sm">
              <CardHeader className="pb-4 pt-6 px-8">
                <CardTitle className="text-lg font-bold text-white">Revenue Summary</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-5">
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-[#7B5CFF]"></div>
                     <span className="text-[#8A8A98] group-hover:text-white transition-colors">Total Revenue</span>
                  </div>
                  <span className="font-semibold text-white">{formatCurrency(financialMetrics.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-[#00D09E]"></div>
                     <span className="text-[#8A8A98] group-hover:text-white transition-colors">Rent Collected</span>
                  </div>
                  <span className="font-semibold text-white">{formatCurrency(financialMetrics.rentCollected)}</span>
                </div>
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-[#FFB038]"></div>
                     <span className="text-[#8A8A98] group-hover:text-white transition-colors">Maintenance Fees</span>
                  </div>
                  <span className="font-semibold text-white">{formatCurrency(financialMetrics.maintenanceFees)}</span>
                </div>
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-[#4A4A65]"></div>
                     <span className="text-[#8A8A98] group-hover:text-white transition-colors">Other Income</span>
                  </div>
                  <span className="font-semibold text-white">{formatCurrency(financialMetrics.otherIncome)}</span>
                </div>
                <div className="pt-6 mt-2 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">Net Income</span>
                    <span className="text-xl font-bold text-[#00D09E]">{formatCurrency(financialMetrics.netIncome)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 bg-[#151520] border-none rounded-3xl shadow-sm">
              <CardHeader className="pb-4 pt-6 px-8">
                <CardTitle className="text-lg font-bold text-white">Payment Status Analytics</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8 flex flex-col justify-center h-[calc(100%-80px)] space-y-8">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#00D09E]"></div>On Time</span>
                    <span className="text-[#8A8A98]">{financialMetrics.paymentStatus?.onTime || 0}%</span>
                  </div>
                  <div className="w-full bg-[#1C1C26] rounded-full h-3 overflow-hidden">
                    <div className="bg-[#00D09E] h-full rounded-full transition-all duration-500 ease-in-out relative" style={{ width: `${financialMetrics.paymentStatus?.onTime || 0}%`}}>
                       <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20"></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FFB038]"></div>Late Payments</span>
                    <span className="text-[#8A8A98]">{financialMetrics.paymentStatus?.late || 0}%</span>
                  </div>
                  <div className="w-full bg-[#1C1C26] rounded-full h-3 overflow-hidden">
                    <div className="bg-[#FFB038] h-full rounded-full transition-all duration-500 ease-in-out relative" style={{ width: `${financialMetrics.paymentStatus?.late || 0}%` }}>
                       <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20"></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FF4B4B]"></div>Overdue</span>
                    <span className="text-[#8A8A98]">{financialMetrics.paymentStatus?.overdue || 0}%</span>
                  </div>
                  <div className="w-full bg-[#1C1C26] rounded-full h-3 overflow-hidden">
                    <div className="bg-[#FF4B4B] h-full rounded-full transition-all duration-500 ease-in-out relative" style={{ width: `${financialMetrics.paymentStatus?.overdue || 0}%` }}>
                       <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6 mt-0 focus:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#151520] border-none rounded-3xl shadow-sm">
              <CardHeader className="pb-6 pt-6 px-8 border-b border-white/5">
                <CardTitle className="text-lg font-bold text-white">Property Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-4">
                <div className="space-y-1">
                  {propertyMetrics.statusDistribution?.map((status: any) => (
                    <div key={status.status} className="flex items-center justify-between p-4 hover:bg-[#1C1C26] rounded-2xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center bg-opacity-10"
                          style={{
                            backgroundColor: `${
                              status.status === "available" ? "#00D09E15" : 
                              status.status === "occupied" ? "#7B5CFF15" : 
                              status.status === "under_maintenance" ? "#FFB03815" : "#FF4B4B15"
                            }`,
                            color: status.status === "available" ? "#00D09E" : 
                                   status.status === "occupied" ? "#7B5CFF" : 
                                   status.status === "under_maintenance" ? "#FFB038" : "#FF4B4B"
                          }}
                        >
                           <Home className="w-5 h-5" />
                        </div>
                        <span className="capitalize text-white font-medium">
                          {status.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-white text-lg">{status.count}</span>
                        <span className="text-[#8A8A98] text-sm bg-[#1C1C26] px-2 py-1 rounded-lg">
                          {status.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#151520] border-none rounded-3xl shadow-sm">
              <CardHeader className="pb-6 pt-6 px-8 border-b border-white/5">
                <CardTitle className="text-lg font-bold text-white">Top Performing Properties</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {propertyMetrics.topProperties && propertyMetrics.topProperties.length > 0 ? (
                    propertyMetrics.topProperties.map((property: any, index: number) => (
                      <div key={property.id} className="flex items-center justify-between p-4 bg-[#1C1C26] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#7B5CFF]/20 to-[#00D09E]/20 flex items-center justify-center border border-white/5">
                            <Home className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-base">{property.name}</div>
                            <div className="text-xs text-[#8A8A98] mt-1 font-medium tracking-wide uppercase">
                              {property.unitCount} units available
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-white text-lg">
                            {formatCurrency(property.revenue)}
                          </div>
                          <div className="text-sm font-medium text-[#00D09E] flex items-center justify-end gap-1 mt-1">
                            <TrendingUp className="w-3 h-3" /> {property.occupancyRate}% Occ.
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-[#8A8A98]">
                      <div className="w-16 h-16 rounded-full bg-[#1C1C26] flex items-center justify-center mb-4">
                         <Search className="w-6 h-6 text-[#4A4A65]" />
                      </div>
                      No properties with revenue data yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6 mt-0 focus:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#151520] border-none rounded-3xl shadow-sm">
              <CardHeader className="pb-4 pt-6 px-8">
                <CardTitle className="text-lg font-bold text-white">Role Distribution</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={userMetrics.roleDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {userMetrics.roleDistribution?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1C1C26', border: 'none', borderRadius: '12px', color: '#fff' }}
                        formatter={(value) => [`${value} users`, "Count"]}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ color: '#8A8A98', fontSize: '13px' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#151520] border-none rounded-3xl shadow-sm">
              <CardHeader className="pb-6 pt-6 px-8 border-b border-white/5">
                <CardTitle className="text-lg font-bold text-white">Platform Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-center group cursor-default">
                  <div className="flex flex-col">
                     <span className="text-[#8A8A98] text-sm group-hover:text-white transition-colors">Daily Active Users</span>
                     <span className="font-bold text-white text-2xl mt-1">{userMetrics.dailyActiveUsers}</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#7B5CFF]/10 flex items-center justify-center text-[#7B5CFF]">
                     <Users className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="w-full h-[1px] bg-white/5"></div>
                
                <div className="flex justify-between items-center group cursor-default">
                  <div className="flex flex-col">
                     <span className="text-[#8A8A98] text-sm group-hover:text-white transition-colors">Weekly Active Users</span>
                     <span className="font-bold text-white text-2xl mt-1">{userMetrics.weeklyActiveUsers}</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#00D09E]/10 flex items-center justify-center text-[#00D09E]">
                     <Calendar className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="w-full h-[1px] bg-white/5"></div>
                
                <div className="flex justify-between items-center group cursor-default">
                  <div className="flex flex-col">
                     <span className="text-[#8A8A98] text-sm group-hover:text-white transition-colors">Avg Session Duration</span>
                     <span className="font-bold text-white text-2xl mt-1">{userMetrics.avgSessionDuration}m</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFB038]/10 flex items-center justify-center text-[#FFB038]">
                     <BarChart3 className="w-6 h-6" />
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