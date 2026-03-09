// src/components/portal/manager/AssignmentStatus.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Assignment {
  id: string;
  property_id: string;
  property_name: string;
  property_address: string;
  assigned_at: string;
}

interface AssignmentStatusProps {
  properties?: Array<{
    id: string;
    name: string;
    location?: string;
    address?: string;
    total_units?: number;
    status: string;
  }>;
  loading?: boolean;
}

const AssignmentStatus: React.FC<AssignmentStatusProps> = ({ properties: parentProperties, loading: parentLoading }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Use parent properties immediately if available
  useEffect(() => {
    if (parentProperties && parentProperties.length > 0) {
      console.log("Using parent properties:", parentProperties);
      const formattedAssignments: Assignment[] = parentProperties.map((prop: any) => ({
        id: prop.id,
        property_id: prop.id,
        property_name: prop.name,
        property_address: prop.location || prop.address || "Unknown Address",
        assigned_at: new Date().toISOString(),
      }));
      setAssignments(formattedAssignments);
      setLoading(false);
    } else if (parentLoading === false && (!parentProperties || parentProperties.length === 0)) {
      // Parent finished loading and found nothing, so we should try fetching ourselves
      // just in case parent data was incomplete
      loadAssignments();
    }
  }, [parentProperties, parentLoading]);

  useEffect(() => {
    const setupRealtimeParams = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.id) return;

      // Initial load
      if (!parentProperties || parentProperties.length === 0) {
        loadAssignments(currentUser.id);
      }
      
      // Set up real-time subscription
      const subscription = supabase
        .channel(`property_assignments_${currentUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "property_manager_assignments",
            filter: `property_manager_id=eq.${currentUser.id}`,
          },
          (payload) => {
            console.log("Assignment change detected:", payload);
            loadAssignments(currentUser.id);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    setupRealtimeParams();
  }, []);

  const loadAssignments = async (userId?: string) => {
    try {
      // If we already have parent properties, don't overwrite with empty DB call results unless necessary
      if (parentProperties && parentProperties.length > 0) return;

      const targetUserId = userId || user?.id || (await supabase.auth.getUser()).data.user?.id;
      if (!targetUserId) {
        console.warn("No user ID available for loading assignments");
        return;
      }
      
      setLoading(true);
      
      // 1. First get the assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("property_manager_assignments")
        .select("id, property_id, assigned_at")
        .eq("property_manager_id", targetUserId)
        .order("assigned_at", { ascending: false });

      if (assignmentError) {
        console.error("Assignment fetch error:", assignmentError);
        throw assignmentError;
      }

      if (!assignmentData || assignmentData.length === 0) {
        console.log("No assignments found for user:", targetUserId);
        // Only clear assignments if we don't have parent properties
        if (!parentProperties || parentProperties.length === 0) {
           setAssignments([]);
        }
        setLoading(false);
        return;
      }

      console.log("Found assignments:", assignmentData);

      // 2. Then get the property details
      const propertyIds = assignmentData.map(a => a.property_id).filter(Boolean);
      
      console.log("Property IDs to fetch:", propertyIds);
      
      // If no valid property IDs, return early
      if (propertyIds.length === 0) {
        console.warn("No valid property IDs in assignments");
        setAssignments([]);
        setLoading(false);
        return;
      }
      
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("id, name, location")
        .in("id", propertyIds);

      if (propertiesError) {
        console.error("Properties query error:", propertiesError);
        console.error("Property IDs:", propertyIds);
        
        // Error handling fallback: show assignments even if details can't be fetched
        const placeholderAssignments = assignmentData.map((a: any) => ({
             id: a.id,
             property_id: a.property_id,
             property_name: "Property Details Unavailable",
             property_address: "Error fetching details (RLS)",
             assigned_at: a.assigned_at
        }));
        setAssignments(placeholderAssignments);
        setLoading(false);
        return; 
      }

      console.log("Fetched properties:", propertiesData);

      // 3. Combine the data
      const formattedAssignments: Assignment[] = assignmentData.map((a: any) => {
        const prop = propertiesData?.find(p => p.id === a.property_id);
        return {
          id: a.id,
          property_id: a.property_id,
          property_name: prop?.name || "Unknown Property",
          property_address: prop?.location || prop?.address || "Unknown Address",
          assigned_at: a.assigned_at,
        };
      });

      setAssignments(formattedAssignments);
    } catch (err) {
      console.error("Error loading assignments:", err);
      // Fallback to parent properties if query fails and we have them
      if (parentProperties && parentProperties.length > 0) {
         const formatted: Assignment[] = parentProperties.map((prop: any) => ({
          id: prop.id,
          property_id: prop.id,
          property_name: prop.name,
          property_address: prop.location || prop.address || "Unknown Address",
          assigned_at: new Date().toISOString(),
        }));
        setAssignments(formatted);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white rounded-2xl border border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#154279] flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            My Assigned Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#154279]" />
            <span className="ml-3 text-slate-600">Loading assignments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card className="bg-white rounded-2xl border border-amber-200 shadow-lg">
        <CardHeader className="bg-amber-50/50">
          <CardTitle className="text-xl font-bold text-amber-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Waiting for Property Assignment
          </CardTitle>
          <CardDescription className="text-amber-800">
            Your account is active and you can access the portal, but you're waiting for properties to be assigned.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Alert className="border-amber-300 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900 font-semibold">No Properties Yet</AlertTitle>
            <AlertDescription className="text-amber-800 mt-2">
              Your super admin will assign properties for you to manage. Once properties are assigned, you'll see them here and can start managing tenants, maintenance, and payments.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl border border-green-200 shadow-lg">
      <CardHeader className="bg-green-50/50">
        <CardTitle className="text-xl font-bold text-green-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          My Assigned Properties
        </CardTitle>
        <CardDescription className="text-green-800">
          You are assigned to manage {assignments.length} propert{assignments.length !== 1 ? "ies" : "y"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="p-4 border border-green-200 rounded-xl bg-green-50/50 hover:bg-green-50 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">
                    {assignment.property_name}
                  </h3>
                  <p className="text-sm text-slate-600 truncate">
                    {assignment.property_address}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                    <span className="text-xs text-slate-500">
                      Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentStatus;
