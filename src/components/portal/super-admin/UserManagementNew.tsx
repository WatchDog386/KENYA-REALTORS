// src/components/portal/super-admin/UserManagementNew.tsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  User,
  Shield,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { userSyncService } from "@/services/api/userSyncService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    // Apply search and role filters
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
        // Show all users with pending status (not approved)
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

      // Step 1: Verify sync status between auth.users and profiles
      const syncStatus = await userSyncService.verifySync();
      console.log("🔄 Sync status:", syncStatus);


      // Step 2: Fetch all users from the all_users_with_profile view (ensures all auth.users are included)
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

      console.log("📊 Total users loaded from profiles table:", typedUsers.length);
      console.log("📋 All users (synced from auth.users):", typedUsers);

      setUsers(typedUsers);
      setFilteredUsers(typedUsers);

      // Step 3: Calculate stats from fetched users
      const superAdminCount = typedUsers.filter(
        (u) => u.role === "super_admin"
      ).length;
      const propertyManagerCount = typedUsers.filter(
        (u) => u.role === "property_manager"
      ).length;
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

      console.log("✅ User stats calculated:", {
        totalUsers: typedUsers.length,
        superAdmins: superAdminCount,
        propertyManagers: propertyManagerCount,
        tenants: tenantCount,
        unassigned: noRoleCount,
      });

      if (syncStatus.synced && syncStatus.profilesCount > 0) {
        toast.success(`Loaded ${typedUsers.length} users from profiles table`);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error(
        `Failed to load users: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (
    userId: string, 
    newRole: string,
    managedProperties?: string[],
    propertyId?: string,
    unitId?: string
  ) => {
    try {
      // Update profile with new role and set to active using userSyncService
      await userSyncService.updateUserRole(userId, newRole, "active");

      // Also update the profile for additional fields
      const currentUser = await supabase.auth.getUser();
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          status: "active",
          is_active: true,
          approved_at: new Date().toISOString(),
          approved_by: currentUser.data.user?.id,
          user_type: newRole, // Sync user_type with role
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Update manager_approvals if property manager
      if (newRole === "property_manager") {
        const { error: approvalError } = await supabase
          .from("manager_approvals")
          .update({ 
            status: "approved",
            reviewed_at: new Date().toISOString(),
            reviewed_by: currentUser.data.user?.id,
            managed_properties: managedProperties || [],
          })
          .eq("user_id", userId);
        
        if (approvalError) {
          console.warn("Manager approval update warning:", approvalError.message);
        }
      }

      // Update tenant_approvals if tenant
      if (newRole === "tenant") {
        const { error: approvalError } = await supabase
          .from("tenant_approvals")
          .update({ 
            status: "approved",
            reviewed_at: new Date().toISOString(),
            reviewed_by: currentUser.data.user?.id,
            property_id: propertyId || null,
            unit_id: unitId || null,
          })
          .eq("user_id", userId);
        
        if (approvalError) {
          console.warn("Tenant approval update warning:", approvalError.message);
        }

        // Update unit status to occupied if unit is assigned
        if (unitId) {
          const { error: unitError } = await supabase
            .from("units_detailed")
            .update({
              status: "occupied",
              occupant_id: userId,
            })
            .eq("id", unitId);
          
          if (unitError) {
            console.warn("Unit status update warning:", unitError.message);
          }
        }
      }

      // Send notification to user
      const user = users.find(u => u.id === userId);
      if (user) {
        let message = `Your ${newRole === "property_manager" ? "Property Manager" : "Tenant"} account has been approved. `;
        if (newRole === "property_manager" && managedProperties?.length) {
          message += "You can now manage your assigned properties and access your portal.";
        } else if (newRole === "tenant" && unitId) {
          message += "You can now access your assigned unit and portal.";
        } else {
          message += "You can now login and access your portal.";
        }

        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            recipient_id: userId,
            type: "approval_granted",
            title: "Registration Approved! 🎉",
            message,
          });
        
        if (notifError) {
          console.warn("Notification creation warning:", notifError.message);
        }
      }

      toast.success(`User approved as ${newRole}. They can now login!`);
      loadUsers();
      setIsAssignDialogOpen(false);
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Failed to assign role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00356B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            User Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Manage users, assign roles, and control access permissions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account and optionally assign a role
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">All accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unassignedUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.superAdmins}</div>
            <p className="text-xs text-gray-500 mt-1">System admins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Property Mgrs
            </CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.propertyManagers}</div>
            <p className="text-xs text-gray-500 mt-1">Property managers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants</CardTitle>
            <User className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tenants}</div>
            <p className="text-xs text-gray-500 mt-1">Active tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedUsers}</div>
            <p className="text-xs text-gray-500 mt-1">With roles assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All User Accounts</CardTitle>
            <CardDescription>
              Manage all signed-up users and assign roles ({stats.totalUsers} total)
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="pending-approval">⏳ Pending Approval</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="property_manager">Property Manager</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="no-role">No Role</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {users.length === 0
                  ? "No users found. Create users to get started."
                  : "No users match your search filters."}
              </AlertDescription>
            </Alert>
          ) : (
            <UserTable
              users={filteredUsers}
              onSelectUser={(user) => {
                setSelectedUser(user);
                setIsAssignDialogOpen(true);
              }}
              onDeleteUser={handleDeleteUser}
              onStatusChange={handleStatusChange}
              showAssignButton={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Assign a role to <strong>{selectedUser.first_name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <AssignRoleForm
              user={selectedUser}
              onAssignRole={(role, properties, propertyId, unitId) => {
                handleAssignRole(selectedUser.id, role, properties, propertyId, unitId);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// User Table Component
interface UserTableProps {
  users: User[];
  onSelectUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onStatusChange: (userId: string, status: string) => void;
  showAssignButton?: boolean;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onSelectUser,
  onDeleteUser,
  onStatusChange,
  showAssignButton = false,
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.first_name} {user.last_name}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-gray-400" />
                  {user.email}
                </div>
              </TableCell>
              <TableCell>
                {user.phone ? (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-gray-400" />
                    {user.phone}
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell>
                {user.role ? (
                  <Badge variant="outline">{user.role}</Badge>
                ) : (
                  <Badge variant="secondary">None</Badge>
                )}
              </TableCell>
              <TableCell>
                <Select
                  defaultValue={user.status || "active"}
                  onValueChange={(value) => onStatusChange(user.id, value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">
                      ⏳ Pending
                    </SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {showAssignButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectUser(user)}
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteUser(user.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = formData.email.trim().toLowerCase();
    
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create user in Supabase Auth
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

      // Step 2: Wait for the user to be synced to the profiles table (polling)
      let profileSynced = false;
      let attempts = 0;
      const maxAttempts = 10;
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
      while (!profileSynced && attempts < maxAttempts) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", authData.user.id)
          .single();
        if (profile && profile.id) {
          profileSynced = true;
        } else {
          await delay(500); // wait 0.5s before next check
          attempts++;
        }
      }
      if (!profileSynced) {
        throw new Error("Profile was not synced after registration. Please try again.");
      }

      toast.success("User created and synced successfully");
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
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+254..."
          value={formData.phone}
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 6 characters"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="role">Initial Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value) =>
            setFormData({ ...formData, role: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tenant">Tenant</SelectItem>
            <SelectItem value="property_manager">Property Manager</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="accountant">Accountant</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button onClick={handleCreateUser} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create User
        </Button>
      </DialogFooter>
    </div>
  );
};

// Assign Role Form Component
interface AssignRoleFormProps {
  user: User;
  onAssignRole: (role: string, properties?: string[], propertyId?: string, unitId?: string) => void;
}

interface Property {
  id: string;
  name: string;
  address?: string;
}

interface Unit {
  id: string;
  unit_number: string;
  unit_type: string;
  floor_number: number;
  price_monthly: number;
  property_id: string;
  status: string;
}

const AssignRoleForm: React.FC<AssignRoleFormProps> = ({
  user,
  onAssignRole,
}) => {
  const [selectedRole, setSelectedRole] = useState(user.role || "tenant");
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [loadingData, setLoadingData] = useState(false);

  // Fetch properties on mount
  React.useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoadingData(true);
        const { data, error } = await supabase
          .from("properties")
          .select("id, name, address")
          .eq("status", "active")
          .order("name");
        
        if (error) throw error;
        setProperties(data || []);
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast.error("Failed to load properties");
      } finally {
        setLoadingData(false);
      }
    };

    fetchProperties();
  }, []);

  // Fetch units when property is selected
  React.useEffect(() => {
    if (!selectedProperty) {
      setUnits([]);
      return;
    }

    const fetchUnits = async () => {
      try {
        setLoadingData(true);
        const { data, error } = await supabase
          .from("units_detailed")
          .select("*")
          .eq("property_id", selectedProperty)
          .eq("status", "vacant")
          .order("unit_number");
        
        if (error) throw error;
        setUnits(data || []);
        setSelectedUnit(""); // Reset unit selection
      } catch (error) {
        console.error("Error fetching units:", error);
        toast.error("Failed to load units");
      } finally {
        setLoadingData(false);
      }
    };

    fetchUnits();
  }, [selectedProperty]);

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-3 rounded-lg space-y-2">
        <p className="text-sm text-gray-600">
          <strong>Name:</strong> {user.first_name} {user.last_name}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Email:</strong> {user.email}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Current Role:</strong> {user.role || <span className="text-orange-600 font-bold">No Role Assigned</span>}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Status:</strong> 
          {user.status === "pending" ? (
            <span className="text-orange-600 font-bold ml-1">⏳ Pending Approval</span>
          ) : (
            <span className="text-green-600 font-bold ml-1">✓ Active</span>
          )}
        </p>
      </div>

      <div>
        <Label htmlFor="newRole">Assign Role & Approve *</Label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tenant">✓ Tenant</SelectItem>
            <SelectItem value="property_manager">✓ Property Manager</SelectItem>
            <SelectItem value="super_admin">✓ Super Admin</SelectItem>
            <SelectItem value="accountant">✓ Accountant</SelectItem>
            <SelectItem value="maintenance">✓ Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property Manager Assignment */}
      {selectedRole === "property_manager" && (
        <div className="space-y-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <Label className="text-sm font-bold">Assign Properties (Manager)</Label>
          <p className="text-xs text-gray-600 mb-2">Select properties this manager will oversee:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {loadingData ? (
              <p className="text-xs text-gray-500">Loading properties...</p>
            ) : properties.length === 0 ? (
              <p className="text-xs text-gray-500">No properties available</p>
            ) : (
              properties.map((prop) => (
                <label key={prop.id} className="flex items-center gap-2 p-2 bg-white rounded border border-purple-200 hover:border-purple-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProperties.includes(prop.id)}
                    onChange={() => handlePropertyToggle(prop.id)}
                    className="rounded accent-purple-600"
                  />
                  <span className="text-sm">{prop.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tenant Unit Assignment */}
      {selectedRole === "tenant" && (
        <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Label className="text-sm font-bold">Assign Unit (Tenant)</Label>
          
          <div>
            <Label className="text-xs">Select Property</Label>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Choose property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProperty && (
            <div>
              <Label className="text-xs">Select Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={loadingData ? "Loading units..." : "Choose unit"} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      Unit {unit.unit_number} - {unit.unit_type} (${unit.price_monthly}/mo)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Approval Action:</strong> Selecting a role {selectedRole === "property_manager" && selectedProperties.length > 0 ? "and properties" : ""}{selectedRole === "tenant" && selectedUnit ? "and unit" : ""} will automatically approve this user and activate their account. They will receive a notification and can login immediately.
        </AlertDescription>
      </Alert>

      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button 
          onClick={() => onAssignRole(selectedRole, selectedProperties, selectedProperty, selectedUnit)} 
          className="bg-green-600 hover:bg-green-700"
        >
          ✓ Approve & Assign
        </Button>
      </DialogFooter>
    </div>
  );
};

export default UserManagementNew;
