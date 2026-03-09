// src/pages/portal/super-admin/users/UserManagementPage.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroBackground } from '@/components/ui/HeroBackground';
import UserManagementComplete from '@/components/portal/super-admin/UserManagementComplete';

const UserManagementPage: React.FC = () => {
  const { hasPermission, loading: isLoading } = useSuperAdmin();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="text-center">
          <div className="w-12 h-12 border-4 border-[#154279] border-t-[#F96302] rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm font-semibold">Loading user management...</p>
        </motion.div>
      </div>
    );
  }

  if (!hasPermission('manage_users')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#154279] mb-2">Access Denied</h1>
          <p className="text-slate-600 text-sm mb-6">You don't have permission to access this page.</p>
          <Button onClick={() => navigate("/portal/super-admin/dashboard")} className="w-full bg-[#154279] hover:bg-[#0f325e] text-white font-bold rounded-xl">
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>User Management | Super Admin</title>
        <meta name="description" content="Manage all users, approve registrations, and control access" />
      </Helmet>

      <div className="bg-slate-50 min-h-screen antialiased text-slate-900 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
          body { font-family: 'Nunito', sans-serif; }
        `}</style>

        {/* HERO SECTION */}
        <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] overflow-hidden py-10 shadow-lg mb-8 relative">
          <HeroBackground />
          <div className="max-w-[1400px] mx-auto px-6 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row items-start justify-between gap-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/30">Super Admin</span>
                  <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">User Management</span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                  User <span className="text-[#F96302]">Management</span>
                </h1>
                <p className="text-sm text-blue-100 leading-relaxed mb-6 max-w-lg font-medium">
                  Manage system users, approve registrations, and control access levels. Approve pending users, suspend inactive accounts, or delete users entirely.
                </p>
                <Button onClick={() => navigate("/portal/super-admin/dashboard")} className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all duration-300 rounded-xl border border-white/30 hover:border-white/50">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* USER MANAGEMENT CONTENT */}
        <div className="max-w-[1400px] mx-auto px-6 pb-20">
          <UserManagementComplete />
        </div>
      </div>
    </>
  );
};

export default UserManagementPage;
