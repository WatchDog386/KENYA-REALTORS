// src/components/portal/super-admin/UserManagementNew.tsx
import React, { useState, useEffect } from "react";
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
  UserMinus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
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
  suppliers: number;
  technicians: number;
  proprietors: number;
  caretakers: number;
}

const PANEL_HEADER_CLASS =
  "bg-[#154279] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white";

const INPUT_CLASS_NAME =
  "h-10 rounded-none border border-[#b6bec8] bg-white px-3 text-[13px] text-[#1f2937] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#F96302]";

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
    suppliers: 0,
    technicians: 0,
    proprietors: 0,
    caretakers: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
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
        suppliers: typedUsers.filter((u) => u.role === "supplier").length,
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
      case "supplier": return "bg-emerald-700 text-white border-emerald-800";
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
      case "supplier": return Handshake;
      case "technician": return Wrench;
      case "proprietor": return Briefcase;
      case "caretaker": return Key;
      default: return User;
    }
  };

  const getStatIconColor = (label: string) => {
    switch (label) {
      case "Super Admins": return "text-purple-600";
      case "Managers": return "text-blue-600";
      case "Tenants": return "text-green-600";
      case "Accountants": return "text-indigo-600";
      case "Suppliers": return "text-emerald-700";
      case "Technicians": return "text-orange-600";
      case "Proprietors": return "text-amber-600";
      case "Caretakers": return "text-cyan-600";
      default: return "text-slate-600";
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center bg-[#d7dce1]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#154279]" />
          <p className="text-[13px] font-medium text-[#5f6b7c]">Loading users...</p>
        </div>
      </div>
    );
  }

  const formatFilterLabel = (value: string) =>
    value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (match) => match.toUpperCase());

  const filterHeading = roleFilter === "all" ? "Workspace" : formatFilterLabel(roleFilter);
  const suspendedUsers = users.filter((u) => u.status === "inactive" || u.status === "suspended").length;

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 md:p-6 font-['Poppins','Segoe_UI',sans-serif] text-[#243041]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="border border-[#bcc3cd] bg-[#eef1f4] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[#6a7788]">Workspace View</p>
              <h1 className="mt-1 text-[42px] font-bold leading-none text-[#1f2937]">{filterHeading} Users</h1>
              <p className="mt-2 text-[13px] font-medium text-[#5f6b7c]">See user counts by role and manage access</p>
            </div>
            <span className="inline-flex items-center bg-[#1f5e8f] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              {roleFilter === "all" ? "All Users" : formatFilterLabel(roleFilter)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="overflow-hidden border border-[#adb5bf] rounded-none">
              <div className="bg-[#2aa8bf] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Total Users</p>
                <p className="mt-1 text-[40px] font-bold leading-none text-white">{stats.totalUsers}</p>
              </div>
              <div className="bg-[#1f93a8] px-3 py-1.5 text-[18px] font-medium text-white">All roles</div>
            </div>
            <div className="overflow-hidden border border-[#adb5bf] rounded-none">
              <div className="bg-[#2daf4a] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Managers</p>
                <p className="mt-1 text-[40px] font-bold leading-none text-white">{stats.propertyManagers}</p>
              </div>
              <div className="bg-[#24933d] px-3 py-1.5 text-[18px] font-medium text-white">Manager accounts</div>
            </div>
            <div className="overflow-hidden border border-[#adb5bf] rounded-none">
              <div className="bg-[#f3bd11] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1f2937]/80">Tenants</p>
                <p className="mt-1 text-[40px] font-bold leading-none text-[#1f2937]">{stats.tenants}</p>
              </div>
              <div className="bg-[#d6a409] px-3 py-1.5 text-[18px] font-medium text-[#1f2937]">Tenant accounts</div>
            </div>
            <div className="overflow-hidden border border-[#adb5bf] rounded-none">
              <div className="bg-[#dc3545] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Suspended</p>
                <p className="mt-1 text-[40px] font-bold leading-none text-white">{suspendedUsers}</p>
              </div>
              <div className="bg-[#c12c3a] px-3 py-1.5 text-[18px] font-medium text-white">Access disabled</div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="border border-[#bcc3cd] bg-[#eef1f4] xl:col-span-4">
            <div className="border-b border-[#c4cad3] px-3 py-2 text-[14px] font-semibold text-[#1f2937]">Add User</div>
            <div className="p-4">
              <CreateUserForm onSuccess={loadUsers} />
            </div>
          </div>

          <div className="border border-[#bcc3cd] bg-[#eef1f4] xl:col-span-8">
            <div className="flex items-center justify-between border-b border-[#c4cad3] px-3 py-2">
              <p className="text-[14px] font-semibold text-[#1f2937]">Users and Roles</p>
              <p className="text-[12px] font-medium text-[#5f6b7c]">{filteredUsers.length} records</p>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8595]" />
                  <Input
                    placeholder="Search users by name or email"
                    className={`${INPUT_CLASS_NAME} pl-9`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-10 w-full rounded-none border-2 border-[#7f8fa3] bg-white px-3 text-[13px] font-semibold text-[#111827] outline-none focus:border-[#3c8dbc] sm:w-[240px]"
                >
                  <option value="all">ALL ROLES</option>
                  <option value="super_admin">SUPER ADMIN</option>
                  <option value="property_manager">PROPERTY MANAGER</option>
                  <option value="tenant">TENANT</option>
                  <option value="technician">TECHNICIAN</option>
                  <option value="proprietor">PROPRIETOR</option>
                  <option value="caretaker">CARETAKER</option>
                  <option value="accountant">ACCOUNTANT</option>
                  <option value="supplier">SUPPLIER</option>
                  <option value="no-role">UNASSIGNED</option>
                  <option value="pending-approval">PENDING APPROVAL</option>
                </select>

                <Button
                  onClick={loadUsers}
                  disabled={loading}
                  className="h-10 rounded-none border border-[#b6bec8] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]"
                >
                  <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="border border-[#c4cad3] bg-white py-16 text-center text-[18px] font-medium text-[#5f6b7c]">
                  No users found.
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#c4cad3] bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-[#c4cad3] bg-[#e8ecf1] hover:bg-[#e8ecf1]">
                        <TableHead className="h-12 text-xs font-bold uppercase tracking-widest text-[#324156]">Name</TableHead>
                        <TableHead className="h-12 text-xs font-bold uppercase tracking-widest text-[#324156]">Email</TableHead>
                        <TableHead className="h-12 text-xs font-bold uppercase tracking-widest text-[#324156]">Role</TableHead>
                        <TableHead className="h-12 text-xs font-bold uppercase tracking-widest text-[#324156]">Status</TableHead>
                        <TableHead className="h-12 pr-4 text-right text-xs font-bold uppercase tracking-widest text-[#324156]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-b border-[#d4dae3] hover:bg-[#f6f8fb]">
                          <TableCell className="py-3 text-[13px] font-semibold text-[#1f2937]">
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell className="py-3 text-[13px] font-medium text-[#324156]">{user.email}</TableCell>
                          <TableCell className="py-3">
                            <span className={`inline-flex items-center border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${getRoleBadgeColor(user.role)}`}>
                              {user.role?.replace(/_/g, " ") || "UNASSIGNED"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <span className={`inline-flex items-center border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${getStatusBadgeColor(user.status)}`}>
                              {user.status || "UNKNOWN"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsAssignDialogOpen(true);
                                }}
                                className="h-8 w-8 rounded-none border border-[#154279] bg-[#154279] text-white hover:bg-[#10335f]"
                                title="Edit role"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>

                              {user.status === "active" ? (
                                <Button
                                  size="icon"
                                  onClick={() => handleStatusChange(user.id, "inactive")}
                                  className="h-8 w-8 rounded-none border border-[#d96d26] bg-[#F96302] text-white hover:bg-[#e15802]"
                                  title="Suspend"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  size="icon"
                                  onClick={() => handleStatusChange(user.id, "active")}
                                  className="h-8 w-8 rounded-none border border-[#2dae49] bg-[#2dae49] text-white hover:bg-[#24933d]"
                                  title="Activate"
                                >
                                  <Play className="h-3.5 w-3.5" />
                                </Button>
                              )}

                              <Button
                                size="icon"
                                onClick={() => handleDeleteUser(user.id)}
                                className="h-8 w-8 rounded-none border border-[#dc3545] bg-[#dc3545] text-white hover:bg-[#c12c3a]"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </section>

        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-none border border-[#bcc3cd] bg-[#eef1f4] p-0">
            <div className={PANEL_HEADER_CLASS}>Modify Access Role</div>
            <div className="p-4">
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
    fullName: "", email: "", password: "", role: "tenant", technicianCategoryId: "",
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
    if (!formData.email || !formData.fullName.trim()) { toast.error("Missing required fields"); return; }
    if (!formData.password || formData.password.length < 6) { toast.error("Password too short"); return; }
    if (formData.role === 'technician' && !formData.technicianCategoryId) { toast.error("Missing specialty category"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) { toast.error("Invalid email"); return; }

    const [firstName, ...lastNameParts] = formData.fullName.trim().split(/\s+/);
    const lastName = lastNameParts.join(" ") || "User";

    try {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: { first_name: firstName, last_name: lastName, role: formData.role, status: "active" },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user data returned");

      toast.success("Identity instantiated successfully");
      setFormData({ fullName: "", email: "", password: "", role: "tenant", technicianCategoryId: "" });
      onSuccess();
    } catch (error) {
      toast.error(`Creation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Full Name <span className="text-red-500">*</span></Label>
        <Input id="fullName" className={INPUT_CLASS_NAME} placeholder="Jane Doe" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Email Address <span className="text-red-500">*</span></Label>
        <Input id="email" type="email" className={INPUT_CLASS_NAME} placeholder="user@company.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Password <span className="text-red-500">*</span></Label>
        <Input id="password" type="password" className={INPUT_CLASS_NAME} placeholder="Minimum 8 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" className="text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Role</Label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value, technicianCategoryId: "" })}
          className="h-10 w-full rounded-none border-2 border-[#7f8fa3] bg-white px-3 text-[13px] font-semibold text-[#111827] outline-none focus:border-[#3c8dbc]"
        >
          <option value="tenant">TENANT</option>
          <option value="property_manager">PROPERTY MANAGER</option>
          <option value="super_admin">SUPER ADMIN</option>
          <option value="proprietor">PROPRIETOR</option>
          <option value="caretaker">CARETAKER</option>
          <option value="technician">TECHNICIAN</option>
          <option value="accountant">ACCOUNTANT</option>
          <option value="supplier">SUPPLIER</option>
        </select>
      </div>

      {formData.role === 'technician' && (
        <div className="space-y-2 border-l-2 border-l-[#b7c0cb] bg-transparent px-3 py-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-slate-700">Specialty Designation <span className="text-red-500">*</span></Label>
          {loadingCategories ? (
            <div className="text-xs text-slate-500 font-mono mt-2">Fetching matrix data...</div>
          ) : (
            <select
              value={formData.technicianCategoryId}
              onChange={(e) => setFormData({ ...formData, technicianCategoryId: e.target.value })}
              className="mt-2 h-11 w-full rounded-none border-2 border-[#7f8fa3] bg-white px-3 text-[13px] font-semibold text-[#111827] outline-none focus:border-[#3c8dbc]"
            >
              <option value="">SELECT DESIGNATION</option>
              {technicianCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {String(cat.name || "").toUpperCase()}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="pt-2">
        <Button onClick={handleCreateUser} disabled={loading} className="h-10 w-full rounded-none border border-[#3c8dbc] bg-[#3c8dbc] px-4 text-[12px] font-semibold uppercase tracking-wide text-white hover:bg-[#337aa8]">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add User
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
    <div className="space-y-4">
      <div className="flex items-center gap-4 border-l-2 border-l-[#b7c0cb] bg-transparent px-3 py-2">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={`${user.first_name} ${user.last_name}`}
            className="h-12 w-12 rounded-full object-cover border border-[#c4cad3]"
          />
        ) : (
          <div className="h-12 w-12 rounded-full border border-[#c4cad3] bg-white flex items-center justify-center text-[#154279] font-bold">
            {user.first_name?.[0]}{user.last_name?.[0] || <User className="h-5 w-5" />}
          </div>
        )}
        <div className="space-y-1">
          <h4 className="text-sm font-bold uppercase tracking-wide text-[#1f2937]">{user.first_name} {user.last_name}</h4>
          <p className="text-xs font-semibold text-[#5f6b7c]">{user.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newRole" className="text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Target Role</Label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="h-10 rounded-none border-2 border-[#9aa7b7] bg-white text-[13px] font-semibold text-[#111827] shadow-none backdrop-blur-none focus:ring-0 focus:ring-offset-0 focus:border-[#6f7e90]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none border-2 border-[#9aa7b7] bg-white text-[#111827] shadow-lg backdrop-blur-none">
            <SelectItem value="tenant">TENANT</SelectItem>
            <SelectItem value="property_manager">PROPERTY MANAGER</SelectItem>
            <SelectItem value="super_admin">SUPER ADMIN</SelectItem>
            <SelectItem value="proprietor">PROPRIETOR</SelectItem>
            <SelectItem value="caretaker">CARETAKER</SelectItem>
            <SelectItem value="technician">TECHNICIAN</SelectItem>
            <SelectItem value="accountant">ACCOUNTANT</SelectItem>
            <SelectItem value="supplier">SUPPLIER</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pt-2">
        <Button onClick={handleAssign} className="h-10 w-full rounded-none border border-[#154279] bg-[#154279] px-4 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#10335f]">
          Commit Change
        </Button>
      </div>
    </div>
  );
};

export default UserManagementNew;