import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AuthWrapperProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'tenant' | 'landlord';
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children, requiredRole }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect based on user's actual role
    const redirectPath = user.role === 'admin' ? '/portal/admin' : '/portal/tenant';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default AuthWrapper;