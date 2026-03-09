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
  CheckCircle, XCircle, Clock, RefreshCw, BarChart3, TrendingUp
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

const COLORS = ['#154279', '#F96302', '#10b981']; // Primary, Secondary, Emerald

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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin h-10 w-10 text-[#154279]" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-nunito text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#154279] flex items-center gap-3">
             Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Overview of system performance and user metrics.</p>
        </div>
        <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1.5 bg-white border-slate-200 text-slate-600 shadow-sm rounded-lg">v2.4.0</Badge>
            <Badge className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg shadow-emerald-200 shadow-md">System Online</Badge>
        </div>
      </div>

      {/* KPI Cards - Sleek Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-[#154279]", bg: "bg-blue-100" },
          { label: "Pending Approvals", value: stats.pendingApprovals, icon: Clock, color: "text-[#F96302]", bg: "bg-orange-100" },
          { label: "Growth Rate", value: `+${stats.growthRate}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
        ].map((stat, i) => (
          <Card key={i} className="bg-white rounded-2xl border-none shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <CardContent className="p-6 flex items-center justify-between relative overflow-hidden">
              <div className="z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <h3 className="text-3xl font-extrabold text-slate-800">{stat.value}</h3>
              </div>
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={26} strokeWidth={2.5} />
              </div>
              <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 ${stat.bg.replace('bg-', 'bg-')}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="approvals" className="space-y-8">
        <TabsList className="bg-white p-1.5 rounded-xl shadow-md border border-slate-100 w-full md:w-auto inline-flex h-auto">
          <TabsTrigger value="approvals" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-[#154279] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
            Approvals {stats.pendingApprovals > 0 && <Badge className="ml-2 bg-[#F96302] text-white hover:bg-[#d65502]">{stats.pendingApprovals}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-[#154279] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">All Users</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-[#154279] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Analytics</TabsTrigger>
        </TabsList>

        {/* Approvals Tab */}
        <TabsContent value="approvals">
          <Card className="bg-white rounded-2xl border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-xl font-bold text-[#154279]">Pending Approvals</CardTitle>
              <CardDescription>Property managers waiting for account activation.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {users.filter(u => u.role === 'property_manager' && u.status === 'pending').length === 0 ? (
                 <div className="text-center py-16 flex flex-col items-center">
                   <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle className="h-10 w-10 text-green-500" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-800">All caught up!</h3>
                   <p className="text-slate-500">No pending approvals found.</p>
                 </div>
              ) : (
                <div className="grid gap-4">
                  {users.filter(u => u.role === 'property_manager' && u.status === 'pending').map((u) => (
                    <div key={u.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all gap-4 group">
                       <div className="flex items-center gap-5 flex-1">
                          <Avatar className="h-14 w-14 border-2 border-orange-100 shadow-sm">
                            <AvatarFallback className="bg-orange-50 text-[#F96302] font-bold text-lg">{u.first_name ? u.first_name.charAt(0) : 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-lg text-[#154279] group-hover:text-[#F96302] transition-colors">{u.first_name} {u.last_name || ''}</p>
                            <p className="text-sm text-slate-500 font-medium">{u.email}</p>
                            <Badge variant="outline" className="mt-2 bg-orange-50 text-[#F96302] border-orange-100 text-xs py-0.5">Property Manager</Badge>
                          </div>
                       </div>
                       <div className="flex gap-3 flex-wrap md:flex-nowrap">
                         <Button 
                          onClick={() => handleApproveUser(u.id, u.role)}
                          className="flex-1 md:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white gap-2 rounded-xl shadow-lg shadow-emerald-200"
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

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-gradient-to-r from-[#154279] to-blue-900 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="relative z-10 flex items-start gap-4">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">User Sync Active</h3>
                  <p className="text-white/80 mt-1 max-w-2xl">Auth users are automatically synced to the profiles table on signup. Use the dashboard to manage roles, permissions, and account status.</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            </div>

            {/* Users List Card */}
            <Card className="bg-white rounded-2xl border-none shadow-lg">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 p-6 gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-[#154279]">Registered Users</CardTitle>
                  <CardDescription>Manage {users.length} user accounts and roles.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSyncUsers}
                    disabled={syncing}
                    className="gap-2 rounded-lg border-slate-200 hover:bg-slate-50 text-slate-600"
                  >
                    {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} 
                    {syncing ? 'Syncing...' : 'Sync Users'}
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#154279]/20 focus:border-[#154279] w-full md:w-64 transition-all" 
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {users.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <Users className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                    <p>No users registered yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                            <AvatarImage src={u.avatar_url} />
                            <AvatarFallback className="bg-[#154279]/5 text-[#154279] font-bold">{u.first_name ? u.first_name.charAt(0) : 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 group-hover:text-[#154279] transition-colors">{u.first_name} {u.last_name || ''}</p>
                                {u.email === 'duncanmarshel@gmail.com' && (
                                  <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="capitalize bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs px-2.5 py-0.5 rounded-md border border-slate-200">
                            {u.user_type || u.role || 'No Role'}
                          </Badge>
                          <div className={`h-2.5 w-2.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500 shadow-emerald-200 shadow-sm' : u.status === 'pending' ? 'bg-amber-500 shadow-amber-200' : 'bg-slate-300'}`}></div>
                          {u.is_active === false && (
                            <Badge variant="destructive" className="text-xs rounded-md">Inactive</Badge>
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <Card className="col-span-1 lg:col-span-4 bg-white rounded-2xl border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#154279] font-bold">Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                      { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 },
                      { name: 'Mar', revenue: 5000 }, { name: 'Apr', revenue: 2780 },
                      { name: 'May', revenue: 1890 }, { name: 'Jun', revenue: 6390 },
                      { name: 'Jul', revenue: 7890 }, { name: 'Aug', revenue: 6090 },
                  ]} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                    />
                    <Bar dataKey="revenue" fill="#154279" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
             <Card className="col-span-1 lg:col-span-3 bg-white rounded-2xl border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#154279] font-bold">User Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] flex items-center justify-center">
                   <div className="text-center text-slate-400 p-8 border-2 border-dashed border-slate-100 rounded-xl w-full">
                       <BarChart3 className="w-12 h-12 mx-auto mb-2 text-slate-200" />
                       <p>More Analytics Coming Soon</p>
                   </div>
              </CardContent>
             </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
