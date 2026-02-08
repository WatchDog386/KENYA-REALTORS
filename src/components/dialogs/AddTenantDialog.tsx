import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  managerId: string;
  onSuccess?: () => void;
}

interface AvailableUnit {
  id: string;
  unit_number: string;
  status: string;
}

interface AvailableUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export const AddTenantDialog: React.FC<AddTenantDialogProps> = ({
  open,
  onOpenChange,
  propertyId,
  managerId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<AvailableUnit[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch available units for the property
  useEffect(() => {
    if (!open || !propertyId) return;

    const fetchUnits = async () => {
      setLoadingUnits(true);
      try {
        const { data, error } = await supabase
          .from('units')
          .select('id, unit_number, status')
          .eq('property_id', propertyId)
          .eq('status', 'available')
          .order('unit_number', { ascending: true });

        if (error) throw error;
        setAvailableUnits(data || []);
      } catch (err) {
        console.error('Error fetching units:', err);
        toast.error('Failed to load available units');
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
  }, [open, propertyId]);

  // Fetch available users (users without active tenant records)
  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        // Get all users
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .eq('role', 'tenant')
          .order('first_name', { ascending: true });

        if (profilesError) throw profilesError;

        // Get users who already have tenant records
        const { data: existingTenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('user_id');

        if (tenantsError) throw tenantsError;

        const existingUserIds = new Set((existingTenants || []).map(t => t.user_id));
        const available = (profiles || []).filter(p => !existingUserIds.has(p.id));

        setAvailableUsers(available);
      } catch (err) {
        console.error('Error fetching users:', err);
        toast.error('Failed to load available users');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [open]);

  const handleAddTenant = async () => {
    if (!selectedUnit || !selectedUser || !moveInDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Create tenant record
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          user_id: selectedUser,
          property_id: propertyId,
          unit_id: selectedUnit,
          status: 'active',
          move_in_date: moveInDate
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Update unit status to occupied
      const { error: unitError } = await supabase
        .from('units')
        .update({ status: 'occupied' })
        .eq('id', selectedUnit);

      if (unitError) throw unitError;

      // Create an approval record for tracking
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert({
          user_id: managerId,
          approval_type: 'tenant',
          action_type: 'tenant_add',
          tenant_id: tenantData.id,
          unit_id: selectedUnit,
          property_id: propertyId,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: managerId
        });

      if (approvalError) throw approvalError;

      toast.success('Tenant assigned successfully');
      onOpenChange(false);
      setSelectedUnit('');
      setSelectedUser('');
      setMoveInDate('');
      onSuccess?.();
    } catch (err) {
      console.error('Error adding tenant:', err);
      toast.error('Failed to assign tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Tenant to Unit</DialogTitle>
          <DialogDescription>
            Select a tenant and available unit to create a new tenant assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Select User */}
          <div className="space-y-2">
            <Label htmlFor="user-select">Select Tenant *</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger id="user-select" disabled={loadingUsers}>
                <SelectValue placeholder="Choose a tenant..." />
              </SelectTrigger>
              <SelectContent>
                {loadingUsers ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : availableUsers.length > 0 ? (
                  availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">No available tenants</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Select Unit */}
          <div className="space-y-2">
            <Label htmlFor="unit-select">Select Unit *</Label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger id="unit-select" disabled={loadingUnits}>
                <SelectValue placeholder="Choose a unit..." />
              </SelectTrigger>
              <SelectContent>
                {loadingUnits ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : availableUnits.length > 0 ? (
                  availableUnits.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      Unit {unit.unit_number}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">No available units</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Move-in Date */}
          <div className="space-y-2">
            <Label htmlFor="move-in-date">Move-in Date *</Label>
            <Input
              id="move-in-date"
              type="date"
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddTenant}
            disabled={loading || !selectedUnit || !selectedUser || !moveInDate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Tenant'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
