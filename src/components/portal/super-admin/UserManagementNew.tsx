// src/components/portal/super-admin/UserManagementNew.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Users,
  Clock,
  Shield,
  CheckCircle,
  Plus,
  RefreshCw,
  Search,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Mail,
  Phone,
  Building,
  Home,
  Ban,
  Play,
  Briefcase,
  Wrench,
  Settings,
  DollarSign,
  Crown,
  BarChart3,
  Key,
  Hammer,
  Handshake,
  Users2,
  ClipboardList,
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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/services/supabase";
import { userSyncService } from "@/services/userSyncService";
import { emailService } from "@/services/emailService";

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
  avatar_url?: string;
}

interface UserStats {
  totalUsers: number;
  unassignedUsers: number;
  assignedUsers: number;
  superAdmins: number;
  propertyManagers: number;
  tenants: number;
  accountants: number;
  technicians: number;
  proprietors: number;
  caretakers: number;
}

const UserManagementNew: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    unassignedUsers: 0,
    assignedUsers: 0,
    superAdmins: 0,
    propertyManagers: 0,
    tenants: 0,
    accountants: 0,
    technicians: 0,
    proprietors: 0,
    caretakers: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

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

    if (roleFilter !== "all") {
      if (roleFilter === "pending-approval") {
        filtered = filtered.filter((u) => u.status === "pending");
      } else if (roleFilter === "no-role") {
        filtered = filtered.filter((u) => !u.role);
      } else {
        filtered = filtered.filter((u) => u.role === roleFilter);
      }
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const syncStatus = await userSyncService.verifySync();
      if (syncStatus.error || !syncStatus.synced) {
        console.warn("⚠️ Sync status check:", syncStatus);
      }

      const { data: allUsers, error: fetchError } = await supabase
        .from("profiles")
        .select("*");
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
        avatar_url: u.avatar_url || null,
      }));

      setUsers(typedUsers);
      setFilteredUsers(typedUsers);

      setStats({
        totalUsers: typedUsers.length,
        unassignedUsers: typedUsers.filter((u) => !u.role).length,
        assignedUsers: typedUsers.filter((u) => u.role).length,
        superAdmins: typedUsers.filter((u) => u.role === "super_admin").length,
        propertyManagers: typedUsers.filter((u) => u.role === "property_manager").length,
        tenants: typedUsers.filter((u) => u.role === "tenant").length,
        accountants: typedUsers.filter((u) => u.role === "accountant").length,
        technicians: typedUsers.filter((u) => u.role === "technician").length,
        proprietors: typedUsers.filter((u) => u.role === "proprietor").length,
        caretakers: typedUsers.filter((u) => u.role === "caretaker").length,
      });
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error(`Failed to load users: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (
    userId: string,
    newRole: string,
    managedProperties?: string[],
    propertyId?: string,
    unitId?: string,
    userData?: User
  ) => {
    // ... [Logic remains identical, preserving your system operations] ...
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("id", userId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!existingProfile) {
        if (!userData) throw new Error(`Cannot create profile: user data not available`);
        const { error: createError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email: userData.email,
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            phone: userData.phone || null,
            role: newRole,
            status: 'active',
            is_active: true,
            user_type: newRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        if (createError && !createError.message.includes("duplicate")) throw createError;
      }

      const currentUser = await supabase.auth.getUser();
      const { data: updateData, error: profileError } = await supabase
        .from("profiles")
        .update({
          role: newRole,
          user_type: newRole,
          status: 'active',
          is_active: true,
          approved_at: new Date().toISOString(),
          approved_by: currentUser.data.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select();

      if (profileError) throw profileError;
      if (!updateData || updateData.length === 0) throw new Error("User not found or update failed");

      const currentUserId = currentUser.data.user?.id;
      if (currentUserId) {
        try {
          if (newRole === "accountant") await supabase.from("accountants").insert({ user_id: userId, assigned_by: currentUserId, status: 'active', transactions_processed: 0 });
          if (newRole === "technician") await supabase.from("technicians").insert({ user_id: userId, status: 'active', is_available: true, total_jobs_completed: 0 });
          if (newRole === "proprietor") await supabase.from("proprietors").insert({ user_id: userId, status: 'active' });
          if (newRole === "caretaker") await supabase.from("caretakers").insert({ user_id: userId, assigned_by: currentUserId, status: 'active', is_available: true });
        } catch (e) {
          /* ignore duplicate role assignments */
        }
      }

      const user = users.find(u => u.id === userId);
      if (user) await sendApprovalEmail(user, newRole, undefined, undefined);

      toast.success(`User approved as ${newRole} and account activated.`);
      loadUsers();
      setIsAssignDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to assign role");
    }
  };

  const sendApprovalEmail = async (user: User, role: string, propertyId?: string, unitId?: string) => {
    // ... [Logic remains identical] ...
    try {
      let email = user.email;
      let firstName = user.first_name || "User";
      
      if (!email) {
          const { data: userProfile } = await supabase.from("profiles").select("email, first_name, last_name").eq("id", user.id).maybeSingle();
          if (!userProfile) return;
          email = userProfile.email;
          firstName = userProfile.first_name || "User";
      }

      if (!email) return;

      let emailData: any = { email, firstName, role };
      await emailService.sendApprovalEmail(emailData);
    } catch (error) {
      console.error("Error sending approval email:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        const { error } = await supabase.from("profiles").delete().eq("id", userId);
        if (error) throw error;
        toast.success("User deleted successfully");
        loadUsers();
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", userId);
      if (error) throw error;
      toast.success(`User status updated to ${newStatus}`);
      loadUsers();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  // Professional color scheme for each role
  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case "super_admin": return "bg-purple-600 text-white border-purple-700";
      case "property_manager": return "bg-blue-600 text-white border-blue-700";
      case "tenant": return "bg-green-600 text-white border-green-700";
      case "accountant": return "bg-indigo-600 text-white border-indigo-700";
      case "technician": return "bg-orange-600 text-white border-orange-700";
      case "proprietor": return "bg-amber-600 text-white border-amber-700";
      case "caretaker": return "bg-cyan-600 text-white border-cyan-700";
      default: return "bg-slate-400 text-white border-slate-500";
    }
  };

  const getStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case "active": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
      case "inactive": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  // Get role-specific icon
  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case "super_admin": return Crown;
      case "property_manager": return Building;
      case "tenant": return Home;
      case "accountant": return BarChart3;
      case "technician": return Wrench;
      case "proprietor": return Briefcase;
      case "caretaker": return Key;
      default: return User;
    }
  };

  // Get role-specific stat card color
  const getStatCardBgColor = (label: string) => {
    switch (label) {
      case "Super Admins": return "bg-purple-50 border-purple-200";
      case "Managers": return "bg-blue-50 border-blue-200";
      case "Tenants": return "bg-green-50 border-green-200";
      case "Accountants": return "bg-indigo-50 border-indigo-200";
      case "Technicians": return "bg-orange-50 border-orange-200";
      case "Proprietors": return "bg-amber-50 border-amber-200";
      case "Caretakers": return "bg-cyan-50 border-cyan-200";
      default: return "bg-slate-50 border-slate-200";
    }
  };

  const getStatIconColor = (label: string) => {
    switch (label) {
      case "Super Admins": return "text-purple-600";
      case "Managers": return "text-blue-600";
      case "Tenants": return "text-green-600";
      case "Accountants": return "text-indigo-600";
      case "Technicians": return "text-orange-600";
      case "Proprietors": return "text-amber-600";
      case "Caretakers": return "text-cyan-600";
      default: return "text-slate-600";
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users },
    { label: "Super Admins", value: stats.superAdmins, icon: Shield },
    { label: "Managers", value: stats.propertyManagers, icon: Building },
    { label: "Tenants", value: stats.tenants, icon: Home },
    { label: "Accountants", value: stats.accountants, icon: DollarSign },
    { label: "Technicians", value: stats.technicians, icon: Wrench },
    { label: "Proprietors", value: stats.proprietors, icon: Briefcase },
    { label: "Caretakers", value: stats.caretakers, icon: Settings },
    { label: "Pending", value: stats.unassignedUsers, icon: Clock },
    { label: "Assigned", value: stats.assignedUsers, icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-navy via-navy to-cta px-6 py-10 mb-8 shadow-lg text-white">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/80">Realtors Kenya Directory</h4>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              User Management
            </h1>
            <p className="text-white/85 text-sm max-w-2xl pt-1">
              System directory and access control. Manage roles, statuses, and permissions across the platform.
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/30 shadow-lg h-11 px-6 font-semibold transition-all backdrop-blur-sm">
                <Plus className="w-4 h-4 mr-2" />
                NEW USER
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-none border border-slate-300 shadow-2xl p-0">
              <div className="p-6 border-b border-blue-200 bg-blue-50">
                <DialogTitle className="text-xl font-bold text-blue-900">Create New User</DialogTitle>
                <DialogDescription className="text-blue-600 mt-1">
                  Provision a new user account into the system.
                </DialogDescription>
              </div>
              <div className="p-6 bg-white">
                <CreateUserForm
                  onSuccess={() => {
                    setIsDialogOpen(false);
                    loadUsers();
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 space-y-8">
        {/* Strict Grid Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map((stat, idx) => {
            const IconComponent = stat.icon;
            const bgColor = getStatCardBgColor(stat.label);
            const iconColor = getStatIconColor(stat.label);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-5 border rounded-none ${bgColor} hover:shadow-md transition-all cursor-default`}
              >
                <div className="flex items-start justify-between mb-6">
                  <IconComponent className={`h-6 w-6 ${iconColor}`} />
                  <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</span>
                </div>
                <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                  {stat.label}
                </h3>
              </motion.div>
            );
          })}
        </div>

        {/* Sharp Users Table Card */}
        <Card className="rounded-none border border-slate-300 shadow-none bg-white">
          <CardHeader className="border-b border-slate-300 p-5 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-blue-900 uppercase tracking-wide">User Registry</CardTitle>
                <CardDescription className="text-blue-700 text-xs font-medium mt-1 uppercase tracking-wider">
                  DISPLAYING {filteredUsers.length} OF {stats.totalUsers} RECORDS
                </CardDescription>
              </div>
              <Button
                onClick={loadUsers}
                disabled={loading}
                className="h-9 rounded-none border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-400 uppercase text-xs font-bold tracking-widest transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Flat Filters */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Query by name or email..."
                  className="pl-9 h-10 rounded-none border-slate-300 bg-white focus:border-slate-900 focus:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[220px] h-10 rounded-none border border-blue-300 bg-white text-blue-900 focus:border-blue-600 focus:ring-0 font-semibold">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="rounded-none border border-blue-300 shadow-lg bg-white">
                  <SelectItem value="all">ALL ROLES</SelectItem>
                  <SelectItem value="super_admin">SUPER ADMIN</SelectItem>
                  <SelectItem value="property_manager">PROPERTY MANAGER</SelectItem>
                  <SelectItem value="tenant">TENANT</SelectItem>
                  <SelectItem value="technician">TECHNICIAN</SelectItem>
                  <SelectItem value="proprietor">PROPRIETOR</SelectItem>
                  <SelectItem value="caretaker">CARETAKER</SelectItem>
                  <SelectItem value="accountant">ACCOUNTANT</SelectItem>
                  <SelectItem value="no-role">UNASSIGNED</SelectItem>
                  <SelectItem value="pending-approval">PENDING APPROVAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center bg-white">
                <Search className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">No Records Found</h3>
                <p className="text-sm text-slate-500 mt-1">Adjust your search parameters to locate users.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-300 bg-slate-100 hover:bg-slate-100">
                      <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-widest h-12 w-[300px]">Profile</TableHead>
                      <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-widest h-12">Contact Data</TableHead>
                      <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-widest h-12">Access Role</TableHead>
                      <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-widest h-12">State</TableHead>
                      <TableHead className="font-bold text-slate-900 text-xs uppercase tracking-widest h-12 text-right pr-6">Commands</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-b border-slate-200 hover:bg-slate-50 transition-none">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={`${user.first_name} ${user.last_name}`}
                                className="h-10 w-10 rounded-full object-cover border border-blue-300"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-300 rounded-full">
                                {user.first_name?.[0]}{user.last_name?.[0] || <User className="h-4 w-4" />}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-blue-900 text-sm">
                                {user.first_name} {user.last_name}
                              </span>
                              <span className="text-[11px] font-mono text-blue-500 uppercase mt-0.5">
                                UID: {user.id.substring(0, 8)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-sm text-slate-700 font-medium flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {user.email}
                            </span>
                            {user.phone && (
                              <span className="text-sm text-slate-700 font-medium flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                {user.phone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest border ${getRoleBadgeColor(user.role)}`}>
                            {user.role?.replace("_", " ") || "UNASSIGNED"}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest border ${getStatusBadgeColor(user.status)}`}>
                            {user.status || "UNKNOWN"}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            {user.status === 'active' ? (
                              <Button
                                size="icon"
                                onClick={() => handleStatusChange(user.id, 'inactive')}
                                className="h-9 w-9 rounded-lg border border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-400 hover:text-amber-700 transition-all shadow-sm"
                                title="Suspend Account"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="icon"
                                onClick={() => handleStatusChange(user.id, 'active')}
                                className="h-9 w-9 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-400 hover:text-emerald-700 transition-all shadow-sm"
                                title="Activate Account"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsAssignDialogOpen(true);
                              }}
                              className="h-9 w-9 rounded-lg border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700 transition-all shadow-sm"
                              title="Modify Role"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              onClick={() => handleDeleteUser(user.id)}
                              className="h-9 w-9 rounded-lg border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-400 hover:text-red-700 transition-all shadow-sm"
                              title="Purge Identity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sharp Assign Role Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-none border border-slate-300 shadow-2xl p-0">
            <div className="p-6 border-b border-blue-200 bg-blue-50">
              <DialogTitle className="text-xl font-bold text-blue-900">Modify Access Role</DialogTitle>
              <DialogDescription className="text-blue-600 mt-1">
                Alter system permissions and state for this identity.
              </DialogDescription>
            </div>
            <div className="p-6 bg-white">
              {selectedUser && (
                <AssignRoleForm
                  user={selectedUser}
                  onAssignRole={(role, managedProperties, propertyId, unitId) => {
                    handleAssignRole(selectedUser.id, role, managedProperties, propertyId, unitId, selectedUser);
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// CREATE USER FORM (Sharp Design)
// --------------------------------------------------------------------------------
interface CreateUserFormProps { onSuccess: () => void; }

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [technicianCategories, setTechnicianCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [formData, setFormData] = useState({
    email: "", firstName: "", lastName: "", phone: "", password: "", role: "tenant", technicianCategoryId: "",
  });

  React.useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const { technicianService } = await import('@/services/technicianService');
      const categories = await technicianService.getCategories();
      setTechnicianCategories(categories);
    } catch (error) { console.error('Error loading technician categories:', error); } 
    finally { setLoadingCategories(false); }
  };

  const handleCreateUser = async () => {
    // [Logic remains identical]
    if (!formData.email || !formData.firstName || !formData.lastName) { toast.error("Missing required fields"); return; }
    if (!formData.password || formData.password.length < 6) { toast.error("Password too short"); return; }
    if (formData.role === 'technician' && !formData.technicianCategoryId) { toast.error("Missing specialty category"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) { toast.error("Invalid email"); return; }

    try {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: { first_name: formData.firstName.trim(), last_name: formData.lastName.trim(), phone: formData.phone?.trim() || null, role: formData.role, status: "active" },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user data returned");

      toast.success("Identity instantiated successfully");
      onSuccess();
    } catch (error) {
      toast.error(`Creation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-widest text-slate-700">First Name <span className="text-red-500">*</span></Label>
          <Input id="firstName" className="rounded-none border-slate-300 focus:border-slate-900 focus:ring-0 h-11" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-widest text-slate-700">Last Name <span className="text-red-500">*</span></Label>
          <Input id="lastName" className="rounded-none border-slate-300 focus:border-slate-900 focus:ring-0 h-11" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-700">Email Address <span className="text-red-500">*</span></Label>
        <Input id="email" type="email" className="rounded-none border-slate-300 focus:border-slate-900 focus:ring-0 h-11" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-slate-700">Phone Directory</Label>
        <Input id="phone" type="tel" className="rounded-none border-slate-300 focus:border-slate-900 focus:ring-0 h-11" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-700">Security Key <span className="text-red-500">*</span></Label>
        <Input id="password" type="password" className="rounded-none border-slate-300 focus:border-slate-900 focus:ring-0 h-11" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" className="text-xs font-bold uppercase tracking-widest text-slate-700">Initial State</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value, technicianCategoryId: "" })}>
          <SelectTrigger className="rounded-none border-slate-300 focus:border-slate-900 focus:ring-0 h-11 uppercase text-sm">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-slate-300 shadow-xl">
            <SelectItem value="tenant">TENANT</SelectItem>
            <SelectItem value="property_manager">PROPERTY MANAGER</SelectItem>
            <SelectItem value="super_admin">SUPER ADMIN</SelectItem>
            <SelectItem value="proprietor">PROPRIETOR</SelectItem>
            <SelectItem value="caretaker">CARETAKER</SelectItem>
            <SelectItem value="technician">TECHNICIAN</SelectItem>
            <SelectItem value="accountant">ACCOUNTANT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.role === 'technician' && (
        <div className="space-y-2 border border-slate-300 p-4 bg-slate-50">
          <Label className="text-xs font-bold uppercase tracking-widest text-slate-700">Specialty Designation <span className="text-red-500">*</span></Label>
          {loadingCategories ? (
            <div className="text-xs text-slate-500 font-mono mt-2">Fetching matrix data...</div>
          ) : (
            <Select value={formData.technicianCategoryId} onValueChange={(value) => setFormData({ ...formData, technicianCategoryId: value })}>
              <SelectTrigger className="bg-white rounded-none border-slate-300 h-11 focus:border-slate-900 focus:ring-0 mt-2">
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-slate-300 shadow-xl">
                {technicianCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="uppercase text-sm">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <div className="flex gap-4 pt-6">
        <Button variant="outline" className="flex-1 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 h-12 text-xs font-bold uppercase tracking-widest" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>
          Abort
        </Button>
        <Button onClick={handleCreateUser} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-12 text-xs font-bold uppercase tracking-widest transition-colors shadow-md">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Execute Creation
        </Button>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// ASSIGN ROLE FORM (Sharp Design)
// --------------------------------------------------------------------------------
interface AssignRoleFormProps {
  user: User;
  onAssignRole: (role: string, managedProperties?: string[], propertyId?: string, unitId?: string) => void;
}

const AssignRoleForm: React.FC<AssignRoleFormProps> = ({ user, onAssignRole }) => {
  const [selectedRole, setSelectedRole] = useState(user.role || "tenant");

  const handleAssign = () => {
    onAssignRole(selectedRole);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 border border-blue-300 rounded-lg flex gap-4 items-center">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={`${user.first_name} ${user.last_name}`}
            className="h-12 w-12 rounded-full object-cover border border-blue-300"
          />
        ) : (
          <div className="h-12 w-12 bg-gradient-to-br from-blue-200 to-blue-100 flex items-center justify-center text-blue-700 border border-blue-300 font-bold rounded-full">
            {user.first_name?.[0]}{user.last_name?.[0] || <User className="h-5 w-5" />}
          </div>
        )}
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wide">{user.first_name} {user.last_name}</h4>
          <p className="text-xs font-mono text-blue-600">{user.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newRole" className="text-xs font-bold uppercase tracking-widest text-slate-700">Target Role</Label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="rounded-none border-slate-300 focus:border-slate-900 focus:ring-0 h-12 uppercase text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none border-slate-300 shadow-xl">
            <SelectItem value="tenant">TENANT</SelectItem>
            <SelectItem value="property_manager">PROPERTY MANAGER</SelectItem>
            <SelectItem value="super_admin">SUPER ADMIN</SelectItem>
            <SelectItem value="proprietor">PROPRIETOR</SelectItem>
            <SelectItem value="caretaker">CARETAKER</SelectItem>
            <SelectItem value="technician">TECHNICIAN</SelectItem>
            <SelectItem value="accountant">ACCOUNTANT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pt-2">
        <Button onClick={handleAssign} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-12 text-xs font-bold uppercase tracking-widest transition-colors shadow-md">
          Commit Change
        </Button>
      </div>
    </div>
  );
};

export default UserManagementNew;