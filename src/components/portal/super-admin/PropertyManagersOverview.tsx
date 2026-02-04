// src/components/portal/super-admin/PropertyManagersOverview.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  Plus,
  RefreshCw,
  Search,
  Loader2,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QuickPropertyAssignment from "./QuickPropertyAssignment";

interface PropertyManager {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  status: string;
  assigned_properties_count: number;
  assigned_properties: Array<{
    id: string;
    name: string;
    address: string;
  }>;
}

const PropertyManagersOverview: React.FC = () => {
  const [managers, setManagers] = useState<PropertyManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredManagers, setFilteredManagers] = useState<PropertyManager[]>([]);

  useEffect(() => {
    loadManagers();
  }, []);

  useEffect(() => {
    let filtered = managers;

    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${m.first_name} ${m.last_name}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    setFilteredManagers(filtered);
  }, [searchQuery, managers]);

  const loadManagers = async () => {
    try {
      setLoading(true);

      // Fetch all property managers
      const { data: managersData, error: managersError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, is_active, status")
        .eq("role", "property_manager")
        .order("first_name");

      if (managersError) throw managersError;

      // Fetch assignments for each manager
      const managersWithAssignments = await Promise.all(
        (managersData || []).map(async (manager: any) => {
          const { data: assignments, error: assignmentsError } = await supabase
            .from("property_manager_assignments")
            .select(
              `
              property_id,
              properties(id, name, address)
            `
            )
            .eq("property_manager_id", manager.id);

          if (assignmentsError) {
            console.warn(`Error loading assignments for ${manager.id}:`, assignmentsError);
            return {
              ...manager,
              assigned_properties_count: 0,
              assigned_properties: [],
            };
          }

          const properties = (assignments || [])
            .filter((a: any) => a.properties)
            .map((a: any) => ({
              id: a.properties.id,
              name: a.properties.name,
              address: a.properties.address,
            }));

          return {
            ...manager,
            assigned_properties_count: properties.length,
            assigned_properties: properties,
          };
        })
      );

      setManagers(managersWithAssignments);
    } catch (err) {
      console.error("Error loading managers:", err);
      toast.error("Failed to load property managers");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentComplete = () => {
    // Reload the list after assignment
    loadManagers();
  };

  if (loading) {
    return (
      <Card className="bg-white rounded-2xl border border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#154279]">
            Property Managers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#154279]" />
            <span className="ml-3 text-slate-600">Loading managers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <Card className="bg-gradient-to-r from-[#154279] to-[#0f325e] text-white rounded-2xl border-none shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6" />
                Property Manager Management
              </CardTitle>
              <CardDescription className="text-blue-100 mt-1">
                Assign properties and manage property managers
              </CardDescription>
            </div>
            <Button
              onClick={loadManagers}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-2.5 text-sm rounded-xl border-slate-300 focus:border-[#154279] shadow-sm"
        />
      </div>

      {/* MANAGERS LIST */}
      {filteredManagers.length === 0 ? (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {managers.length === 0
              ? "No property managers found. Create property managers first."
              : "No property managers match your search."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredManagers.map((manager) => (
            <motion.div
              key={manager.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white rounded-2xl border-2 border-slate-200 shadow-md hover:shadow-lg hover:border-[#154279] transition-all p-6"
            >
              {/* MANAGER INFO ROW */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#154279]/10 rounded-lg">
                      <User className="w-5 h-5 text-[#154279]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-base">
                        {manager.first_name} {manager.last_name || ""}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        {manager.email}
                      </p>
                    </div>
                  </div>

                  {/* STATUS BADGES */}
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {manager.is_active ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-gray-300 text-gray-700"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                      Status: {manager.status || "pending"}
                    </Badge>
                  </div>
                </div>

                {/* ASSIGNED PROPERTIES COUNT */}
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#154279]">
                    {manager.assigned_properties_count}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {manager.assigned_properties_count === 1
                      ? "Property"
                      : "Properties"}
                  </p>
                </div>
              </div>

              {/* ASSIGNED PROPERTIES */}
              {manager.assigned_properties_count > 0 ? (
                <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-sm text-green-900 mb-3">
                    Assigned Properties
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {manager.assigned_properties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-start gap-2 p-2 bg-white rounded-lg border border-green-200"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-slate-900 truncate">
                            {property.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {property.address}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-900">
                    ⏳ No properties assigned yet
                  </p>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  {manager.status === "active"
                    ? "Ready to manage properties"
                    : "Activate to assign properties"}
                </p>
                <QuickPropertyAssignment
                  managerId={manager.id}
                  managerName={`${manager.first_name} ${manager.last_name || ""}`}
                  onAssignmentComplete={handleAssignmentComplete}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* STATS SECTION */}
      {managers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#154279]">
                  {managers.length}
                </div>
                <p className="text-sm text-blue-700 font-medium mt-1">
                  Total Managers
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-700">
                  {managers.filter((m) => m.is_active).length}
                </div>
                <p className="text-sm text-green-700 font-medium mt-1">
                  Active Managers
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-700">
                  {managers.reduce((sum, m) => sum + m.assigned_properties_count, 0)}
                </div>
                <p className="text-sm text-amber-700 font-medium mt-1">
                  Total Assigned Properties
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PropertyManagersOverview;
