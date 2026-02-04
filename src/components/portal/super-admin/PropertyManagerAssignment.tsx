// src/components/portal/super-admin/PropertyManagerAssignment.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building,
  User,
  Search,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { HeroBackground } from "@/components/ui/HeroBackground";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PropertyManagerAssignment {
  id: string;
  property_id: string;
  property_manager_id: string;
  property_name: string;
  manager_email: string;
  manager_name: string;
  assigned_at: string;
}

interface Property {
  id: string;
  name: string;
}

interface Manager {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

const PropertyManagerAssignment: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<PropertyManagerAssignment[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAssignments, setFilteredAssignments] = useState<PropertyManagerAssignment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = assignments;

    if (searchQuery) {
      filtered = filtered.filter(
        (a) =>
          a.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.manager_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.manager_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAssignments(filtered);
  }, [searchQuery, assignments]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch properties
      const { data: propsData, error: propsError } = await supabase
        .from("properties")
        .select("id, name")
        .order("name");

      if (propsError) throw propsError;
      setProperties(propsData || []);

      // Fetch property managers (only active property_manager role users)
      const { data: managersData, error: managersError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .eq("role", "property_manager")
        .eq("is_active", true)
        .order("first_name");

      if (managersError) throw managersError;
      setManagers(managersData || []);

      // Fetch assignments with property and manager info
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("property_manager_assignments")
        .select(
          `
          id,
          property_id,
          property_manager_id,
          assigned_at,
          properties(name),
          profiles(email, first_name, last_name)
        `
        )
        .order("assigned_at", { ascending: false });

      if (assignmentsError) throw assignmentsError;

      const formattedAssignments: PropertyManagerAssignment[] = (assignmentsData || []).map(
        (a: any) => ({
          id: a.id,
          property_id: a.property_id,
          property_manager_id: a.property_manager_id,
          property_name: a.properties?.name || "Unknown Property",
          manager_email: a.profiles?.email || "Unknown Email",
          manager_name: `${a.profiles?.first_name || ""} ${a.profiles?.last_name || ""}`.trim(),
          assigned_at: a.assigned_at,
        })
      );

      setAssignments(formattedAssignments);
      setFilteredAssignments(formattedAssignments);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load assignment data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedProperty || !selectedManager) {
      toast.error("Please select both property and manager");
      return;
    }

    try {
      setIsAssigning(true);

      if (editingId) {
        // Update existing assignment
        const { error } = await supabase
          .from("property_manager_assignments")
          .update({
            property_id: selectedProperty,
            property_manager_id: selectedManager,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Assignment updated successfully");
      } else {
        // Create new assignment
        const { error } = await supabase
          .from("property_manager_assignments")
          .insert({
            property_id: selectedProperty,
            property_manager_id: selectedManager,
          });

        if (error) {
          if (error.message.includes("unique")) {
            toast.error("This property manager is already assigned to this property");
          } else {
            throw error;
          }
          return;
        }
        toast.success("Property assigned to manager successfully");
      }

      setSelectedProperty("");
      setSelectedManager("");
      setEditingId(null);
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error assigning property:", error);
      toast.error(error.message || "Failed to assign property");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleEdit = (assignment: PropertyManagerAssignment) => {
    setSelectedProperty(assignment.property_id);
    setSelectedManager(assignment.property_manager_id);
    setEditingId(assignment.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this assignment?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("property_manager_assignments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Assignment removed successfully");
      loadData();
    } catch (error: any) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to remove assignment");
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedProperty("");
    setSelectedManager("");
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <HeroBackground />
      <div className="relative z-10 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Property Manager Assignments
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Assign property managers to properties (one property per manager)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assignments.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Active Managers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{managers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Available Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{properties.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Assignments</CardTitle>
                  <CardDescription>
                    Assign and manage property managers for each property
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleDialogClose()}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingId ? "Edit Assignment" : "Create New Assignment"}
                      </DialogTitle>
                      <DialogDescription>
                        Assign a property manager to a property
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="property">Property *</Label>
                        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                          <SelectTrigger id="property">
                            <SelectValue placeholder="Select a property" />
                          </SelectTrigger>
                          <SelectContent>
                            {properties.map((prop) => (
                              <SelectItem key={prop.id} value={prop.id}>
                                {prop.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="manager">Property Manager *</Label>
                        <Select value={selectedManager} onValueChange={setSelectedManager}>
                          <SelectTrigger id="manager">
                            <SelectValue placeholder="Select a manager" />
                          </SelectTrigger>
                          <SelectContent>
                            {managers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.first_name} {manager.last_name} ({manager.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handleAssign}
                        disabled={isAssigning || !selectedProperty || !selectedManager}
                        className="w-full"
                      >
                        {isAssigning ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {editingId ? "Update Assignment" : "Create Assignment"}
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by property, manager name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {filteredAssignments.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {assignments.length === 0
                      ? "No assignments yet. Create one to get started."
                      : "No assignments match your search."}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Manager Name</TableHead>
                        <TableHead>Manager Email</TableHead>
                        <TableHead>Assigned On</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-2 text-blue-600" />
                              {assignment.property_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-green-600" />
                              {assignment.manager_name}
                            </div>
                          </TableCell>
                          <TableCell>{assignment.manager_email}</TableCell>
                          <TableCell>
                            {new Date(assignment.assigned_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(assignment)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(assignment.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PropertyManagerAssignment;
