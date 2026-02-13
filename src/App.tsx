// src/App.tsx
// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/user.types";
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
import ApplicationForm from "@/pages/ApplicationForm";

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
import RentalApplications from "@/components/portal/RentalApplications";

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
import TenantVacancyNoticePageComponent from "@/pages/portal/tenant/VacancyNotice";

// Import Super Admin Context
import { SuperAdminProvider } from "@/contexts/SuperAdminContext";

// Manager portal components
import ManagerDashboard from "@/components/portal/manager/ManagerDashboard";
import ManagerTenants from "@/components/portal/manager/ManagerTenants";
import ManagerMaintenance from "@/components/portal/manager/ManagerMaintenance";
import ManagerPayments from "@/components/portal/manager/ManagerPayments";
import ManagerVacancyNotices from "@/components/portal/manager/ManagerVacancyNotices";
import ManagerSettings from "@/components/portal/manager/ManagerSettings";
import ManagerMessages from "@/components/portal/manager/ManagerMessages";
import ManagerUnits from "@/components/portal/manager/ManagerUnits";
import ManagerRentCollection from "@/components/portal/manager/ManagerRentCollection";
import ManagerApplications from "@/components/portal/manager/ManagerApplications";
import ManagerDeposits from "@/components/portal/manager/ManagerDeposits";
import ManagerLeases from "@/components/portal/manager/ManagerLeases";
import ManagerProfile from "@/components/portal/manager/ManagerProfile";
import ManagerApprovalRequests from "@/pages/portal/manager/ApprovalRequests";

// Create a fallback component in case of import issues
const GlobalLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300">
    <div className="relative flex flex-col items-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-full absolute border-4 border-solid border-gray-200 dark:border-gray-700"></div>
        <div className="w-16 h-16 rounded-full animate-spin absolute border-4 border-solid border-indigo-600 border-t-transparent shadow-[0_0_15px_rgba(79,70,229,0.3)]"></div>
      </div>
      <p className="mt-8 text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">Loading resources...</p>
    </div>
  </div>
);

const ComponentFallback = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-500">
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-700 max-w-md w-full relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative z-10">
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-4">{title}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">The {title} interface is currently under development. Check back soon for updates.</p>
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
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
import AccountantLayout from "@/components/layout/AccountantLayout";
import ProprietorLayout from "@/components/layout/ProprietorLayout";
import CaretakerLayout from "@/components/layout/CaretakerLayout";
import TechnicianLayout from "@/components/layout/TechnicianLayout";

/* ======================
   SUPER ADMIN PAGES
====================== */
import AnalyticsDashboard from "@/components/portal/super-admin/AnalyticsDashboard";
import ApprovalQueue from "@/components/portal/super-admin/ApprovalQueue";
import PropertyManager from "@/components/portal/super-admin/PropertyManager";
import UserManagementNew from "@/components/portal/super-admin/UserManagementNew";
import SystemSettings from "@/components/portal/super-admin/SystemSettings";
import Reports from "@/components/portal/super-admin/Reports"; // Fixed import name

/* ======================
   NEW ROLE DASHBOARDS
====================== */
import AccountingDashboard from "@/components/portal/accountant/AccountingDashboard";
import AccountantTenants from "@/pages/portal/accountant/AccountantTenants";
import AccountantInvoices from "@/pages/portal/accountant/AccountantInvoices";
import AccountantReceipts from "@/pages/portal/accountant/AccountantReceipts";
import AccountantPayments from "@/pages/portal/accountant/AccountantPayments";
import TechnicianDashboard from "@/components/portal/technician/TechnicianDashboard";
import TechnicianJobs from "@/components/portal/technician/TechnicianJobs";
import TechnicianSchedule from "@/components/portal/technician/TechnicianSchedule";
import TechnicianEarnings from "@/components/portal/technician/TechnicianEarnings";
import TechnicianProfile from "@/components/portal/technician/TechnicianProfile";

import ProprietorDashboard from "@/components/portal/proprietor/ProprietorDashboard";
import CaretakerDashboard from "@/components/portal/caretaker/CaretakerDashboard";
import CaretakerMaintenance from "@/components/portal/caretaker/CaretakerMaintenance";
import CaretakerProperty from "@/components/portal/caretaker/CaretakerProperty";
import CaretakerReports from "@/components/portal/caretaker/CaretakerReports";
import CaretakerMessages from "@/components/portal/caretaker/CaretakerMessages";

