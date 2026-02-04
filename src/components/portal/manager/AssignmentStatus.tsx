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

const AssignmentStatus: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadAssignments();
    }
  }, [user?.id]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      
      // Fetch all property assignments for this manager
      const { data, error } = await supabase
        .from("property_manager_assignments")
        .select(`
          id,
          property_id,
          assigned_at,
          properties(id, name, address)
        `)
        .eq("property_manager_id", user?.id)
        .order("assigned_at", { ascending: false });

      if (error) throw error;

      const formattedAssignments: Assignment[] = (data || []).map((a: any) => ({
        id: a.id,
        property_id: a.property_id,
        property_name: a.properties?.name || "Unknown Property",
        property_address: a.properties?.address || "Unknown Address",
        assigned_at: a.assigned_at,
      }));

      setAssignments(formattedAssignments);
    } catch (err) {
      console.error("Error loading assignments:", err);
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
