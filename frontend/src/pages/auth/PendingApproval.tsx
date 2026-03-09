import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PendingApproval: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Account Pending Approval
        </h1>
        <div className="bg-yellow-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-10 w-10 text-yellow-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        
        <p className="text-gray-600 mb-6">
          Hello <strong>{user?.email}</strong>,
        </p>
        
        <p className="text-gray-600 mb-6">
          Your account is currently waiting for approval.
        </p>

        {user?.role === "property_manager" && (
           <p className="text-sm text-gray-500 mb-6 bg-blue-50 p-3 rounded">
             As a <strong>Property Manager</strong>, your account must be approved by a Super Admin.
           </p>
        )}

        {user?.role === "tenant" && (
           <p className="text-sm text-gray-500 mb-6 bg-blue-50 p-3 rounded">
             As a <strong>Tenant</strong>, your account must be approved by your Property Manager.
           </p>
        )}

        <Button onClick={handleSignOut} variant="outline" className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default PendingApproval;
