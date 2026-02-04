// src/pages/portal/super-admin/settings/SystemSettingsPage.tsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Loader2, Settings, AlertCircle, Save, RotateCcw, Globe, Lock, CreditCard, Mail, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeroBackground } from '@/components/ui/HeroBackground';

const SystemSettingsPage: React.FC = () => {
  const { hasPermission, loading: isLoading } = useSuperAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#154279]" />
          <p className="text-slate-600 text-sm font-semibold">Loading settings...</p>
        </motion.div>
      </div>
    );
  }

  if (!hasPermission('manage_system_settings')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#154279] mb-2">Access Denied</h1>
          <p className="text-slate-600 text-sm mb-6">You don't have permission to access this page.</p>
          <Button onClick={() => navigate("/portal/super-admin/dashboard")} className="w-full bg-[#154279] hover:bg-[#0f325e] text-white font-bold rounded-xl">Back to Dashboard</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>System Settings | Super Admin</title>
        <meta name="description" content="Configure and manage system settings" />
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
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="md:w-1/2">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/30">Super Admin</span>
                  <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">Configuration</span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                  System <span className="text-[#F96302]">Settings</span>
                </h1>
                <p className="text-sm text-blue-100 leading-relaxed mb-8 max-w-lg font-medium">
                  Configure and manage system-wide settings including security, payments, and notifications.
                </p>
              </div>
              <div className="md:w-1/2 w-full mt-6 md:mt-0 flex justify-end">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white max-w-xs w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-lg"><Settings className="w-6 h-6 text-white" /></div>
                    <div>
                      <div className="text-xs font-medium text-blue-100 uppercase tracking-wider">Configuration</div>
                      <div className="text-xl font-bold">{tabs.length} Sections</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">
          {/* Tabs Navigation */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap border-b border-slate-200 bg-slate-50">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 ${isActive ? 'bg-[#154279] text-white border-[#F96302]' : 'text-slate-600 hover:text-[#154279] border-transparent hover:bg-slate-100'}`}>
                    <TabIcon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <CardContent className="p-8">
              {activeTab === 'general' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h3 className="text-lg font-bold text-[#154279] flex items-center gap-2"><Globe size={20} className="text-[#F96302]" /> General Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">System Name *</label>
                      <input type="text" placeholder="Kenya Realtors" defaultValue="Kenya Realtors" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">System URL *</label>
                      <input type="text" placeholder="https://kenyarealtors.com" defaultValue="https://kenyarealtors.com" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Support Email *</label>
                      <input type="email" placeholder="support@kenyarealtors.com" defaultValue="support@kenyarealtors.com" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h3 className="text-lg font-bold text-[#154279] flex items-center gap-2"><Lock size={20} className="text-[#F96302]" /> Security Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#F96302] transition-colors">
                      <div><p className="font-bold text-slate-900 text-sm">Two-Factor Authentication</p><p className="text-xs text-slate-600 mt-1">Enable 2FA for all admin accounts</p></div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#154279]" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div><p className="font-bold text-slate-900 text-sm">SSL Certificate</p><p className="text-xs text-slate-600 mt-1">HTTPS enabled</p></div>
                      <span className="text-emerald-700 font-bold text-xs bg-emerald-100 px-3 py-1 rounded-lg">Active</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'payment' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h3 className="text-lg font-bold text-[#154279] flex items-center gap-2"><CreditCard size={20} className="text-[#F96302]" /> Payment Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Payment Gateway *</label>
                      <select defaultValue="mpesa" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium">
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                        <option value="mpesa">M-Pesa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">API Key *</label>
                      <input type="password" placeholder="Enter API Key" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'email' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h3 className="text-lg font-bold text-[#154279] flex items-center gap-2"><Mail size={20} className="text-[#F96302]" /> Email Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">SMTP Server *</label>
                      <input type="text" placeholder="smtp.gmail.com" defaultValue="smtp.gmail.com" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">SMTP Port *</label>
                      <input type="text" placeholder="587" defaultValue="587" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h3 className="text-lg font-bold text-[#154279] flex items-center gap-2"><Bell size={20} className="text-[#F96302]" /> Notification Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#F96302] transition-colors">
                      <div><p className="font-bold text-slate-900 text-sm">Email Notifications</p><p className="text-xs text-slate-600 mt-1">Receive email alerts for system events</p></div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#154279]" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#F96302] transition-colors">
                      <div><p className="font-bold text-slate-900 text-sm">SMS Notifications</p><p className="text-xs text-slate-600 mt-1">Receive SMS alerts for critical events</p></div>
                      <input type="checkbox" className="w-5 h-5 accent-[#154279]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" className="border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">
              <RotateCcw size={18} className="mr-2" /> Reset
            </Button>
            <Button className="bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl">
              <Save size={18} className="mr-2" /> Save Changes
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SystemSettingsPage;
