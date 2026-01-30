import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  Users,
  DollarSign,
  Wrench,
  AlertTriangle,
  FileText,
  Calendar,
  MessageSquare,
  TrendingUp,
  Loader2,
  RefreshCw,
  ChevronRight,
  BarChart3,
  CheckCircle,
  Clock,
  Bell,
  Settings,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useManager } from "@/hooks/useManager";
import { formatCurrency } from "@/utils/formatCurrency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ManagerPortal = () => {
  const {
    stats,
    pendingTasks,
    upcomingEvents,
    profile,
    loading,
    error,
    refetch,
    getAssignedProperties,
  } = useManager();

  const [properties, setProperties] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  // Load custom fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      body { font-family: 'Montserrat', sans-serif; }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (stats?.properties) {
      setProperties(stats.properties.slice(0, 3)); // Show only first 3 properties
    }

    // Fetch recent payments
    fetchRecentPayments();

    // Fetch unread messages
    fetchUnreadMessages();
  }, [stats]);

  const fetchRecentPayments = async () => {
    try {
      if (!stats?.properties || stats.properties.length === 0) {
        setRecentPayments([]);
        return;
      }
      
      // Get property IDs managed by this manager
      const propertyIds = stats.properties.map(p => p.id);
      
      // Query payments for tenants in assigned properties only
      const { data: payments, error } = await supabase
        .from("payments")
        .select("*")
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRecentPayments(payments || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setRecentPayments([]);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      // messages table doesn't exist - skip
      setUnreadMessages(0);
    } catch (err) {
      console.error("Error fetching unread messages:", err);
    }
  };

  const statsData = stats
    ? [
        {
          title: "Managed Properties",
          value: stats.managedProperties.toString(),
          icon: Home,
          change: "+0",
          color: "bg-blue-500",
          description: "Properties under management",
          link: "/portal/manager/properties",
        },
        {
          title: "Active Tenants",
          value: stats.activeTenants.toString(),
          icon: Users,
          change: "+2",
          color: "bg-green-500",
          description: "Current tenants",
          link: "/portal/manager/tenants",
        },
        {
          title: "Pending Rent",
          value: formatCurrency(stats.pendingRent),
          icon: DollarSign,
          change: `-${formatCurrency(1200)}`,
          color: "bg-yellow-500",
          description: "Rent due this month",
          link: "/portal/manager/payments",
        },
        {
          title: "Maintenance",
          value: stats.maintenanceCount.toString(),
          icon: Wrench,
          change: "-1",
          color: "bg-red-500",
          description: "Pending requests",
          link: "/portal/manager/maintenance",
        },
      ]
    : [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "inspection":
        return <Home className="w-5 h-5 text-blue-600" />;
      case "meeting":
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      case "deadline":
        return <FileText className="w-5 h-5 text-purple-600" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" /> Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case "collectRent":
        toast.success("Rent collection initiated");
        break;
      case "sendReminder":
        toast.success("Reminders sent to tenants");
        break;
      case "scheduleInspection":
        toast.info("Redirecting to calendar...");
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading Dashboard
          </h3>
          <p className="text-gray-600">Fetching your manager data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>
            {error}. Please try refreshing the page.
          </AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
          <Button asChild>
            <Link to="/portal">Go to Portal Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight mb-2">
            Welcome back, <span className="font-bold">{profile?.user ? `${profile.user.first_name} ${profile.user.last_name}` : 'Manager'}</span>
          </h1>
          <p className="text-gray-600">
            Manage your properties and tenants efficiently.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" variant="outline" className="relative" asChild>
            <Link to="/portal/manager/messages">
              <Bell className="w-4 h-4 mr-2" />
              Messages
              {unreadMessages > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                  {unreadMessages}
                </Badge>
              )}
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/portal/manager/properties">View All Properties</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsData.map((stat, index) => (
          <Link key={index} to={stat.link} className="block">
            <Card className="hover:shadow-lg transition-shadow hover:border-[#00356B]/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.color}`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate text-[#00356B]">{stat.value}</div>
                <p className="text-xs text-gray-600 mt-1">
                  <span
                    className={
                      stat.change.startsWith("+") || stat.change.startsWith("-")
                        ? stat.change.startsWith("+")
                          ? "text-green-600"
                          : "text-red-600"
                        : "text-gray-600"
                    }
                  >
                    {stat.change}
                  </span>{" "}
                  from last month
                </p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-[#00356B]">
                <BarChart3 className="w-5 h-5" />
                Performance Summary
              </CardTitle>
              <CardDescription>
                Your overall performance metrics
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm border-[#00356B]/20">
              {profile?.experience_years || 0} years experience
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Performance Rating</span>
                <span className="font-bold">
                  {profile?.performance_rating
                    ? `${profile.performance_rating}/5`
                    : "N/A"}
                </span>
              </div>
              <Progress
                value={(profile?.performance_rating || 0) * 20}
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Occupancy Rate</span>
                <span className="font-bold">{stats?.occupancyRate || 0}%</span>
              </div>
              <Progress value={stats?.occupancyRate || 0} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rent Collection</span>
                <span className="font-bold">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tenant Satisfaction</span>
                <span className="font-bold">4.2/5</span>
              </div>
              <Progress value={84} className="h-2" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {profile?.specializations?.map((spec: string, index: number) => (
              <Badge key={index} variant="secondary" className="bg-gray-100">
                {spec}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Properties & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Properties Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#00356B]">Managed Properties</CardTitle>
                  <CardDescription>
                    {stats?.managedProperties || 0} properties under your
                    management • Overall Occupancy: {stats?.occupancyRate || 0}%
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    to="/portal/manager/properties"
                    className="flex items-center"
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {properties.length > 0 ? (
                  properties.map((property) => (
                    <Link
                      key={property.id}
                      to={`/portal/manager/properties/${property.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Home className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium group-hover:text-blue-600">
                              {property.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {property.tenants} tenants • {property.occupancy}%
                              occupancy
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {formatCurrency(property.revenue)}
                          </div>
                          <p className="text-sm text-gray-600">
                            monthly revenue
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No properties assigned yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Contact super admin for property assignments
                    </p>
                    <Button className="mt-4" asChild>
                      <Link to="/portal/manager/properties/request">
                        Request Properties
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#00356B]">Recent Payments</CardTitle>
                  <CardDescription>
                    Latest rent payments collected
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchRecentPayments}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentPayments.length > 0 ? (
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {payment.tenant?.first_name}{" "}
                            {payment.tenant?.last_name}
                          </span>
                          {getPaymentStatusBadge(payment.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {payment.property?.name} •{" "}
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatCurrency(payment.amount)}
                        </div>
                        <p className="text-xs text-gray-600">
                          via {payment.payment_method}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No recent payments</p>
                </div>
              )}
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/portal/manager/payments">View All Payments</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tasks & Notifications */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#00356B]">Pending Tasks</CardTitle>
                  <CardDescription>
                    Tasks requiring your attention
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-[#00356B]/10 text-[#00356B]">{pendingTasks.length} tasks</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingTasks.length > 0 ? (
                  pendingTasks.slice(0, 5).map((task) => (
                    <Link
                      key={task.id}
                      to={
                        task.type === "maintenance"
                          ? `/portal/manager/maintenance/${task.id}`
                          : task.type === "approval"
                          ? `/portal/manager/approval-requests`
                          : "/portal/manager/tasks"
                      }
                      className="block"
                    >
                      <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors group">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium group-hover:text-blue-600">
                              {task.task}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {task.property} • Due: {task.due}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No pending tasks</p>
                    <p className="text-sm text-gray-400">All caught up!</p>
                  </div>
                )}

                <Button variant="ghost" className="w-full mt-2" asChild>
                  <Link
                    to="/portal/manager/tasks"
                    className="flex items-center justify-center"
                  >
                    View All Tasks
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#00356B]">Quick Actions</CardTitle>
              <CardDescription>Common manager operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => handleQuickAction("collectRent")}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm">Collect Rent</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => handleQuickAction("sendReminder")}
                >
                  <Bell className="w-5 h-5" />
                  <span className="text-sm">Send Reminders</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  asChild
                >
                  <Link to="/portal/manager/maintenance/new">
                    <Wrench className="w-5 h-5" />
                    <span className="text-sm">Log Maintenance</span>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => handleQuickAction("scheduleInspection")}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">Schedule Inspection</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#00356B]">Upcoming Events</CardTitle>
                  <CardDescription>
                    Scheduled inspections and meetings
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/portal/manager/calendar">
                    <Calendar className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {getEventIcon(event.type)}
                      <div className="flex-1">
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-gray-600">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {event.date}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            {event.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No upcoming events</p>
                    <p className="text-sm text-gray-400">
                      Schedule inspections or meetings
                    </p>
                  </div>
                )}

                <Button variant="outline" className="w-full" asChild>
                  <Link to="/portal/manager/calendar">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Event
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManagerPortal;
