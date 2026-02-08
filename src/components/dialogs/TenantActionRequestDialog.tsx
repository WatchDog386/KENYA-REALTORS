import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TenantActionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  managerId: string;
  onSuccess?: () => void;
}

export const TenantActionRequestDialog: React.FC<TenantActionRequestDialogProps> = ({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  propertyId,
  managerId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<'tenant_remove' | 'tenant_suspend'>('tenant_suspend');
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for this action');
      return;
    }

    setLoading(true);
    try {
      // Create approval request for tenant action
      const { error } = await supabase
        .from('approvals')
        .insert({
          user_id: managerId,
          approval_type: 'tenant',
          action_type: actionType,
          tenant_id: tenantId,
          property_id: propertyId,
          status: 'pending',
          notes: reason,
          metadata: {
            requested_by_manager: true,
            tenant_name: tenantName,
            requested_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      toast.success(`Request to ${actionType === 'tenant_remove' ? 'remove' : 'suspend'} tenant submitted for approval`);
      onOpenChange(false);
      setReason('');
      setActionType('tenant_suspend');
      onSuccess?.();
    } catch (err) {
      console.error('Error submitting tenant action request:', err);
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Tenant Action</DialogTitle>
          <DialogDescription>
            Request approval from super admin to {'{'}remove or suspend{'}'} {tenantName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Action Type Selection */}
          <div className="space-y-3">
            <Label>Action Type *</Label>
            <RadioGroup value={actionType} onValueChange={(value: any) => setActionType(value)}>
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="tenant_suspend" id="suspend" />
                <Label htmlFor="suspend" className="flex-1 cursor-pointer">
                  <div className="font-medium">Suspend Tenant</div>
                  <div className="text-sm text-gray-500">Temporarily suspend tenant status (can be reactivated)</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="tenant_remove" id="remove" />
                <Label htmlFor="remove" className="flex-1 cursor-pointer">
                  <div className="font-medium">Remove Tenant</div>
                  <div className="text-sm text-gray-500">Permanently remove tenant from property</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Action *</Label>
            <Textarea
              id="reason"
              placeholder="Provide details about why this action is needed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">Be specific to help super admin make an informed decision</p>
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
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className={actionType === 'tenant_remove' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              `Request ${actionType === 'tenant_remove' ? 'Removal' : 'Suspension'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
