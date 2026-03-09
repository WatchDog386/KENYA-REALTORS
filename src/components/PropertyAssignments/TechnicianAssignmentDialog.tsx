import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Badge } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface TechnicianCategory {
  id: string;
  name: string;
  description?: string;
}

interface Technician {
  id: string;
  user_id: string;
  category_id: string;
  is_available: boolean;
  status: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  category?: TechnicianCategory;
}

interface TechnicianPropertyAssignment {
  id: string;
  technician_id: string;
  property_id: string;
  assigned_at: string;
  is_active: boolean;
  technician?: {
    category_id: string;
    profile?: {
      first_name?: string;
      last_name?: string;
      email?: string;
    };
    category?: TechnicianCategory;
  };
}

interface TechnicianAssignmentDialogProps {
  propertyId: string;
  onAssignmentChanged?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const TechnicianAssignmentDialog: React.FC<TechnicianAssignmentDialogProps> = ({
  propertyId,
  onAssignmentChanged,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assignments, setAssignments] = useState<TechnicianPropertyAssignment[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); // Read-only, derived from selected technician
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => {
    if (open) {
      loadAllActiveTechnicians();
      loadAssignments();
    }
  }, [open]);

  useEffect(() => {
    // When technician is selected, auto-populate the category
    if (selectedTechnician) {
      const technician = technicians.find(t => t.id === selectedTechnician);
      if (technician?.category) {
        setSelectedCategory(technician.category.name);
      }
    } else {
      setSelectedCategory('');
    }
  }, [selectedTechnician, technicians]);

  const loadAllActiveTechnicians = async () => {
    try {
      setFetchingData(true);
      const { data, error } = await supabase
        .from('technicians')
        .select(`
          id,
          user_id,
          category_id,
          is_available,
          status,
          profiles:user_id(first_name, last_name, email),
          technician_categories:category_id(id, name, description)
        `)
        .eq('status', 'active')
        .eq('is_available', true)
        .order('technician_categories.name', { ascending: true })
        .then(response => {
          // Additional client-side order by first name
          if (response.data) {
            response.data = response.data.sort((a: any, b: any) => {
              const nameA = a.profiles?.first_name || '';
              const nameB = b.profiles?.first_name || '';
              return nameA.localeCompare(nameB);
            });
          }
          return response;
        });

      if (error) throw error;
      
      // Map the data structure
      const mappedTechnicians = (data || []).map(tech => ({
        ...tech,
        category: tech.technician_categories,
        profile: tech.profiles
      }));
      
      setTechnicians(mappedTechnicians);
    } catch (error: any) {
      console.error('Error loading technicians:', error);
      toast.error('Failed to load technicians');
    } finally {
      setFetchingData(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('technician_property_assignments')
        .select(`
          id,
          technician_id,
          property_id,
          assigned_at,
          is_active,
          technicians(
            category_id,
            profiles:user_id(first_name, last_name, email),
            technician_categories:category_id(id, name, description)
          )
        `)
        .eq('property_id', propertyId)
        .eq('is_active', true);

      if (error) throw error;
      
      // Map the data structure
      const mappedAssignments = (data || []).map(assign => ({
        ...assign,
        technician: {
          ...assign.technician,
          category: assign.technician?.technician_categories,
          profile: assign.technician?.profiles
        }
      }));
      
      setAssignments(mappedAssignments);
    } catch (error: any) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) {
      toast.error('Please select a technician');
      return;
    }

    // Check if already assigned
    if (assignments.some(a => a.technician_id === selectedTechnician)) {
      toast.error('This technician is already assigned to this property');
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
        .from('technician_property_assignments')
        .insert([
          {
            technician_id: selectedTechnician,
            property_id: propertyId,
            assigned_by: profile?.id,
            is_active: true,
          }
        ]);

      if (error) throw error;

      toast.success('Technician assigned successfully');
      setSelectedTechnician('');
      setSelectedCategory('');
      await loadAssignments();
      onAssignmentChanged?.();
    } catch (error: any) {
      console.error('Error assigning technician:', error);
      toast.error(`Failed to assign technician: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const { error } = await supabase
        .from('technician_property_assignments')
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

  const getTechnicianName = (technician: Technician) => {
    const profile = technician.profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return 'Unknown';
  };

  const getAssignmentTechnicianName = (assignment: TechnicianPropertyAssignment) => {
    const profile = assignment.technician?.profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return 'Unknown';
  };

  const getCategoryColor = (categoryName?: string): string => {
    const colors: { [key: string]: string } = {
      'Plumbing': 'bg-blue-100 text-blue-800',
      'Electrical': 'bg-yellow-100 text-yellow-800',
      'HVAC': 'bg-purple-100 text-purple-800',
      'Carpentry': 'bg-orange-100 text-orange-800',
      'Tile Fixing': 'bg-pink-100 text-pink-800',
      'Painting': 'bg-red-100 text-red-800',
      'Lift Maintenance': 'bg-indigo-100 text-indigo-800',
      'Roofing': 'bg-amber-100 text-amber-800',
      'Pest Control': 'bg-green-100 text-green-800',
      'Masonry': 'bg-stone-100 text-stone-800',
      'Landscaping': 'bg-lime-100 text-lime-800',
      'General Maintenance': 'bg-gray-100 text-gray-800',
    };
    return colors[categoryName || ''] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Assign Technician
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Technician to Property</DialogTitle>
          <DialogDescription>
            Assign technicians from different specializations to this property
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Assignments */}
          {assignments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Current Assignments ({assignments.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {getAssignmentTechnicianName(assignment)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                            assignment.technician?.category?.name
                          )}`}
                        >
                          {assignment.technician?.category?.name || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                        </span>
                      </div>
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
                <label className="text-sm font-medium">Select Technician</label>
                <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {getTechnicianName(tech)} • {tech.category?.name || 'Unassigned'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Technicians are listed with their specialization
                </p>
              </div>

              {selectedTechnician && selectedCategory && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg">
                  <p className="text-xs text-blue-600 font-semibold mb-2 uppercase tracking-wide">
                    Selected Specialization
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getCategoryColor(
                      selectedCategory
                    )}`}
                  >
                    {selectedCategory}
                  </span>
                </div>
              )}

              <Button
                onClick={handleAssignTechnician}
                disabled={!selectedTechnician || loading}
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
                    Assign Technician
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
