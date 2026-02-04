// src/pages/portal/super-admin/users/UserManagementPage.tsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroBackground } from '@/components/ui/HeroBackground';
import { cn } from "@/lib/utils";

// Mock user data
const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', status: 'active', joinDate: '2025-01-15' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Property Manager', status: 'active', joinDate: '2025-01-20' },
  { id: '3', name: 'Mike Johnson', email: 'mike.j@example.com', role: 'Tenant', status: 'active', joinDate: '2025-02-01' },
  { id: '4', name: 'Sarah Lee', email: 'sarah.lee@example.com', role: 'Property Manager', status: 'inactive', joinDate: '2025-01-10' },
  { id: '5', name: 'Tom Brown', email: 'tom.brown@example.com', role: 'Tenant', status: 'active', joinDate: '2025-01-25' },
  { id: '6', name: 'Emily Davis', email: 'emily.d@example.com', role: 'Admin', status: 'active', joinDate: '2025-02-03' },
];

const UserManagementPage: React.FC = () => {
  const { hasPermission, loading: isLoading } = useSuperAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role.toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#154279]" />
          <p className="text-slate-600 text-sm font-semibold">Loading users...</p>
        </motion.div>
      </div>
    );
  }

  if (!hasPermission('manage_users')) {
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
          <Button onClick={() => navigate("/portal/super-admin/dashboard")} className="w-full bg-[#154279] hover:bg-[#0f325e] text-white font-bold rounded-xl">
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  const activeCount = mockUsers.filter(u => u.status === 'active').length;
  const inactiveCount = mockUsers.filter(u => u.status === 'inactive').length;

  return (
    <>
      <Helmet>
        <title>User Management | Super Admin</title>
        <meta name="description" content="Manage all users and their permissions" />
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
                  <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">User Management</span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                  User <span className="text-[#F96302]">Management</span>
                </h1>
                <p className="text-sm text-blue-100 leading-relaxed mb-8 max-w-lg font-medium">
                  Manage system users, roles, and permissions. Add new users and control access levels.
                </p>
                <div className="flex items-center gap-4">
                  <button className="group flex items-center gap-2 bg-[#F96302] text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#e05802] transition-all duration-300 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5">
                    <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Add User
                  </button>
                  <button className="group flex items-center gap-2 bg-white/10 text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all duration-300 rounded-xl border border-white/30">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>
              <div className="md:w-1/2 w-full mt-6 md:mt-0 flex justify-end">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white max-w-xs w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-lg"><Users className="w-6 h-6 text-white" /></div>
                    <div>
                      <div className="text-xs font-medium text-blue-100 uppercase tracking-wider">Total Users</div>
                      <div className="text-xl font-bold">{mockUsers.length} Users</div>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#F96302]" style={{ width: `${(activeCount / mockUsers.length) * 100}%` }}></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-blue-100">
                    <span>{activeCount} Active</span><span>{inactiveCount} Inactive</span>
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
              { label: 'Total Users', value: mockUsers.length.toString(), icon: Users, color: 'bg-[#154279]' },
              { label: 'Active Users', value: activeCount.toString(), icon: CheckCircle, color: 'bg-emerald-500' },
              { label: 'Inactive Users', value: inactiveCount.toString(), icon: AlertCircle, color: 'bg-amber-500' },
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
                  <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium text-sm" />
                </div>
                <div className="flex items-center gap-2 md:w-64">
                  <Filter size={18} className="text-[#154279]" />
                  <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium text-sm">
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="property manager">Property Manager</option>
                    <option value="tenant">Tenant</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="hover:shadow-lg transition-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#154279] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Join Date</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map((user, idx) => (
                    <motion.tr key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4"><Badge className="bg-[#154279]/10 text-[#154279] hover:bg-[#154279]/20">{user.role}</Badge></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2.5 h-2.5 rounded-full", user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400')}></div>
                          <span className={cn("text-xs font-semibold uppercase tracking-wider", user.status === 'active' ? 'text-emerald-700' : 'text-slate-600')}>{user.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{user.joinDate}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <Button variant="outline" size="sm" className="bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl border-none"><Eye className="w-4 h-4 mr-1" /> View</Button>
                          <Button variant="outline" size="sm" className="bg-[#154279] hover:bg-[#0f325e] text-white font-bold rounded-xl border-none"><Edit className="w-4 h-4 mr-1" /> Edit</Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-600 font-semibold">
              Showing <span className="text-[#F96302]">{filteredUsers.length}</span> of <span className="text-[#154279]">{mockUsers.length}</span> users
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default UserManagementPage;
