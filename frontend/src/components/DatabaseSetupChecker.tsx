// src/components/DatabaseSetupChecker.tsx
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DatabaseSetupChecker = () => {
  const { user, supabaseUser, isLoading, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated but has no profile
    if (!isLoading && supabaseUser && !user) {
      console.log('User authenticated but no profile found');
      
      // Check if we're already on a profile-related page
      const currentPath = window.location.pathname;
      const allowedPaths = ['/login', '/register', '/complete-profile', '/profile-recovery', '/verify-email'];
      
      if (!allowedPaths.some(path => currentPath.startsWith(path))) {
        // Redirect to profile recovery
        navigate('/profile-recovery');
      }
    }
  }, [user, supabaseUser, isLoading, navigate]);

  // Show loading state if checking
  if (isLoading) {
    return null; // Or a loading spinner
  }

  return null;
};

export default DatabaseSetupChecker;