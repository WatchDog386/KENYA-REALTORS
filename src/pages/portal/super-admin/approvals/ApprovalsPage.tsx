// src/pages/portal/super-admin/approvals/ApprovalsPage.tsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, Search, Filter, Check, X, Clock, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroBackground } from '@/components/ui/HeroBackground';

const ApprovalsPage: React.FC = () => {
  const { hasPermission, loading: isLoading } = useSuperAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const mockApprovals = [
    { id: 1, type: 'Property', title: 'Ayden Home Towers Registration', applicant: 'John Doe', status: 'pending', date: '2024-02-20' },
    { id: 2, type: 'User', title: 'New Property Manager Approval', applicant: 'Sarah Williams', status: 'pending', date: '2024-02-19' },
    { id: 3, type: 'Lease', title: 'Lease Agreement - Unit 204', applicant: 'Mike Johnson', status: 'approved', date: '2024-02-18' },
    { id: 4, type: 'Payment', title: 'Payment Method Update', applicant: 'Jane Smith', status: 'pending', date: '2024-02-17' },
  ];

  const filteredApprovals = mockApprovals.filter(approval => {
    const matchesSearch = approval.title.toLowerCase().includes(searchQuery.toLowerCase()) || approval.applicant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || approval.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const pendingCount = mockApprovals.filter(a => a.status === 'pending').length;
  const approvedCount = mockApprovals.filter(a => a.status === 'approved').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#154279]" />
          <p className="text-slate-600 text-sm font-semibold">Loading approvals...</p>
        </motion.div>
      </div>
    );
  }

  if (!hasPermission('manage_approvals')) {
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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Property': return 'bg-blue-100 text-[#154279]';
      case 'User': return 'bg-purple-100 text-purple-700';
      case 'Lease': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-orange-100 text-[#F96302]';
    }
  };

  return (
    <>
      <Helmet>
        <title>Approval Queue | Super Admin</title>
        <meta name="description" content="Review and approve pending requests" />
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
                  <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">Approvals</span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                  Approval <span className="text-[#F96302]">Queue</span>
                </h1>
                <p className="text-sm text-blue-100 leading-relaxed mb-8 max-w-lg font-medium">
                  Review and manage pending requests. Approve or reject property, user, and lease applications.
                </p>
              </div>
              <div className="md:w-1/2 w-full mt-6 md:mt-0 flex justify-end">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white max-w-xs w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-lg"><FileText className="w-6 h-6 text-white" /></div>
                    <div>
                      <div className="text-xs font-medium text-blue-100 uppercase tracking-wider">Pending Requests</div>
                      <div className="text-xl font-bold">{pendingCount} Pending</div>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#F96302]" style={{ width: `${(pendingCount / mockApprovals.length) * 100}%` }}></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-blue-100">
                    <span>{pendingCount} Pending</span>
                    <span>{approvedCount} Approved</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Pending', value: pendingCount.toString(), icon: Clock, color: 'bg-amber-500' },
              { label: 'Approved', value: approvedCount.toString(), icon: CheckCircle, color: 'bg-emerald-500' },
              { label: 'Total', value: mockApprovals.length.toString(), icon: FileText, color: 'bg-[#154279]' },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className={`${stat.color} text-white rounded-xl p-6 shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider opacity-80">{stat.label}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-lg"><Icon className="w-6 h-6" /></div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Filter Section */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Search className="w-5 h-5 text-[#F96302]" /> Filter & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Search by title or applicant..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium text-sm" />
                </div>
                <div className="flex items-center gap-2 md:w-48">
                  <Filter size={18} className="text-[#154279]" />
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium text-sm">
                    <option value="all">All Types</option>
                    <option value="property">Property</option>
                    <option value="user">User</option>
                    <option value="lease">Lease</option>
                    <option value="payment">Payment</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approvals List */}
          <div className="space-y-4">
            {filteredApprovals.map((approval, idx) => (
              <motion.div key={approval.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getTypeBadgeColor(approval.type)}>{approval.type}</Badge>
                          <Badge className={approval.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>{approval.status}</Badge>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{approval.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>By: <strong>{approval.applicant}</strong></span>
                          <span>Date: <strong>{approval.date}</strong></span>
                        </div>
                      </div>
                      {approval.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl">
                            <Check className="w-4 h-4 mr-2" /> Approve
                          </Button>
                          <Button className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl">
                            <X className="w-4 h-4 mr-2" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ApprovalsPage;
