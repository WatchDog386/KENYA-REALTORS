import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Home,
  User,
  DollarSign,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApprovalSystem } from '@/hooks/useApprovalSystem';
import { formatCurrency } from '@/utils/formatCurrency';

const ManagerApprovalRequests = () => {
  const { requests, loading, approveRequest, rejectRequest } = useApprovalSystem();
  const [filter, setFilter] = useState('pending');

  const filteredApprovals = requests.filter(approval => 
    filter === 'all' || approval.status === filter
  );

  const handleProcess = async (approvalId: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      await approveRequest(approvalId);
    } else {
      await rejectRequest(approvalId);
    }
  };

  const getApprovalTypeIcon = (type: string) => {
    switch (type) {
      case 'lease_application': return <FileText className="w-4 h-4" />;
      case 'rent_increase': return <DollarSign className="w-4 h-4" />;
      case 'property_manager_assignment': return <Home className="w-4 h-4" />;
      case 'lease_termination': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading approval requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Requests</h1>
          <p className="text-gray-600">Review and process pending requests</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={filter === 'pending' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({requests.filter(a => a.status === 'pending').length})
          </Button>
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({requests.length})
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests Needing Your Action</CardTitle>
          <CardDescription>
            {filteredApprovals.length} requests found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApprovals.map((approval) => (
                <TableRow key={approval.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getApprovalTypeIcon(approval.request_type)}
                      <span className="capitalize">{approval.request_type?.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{approval.requested_by_user?.first_name || approval.requested_by || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    N/A
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-400">No details</span>
                  </TableCell>
                  <TableCell>
                    {new Date(approval.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(approval.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    {approval.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600 border-green-200"
                          onClick={() => handleProcess(approval.id, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 border-red-200"
                          onClick={() => handleProcess(approval.id, 'reject')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerApprovalRequests;