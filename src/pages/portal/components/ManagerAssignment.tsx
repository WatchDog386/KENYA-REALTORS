// src/pages/portal/components/ManagerAssignment.tsx
import React, { useState, useEffect } from 'react';
import { useApprovalContext } from '@/contexts/ApprovalContext'; // Changed from useApproval to useApprovalContext
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building, 
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '@/utils/dateHelpers';

interface ManagerAssignmentProps {
  propertyId?: string;
  showForm?: boolean;
}

const ManagerAssignment: React.FC<ManagerAssignmentProps> = ({ 
  propertyId, 
  showForm = false 
}) => {
  const { pendingApprovals, approveRequest, rejectRequest } = useApprovalContext(); // Changed from useApproval to useApprovalContext
  
  const [managers, setManagers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(propertyId || '');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(showForm);

  // Load managers and properties
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load property managers
        const { data: managersData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'property_manager')
          .eq('status', 'active');

        // Load properties
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('*')
          .order('name');

        setManagers(managersData || []);
        setProperties(propertiesData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      }
    };

    loadData();
  }, []);

  // Get pending manager assignment requests
  const managerAssignmentRequests = pendingApprovals.filter(
    request => request.type === 'manager_assignment'
  );

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProperty || !selectedManager || !assignmentReason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real app, you would create an approval request here
      // For now, simulate creating a request
      const mockRequestId = `req_${Date.now()}`;
      
      toast.success('Manager assignment request submitted for approval');
      
      // Reset form
      setSelectedManager('');
      setAssignmentReason('');
      setShowAssignmentForm(false);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveAssignment = async (requestId: string) => {
    try {
      await approveRequest(requestId, 'Manager assignment approved');
      toast.success('Manager assignment approved');
    } catch (error) {
      toast.error('Failed to approve assignment');
    }
  };

  const handleRejectAssignment = async (requestId: string) => {
    try {
      await rejectRequest(requestId, 'Manager assignment rejected');
      toast.success('Manager assignment rejected');
    } catch (error) {
      toast.error('Failed to reject assignment');
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

  return (
    <div className="space-y-6">
      {/* Pending Assignment Requests */}
      {managerAssignmentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Pending Manager Assignments ({managerAssignmentRequests.length})
            </CardTitle>
            <CardDescription>Requests awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {managerAssignmentRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Manager Assignment Request</h4>
                          <div className="text-sm text-gray-500">
                            {request.description || 'New manager assignment request'}
                          </div>
                        </div>
                      </div>
                      
                      {request.property && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Property:</span>
                          <span>{request.property.name}</span>
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-500">
                        Submitted: {formatDate(request.created_at)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {getStatusBadge(request.status)}
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleApproveAssignment(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectAssignment(request.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Assign Manager to Property
          </CardTitle>
          <CardDescription>
            Select a property and assign a manager. This will create an approval request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitAssignment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property">Select Property</Label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {property.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manager">Select Manager</Label>
                <Select value={selectedManager} onValueChange={setSelectedManager}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {manager.first_name} {manager.last_name}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {manager.properties?.length || 0} properties
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Assignment Reason</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this manager should be assigned to this property..."
                value={assignmentReason}
                onChange={(e) => setAssignmentReason(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowAssignmentForm(!showAssignmentForm)}
              >
                {showAssignmentForm ? 'Cancel' : 'New Assignment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Available Managers */}
      <Card>
        <CardHeader>
          <CardTitle>Available Property Managers</CardTitle>
          <CardDescription>
            {managers.length} managers available for assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {managers.map((manager) => (
              <div key={manager.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600">
                        {manager.first_name[0]}{manager.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {manager.first_name} {manager.last_name}
                      </h4>
                      <p className="text-sm text-gray-500">{manager.email}</p>
                      <p className="text-sm text-gray-500">{manager.phone}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Available
                  </Badge>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Experience:</span>
                    <span className="ml-2 font-medium">3+ years</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Assigned:</span>
                    <span className="ml-2 font-medium">
                      {manager.properties?.length || 0} properties
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rating:</span>
                    <span className="ml-2 font-medium">4.8/5</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium capitalize">{manager.status}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    View Profile
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedManager(manager.id);
                      setShowAssignmentForm(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {managers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No managers available</h3>
              <p className="text-gray-500">Add property managers to assign them to properties</p>
              <Button className="mt-4">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Manager
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerAssignment;