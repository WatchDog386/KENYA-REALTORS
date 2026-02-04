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
      // Get current admin user ID
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      const adminId = adminUser?.id;

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
        assigned_by: adminId,
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

      // 3. IMPORTANT: Auto-approve property manager and update profile to active
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          is_active: true,
          role: 'property_manager',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', managerId);

      if (profileError) throw profileError;

      toast({
        title: 'Manager Approved & Properties Assigned',
        description: `Successfully approved ${managerName} and assigned ${selectedProperties.length} properties`,
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
        <Button size="sm" variant="outline" className="gap-2 rounded-xl text-[#154279] border-[#154279]/20 hover:bg-[#154279]/5 hover:text-[#154279] shadow-sm">
          <Link2 className="h-4 w-4" />
          Assign Properties
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-white rounded-2xl shadow-xl border-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#154279]">Assign Properties to {managerName}</DialogTitle>
          <DialogDescription>
            Select which properties this manager will be responsible for managing.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#154279]" />
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto px-1 py-2 custom-scroll">
            {properties.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p>No properties available</p>
              </div>
            ) : (
              properties.map(property => (
                <div
                  key={property.id}
                  className={`
                    flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer group
                    ${selectedProperties.includes(property.id) 
                      ? 'bg-[#154279]/5 border-[#154279] shadow-sm' 
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}
                  `}
                  onClick={() => handlePropertyToggle(property.id)}
                >
                  <Checkbox
                    id={property.id}
                    checked={selectedProperties.includes(property.id)}
                    className="data-[state=checked]:bg-[#F96302] data-[state=checked]:border-[#F96302]"
                    onCheckedChange={() => handlePropertyToggle(property.id)}
                  />
                  <label
                    htmlFor={property.id}
                    className="flex-1 cursor-pointer"
                  >
                    <p className={`font-bold transition-colors ${selectedProperties.includes(property.id) ? 'text-[#154279]' : 'text-slate-800'}`}>
                      {property.name}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">{property.address}</p>
                  </label>
                </div>
              ))
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={assigning}
            className="rounded-xl border-slate-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignProperties}
            disabled={assigning || selectedProperties.length === 0}
            className="bg-[#154279] hover:bg-[#0f325e] text-white rounded-xl shadow-lg shadow-blue-900/10"
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
