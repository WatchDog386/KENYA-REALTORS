import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ManagerStats {
  managedProperties: number;
  activeTenants: number;
  pendingRent: number;
  maintenanceCount: number;
  totalRevenue: number;
  occupancyRate: number;
  properties: Array<{
    id: string;
    name: string;
    address?: string;
    location?: string;
    tenants: number;
    occupancy: number;
    revenue: number;
    total_units: number;
    status: string;
    property_unit_types?: any[];
  }>;
}

export interface PendingTask {
  id: string;
  task: string;
  property: string;
  due: string;
  priority: "low" | "medium" | "high" | "urgent";
  type: "maintenance" | "approval" | "inspection" | "report";
}

export interface UpcomingEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: "inspection" | "meeting" | "deadline";
  propertyId?: string;
}

export interface ManagerProfile {
  id: string;
  user_id: string;
  license_number?: string;
  experience_years: number;
  specializations: string[];
  performance_rating: number;
  is_available: boolean;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

export const useManager = (managerId?: string) => {
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManagerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user if no managerId provided
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserId = managerId || user?.id;

      if (!currentUserId) {
        throw new Error("No manager ID provided");
      }

      // Fetch data in parallel
      const [statsData, tasksData, eventsData, profileData] = await Promise.all(
        [
          fetchManagerStats(currentUserId),
          fetchPendingTasks(currentUserId),
          fetchUpcomingEvents(currentUserId),
          fetchManagerProfile(currentUserId),
        ]
      );

      setStats(statsData);
      setPendingTasks(tasksData);
      setUpcomingEvents(eventsData);
      setProfile(profileData);
    } catch (err) {
      console.error("Error fetching manager data:", err);
      setError("Failed to load manager dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [managerId]);

  const fetchManagerStats = async (userId: string): Promise<ManagerStats> => {
    try {
      // Fetch stats directly from assignment table (no RPC needed)
      
      // Get assigned properties
      const { data: assignments, error: assignmentError } = await supabase
        .from("property_manager_assignments")
        .select("property_id")
        .eq("property_manager_id", userId);

      if (assignmentError) {
        console.error("Assignment fetch error:", assignmentError);
        throw assignmentError;
      }

      if (!assignments || assignments.length === 0) {
        console.log("No property assignments found for user:", userId);
        return {
          managedProperties: 0,
          activeTenants: 0,
          pendingRent: 0,
          maintenanceCount: 0,
          totalRevenue: 0,
          occupancyRate: 0,
          properties: [],
        };
      }

      const propertyIds = assignments.map((a: any) => a.property_id).filter(Boolean);
      
      console.log("Found property IDs from assignments:", propertyIds);

      // If no properties, return empty stats
      if (propertyIds.length === 0) {
        console.warn("No valid property IDs in assignments");
        return {
          managedProperties: 0,
          activeTenants: 0,
          pendingRent: 0,
          maintenanceCount: 0,
          totalRevenue: 0,
          occupancyRate: 0,
          properties: [],
        };
      }

      // FETCH DATA IN SEPARATE QUERIES TO AVOID JOIN FAILURES
      
      // 1. Get properties basic info
      const { data: properties, error: propsError } = await supabase
        .from("properties")
        .select("id, name, location")
        .in("id", propertyIds);

      if (propsError) {
        console.error("Properties query error:", propsError);
        throw propsError;
      }

      // 2. Get active active tenants count & info
      // We use a separate query because RLS or join issues might fail the main query
      const { data: activeTenantsList, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, property_id, status")
        .in("property_id", propertyIds)
        .eq("status", "active");
        
      if (tenantsError) {
        console.warn("Error fetching tenants:", tenantsError);
      }

      // 3. Get unit types for revenue calculation
      const { data: unitTypes, error: unitTypesError } = await supabase
        .from("property_unit_types")
        .select("property_id, price_per_unit, total_units_of_type") /* Changed units_count to total_units_of_type for consistency */
        .in("property_id", propertyIds);

      if (unitTypesError) {
         console.warn("Error fetching unit types:", unitTypesError);
      }

      console.log("Fetched properties:", properties);

      // Construct property objects with manual joins
      const enrichedProperties = properties?.map(p => {
         const pTenants = activeTenantsList?.filter(t => t.property_id === p.id) || [];
         const pUnits = unitTypes?.filter(u => u.property_id === p.id) || [];
         
         // Calculate theoretical revenue
         // If we don't know which tenant is in which unit type, we approximate average price
         const totalUnitCount = pUnits.reduce((sum, u) => sum + (u.total_units_of_type || 0), 0);
         const totalPotentialRevenue = pUnits.reduce((sum, u) => sum + ((u.price_per_unit || 0) * (u.total_units_of_type || 0)), 0);
         const avgPrice = totalUnitCount > 0 ? totalPotentialRevenue / totalUnitCount : 0;
         
         const estimatedRevenue = pTenants.length * avgPrice;
         const finalTotalUnits = totalUnitCount || 0;
         
         return {
            id: p.id,
            name: p.name,
            address: p.location,
            location: p.location,
            total_units: finalTotalUnits,
            status: "active",
            tenants: pTenants.length, // Count of active tenants
            occupancy: (finalTotalUnits > 0) ? (pTenants.length / finalTotalUnits) * 100 : 0,
            revenue: estimatedRevenue,
            property_unit_types: pUnits
         };
      }) || [];

      // Calculate aggregate stats
      const managedProperties = enrichedProperties.length;
      const totalActiveTenants = enrichedProperties.reduce((sum, p) => sum + p.tenants, 0);
      const totalRevenue = enrichedProperties.reduce((sum, p) => sum + p.revenue, 0);
      
      const totalUnits = enrichedProperties.reduce((sum, p) => sum + p.total_units, 0);
      const occupancyRate = totalUnits > 0 ? (totalActiveTenants / totalUnits) * 100 : 0;

      return {
        managedProperties,
        activeTenants: totalActiveTenants,
        pendingRent: 0, // Need separate query for this if needed
        maintenanceCount: 0,
        totalRevenue,
        occupancyRate,
        properties: enrichedProperties.map(p => ({
            ...p,
            tenants: p.tenants, // keep as number for the interface
            property_unit_types: p.property_unit_types
        })),
      };
    } catch (err) {
      console.error("Error fetching manager stats:", err);
      return {
        managedProperties: 0,
        activeTenants: 0,
        pendingRent: 0,
        maintenanceCount: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        properties: [],
      };
    }
  };

  const fetchPendingTasks = async (userId: string): Promise<PendingTask[]> => {
    try {
      const tasks: PendingTask[] = [];

      // Fetch pending maintenance requests (fetch property_id only to avoid join errors)
      const { data: maintenance, error: maintenanceError } = await supabase
        .from("maintenance_requests")
        .select("id, title, priority, property_id")
        .eq("assigned_to", userId)
        .in("status", ["pending", "assigned"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (maintenanceError) {
        console.error("Maintenance requests query error:", maintenanceError);
      }

      if (maintenance && maintenance.length > 0) {
        // Fetch property names manually
        const propertyIds = [...new Set(maintenance.map(m => m.property_id).filter(Boolean))];
        
        let propertyMap: Record<string, string> = {};
        if (propertyIds.length > 0) {
            const { data: props } = await supabase
                .from("properties")
                .select("id, name")
                .in("id", propertyIds);
            
            if (props) {
                props.forEach(p => {
                    propertyMap[p.id] = p.name;
                });
            }
        }

        maintenance.forEach((mr) => {
          tasks.push({
            id: mr.id,
            task: mr.title,
            property: propertyMap[mr.property_id] || "Unknown Property",
            due: "ASAP",
            priority: mr.priority as any,
            type: "maintenance",
          });
        });
      }

      // approvals table doesn't exist - skip
      return tasks;
    } catch (err) {
      console.error("Error fetching pending tasks:", err);
      return [];
    }
  };

  const fetchUpcomingEvents = async (
    userId: string
  ): Promise<UpcomingEvent[]> => {
    try {
      const events: UpcomingEvent[] = [];

      // Add scheduled inspections (from maintenance requests)
      const { data: inspections, error: inspectionsError } = await supabase
        .from("maintenance_requests")
        .select("id, title, scheduled_date, property_id")
        .eq("assigned_to", userId)
        .gte("scheduled_date", new Date().toISOString())
        .order("scheduled_date", { ascending: true })
        .limit(3);

      if (!inspectionsError && inspections && inspections.length > 0) {
        // Fetch property names manually
        const propertyIds = [...new Set(inspections.map(i => i.property_id).filter(Boolean))];
        let propertyMap: Record<string, string> = {};
        
        if (propertyIds.length > 0) {
            const { data: props } = await supabase
                .from("properties")
                .select("id, name")
                .in("id", propertyIds);
            
            if (props) {
                props.forEach(p => {
                    propertyMap[p.id] = p.name;
                });
            }
        }

        inspections.forEach((inspection) => {
          const date = new Date(inspection.scheduled_date);
          events.push({
            id: inspection.id,
            title: `Inspection: ${inspection.title}`,
            description: propertyMap[inspection.property_id] || "Unknown Property",
            date: date.toLocaleDateString("en-KE"),
            time: date.toLocaleTimeString("en-KE", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: "inspection",
          });
        });
      }

      // Add monthly report deadline (every 1st of month)
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      events.push({
        id: "report-deadline",
        title: "Monthly Report Due",
        description: "Submit monthly management report",
        date: nextMonth.toLocaleDateString("en-KE"),
        time: "End of day",
        type: "deadline",
      });

      return events;
    } catch (err) {
      console.error("Error fetching upcoming events:", err);
      return [];
    }
  };

  const fetchManagerProfile = async (
    userId: string
  ): Promise<ManagerProfile | null> => {
    try {
      // property_managers table doesn't exist - get profile data instead
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      // Map profile to ManagerProfile interface
      return data
        ? {
            id: data.id,
            user_id: data.id,
            experience_years: 0,
            specializations: [],
            performance_rating: 0,
            is_available: true,
            user: {
              first_name: data.first_name,
              last_name: data.last_name,
              email: data.email,
              phone: data.phone,
            },
          }
        : null;
    } catch (err) {
      console.error("Error fetching manager profile:", err);
      return null;
    }
  };

  const getAssignedProperties = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // First, fetch property IDs from the assignment table
      const { data: assignments, error: assignmentError } = await supabase
        .from("property_manager_assignments")
        .select("property_id")
        .eq("property_manager_id", user.id);

      if (assignmentError) throw assignmentError;

      if (!assignments || assignments.length === 0) {
        return [];
      }

      const propertyIds = assignments.map(a => a.property_id).filter(Boolean);
      
      // If no valid property IDs, return empty
      if (propertyIds.length === 0) {
        return [];
      }

      // Then fetch the property details using separate queries to avoid join issues
      const { data: properties, error: propsError } = await supabase
        .from("properties")
        .select("*")
        .in("id", propertyIds)
        .order("created_at", { ascending: false });

      if (propsError) {
        console.error("Error fetching properties:", propsError);
        throw propsError;
      }

      // Fetch unit types separately
      const { data: unitTypes, error: unitTypesError } = await supabase
        .from("property_unit_types")
        .select("id, property_id, unit_type_name, total_units_of_type, price_per_unit")
        .in("property_id", propertyIds);

      if (unitTypesError) {
        console.warn("Error fetching unit types:", unitTypesError);
      }

      // Fetch tenants separately
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, property_id, user_id, status")
        .in("property_id", propertyIds);

      if (tenantsError) {
        console.warn("Error fetching tenants:", tenantsError);
      }

      // Manually join the data
      const enrichedProperties = properties?.map(p => ({
        ...p,
        property_unit_types: unitTypes?.filter(ut => ut.property_id === p.id) || [],
        tenants: tenants?.filter(t => t.property_id === p.id) || []
      })) || [];

      return enrichedProperties;
    } catch (err) {
      console.error("Error fetching assigned properties:", err);
      toast.error("Failed to load properties");
      return [];
    }
  }, []);

  const updatePropertyDetails = async (propertyId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .update(updates)
        .eq("id", propertyId)
        .select()
        .single();

      if (error) throw error;

      toast.success("Property updated successfully");
      return data;
    } catch (err) {
      console.error("Error updating property:", err);
      toast.error("Failed to update property");
      throw err;
    }
  };

  const getTenantsByProperty = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from("tenant_properties")
        .select(
          `
          *,
          tenant:users!tenant_properties_tenant_id_fkey (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          lease:leases!tenant_properties_lease_id_fkey (
            id,
            rent_amount,
            start_date,
            end_date,
            status
          )
        `
        )
        .eq("property_id", propertyId)
        .eq("status", "active")
        .order("move_in_date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching tenants:", err);
      return [];
    }
  };