import ProprietorProperties from "@/pages/portal/proprietor/ProprietorProperties";
import ProprietorReports from "@/pages/portal/proprietor/ProprietorReports";
import ProprietorMessages from "@/pages/portal/proprietor/ProprietorMessages";
import ProprietorDocuments from "@/pages/portal/proprietor/ProprietorDocuments";

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
    return <GlobalLoader />;
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
    return <GlobalLoader />;
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
    case "accountant":
      console.log("Redirecting to accountant portal");
      return <Navigate to="/portal/accountant" replace />;
    case "technician":
      console.log("Redirecting to technician portal");
      return <Navigate to="/portal/technician" replace />;
    case "proprietor":
      console.log("Redirecting to proprietor portal");
      return <Navigate to="/portal/proprietor" replace />;
    case "caretaker":
      console.log("Redirecting to caretaker portal");
      return <Navigate to="/portal/caretaker" replace />;
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
  allowedRoles: UserRole[];
}) => {
  const { user, supabaseUser, isLoading, getUserRole } = useAuth();

  if (isLoading) {
    return <GlobalLoader />;
  }

  if (!user) {
    if (supabaseUser) {
      return <Navigate to="/profile" replace />;
    }
    return <Navigate to="/login" replace />;
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
      case "accountant":
        return <Navigate to="/portal/accountant" replace />;
      case "technician":
        return <Navigate to="/portal/technician" replace />;
      case "proprietor":
        return <Navigate to="/portal/proprietor" replace />;
      case "caretaker":
        return <Navigate to="/portal/caretaker" replace />;
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
      case "accountant":
      case "proprietor":
      case "technician":
      case "caretaker":
        return <>{children}</>;
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
const ManagerTenantsPage = () => <ManagerTenants />;
const ManagerMaintenancePage = () => <ManagerMaintenance />;


/* ======================
   COMPONENT DEMO PAGE
====================== */
const ComponentsDemoPage = () => (
  <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="mb-10">
      <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-3 drop-shadow-sm">Components Gallery</h1>
      <p className="text-gray-500 dark:text-gray-400 text-lg">Interactive showcase of system UI components and modules</p>
    </div>
    
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
        <div className="flex items-center mb-6">
            <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-4 shadow-lg shadow-blue-500/30"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Approval Requests</h2>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <ApprovalRequests />
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
        <div className="flex items-center mb-6">
            <div className="w-1.5 h-8 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full mr-4 shadow-lg shadow-emerald-500/30"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Deposit Refund Tracker</h2>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <DepositRefundTracker refundId="demo-refund-123" />
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
        <div className="flex items-center mb-6">
            <div className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-4 shadow-lg shadow-purple-500/30"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Manager Assignment</h2>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <ManagerAssignment propertyId="demo-property-123" />
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
        <div className="flex items-center mb-6">
            <div className="w-1.5 h-8 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full mr-4 shadow-lg shadow-amber-500/30"></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Vacation Notice Form</h2>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
           <VacationNoticeForm leaseId="demo-lease-123" />
        </div>
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
                  <Route path="/applications" element={<ApplicationForm />} />
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
                    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                      <div className="text-center animate-in fade-in zoom-in duration-500">
                        <div className="bg-white/90 dark:bg-gray-800/90 p-10 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-sm mx-auto backdrop-blur-md">
                          <div className="relative mx-auto mb-8 w-16 h-16">
                             <div className="w-16 h-16 rounded-full absolute border-4 border-solid border-gray-200 dark:border-gray-700"></div>
                             <div className="w-16 h-16 rounded-full animate-spin absolute border-4 border-solid border-indigo-600 border-t-transparent shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
                          </div>
                          <h1 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            Verifying Account
                          </h1>
                          <p className="text-gray-500 dark:text-gray-400">
                            We're confirming your email address. This will just take a moment...
                          </p>
                        </div>
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
                  <Route path="properties" element={<PropertyManager />} />
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
                  <Route path="rental-applications" element={<RentalApplications />} />
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
                    element={<ManagerUnits />}
                  />
                  <Route
                    path="properties/:id"
                    element={<ManagerUnits />}
                  />
                  <Route path="properties/units" element={<ManagerUnits />} />
                  <Route path="tenants" element={<ManagerTenantsPage />} />
                  <Route path="tenants/applications" element={<ManagerApplications />} />
                  <Route
                    path="maintenance"
                    element={<ManagerMaintenancePage />}
                  />
                  <Route path="payments" element={<ManagerRentCollection />} />
                  <Route path="payments/deposits" element={<ManagerDeposits />} />
                  <Route path="leases" element={<ManagerLeases />} />
                  <Route path="messages" element={<ManagerMessages />} />
                  <Route path="profile" element={<ManagerProfile />} />
                  <Route
                    path="approval-requests"
                    element={<ManagerApprovalRequests />}
                  />
                  <Route
                    path="vacation-notices"
                    element={<ManagerVacancyNotices />}
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
                    element={<TenantVacancyNoticePageComponent />}
                  />
                </Route>

                {/* NEW ROLE PORTALS */}
                <Route
                  path="/portal/accountant"
                  element={
                    <RoleBasedRoute allowedRoles={["accountant", "super_admin"]}>
                       <AccountantLayout />
                    </RoleBasedRoute>
                  }
                >
                  <Route index element={<AccountingDashboard />} />
                  <Route path="tenants" element={<AccountantTenants />} />
                  <Route path="invoices" element={<AccountantInvoices />} />
                  <Route path="receipts" element={<AccountantReceipts />} />
                  <Route path="payments" element={<AccountantPayments />} />
                </Route>
                <Route
                  path="/portal/technician"
                  element={
                    <RoleBasedRoute allowedRoles={["technician", "super_admin"]}>
                       <TechnicianLayout />
                    </RoleBasedRoute>
                  }
                >
                  <Route index element={<TechnicianDashboard />} />
                  <Route path="jobs" element={<TechnicianJobs />} />
                  <Route path="schedule" element={<TechnicianSchedule />} />
                  <Route path="earnings" element={<TechnicianEarnings />} />
                  <Route path="profile" element={<TechnicianProfile />} />
                </Route>
                <Route
                  path="/portal/proprietor"
                  element={
                    <RoleBasedRoute allowedRoles={["proprietor", "super_admin"]}>
                       <ProprietorLayout />
                    </RoleBasedRoute>
                  }
                >
                  <Route index element={<ProprietorDashboard />} />
                  <Route path="properties" element={<ProprietorProperties />} />
                  <Route path="reports" element={<ProprietorReports />} />
                  <Route path="messages" element={<ProprietorMessages />} />
                  <Route path="documents" element={<ProprietorDocuments />} />
                </Route>
                <Route
                  path="/portal/caretaker"
                  element={
                    <RoleBasedRoute allowedRoles={["caretaker", "super_admin"]}>
                       <CaretakerLayout />
                    </RoleBasedRoute>
                  }
                >
                  <Route index element={<CaretakerDashboard />} />
                  <Route path="maintenance" element={<CaretakerMaintenance />} />
                  <Route path="property" element={<CaretakerProperty />} />
                  <Route path="reports" element={<CaretakerReports />} />
                  <Route path="messages" element={<CaretakerMessages />} />
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
                      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-md w-full mx-auto text-center animate-in fade-in zoom-in duration-500">
                            <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>
                                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">Profile Incomplete</h1>
                                <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                    Your account requires additional setup before you can proceed. Please complete your profile to access the platform.
                                </p>
                                <button onClick={() => window.location.href='/profile'} className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02]">
                                    Complete Setup
                                </button>
                            </div>
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
                       <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 p-8 flex items-center justify-center">
                        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 shadow-2xl rounded-3xl p-10 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-500">
                          <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 hover:rotate-6 transition-transform">
                                <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                </svg>
                            </div>
                            <h1 className="text-4xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                                System Initialization
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                Initialize database schema and seed default data.
                            </p>
                          </div>
                          
                          <div className="space-y-4">
                             <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/30 flex items-start">
                                <svg className="w-6 h-6 text-amber-500 mt-0.5 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    This operation will reset system configurations and may affect existing data. Proceed with caution.
                                </p>
                             </div>
                             
                             <button
                                onClick={async () => {
                                  try {
                                    const { setupDatabase } = await import(
                                      "@/services/databaseSetup"
                                    );
                                    const result = await setupDatabase();
                                    alert(
                                      `Setup result: ${
                                        result.success ? "success" : "failed"
                                      }\n${result.error || "Database configured successfully."}`
                                    );
                                  } catch (error) {
                                    alert("Failed to load database setup module");
                                  }
                                }}
                                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 text-lg flex items-center justify-center"
                              >
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Execute Setup Sequence
                              </button>
                          </div>
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