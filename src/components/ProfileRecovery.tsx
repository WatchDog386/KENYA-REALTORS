// src/components/ProfileRecovery.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProfileRecovery: React.FC = () => {
  const { user, supabaseUser, error, retryCreateProfile, clearError, isLoading } = useAuth();

  if (user || !supabaseUser || !error?.includes('Account setup incomplete')) {
    return null;
  }

  return (
    <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Account Setup Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Your account is authenticated but missing required profile data.
            </p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={retryCreateProfile}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-yellow-800 bg-yellow-100 border border-transparent rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              {isLoading ? 'Creating Profile...' : 'Create Profile Now'}
            </button>
            <button
              type="button"
              onClick={clearError}
              className="ml-3 text-sm font-medium text-yellow-800 hover:text-yellow-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileRecovery;