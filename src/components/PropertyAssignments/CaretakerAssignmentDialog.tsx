import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Caretaker {
  id: string;
  user_id: string;
  property_id?: string;
  status: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface CaretakerAssignmentProps {
  propertyId: string;
  onAssignmentChanged?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CaretakerAssignmentDialog: React.FC<CaretakerAssignmentProps> = ({
  propertyId,
  onAssignmentChanged,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [currentCaretaker, setCurrentCaretaker] = useState<Caretaker | null>(null);
  const [selectedCaretaker, setSelectedCaretaker] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => {
    if (open) {
      loadCaretakers();
      loadCurrentAssignment();
    }
  }, [open]);

  const loadCaretakers = async () => {
    try {
      setFetchingData(true);
      const { data, error } = await supabase
        .from('caretakers')
        .select(`
          id,
          user_id,
          property_id,
          status,
          profiles:user_id(first_name, last_name, email)
        `)
        .eq('status', 'active')
        .or('property_id.is.null,property_id.eq.' + propertyId)
        .order('profiles.first_name', { ascending: true });

      if (error) throw error;
      
      // Map the data
      const mappedCaretakers = (data || []).map(c => ({
        ...c,
        profile: c.profiles
      }));
      
      setCaretakers(mappedCaretakers);
    } catch (error: any) {
      console.error('Error loading caretakers:', error);
      toast.error('Failed to load caretakers');
    } finally {
      setFetchingData(false);
    }
  };

  const loadCurrentAssignment = async () => {
    try {
      const { data, error } = await supabase
        .from('caretakers')
        .select(`
          id,
          user_id,
          property_id,
          status,
          profiles:user_id(first_name, last_name, email)
        `)
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .single();

      if (!error && data) {
        setCurrentCaretaker({
          ...data,
          profile: data.profiles
        });
      }
    } catch (error: any) {
      // No current assignment is fine
    }
  };

  const handleAssignCaretaker = async () => {
    if (!selectedCaretaker) {
      toast.error('Please select a caretaker');
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

      // If there's a current caretaker, remove them from the property
      if (currentCaretaker && currentCaretaker.user_id !== selectedCaretaker) {
        const { error: updateError } = await supabase
          .from('caretakers')
          .update({ property_id: null })
          .eq('id', currentCaretaker.id);

        if (updateError) throw updateError;
      }

      // Assign new caretaker
      const { error } = await supabase
        .from('caretakers')
        .update({
          property_id: propertyId,
          assigned_by: profile?.id,
          assignment_date: new Date().toISOString()
        })
        .eq('id', selectedCaretaker);

      if (error) throw error;

      toast.success('Caretaker assigned successfully');
      setSelectedCaretaker('');
      await loadCaretakers();
      await loadCurrentAssignment();
      onAssignmentChanged?.();
    } catch (error: any) {
      console.error('Error assigning caretaker:', error);
      toast.error(`Failed to assign caretaker: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!currentCaretaker) return;
    if (!confirm('Are you sure you want to remove this caretaker?')) return;

    try {
      const { error } = await supabase
        .from('caretakers')
        .update({ property_id: null })
        .eq('id', currentCaretaker.id);

      if (error) throw error;

      toast.success('Caretaker removed');
      setCurrentCaretaker(null);
      await loadCaretakers();
      onAssignmentChanged?.();
    } catch (error: any) {
      console.error('Error removing caretaker:', error);
      toast.error('Failed to remove caretaker');
    }
  };

  const getCaretakerName = (caretaker: Caretaker) => {
    const profile = caretaker.profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return 'Unknown';
  };

  const getAvailableCaretakers = () => {
    return caretakers.filter(c => !c.property_id || c.property_id === propertyId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Assign Caretaker
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Caretaker to Property</DialogTitle>
          <DialogDescription>
            Each property can only have one caretaker
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A caretaker can only be assigned to one property at a time. Assigning a caretaker to this property will remove them from any other property.
            </AlertDescription>
          </Alert>

          {/* Current Assignment */}
          {currentCaretaker && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-900">Current Caretaker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 border border-green-200 rounded bg-white">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {getCaretakerName(currentCaretaker)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Email: {currentCaretaker.profile?.email || 'N/A'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAssignment}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignment Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {currentCaretaker ? 'Change Caretaker' : 'Assign New Caretaker'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Caretaker</label>
                <Select value={selectedCaretaker} onValueChange={setSelectedCaretaker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a caretaker" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableCaretakers().map(caretaker => (
                      <SelectItem key={caretaker.id} value={caretaker.id}>
                        {getCaretakerName(caretaker)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAssignCaretaker}
                disabled={!selectedCaretaker || loading}
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
                    {currentCaretaker ? 'Change Caretaker' : 'Assign Caretaker'}
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
