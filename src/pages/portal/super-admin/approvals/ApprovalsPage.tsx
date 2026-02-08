// src/pages/portal/super-admin/approvals/ApprovalsPage.tsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, Search, Filter, Check, X, Clock, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroBackground } from '@/components/ui/HeroBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Approval {
  id: string;
  user_id: string;
  approval_type: string;
  action_type?: string;
  status: 'pending' | 'approved' | 'rejected';
  property_id?: string;
  tenant_id?: string;
  unit_id?: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  // Join data
  profiles?: { first_name: string; last_name: string; email: string };
  tenants?: { user_id: string };
  properties?: { name: string };
  units?: { unit_number: string };
}

const ApprovalsPage: React.FC = () => {
  const { hasPermission, loading: isLoading } = useSuperAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && hasPermission('manage_approvals')) {
      fetchApprovals();
    }
  }, [isLoading, hasPermission]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('approvals')
        .select(`
          id,
          user_id,
          approval_type,
          action_type,
          status,
          property_id,
          tenant_id,
          unit_id,
          notes,
          metadata,
          created_at,
          reviewed_by,
          reviewed_at,
          rejection_reason,
          profiles:user_id (first_name, last_name, email),
          properties:property_id (name),
          units:unit_id (unit_number),
          tenants:tenant_id (user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setApprovals(data || []);
    } catch (err) {
      console.error('Error fetching approvals:', err);
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApproval = async (approvalId: string, actionType?: string) => {
    setApprovalLoading(approvalId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update approval status
      const { error: updateError } = await supabase
        .from('approvals')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', approvalId);

      if (updateError) throw updateError;

      // If it's a tenant action, update the tenant record
      const approval = approvals.find(a => a.id === approvalId);
      if (approval && approval.action_type?.startsWith('tenant_')) {
        if (approval.action_type === 'tenant_remove' && approval.tenant_id) {
          await supabase
            .from('tenants')
            .update({ status: 'terminated', move_out_date: new Date().toISOString() })
            .eq('id', approval.tenant_id);
        } else if (approval.action_type === 'tenant_suspend' && approval.tenant_id) {
          await supabase
            .from('tenants')
            .update({ status: 'suspended' })
            .eq('id', approval.tenant_id);
        }
      }

      toast.success('Approval processed successfully');
      fetchApprovals();
    } catch (err) {
      console.error('Error approving:', err);
      toast.error('Failed to process approval');
    } finally {
      setApprovalLoading(null);
    }
  };

  const handleRejectApproval = async (approvalId: string, reason: string) => {
    setApprovalLoading(approvalId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('approvals')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', approvalId);

      if (error) throw error;

      toast.success('Approval rejected');
      fetchApprovals();
    } catch (err) {
      console.error('Error rejecting:', err);
      toast.error('Failed to reject approval');
    } finally {
      setApprovalLoading(null);
    }
  };

  const getApprovalTitle = (approval: Approval): string => {
    if (approval.action_type === 'tenant_remove') {
      return `Remove Tenant Request`;
    }
    if (approval.action_type === 'tenant_suspend') {
      return `Suspend Tenant Request`;
    }
    if (approval.action_type === 'tenant_add') {
      return `Tenant Assignment`;
    }
    return `${approval.approval_type || 'Unknown'} Approval`;
  };

  const getApprovalDescription = (approval: Approval): string => {
    const metadata = approval.metadata || {};
    if (approval.action_type?.startsWith('tenant_')) {
      return metadata.tenant_name || 'Tenant Action';
    }
    return approval.properties?.name || 'Unknown';
  };

  const getApprovalType = (approval: Approval): string => {
    if (approval.action_type?.startsWith('tenant_')) {
      return 'Tenant';
    }
    return approval.approval_type || 'Unknown';
  };

  const filteredApprovals = approvals.filter(approval => {
    const type = getApprovalType(approval).toLowerCase();
    const title = getApprovalTitle(approval).toLowerCase();
    const applicant = `${approval.profiles?.first_name || ''} ${approval.profiles?.last_name || ''}`.toLowerCase();
    
    const matchesSearch = title.includes(searchQuery.toLowerCase()) || applicant.includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || type === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const approvedCount = approvals.filter(a => a.status === 'approved').length;

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
    switch (type.toLowerCase()) {
      case 'property': return 'bg-blue-100 text-[#154279]';
      case 'user': return 'bg-purple-100 text-purple-700';
      case 'lease': return 'bg-emerald-100 text-emerald-700';
      case 'tenant': return 'bg-amber-100 text-amber-700';
      default: return 'bg-orange-100 text-[#F96302]';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
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
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white max-w-xs w-full shadow-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl"><FileText className="w-6 h-6 text-white" /></div>
                    <div>
                      <div className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Pending Requests</div>
                      <div className="text-2xl font-bold">{pendingCount} Pending</div>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-[#F96302] rounded-full transition-all duration-1000" style={{ width: `${(pendingCount / (approvals.length || 1)) * 100}%` }}></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-blue-100 font-medium">
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
              { label: 'Total', value: approvals.length.toString(), icon: FileText, color: 'bg-[#154279]' },
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
                    <option value="tenant">Tenant</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approvals List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                  <Loader2 className="w-8 h-8 text-[#154279]" />
                </motion.div>
              </div>
            ) : filteredApprovals.length > 0 ? (
              filteredApprovals.map((approval, idx) => {
                const applicant = approval.profiles 
                  ? `${approval.profiles.first_name || ''} ${approval.profiles.last_name || ''}`.trim() || 'Unknown' 
                  : 'Unknown';
                const type = getApprovalType(approval);
                const title = getApprovalTitle(approval);
                const description = getApprovalDescription(approval);
                
                return (
                  <motion.div key={approval.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={getTypeBadgeColor(type)}>{type}</Badge>
                              <Badge className={getStatusBadgeColor(approval.status)}>{approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}</Badge>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                            <div className="space-y-1">
                              <div className="text-sm text-slate-600">
                                By: <strong>{applicant}</strong>
                              </div>
                              {description && (
                                <div className="text-sm text-slate-600">
                                  {description}
                                </div>
                              )}
                              {approval.notes && (
                                <div className="text-sm text-slate-600 mt-2 p-2 bg-slate-50 rounded italic border-l-2 border-slate-300">
                                  Reason: {approval.notes}
                                </div>
                              )}
                              <div className="text-xs text-slate-500">
                                {new Date(approval.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {approval.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl"
                                onClick={() => handleApproveApproval(approval.id, approval.action_type)}
                                disabled={approvalLoading === approval.id}
                              >
                                {approvalLoading === approval.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 mr-2" /> Approve
                                  </>
                                )}
                              </Button>
                              <Button 
                                className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl"
                                onClick={() => handleRejectApproval(approval.id, 'Rejected by super admin')}
                                disabled={approvalLoading === approval.id}
                              >
                                {approvalLoading === approval.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4 mr-2" /> Reject
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No approvals found</h3>
                  <p className="text-gray-500">
                    {searchQuery || filterType !== 'all' ? 'Try adjusting your filters' : 'All approvals are up to date!'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ApprovalsPage;
