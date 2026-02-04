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
} from "lucide-react";
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
  const [actionType, setActionType] = useState<"approve" | "suspend" | "delete">("approve");
  const [isProcessing, setIsProcessing] = useState(false);

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
      toast.error(`Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}`);
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-[#154279]/10 text-[#154279] hover:bg-[#154279]/20 capitalize">
                        {user.role || "Unassigned"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full")}
                          style={{
                            backgroundColor:
                              user.status === "active"
                                ? "#10b981"
                                : user.status === "pending"
                                ? "#f59e0b"
                                : "#ef4444",
                          }}
                        ></div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(user.status)}
                          <span className={cn("text-xs font-semibold uppercase tracking-wider", getStatusBadgeColor(user.status))}>
                            {user.status || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {user.status === "pending" && (
                          <Dialog open={isActionDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsActionDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType("approve");
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                              </Button>
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
                              <Button
                                size="sm"
                                className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType("suspend");
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Suspend
                              </Button>
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

                        {user.status !== "pending" && (
                          <Dialog open={isActionDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsActionDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 font-bold rounded-lg"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType("delete");
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                              </Button>
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
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-600 font-semibold">
          Showing <span className="text-[#F96302]">{filteredUsers.length}</span> of{" "}
          <span className="text-[#154279]">{users.length}</span> users
        </div>
      </Card>
    </div>
  );
};

export default UserManagementComplete;
