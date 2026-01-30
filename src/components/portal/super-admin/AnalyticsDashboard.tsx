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
    <div className="space-y-6 font-nunito">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600">Comprehensive insights and metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                CSV Format
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                JSON Format
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <Tabs
          value={selectedMetric}
          onValueChange={setSelectedMetric}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Select
            value={selectedTimeframe}
            onValueChange={handleTimeframeChange}
          >
            <SelectTrigger className="w-[140px]">
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
      <TabsContent value="overview" className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(financialMetrics.totalRevenue || 0)}
              </div>
              <div className="flex items-center gap-1 text-xs">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Occupancy Rate
              </CardTitle>
              <Home className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {occupancyMetrics.occupancyRate?.toFixed(1)}%
              </div>
              <div className="flex items-center gap-1 text-xs">
                {occupancyMetrics.occupancyChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userMetrics.activeUsers}
              </div>
              <div className="flex items-center gap-1 text-xs">
                {userMetrics.userGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <Home className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {propertyMetrics.totalProperties}
              </div>
              <div className="text-xs text-gray-500">
                {propertyMetrics.availableProperties} available,{" "}
                {propertyMetrics.occupiedProperties} occupied
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over time</CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Occupancy Trend</CardTitle>
              <CardDescription>Property occupancy rates</CardDescription>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Property Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Property Type Distribution</CardTitle>
              <CardDescription>Breakdown by property type</CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New user registrations</CardDescription>
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
      <TabsContent value="financial" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent>
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

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
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
      <TabsContent value="properties" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Status</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Properties</CardTitle>
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
      <TabsContent value="users" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Distribution by Role</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Daily Active Users</span>
                  <span className="font-bold">
                    {userMetrics.dailyActiveUsers}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Weekly Active Users</span>
                  <span className="font-bold">
                    {userMetrics.weeklyActiveUsers}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Active Users</span>
                  <span className="font-bold">
                    {userMetrics.monthlyActiveUsers}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Session Duration</span>
                  <span className="font-bold">
                    {userMetrics.avgSessionDuration}m
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </div>
  );
};

export default AnalyticsDashboard;
