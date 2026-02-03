// src/App.tsx
// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ApprovalProvider } from "@/contexts/ApprovalContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

/* ======================
   PUBLIC PAGES
====================== */
import HomePage from "@/pages/HomePage";
import Features from "@/pages/FeaturesSection";
import Pricing from "@/pages/PricingSection";
import HowItWorks from "@/pages/HowItWorks";
import Testimonials from "@/pages/TestimonialsSection";
import PaymentOptions from "@/pages/PaymentOptionsSection";
import Faq from "@/pages/FaqSection";
import Contact from "@/pages/Contact";

/* ======================
   AUTH PAGES
====================== */
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ResetPassword from "@/pages/ResetPassword";
import RoleSelection from "@/pages/auth/RoleSelection";
import PendingApproval from "@/pages/auth/PendingApproval";
import AuthCallback from "@/pages/AuthCallback";

/* ======================
   USER CREATION PAGES
====================== */
import CreateRealUsers from "@/pages/admin/CreateRealUsers";

/* ======================
   MARKETPLACE PAGES
====================== */
import ListingsPage from "@/pages/marketplace/ListingsPage";
import PropertyDetailsPage from "@/pages/marketplace/PropertyDetailsPage";

/* ======================
   PORTAL PAGES
====================== */
import PortalAdminDashboard from "@/pages/portal/AdminDashboard";
import SuperAdminDashboard from "@/pages/portal/SuperAdminDashboard";
import SuperAdminProfilePage from "@/pages/portal/SuperAdminProfilePage";
import ManagerPortal from "@/pages/portal/ManagerPortal";
import PortalTenantDashboard from "@/pages/portal/TenantDashboard";
import PropertiesManagement from "@/pages/portal/PropertiesManagement";
import LeasesManagement from "@/pages/portal/LeasesManagement";
import PaymentsManagement from "@/pages/portal/PaymentsManagement";
import SettingsManagement from "@/pages/portal/SettingsManagement";
import ProfileManagement from "@/pages/portal/ProfileManagement";
import RefundStatusPage from "@/pages/portal/RefundStatusPage";
import Applications from "@/pages/portal/Applications";

// Tenant portal pages
import TenantPaymentsPageComponent from "@/pages/portal/tenant/Payments";
import TenantMakePaymentPageComponent from "@/pages/portal/tenant/MakePayment";
import TenantMaintenancePageComponent from "@/pages/portal/tenant/Maintenance";
import TenantNewMaintenancePageComponent from "@/pages/portal/tenant/NewMaintenanceRequest";
import TenantMaintenanceDetailPageComponent from "@/pages/portal/tenant/MaintenanceDetail";
import TenantDocumentsPageComponent from "@/pages/portal/tenant/Documents";
import TenantProfilePageComponent from "@/pages/portal/tenant/Profile";
import TenantMessagesPageComponent from "@/pages/portal/tenant/Messages";
import TenantPropertyPageComponent from "@/pages/portal/tenant/Property";
import TenantSupportPageComponent from "@/pages/portal/tenant/Support";
import TenantCalendarPageComponent from "@/pages/portal/tenant/Calendar";
import TenantSettingsPageComponent from "@/pages/portal/tenant/Settings";
import TenantSafetyPageComponent from "@/pages/portal/tenant/Safety";
import TenantHelpPageComponent from "@/pages/portal/tenant/Help";
import TenantRefundStatusPageComponent from "@/pages/portal/tenant/RefundStatus";

// Import Super Admin Context
import { SuperAdminProvider } from "@/contexts/SuperAdminContext";

// Create a fallback component in case of import issues
const ComponentFallback = ({ title }: { title: string }) => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">{title}</h1>
    <p className="text-gray-600">{title} page will appear here.</p>
  </div>
);

/* ======================
   PORTAL COMPONENTS
====================== */
import ApprovalRequests from "@/pages/portal/components/ApprovalRequests";
import DepositRefundTracker from "@/pages/portal/components/DepositRefundTracker";
import ManagerAssignment from "@/pages/portal/components/ManagerAssignment";
import PropertySummaryCard from "@/pages/portal/components/PropertySummaryCard";
import VacationNoticeForm from "@/pages/portal/components/VacationNoticeForm";

