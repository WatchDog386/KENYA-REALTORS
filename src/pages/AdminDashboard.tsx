// © 2025 Jeff. All rights reserved.
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PropertyManagerAssignment } from "@/components/admin/PropertyManagerAssignment";
import { getAllUsers, getUsersByRole, getPendingApprovals, approveUser } from "@/services/userManagementService";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  Users, DollarSign, Activity, Crown, Search,
  Server, ShieldCheck, Database, ArrowUpRight, Loader2,
  CheckCircle, XCircle, Clock, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Types ---
interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string | null;
  user_type: string | null; // Added field
  status: string | null;
  is_active: boolean | null;
  avatar_url?: string;
  created_at?: string;
}

interface DashboardStats {
  totalUsers: number;
  pendingApprovals: number;
  activeProjects: number;
  growthRate: number;
  totalRevenue: number;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b']; // Indigo, Emerald, Amber

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, pendingApprovals: 0, activeProjects: 0, growthRate: 0, totalRevenue: 0
  });

  useEffect(() => {
    // Check access immediately
    if (!user) navigate("/auth");
    
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all profiles using the service
      const realUsers = await getAllUsers();
      setUsers(realUsers);

      // 2. Get pending approvals count
      const pending = await getPendingApprovals();
      
      setStats({
        totalUsers: realUsers.length,
        pendingApprovals: pending.length,
        totalRevenue: 125000, // Mock for now
        activeProjects: 42,   // Mock for now
        growthRate: 12.5      // Mock for now
      });

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string, currentRole: string | null) => {
    try {
      // Approve user: set status to active and Ensure is_active is true
      const success = await approveUser(userId);

      if (!success) {
        throw new Error("Failed to approve user");
      }

      toast({
        title: "User Approved",
        description: "The property manager can now log in.",
        className: "bg-green-50 border-green-200 text-green-800"
      });

      // Refresh list
      fetchDashboardData();

    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSyncUsers = async () => {
    setSyncing(true);
    try {
      // Call the sync function (RPC)
      const { error } = await supabase.rpc('sync_missing_profiles');
      
      if (error) {
        console.error("Sync error:", error);
        // Fallback: If RPC doesn't exist, just refetch
        if (error.code === 'PGRST202') { // Function not found
           toast({
             title: "Sync Function Missing",
             description: "Running manual sync. All auth users will be fetched.",
             variant: "default"
           });
        } else if (error.code !== 'PGRST202') {
           throw error;
        }
      } else {
        toast({
          title: "Synchronization Complete",
          description: "User profiles have been synced from the authentication database.",
          className: "bg-blue-50 border-blue-200 text-blue-800"
        });
      }
      
      // Always refresh data
      await fetchDashboardData();
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-sans text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Crown className="text-indigo-600 h-6 w-6" /> Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Overview of system performance and user metrics.</p>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 bg-white">v2.4.0</Badge>
            <Badge className="bg-emerald-600 hover:bg-emerald-700">System Online</Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600" },
          { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-blue-600" },
          { label: "Pending Approvals", value: stats.pendingApprovals, icon: Clock, color: "text-amber-600" },
          { label: "Growth Rate", value: `+${stats.growthRate}%`, icon: ArrowUpRight, color: "text-purple-600" },
        ].map((stat, i) => (
          <Card key={i} className="shadow-sm border-slate-200">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-2 text-slate-900">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-full bg-slate-50 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
          <TabsTrigger value="approvals" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">Approvals {stats.pendingApprovals > 0 && <Badge className="ml-2 bg-amber-500">{stats.pendingApprovals}</Badge>}</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">All Users</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">Analytics</TabsTrigger>
        </TabsList>

        {/* Approvals Tab (NEW) */}
        <TabsContent value="approvals">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Property managers waiting for account activation.</CardDescription>
            </CardHeader>
            <CardContent>
              {users.filter(u => u.role === 'property_manager' && u.status === 'pending').length === 0 ? (
                 <div className="text-center py-10 text-slate-500">
                   <ShieldCheck className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                   <p>No pending approvals found.</p>
                 </div>
              ) : (
                <div className="space-y-4">
                  {users.filter(u => u.role === 'property_manager' && u.status === 'pending').map((u) => (
                    <div key={u.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100 gap-4">
                       <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-12 w-12 border border-amber-200">
                            <AvatarFallback className="bg-amber-100 text-amber-700">{u.first_name ? u.first_name.charAt(0) : 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-slate-900">{u.first_name} {u.last_name || ''}</p>
                            <p className="text-sm text-slate-600">{u.email}</p>
                            <Badge variant="outline" className="mt-1 bg-white text-xs">Property Manager</Badge>
                          </div>
                       </div>
                       <div className="flex gap-2 flex-1 md:flex-initial md:w-auto">
                         <Button 
                          onClick={() => handleApproveUser(u.id, u.role)}
                          className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        >
                           <CheckCircle className="h-4 w-4" /> Approve Access
                         </Button>
                         <PropertyManagerAssignment
                          managerId={u.id}
                          managerName={`${u.first_name} ${u.last_name || ''}`}
                          onAssignmentComplete={() => fetchDashboardData()}
                         />
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab (Modified) */}
        <TabsContent value="users">
          <div className="space-y-4">
            {/* Info Banner */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6 flex items-start gap-3">
                <Database className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">User Sync Active</p>
                  <p className="text-sm text-blue-700 mt-1">Auth users automatically sync to profiles table on signup. Super admin can manage all users.</p>
                </div>
              </CardContent>
            </Card>

            {/* Users List Card */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Registered Users ({users.length})</CardTitle>
                  <CardDescription>Manage all user accounts and roles.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSyncUsers}
                    disabled={syncing}
                    className="gap-2"
                  >
                    {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} 
                    {syncing ? 'Syncing...' : 'Sync Users'}
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Search users..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <Users className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                    <p>No users registered yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-10 w-10 border border-slate-200">
                            <AvatarImage src={u.avatar_url} />
                            <AvatarFallback className="bg-indigo-50 text-indigo-700">{u.first_name ? u.first_name.charAt(0) : 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">{u.first_name} {u.last_name || ''}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                            {u.email === 'duncanmarshel@gmail.com' && (
                              <Badge className="mt-1 bg-purple-600 hover:bg-purple-700 text-xs">
                                <Crown className="h-3 w-3 mr-1" /> Super Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="capitalize bg-slate-100 text-slate-700 text-xs">
                            {u.user_type || u.role || 'No Role'}
                          </Badge>
                          <Badge className={`text-xs ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : u.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                            {u.status || 'Unknown'}
                          </Badge>
                          {u.is_active === false && (
                            <Badge variant="destructive" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab (Kept mostly same with responsive container fix) */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            <Card className="col-span-1 lg:col-span-4 shadow-sm">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                      { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 },
                      { name: 'Mar', revenue: 5000 }, { name: 'Apr', revenue: 2780 },
                      { name: 'May', revenue: 1890 }, { name: 'Jun', revenue: 6390 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;