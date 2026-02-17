// src/pages/portal/super-admin/analytics/AnalyticsPage.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Loader2, BarChart3, TrendingUp, Users, Home, DollarSign, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeroBackground } from '@/components/ui/HeroBackground';

const AnalyticsPage: React.FC = () => {
  const { hasPermission, loading: isLoading } = useSuperAdmin();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#154279]" />
          <p className="text-slate-600 text-sm font-semibold">Loading analytics...</p>
        </motion.div>
      </div>
    );
  }

  if (!hasPermission('view_analytics')) {
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

  const metrics = [
    { label: 'Total Revenue', value: 'KSH 2.4M', trend: '+12.5%', icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Active Users', value: '1,284', trend: '+8.2%', icon: Users, color: 'bg-[#154279]' },
    { label: 'Occupancy Rate', value: '87.3%', trend: '+5.1%', icon: Home, color: 'bg-cyan-500' },
    { label: 'Growth Rate', value: '23.5%', trend: '+15.3%', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  const tableData = [
    { metric: 'Total Properties', current: '5', previous: '4', change: '+25%' },
    { metric: 'Total Units', current: '61', previous: '58', change: '+5.2%' },
    { metric: 'Leased Units', current: '53', previous: '48', change: '+10.4%' },
    { metric: 'Average Rent', current: 'KSH 78,500', previous: 'KSH 72,000', change: '+9.0%' },
  ];

  return (
    <>
      <Helmet>
        <title>Analytics Dashboard | Super Admin</title>
        <meta name="description" content="Comprehensive system analytics and insights" />
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
                  <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">Insights</span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                  Analytics <span className="text-[#F96302]">Dashboard</span>
                </h1>
                <p className="text-sm text-blue-100 leading-relaxed mb-8 max-w-lg font-medium">
                  Comprehensive system insights and performance metrics. Track growth and optimize operations.
                </p>
              </div>
              <div className="md:w-1/2 w-full mt-6 md:mt-0 flex justify-end">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white max-w-xs w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-lg"><BarChart3 className="w-6 h-6 text-white" /></div>
                    <div>
                      <div className="text-xs font-medium text-blue-100 uppercase tracking-wider">System Health</div>
                      <div className="text-xl font-bold">99.9% Uptime</div>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#F96302]" style={{ width: '99.9%' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className={`${metric.color} text-white rounded-xl p-6 shadow-lg`}>
                  <div className="flex items-center justify-between mb-4">
                    <Icon size={32} className="opacity-30" />
                    <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg">{metric.trend}</span>
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wider opacity-80">{metric.label}</p>
                  <p className="text-2xl font-bold mt-2">{metric.value}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg text-[#154279]">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-[#154279] mx-auto mb-2 opacity-30" />
                    <p className="text-slate-500 font-medium">Chart Visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg text-[#154279]">User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-[#154279] mx-auto mb-2 opacity-30" />
                    <p className="text-slate-500 font-medium">Chart Visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Table */}
          <Card className="hover:shadow-lg transition-shadow overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg text-[#154279]">Detailed Analytics</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#154279] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Metric</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Current</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Previous</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tableData.map((row, idx) => (
                    <motion.tr key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + idx * 0.05 }} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{row.metric}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{row.current}</td>
                      <td className="px-6 py-4 text-slate-500">{row.previous}</td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">{row.change}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AnalyticsPage;
