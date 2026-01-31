// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  FileText,
  Eye,
  BarChart,
  Calendar as CalendarIcon,
  TrendingUp,
  Clock,
  CheckCircle,
  LayoutDashboard,
  Zap,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientReviews } from "@/hooks/useClientReviews";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";

import Calendar from "@/components/Calendar";
import { format } from "date-fns";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const { events } = useCalendarEvents();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [showCalculator, setShowCalculator] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    totalQuotesValue: 0,
    completedProjects: 0,
    activeProjects: 0,
    pendingQuotes: 0,
    upcomingEvents: [] as any[],
    recentQuotes: [] as any[],
    allQuotes: [] as any[],
  });

  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (!user || !profile) return;
    fetchDashboardData();
  }, [user, profile, location.key]);

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // FIX: Added type safety and error handling for quotes query
      const { data: quotes, error: quotesError } = await supabase
        .from("quotes")
        .select("*")
        .eq("user_id", profile?.id || "");

      if (quotesError) throw quotesError;

      // FIX: Handle case where quotes is null or undefined
      const quotesArray = quotes || [];
      
      const totalQuotesValue = quotesArray.reduce(
        (sum, q) => sum + (q.total_amount || 0),
        0
      );

      const completedProjects = quotesArray.filter(q => q.status === "completed").length;
      const activeProjects = quotesArray.filter(q =>
        ["started", "in_progress"].includes(q.status || "")
      ).length;
      const pendingQuotes = quotesArray.filter(q => q.status === "draft").length;

      const upcomingEvents = events
        ?.filter((e: any) => new Date(e.event_date) >= new Date())
        .slice(0, 3) || [];

      const recentQuotes = [...quotesArray]
        .sort(
          (a, b) =>
            new Date(b.updated_at || 0).getTime() -
            new Date(a.updated_at || 0).getTime()
        )
        .slice(0, 5);

      setDashboardData({
        totalQuotesValue,
        completedProjects,
        activeProjects,
        pendingQuotes,
        upcomingEvents,
        recentQuotes,
        allQuotes: quotesArray,
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      started: "bg-blue-100 text-blue-800",
      in_progress: "bg-amber-100 text-amber-800",
      completed: "bg-green-100 text-green-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // FIX: Better auth handling to prevent redirect loops
  useEffect(() => {
    if (!user) {
      // Use replace instead of navigate to avoid adding to history stack
      setTimeout(() => navigate("/auth", { replace: true }), 100);
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Redirecting to login...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <LayoutDashboard className="mr-2" />
            Welcome back, {profile?.first_name || "User"}
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Quotes Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSh {formatCurrency(dashboardData.totalQuotesValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.activeProjects}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completed Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.completedProjects}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Quotes Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Quotes</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/quotes")}
                  className="flex items-center gap-1"
                >
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.recentQuotes.length > 0 ? (
                  dashboardData.recentQuotes.map((quote: any) => (
                    <motion.div
                      key={quote.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between items-center border p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{quote.title || "Untitled Quote"}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>KSh {formatCurrency(quote.total_amount || 0)}</span>
                          <span>•</span>
                          <span>{format(new Date(quote.updated_at || Date.now()), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(quote.status || "draft")}>
                        {quote.status || "draft"}
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No quotes yet</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate("/quotes/new")}
                    >
                      Create Your First Quote
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.upcomingEvents.map((event: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.event_date), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No upcoming events</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes">
            {/* All Quotes Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Title</th>
                        <th className="text-left p-3">Amount</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Last Updated</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.allQuotes.map((quote: any) => (
                        <tr key={quote.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{quote.title || "Untitled"}</td>
                          <td className="p-3">KSh {formatCurrency(quote.total_amount || 0)}</td>
                          <td className="p-3">
                            <Badge className={getStatusColor(quote.status || "draft")}>
                              {quote.status || "draft"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {format(new Date(quote.updated_at || Date.now()), "MMM d, yyyy")}
                          </td>
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/quotes/${quote.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Calendar />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                onClick={() => navigate("/quotes/new")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Create New Quote
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate("/clients")}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Clients
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate("/calendar")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Open Calendar
              </Button>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Quote Conversion Rate</span>
                  <span className="font-medium">
                    {dashboardData.allQuotes.length > 0
                      ? `${Math.round(
                          (dashboardData.completedProjects / dashboardData.allQuotes.length) * 100
                        )}%`
                      : "0%"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg. Quote Value</span>
                  <span className="font-medium">
                    KSh {formatCurrency(
                      dashboardData.allQuotes.length > 0
                        ? dashboardData.totalQuotesValue / dashboardData.allQuotes.length
                        : 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pending Approval</span>
                  <span className="font-medium">{dashboardData.pendingQuotes}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;