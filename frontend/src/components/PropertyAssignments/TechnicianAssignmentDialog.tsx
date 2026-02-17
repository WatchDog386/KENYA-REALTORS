import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
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
  const [categories, setCategories] = useState<TechnicianCategory[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assignments, setAssignments] = useState<TechnicianPropertyAssignment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => {
    if (open) {
      loadCategoriesAndTechnicians();
      loadAssignments();
    }
  }, [open]);

  useEffect(() => {
    if (selectedCategory) {
      filterTechniciansByCategory();
    } else {
      setTechnicians([]);
      setSelectedTechnician('');
    }
  }, [selectedCategory]);

  const loadCategoriesAndTechnicians = async () => {
    try {
      setFetchingData(true);
      const { data: categories, error: catError } = await supabase
        .from('technician_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (catError) throw catError;
      setCategories(categories || []);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load technician categories');
    } finally {
      setFetchingData(false);
    }
  };

  const filterTechniciansByCategory = async () => {
    try {
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
        .eq('category_id', selectedCategory)
        .eq('status', 'active')
        .eq('is_available', true)
        .order('profiles.first_name', { ascending: true });

      if (error) throw error;
      
      // Map the data structure
      const mappedTechnicians = (data || []).map(tech => ({
        ...tech,
        category: tech.technician_categories,
        profile: tech.profiles
      }));
      
      setTechnicians(mappedTechnicians);
    } catch (error: any) {
      console.error('Error filtering technicians:', error);
      toast.error('Failed to load technicians');
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
                <CardTitle className="text-sm">Current Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {getAssignmentTechnicianName(assignment)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Category: {assignment.technician?.category?.name || 'N/A'}
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
                <label className="text-sm font-medium">Technician Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                        {cat.description && <span className="text-xs"> - {cat.description}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCategory && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Technician</label>
                  <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map(tech => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {getTechnicianName(tech)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
