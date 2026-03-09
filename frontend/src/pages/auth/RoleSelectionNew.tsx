// src/pages/auth/RoleSelection.tsx - Updated with new roles
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Home, 
  Wrench,
  Building2,
  UserCog,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const RoleSelection = () => {
  const navigate = useNavigate();
  const { user, updateUserRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const roles = [
    {
      id: 'tenant',
      title: 'Tenant',
      icon: Home,
      description: 'Rent a property, pay rent online, submit maintenance requests with images.',
      features: [
        'View available properties',
        'Pay rent online',
        'Submit maintenance requests with images',
        'Access lease documents',
        'Track payments and deposits'
      ],
      color: 'border-blue-200 hover:border-blue-400 bg-blue-50'
    },
    {
      id: 'property_manager',
      title: 'Property Manager',
      icon: Users,
      description: 'Manage assigned properties, handle tenants, route maintenance to technicians.',
      features: [
        'Manage assigned properties',
        'Handle tenant applications',
        'Collect rent payments',
        'Route maintenance to technicians',
        'View escalated requests',
        'Access property reports'
      ],
      color: 'border-green-200 hover:border-green-400 bg-green-50'
    },
    {
      id: 'technician',
      title: 'Technician',
      icon: Wrench,
      description: 'Accept and complete maintenance jobs in your specialty category.',
      features: [
        'View assigned maintenance requests',
        'Accept/reject jobs',
        'Update job status & progress',
        'Upload completion photos',
        'Rate tenants',
        'View your performance metrics'
      ],
      color: 'border-orange-200 hover:border-orange-400 bg-orange-50'
    },
    {
      id: 'proprietor',
      title: 'Proprietor',
      icon: Building2,
      description: 'View properties, receive reports from super admin, view performance analytics.',
      features: [
        'Manage multiple properties',
        'View property reports',
        'Receive updates from super admin',
        'View occupancy & financial reports',
        'Access property communications',
        'View property analytics'
      ],
      color: 'border-indigo-200 hover:border-indigo-400 bg-indigo-50'
    },
    {
      id: 'caretaker',
      title: 'Caretaker',
      icon: UserCog,
      description: 'Take care of assigned property under property manager supervision.',
      features: [
        'Manage assigned property',
        'Perform daily maintenance',
        'Report issues promptly',
        'Coordinate with technicians',
        'Submit property reports',
        'Track maintenance tasks'
      ],
      color: 'border-cyan-200 hover:border-cyan-400 bg-cyan-50'
    }
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;
    
    setIsSubmitting(true);
    try {
      await updateUserRole(selectedRole);
      
      toast({
        title: "Role Updated",
        description: "Your role has been updated. Redirecting...",
      });

      // Redirect to appropriate portal based on role
      setTimeout(() => {
        switch (selectedRole) {
          case 'property_manager':
            navigate('/portal/manager');
            break;
          case 'tenant':
            navigate('/portal/tenant');
            break;
          case 'technician':
            navigate('/portal/technician');
            break;
          case 'proprietor':
            navigate('/portal/proprietor');
            break;
          case 'caretaker':
            navigate('/portal/caretaker');
            break;
          case 'super_admin':
            navigate('/portal/super-admin/dashboard');
            break;
          default:
            navigate('/portal/tenant');
        }
      }, 1500);
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Role</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Select the role that best describes your position. You can only have one primary role.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {roles.map((role) => {
            const IconComponent = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className={`relative p-6 rounded-xl cursor-pointer transition-all transform hover:scale-105 border-2 ${
                  isSelected
                    ? 'border-white bg-white/10 ring-2 ring-white/30 shadow-xl'
                    : `${role.color} border-2 shadow-lg`
                }`}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-slate-900 rounded-full"></div>
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className={`text-xl font-bold mb-2 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {role.title}
                </h3>
                <p className={`text-sm mb-4 ${isSelected ? 'text-slate-200' : 'text-slate-700'}`}>
                  {role.description}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {role.features.map((feature, idx) => (
                    <li key={idx} className={`text-sm flex items-start ${isSelected ? 'text-slate-200' : 'text-slate-700'}`}>
                      <ChevronRight className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="px-8"
          >
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || isSubmitting}
            className="px-8 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? 'Processing...' : 'Continue'}
          </Button>
        </div>

        {/* Info Footer */}
        <div className="mt-12 p-6 bg-slate-800 rounded-lg border border-slate-700">
          <p className="text-slate-300 text-sm">
            <span className="font-semibold">Note:</span> Technicians must be assigned to properties by super admin. 
            Caretakers are assigned to properties by super admin under specific property managers. 
            Proprietors own multiple properties and receive reports from super admin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
