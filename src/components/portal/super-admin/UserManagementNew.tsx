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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [unassignedUsers, setUnassignedUsers] = useState<User[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
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
  const [activeTab, setActiveTab] = useState("unassigned");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Load all users from profiles table - NO FILTERING AT DATABASE LEVEL
      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      const typedUsers: User[] = (allUsers || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name || "",
        last_name: u.last_name || "",
        phone: u.phone,
        role: u.role,
        status: u.status,
        created_at: u.created_at,
        last_login_at: u.last_login_at,
        avatar_url: u.avatar_url,
      }));

      console.log("📊 Total users loaded:", typedUsers.length);
      console.log("📋 User details:", typedUsers);

      setUsers(typedUsers);

      // Separate unassigned and assigned users
      // Unassigned: role is 'tenant', null, or status is 'pending' (newly created)
      const unassigned = typedUsers.filter(
        (u) => 
          u.role === "tenant" || 
          u.role === null || 
          !u.role ||
          u.status === "pending"
      );
      
      // Assigned: Has a specific role (not tenant/null) and status is active
      const assigned = typedUsers.filter(
        (u) =>
          u.role &&
          u.role !== "tenant" &&
          u.role !== null &&
          (u.role === "super_admin" ||
            u.role === "property_manager" ||
            u.role === "accountant" ||
            u.role === "maintenance" ||
            u.role === "owner")
      );

      console.log("👥 Unassigned users:", unassigned.length, unassigned);
      console.log("✅ Assigned users:", assigned.length, assigned);

      setUnassignedUsers(unassigned);
      setAssignedUsers(assigned);

      // Calculate stats
      const superAdminCount = typedUsers.filter(
        (u) => u.role === "super_admin"
      ).length;
      const propertyManagerCount = typedUsers.filter(
        (u) => u.role === "property_manager"
      ).length;
      const tenantCount = typedUsers.filter((u) => u.role === "tenant").length;

      setStats({
        totalUsers: typedUsers.length,
        unassignedUsers: unassigned.length,
        assignedUsers: assigned.length,
        superAdmins: superAdminCount,
        propertyManagers: propertyManagerCount,
        tenants: tenantCount,
      });
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole, status: "active" })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`User role updated to ${newRole}`);
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

      {/* Users Tabs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Accounts</CardTitle>
            <CardDescription>
              Manage user accounts and role assignments
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
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="unassigned">
                Unassigned ({stats.unassignedUsers})
              </TabsTrigger>
              <TabsTrigger value="assigned">
                Assigned ({stats.assignedUsers})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unassigned" className="space-y-4">
              {unassignedUsers.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No unassigned users. All users have been assigned roles.
                  </AlertDescription>
                </Alert>
              ) : (
                <UserTable
                  users={unassignedUsers}
                  onSelectUser={(user) => {
                    setSelectedUser(user);
                    setIsAssignDialogOpen(true);
                  }}
                  onDeleteUser={handleDeleteUser}
                  onStatusChange={handleStatusChange}
                  showAssignButton={true}
                />
              )}
            </TabsContent>

            <TabsContent value="assigned" className="space-y-4">
              {assignedUsers.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No assigned users yet. Assign roles to unassigned users.
                  </AlertDescription>
                </Alert>
              ) : (
                <UserTable
                  users={assignedUsers}
                  onSelectUser={(user) => {
                    setSelectedUser(user);
                    setIsAssignDialogOpen(true);
                  }}
                  onDeleteUser={handleDeleteUser}
                  onStatusChange={handleStatusChange}
                  showAssignButton={true}
                />
              )}
            </TabsContent>
          </Tabs>
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
              onAssignRole={(role) => {
                handleAssignRole(selectedUser.id, role);
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
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
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

      // Create auth user with trimmed, lowercase email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Use the secure database function to create profile (bypasses RLS)
      const { data: functionResult, error: functionError } = await supabase.rpc(
        "create_user_profile",
        {
          p_user_id: authData.user.id,
          p_email: trimmedEmail,
          p_first_name: formData.firstName.trim(),
          p_last_name: formData.lastName.trim(),
          p_phone: formData.phone?.trim() || null,
          p_role: formData.role,
          p_status: "active",
        }
      );

      if (functionError) {
        console.error("Function error:", functionError);
        throw new Error(`Failed to create profile: ${functionError.message}`);
      }

      if (functionResult && functionResult.length > 0 && !functionResult[0].success) {
        throw new Error(functionResult[0].message);
      }

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
  onAssignRole: (role: string) => void;
}

const AssignRoleForm: React.FC<AssignRoleFormProps> = ({
  user,
  onAssignRole,
}) => {
  const [selectedRole, setSelectedRole] = useState(user.role || "tenant");

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Current Role:</strong> {user.role || "None"}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          <strong>Email:</strong> {user.email}
        </p>
      </div>

      <div>
        <Label htmlFor="newRole">Assign New Role *</Label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
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

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Assigning a new role will grant the user access to that role's
          features and data.
        </AlertDescription>
      </Alert>

      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button onClick={() => onAssignRole(selectedRole)}>
          Assign Role
        </Button>
      </DialogFooter>
    </div>
  );
};

export default UserManagementNew;
