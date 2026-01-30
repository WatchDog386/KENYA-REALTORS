// src/pages/portal/super-admin/settings/SystemSettingsPage.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Loader2, Settings, ArrowLeft, RefreshCw } from 'lucide-react';
import SystemSettings from '@/components/portal/super-admin/SystemSettings';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';

const SystemSettingsPage: React.FC = () => {
  const { hasPermission, isLoading } = useSuperAdmin();
  const navigate = useNavigate();

  // Check if user has permission to manage system settings
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-navy" />
          <p className="text-gray-600 text-[13px] font-medium">Loading system settings...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission('manage_system_settings')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-navy mb-4">Access Denied</h1>
          <p className="text-gray-600 text-sm mb-6">You don't have permission to access this page.</p>
          <Button 
            onClick={() => navigate("/portal/super-admin")}
            variant="secondary"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>System Settings | Super Admin</title>
        <meta name="description" content="Configure and manage system settings" />
      </Helmet>

      <div className="who-section-bg font-nunito antialiased text-[#1a1a1a]">
        {/* HEADER SECTION */}
        <section className="bg-gradient-to-b from-white to-[#f8f9fa] border-b border-gray-200 py-8">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/portal/super-admin")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-navy text-white text-[9px] font-bold px-2 py-0.5 tracking-tighter uppercase rounded">
                      SETTINGS
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-light text-navy">
                    <span className="font-bold">System</span> Settings
                  </h1>
                  <p className="text-[13px] text-gray-600 mt-2 font-medium">
                    Configure and manage system-wide settings and preferences
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT SECTION */}
        <section className="py-8 who-section-alt">
          <div className="max-w-[1200px] mx-auto px-4">
            <SystemSettings />
          </div>
        </section>
      </div>
    </>
  );
};

export default SystemSettingsPage;