/* ======================
   LAYOUTS
====================== */
import PortalLayout from "@/components/layout/PortalLayout";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import ManagerLayout from "@/components/layout/ManagerLayout";
import TenantPortalLayout from "@/components/layout/TenantPortalLayout";
import MainLayout from "@/components/layout/MainLayout";

/* ======================
   SUPER ADMIN PAGES
====================== */
import AnalyticsDashboard from "@/components/portal/super-admin/AnalyticsDashboard";
import ApprovalQueue from "@/components/portal/super-admin/ApprovalQueue";
import PropertyManagementNew from "@/components/portal/super-admin/PropertyManagementNew";
import UserManagementNew from "@/components/portal/super-admin/UserManagementNew";
import SystemSettings from "@/components/portal/super-admin/SystemSettings";
import Reports from "@/components/portal/super-admin/Reports"; // Fixed import name

/* ======================
   SYSTEM
====================== */
import NotFound from "@/pages/NotFound";
import Profile from "./pages/Profile";

/* ======================
   REACT QUERY
====================== */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

/* ======================
   ROLE MAPPING HELPER
====================== */
const mapLegacyRole = (
  role: string | undefined
): "super_admin" | "property_manager" | "tenant" => {
  if (!role) return "tenant";

  switch (role.toLowerCase()) {
    case "admin":
    case "super_admin":
      return "super_admin";
    case "management":
    case "manager":
    case "property_manager":
      return "property_manager";
    case "tenant":
    case "user":
    default:
      return "tenant";
  }
};

