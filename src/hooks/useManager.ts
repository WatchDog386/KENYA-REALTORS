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
    tenants: number;
    occupancy: number;
    revenue: number;
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
      const { data, error } = await supabase.rpc(
        "get_manager_dashboard_stats",
        { manager_id: userId }
      );

      if (error) throw error;

      return (
        data || {
          managedProperties: 0,
          activeTenants: 0,
          pendingRent: 0,
          maintenanceCount: 0,
          totalRevenue: 0,
          occupancyRate: 0,
          properties: [],
        }
      );
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

      // Fetch pending maintenance requests
      const { data: maintenance, error: maintenanceError } = await supabase
        .from("maintenance_requests")
        .select(
          `
          id,
          title,
          priority,
          property:properties!maintenance_requests_property_id_fkey (
            name
          )
        `
        )
        .eq("assigned_to", userId)
        .in("status", ["pending", "assigned"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (!maintenanceError && maintenance) {
        maintenance.forEach((mr) => {
          tasks.push({
            id: mr.id,
            task: mr.title,
            property: mr.property?.name || "Unknown Property",
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
        .select(
          `
          id,
          title,
          scheduled_date,
          property:properties!maintenance_requests_property_id_fkey (
            name
          )
        `
        )
        .eq("assigned_to", userId)
        .not("scheduled_date", "is", null)
        .gte("scheduled_date", new Date().toISOString())
        .order("scheduled_date", { ascending: true })
        .limit(3);

      if (!inspectionsError && inspections) {
        inspections.forEach((inspection) => {
          const date = new Date(inspection.scheduled_date);
          events.push({
            id: inspection.id,
            title: `Inspection: ${inspection.title}`,
            description: `${inspection.property?.name}`,
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

      const { data, error } = await supabase
        .from("properties")
        .select(
          `
          *,
          tenants:tenant_properties(
            tenant:users!tenant_properties_tenant_id_fkey (
              id,
              first_name,
              last_name,
              email
            )
          )
        `
        )
        .eq("property_manager_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
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

      let query = supabase
        .from("maintenance_requests")
        .select(
          `
          *,
          property:properties!maintenance_requests_property_id_fkey (
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
        .in(
          "property_id",
          supabase
            .from("properties")
            .select("id")
            .eq("property_manager_id", user.id)
        )
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

      if (error) throw error;
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
