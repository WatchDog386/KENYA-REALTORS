import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ApprovalRequest {
  id: string;
  request_type:
    | "manager_assignment"
    | "deposit_refund"
    | "property_addition"
    | "user_creation"
    | "lease_termination"
    | "maintenance_approval"
    | "payment_exception";
  request_id: string;
  requested_by: string;
  requested_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewed_by?: string;
  reviewed_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  reviewed_at?: string;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Request-specific data
  request_data?: any;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  total: number;
  by_type: Record<string, number>;
  today_pending: number;
  this_week_pending: number;
}

export interface CreateApprovalInput {
  request_type: ApprovalRequest["request_type"];
  request_id: string;
  metadata?: Record<string, any>;
  notes?: string;
}

export interface ProcessApprovalInput {
  approvalId: string;
  status: "approved" | "rejected";
  notes?: string;
}

export interface ApprovalFilter {
  status?: string;
  request_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

class ApprovalService {
  // Get all approval requests with filtering
  async getApprovalRequests(
    filters: ApprovalFilter = {}
  ): Promise<ApprovalRequest[]> {
    try {
      const {
        status = "all",
        request_type = "all",
        date_from,
        date_to,
        search,
        page = 1,
        limit = 20,
      } = filters;

      let query = supabase
        .from("approval_queue")
        .select(
          `
          *,
          requested_by_user:profiles!approval_queue_requested_by_fkey(
            id,
            first_name,
            last_name,
            email,
            role
          ),
          reviewed_by_user:profiles!approval_queue_reviewed_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (status !== "all") {
        query = query.eq("status", status);
      }

      if (request_type !== "all") {
        query = query.eq("request_type", request_type);
      }

      if (date_from) {
        query = query.gte("created_at", date_from);
      }

      if (date_to) {
        query = query.lte("created_at", date_to);
      }

      if (search) {
        // Search in notes or metadata
        query = query.or(
          `notes.ilike.%${search}%,metadata->>'reason'.ilike.%${search}%`
        );
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      // Fetch request-specific data for each request
      const enhancedRequests = await Promise.all(
        (data || []).map(async (request) => {
          const requestData = await this.fetchRequestData(
            request.request_type,
            request.request_id
          );
          return { ...request, request_data: requestData };
        })
      );

      return enhancedRequests;
    } catch (error) {
      console.error("Error fetching approval requests:", error);
      toast.error("Failed to load approval requests");
      return [];
    }
  }

  // Get approval request by ID
  async getApprovalRequestById(id: string): Promise<ApprovalRequest | null> {
    try {
      const { data, error } = await supabase
        .from("approval_queue")
        .select(
          `
          *,
          requested_by_user:profiles!approval_queue_requested_by_fkey(
            id,
            first_name,
            last_name,
            email,
            role
          ),
          reviewed_by_user:profiles!approval_queue_reviewed_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        const requestData = await this.fetchRequestData(
          data.request_type,
          data.request_id
        );
        return { ...data, request_data: requestData };
      }

      return null;
    } catch (error) {
      console.error("Error fetching approval request:", error);
      toast.error("Approval request not found");
      return null;
    }
  }

