import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Plus,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApprovalSystem } from '@/hooks/useApprovalSystem';
import { approvalService } from '@/services/approvalService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useManager } from '@/hooks/useManager';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ManagerApprovalRequests = () => {
  const { requests, loading, fetchApprovalRequests } = useApprovalSystem();
  const { user } = useAuth();
  const { getAssignedProperties } = useManager();
  
  const [filter, setFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Properties for dropdown
  const [assignedProperties, setAssignedProperties] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    action: '',
    reason: '',
    propertyId: '',
    propertyName: ''
  });

  // Fetch properties and approvals on mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch properties
        const props = await getAssignedProperties();
        setAssignedProperties(props || []);
        
        // Fetch approval requests
        await fetchApprovalRequests();
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };
    loadData();
  }, [getAssignedProperties, fetchApprovalRequests]);

  const filteredApprovals = requests.filter(approval => 
    filter === 'all' || approval.status === filter
  );

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.action || !formData.reason || !formData.propertyId) {
      toast.error("Please fill in all fields (Property is required)");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a generic permission request
      const result = await approvalService.createApprovalRequest({
        request_type: 'permission_request',
        request_id: 'manual-' + Date.now(), // Unique ID for manual requests
        notes: formData.reason,
        metadata: {
          action_title: formData.action,
          property_name: formData.propertyName,
          property_id: formData.propertyId,
          requester_name: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
        },
        // Also put property info in request_data if helpful
        request_data: {
          address: formData.propertyName, // reuse specific fields if needed
          id: formData.propertyId
        }
      });

      if (result) {
        toast.success("Request sent to Super Admin");
        setIsCreateOpen(false);
        setFormData({ action: '', reason: '', propertyId: '', propertyName: '' });
        fetchApprovalRequests(); // Refresh list
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> Awaiting Response</Badge>;
      case 'approved': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Access & Permission Requests</h1>
          <p className="text-gray-600">Request approvals from Super Admin</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Permission</DialogTitle>
              <DialogDescription>
                State the action you want to execute and the reason for this request.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRequest} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>Requester Name</Label>
                   <Input 
                      disabled 
                      value={user ? `${user.firstName} ${user.lastName}` : "Loading..."} 
                      className="bg-slate-50"
                   />
                </div>
                 <div className="space-y-2">
                   <Label>Current Status</Label>
                   <div className="h-10 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm font-medium flex items-center">
                     <Clock className="w-4 h-4 mr-2" /> Pending Review
                   </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="property">Property</Label>
                <Select 
                  value={formData.propertyId} 
                  onValueChange={(val) => {
                     const prop = assignedProperties.find(p => p.id === val);
                     setFormData({...formData, propertyId: val, propertyName: prop?.name || ''})
                  }}
                  required
                >
                  <SelectTrigger id="property" className="bg-white">
                    <SelectValue placeholder="Select Property relevant to request" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedProperties.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action">Action Required / Title</Label>
                <Input 
                  id="action" 
                  placeholder="e.g. Delete Tenant Record, Access Financial Reports..." 
                  value={formData.action}
                  onChange={(e) => setFormData({...formData, action: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Description / Justification</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Why is this action necessary?" 
                  rows={4}
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  required
                  className="bg-white text-slate-900 border-slate-200"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Requests
        </Button>
        <Button 
          variant={filter === 'in_progress' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('in_progress')}
        >
          Awaiting Response
        </Button>
        <Button 
          variant={filter === 'approved' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('approved')}
        >
          Approved
        </Button>
        <Button 
          variant={filter === 'rejected' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
          <CardDescription>
            Status of your permission requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredApprovals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No requests found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin Reply</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApprovals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell>
                      <div className="font-medium">
                        {approval.metadata?.action_title || approval.request_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 max-w-[200px] truncate" title={approval.notes}>
                         {approval.notes || '-'}
                      </div>
                       <div className="text-xs text-slate-400 mt-1">
                        {new Date(approval.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                       {/* Try to get property name from metadata or request_data */}
                       {approval.metadata?.property_name || 
                        approval.request_data?.name || 
                        approval.request_data?.address || 
                        '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(approval.status)}
                    </TableCell>
                    <TableCell>
                      {approval.admin_response ? (
                        <div className="bg-blue-50 p-2 rounded-md border border-blue-100">
                          <div className="flex items-start gap-2 text-sm">
                            <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                            <span className="text-slate-700">{approval.admin_response}</span>
                          </div>
                        </div>
                      ) : approval.rejection_reason ? (
                         <div className="bg-red-50 p-2 rounded-md border border-red-100">
                           <div className="text-red-800 text-sm font-medium mb-1">Rejected:</div>
                           <div className="text-red-700 text-sm">{approval.rejection_reason}</div>
                         </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">Waiting for response...</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerApprovalRequests;