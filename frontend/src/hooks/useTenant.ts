// /src/hooks/useTenant.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TenantData {
  id: string;
  user_id: string;
  property_id?: string;
  lease_id?: string;
  created_at: string;
  updated_at: string;
  property?: PropertyData;
  lease?: LeaseData;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    user_metadata?: {
      first_name?: string;
      last_name?: string;
    };
  };
}

export interface PropertyData {
  id: string;
  name: string;
  address: string;
  unit_number?: string;
  floor?: string;
  property_manager_id?: string;
  created_at: string;
  updated_at: string;
  property_manager?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
}

export interface LeaseData {
  id: string;
  tenant_id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  status: "active" | "expired" | "terminated";
  created_at: string;
  updated_at: string;
}

export interface PaymentData {
  id: string;
  tenant_id: string;
  property_id: string;
  amount: number;
  payment_date: string;
  status: "pending" | "completed" | "overdue" | "failed";
  payment_method: "credit_card" | "bank_transfer" | "cash" | "check";
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRequestData {
  id: string;
  tenant_id: string;
  property_id: string;
  title: string;
  description: string;
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_to?: string;
  estimated_cost?: number;
  actual_cost?: number;
  created_at: string;
  updated_at?: string;
  completed_date?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  user_type: "tenant" | "manager" | "admin" | "super_admin";
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageData {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject?: string;
  content: string;
  read: boolean;
  read_at?: string;
  archived: boolean;
  created_at: string;
  sender?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export const useTenant = () => {
  const { user } = useAuth();
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [leaseData, setLeaseData] = useState<LeaseData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    currentBalance: 0,
    leaseMonthsLeft: 0,
    activeRequests: 0,
    unreadMessages: 0,
    nextPaymentDue: "",
    leaseEndDate: "",
    monthlyRent: 0,
  });

  // Fetch user profile from profiles table
  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If no profile exists, create one
        if (error.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert([
              {
                user_id: user.id,
                user_type: "tenant",
                first_name: user.email?.split("@")[0] || "Tenant",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (createError) throw createError;
          return newProfile;
        }
        throw error;
      }

      return data;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  }, [user?.id]);

  // Main data fetching function
  const fetchTenantData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch user profile
      const profile = await fetchUserProfile();
      setUserProfile(profile);

      // 2. Fetch tenant record
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .select(
          `
          *,
          property:properties(
            *,
            property_manager:profiles(*)
          ),
          lease:leases(*)
        `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (tenantError && tenantError.code !== "PGRST116") {
        console.error("Error fetching tenant:", tenantError);
      }

      setTenantData(tenant || null);
      setPropertyData(tenant?.property || null);
      setLeaseData(tenant?.lease || null);

      const tenantId = tenant?.id;

      // 3. Fetch all statistics in parallel
      const [paymentsResult, maintenanceResult, messagesResult] =
        await Promise.allSettled([
          // Calculate overdue balance
          tenantId
            ? supabase
                .from("rent_payments")
                .select("amount, status")
                .eq("tenant_id", tenantId)
                .eq("status", "overdue")
            : Promise.resolve({ data: [] }),

          // Count active maintenance requests
          tenantId
            ? supabase
                .from("maintenance_requests")
                .select("id", { count: "exact" })
                .eq("tenant_id", tenantId)
                .in("status", ["in_progress", "assigned", "pending"])
            : Promise.resolve({ count: 0 }),

          // Count unread messages
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("receiver_id", user.id)
            .eq("read", false)
            .eq("archived", false),
        ]);

      // 4. Calculate statistics
      let currentBalance = 0;
      if (paymentsResult.status === "fulfilled" && paymentsResult.value.data) {
        currentBalance = paymentsResult.value.data.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        );
      }

      let activeRequests = 0;
      if (
        maintenanceResult.status === "fulfilled" &&
        maintenanceResult.value.count !== null
      ) {
        activeRequests = maintenanceResult.value.count || 0;
      }

      let unreadMessages = 0;
      if (
        messagesResult.status === "fulfilled" &&
        messagesResult.value.count !== null
      ) {
        unreadMessages = messagesResult.value.count || 0;
      }

      // 5. Calculate lease information
      let leaseMonthsLeft = 0;
      let leaseEndDate = "";
      let monthlyRent = 0;

      if (tenant?.lease?.end_date) {
        const today = new Date();
        const leaseEnd = new Date(tenant.lease.end_date);
        leaseMonthsLeft = Math.max(
          0,
          Math.ceil(
            (leaseEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
          )
        );
        leaseEndDate = leaseEnd.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        monthlyRent = tenant.lease.monthly_rent || 0;
      }

      // 6. Calculate next payment date (1st of next month)
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const nextPaymentDue = nextMonth.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      // 7. Update stats
      setStats({
        currentBalance,
        leaseMonthsLeft,
        activeRequests,
        unreadMessages,
        nextPaymentDue,
        leaseEndDate,
        monthlyRent,
      });
    } catch (err: any) {
      console.error("Error fetching tenant data:", err);
      setError(err.message || "Failed to load tenant data");
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchUserProfile]);

