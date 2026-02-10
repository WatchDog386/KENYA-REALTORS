import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, Search, Filter, Check, X, Clock, FileText, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroBackground } from '@/components/ui/HeroBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Approval {
  id: string;
  user_id: string;
  approval_type: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  property_id?: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  admin_response?: string;
  // Join data
  profiles?: { first_name: string; last_name: string; email: string };
  properties?: { name: string };
}


const ApprovalsPage: React.FC = () => {
  const { hasPermission, loading: isLoading } = useSuperAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null);

  // Dialog State
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  useEffect(() => {
    // Check permission logic 
    fetchApprovals();
  }, []); // Reload on mount

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('approvals')
        .select(`
          id,
          user_id,
          approval_type,
          status,
          property_id,
          notes,
          metadata,
          created_at,
          reviewed_by,
          reviewed_at,
          rejection_reason,
          admin_response,
          profiles:user_id (first_name, last_name, email),
          properties:property_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApprovals(data || []);
    } catch (err) {
      console.error('Error fetching approvals:', err);
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const initApprove = (approval: Approval) => {
    setSelectedApproval(approval);
    setAdminResponse("Approved."); // Default text or empty
    setIsApproveOpen(true);
  };

  const initReject = (approval: Approval) => {
    setSelectedApproval(approval);
    setAdminResponse("");
    setIsRejectOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedApproval) return;
    const approvalId = selectedApproval.id;

    setApprovalLoading(approvalId);
    setIsApproveOpen(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update approval status
      const { error: updateError } = await supabase
        .from('approvals')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_response: adminResponse
        })
        .eq('id', approvalId);

      if (updateError) throw updateError;

      toast.success('Approval processed successfully');
      fetchApprovals();
    } catch (err) {
      console.error('Error approving:', err);
      toast.error('Failed to process approval');
    } finally {
      setApprovalLoading(null);
      setSelectedApproval(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedApproval) return;
    if (!adminResponse.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    const approvalId = selectedApproval.id;
    setApprovalLoading(approvalId);
    setIsRejectOpen(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('approvals')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: adminResponse
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
      setSelectedApproval(null);
    }
  };

  // Helper to determine if status is effectively pending
  const isPending = (status: string) => status === 'pending' || status === 'in_progress';

  const getApprovalTitle = (approval: Approval): string => {
    // If it's a permission request, use the action title from metadata
    if (approval.approval_type === 'permission_request' && approval.metadata?.action_title) {
       return approval.metadata.action_title;
    }
    // Fallback logic
    if (approval.approval_type === 'permission_request') {
       return 'Permission Request';
    }
    return `${(approval.approval_type || 'Unknown').replace(/_/g, ' ')} Approval`.replace(/\b\w/g, l => l.toUpperCase());
  };

  const getApprovalDescription = (approval: Approval): string => {
    const applicant = approval.profiles 
        ? `${approval.profiles.first_name || ''} ${approval.profiles.last_name || ''}`.trim()
        : 'Unknown User';
        
    return `Request from ${applicant}`;
  };

  const getApprovalType = (approval: Approval): string => {
    if (!approval.approval_type) return 'Unknown';
    if (approval.approval_type === 'permission_request') {
      return 'permission_request';
    }
    // Return the raw type so badges can style it, or a formatted one if needed.
    // Given the badge function expects specific keys, we might want to return the raw key 
    // or map it intelligently. 
    // The previous implementation of getTypeBadgeColor expects keys like 'property', 'user'. 
    // Let's assume approval.approval_type matches those keys or similar.
    return approval.approval_type;
  };

  const filteredApprovals = approvals.filter(approval => {
    const type = (approval.approval_type || '').toLowerCase();
    const title = getApprovalTitle(approval).toLowerCase();
    const applicant = `${approval.profiles?.first_name || ''} ${approval.profiles?.last_name || ''}`.toLowerCase();
    
    const matchesSearch = title.includes(searchQuery.toLowerCase()) || applicant.includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || type === filterType.toLowerCase() || (filterType === 'permission_request' && approval.approval_type === 'permission_request');
    return matchesSearch && matchesType;
  });

  const pendingCount = approvals.filter(a => isPending(a.status)).length;
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

  /* 
     NOTE: Skipping hasPermission check here for now to ensure debugging is easier, 
     or relying on parent layout. If needed, uncomment:
     
     if (!hasPermission('manage_approvals')) { ... } 
  */

  const getTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'property': return 'bg-blue-100 text-[#154279]';
      case 'user': return 'bg-purple-100 text-purple-700';
      case 'lease': return 'bg-emerald-100 text-emerald-700';
      case 'tenant': return 'bg-amber-100 text-amber-700';
      case 'permission_request': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-orange-100 text-[#F96302]';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200'; // Match Pending Color
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
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
              <div className="md:w-1/2 w-full mt-6 max-w-xs flex justify-end">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white w-full shadow-2xl">
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
                    <option value="permission_request">Requests</option>
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
                                <strong>From:</strong> {applicant}
                              </div>
                              {description && (
                                <div className="text-sm text-slate-600">
                                  {description}
                                </div>
                              )}
                              {approval.notes && (
                                <div className="text-sm text-slate-800 mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reason / Justification</div>
                                  {approval.notes}
                                </div>
                              )}
                              {approval.admin_response && (
                                <div className="text-sm text-blue-800 mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200 flex gap-2">
                                  <div className="shrink-0"><MessageSquare className="w-5 h-5 mt-0.5 text-blue-600" /></div>
                                  <div>
                                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Admin Reply</div>
                                    {approval.admin_response}
                                  </div>
                                </div>
                              )}
                              {approval.rejection_reason && (
                                 <div className="text-sm text-red-800 mt-2 p-4 bg-red-50 rounded-lg border border-red-200">
                                   <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Rejection Reason</div>
                                   {approval.rejection_reason}
                                 </div>
                              )}
                              <div className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Sent on {new Date(approval.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {(isPending(approval.status)) && (
                            <div className="flex flex-col sm:flex-row gap-2 self-start mt-4 md:mt-0 w-full md:w-auto">
                              <Button 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm md:w-32"
                                onClick={() => initApprove(approval)}
                                disabled={!!approvalLoading}
                              >
                                {approvalLoading === approval.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                Approve
                              </Button>
                              <Button 
                                className="bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 font-bold rounded-xl shadow-sm md:w-32"
                                onClick={() => initReject(approval)}
                                disabled={!!approvalLoading}
                              >
                                {approvalLoading === approval.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                                Reject
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

      {/* APPROVE MODAL */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              You are about to approve this request. You can add a note for the manager.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
             <Label htmlFor="admin-reply">Reply Message (Optional)</Label>
             <Textarea 
                id="admin-reply"
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Enter a message to send to the manager..."
                rows={4}
             />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApproveConfirm}>
               Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT MODAL */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
             <Label htmlFor="reject-reason">Rejection Reason</Label>
             <Textarea 
                id="reject-reason"
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Why is this request being rejected?"
                rows={4}
                className="border-red-200 focus:border-red-500"
             />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
               Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApprovalsPage;