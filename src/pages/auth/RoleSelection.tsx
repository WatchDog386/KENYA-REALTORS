// src/pages/auth/RoleSelection.tsx - WITHOUT CARD COMPONENTS
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Home, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const RoleSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    {
      id: 'super_admin',
      title: 'Super Administrator',
      icon: Shield,
      description: 'Full system access. Can manage all properties, assign managers, and approve all requests.',
      features: [
        'Manage all properties',
        'Assign property managers',
        'Approve all requests',
        'System configuration',
        'View all financial data'
      ],
      color: 'border-blue-200 hover:border-blue-400 bg-blue-50'
    },
    {
      id: 'property_manager',
      title: 'Property Manager',
      icon: Users,
      description: 'Manage assigned properties, handle tenants, and request approvals from super admin.',
      features: [
        'Manage assigned properties',
        'Handle tenant applications',
        'Collect rent payments',
        'Request approvals from super admin',
        'View property reports'
      ],
      color: 'border-green-200 hover:border-green-400 bg-green-50'
    },
    {
      id: 'tenant',
      title: 'Tenant',
      icon: Home,
      description: 'Rent a property, pay rent online, submit maintenance requests, and track your lease.',
      features: [
        'View and rent properties',
        'Pay rent online',
        'Submit maintenance requests',
        'Access lease documents',
        'Track deposit refund status'
      ],
      color: 'border-purple-200 hover:border-purple-400 bg-purple-50'
    }
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;
    
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (selectedRole) {
        case 'super_admin':
          navigate('/portal/super-admin');
          break;
        case 'property_manager':
          navigate('/portal/manager');
          break;
        case 'tenant':
          navigate('/portal/tenant');
          break;
        default:
          navigate('/portal');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Role
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Welcome, {user?.email}! Please select the role that best describes how you'll use this platform.
            You can request role changes from the super administrator later if needed.
          </p>
        </div>

        {/* Role Selection Cards - Using divs instead of Card components */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {roles.map((role) => (
            <div 
              key={role.id}
              className={`rounded-lg border bg-white shadow-sm cursor-pointer transition-all duration-300 ${
                selectedRole === role.id 
                  ? 'ring-2 ring-offset-2 ring-blue-500 transform scale-[1.02]' 
                  : 'hover:shadow-lg'
              } ${role.color}`}
              onClick={() => handleRoleSelect(role.id)}
            >
              {/* Card Header */}
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <role.icon className={`w-10 h-10 ${
                    role.id === 'super_admin' ? 'text-blue-600' :
                    role.id === 'property_manager' ? 'text-green-600' :
                    'text-purple-600'
                  }`} />
                  {selectedRole === role.id && (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <h3 className="text-2xl font-semibold leading-none tracking-tight mb-2">{role.title}</h3>
                <p className="text-sm text-gray-600">
                  {role.description}
                </p>
              </div>

              {/* Card Content */}
              <div className="p-6 pt-0">
                <ul className="space-y-2">
                  {role.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedRole || isSubmitting}
            className="px-8 py-6 text-lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Setting up your account...
              </>
            ) : (
              `Continue as ${roles.find(r => r.id === selectedRole)?.title || 'Selected Role'}`
            )}
          </Button>
          
          {!selectedRole && (
            <p className="text-gray-500 mt-4">
              Please select a role to continue
            </p>
          )}

          <div className="mt-8 text-gray-600">
            <p className="text-sm">
              <strong>Note:</strong> Your role selection determines your access level in the system.
              Super administrators have the authority to change user roles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;