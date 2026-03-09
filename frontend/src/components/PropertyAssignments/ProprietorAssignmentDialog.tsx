import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Proprietor {
  id: string;
  user_id: string;
  business_name?: string;
  status: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface ProprietorProperty {
  id: string;
  proprietor_id: string;
  property_id: string;
  ownership_percentage: number;
  assigned_at: string;
  is_active: boolean;
  proprietor?: {
    profile?: {
      first_name?: string;
      last_name?: string;
      email?: string;
    };
    business_name?: string;
  };
}

interface ProprietorAssignmentDialogProps {
  propertyId: string;
  onAssignmentChanged?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ProprietorAssignmentDialog: React.FC<ProprietorAssignmentDialogProps> = ({
  propertyId,
  onAssignmentChanged,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [proprietors, setProprietors] = useState<Proprietor[]>([]);
  const [assignments, setAssignments] = useState<ProprietorProperty[]>([]);
  const [selectedProprietor, setSelectedProprietor] = useState('');
  const [ownershipPercentage, setOwnershipPercentage] = useState('100');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => {
    if (open) {
      loadProprietors();
      loadAssignments();
    }
  }, [open]);

  const loadProprietors = async () => {
    try {
      setFetchingData(true);
      const { data, error } = await supabase
        .from('proprietors')
        .select(`
          id,
          user_id,
          business_name,
          status,
          profiles:user_id(first_name, last_name, email)
        `)
        .eq('status', 'active')
        .order('business_name', { ascending: true });

      if (error) throw error;
      setProprietors(data || []);
    } catch (error: any) {
      console.error('Error loading proprietors:', error);
      toast.error('Failed to load proprietors');
    } finally {
      setFetchingData(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('proprietor_properties')
        .select(`
          id,
          proprietor_id,
          property_id,
          ownership_percentage,
          assigned_at,
          is_active,
          proprietors(
            business_name,
            profiles:user_id(first_name, last_name, email)
          )
        `)
        .eq('property_id', propertyId)
        .eq('is_active', true);

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleAssignProprietor = async () => {
    if (!selectedProprietor) {
      toast.error('Please select a proprietor');
      return;
    }

    // Check if already assigned
    if (assignments.some(a => a.proprietor_id === selectedProprietor)) {
      toast.error('This proprietor is already assigned to this property');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('proprietor_properties')
        .insert([
          {
            proprietor_id: selectedProprietor,
            property_id: propertyId,
            ownership_percentage: parseFloat(ownershipPercentage),
            assigned_by: profile?.id,
          }
        ]);

      if (error) throw error;

      toast.success('Proprietor assigned successfully');
      setSelectedProprietor('');
      setOwnershipPercentage('100');
      await loadAssignments();
      onAssignmentChanged?.();
    } catch (error: any) {
      console.error('Error assigning proprietor:', error);
      toast.error(`Failed to assign proprietor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const { error } = await supabase
        .from('proprietor_properties')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success('Assignment removed');
      await loadAssignments();
      onAssignmentChanged?.();
    } catch (error: any) {
      console.error('Error removing assignment:', error);
      toast.error('Failed to remove assignment');
    }
  };

  const getProprietorName = (proprietor: Proprietor) => {
    const profile = proprietor.profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return proprietor.business_name || 'Unknown';
  };

  const getAssignmentProprietorName = (assignment: ProprietorProperty) => {
    const profile = assignment.proprietor?.profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return assignment.proprietor?.business_name || 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Assign Proprietor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Proprietor to Property</DialogTitle>
          <DialogDescription>
            Assign one or more proprietors to this property
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Assignments */}
          {assignments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Current Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {getAssignmentProprietorName(assignment)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Ownership: {assignment.ownership_percentage}%
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAssignment(assignment.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* New Assignment Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Add New Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Proprietor</label>
                <Select value={selectedProprietor} onValueChange={setSelectedProprietor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a proprietor" />
                  </SelectTrigger>
                  <SelectContent>
                    {proprietors.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {getProprietorName(prop)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ownership Percentage (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={ownershipPercentage}
                  onChange={(e) => setOwnershipPercentage(e.target.value)}
                  placeholder="100"
                />
              </div>

              <Button
                onClick={handleAssignProprietor}
                disabled={!selectedProprietor || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Proprietor
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
