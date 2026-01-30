// src/components/portal/super-admin/UserManagement.tsx
import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  UserCog,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MoreVertical,
  Lock,
  Unlock,
  Key,
  AlertCircle,
  Building,
  Wrench,
  Calculator,
  RefreshCw,
  User,
  Home,
  MapPin,
  Bed,
  Calendar,
  Briefcase,
  FileText,
  DollarSign
} from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { useUserManagement } from "@/hooks/useUserManagement";
import { toast } from "sonner";
import { formatDate } from "@/utils/dateHelpers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserManagementProps {
  onUserSelect?: (userId: string) => void;
  onRoleChange?: (userId: string, newRole: string) => void;
  onUserCreated?: (user: any) => void;
  onRefreshRequested?: () => void;
}

// Define user interface based on your database schema
interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  role: string;
  status: string;
  avatar_url?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_by?: string;
}

// User type for role assignment
type UserRoleType = 'property_manager' | 'tenant' | 'other';

const UserManagement: React.FC<UserManagementProps> = ({
  onUserSelect,
  onRoleChange,
  onUserCreated,
  onRefreshRequested,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isAssignRoleDialogOpen, setIsAssignRoleDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [dbError, setDbError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userRoleType, setUserRoleType] = useState<UserRoleType>('tenant');
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]); // Users available for role assignment
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]); // Users already assigned roles
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false); // New: Toggle to show unassigned users
  const [showLoggedInOnly, setShowLoggedInOnly] = useState(true); // Toggle to show only users who have logged in (default on)

  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    propertyManagers: 0,
    tenants: 0,
    maintenance: 0,
    accountants: 0,
    unassignedUsers: 0,
    loggedInUsers: 0,
  });

  const {
    users,
    loading,
    fetchUsers,
    fetchLoggedInUsers,
    exportUsersToCSV,
    updateUser,
    deleteUser,
    suspendUser,
    activateUser,
    updateUserRole,
    searchUsers,
    getUsersByType,
  } = useUserManagement();

  // Role assignment form state
  const [roleAssignment, setRoleAssignment] = useState({
    license_number: "",
    experience_years: 0,
    specializations: [] as string[],
    
    // Tenant specific fields
    property_id: "",
    unit_id: "",
    identity_document_type: "",
    identity_document_number: "",
    employment_status: "",
    employer_name: "",
    monthly_income: 0,
    emergency_contact_email: "",
    move_in_date: "",
    lease_start_date: "",
    lease_end_date: "",
  });

  // Edit user form state
  const [editUser, setEditUser] = useState({
    id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "",
    status: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  // Load initial data
  useEffect(() => {
    loadData();
    loadProperties();
  }, []);

  // Load properties for tenant assignment
  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, property_name, address, city")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  };

  // Load units when property is selected
  useEffect(() => {
    if (selectedPropertyId) {
      loadUnitsForProperty(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const loadUnitsForProperty = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from("units")
        .select("id, unit_number, unit_type, rent_amount, status, bedrooms, bathrooms")
        .eq("property_id", propertyId)
        .eq("status", "vacant")
        .order("unit_number");

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error("Error loading units:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
      if (onRefreshRequested) {
        onRefreshRequested();
      }
      toast.success("Users list refreshed");
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadData = async () => {
    // Default to loading users who have logged in
    await fetchLoggedInUsers();
    await loadAvailableUsers();
    await loadStats();
  };

  // FIXED: Load all users, not just tenants
  const loadAvailableUsers = async () => {
    try {
      // Get ALL users from profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const allUsers = data || [];
      
      // Separate assigned vs unassigned users
      const assigned = allUsers.filter(user => 
        user.role && user.role !== 'tenant' && user.role !== 'unassigned'
      );
      
      const unassigned = allUsers.filter(user => 
        !user.role || user.role === 'tenant' || user.role === 'unassigned'
      );

      setAssignedUsers(assigned);
      setAvailableUsers(unassigned);
    } catch (error) {
      console.error("Error loading available users:", error);
    }
  };

  const loadStats = async () => {
    try {
      const { count: totalUsers, error: totalError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: activeUsers, error: activeError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: propertyManagers, error: pmError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "property_manager");

      const { count: tenants, error: tenantsError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "tenant");

      const { count: maintenance, error: maintError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "maintenance");

      const { count: accountants, error: accError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "accountant");

      // Count unassigned users (users with no specific role)
      const { count: unassignedUsers, error: unassignedError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .or('role.is.null,role.eq.tenant,role.eq.unassigned');

      // Count users who have logged in (last_login_at IS NOT NULL)
      const { count: loggedInUsers, error: loggedInError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .not('last_login_at', 'is', null);

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        propertyManagers: propertyManagers || 0,
        tenants: tenants || 0,
        maintenance: maintenance || 0,
        accountants: accountants || 0,
        unassignedUsers: unassignedUsers || 0,
        loggedInUsers: loggedInUsers || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchUsers(searchQuery);
    } else {
      await fetchUsers();
    }
  };

  // Combine assigned and available users for display
  let allDisplayUsers = [] as User[];

  if (showLoggedInOnly) {
    // Use the hook's `users` list and filter to those with a last_login_at
    allDisplayUsers = (users || []).filter(u => !!u.last_login_at);
  } else {
    allDisplayUsers = showUnassignedOnly ? availableUsers : [...assignedUsers, ...availableUsers];
  }

  const filteredUsers = allDisplayUsers.filter((user) => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (statusFilter !== "all" && user.status !== statusFilter) return false;
    return true;
  });

  // Handle user role type change
  const handleUserRoleTypeChange = (type: UserRoleType) => {
    setUserRoleType(type);
  };

  // Handle assign role to existing user - now creates approval requests
  const handleAssignRole = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    // Validate specific fields based on role type
    if (userRoleType === 'tenant') {
      if (!roleAssignment.property_id || !roleAssignment.unit_id) {
        toast.error("Please select a property and unit for the tenant");
        return;
      }
    }

    try {
      setDbError(null);
      
      const role = userRoleType === 'property_manager' ? 'property_manager' : 
                   userRoleType === 'tenant' ? 'tenant' : 
                   editUser.role || 'tenant';

      const selectedUser = availableUsers.find(u => u.id === selectedUserId);
      
      // Get current authenticated user for requested_by field
      const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
      
      // Create approval request based on role type
      if (userRoleType === 'property_manager') {
        // Create manager assignment approval request
        await supabase
          .from('approval_queue')
          .insert({
            requested_by: currentAuthUser?.id || selectedUserId,
            request_type: 'manager_assignment',
            request_id: selectedUserId,
            status: 'pending',
            metadata: {
              user_id: selectedUserId,
              license_number: roleAssignment.license_number,
              experience_years: roleAssignment.experience_years,
              specializations: roleAssignment.specializations,
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      } else if (userRoleType === 'tenant') {
        // Create tenant addition approval request
        await supabase
          .from('approval_queue')
          .insert({
            requested_by: currentAuthUser?.id || selectedUserId,
            request_type: 'tenant_addition',
            request_id: selectedUserId,
            status: 'pending',
            metadata: {
              user_id: selectedUserId,
              property_id: roleAssignment.property_id,
              unit_id: roleAssignment.unit_id,
              move_in_date: roleAssignment.move_in_date,
              lease_start_date: roleAssignment.lease_start_date,
              lease_end_date: roleAssignment.lease_end_date,
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      toast.success("Role assignment request submitted for approval", {
        description: `${selectedUser?.first_name || selectedUser?.email} role change pending super admin approval`
      });
      
      await loadData();
      
      if (onRefreshRequested) {
        onRefreshRequested();
      }
      
      setIsAssignRoleDialogOpen(false);
      resetRoleAssignmentForm();
    } catch (error: any) {
      console.error("Assign role error:", error);
      toast.error(`Failed to submit role assignment: ${error.message}`);
    }
  };

  // Create property manager record for existing user
  const createPropertyManagerRecord = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('property_managers')
        .insert({
          user_id: userId,
          license_number: roleAssignment.license_number || null,
          experience_years: roleAssignment.experience_years || 0,
          specializations: roleAssignment.specializations,
          is_available: true,
          assigned_properties_count: 0,
          performance_rating: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // If record already exists, update it
        if (error.code === '23505') {
          const { data: updatedData, error: updateError } = await supabase
            .from('property_managers')
            .update({
              license_number: roleAssignment.license_number || null,
              experience_years: roleAssignment.experience_years || 0,
              specializations: roleAssignment.specializations,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .select()
            .single();

          if (updateError) throw updateError;
          return updatedData;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Error creating property manager record:", error);
      throw error;
    }
  };

  // Create tenant record for existing user
  const createTenantRecord = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          user_id: userId,
          property_id: roleAssignment.property_id || null,
          unit_id: roleAssignment.unit_id || null,
          status: 'active',
          identity_document_type: roleAssignment.identity_document_type || null,
          identity_document_number: roleAssignment.identity_document_number || null,
          employment_status: roleAssignment.employment_status || null,
          employer_name: roleAssignment.employer_name || null,
          monthly_income: roleAssignment.monthly_income || null,
          emergency_contact_email: roleAssignment.emergency_contact_email || null,
          move_in_date: roleAssignment.move_in_date ? new Date(roleAssignment.move_in_date).toISOString() : null,
          lease_start_date: roleAssignment.lease_start_date ? new Date(roleAssignment.lease_start_date).toISOString() : null,
          lease_end_date: roleAssignment.lease_end_date ? new Date(roleAssignment.lease_end_date).toISOString() : null,
          identity_verified: false,
          preferred_contact_method: 'email',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // If record already exists, update it
        if (error.code === '23505') {
          const { data: updatedData, error: updateError } = await supabase
            .from('tenants')
            .update({
              property_id: roleAssignment.property_id || null,
              unit_id: roleAssignment.unit_id || null,
              identity_document_type: roleAssignment.identity_document_type || null,
              identity_document_number: roleAssignment.identity_document_number || null,
              employment_status: roleAssignment.employment_status || null,
              employer_name: roleAssignment.employer_name || null,
              monthly_income: roleAssignment.monthly_income || null,
              emergency_contact_email: roleAssignment.emergency_contact_email || null,
              move_in_date: roleAssignment.move_in_date ? new Date(roleAssignment.move_in_date).toISOString() : null,
              lease_start_date: roleAssignment.lease_start_date ? new Date(roleAssignment.lease_start_date).toISOString() : null,
              lease_end_date: roleAssignment.lease_end_date ? new Date(roleAssignment.lease_end_date).toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .select()
            .single();

          if (updateError) throw updateError;
          
          // Update unit status if unit changed
          if (roleAssignment.unit_id) {
            await supabase
              .from('units')
              .update({ status: 'occupied' })
              .eq('id', roleAssignment.unit_id);
          }
          
          return updatedData;
        }
        throw error;
      }
      
      // Update unit status to occupied
      if (roleAssignment.unit_id) {
        await supabase
          .from('units')
          .update({ status: 'occupied' })
          .eq('id', roleAssignment.unit_id);
      }

      return data;
    } catch (error) {
      console.error("Error creating tenant record:", error);
      throw error;
    }
  };

  // Reset role assignment form
  const resetRoleAssignmentForm = () => {
    setRoleAssignment({
      license_number: "",
      experience_years: 0,
      specializations: [],
      property_id: "",
      unit_id: "",
      identity_document_type: "",
      identity_document_number: "",
      employment_status: "",
      employer_name: "",
      monthly_income: 0,
      emergency_contact_email: "",
      move_in_date: "",
      lease_start_date: "",
      lease_end_date: "",
    });
    setSelectedPropertyId('');
    setSelectedUnitId('');
    setSelectedUserId('');
    setUserRoleType('tenant');
  };

  const handleEditUser = async () => {
    try {
      const updatedUser = await updateUser(editUser.id, {
        first_name: editUser.first_name,
        last_name: editUser.last_name,
        phone: editUser.phone,
        role: editUser.role as 'property_manager' | 'tenant' | 'maintenance' | 'accountant' | 'super_admin' | 'unassigned',
        status: editUser.status as 'active' | 'inactive' | 'suspended' | 'pending',
        emergency_contact_name: editUser.emergency_contact_name,
        emergency_contact_phone: editUser.emergency_contact_phone,
      });
      
      if (updatedUser) {
        toast.success("User updated successfully");
        
        if (editUser.role === 'property_manager' && onRefreshRequested) {
          onRefreshRequested();
        }
        
        setIsEditUserDialogOpen(false);
        await loadData();
      }
    } catch (error: any) {
      toast.error(`Failed to update user: ${error.message}`);
    }
  };

  const handleSuspendUser = async () => {
    if (!userToSuspend || !suspensionReason.trim()) {
      toast.error("Please provide a suspension reason");
      return;
    }

    try {
      await suspendUser(userToSuspend, suspensionReason);
      toast.success("User suspended successfully");
      setIsSuspendDialogOpen(false);
      setSuspensionReason("");
      setUserToSuspend(null);
      await loadData();
    } catch (error: any) {
      toast.error(`Failed to suspend user: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteUser(userId);
      toast.success("User deleted successfully");
      await loadData();
    } catch (error: any) {
      toast.error(`Failed to delete user: ${error.message}`);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success("User role updated successfully");

      if (onRoleChange) {
        onRoleChange(userId, newRole);
      }
      
      if (newRole === 'property_manager' && onRefreshRequested) {
        onRefreshRequested();
      }
      
      await loadData();
    } catch (error: any) {
      toast.error(`Failed to update user role: ${error.message}`);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.status === "active") {
      setUserToSuspend(user.id);
      setIsSuspendDialogOpen(true);
    } else {
      try {
        await activateUser(user.id);
        toast.success("User activated successfully");
        await loadData();
      } catch (error: any) {
        toast.error(`Failed to activate user: ${error.message}`);
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "property_manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "tenant":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "maintenance":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "accountant":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "unassigned":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Shield className="h-3 w-3" />;
      case "property_manager":
        return <Building className="h-3 w-3" />;
      case "maintenance":
        return <Wrench className="h-3 w-3" />;
      case "accountant":
        return <Calculator className="h-3 w-3" />;
      case "tenant":
        return <UserCog className="h-3 w-3" />;
      case "unassigned":
        return <User className="h-3 w-3" />;
      default:
        return <UserCog className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const openEditDialog = (user: User) => {
    setEditUser({
      id: user.id,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email,
      phone: user.phone || "",
      role: user.role || "unassigned",
      status: user.status || "active",
      emergency_contact_name: user.emergency_contact_name || "",
      emergency_contact_phone: user.emergency_contact_phone || "",
    });
    setIsEditUserDialogOpen(true);
  };

  const handleExportUsers = async () => {
    try {
      let data: User[] = [];
      
      if (filteredUsers.length > 0) {
        data = filteredUsers;
      } else {
        const { data: usersData, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        data = usersData || [];
      }

      const csv = convertToCSV(data);
      downloadCSV(csv, `users_export_${new Date().toISOString().split('T')[0]}.csv`);

      toast.success(`${data.length} users exported successfully`);
    } catch (error: any) {
      console.error("Error exporting users:", error);
      toast.error(`Failed to export users: ${error.message}`);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return "";

    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Created At', 'Last Login'];
    const csvRows = [
      headers.join(','),
      ...data.map((row) => {
        const values = [
          `"${(row.first_name || '') + ' ' + (row.last_name || '')}"`,
          `"${row.email || ''}"`,
          `"${row.phone || ''}"`,
          `"${row.role || ''}"`,
          `"${row.status || ''}"`,
          `"${new Date(row.created_at).toLocaleDateString()}"`,
          `"${row.last_login_at ? new Date(row.last_login_at).toLocaleDateString() : 'Never'}"`
        ];
        return values.join(',');
      })
    ];

    return csvRows.join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Get unit type display name
  const getUnitTypeDisplay = (unitType: string) => {
    switch (unitType) {
      case 'studio':
        return 'Studio';
      case '1br':
        return '1 Bedroom';
      case '2br':
        return '2 Bedrooms';
      case '3br':
        return '3 Bedrooms';
      case '4br':
        return '4 Bedrooms';
      case 'commercial':
        return 'Commercial';
      default:
        return unitType;
    }
  };

  // Get selected user name
  const getSelectedUserName = () => {
    const user = availableUsers.find(u => u.id === selectedUserId);
    return user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : '';
  };

  return (
    <div className="space-y-6 font-nunito">
      {/* Database Error Alert */}
      {dbError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Database connection error: {dbError}. Please check your Supabase configuration.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all users and assign roles to existing users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog
            open={isAssignRoleDialogOpen}
            onOpenChange={setIsAssignRoleDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Assign Role to User</DialogTitle>
                <DialogDescription>
                  Select an existing user and assign them a specific role.
                </DialogDescription>
              </DialogHeader>
              
              {/* User Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="select-user">Select User <span className="text-red-500">*</span></Label>
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user">
                        {selectedUserId ? getSelectedUserName() : "Select a user"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                              {user.first_name ? user.first_name[0] : user.email[0]}
                            </div>
                            <div>
                              <div className="font-medium">
                                {user.first_name && user.last_name
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.full_name || user.email}
                              </div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                              <div className="text-xs text-gray-400">
                                {user.role ? `Current role: ${user.role}` : 'Unassigned'}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Type Selection */}
                <div className="space-y-2">
                  <Label>Role Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={userRoleType === 'tenant' ? "secondary" : "outline"}
                      onClick={() => handleUserRoleTypeChange('tenant')}
                      className="flex-1"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Tenant
                    </Button>
                    <Button
                      type="button"
                      variant={userRoleType === 'property_manager' ? "secondary" : "outline"}
                      onClick={() => handleUserRoleTypeChange('property_manager')}
                      className="flex-1"
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Property Manager
                    </Button>
                    <Button
                      type="button"
                      variant={userRoleType === 'other' ? "secondary" : "outline"}
                      onClick={() => handleUserRoleTypeChange('other')}
                      className="flex-1"
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Other Role
                    </Button>
                  </div>
                </div>

                {/* Tenant Specific Fields */}
                {userRoleType === 'tenant' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-medium">Tenant Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="property_id">Property <span className="text-red-500">*</span></Label>
                        <Select
                          value={selectedPropertyId}
                          onValueChange={(value) => {
                            setSelectedPropertyId(value);
                            setRoleAssignment({ ...roleAssignment, property_id: value });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select property" />
                          </SelectTrigger>
                          <SelectContent>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{property.property_name || property.name}</span>
                                  <span className="text-xs text-gray-500">{property.address}, {property.city}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="unit_id">Unit <span className="text-red-500">*</span></Label>
                        <Select
                          value={selectedUnitId}
                          onValueChange={(value) => {
                            setSelectedUnitId(value);
                            setRoleAssignment({ ...roleAssignment, unit_id: value });
                          }}
                          disabled={!selectedPropertyId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">Unit {unit.unit_number}</span>
                                  <span className="text-xs text-gray-500">
                                    {getUnitTypeDisplay(unit.unit_type)} • Ksh {unit.rent_amount}/month
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="identity_document_type">
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            ID Type
                          </div>
                        </Label>
                        <Select
                          value={roleAssignment.identity_document_type}
                          onValueChange={(value) =>
                            setRoleAssignment({ ...roleAssignment, identity_document_type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="national_id">National ID</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="driving_license">Driving License</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="identity_document_number">ID Number</Label>
                        <Input
                          id="identity_document_number"
                          value={roleAssignment.identity_document_number}
                          onChange={(e) =>
                            setRoleAssignment({ ...roleAssignment, identity_document_number: e.target.value })
                          }
                          placeholder="ID number"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employment_status">
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            Employment Status
                          </div>
                        </Label>
                        <Select
                          value={roleAssignment.employment_status}
                          onValueChange={(value) =>
                            setRoleAssignment({ ...roleAssignment, employment_status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employed">Employed</SelectItem>
                            <SelectItem value="self_employed">Self Employed</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                            <SelectItem value="unemployed">Unemployed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="monthly_income">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Monthly Income (Ksh)
                          </div>
                        </Label>
                        <Input
                          id="monthly_income"
                          type="number"
                          value={roleAssignment.monthly_income}
                          onChange={(e) =>
                            setRoleAssignment({ ...roleAssignment, monthly_income: Number(e.target.value) })
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="move_in_date">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Move-in Date
                          </div>
                        </Label>
                        <Input
                          id="move_in_date"
                          type="date"
                          value={roleAssignment.move_in_date}
                          onChange={(e) =>
                            setRoleAssignment({ ...roleAssignment, move_in_date: e.target.value })
                          }
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_email">Emergency Contact Email</Label>
                        <Input
                          id="emergency_contact_email"
                          type="email"
                          value={roleAssignment.emergency_contact_email}
                          onChange={(e) =>
                            setRoleAssignment({ ...roleAssignment, emergency_contact_email: e.target.value })
                          }
                          placeholder="emergency@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lease_start_date">Lease Start Date</Label>
                        <Input
                          id="lease_start_date"
                          type="date"
                          value={roleAssignment.lease_start_date}
                          onChange={(e) =>
                            setRoleAssignment({ ...roleAssignment, lease_start_date: e.target.value })
                          }
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lease_end_date">Lease End Date</Label>
                        <Input
                          id="lease_end_date"
                          type="date"
                          value={roleAssignment.lease_end_date}
                          onChange={(e) =>
                            setRoleAssignment({ ...roleAssignment, lease_end_date: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Property Manager Specific Fields */}
                {userRoleType === 'property_manager' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-medium">Property Manager Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="license_number">License Number</Label>
                        <Input
                          id="license_number"
                          value={roleAssignment.license_number}
                          onChange={(e) =>
                            setRoleAssignment({ ...roleAssignment, license_number: e.target.value })
                          }
                          placeholder="PM-12345"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="experience_years">Experience (Years)</Label>
                        <Input
                          id="experience_years"
                          type="number"
                          value={roleAssignment.experience_years}
                          onChange={(e) =>
                            setRoleAssignment({ ...roleAssignment, experience_years: Number(e.target.value) })
                          }
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="specializations">Specializations (comma separated)</Label>
                      <Input
                        id="specializations"
                        value={roleAssignment.specializations.join(', ')}
                        onChange={(e) =>
                          setRoleAssignment({ 
                            ...roleAssignment, 
                            specializations: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                          })
                        }
                        placeholder="Residential, Commercial, Luxury"
                      />
                    </div>
                  </div>
                )}

                {/* For 'other' user type or additional roles */}
                {userRoleType === 'other' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-medium">Role Selection</h3>
                    <div className="space-y-2">
                      <Label htmlFor="role">User Role</Label>
                      <Select
                        value={editUser.role}
                        onValueChange={(value: any) =>
                          setEditUser({ ...editUser, role: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintenance">Maintenance Staff</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="tenant">Tenant</SelectItem>
                          <SelectItem value="property_manager">Property Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Information Notice */}
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    Note: The user will receive a password reset email if they haven't logged in before, 
                    or they can use their existing credentials.
                  </AlertDescription>
                </Alert>
              </div>
              
              <DialogFooter className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAssignRoleDialogOpen(false);
                    setDbError(null);
                    resetRoleAssignmentForm();
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="secondary"
                  onClick={handleAssignRole}
                  disabled={loading || !selectedUserId}
                >
                  {loading ? "Assigning..." : "Assign Role"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Users</CardTitle>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              {allDisplayUsers.length} loaded in list
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Users</CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900">{stats.activeUsers}</div>
            <p className="text-xs text-gray-500 mt-1 font-medium">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Managers</CardTitle>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900">{stats.propertyManagers}</div>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              {assignedUsers.filter(u => u.role === "property_manager").length} in list
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Unassigned</CardTitle>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <User className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900">{stats.unassignedUsers}</div>
            <p className="text-xs text-gray-500 mt-1 font-medium">Available for role assignment</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Logged In</CardTitle>
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
              <UserCog className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900">{stats.loggedInUsers}</div>
            <p className="text-xs text-gray-500 mt-1 font-medium">Users with at least one login</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Role Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-100 bg-green-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-green-700">Tenants</CardTitle>
            <div className="p-1 px-2 bg-white rounded text-[10px] font-bold text-green-700 shadow-sm border border-green-100">RESIDENTS</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-green-800">{stats.tenants}</div>
              <span className="text-xs font-semibold text-green-600">Active Residents</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 bg-orange-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-orange-700">Maintenance</CardTitle>
            <div className="p-1 px-2 bg-white rounded text-[10px] font-bold text-orange-700 shadow-sm border border-orange-100">STAFF</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-orange-800">{stats.maintenance}</div>
              <span className="text-xs font-semibold text-orange-600">Technicians</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-purple-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-700">Accountants</CardTitle>
            <div className="p-1 px-2 bg-white rounded text-[10px] font-bold text-purple-700 shadow-sm border border-purple-100">FINANCE</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-purple-800">{stats.accountants}</div>
              <span className="text-xs font-semibold text-purple-600">Finance Team</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="rounded-xl border border-gray-100 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">User Directory</CardTitle>
              <CardDescription className="text-sm text-gray-500 font-medium mt-1">
                Displaying <span className="text-gray-900 font-bold">{filteredUsers.length}</span> user{filteredUsers.length !== 1 ? 's' : ''} 
                {showLoggedInOnly ? ' (active log-ins)' : showUnassignedOnly ? ' (unassigned only)' : ' (total directory)'}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-navy transition-colors" />
                <Input
                  type="search"
                  placeholder="Search by name, email, phone..."
                  className="pl-10 w-full sm:w-[260px] bg-white border-gray-200 focus:border-navy focus:ring-navy/20 rounded-lg transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] bg-white border-gray-200 rounded-lg">
                    <Filter className="h-3.5 w-3.5 mr-2 text-gray-500" />
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="tenant">Tenants</SelectItem>
                    <SelectItem value="property_manager">Property Mgrs</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="accountant">Accountants</SelectItem>
                    <SelectItem value="super_admin">Super Admins</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] bg-white border-gray-200 rounded-lg">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="h-8 w-px bg-gray-200 hidden sm:block mx-1"></div>

              <div className="flex gap-2">
                <Button
                  variant={showUnassignedOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowUnassignedOnly(!showUnassignedOnly)}
                  className={`border-gray-200 rounded-lg ${showUnassignedOnly ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  <User className="h-3.5 w-3.5 mr-2" />
                  Unassigned
                </Button>

                <Button
                  variant={showLoggedInOnly ? "default" : "outline"}
                  size="sm"
                  onClick={async () => {
                    setShowLoggedInOnly(!showLoggedInOnly);
                    try {
                      if (!showLoggedInOnly) {
                        // Turn on: fetch logged-in users
                        await fetchLoggedInUsers();
                      } else {
                        // Turn off: reload normal users
                        await fetchUsers();
                        await loadAvailableUsers();
                      }
                    } catch (err) {
                      console.error('Error toggling logged-in filter:', err);
                    }
                  }}
                  className={`border-gray-200 rounded-lg ${showLoggedInOnly ? 'bg-navy hover:bg-navy/90 text-white border-navy' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-2" />
                  Active Users
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-gray-100">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-gray-100">
                  <TableHead className="py-4 pl-6 text-xs font-bold uppercase tracking-wider text-gray-500 w-[300px]">User Profile</TableHead>
                  <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Contact Details</TableHead>
                  <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Role</TableHead>
                  <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</TableHead>
                  <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Last Login</TableHead>
                  <TableHead className="py-4 pr-6 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 mr-2 animate-spin" />
                        Loading users...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className={`border-gray-100 transition-colors hover:bg-gray-50/80 ${!user.role || user.role === 'tenant' || user.role === 'unassigned' ? 'bg-gray-50/30' : ''}`}>
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm border ${
                             user.role === 'property_manager' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                             user.role === 'super_admin' ? 'bg-red-100 text-red-600 border-red-200' :
                             user.role === 'maintenance' ? 'bg-orange-100 text-orange-600 border-orange-200' :
                             user.role === 'accountant' ? 'bg-purple-100 text-purple-600 border-purple-200' :
                             'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name || user.email}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-black">{user.first_name ? user.first_name[0] : user.email[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              {user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user.full_name || user.email}
                              {(!user.role || user.role === 'tenant' || user.role === 'unassigned') && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal text-gray-400 border-gray-200 bg-white">
                                  Unassigned
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Added {formatDate(user.created_at)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            {user.email}
                          </div>
                          {user.phone ? (
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              {user.phone}
                            </div>
                          ) : (
                             <div className="text-xs text-gray-300 italic pl-5.5">No phone number</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold tracking-wide uppercase shadow-sm ${getRoleColor(user.role || 'unassigned')}`}>
                          <span className="flex items-center gap-1.5">
                            {getRoleIcon(user.role || 'unassigned')}
                            {user.role ? user.role.replace('_', ' ') : 'Unassigned'}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className={`px-2.5 py-0.5 border text-[11px] font-bold tracking-wide uppercase ${getStatusColor(user.status || 'active')}`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            user.status === 'active' ? 'bg-green-500' :
                            user.status === 'suspended' ? 'bg-red-500' :
                            user.status === 'pending' ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`}></div>
                          {user.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className={`text-sm font-medium ${user.last_login_at ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                          {user.last_login_at
                            ? formatDate(user.last_login_at)
                            : 'Never logged in'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4 pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 data-[state=open]:bg-gray-100">
                              <MoreVertical className="h-4 w-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-gray-100 p-1">
                            <DropdownMenuLabel className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 py-1.5">User Actions</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => openEditDialog(user)} className="rounded-lg text-sm font-medium text-gray-700 focus:bg-gray-50 focus:text-gray-900 cursor-pointer p-2">
                              <Edit className="h-4 w-4 mr-2 text-blue-500" />
                              Edit Profile
                            </DropdownMenuItem>
                            
                            {(!user.role || user.role === 'tenant' || user.role === 'unassigned') && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUserId(user.id);
                                  setIsAssignRoleDialogOpen(true);
                                }}
                                className="rounded-lg text-sm font-medium text-gray-700 focus:bg-gray-50 focus:text-gray-900 cursor-pointer p-2"
                              >
                                <UserPlus className="h-4 w-4 mr-2 text-emerald-500" />
                                Assign Role
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(user)}
                              className="rounded-lg text-sm font-medium text-gray-700 focus:bg-gray-50 focus:text-gray-900 cursor-pointer p-2"
                            >
                              {user.status === "active" ? (
                                <>
                                  <Lock className="h-4 w-4 mr-2 text-amber-500" />
                                  Suspend User
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-4 w-4 mr-2 text-green-500" />
                                  Activate User
                                </>
                              )}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator className="bg-gray-100 my-1" />
                            
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              className="rounded-lg text-sm font-medium text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer p-2"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Suspension Dialog */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Please provide a reason for suspending this user. The user will not be able to log in until reactivated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suspensionReason">Suspension Reason</Label>
              <Textarea
                id="suspensionReason"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter the reason for suspension..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspendUser}>
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-first_name">First Name</Label>
                <Input
                  id="edit-first_name"
                  value={editUser.first_name}
                  onChange={(e) =>
                    setEditUser({ ...editUser, first_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last_name">Last Name</Label>
                <Input
                  id="edit-last_name"
                  value={editUser.last_name}
                  onChange={(e) =>
                    setEditUser({ ...editUser, last_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUser.email}
                onChange={(e) =>
                  setEditUser({ ...editUser, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editUser.phone}
                onChange={(e) =>
                  setEditUser({ ...editUser, phone: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(value) =>
                    setEditUser({ ...editUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="property_manager">Property Manager</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editUser.status}
                  onValueChange={(value) =>
                    setEditUser({ ...editUser, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;