/* ======================
   DEV BYPASS GUARD
====================== */
const DevBypassGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, supabaseUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    if (supabaseUser) {
      return <Navigate to="/profile" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/* ======================
   PORTAL REDIRECT BASED ON ROLE
====================== */
const PortalRedirect = () => {
  const { user, supabaseUser, isLoading, getUserRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    if (supabaseUser) {
      return <Navigate to="/profile" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Get user role from AuthContext
  const userRole = getUserRole();

  console.log("PortalRedirect - User:", user.email, "User Role:", userRole, "All user data:", user);

  // Redirect based on role
  switch (userRole) {
    case "super_admin":
      console.log("Redirecting to super admin dashboard");
      return <Navigate to="/portal/super-admin/dashboard" replace />;
    case "property_manager":
      console.log("Redirecting to manager portal");
      return <Navigate to="/portal/manager" replace />;
    case "tenant":
      console.log("Redirecting to tenant portal");
      return <Navigate to="/portal/tenant" replace />;
    case "owner":
      console.log("Redirecting to owner portal");
      return <Navigate to="/portal/owner" replace />;
    default:
      console.log("No role match, redirecting to role selection");
      return <Navigate to="/auth/role-selection" replace />;
  }
};

/* ======================
   ROLE-BASED ROUTE WRAPPER
====================== */
const RoleBasedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: ("super_admin" | "property_manager" | "tenant" | "owner")[];
}) => {
  const { user, supabaseUser, isLoading, getUserRole, isApproved } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    if (supabaseUser) {
      return <Navigate to="/profile" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Check approval
  if (!isApproved()) {
    return <Navigate to="/pending-approval" replace />;
  }

  // Get user role
  const userRole = getUserRole();

  // Check if user has required role
  if (!userRole || !allowedRoles.includes(userRole as any)) {
    // Redirect to appropriate dashboard based on role
    switch (userRole) {
      case "super_admin":
        return <Navigate to="/portal/super-admin/dashboard" replace />;
      case "property_manager":
        return <Navigate to="/portal/manager" replace />;
      case "tenant":
        return <Navigate to="/portal/tenant" replace />;
      case "owner":
        return <Navigate to="/portal/owner" replace />;
      default:
        return <Navigate to="/auth/role-selection" replace />;
    }
  }

  // Apply correct layout based on user role
  const getLayout = () => {
    switch (userRole) {
      case "super_admin":
        return <SuperAdminLayout>{children}</SuperAdminLayout>;
      case "property_manager":
        return <ManagerLayout>{children}</ManagerLayout>;
      case "tenant":
        return <TenantPortalLayout>{children}</TenantPortalLayout>;
      case "owner":
        return <MainLayout>{children}</MainLayout>;
      default:
        return <MainLayout>{children}</MainLayout>;
    }
  };

  return getLayout();
};

/* ======================
   SUPER ADMIN PORTAL WRAPPER
====================== */
const SuperAdminPortalWrapper = () => {
  const { getUserRole, isAdmin, user } = useAuth();

  // Get user role
  const userRole = getUserRole();

  console.log("SuperAdminPortalWrapper - userRole:", userRole, "isAdmin:", isAdmin());

  if (userRole !== "super_admin" && !isAdmin()) {
    // Redirect to appropriate dashboard, NOT back to /portal to avoid loop
    if (userRole === "property_manager") {
      return <Navigate to="/portal/manager" replace />;
    } else if (userRole === "tenant") {
      return <Navigate to="/portal/tenant" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return (
    <DevBypassGuard>
      <SuperAdminProvider>
        <SuperAdminLayout />
      </SuperAdminProvider>
    </DevBypassGuard>
  );
};

/* ======================
   MANAGER PORTAL WRAPPER
====================== */
const ManagerPortalWrapper = () => {
  const { getUserRole } = useAuth();

  const userRole = getUserRole();

  console.log("ManagerPortalWrapper - userRole:", userRole);

  if (userRole !== "property_manager") {
    // Redirect to appropriate dashboard, NOT back to /portal to avoid loop
    if (userRole === "super_admin") {
      return <Navigate to="/portal/super-admin/dashboard" replace />;
    } else if (userRole === "tenant") {
      return <Navigate to="/portal/tenant" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return (
    <DevBypassGuard>
      <ManagerLayout>
        <Outlet />
      </ManagerLayout>
    </DevBypassGuard>
  );
};

/* ======================
   TENANT PORTAL WRAPPER
====================== */
const TenantPortalWrapper = () => {
  const { getUserRole } = useAuth();

  const userRole = getUserRole();

  console.log("TenantPortalWrapper - userRole:", userRole);

  if (userRole !== "tenant") {
    // Redirect to appropriate dashboard, NOT back to /portal to avoid loop
    if (userRole === "super_admin") {
      return <Navigate to="/portal/super-admin/dashboard" replace />;
    } else if (userRole === "property_manager") {
      return <Navigate to="/portal/manager" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return (
    <DevBypassGuard>
      <TenantPortalLayout>
        <Outlet />
      </TenantPortalLayout>
    </DevBypassGuard>
  );
};

/* ======================
   LEGACY ADMIN PORTAL WRAPPER
====================== */
const AdminPortalWrapper = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return <Navigate to="/portal/tenant" replace />;
  }

  return (
    <DevBypassGuard>
      <PortalLayout>
        <Outlet />
      </PortalLayout>
    </DevBypassGuard>
  );
};

/* ======================
   USER CREATION WRAPPER (Only for Super Admins)
====================== */
const UserCreationWrapper = () => {
  const { getUserRole } = useAuth();

  const userRole = getUserRole();

  if (userRole !== "super_admin") {
    return <Navigate to="/portal" replace />;
  }

  return (
    <DevBypassGuard>
      <MainLayout />
    </DevBypassGuard>
  );
};

/* ======================
   TENANT PAGES
====================== */
// Using actual components from tenant pages folder

/* ======================
   MANAGER PAGES
====================== */
const ManagerPropertiesPage = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">My Properties</h1>
    <p className="text-gray-600">Manager properties page will appear here.</p>
  </div>
);

const ManagerTenantsPage = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">Tenant Management</h1>
    <p className="text-gray-600">
      Manager tenant management page will appear here.
    </p>
  </div>
);

const ManagerMaintenancePage = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">Maintenance Requests</h1>
    <p className="text-gray-600">
      Manager maintenance requests page will appear here.
    </p>
  </div>
);

const ManagerReportsPage = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">Reports</h1>
    <p className="text-gray-600">Manager reports page will appear here.</p>
  </div>
);

/* ======================
   COMPONENT DEMO PAGE
====================== */
const ComponentsDemoPage = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">Components Demo</h1>
    <div className="space-y-6">
      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-3">
          Approval Requests Component
        </h2>
        <ApprovalRequests />
      </div>
      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Deposit Refund Tracker</h2>
        <DepositRefundTracker refundId="demo-refund-123" />
      </div>
      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Manager Assignment</h2>
        <ManagerAssignment propertyId="demo-property-123" />
      </div>
      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Vacation Notice Form</h2>
        <VacationNoticeForm leaseId="demo-lease-123" />
      </div>
    </div>
  </div>
);

const App = () => {
  useEffect(() => {
    const checkDatabaseHealth = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.warn("Missing Supabase environment variables");
          return;
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });

        if (response.ok) {
          console.log("✅ Supabase connection OK");
        } else {
          console.warn("❌ Supabase connection check failed:", response.status);
        }
      } catch (err) {
        console.warn("🌐 Network or Supabase connectivity issue:", err);
      }
    };

    checkDatabaseHealth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ApprovalProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />

            <Routes>
                {/* ======================
                    PUBLIC ROUTES
                ====================== */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/testimonials" element={<Testimonials />} />
                  <Route path="/payment-options" element={<PaymentOptions />} />
                  <Route path="/faq" element={<Faq />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/marketplace" element={<ListingsPage />} />
                  <Route path="/complete-profile" element={<Profile />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route
                    path="/marketplace/:id"
                    element={<PropertyDetailsPage />}
                  />
                </Route>

                {/* ======================
                    AUTH ROUTES
                ====================== */}
                <Route
                  path="/auth"
                  element={<Navigate to="/login" replace />}
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/auth/role-selection"
                  element={<RoleSelection />}
                />
                <Route
                  path="/pending-approval"
                  element={<PendingApproval />}
                />
                <Route
                  path="/auth/verify"
                  element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <h1 className="text-2xl font-bold mb-2">
                          Verifying your email...
                        </h1>
                        <p className="text-gray-600">
                          Please wait while we confirm your email address.
                        </p>
                      </div>
                    </div>
                  }
                />

                <Route
                  path="/auth/callback"
                  element={<AuthCallback />}
                />

                {/* ======================
                    USER CREATION ROUTES (Super Admin Only)
                ====================== */}
                <Route
                  path="/admin/create-users"
                  element={<UserCreationWrapper />}
                >
                  <Route index element={<CreateRealUsers />} />
                </Route>

                {/* ======================
                    LEGACY REDIRECTS
                ====================== */}
                <Route
                  path="/dashboard"
                  element={<Navigate to="/portal" replace />}
                />
                <Route
                  path="/profile"
                  element={<Navigate to="/portal/profile" replace />}
                />
                <Route
                  path="/applications"
                  element={<Navigate to="/portal/applications" replace />}
                />
                <Route
                  path="/properties"
                  element={<Navigate to="/portal/properties" replace />}
                />
                <Route
                  path="/post-rental"
                  element={<Navigate to="/portal/properties" replace />}
                />
                <Route
                  path="/pay-rent"
                  element={<Navigate to="/portal/payments" replace />}
                />
                <Route
                  path="/admin-dashboard"
                  element={<Navigate to="/portal/admin" replace />}
                />

                {/* ======================
                    PORTAL ROUTES
                ====================== */}

                {/* Root Portal → Redirect based on role */}
                <Route path="/portal" element={<PortalRedirect />} />

                {/* SUPER ADMIN PORTAL ROUTES */}
                <Route
                  path="/portal/super-admin"
                  element={<SuperAdminPortalWrapper />}
                >
                  <Route
                    index
                    element={
                      <Navigate to="/portal/super-admin/dashboard" replace />
                    }
                  />
                  <Route path="dashboard" element={<SuperAdminDashboard />} />
                  <Route path="properties" element={<PropertyManagementNew />} />
                  <Route path="users" element={<UserManagementNew />} />
                  <Route path="approvals" element={<ApprovalQueue />} />
                  <Route path="analytics" element={<AnalyticsDashboard />} />
                  <Route path="settings" element={<SystemSettings />} />
                  <Route path="reports" element={<Reports />} /> {/* ADDED THIS LINE */}
                  <Route path="leases" element={<LeasesManagement />} />
                  <Route path="payments" element={<PaymentsManagement />} />
                  <Route path="profile" element={<SuperAdminProfilePage />} />
                  <Route path="refunds" element={<RefundStatusPage />} />
                  <Route path="applications" element={<Applications />} />
                  <Route
                    path="create-users"
                    element={<Navigate to="/admin/create-users" replace />}
                  />

                  {/* Property Management */}
                  <Route
                    path="properties/add"
                    element={<ComponentFallback title="Add Property" />}
                  />
                  <Route
                    path="properties/:id"
                    element={<ComponentFallback title="Property Details" />}
                  />
                  <Route
                    path="properties/:id/edit"
                    element={<ComponentFallback title="Edit Property" />}
                  />

                  {/* User Management */}
                  <Route
                    path="users/add"
                    element={<ComponentFallback title="Add User" />}
                  />
                  <Route
                    path="users/:id"
                    element={<ComponentFallback title="User Details" />}
                  />
                  <Route
                    path="users/:id/edit"
                    element={<ComponentFallback title="Edit User" />}
                  />
                </Route>

                {/* MANAGER PORTAL ROUTES */}
                <Route
                  path="/portal/manager"
                  element={<ManagerPortalWrapper />}
                >
                  <Route index element={<ManagerPortal />} />
                  <Route
                    path="properties"
                    element={<ManagerPropertiesPage />}
                  />
                  <Route path="tenants" element={<ManagerTenantsPage />} />
                  <Route
                    path="maintenance"
                    element={<ManagerMaintenancePage />}
                  />
                  <Route path="reports" element={<ManagerReportsPage />} />
                  <Route
                    path="approval-requests"
                    element={<ApprovalRequests />}
                  />
                  <Route
                    path="vacation-notices"
                    element={
                      <div className="p-8">
                        <h1 className="text-3xl font-bold mb-6">
                          Vacation Notices
                        </h1>
                        <p className="text-gray-600">
                          Manage tenant vacation notices.
                        </p>
                      </div>
                    }
                  />
                </Route>

                {/* TENANT PORTAL ROUTES */}
                <Route path="/portal/tenant" element={<TenantPortalWrapper />}>
                  <Route index element={<PortalTenantDashboard />} />
                  <Route path="payments" element={<TenantPaymentsPageComponent />} />
                  <Route path="payments/make" element={<TenantMakePaymentPageComponent />} />
                  <Route
                    path="maintenance"
                    element={<TenantMaintenancePageComponent />}
                  />
                  <Route
                    path="maintenance/new"
                    element={<TenantNewMaintenancePageComponent />}
                  />
                  <Route
                    path="maintenance/:id"
                    element={<TenantMaintenanceDetailPageComponent />}
                  />
                  <Route path="documents" element={<TenantDocumentsPageComponent />} />
                  <Route path="property" element={<TenantPropertyPageComponent />} />
                  <Route path="profile" element={<TenantProfilePageComponent />} />
                  <Route path="messages" element={<TenantMessagesPageComponent />} />
                  <Route path="calendar" element={<TenantCalendarPageComponent />} />
                  <Route path="settings" element={<TenantSettingsPageComponent />} />
                  <Route path="safety" element={<TenantSafetyPageComponent />} />
                  <Route path="help" element={<TenantHelpPageComponent />} />
                  <Route path="support" element={<TenantSupportPageComponent />} />
                  <Route
                    path="refund-status"
                    element={<TenantRefundStatusPageComponent />}
                  />
                  <Route
                    path="refund-status/:id"
                    element={<TenantRefundStatusPageComponent />}
                  />
                  <Route
                    path="vacation-notice"
                    element={<VacationNoticeForm leaseId="current" />}
                  />
                </Route>

                {/* LEGACY ADMIN PORTAL ROUTES */}
                <Route path="/portal/admin" element={<AdminPortalWrapper />}>
                  <Route index element={<PortalAdminDashboard />} />
                  <Route
                    path="analytics"
                    element={
                      <div className="p-8">
                        <h1 className="text-3xl font-bold mb-6">Analytics</h1>
                        <p className="text-gray-600">
                          Analytics dashboard will appear here.
                        </p>
                      </div>
                    }
                  />
                  <Route
                    path="database"
                    element={
                      <div className="p-8">
                        <h1 className="text-3xl font-bold mb-6">
                          Database Management
                        </h1>
                        <p className="text-gray-600">
                          Database management tools will appear here.
                        </p>
                      </div>
                    }
                  />
                  <Route
                    path="admin-tools"
                    element={
                      <div className="p-8">
                        <h1 className="text-3xl font-bold mb-6">Admin Tools</h1>
                        <p className="text-gray-600">
                          Administrative tools will appear here.
                        </p>
                      </div>
                    }
                  />
                  <Route
                    path="tenants"
                    element={
                      <div className="p-8">
                        <h1 className="text-3xl font-bold mb-6">
                          Tenant Management
                        </h1>
                        <p className="text-gray-600">
                          Manage all tenants and their profiles.
                        </p>
                      </div>
                    }
                  />
                  <Route
                    path="reports"
                    element={
                      <div className="p-8">
                        <h1 className="text-3xl font-bold mb-6">Reports</h1>
                        <p className="text-gray-600">
                          Generate and view system reports.
                        </p>
                      </div>
                    }
                  />
                </Route>

                {/* SHARED PORTAL PAGES */}
                <Route
                  path="/portal/properties"
                  element={
                    <RoleBasedRoute
                      allowedRoles={[
                        "super_admin",
                        "property_manager",
                        "tenant",
                      ]}
                    >
                      <PropertiesManagement />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/portal/leases"
                  element={
                    <RoleBasedRoute
                      allowedRoles={[
                        "super_admin",
                        "property_manager",
                        "tenant",
                      ]}
                    >
                      <LeasesManagement />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/portal/payments"
                  element={
                    <RoleBasedRoute
                      allowedRoles={[
                        "super_admin",
                        "property_manager",
                        "tenant",
                      ]}
                    >
                      <PaymentsManagement />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/portal/settings"
                  element={
                    <RoleBasedRoute
                      allowedRoles={[
                        "super_admin",
                        "property_manager",
                        "tenant",
                      ]}
                    >
                      <SettingsManagement />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/portal/profile"
                  element={
                    <RoleBasedRoute
                      allowedRoles={[
                        "super_admin",
                        "property_manager",
                        "tenant",
                      ]}
                    >
                      <ProfileManagement />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/portal/applications"
                  element={
                    <RoleBasedRoute
                      allowedRoles={[
                        "super_admin",
                        "property_manager",
                        "tenant",
                      ]}
                    >
                      <Applications />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/portal/refund-status"
                  element={
                    <RoleBasedRoute
                      allowedRoles={[
                        "super_admin",
                        "property_manager",
                        "tenant",
                      ]}
                    >
                      <RefundStatusPage />
                    </RoleBasedRoute>
                  }
                />

                {/* COMPONENTS DEMO ROUTE */}
                <Route
                  path="/portal/components-demo"
                  element={
                    <DevBypassGuard>
                      <div className="p-8">
                        <ComponentsDemoPage />
                      </div>
                    </DevBypassGuard>
                  }
                />

                {/* ======================
                    PROFILE RECOVERY
                ====================== */}
                <Route
                  path="/profile-recovery"
                  element={
                    <DevBypassGuard>
                      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
                        <div className="text-center">
                          <h1 className="text-3xl font-bold mb-4">
                            Account Setup Required
                          </h1>
                          <p className="text-gray-600">
                            Please complete your profile setup to continue.
                          </p>
                        </div>
                      </div>
                    </DevBypassGuard>
                  }
                />

                {/* ======================
                    DATABASE SETUP
                ====================== */}
                <Route
                  path="/admin/database-setup"
                  element={
                    <RoleBasedRoute allowedRoles={["super_admin"]}>
                      <div className="min-h-screen bg-gray-50 p-8">
                        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl p-8">
                          <h1 className="text-3xl font-bold mb-6">
                            Database Setup (Dev Mode)
                          </h1>
                          <button
                            onClick={async () => {
                              try {
                                const { setupDatabase } = await import(
                                  "@/services/databaseSetup"
                                );
                                const result = await setupDatabase();
                                alert(
                                  `Setup result: ${
                                    result.success ? "Success ✅" : "Failed ❌"
                                  }\n${result.error || ""}`
                                );
                              } catch (error) {
                                alert("Failed to load database setup module");
                              }
                            }}
                            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                          >
                            Run Database Setup
                          </button>
                        </div>
                      </div>
                    </RoleBasedRoute>
                  }
                />

                {/* ======================
                    404 PAGE
                ====================== */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </ApprovalProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;