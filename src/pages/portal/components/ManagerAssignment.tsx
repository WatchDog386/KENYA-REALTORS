import React, { useState, useEffect } from 'react';
import { useApprovalContext } from '@/contexts/ApprovalContext';
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
  AlertCircle,
  Briefcase,
  Wrench,
  UserCheck
} from 'lucide-react';
import { formatDate } from '@/utils/dateHelpers';

interface ManagerAssignmentProps {
  propertyId?: string;
  showForm?: boolean;
}

type AssignmentType = 'property_manager' | 'technician' | 'proprietor' | 'caretaker';

const ManagerAssignment: React.FC<ManagerAssignmentProps> = ({ 
  propertyId, 
  showForm = false 
}) => {
  const { pendingApprovals, approveRequest, rejectRequest } = useApprovalContext();
  
  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [technicianCategories, setTechnicianCategories] = useState<any[]>([]);
  
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('property_manager');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(propertyId || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(showForm);

  // Load properties and initial users
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const { data: propertiesData } = await supabase
          .from('properties')
          .select('*')
          .order('name');
        setProperties(propertiesData || []);
      } catch (error) {
        console.error('Error loading properties:', error);
      }
    };

    const loadTechnicianCategories = async () => {
      try {
        const { data } = await supabase
          .from('technician_categories')
          .select('*')
          .eq('is_active', true)
          .order('name');
        setTechnicianCategories(data || []);
      } catch (error) {
        console.error('Error loading technician categories:', error);
      }
    };

    loadProperties();
    loadTechnicianCategories();
  }, []);

  // Load users when assignment type changes
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', assignmentType) // Filter by the selected assignment type
          .eq('status', 'active');

        setUsers(usersData || []);
        setSelectedUser(''); // Reset selection when type changes
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      }
    };

    loadUsers();
  }, [assignmentType]);

  // Get pending manager assignment requests
  const managerAssignmentRequests = pendingApprovals.filter(
    request => request.type === 'manager_assignment'
  );

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProperty || !selectedUser) {
      toast.error('Please select both a property and a user');
      return;
    }

    if (assignmentType === 'technician' && !selectedCategory) {
      toast.error('Please select a technician category');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (assignmentType === 'property_manager') {
        const { error } = await supabase
          .from('property_manager_assignments')
          .insert({
            property_manager_id: selectedUser,
            property_id: selectedProperty,
            status: 'active'
          });
        if (error) throw error;
        toast.success('Property Manager assigned successfully');

      } else if (assignmentType === 'technician') {
        // 1. Ensure technician record exists/update category
        // Start by checking if technician record exists
        const { data: existingTechnician } = await supabase
            .from('technicians')
            .select('id')
            .eq('user_id', selectedUser)
            .maybeSingle();

        let technicianId = existingTechnician?.id;

        if (existingTechnician) {
            // Update category
            const { error: updateError } = await supabase
                .from('technicians')
                .update({ category_id: selectedCategory })
                .eq('id', existingTechnician.id);
            if (updateError) throw updateError;
        } else {
            // Create technician record
            const { data: newTechnician, error: createError } = await supabase
                .from('technicians')
                .insert({
                    user_id: selectedUser,
                    category_id: selectedCategory,
                    status: 'active'
                })
                .select()
                .single();
            if (createError) throw createError;
            technicianId = newTechnician.id;
        }

        // 2. Assign to property
        const { error: assignError } = await supabase
          .from('technician_property_assignments')
          .insert({
            technician_id: technicianId,
            property_id: selectedProperty,
            assigned_by: currentUser.id
          });
        
        if (assignError) {
            // Check for specific unique constraint violation message
             if (assignError.code === '23505') { // unique_violation
                 toast.error('Technician is already assigned to this property');
                 return;
             }
             throw assignError;
        }
        
        toast.success('Technician assigned successfully');

      } else if (assignmentType === 'proprietor') {
        // 1. Ensure proprietor record exists
        const { data: existingProprietor } = await supabase
             .from('proprietors')
             .select('id')
             .eq('user_id', selectedUser)
             .maybeSingle();

        let proprietorId = existingProprietor?.id;

        if (!existingProprietor) {
            const { data: newProprietor, error: createError } = await supabase
                .from('proprietors')
                .insert({
                    user_id: selectedUser,
                    status: 'active'
                })
                .select()
                .single();
            if (createError) throw createError;
            proprietorId = newProprietor.id;
        }

        // 2. Assign to property
        const { error } = await supabase
          .from('proprietor_properties')
          .insert({
            proprietor_id: proprietorId,
            property_id: selectedProperty,
            assigned_by: currentUser.id
          });
        
        if (error) {
             if (error.code === '23505') {
                 toast.error('Proprietor is already assigned to this property');
                 return;
             }
             throw error;
        }

        toast.success('Proprietor assigned successfully');

      } else if (assignmentType === 'caretaker') {
        // Caretakers table links user directly to property
        // Check if caretaker record exists for this user. 
        // Note: Caretakers table has unique constraint on user_id, so a user can only be caretaker for one property at a time based on schema.
        
        // Get the actual property manager for this property
        let propertyManagerId = currentUser.id; // Default to current user
        try {
          const { data: pmAssignment } = await supabase
            .from('property_manager_assignments')
            .select('property_manager_id')
            .eq('property_id', selectedProperty)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();
          
          if (pmAssignment?.property_manager_id) {
            propertyManagerId = pmAssignment.property_manager_id;
          }
        } catch (e) {
          console.warn('Could not find property manager, using current user');
        }
        
        const { error } = await supabase
          .from('caretakers')
          .upsert({
            user_id: selectedUser,
            property_id: selectedProperty,
            property_manager_id: propertyManagerId, // Use actual property manager
            assigned_by: currentUser.id,
            status: 'active',
            assignment_date: new Date().toISOString()
          }, { onConflict: 'user_id' }); // Update if exists

        if (error) throw error;
        toast.success('Caretaker assigned successfully');
      }
      
      // Reset form
      setSelectedUser('');
      setAssignmentReason('');
      setSelectedCategory('');
      setShowAssignmentForm(false);
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      toast.error(error.message || 'Failed to submit assignment');
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

  const getAssignmentIcon = () => {
    switch (assignmentType) {
      case 'technician': return <Wrench className="h-5 w-5 text-blue-600" />;
      case 'proprietor': return <Building className="h-5 w-5 text-blue-600" />;
      case 'caretaker': return <UserCheck className="h-5 w-5 text-blue-600" />;
      default: return <UserPlus className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAssignmentLabel = () => {
    switch (assignmentType) {
      case 'technician': return 'Assign Technician';
      case 'proprietor': return 'Assign Proprietor';
      case 'caretaker': return 'Assign Caretaker';
      default: return 'Assign Property Manager';
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Assignment Requests - Show only for property managers for now as approval system is for them */}
      {managerAssignmentRequests.length > 0 && assignmentType === 'property_manager' && (
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
            {getAssignmentIcon()}
            {getAssignmentLabel()}
          </CardTitle>
          <CardDescription>
            Select a property and assign a {assignmentType.replace('_', ' ')}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitAssignment} className="space-y-4">
            
            <div className="space-y-2">
                <Label>Assignment Type</Label>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant={assignmentType === 'property_manager' ? 'default' : 'outline'}
                        onClick={() => setAssignmentType('property_manager')}
                        className="flex items-center gap-2"
                    >
                        <UserPlus className="h-4 w-4" /> Manager
                    </Button>
                    <Button
                        type="button"
                        variant={assignmentType === 'technician' ? 'default' : 'outline'}
                        onClick={() => setAssignmentType('technician')}
                        className="flex items-center gap-2"
                    >
                        <Wrench className="h-4 w-4" /> Technician
                    </Button>
                    <Button
                        type="button"
                        variant={assignmentType === 'proprietor' ? 'default' : 'outline'}
                        onClick={() => setAssignmentType('proprietor')}
                        className="flex items-center gap-2"
                    >
                        <Building className="h-4 w-4" /> Proprietor
                    </Button>
                    <Button
                        type="button"
                        variant={assignmentType === 'caretaker' ? 'default' : 'outline'}
                        onClick={() => setAssignmentType('caretaker')}
                        className="flex items-center gap-2"
                    >
                        <UserCheck className="h-4 w-4" /> Caretaker
                    </Button>
                </div>
            </div>

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
                <Label htmlFor="user">Select {assignmentType.replace('_', ' ')}</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose a ${assignmentType.replace('_', ' ')}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          {assignmentType === 'property_manager' ? 'No active property managers found' :
                           assignmentType === 'technician' ? 'No active technicians found' :
                           assignmentType === 'proprietor' ? 'No active proprietors found' :
                           'No active caretakers found'}
                        </div>
                    ) : (
                        users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {user.first_name} {user.last_name}
                            </div>
                        </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {assignmentType === 'technician' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="category">Technician Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicianCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Specify the category for this technician assignment.</p>
                  </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Assignment Note (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Add any notes about this assignment..."
                value={assignmentReason}
                onChange={(e) => setAssignmentReason(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Assigning...' : `Assign ${assignmentType.replace('_', ' ')}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerAssignment;