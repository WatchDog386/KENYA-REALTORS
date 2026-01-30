// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: "admin" | "tenant" | "landlord";
  requireProfile?: boolean;
}

const ProtectedRoute = ({ children, role, requireProfile = true }: ProtectedRouteProps) => {
  const { supabaseUser, isLoading, user, createProfileIfMissing } = useAuth();

  console.log('🔒 ProtectedRoute check:', { 
    hasUser: !!supabaseUser, 
    isLoading,
    currentPath: window.location.pathname,
    userRole: user?.role,
    userEmail: supabaseUser?.email,
    hasProfile: !!user
  });

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!supabaseUser) {
    console.log('❌ Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Check if profile is required
  if (requireProfile && !user) {
    console.log('⚠️ Profile required but not found, attempting to create...');
    
    // Try to create profile automatically
    const createProfile = async () => {
      const created = await createProfileIfMissing();
      if (!created) {
        console.log('❌ Could not create profile, redirecting to /complete-profile');
        return <Navigate to="/complete-profile" replace />;
      }
      // If profile created successfully, continue to check role
    };
    
    // For now, redirect to complete-profile
    console.log('🔄 Redirecting to /complete-profile');
    return <Navigate to="/complete-profile" replace />;
  }

  // Check role-based access
  if (role) {
    // Determine user's actual role
    let userRole = user?.role || 'tenant';
    
    // Special case: fanteskorri36@gmail.com is always admin
    if (supabaseUser.email === 'fanteskorri36@gmail.com') {
      userRole = 'admin';
    }
    
    console.log('🎯 Role check:', {
      requiredRole: role,
      userRole: userRole,
      userEmail: supabaseUser.email
    });

    // If user doesn't have required role, redirect to appropriate dashboard
    if (userRole !== role) {
      console.log(`🔄 User role ${userRole} doesn't match required role ${role}, redirecting...`);
      
      if (userRole === 'admin') {
        return <Navigate to="/portal/admin" replace />;
      } else {
        return <Navigate to="/portal/tenant" replace />;
      }
    }
  }

  // Auto-redirect to appropriate dashboard for generic portal routes
  const currentPath = window.location.pathname;
  if (currentPath === '/portal' || currentPath === '/dashboard') {
    // Determine user's role
    let userRole = user?.role || 'tenant';
    if (supabaseUser.email === 'fanteskorri36@gmail.com') {
      userRole = 'admin';
    }
    
    console.log('🚀 Auto-redirecting from generic route:', {
      currentPath,
      userRole,
      userEmail: supabaseUser.email
    });

    if (userRole === 'admin') {
      return <Navigate to="/portal/admin" replace />;
    } else {
      return <Navigate to="/portal/tenant" replace />;
    }
  }

  // Special case: If admin tries to access tenant dashboard, redirect to admin dashboard
  if (currentPath === '/portal/tenant' && supabaseUser.email === 'fanteskorri36@gmail.com') {
    console.log('🔄 Admin trying to access tenant dashboard, redirecting to admin dashboard');
    return <Navigate to="/portal/admin" replace />;
  }

  // Special case: If tenant tries to access admin dashboard, redirect to tenant dashboard
  if (currentPath === '/portal/admin' && supabaseUser.email !== 'fanteskorri36@gmail.com' && user?.role !== 'admin') {
    console.log('🔄 Non-admin trying to access admin dashboard, redirecting to tenant dashboard');
    return <Navigate to="/portal/tenant" replace />;
  }

  console.log('✅ Access granted to protected route');
  return <>{children}</>;
};

export default ProtectedRoute;