  const getMaintenanceRequests = async (filters?: {
    status?: string;
    priority?: string;
    propertyId?: string;
  }) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // First, fetch property IDs assigned to this manager
      const { data: propertyAssignments, error: propError } = await supabase
        .from("property_manager_assignments")
        .select("property_id")
        .eq("property_manager_id", user.id);

      if (propError) {
        console.error("Error fetching property IDs:", propError);
        return [];
      }

      const propertyIds = propertyAssignments?.map(p => p.property_id).filter(Boolean) || [];
      
      // If no properties assigned, return empty
      if (propertyIds.length === 0) {
        return [];
      }

      let query = supabase
        .from("maintenance_requests")
        .select(
          `
          *,
          property:properties (
            id,
            name,
            address
          ),
          tenant:users!maintenance_requests_tenant_id_fkey (
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }
      if (filters?.propertyId) {
        query = query.eq("property_id", filters.propertyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching maintenance requests:", error);
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error("Error fetching maintenance requests:", err);
      return [];
    }
  };

  const updateMaintenanceRequest = async (
    requestId: string,
    updates: Partial<{
      status: string;
      assigned_to: string;
      estimated_cost: number;
      scheduled_date: string;
      notes: string;
    }>
  ) => {
    try {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .update(updates)
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await logAuditAction({
        action: "maintenance_updated",
        entity_type: "maintenance",
        entity_id: requestId,
        details: updates,
      });

      toast.success("Maintenance request updated");
      return data;
    } catch (err) {
      console.error("Error updating maintenance:", err);
      toast.error("Failed to update maintenance request");
      throw err;
    }
  };

  const getPendingRent = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc(
        "get_pending_rent_for_manager",
        { manager_id: user.id }
      );

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching pending rent:", err);
      return [];
    }
  };

  const markRentAsPaid = async (paymentData: {
    tenantId: string;
    propertyId: string;
    amount: number;
    paymentMethod: string;
    referenceId?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .insert([
          {
            ...paymentData,
            status: "completed",
            payment_date: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await logAuditAction({
        action: "rent_paid",
        entity_type: "payment",
        entity_id: data.id,
        details: paymentData,
      });

      toast.success("Rent payment recorded successfully");
      return data;
    } catch (err) {
      console.error("Error recording rent payment:", err);
      toast.error("Failed to record payment");
      throw err;
    }
  };

  const logAuditAction = async (logData: {
    action: string;
    entity_type: string;
    entity_id?: string;
    details?: any;
  }) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      await supabase.from("audit_logs").insert({
        ...logData,
        user_id: user?.id,
        ip_address: "unknown",
        user_agent: navigator.userAgent,
      });
    } catch (err) {
      console.error("Failed to log audit action:", err);
    }
  };

  useEffect(() => {
    fetchManagerData();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("manager-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "properties" },
        () => {
          fetchManagerData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "maintenance_requests" },
        () => {
          fetchManagerData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchManagerData]);

  return {
    stats,
    pendingTasks,
    upcomingEvents,
    profile,
    loading,
    error,
    refetch: fetchManagerData,
    getAssignedProperties,
    updatePropertyDetails,
    getTenantsByProperty,
    getMaintenanceRequests,
    updateMaintenanceRequest,
    getPendingRent,
    markRentAsPaid,
  };
};
