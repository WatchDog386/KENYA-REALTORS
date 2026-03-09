// src/components/portal/super-admin/QuickPropertyAssignment.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuickPropertyAssignmentProps {
  managerId: string;
  managerName: string;
  onAssignmentComplete?: () => void;
}

interface Property {
  id: string;
  name: string;
}

const QuickPropertyAssignment: React.FC<QuickPropertyAssignmentProps> = ({
  managerId,
  managerName,
  onAssignmentComplete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvailableProperties();
    }
  }, [isOpen]);

  const loadAvailableProperties = async () => {
    try {
      setIsLoading(true);

      // Get all properties
      const { data: allProperties, error: propsError } = await supabase
        .from("properties")
        .select("id, name")
        .order("name");

      if (propsError) throw propsError;

      // Get already assigned properties (to show status, but NOT to filter out)
      const { data: assignments, error: assignError } = await supabase
        .from("property_manager_assignments")
        .select("property_id");

      if (assignError) throw assignError;

      const assignedIds = (assignments || []).map((a) => a.property_id);
      
      // We do NOT filter out assigned properties anymore.
      // This allows re-assignment or multi-assignment if the schema supports it.
      // Duplicates for the SAME manager will be caught by the unique constraint error handling.
      setProperties(allProperties || []);
    } catch (error) {
      console.error("Error loading properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedProperty) {
      toast.error("Please select a property");
      return;
    }

    try {
      setIsAssigning(true);

      // Create assignment
      const { error: assignmentError } = await supabase
        .from("property_manager_assignments")
        .insert({
          property_id: selectedProperty,
          property_manager_id: managerId,
        });

      if (assignmentError) {
        if (assignmentError.message.includes("unique")) {
          toast.error("This property is already assigned");
        } else {
          throw assignmentError;
        }
        return;
      }

      // Update manager's profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          assigned_property_id: selectedProperty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", managerId);

      if (profileError) {
        console.warn("Warning updating profile:", profileError);
      }

      toast.success("✅ Property assigned successfully!");
      setSelectedProperty("");
      setIsOpen(false);

      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    } catch (error: any) {
      console.error("Error assigning property:", error);
      toast.error(`❌ ${error.message || "Failed to assign property"}`);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[#154279] hover:bg-[#0f325e] text-white rounded-lg">
          <Plus className="w-4 h-4 mr-1" /> Assign Property
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-200">
        <DialogHeader>
          <DialogTitle>Assign Property to Manager</DialogTitle>
          <DialogDescription>
            Assign a property to {managerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {properties.length === 0 && !isLoading ? (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                No available properties to assign. All properties are already assigned or don't exist.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div>
                <Label htmlFor="property" className="text-sm font-semibold">
                  Select Property *
                </Label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger
                    id="property"
                    className="mt-2 border-slate-200 focus:border-[#154279]"
                    disabled={isLoading}
                  >
                    <SelectValue placeholder="Choose a property..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <div className="p-2 text-sm text-slate-500">Loading...</div>
                    ) : (
                      properties.map((prop) => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  This will update the property manager's profile with the assigned property.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isAssigning}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={isAssigning || !selectedProperty || properties.length === 0}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign Property"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickPropertyAssignment;