  // Fetch recent payments
  const fetchRecentPayments = useCallback(async () => {
    if (!tenantData?.id) return [];

    try {
      const { data, error } = await supabase
        .from("rent_payments")
        .select("*")
        .eq("tenant_id", tenantData.id)
        .order("payment_date", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching recent payments:", err);
      return [];
    }
  }, [tenantData?.id]);

  // Fetch maintenance requests
  const fetchMaintenanceRequests = useCallback(async () => {
    if (!tenantData?.id) return [];

    try {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*")
        .eq("tenant_id", tenantData.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching maintenance requests:", err);
      return [];
    }
  }, [tenantData?.id]);

  // Create new maintenance request
  const createMaintenanceRequest = useCallback(
    async (requestData: {
      title: string;
      description: string;
      priority: "low" | "medium" | "high" | "urgent";
      category?: string;
    }) => {
      if (!tenantData?.id || !propertyData?.id) {
        throw new Error("Tenant or property information not available");
      }

      try {
        const { data, error } = await supabase
          .from("maintenance_requests")
          .insert([
            {
              title: requestData.title,
              description: requestData.description,
              priority: requestData.priority,
              category: requestData.category || "general",
              tenant_id: tenantData.id,
              property_id: propertyData.id,
              status: "pending",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Refresh tenant data to update stats
        await fetchTenantData();
        return data;
      } catch (err: any) {
        console.error("Error creating maintenance request:", err);
        throw err;
      }
    },
    [tenantData, propertyData, fetchTenantData]
  );

  // Make a payment
  const makePayment = useCallback(
    async (paymentData: {
      amount: number;
      payment_method: "credit_card" | "bank_transfer" | "cash" | "check";
      description?: string;
    }) => {
      if (!tenantData?.id || !propertyData?.id) {
        throw new Error("Tenant or property information not available");
      }

      try {
        const { data, error } = await supabase
          .from("rent_payments")
          .insert([
            {
              amount: paymentData.amount,
              payment_method: paymentData.payment_method,
              description:
                paymentData.description ||
                `Rent payment for ${propertyData.name}`,
              tenant_id: tenantData.id,
              property_id: propertyData.id,
              status: "completed",
              payment_date: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Refresh tenant data to update balance
        await fetchTenantData();
        return data;
      } catch (err: any) {
        console.error("Error making payment:", err);
        throw err;
      }
    },
    [tenantData, propertyData, fetchTenantData]
  );

  // Update user profile
  const updateProfile = useCallback(
    async (profileData: {
      first_name?: string;
      last_name?: string;
      phone?: string;
      avatar_url?: string;
    }) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      try {
        let result;

        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingProfile) {
          // Update existing profile
          const { data, error } = await supabase
            .from("profiles")
            .update({
              ...profileData,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
            .select()
            .single();

          if (error) throw error;
          result = data;
        } else {
          // Create new profile
          const { data, error } = await supabase
            .from("profiles")
            .insert([
              {
                user_id: user.id,
                ...profileData,
                user_type: "tenant",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (error) throw error;
          result = data;
        }

        // Refresh tenant data
        await fetchTenantData();
        return result;
      } catch (err: any) {
        console.error("Error updating profile:", err);
        throw err;
      }
    },
    [user?.id, fetchTenantData]
  );

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:profiles(first_name, last_name, email)
        `
        )
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching messages:", err);
      return [];
    }
  }, [user?.id]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Error marking message as read:", err);
      return false;
    }
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (messageData: {
      receiver_id: string;
      subject: string;
      content: string;
    }) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      try {
        const { data, error } = await supabase
          .from("messages")
          .insert([
            {
              sender_id: user.id,
              receiver_id: messageData.receiver_id,
              subject: messageData.subject,
              content: messageData.content,
              read: false,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err: any) {
        console.error("Error sending message:", err);
        throw err;
      }
    },
    [user?.id]
  );

  // Helper: Get full name
  const getFullName = useCallback(() => {
    if (userProfile?.first_name || userProfile?.last_name) {
      return `${userProfile.first_name || ""} ${
        userProfile.last_name || ""
      }`.trim();
    }
    return user?.email?.split("@")[0] || "Tenant";
  }, [userProfile, user]);

  // Helper: Get property address
  const getPropertyAddress = useCallback(() => {
    return propertyData?.address || "Address not available";
  }, [propertyData]);

  // Helper: Get property name
  const getPropertyName = useCallback(() => {
    return propertyData?.name || "Property not assigned";
  }, [propertyData]);

  // Helper: Get unit number
  const getUnitNumber = useCallback(() => {
    return propertyData?.unit_number || "N/A";
  }, [propertyData]);

  // Helper: Get monthly rent
  const getMonthlyRent = useCallback(() => {
    return stats.monthlyRent || leaseData?.monthly_rent || 0;
  }, [stats.monthlyRent, leaseData]);

  // Helper: Check if has active lease
  const hasActiveLease = useCallback(() => {
    return leaseData?.status === "active" && stats.leaseMonthsLeft > 0;
  }, [leaseData, stats.leaseMonthsLeft]);

  // Helper: Get days until next payment
  const getDaysUntilNextPayment = useCallback(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const daysLeft = Math.ceil(
      (nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft;
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    fetchTenantData();

    if (user?.id) {
      // Subscribe to tenant data changes
      const tenantChannel = supabase
        .channel("tenant-data-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "tenants",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchTenantData();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "tenants",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchTenantData();
          }
        )
        .subscribe();

      // Subscribe to payment changes
      const paymentsChannel = supabase
        .channel("payments-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rent_payments",
            filter: `tenant_id=eq.${tenantData?.id}`,
          },
          () => {
            fetchTenantData();
          }
        )
        .subscribe();

      // Subscribe to message changes
      const messagesChannel = supabase
        .channel("messages-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            fetchTenantData();
          }
        )
        .subscribe();

      return () => {
        tenantChannel.unsubscribe();
        paymentsChannel.unsubscribe();
        messagesChannel.unsubscribe();
      };
    }
  }, [user?.id, tenantData?.id, fetchTenantData]);

  return {
    // Data
    tenantData,
    propertyData,
    leaseData,
    userProfile,
    stats,

    // State
    loading,
    error,

    // Fetch methods
    refetch: fetchTenantData,
    fetchRecentPayments,
    fetchMaintenanceRequests,
    fetchMessages,

    // Action methods
    createMaintenanceRequest,
    makePayment,
    updateProfile,
    markMessageAsRead,
    sendMessage,

    // Helper methods
    getFullName,
    getPropertyAddress,
    getPropertyName,
    getUnitNumber,
    getMonthlyRent,
    hasActiveLease,
    getDaysUntilNextPayment,

    // Convenience properties
    fullName: getFullName(),
    propertyAddress: getPropertyAddress(),
    propertyName: getPropertyName(),
    unitNumber: getUnitNumber(),
    monthlyRent: getMonthlyRent(),
    isActiveLease: hasActiveLease(),
    daysUntilNextPayment: getDaysUntilNextPayment(),
  };
};
