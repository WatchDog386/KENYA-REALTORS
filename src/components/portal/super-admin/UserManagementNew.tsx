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
import { HeroBackground } from "@/components/ui/HeroBackground";
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
      console.log("🔄 Sync status:", JSON.stringify(syncStatus, null, 2));

      const { data: allUsers, error: fetchError } = await supabase
        .from("all_users_with_profile")
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

      const superAdminCount = typedUsers.filter((u) => u.role === "super_admin").length;
      const propertyManagerCount = typedUsers.filter((u) => u.role === "property_manager").length;
      const tenantCount = typedUsers.filter((u) => u.role === "tenant").length;
      const noRoleCount = typedUsers.filter((u) => !u.role).length;

      setStats({
        totalUsers: typedUsers.length,
        unassignedUsers: noRoleCount,
        assignedUsers: typedUsers.length - noRoleCount,
        superAdmins: superAdminCount,
        propertyManagers: propertyManagerCount,
        tenants: tenantCount,
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
    try {
      console.log("🔄 Assigning role to user:", { userId, newRole });

      // Step 0: Check if profile exists, if not create it
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("id", userId)
        .maybeSingle();

      if (checkError) {
        console.error("❌ Error checking profile:", checkError.message);
        throw checkError;
      }

      // If profile doesn't exist, create it from user data
      if (!existingProfile) {
        console.log("⚠️  Profile missing, creating it from user data...");
        
        if (!userData) {
          console.error("❌ User data not provided for profile creation");
          throw new Error(`Cannot create profile: user data not available`);
        }

        // Create profile from user data
        console.log("📝 Creating profile for user...");
        const { error: createError, data: createdProfile } = await supabase
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
          })
          .select();

        if (createError) {
          // Ignore duplicate key errors - profile may have been created concurrently
          if (!createError.message.includes("duplicate") && !createError.message.includes("violates unique")) {
            console.error("❌ Failed to create profile:", createError.message);
            throw createError;
          }
          console.log("ℹ️  Profile already exists (concurrent creation)");
        } else {
          console.log("✅ Profile created successfully");
        }
      }

      // Step 1: Get current super admin
      const currentUser = await supabase.auth.getUser();
      
      // Step 2: Update profile with role
      console.log("📝 Updating user role...");
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

      if (profileError) {
        console.error("❌ Failed to update profile:", profileError.message);
        throw profileError;
      }

      if (!updateData || updateData.length === 0) {
        throw new Error("User not found or update failed");
      }

      const updatedProfile = updateData[0];
      console.log("✅ User profile updated successfully:", {
        email: updatedProfile.email,
        role: updatedProfile.role,
        status: updatedProfile.status,
        is_active: updatedProfile.is_active,
      });

      // Step 3: If property manager, assign properties
      if (newRole === "property_manager") {
        // CRITICAL: Validate that at least one property is provided
        if (!managedProperties || managedProperties.length === 0) {
          console.error("❌ CRITICAL ERROR: Property manager approved without properties", {
            userId,
            managedProperties: managedProperties || []
          });
          throw new Error("Property manager must be assigned to at least one property before approval. This should not happen - UI should prevent this.");
        }
        
        console.log("🔗 Assigning properties to manager...");
        const assignments = managedProperties.map(propId => ({
          property_manager_id: userId,
          property_id: propId
        }));

        const { error: assignError, data: assignData } = await supabase
          .from("property_manager_assignments")
          .insert(assignments)
          .select();

        if (assignError) {
          if (!assignError.message.includes("violates unique constraint")) {
            console.error("❌ Property assignment error:", assignError.message);
            throw assignError;
          }
          console.warn("⚠️ Duplicate assignment (user already assigned to property)");
        } else {
          console.log("✅ Properties assigned successfully:", assignData?.length || 0, "assignments stored");
        }
      }

      // Step 4: If tenant, assign unit in property
      if (newRole === "tenant") {
        // CRITICAL: Validate that property and unit are provided
        if (!propertyId || !unitId) {
          console.error("❌ CRITICAL ERROR: Tenant approved without property_id or unit_id", {
            userId,
            propertyId: propertyId || "NULL",
            unitId: unitId || "NULL"
          });
          throw new Error("Tenant must be assigned to a property and unit before approval. This should not happen - UI should prevent this.");
        }
        
        console.log("🏠 Assigning tenant to unit...");
        const { error: tenantError, data: tenantData } = await supabase
          .from("tenants")
          .insert({
            user_id: userId,
            property_id: propertyId,
            unit_id: unitId,
            status: "active",
            move_in_date: new Date().toISOString()
          })
          .select();

        if (tenantError) {
          if (!tenantError.message.includes("violates unique constraint")) {
            console.error("❌ Tenant assignment error:", tenantError.message);
            throw tenantError;
          }
          console.warn("⚠️ Duplicate assignment (tenant already assigned)");
        } else {
          console.log("✅ Tenant assigned successfully to unit:", {
            propertyId,
            unitId,
            assignmentCount: tenantData?.length || 0
          });
        }
      }

      // Step 5: Send approval notification
      const user = users.find(u => u.id === userId);
      if (user) {
         await sendApprovalEmail(user, newRole, propertyId, unitId);
      }

      toast.success(`✅ User approved as ${newRole} and account ACTIVATED!`);
      console.log("🎉 Approval complete - status automatically set to ACTIVE by trigger");
      
      loadUsers();
      setIsAssignDialogOpen(false);
    } catch (error: any) {
      console.error("❌ Error assigning role:", error);
      toast.error(error.message || "Failed to assign role");
    }
  };

  const sendApprovalEmail = async (user: User, role: string, propertyId?: string, unitId?: string) => {
    try {
      // Use provided user object first, try to look up email if missing
      let email = user.email;
      let firstName = user.first_name || "User";
      
      // If we don't have email in the user object (fallback case), try to fetch
      if (!email) {
          const { data: userProfile, error: profileError } = await supabase
            .from("profiles")
            .select("email, first_name, last_name")
            .eq("id", user.id)
            .maybeSingle();
            
          if (profileError || !userProfile) {
             console.warn("Could not fetch user profile for email:", profileError);
             return; 
          }
          email = userProfile.email;
          firstName = userProfile.first_name || "User";
      }

      if (!email) return;

      let emailData: any = {
        email: email,
        firstName: firstName,
        role: role,
      };

      // Get property and unit info if applicable
      if (role === "tenant" && propertyId && unitId) {
        const { data: property } = await supabase
          .from("properties")
          .select("name")
          .eq("id", propertyId)
          .single();

        const { data: unit } = await supabase
          .from("property_unit_types")
          .select("name")
          .eq("id", unitId)
          .single();

        // Get property manager info
        const { data: pmAssignment } = await supabase
          .from("property_manager_assignments")
          .select("property_manager_id")
          .eq("property_id", propertyId)
          .single();

        if (pmAssignment) {
          const { data: pm } = await supabase
            .from("profiles")
            .select("first_name, last_name, email, phone")
            .eq("id", pmAssignment.property_manager_id)
            .single();

          if (pm) {
            emailData.managerName = `${pm.first_name} ${pm.last_name}`;
            emailData.managerEmail = pm.email;
            emailData.managerPhone = pm.phone;
          }
        }

        emailData.propertyName = property?.name;
        emailData.unitName = unit?.name;
      }

      // Send approval email
      await emailService.sendApprovalEmail(emailData);
    } catch (error) {
      console.error("Error sending approval email:", error);
      // Don't throw - email is secondary
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm("Are you sure you want to delete this user? This action cannot be undone.")
    ) {
      try {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userId);

        if (error) throw error;

        toast.success("User deleted successfully");
        loadUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Failed to delete user");
      }
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`User status updated to ${newStatus}`);
      loadUsers();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update user status");
    }
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800 border-red-300";
      case "property_manager":
        return "bg-green-100 text-green-800 border-green-300";
      case "tenant":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "accountant":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "inactive":
        return "bg-slate-100 text-slate-800 border-slate-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Loader2 className="w-8 h-8 text-[#154279]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#154279] to-[#0f325e] text-white py-12 px-6 shadow-xl mb-8 lg:rounded-b-3xl">
        <HeroBackground />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1400px] mx-auto">
          <div className="space-y-1">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-inner">
                    <Users className="w-5 h-5 text-white" />
                 </div>
                 <span className="text-blue-100 font-bold tracking-wider text-xs uppercase">Directory</span>
             </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              User <span className="text-[#F96302]">Management</span>
            </h1>
            <p className="text-blue-100 text-sm mt-2 font-medium max-w-xl">
              Manage all system users, assign roles, track account status, and control access permissions.
            </p>
          </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="group relative flex items-center gap-2 bg-white text-[#154279] px-6 py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-white/90 transition-all duration-300 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    Add New User
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white border-2 border-slate-200">
                <DialogHeader>
                  <DialogTitle className="text-[#154279] font-black text-xl">Create New User</DialogTitle>
                  <DialogDescription className="text-slate-600 font-medium">
                    Add a new user to the system
                  </DialogDescription>
                </DialogHeader>
                <CreateUserForm
                  onSuccess={() => {
                    setIsDialogOpen(false);
                    loadUsers();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[
          { 
            label: "Total Users", 
            value: stats.totalUsers, 
            icon: Users, 
            primaryColor: "#3b82f6",
            secondaryColor: "#1e40af",
            accentColor: "from-blue-50 via-blue-50/30 to-white",
            borderHover: "hover:border-blue-400 hover:shadow-blue-500/20"
          },
          { 
            label: "Pending", 
            value: stats.unassignedUsers, 
            icon: Clock, 
            primaryColor: "#f59e0b",
            secondaryColor: "#d97706",
            accentColor: "from-amber-50 via-amber-50/30 to-white",
            borderHover: "hover:border-amber-400 hover:shadow-amber-500/20"
          },
          { 
            label: "Super Admins", 
            value: stats.superAdmins, 
            icon: Shield, 
            primaryColor: "#ef4444",
            secondaryColor: "#b91c1c",
            accentColor: "from-red-50 via-red-50/30 to-white",
            borderHover: "hover:border-red-400 hover:shadow-red-500/20"
          },
          { 
            label: "Managers", 
            value: stats.propertyManagers, 
            icon: Building, 
            primaryColor: "#10b981",
            secondaryColor: "#059669",
            accentColor: "from-emerald-50 via-emerald-50/30 to-white",
            borderHover: "hover:border-emerald-400 hover:shadow-emerald-500/20"
          },
          { 
            label: "Tenants", 
            value: stats.tenants, 
            icon: Home, 
            primaryColor: "#8b5cf6",
            secondaryColor: "#7c3aed",
            accentColor: "from-purple-50 via-purple-50/30 to-white",
            borderHover: "hover:border-purple-400 hover:shadow-purple-500/20"
          },
          { 
            label: "Assigned", 
            value: stats.assignedUsers, 
            icon: CheckCircle, 
            primaryColor: "#06b6d4",
            secondaryColor: "#0891b2",
            accentColor: "from-cyan-50 via-cyan-50/30 to-white",
            borderHover: "hover:border-cyan-400 hover:shadow-cyan-500/20"
          },
        ].map((stat, idx) => {
          const IconComponent = stat.icon;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className={`group relative border-2 rounded-2xl transition-all duration-300 flex flex-col h-full overflow-hidden bg-gradient-to-br ${stat.accentColor} border-slate-300 ${stat.borderHover} hover:shadow-xl hover:scale-[1.02] shadow-sm`}
            >
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-10 bg-gradient-to-br from-[#154279] transition-all duration-300" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />

              <div className="relative p-5 flex flex-col items-center text-center">
                 <div className="mb-3 p-3 rounded-xl bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-6 w-6" style={{ color: stat.primaryColor }} />
                 </div>
                 
                 <div className="text-3xl font-black text-[#154279] mb-1 tracking-tight">
                    {stat.value}
                 </div>
                 
                 <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {stat.label}
                 </h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Users Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-slate-200 bg-white shadow-lg">
          <CardHeader className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[#154279] font-black text-xl">All User Accounts</CardTitle>
                <CardDescription className="text-slate-600 font-medium mt-1">
                  {filteredUsers.length} users • Total: {stats.totalUsers}
                </CardDescription>
              </div>
              <button
                onClick={loadUsers}
                disabled={loading}
                className="group flex items-center gap-2 bg-white text-[#154279] px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 border-2 border-slate-100"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                Refresh
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10 border-2 border-slate-200 rounded-xl focus:border-[#154279] focus:ring-0 bg-white"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="border-2 border-slate-200 rounded-xl w-full sm:w-48 bg-white">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="property_manager">Property Manager</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="no-role">No Role Assigned</SelectItem>
                  <SelectItem value="pending-approval">Pending Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
              <Alert className="bg-amber-50 border-2 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 font-medium">
                  No users found matching your criteria.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="rounded-xl border-2 border-slate-200 overflow-hidden bg-white shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50 border-b-2 border-slate-200">
                    <TableRow className="hover:bg-slate-50">
                      <TableHead className="text-[#154279] font-black">Name</TableHead>
                      <TableHead className="text-[#154279] font-black">Email</TableHead>
                      <TableHead className="text-[#154279] font-black">Role</TableHead>
                      <TableHead className="text-[#154279] font-black">Status</TableHead>
                      <TableHead className="text-[#154279] font-black">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user, idx) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <TableCell className="font-semibold text-slate-900">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role)}`}>
                            {user.role?.replace("_", " ").toUpperCase() || "No Role"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(user.status)}`}>
                            {user.status?.toUpperCase() || "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsAssignDialogOpen(true);
                              }}
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                              title="Assign Role"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 hover:text-red-700"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Assign Role Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border-2 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-[#154279] font-black text-xl">Assign Role</DialogTitle>
            <DialogDescription className="text-slate-600 font-medium">
              Approve and assign a role to this user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <AssignRoleForm
              user={selectedUser}
              onAssignRole={(role, managedProperties, propertyId, unitId) => {
                handleAssignRole(selectedUser.id, role, managedProperties, propertyId, unitId, selectedUser);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
};

// Create User Form Component
interface CreateUserFormProps {
  onSuccess: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    role: "tenant",
  });

  const handleCreateUser = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = formData.email.trim().toLowerCase();

    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            phone: formData.phone?.trim() || null,
            role: formData.role,
            status: "active",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      toast.success("User created successfully");
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error creating user:", errorMessage);
      toast.error(`Failed to create user: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="firstName" className="text-slate-700 font-bold text-sm">
            First Name *
          </Label>
          <Input
            id="firstName"
            placeholder="John"
            className="border-2 border-slate-200 rounded-xl focus:border-[#154279] focus:ring-0 mt-1 bg-white"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-slate-700 font-bold text-sm">
            Last Name *
          </Label>
          <Input
            id="lastName"
            placeholder="Doe"
            className="border-2 border-slate-200 rounded-xl focus:border-[#154279] focus:ring-0 mt-1 bg-white"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="text-slate-700 font-bold text-sm">
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          className="border-2 border-slate-200 rounded-xl focus:border-[#154279] focus:ring-0 mt-1 bg-white"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="phone" className="text-slate-700 font-bold text-sm">
          Phone
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+254..."
          className="border-2 border-slate-200 rounded-xl focus:border-[#154279] focus:ring-0 mt-1 bg-white"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="password" className="text-slate-700 font-bold text-sm">
          Password *
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 6 characters"
          className="border-2 border-slate-200 rounded-xl focus:border-[#154279] focus:ring-0 mt-1 bg-white"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="role" className="text-slate-700 font-bold text-sm">
          Initial Role
        </Label>
        <Select value={formData.role} onValueChange={(value: string) => setFormData({ ...formData, role: value })}>
          <SelectTrigger className="border-2 border-slate-200 rounded-xl mt-1 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tenant">Tenant</SelectItem>
            <SelectItem value="property_manager">Property Manager</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          className="border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 font-semibold"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateUser}
          disabled={loading}
          className="flex-1 bg-[#154279] hover:bg-[#0f325e] text-white font-bold rounded-xl transition-colors"
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create User
        </Button>
      </div>
    </div>
  );
};

// Assign Role Form Component
interface AssignRoleFormProps {
  user: User;
  onAssignRole: (role: string, managedProperties?: string[], propertyId?: string, unitId?: string) => void;
}

const AssignRoleForm: React.FC<AssignRoleFormProps> = ({ user, onAssignRole }) => {
  const [selectedRole, setSelectedRole] = useState(user.role || "tenant");
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [propertyManagers, setPropertyManagers] = useState<Map<string, any>>(new Map());
  const [selectedPropertyManager, setSelectedPropertyManager] = useState<string>("");

  useEffect(() => {
    fetchPropertiesAndManagers();
  }, []);

  const fetchPropertiesAndManagers = async () => {
    try {
      setLoading(true);
      const { data: propertiesData, error: propsError } = await supabase
        .from('properties')
        .select('id, name, location, type')
        .order('name');

      if (propsError) throw propsError;
      setProperties(propertiesData || []);

      // Fetch all property managers for each property
      const { data: assignmentsData, error: assignError } = await supabase
        .from('property_manager_assignments')
        .select('property_id, property_manager_id');

      if (assignError) throw assignError;

      // Map property to its manager(s) - fetch manager details separately
      const managerMap = new Map<string, any>();
      if (assignmentsData && assignmentsData.length > 0) {
        for (const assignment of assignmentsData) {
          // Fetch manager profile details
          const { data: managerProfile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('id', assignment.property_manager_id)
            .single();
          
          if (managerProfile) {
            managerMap.set(assignment.property_id, managerProfile);
          }
        }
      }
      setPropertyManagers(managerMap);
    } catch (error) {
      console.error("Error fetching properties/managers:", error);
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyChange = async (propertyId: string) => {
    setSelectedProperty(propertyId);
    setSelectedUnit("");

    // Set the property manager for this property
    const manager = propertyManagers.get(propertyId);
    if (manager) {
      setSelectedPropertyManager(`${manager.first_name} ${manager.last_name}`);
    } else {
      setSelectedPropertyManager("No manager assigned to this property");
    }

    if (!propertyId) {
      setUnits([]);
      return;
    }

    // For property managers, track selected properties
    if (selectedRole === "property_manager") {
      if (selectedProperties.includes(propertyId)) {
        setSelectedProperties(selectedProperties.filter(p => p !== propertyId));
      } else {
        setSelectedProperties([...selectedProperties, propertyId]);
      }
    }

    // Fetch units for selected property
    if (selectedRole === "tenant") {
      try {
        const { data: unitsData, error: unitsError } = await supabase
          .from('property_unit_types')
          .select('id, name, units_count')
          .eq('property_id', propertyId);

        if (unitsError) throw unitsError;
        setUnits(unitsData || []);
      } catch (error) {
        console.error("Error fetching units:", error);
        toast.error("Failed to load units");
      }
    }
  };

  const handleAssign = () => {
    if (selectedRole === "property_manager" && selectedProperties.length === 0) {
      toast.error("Please select at least one property for the property manager");
      return;
    }

    if (selectedRole === "tenant") {
      if (!selectedProperty || !selectedUnit) {
        toast.error("Please select a property and unit for the tenant");
        return;
      }
      onAssignRole(selectedRole, undefined, selectedProperty, selectedUnit);
    } else if (selectedRole === "property_manager") {
      onAssignRole(selectedRole, selectedProperties);
    } else {
      onAssignRole(selectedRole);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-xl space-y-2 border-2 border-blue-200">
        <p className="text-sm text-slate-700">
          <strong className="text-[#154279]">Name:</strong> {user.first_name} {user.last_name}
        </p>
        <p className="text-sm text-slate-700">
          <strong className="text-[#154279]">Email:</strong> {user.email}
        </p>
        <p className="text-sm text-slate-700">
          <strong className="text-[#154279]">Current Role:</strong> {user.role || "No Role"}
        </p>
        <p className="text-sm text-slate-700">
          <strong className="text-[#154279]">Status:</strong>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${user.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
            {user.status?.toUpperCase()}
          </span>
        </p>
      </div>

      <div>
        <Label htmlFor="newRole" className="text-slate-700 font-bold text-sm">
          Assign Role *
        </Label>
        <Select value={selectedRole} onValueChange={(value) => {
          setSelectedRole(value);
          setSelectedProperty("");
          setSelectedUnit("");
          setUnits([]);
          setSelectedProperties([]);
        }}>
          <SelectTrigger className="border-2 border-slate-200 rounded-xl mt-1 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tenant">Tenant</SelectItem>
            <SelectItem value="property_manager">Property Manager</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property Selection for Property Managers */}
      {selectedRole === "property_manager" && (
        <div className="space-y-3 p-4 bg-green-50 rounded-xl border-2 border-green-200">
          <Label className="text-slate-700 font-bold text-sm flex items-center gap-2">
            <Building className="w-4 h-4 text-green-600" />
            Assign Properties *
          </Label>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-green-600" />
              <span className="ml-2 text-sm text-slate-600">Loading properties...</span>
            </div>
          ) : properties.length === 0 ? (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                No properties available. Create properties first before assigning property managers.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {properties.map((property) => (
                <label key={property.id} className="flex items-center gap-3 p-2 hover:bg-green-100 rounded-lg cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedProperties.includes(property.id)}
                    onChange={() => handlePropertyChange(property.id)}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm text-slate-700 font-medium">{property.name}</span>
                  <span className="text-xs text-slate-500">({property.location})</span>
                </label>
              ))}
            </div>
          )}
          <p className="text-xs text-green-800">
            Selected: {selectedProperties.length} propert{selectedProperties.length === 1 ? "y" : "ies"}
          </p>
        </div>
      )}

      {/* Property & Unit Selection for Tenants */}
      {selectedRole === "tenant" && (
        <div className="space-y-3 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
          <div>
            <Label htmlFor="tenantProperty" className="text-slate-700 font-bold text-sm flex items-center gap-2">
              <Home className="w-4 h-4 text-purple-600" />
              Select Property *
            </Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              </div>
            ) : (
              <Select value={selectedProperty} onValueChange={handlePropertyChange}>
                <SelectTrigger className="border-2 border-purple-200 rounded-xl mt-1 bg-white focus:border-purple-400">
                  <SelectValue placeholder="Choose a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name} ({property.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedProperty && selectedPropertyManager && (
            <div className="p-3 bg-blue-100 rounded-lg border-2 border-blue-300">
              <p className="text-sm text-slate-700">
                <strong className="text-slate-800">Property Manager:</strong>
              </p>
              <p className={`text-sm font-semibold ${selectedPropertyManager.includes("No manager") ? "text-amber-700" : "text-blue-700"}`}>
                {selectedPropertyManager}
              </p>
              {selectedPropertyManager.includes("No manager") && (
                <p className="text-xs text-amber-600 mt-1">⚠️ This property has no assigned manager yet. Assign a property manager first.</p>
              )}
            </div>
          )}

          {selectedProperty && units.length > 0 && (
            <div>
              <Label htmlFor="tenantUnit" className="text-slate-700 font-bold text-sm">
                Select Unit *
              </Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="border-2 border-purple-200 rounded-xl mt-1 bg-white focus:border-purple-400">
                  <SelectValue placeholder="Choose a unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.units_count} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedProperty && units.length === 0 && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                No units available for this property.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {selectedRole === "tenant" && (!selectedProperty || !selectedUnit) && (
        <Alert className="bg-red-50 border-2 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">
            ⚠️ REQUIRED: Select a property AND unit before approving this tenant. This ensures they can access their assigned unit.
          </AlertDescription>
        </Alert>
      )}

      {selectedRole === "property_manager" && selectedProperties.length === 0 && (
        <Alert className="bg-red-50 border-2 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">
            ⚠️ REQUIRED: Select at least one property before approving this property manager. This ensures they can manage properties.
          </AlertDescription>
        </Alert>
      )}

      <Alert className="bg-blue-50 border-2 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 font-medium">
          This will approve the user and activate their account. They will receive a notification email and can login immediately.
        </AlertDescription>
      </Alert>

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          className="border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 font-semibold"
        >
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          disabled={
            (selectedRole === "tenant" && (!selectedProperty || !selectedUnit)) ||
            (selectedRole === "property_manager" && selectedProperties.length === 0)
          }
          className={`flex-1 font-bold rounded-xl transition-colors ${
            (selectedRole === "tenant" && (!selectedProperty || !selectedUnit)) ||
            (selectedRole === "property_manager" && selectedProperties.length === 0)
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
          title={
            selectedRole === "tenant" && (!selectedProperty || !selectedUnit)
              ? "Select a property and unit first"
              : selectedRole === "property_manager" && selectedProperties.length === 0
              ? "Select at least one property first"
              : "Approve and assign this user"
          }
        >
          ✓ Approve & Assign
        </Button>
      </div>
    </div>
  );
};

export default UserManagementNew;
