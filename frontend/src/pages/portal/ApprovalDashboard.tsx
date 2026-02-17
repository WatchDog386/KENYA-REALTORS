// src/pages/portal/ApprovalDashboard.tsx
import React, { useEffect } from 'react';
import { useApprovalContext } from '@/contexts/ApprovalContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { HeroBackground } from '@/components/ui/HeroBackground';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Filter, AlertCircle, Users, Home, DollarSign } from 'lucide-react';
import { formatDate } from '@/utils/dateHelpers';
import { toast } from 'sonner';

const ApprovalDashboard = () => {
  const { 
    pendingApprovals, 
    approvedApprovals, 
    rejectedApprovals,
    approvalStats, 
    approveRequest,
    rejectRequest,
    addComment,
    filterByType,
    filterByStatus,
    filterByPriority,
    searchApprovals
  } = useApprovalContext();

  useEffect(() => {
    // You could fetch initial data here if needed
    // fetchApprovalRequests();
  }, []);

  const allApprovals = [...pendingApprovals, ...approvedApprovals, ...rejectedApprovals];

  const handleApprove = async (id: string) => {
    try {
      await approveRequest(id, 'Approved by Super Admin');
      toast.success('Request approved successfully');
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectRequest(id, 'Request rejected');
      toast.success('Request rejected successfully');
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" /> Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" /> Rejected
        </Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <AlertCircle className="w-3 h-3 mr-1" /> Under Review
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'property_listing': return <Home className="w-4 h-4" />;
      case 'tenant_application': return <Users className="w-4 h-4" />;
      case 'manager_assignment': return <Users className="w-4 h-4" />;
      case 'deposit_refund': return <DollarSign className="w-4 h-4" />;
      case 'payment_verification': return <DollarSign className="w-4 h-4" />;
      case 'maintenance_request': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'property_listing': return 'Property Listing';
      case 'tenant_application': return 'Tenant Application';
      case 'manager_assignment': return 'Manager Assignment';
      case 'deposit_refund': return 'Deposit Refund';
      case 'payment_verification': return 'Payment Verification';
      case 'maintenance_request': return 'Maintenance Request';
      case 'contract_renewal': return 'Contract Renewal';
      default: return type.replace('_', ' ');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Low</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Urgent</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'property_listing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Property</Badge>;
      case 'tenant_application':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Tenant</Badge>;
      case 'manager_assignment':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Manager</Badge>;
      case 'deposit_refund':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Refund</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{type}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <section className="relative overflow-hidden bg-gradient-to-r from-[#154279] to-[#0f325e] text-white py-12 px-6 shadow-xl mb-8 lg:rounded-b-3xl">
        <HeroBackground />
        <div className="relative z-10 max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight">Approval Dashboard</h1>
              <p className="text-lg text-blue-100 max-w-2xl font-light">
                Review and manage all pending approval requests
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{approvalStats.total}</CardTitle>
            <CardDescription>Total Requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">{approvalStats.today} today</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-yellow-600">{approvalStats.pending}</CardTitle>
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">{approvalStats.thisWeek} this week</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-green-600">{approvalStats.approved}</CardTitle>
            <CardDescription>Approved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">Processed</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-red-600">{approvalStats.rejected}</CardTitle>
            <CardDescription>Rejected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">Denied requests</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingApprovals.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingApprovals.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Pending Requests</h3>
                  <p className="text-gray-600">All approval requests have been processed.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingApprovals.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getTypeIcon(request.type)}
                      </div>
                      <div>
                        <CardTitle>{request.title || `Approval #${request.id.slice(0, 8)}`}</CardTitle>
                        <CardDescription>
                          {getTypeLabel(request.type)} • 
                          Submitted by: {request.submitted_by || 'Unknown'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(request.priority)}
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700">{request.description || 'No additional details provided.'}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div>
                        <span>Requested: {formatDate(request.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handleApprove(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          onClick={() => handleReject(request.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved" className="space-y-4">
          {approvedApprovals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Approved Requests</h3>
                  <p className="text-gray-600">No requests have been approved yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            approvedApprovals.map((request) => (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-medium">{getTypeLabel(request.type)}</h3>
                          <p className="text-sm text-gray-600">{request.title || 'Approval Request'}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="text-sm text-gray-600">{request.description}</div>
                    <div className="text-xs text-gray-500">
                      Approved on {request.created_at ? formatDate(request.created_at) : 'Unknown date'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* All Requests Tab */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Approval Requests ({allApprovals.length})</CardTitle>
              <CardDescription>Complete history of all approval requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Title</th>
                      <th className="text-left py-3 px-4">Priority</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Submitted By</th>
                      <th className="text-left py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allApprovals.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(request.type)}
                            <span>{getTypeLabel(request.type)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {request.title || `Request #${request.id.slice(0, 8)}`}
                        </td>
                        <td className="py-3 px-4">
                          {getPriorityBadge(request.priority)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="py-3 px-4">
                          {request.submitted_by || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {formatDate(request.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="space-y-4">
          {rejectedApprovals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Rejected Requests</h3>
                  <p className="text-gray-600">No requests have been rejected yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            rejectedApprovals.map((request) => (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                          <XCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-medium">{getTypeLabel(request.type)}</h3>
                          <p className="text-sm text-gray-600">{request.title || 'Approval Request'}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="text-sm text-gray-600">{request.description}</div>
                    <div className="text-xs text-gray-500">
                      Rejected on {formatDate(request.created_at)}
                    </div>
                    <div className="p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                      <span className="font-medium">Status:</span> Rejected
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default ApprovalDashboard;