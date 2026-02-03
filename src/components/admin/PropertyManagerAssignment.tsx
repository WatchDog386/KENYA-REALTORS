// src/components/admin/PropertyManagerAssignment.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Link2, Building2 } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  address: string;
}

interface PropertyManagerAssignmentProps {
  managerId: string;
  managerName: string;
  onAssignmentComplete?: () => void;
}

export function PropertyManagerAssignment({
  managerId,
  managerName,
  onAssignmentComplete
}: PropertyManagerAssignmentProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [currentAssignments, setCurrentAssignments] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all active properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('id, name, address')
        .eq('status', 'active')
        .order('name');

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // 2. Fetch current assignments for this manager
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('manager_assignments')
        .select('property_id')
        .eq('manager_id', managerId)
        .eq('status', 'active');

      if (assignmentError) throw assignmentError;

      const currentPropIds = (assignmentData || []).map(a => a.property_id);
      setCurrentAssignments(currentPropIds);
      setSelectedProperties(currentPropIds);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProperties = async () => {
    setAssigning(true);
    try {
      // 1. Revoke all current assignments
      if (currentAssignments.length > 0) {
        const { error: revokeError } = await supabase
          .from('manager_assignments')
          .update({ status: 'inactive', revoked_at: new Date().toISOString() })
          .eq('manager_id', managerId)
          .eq('status', 'active');

        if (revokeError) throw revokeError;
      }

      // 2. Create new assignments
      const newAssignments = selectedProperties.map(propertyId => ({
        manager_id: managerId,
        property_id: propertyId,
        assigned_by: (await supabase.auth.getUser()).data.user?.id,
        assignment_date: new Date().toISOString(),
        status: 'active',
        approved_at: new Date().toISOString(),
      }));

      if (newAssignments.length > 0) {
        const { error: insertError } = await supabase
          .from('manager_assignments')
          .insert(newAssignments);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Properties Assigned',
        description: `Successfully assigned ${selectedProperties.length} properties to ${managerName}`,
        className: 'bg-green-50 border-green-200'
      });

      setOpen(false);
      onAssignmentComplete?.();
    } catch (error: any) {
      toast({
        title: 'Assignment Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setAssigning(false);
    }
  };

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Link2 className="h-4 w-4" />
          Assign Properties
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Properties to {managerName}</DialogTitle>
          <DialogDescription>
            Select which properties this manager will be responsible for managing
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {properties.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p>No properties available</p>
              </div>
            ) : (
              properties.map(property => (
                <div
                  key={property.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Checkbox
                    id={property.id}
                    checked={selectedProperties.includes(property.id)}
                    onCheckedChange={() => handlePropertyToggle(property.id)}
                  />
                  <label
                    htmlFor={property.id}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="font-medium text-slate-900">{property.name}</p>
                    <p className="text-sm text-slate-600">{property.address}</p>
                  </label>
                </div>
              ))
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={assigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignProperties}
            disabled={assigning || selectedProperties.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {assigning ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Assign {selectedProperties.length} Propert{selectedProperties.length !== 1 ? 'ies' : 'y'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
