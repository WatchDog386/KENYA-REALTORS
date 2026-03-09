// src/pages/portal/components/ApprovalRequests.tsx
import React, { useEffect, useState } from 'react';
import { useApprovalContext } from '@/contexts/ApprovalContext'; // Changed from useApproval to useApprovalContext
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, Search, Filter, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/utils/dateHelpers';

const ApprovalRequests = () => {
  const { 
    pendingApprovals, 
    approvalStats,
    approveRequest,
    rejectRequest,
    searchApprovals,
    filterByType,
    filterByStatus
  } = useApprovalContext(); // Changed from useApproval to useApprovalContext

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [filteredApprovals, setFilteredApprovals] = useState(pendingApprovals);

  // Apply filters
  useEffect(() => {
    let result = pendingApprovals;

    // Apply type filter
    if (typeFilter !== 'all') {
      result = filterByType(typeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = filterByStatus(statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      result = searchApprovals(searchQuery);
    }

    setFilteredApprovals(result);
  }, [pendingApprovals, typeFilter, statusFilter, searchQuery, filterByType, filterByStatus, searchApprovals]);

  const handleApprove = async (id: string) => {
    try {
      await approveRequest(id, 'Approved by manager');
      toast.success('Request approved successfully');
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      await rejectRequest(id, reason || 'Request rejected by manager');
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
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Approval Requests</h2>
          <p className="text-gray-600">Review and manage pending requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {approvalStats.pending} pending
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{approvalStats.pending}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{approvalStats.approved}</div>
                <div className="text-sm text-gray-500">Approved</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{approvalStats.rejected}</div>
                <div className="text-sm text-gray-500">Rejected</div>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="property_listing">Property Listing</SelectItem>
                  <SelectItem value="tenant_application">Tenant Application</SelectItem>
                  <SelectItem value="manager_assignment">Manager Assignment</SelectItem>
                  <SelectItem value="deposit_refund">Deposit Refund</SelectItem>
                  <SelectItem value="maintenance_request">Maintenance Request</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setStatusFilter('pending');
              }}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {filteredApprovals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No requests found</h3>
              <p className="text-gray-500">All requests have been processed or no matches found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{request.title || `Approval Request #${request.id.slice(0, 8)}`}</CardTitle>
                    <CardDescription>
                      <div className="flex flex-wrap items-center gap-2">
                        {getTypeBadge(request.type)}
                        {getPriorityBadge(request.priority)}
                        {getStatusBadge(request.status)}
                        <span className="text-gray-500">• Submitted: {formatDate(request.created_at)}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.status === 'pending' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request.id, 'Review needed')}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-gray-600">{request.description || 'No description provided.'}</p>
                  </div>
                  
                  {request.submitted_by_user && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Submitted By</h4>
                        <p className="text-gray-600">
                          {request.submitted_by_user.first_name} {request.submitted_by_user.last_name}
                          <span className="block text-sm text-gray-500">{request.submitted_by_user.email}</span>
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">User Role</h4>
                        <Badge variant="outline" className="bg-gray-100">
                          {request.submitted_by_user.role?.replace('_', ' ') || 'User'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {request.property && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Related Property</h4>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{request.property.name}</div>
                            <div className="text-sm text-gray-500">{request.property.address}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {request.days_pending !== undefined && request.days_pending > 7 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Overdue:</span>
                        <span>This request has been pending for {request.days_pending} days</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovalRequests;