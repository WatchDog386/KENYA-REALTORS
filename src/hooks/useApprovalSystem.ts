import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApprovalRequest {
  id: string;
  request_type:
    | "manager_assignment"
    | "deposit_refund"
    | "property_addition"
    | "user_creation"
    | "lease_termination"
    | "tenant_addition"
    | "tenant_removal"
    | "role_assignment";
  request_id: string;
  requested_by: string;
  requested_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  metadata: any;
  created_at: string;
  updated_at: string;

  // Request-specific data (fetched separately)
  request_data?: any;
}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  by_type: Record<string, number>;
}

export const useApprovalSystem = () => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [stats, setStats] = useState<ApprovalStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    by_type: {},
  });
  const [selectedRequest, setSelectedRequest] =
    useState<ApprovalRequest | null>(null);

  // Fetch all approval requests
  const fetchApprovalRequests = useCallback(
    async (status?: string, type?: string) => {
      try {
        setLoading(true);

        let query = supabase
          .from("approval_queue")
          .select(
            `
          *,
          requested_by_user:profiles!approval_queue_requested_by(id,first_name,last_name,email)
        `
          )
          .order("created_at", { ascending: false });

        if (status && status !== "all") {
          query = query.eq("status", status);
        }

        if (type && type !== "all") {
          query = query.eq("request_type", type);
        }

        const { data, error } = await query;

        if (error) throw error;

        setRequests(data || []);

        // Fetch request-specific data for each request
        const enhancedRequests = await Promise.all(
          (data || []).map(async (request) => {
            let requestData = null;

            try {
              switch (request.request_type) {
                case "deposit_refund":
                  const { data: refundData } = await supabase
                    .from("refund_requests")
                    .select(
                      "*, tenant:tenants!refund_requests_tenant_id_fkey(profiles(first_name, last_name))"
                    )
                    .eq("id", request.request_id)
                    .single();
                  requestData = refundData;
                  break;

                case "manager_assignment":
                  const { data: propertyData } = await supabase
                    .from("properties")
                    .select(
                      "*, manager:profiles!properties_manager_id_fkey(first_name, last_name)"
                    )
                    .eq("id", request.request_id)
                    .single();
                  requestData = propertyData;
                  break;

                case "user_creation":
                  const { data: userData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", request.request_id)
                    .single();
                  requestData = userData;
                  break;
              }
            } catch (err) {
              console.error(
                `Error fetching request data for ${request.request_type}:`,
                err
              );
            }

            return { ...request, request_data: requestData };
          })
        );

        setRequests(enhancedRequests);
        return enhancedRequests;
      } catch (err: any) {
        console.error("Error fetching approval requests:", err);
        toast.error("Failed to load approval requests");
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch approval statistics
  const fetchApprovalStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("approval_queue")
        .select("status, request_type");

      if (error) throw error;

      const statsData: ApprovalStats = {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: data.length,
        by_type: {},
      };

      data.forEach((request) => {
        // Count by status
        if (request.status === "pending") statsData.pending++;
        if (request.status === "approved") statsData.approved++;
        if (request.status === "rejected") statsData.rejected++;

        // Count by type
        if (!statsData.by_type[request.request_type]) {
          statsData.by_type[request.request_type] = 0;
        }
        statsData.by_type[request.request_type]++;
      });

      setStats(statsData);
      return statsData;
    } catch (err) {
      console.error("Error fetching approval stats:", err);
      return null;
    }
  }, []);

  // Fetch request by ID
  const fetchRequestById = useCallback(async (id: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("approval_queue")
        .select(
          `
          *,
          requested_by_user:profiles!approval_queue_requested_by(id,first_name,last_name,email),
          reviewed_by_user:profiles!approval_queue_reviewed_by(id,first_name,last_name,email)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      setSelectedRequest(data);
      return data;
    } catch (err: any) {
      console.error("Error fetching request:", err);
      toast.error("Request not found");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve request
  const approveRequest = useCallback(
    async (requestId: string, notes?: string) => {
      try {
        setLoading(true);

        // Get current user ID
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Get the request first
        const { data: request, error: fetchError } = await supabase
          .from("approval_queue")
          .select("*")
          .eq("id", requestId)
          .single();

        if (fetchError) throw fetchError;

        if (request.status !== "pending") {
          throw new Error("Request has already been processed");
        }

        // Update approval status
        const { error: updateError } = await supabase
          .from("approval_queue")
          .update({
            status: "approved",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", requestId);

        if (updateError) throw updateError;

        // Process the approved request based on type
        await processApprovedRequest(request);

        toast.success("Request approved successfully");

        // Refresh data
        await fetchApprovalRequests();
        await fetchApprovalStats();

        return true;
      } catch (err: any) {
        console.error("Error approving request:", err);
        toast.error(`Failed to approve request: ${err.message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchApprovalRequests, fetchApprovalStats]
  );

  // Reject request
  const rejectRequest = useCallback(
    async (requestId: string, notes?: string) => {
      try {
        setLoading(true);

        // Get current user ID
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Get the request first
        const { data: request, error: fetchError } = await supabase
          .from("approval_requests")
          .select("*")
          .eq("id", requestId)
          .single();

        if (fetchError) throw fetchError;

        if (request.status !== "pending") {
          throw new Error("Request has already been processed");
        }

        // Update approval status
        const { error: updateError } = await supabase
          .from("approval_requests")
          .update({
            status: "rejected",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", requestId);

        if (updateError) throw updateError;

        // Process the rejected request based on type
        await processRejectedRequest(request);

        toast.success("Request rejected successfully");

        // Refresh data
        await fetchApprovalRequests();
        await fetchApprovalStats();

        return true;
      } catch (err: any) {
        console.error("Error rejecting request:", err);
        toast.error(`Failed to reject request: ${err.message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchApprovalRequests, fetchApprovalStats]
  );

  // Process approved request based on type
  const processApprovedRequest = useCallback(async (request: any) => {
    try {
      switch (request.request_type) {
        case "role_assignment":
          // Apply the approved role to the user profile
          if (request.metadata?.requested_role) {
            await supabase
              .from("profiles")
              .update({
                role: request.metadata.requested_role,
                updated_at: new Date().toISOString(),
              })
              .eq("id", request.request_id); // request_id is user_id for role_assignment
          }
          break;

        case "tenant_addition":
          // Create or activate tenant record
          const tenantMetadata = request.metadata || {};
          const { data: existingTenant } = await supabase
            .from("tenants")
            .select("id")
            .eq("user_id", tenantMetadata.user_id)
            .single();

          if (existingTenant) {
            await supabase
              .from("tenants")
              .update({
                status: "active",
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingTenant.id);
          } else {
            await supabase
              .from("tenants")
              .insert({
                user_id: tenantMetadata.user_id,
                property_id: tenantMetadata.property_id,
                unit_id: tenantMetadata.unit_id,
                status: "active",
                move_in_date: tenantMetadata.move_in_date,
                lease_start_date: tenantMetadata.lease_start_date,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
          }
          break;

        case "tenant_removal":
          // Mark tenant as inactive
          await supabase
            .from("tenants")
            .update({
              status: "inactive",
              move_out_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", request.metadata.user_id);
          break;

        case "deposit_refund":
          // Update refund request status
          await supabase
            .from("refund_requests")
            .update({
              status: "approved",
              reviewed_by: request.reviewed_by,
              reviewed_at: new Date().toISOString(),
            })
            .eq("id", request.request_id);
          break;

        case "manager_assignment":
          // Get the property and manager from metadata
          const { property_id, manager_id } = request.metadata;
          if (property_id && manager_id) {
            await supabase
              .from("manager_assignments")
              .insert({
                property_id,
                manager_id,
                status: "active",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .onConflict("property_id,manager_id")
              .upsert({
                status: "active",
                updated_at: new Date().toISOString(),
              });
          }
          break;

        case "user_creation":
          // Activate the user
          await supabase
            .from("profiles")
            .update({
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", request.request_id);
          break;

        case "property_addition":
          // Activate the property
          await supabase
            .from("properties")
            .update({
              status: "available",
              updated_at: new Date().toISOString(),
            })
            .eq("id", request.request_id);
          break;
      }
    } catch (err) {
      console.error("Error processing approved request:", err);
      throw err;
    }
  }, []);

  // Process rejected request based on type
  const processRejectedRequest = useCallback(async (request: any) => {
    try {
      switch (request.request_type) {
        case "role_assignment":
          // No action needed - role remains unchanged
          console.log("Role assignment request rejected");
          break;

        case "tenant_addition":
          // Mark tenant record as rejected (if exists)
          await supabase
            .from("tenants")
            .update({
              status: "rejected",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", request.metadata.user_id);
          break;

        case "tenant_removal":
          // No action needed - tenant remains active
          console.log("Tenant removal request rejected");
          break;

        case "deposit_refund":
          await supabase
            .from("refund_requests")
            .update({
              status: "rejected",
              reviewed_by: request.reviewed_by,
              reviewed_at: new Date().toISOString(),
            })
            .eq("id", request.request_id);
          break;

        case "user_creation":
          await supabase
            .from("profiles")
            .update({
              status: "rejected",
              updated_at: new Date().toISOString(),
            })
            .eq("id", request.request_id);
          break;

        case "property_addition":
          await supabase
            .from("properties")
            .update({
              status: "rejected",
              updated_at: new Date().toISOString(),
            })
            .eq("id", request.request_id);
          break;
      }
    } catch (err) {
      console.error("Error processing rejected request:", err);
      throw err;
    }
  }, []);

  // Create approval request
  const createApprovalRequest = useCallback(
    async (
      requestType: ApprovalRequest["request_type"],
      requestId: string,
      metadata: any = {},
      notes?: string
    ) => {
      try {
        setLoading(true);

        // Get current user ID
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Get user profile ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!profile) throw new Error("User profile not found");

        const { data, error } = await supabase
          .from("approval_queue")
          .insert([
            {
              request_type: requestType,
              request_id: requestId,
              requested_by: profile.id,
              status: "pending",
              metadata,
              notes,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;

        toast.success("Approval request created successfully");
        return data;
      } catch (err: any) {
        console.error("Error creating approval request:", err);
        toast.error(`Failed to create approval request: ${err.message}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Bulk approve/reject requests
  const bulkProcessRequests = useCallback(
    async (
      requestIds: string[],
      action: "approve" | "reject",
      notes?: string
    ) => {
      try {
        setLoading(true);

        // Get current user ID
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Update all requests
        const { error } = await supabase
          .from("approval_queue")
          .update({
            status: action === "approve" ? "approved" : "rejected",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            notes,
            updated_at: new Date().toISOString(),
          })
          .in("id", requestIds)
          .eq("status", "pending");

        if (error) throw error;

        toast.success(
          `${requestIds.length} requests ${
            action === "approve" ? "approved" : "rejected"
          } successfully`
        );

        // Refresh data
        await fetchApprovalRequests();
        await fetchApprovalStats();

        return true;
      } catch (err: any) {
        console.error("Error bulk processing requests:", err);
        toast.error(`Failed to process requests: ${err.message}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchApprovalRequests, fetchApprovalStats]
  );

  // Get pending requests count
  const getPendingCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from("approval_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;

      return count || 0;
    } catch (err) {
      console.error("Error getting pending count:", err);
      return 0;
    }
  }, []);

  return {
    // State
    requests,
    stats,
    selectedRequest,
    loading,

    // Methods
    fetchApprovalRequests,
    fetchApprovalStats,
    fetchRequestById,
    approveRequest,
    rejectRequest,
    createApprovalRequest,
    bulkProcessRequests,
    getPendingCount,

    // Setters
    setSelectedRequest,
  };
};