  // Get approval statistics
  async getApprovalStats(): Promise<ApprovalStats> {
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get this week's date range
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const [allRequests, todayRequests, weekRequests] = await Promise.all([
        // All requests
        supabase.from("approval_queue").select("status, request_type"),

        // Today's pending requests
        supabase
          .from("approval_queue")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .gte("created_at", today.toISOString())
          .lt("created_at", tomorrow.toISOString()),

        // This week's pending requests
        supabase
          .from("approval_queue")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .gte("created_at", weekStart.toISOString()),
      ]);

      if (allRequests.error) throw allRequests.error;

      const stats: ApprovalStats = {
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        total: allRequests.data?.length || 0,
        by_type: {},
        today_pending: todayRequests.count || 0,
        this_week_pending: weekRequests.count || 0,
      };

      // Calculate counts
      allRequests.data?.forEach((request) => {
        // Count by status
        if (request.status === "pending") stats.pending++;
        if (request.status === "approved") stats.approved++;
        if (request.status === "rejected") stats.rejected++;
        if (request.status === "cancelled") stats.cancelled++;

        // Count by type
        if (!stats.by_type[request.request_type]) {
          stats.by_type[request.request_type] = 0;
        }
        stats.by_type[request.request_type]++;
      });

      return stats;
    } catch (error) {
      console.error("Error fetching approval stats:", error);
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        total: 0,
        by_type: {},
        today_pending: 0,
        this_week_pending: 0,
      };
    }
  }

  // Create approval request
  async createApprovalRequest(
    input: CreateApprovalInput
  ): Promise<ApprovalRequest | null> {
    try {
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

      const approvalData = {
        request_type: input.request_type,
        request_id: input.request_id,
        requested_by: profile.id,
        status: "pending",
        metadata: input.metadata || {},
        notes: input.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("approval_queue")
        .insert([approvalData])
        .select(
          `
          *,
          requested_by_user:profiles!approval_queue_requested_by_fkey(
            id,
            first_name,
            last_name,
            email,
            role
          )
        `
        )
        .single();

      if (error) throw error;

      // Notify admins about new approval request
      await this.notifyAdmins(data.id, input.request_type);

      toast.success("Approval request created successfully");
      return data;
    } catch (error: any) {
      console.error("Error creating approval request:", error);
      toast.error(`Failed to create approval request: ${error.message}`);
      return null;
    }
  }

  // Process approval request (approve/reject)
  async processApprovalRequest(
    input: ProcessApprovalInput
  ): Promise<ApprovalRequest | null> {
    try {
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

      // Get the request first
      const request = await this.getApprovalRequestById(input.approvalId);
      if (!request) throw new Error("Approval request not found");

      if (request.status !== "pending") {
        throw new Error("This request has already been processed");
      }

      // Update approval status
      const { data, error } = await supabase
        .from("approval_queue")
        .update({
          status: input.status,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          notes: input.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.approvalId)
        .select(
          `
          *,
          requested_by_user:profiles!approval_queue_requested_by_fkey(
            id,
            first_name,
            last_name,
            email,
            role
          ),
          reviewed_by_user:profiles!approval_queue_reviewed_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `
        )
        .single();

      if (error) throw error;

      // Process the request based on type and status
      await this.processRequestAction(
        request.request_type,
        request.request_id,
        input.status,
        request.metadata
      );

      // Notify the requester
      await this.notifyRequester(
        request.requested_by,
        input.approvalId,
        input.status
      );

      toast.success(`Request ${input.status} successfully`);
      return data;
    } catch (error: any) {
      console.error("Error processing approval request:", error);
      toast.error(`Failed to process approval request: ${error.message}`);
      return null;
    }
  }

  // Bulk process approval requests
  async bulkProcessApprovals(
    approvalIds: string[],
    status: "approved" | "rejected",
    notes?: string
  ): Promise<boolean> {
    try {
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

      // Get all requests first
      const { data: requests, error: fetchError } = await supabase
        .from("approval_queue")
        .select("*")
        .in("id", approvalIds)
        .eq("status", "pending");

      if (fetchError) throw fetchError;

      if (!requests || requests.length === 0) {
        throw new Error("No pending requests found");
      }

      // Update all requests
      const { error: updateError } = await supabase
        .from("approval_queue")
        .update({
          status: status,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          notes: notes,
          updated_at: new Date().toISOString(),
        })
        .in("id", approvalIds)
        .eq("status", "pending");

      if (updateError) throw updateError;

      // Process each request
      await Promise.all(
        requests.map((request) =>
          this.processRequestAction(
            request.request_type,
            request.request_id,
            status,
            request.metadata
          )
        )
      );

      // Notify all requesters
      const requesterIds = [...new Set(requests.map((r) => r.requested_by))];
      await Promise.all(
        requesterIds.map((requesterId) =>
          this.notifyRequester(requesterId, "bulk", status)
        )
      );

      toast.success(`${requests.length} requests ${status} successfully`);
      return true;
    } catch (error: any) {
      console.error("Error bulk processing approvals:", error);
      toast.error(`Failed to process approvals: ${error.message}`);
      return false;
    }
  }

  // Cancel approval request (only if pending)
  async cancelApprovalRequest(approvalId: string): Promise<boolean> {
    try {
      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user is the requester or admin
      const request = await this.getApprovalRequestById(approvalId);
      if (!request) throw new Error("Approval request not found");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("User profile not found");

      // Check permissions
      const isRequester = request.requested_by === profile.id;
      const isAdmin = profile.role === "super_admin";

      if (!isRequester && !isAdmin) {
        throw new Error("You are not authorized to cancel this request");
      }

      if (request.status !== "pending") {
        throw new Error("Only pending requests can be cancelled");
      }

      const { error } = await supabase
        .from("approval_queue")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", approvalId);

      if (error) throw error;

      toast.success("Request cancelled successfully");
      return true;
    } catch (error: any) {
      console.error("Error cancelling approval request:", error);
      toast.error(`Failed to cancel request: ${error.message}`);
      return false;
    }
  }

  // Get pending count for notifications
  async getPendingApprovalCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("approval_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error getting pending count:", error);
      return 0;
    }
  }

  // Export approval requests to CSV
  async exportApprovalsToCSV(filters: ApprovalFilter = {}): Promise<void> {
    try {
      const requests = await this.getApprovalRequests({
        ...filters,
        limit: 1000, // Export up to 1000 requests
      });

      // Convert to CSV
      const headers = [
        "ID",
        "Type",
        "Status",
        "Requested By",
        "Requested Date",
        "Reviewed By",
        "Reviewed Date",
        "Notes",
      ];
      const csvRows = [
        headers.join(","),
        ...requests.map((request) =>
          [
            request.id,
            request.request_type,
            request.status,
            request.requested_by_user
              ? `"${request.requested_by_user.first_name} ${request.requested_by_user.last_name}"`
              : "",
            new Date(request.created_at).toLocaleDateString(),
            request.reviewed_by_user
              ? `"${request.reviewed_by_user.first_name} ${request.reviewed_by_user.last_name}"`
              : "",
            request.reviewed_at
              ? new Date(request.reviewed_at).toLocaleDateString()
              : "",
            request.notes ? `"${request.notes.replace(/"/g, '""')}"` : "",
          ].join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `approvals_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Approvals exported successfully");
    } catch (error: any) {
      console.error("Error exporting approvals:", error);
      toast.error(`Failed to export approvals: ${error.message}`);
    }
  }

  // Private helper methods
  private async fetchRequestData(
    requestType: string,
    requestId: string
  ): Promise<any> {
    try {
      switch (requestType) {
        case "deposit_refund":
          const { data: refundData } = await supabase
            .from("refund_requests")
            .select(
              "*, tenant:tenants!refund_requests_tenant_id_fkey(profiles(first_name, last_name, email))"
            )
            .eq("id", requestId)
            .single();
          return refundData;

        case "manager_assignment":
          const { data: propertyData } = await supabase
            .from("properties")
            .select(
              "*, manager:profiles!properties_manager_id_fkey(first_name, last_name, email)"
            )
            .eq("id", requestId)
            .single();
          return propertyData;

        case "user_creation":
          const { data: userData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", requestId)
            .single();
          return userData;

        case "property_addition":
          const { data: propertyAddData } = await supabase
            .from("properties")
            .select("*")
            .eq("id", requestId)
            .single();
          return propertyAddData;

        case "lease_termination":
          const { data: leaseData } = await supabase
            .from("leases")
            .select(
              "*, tenant:tenants!leases_tenant_id_fkey(profiles(first_name, last_name))"
            )
            .eq("id", requestId)
            .single();
          return leaseData;

        case "maintenance_approval":
          const { data: maintenanceData } = await supabase
            .from("maintenance_requests")
            .select(
              "*, tenant:tenants!maintenance_requests_tenant_id_fkey(profiles(first_name, last_name))"
            )
            .eq("id", requestId)
            .single();
          return maintenanceData;

        default:
          return null;
      }
    } catch (error) {
      console.error(`Error fetching request data for ${requestType}:`, error);
      return null;
    }
  }

  private async processRequestAction(
    requestType: string,
    requestId: string,
    status: "approved" | "rejected",
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      switch (requestType) {
        case "deposit_refund":
          await supabase
            .from("refund_requests")
            .update({
              status: status,
              reviewed_at: new Date().toISOString(),
            })
            .eq("id", requestId);
          break;

        case "manager_assignment":
          if (status === "approved") {
            const { property_id, manager_id } = metadata;
            if (property_id && manager_id) {
              await supabase
                .from("properties")
                .update({
                  manager_id: manager_id,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", property_id);
            }
          }
          break;

        case "user_creation":
          await supabase
            .from("profiles")
            .update({
              status: status === "approved" ? "active" : "rejected",
              updated_at: new Date().toISOString(),
            })
            .eq("id", requestId);
          break;

        case "property_addition":
          await supabase
            .from("properties")
            .update({
              status: status === "approved" ? "available" : "rejected",
              updated_at: new Date().toISOString(),
            })
            .eq("id", requestId);
          break;

        case "lease_termination":
          if (status === "approved") {
            await supabase
              .from("leases")
              .update({
                status: "terminated",
                updated_at: new Date().toISOString(),
              })
              .eq("id", requestId);
          }
          break;

        case "maintenance_approval":
          if (status === "approved") {
            await supabase
              .from("maintenance_requests")
              .update({
                status: "approved",
                updated_at: new Date().toISOString(),
              })
              .eq("id", requestId);
          }
          break;
      }
    } catch (error) {
      console.error(
        `Error processing request action for ${requestType}:`,
        error
      );
      throw error;
    }
  }

  private async notifyAdmins(
    approvalId: string,
    requestType: string
  ): Promise<void> {
    try {
      // In a real app, this would send notifications to all admins
      // For now, we'll just log it
      console.log(
        `Notifying admins about new ${requestType} approval request: ${approvalId}`
      );
    } catch (error) {
      console.error("Error notifying admins:", error);
    }
  }

  private async notifyRequester(
    requesterId: string,
    approvalId: string,
    status: "approved" | "rejected"
  ): Promise<void> {
    try {
      // In a real app, this would send an email or notification to the requester
      // For now, we'll just log it
      console.log(
        `Notifying requester ${requesterId} about approval ${approvalId}: ${status}`
      );
    } catch (error) {
      console.error("Error notifying requester:", error);
    }
  }
}

export const approvalService = new ApprovalService();
