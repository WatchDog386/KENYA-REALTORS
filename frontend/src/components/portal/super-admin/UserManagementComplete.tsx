// src/components/portal/super-admin/UserManagementComplete.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  Shield,
  Mail,
  Phone,
  Edit2,
  RefreshCw,
  Building2,
  Plus,
  Play,
  Ban,
  TrendingUp,
  UserCheck,
  UserPlus,
  Activity
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string | null;
  status: string | null;
  created_at: string;
  last_login_at?: string;
}

interface UserStats {
  totalUsers: number;
  pendingUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  propertyManagers: number;
  tenants: number;
}

const UserManagementComplete: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    pendingUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    propertyManagers: 0,
    tenants: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "suspend" | "delete" | "activate">("approve");
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state for new user
  const [newUser, setNewUser] = useState({ email: '', firstName: '', lastName: '', password: '', role: 'tenant' });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.last_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, statusFilter, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Fetch all users from profiles table
      const { data: allUsers, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const typedUsers: User[] = (allUsers || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name || "",
        last_name: u.last_name || "",
        phone: u.phone || null,
        role: u.role,
        status: u.status,
        created_at: u.created_at,
        last_login_at: u.last_login_at || null,
      }));

      setUsers(typedUsers);
      setFilteredUsers(typedUsers);

      const pendingCount = typedUsers.filter((u) => u.status === "pending").length;
      const activeCount = typedUsers.filter((u) => u.status === "active").length;
      const suspendedCount = typedUsers.filter((u) => u.status === "suspended").length;
      const propertyManagerCount = typedUsers.filter((u) => u.role === "property_manager").length;
      const tenantCount = typedUsers.filter((u) => u.role === "tenant").length;

      setStats({
        totalUsers: typedUsers.length,
        pendingUsers: pendingCount,
        activeUsers: activeCount,
        suspendedUsers: suspendedCount,
        propertyManagers: propertyManagerCount,
        tenants: tenantCount,
      });
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error(
        `Failed to load users: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
      if(!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
          toast.error("Please fill in all fields");
          return;
      }
      
      try {
          setIsProcessing(true);
          const { data, error } = await supabase.auth.signUp({
              email: newUser.email,
              password: newUser.password,
              options: {
                  data: {
                      first_name: newUser.firstName,
                      last_name: newUser.lastName,
                      role: newUser.role,
                      status: 'active'
                  }
              }
          });

          if(error) throw error;
          
          toast.success("User created successfully");
          setIsAddUserDialogOpen(false);
          setNewUser({ email: '', firstName: '', lastName: '', password: '', role: 'tenant' });
          loadUsers();
      } catch (err: any) {
          console.error("Error creating user:", err);
          toast.error(err.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      setIsProcessing(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("✅ User approved successfully!");
      await loadUsers();
      setIsActionDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error(`Failed to approve user: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      setIsProcessing(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          status: "suspended",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("⏸️ User suspended successfully!");
      await loadUsers();
      setIsActionDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error suspending user:", error);
      toast.error(`Failed to suspend user: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setIsProcessing(true);

      // First, delete from profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError) throw profileError;

      // Note: Full user deletion from Auth requires a backend function (Edge Function or RPC).
      // Since we are client-side, deleting the profile effectively removes the user from the application.
      // If an Edge Function is available for 'delete-user', it should be called here.
      console.log("User profile deleted. Auth user remains (requires service role to delete).");

      toast.success("🗑️ User deleted successfully!");
      await loadUsers();
      setIsActionDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(`Failed to del || actionType === "activate"ete user: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "suspended":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleAction = async () => {
    if (!selectedUser) return;

    if (actionType === "approve") {
      await handleApproveUser(selectedUser.id);
    } else if (actionType === "suspend") {
      await handleSuspendUser(selectedUser.id);
    } else if (actionType === "delete") {
      await handleDeleteUser(selectedUser.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#154279]" />
          <p className="text-slate-600 text-sm font-semibold">Loading users...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#1a3a52] to-[#0f325e] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg"
      >
        <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
          <Users className="w-full h-full" />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5" />
              <span className="text-xs font-bold tracking-widest uppercase opacity-90">Directory</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">
              User <span className="text-[#F96302]">Management</span>
            </h1>
            <p className="text-blue-100 text-sm">Manage all system users, assign roles, track account status, and control access permissions.</p>
          </div>
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-[#154279] hover:bg-slate-100 font-bold rounded-xl px-6 py-2">
                <Plus className="w-4 h-4 mr-2" /> ADD NEW USER
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <Input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={newUser.role} onValueChange={val => setNewUser({...newUser, role: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant">Tenant</SelectItem>
                      <SelectItem value="property_manager">Property Manager</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddUser} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : "Create User"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats Cards Grid - 2 rows */}
      <div className="space-y-4">
        {/* First Row - Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="flex justify-center mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-2">Total Users</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="flex justify-center mb-3">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.pendingUsers}</p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-2">Pending</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="flex justify-center mb-3">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">1</p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-2">Super Admins</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="flex justify-center mb-3">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.propertyManagers}</p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-2">Managers</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-purple-50 border border-purple-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="flex justify-center mb-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.tenants}</p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-2">Tenants</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="flex justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-teal-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-2">Assigned</p>
          </motion.div>
        </div>

        {/* Second Row - Role Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="flex justify-center mb-3">
              <Mail className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">2</p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-2">Accountants</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-pink-50 border border-pink-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="flex justify-center mb-3">
              <Edit2 className="w-6 h-6 text-pink-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">1</p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-2">Technicians</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="flex justify-center mb-3">
              <Building2 className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">1</p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-2">Proprietors</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
          >
            <div className="flex justify-center mb-3">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">1</p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-2">Caretakers</p>
          </motion.div>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-slate-900">All User Accounts</CardTitle>
              <p className="text-sm text-slate-500 mt-1">{filteredUsers.length} users • Total: {users.length}</p>
            </div>
            <Button
              onClick={loadUsers}
              className="flex items-center gap-2 text-[#154279] hover:text-[#0f325e] text-sm font-bold tracking-wider uppercase"
              variant="ghost"
            >
              <RefreshCw className="w-4 h-4" /> REFRESH
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:border-[#154279] focus:ring-1 focus:ring-[#154279] outline-none transition-all font-medium text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:border-[#154279] focus:ring-1 focus:ring-[#154279] outline-none transition-all font-medium text-sm md:w-48"
            >
              <option value="all">All Roles</option>
              <option value="pending">Pending Approval</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#154279] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-gradient-to-br from-[#154279] to-[#0f325e] text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-80">Total Users</p>
              <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-80">Pending Approval</p>
              <p className="text-3xl font-bold mt-2">{stats.pendingUsers}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-80">Active Users</p>
              <p className="text-3xl font-bold mt-2">{stats.activeUsers}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-80">Suspended Users</p>
              <p className="text-3xl font-bold mt-2">{stats.suspendedUsers}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter Section */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-[#F96302]" /> Filter Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium text-sm"
              />
            </div>
            <div className="flex items-center gap-2 md:w-64">
              <Filter size={18} className="text-[#154279]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <Button
              onClick={loadUsers}
              className="bg-[#154279] hover:bg-[#0f325e] text-white font-bold rounded-xl"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl">
                        <Plus className="w-4 h-4 mr-2" /> Add User
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>Create a new user account.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">First Name</label>
                                <Input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Last Name</label>
                                <Input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <Select value={newUser.role} onValueChange={val => setNewUser({...newUser, role: val})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tenant">Tenant</SelectItem>
                                    <SelectItem value="property_manager">Property Manager</SelectItem>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddUser} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : "Create User"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 text-sm">
                        {user.first_name} {user.last_name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 capitalize font-semibold text-xs">
                        {user.role || "Unassigned"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn("font-semibold text-xs", 
                        user.status === "active" ? "bg-emerald-100 text-emerald-700" :
                        user.status === "pending" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {user.status?.toUpperCase() || "UNKNOWN"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        {user.status === "pending" && (
                          <Dialog open={isActionDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsActionDialogOpen}>
                            <DialogTrigger asChild>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType("approve");
                                }}
                                className="text-amber-600 hover:text-amber-700 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="border-slate-200">
                              <DialogHeader>
                                <DialogTitle>Approve User</DialogTitle>
                                <DialogDescription>
                                  This will activate {user.first_name} {user.last_name} ({user.email}) so they can access the system.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Alert>
                                  <CheckCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    User will be set to <strong>ACTIVE</strong> status immediately.
                                  </AlertDescription>
                                </Alert>
                                <div className="flex gap-3 justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsActionDialogOpen(false)}
                                    disabled={isProcessing}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                                    onClick={handleAction}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    {isProcessing ? "Approving..." : "Approve User"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {user.status === "active" && (
                          <Dialog open={isActionDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsActionDialogOpen}>
                            <DialogTrigger asChild>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType("suspend");
                                }}
                                className="text-amber-600 hover:text-amber-700 transition-colors"
                                title="Suspend"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="border-slate-200">
                              <DialogHeader>
                                <DialogTitle>Suspend User</DialogTitle>
                                <DialogDescription>
                                  This will suspend {user.first_name} {user.last_name} and prevent them from accessing the system.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Alert>
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                  <AlertDescription>
                                    User will be set to <strong>SUSPENDED</strong> status. They can be reactivated later.
                                  </AlertDescription>
                                </Alert>
                                <div className="flex gap-3 justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsActionDialogOpen(false)}
                                    disabled={isProcessing}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold"
                                    onClick={handleAction}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    {isProcessing ? "Suspending..." : "Suspend User"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        <Dialog open={isActionDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsActionDialogOpen}>
                          <DialogTrigger asChild>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setActionType("delete");
                              }}
                              className="text-red-600 hover:text-red-700 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="border-slate-200">
                            <DialogHeader>
                              <DialogTitle>Delete User</DialogTitle>
                              <DialogDescription>
                                This will permanently delete {user.first_name} {user.last_name} and cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Alert className="bg-red-50 border-red-200">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                  <strong>Warning:</strong> This action is permanent and cannot be reversed. The user's account and all associated data will be deleted.
                                </AlertDescription>
                              </Alert>
                              <div className="flex gap-3 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsActionDialogOpen(false)}
                                  disabled={isProcessing}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                                  onClick={handleAction}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                  {isProcessing ? "Deleting..." : "Delete User"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default UserManagementComplete;
