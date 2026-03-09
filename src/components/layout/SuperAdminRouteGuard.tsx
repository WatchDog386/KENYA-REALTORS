// src/components/layout/SuperAdminRouteGuard.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface SuperAdminRouteGuardProps {
  children: React.ReactNode;
}

const SuperAdminRouteGuard: React.FC<SuperAdminRouteGuardProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  // Check if user is super admin
  const isSuperAdmin = user?.role === "super_admin";

  if (!isSuperAdmin) {
    // Redirect to login or unauthorized page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default SuperAdminRouteGuard;
