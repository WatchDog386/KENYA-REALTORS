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
        .from("approvals")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (status !== "all") {
        query = query.eq("status", status);
      }

      if (request_type !== "all") {
        query = query.eq("approval_type", request_type);
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

      // Fetch request-specific data and profiles for each request
      const enhancedRequests = await Promise.all(
        (data || []).map(async (request) => {
          // Fetch profiles manually
          const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, role')
            .eq('id', request.user_id)
            .single();

          let reviewerProfile = null;
          if (request.reviewed_by) {
            const { data: revProfile } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, email')
              .eq('id', request.reviewed_by)
              .single();
            reviewerProfile = revProfile;
          }

          const requestData = await this.fetchRequestData(
            request.approval_type,
            request.request_id
          );

          return {
             ...request, 
             request_type: request.approval_type,
             requested_by: request.user_id,
             requested_by_user: requesterProfile,
             reviewed_by_user: reviewerProfile,
             request_data: requestData 
          } as ApprovalRequest;
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
        .from("approvals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        // Fetch profiles manually
        const { data: requesterProfile } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, role')
          .eq('id', data.user_id)
          .single();

        let reviewerProfile = null;
        if (data.reviewed_by) {
          const { data: revProfile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('id', data.reviewed_by)
            .single();
          reviewerProfile = revProfile;
        }

        const requestData = await this.fetchRequestData(
          data.approval_type,
          data.request_id
        );
        
        return { 
          ...data, 
          request_type: data.approval_type,
          requested_by: data.user_id,
          requested_by_user: requesterProfile,
          reviewed_by_user: reviewerProfile,
          request_data: requestData 
        } as ApprovalRequest;
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
        supabase.from("approvals").select("status, approval_type"),

        // Today's pending requests
        supabase
          .from("approvals")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .gte("created_at", today.toISOString())
          .lt("created_at", tomorrow.toISOString()),

        // This week's pending requests
        supabase
          .from("approvals")
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
        // Map approval_type back to request_type key if needed, or use as is
        const type = request.approval_type;
        if (!stats.by_type[type]) {
          stats.by_type[type] = 0;
        }
        stats.by_type[type]++;
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
        .select("id, first_name, last_name, email, role")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("User profile not found");

      const approvalData = {
        approval_type: input.request_type,
        request_id: input.request_id,
        user_id: profile.id, // Using profile.id which is same as user.id usually
        status: "pending",
        metadata: input.metadata || {},
        notes: input.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("approvals")
        .insert([approvalData])
        .select("*")
        .single();

      if (error) throw error;

      // Notify admins about new approval request
      await this.notifyAdmins(data.id, input.request_type);

      toast.success("Approval request created successfully");
      
      // Adapt response to interface
      return {
          ...data,
          request_type: data.approval_type,
          requested_by: data.user_id,
          requested_by_user: profile,
          request_data: null // Can't fetch right away easily without another call
      } as ApprovalRequest;
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
        .select("id, first_name, last_name, email, role")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("User profile not found");

      // Get the request first (using the new method)
      const request = await this.getApprovalRequestById(input.approvalId);
      if (!request) throw new Error("Approval request not found");

      if (request.status !== "pending") {
        throw new Error("This request has already been processed");
      }

      // Update approval status
      const { data, error } = await supabase
        .from("approvals")
        .update({
          status: input.status,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          notes: input.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.approvalId)
        .select("*")
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
      
      // Return adapted data
      // We need to fetch the requester profile again or use what we had from getApprovalRequestById
      // For simplicity, we'll re-use the adapter logic we used in getApprovalRequestById by calling it
      // But we just updated the DB, so we can fetch it again.
      return await this.getApprovalRequestById(input.approvalId);
      
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

      // Get all requests first - we need their details for processing logic
      // Since we changed table names and columns, we need to adapt this
      // We'll use getApprovalRequests filter by ID ideally, but the API doesn't support IDs filter easily.
      // So we'll query directly and map.
      const { data: requests, error: fetchError } = await supabase
        .from("approvals")
        .select("*")
        .in("id", approvalIds)
        .eq("status", "pending");

      if (fetchError) throw fetchError;

      if (!requests || requests.length === 0) {
        throw new Error("No pending requests found");
      }

      // Update all requests
      const { error: updateError } = await supabase
        .from("approvals")
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
            request.approval_type, // Map from DB
            request.request_id,
            status,
            request.metadata
          )
        )
      );

      // Notify all requesters
      const requesterIds = [...new Set(requests.map((r) => r.user_id))]; // Map from user_id
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

      // Check permissions (using mapped properties from getApprovalRequestById)
      const isRequester = request.requested_by === profile.id;
      const isAdmin = profile.role === "super_admin";

      if (!isRequester && !isAdmin) {
        throw new Error("You are not authorized to cancel this request");
      }

      if (request.status !== "pending") {
        throw new Error("Only pending requests can be cancelled");
      }

      const { error } = await supabase
        .from("approvals")
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
        .from("approvals")
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
        
        case "role_assignment":
          return { request_id: requestId }; // User ID

        case "tenant_addition":
          // Return metadata mostly
          return {};

        case "tenant_removal":
          const { data: tenantData } = await supabase
            .from("tenants")
            .select("*, profiles!inner(first_name, last_name, email)")
            .eq("user_id", requestId)
            .maybeSingle(); // Might not exist if already removed
          return tenantData;

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
                
              // Also update manager_assignments table if it exists
              const { error: assignError } = await supabase
                .from("property_manager_assignments")
                .insert({
                   property_id,
                   property_manager_id: manager_id,
                   status: 'active'
                });
              // Ignore unique constraint errors
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
          
        case "role_assignment":
          if (status === "approved" && metadata?.requested_role) {
            await supabase
              .from("profiles")
              .update({
                role: metadata.requested_role,
                updated_at: new Date().toISOString(),
              })
              .eq("id", requestId);
          }
          break;
          
        case "tenant_addition":
          if (status === "approved") {
             const tenantMetadata = metadata || {};
             // Check if tenant exists
             const { data: existingTenant } = await supabase
              .from("tenants")
              .select("id")
              .eq("user_id", tenantMetadata.user_id)
              .maybeSingle();

             if (existingTenant) {
               await supabase
                .from("tenants")
                .update({
                  status: "active",
                  updated_at: new Date().toISOString()
                })
                .eq("id", existingTenant.id);
             } else {
               await supabase.from("tenants").insert({
                 user_id: tenantMetadata.user_id,
                 property_id: tenantMetadata.property_id,
                 unit_id: tenantMetadata.unit_id,
                 status: "active",
                 move_in_date: tenantMetadata.move_in_date,
                 // lease_start_date: tenantMetadata.lease_start_date // if column exists
               });
             }
          }
          break;
          
        case "tenant_removal":
           if (status === "approved") {
             // Mark tenant inactive
             // requestId here is typically the user_id or tenant_id. 
             // Logic in hook used metadata.user_id, here request_id is usually the entity id.
             // If request_id IS user_id:
             await supabase
               .from("tenants")
               .update({
                 status: "inactive",
                 move_out_date: new Date().toISOString(),
                 updated_at: new Date().toISOString()
               })
               .eq("user_id", requestId); // Assuming requestId is user_id for this type
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
// ============================================================================
// TENANT VERIFICATION AND MANAGER APPROVAL FUNCTIONS
// ============================================================================

export interface TenantVerification {
  id: string;
  tenant_id: string;
  property_id: string;
  house_number: string;
  unit_id?: string;
  status: "pending" | "verified" | "rejected" | "processing";
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ManagerApproval {
  id: string;
  manager_id: string;
  property_id?: string;
  managed_properties: string[];
  status: "pending" | "approved" | "rejected" | "processing";
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  type: "tenant_verification" | "manager_approval" | "verification_approved" | "verification_rejected" | "approval_approved" | "approval_rejected";
  related_entity_type?: string;
  related_entity_id?: string;
  title: string;
  message?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

// Get all pending tenant verifications for a property manager
export const getTenantVerificationsForManager = async (managerId: string): Promise<TenantVerification[]> => {
  try {
    // First get all properties managed by this manager
    const { data: properties, error: propError } = await supabase
      .from("properties")
      .select("id")
      .eq("property_manager_id", managerId);

    if (propError) throw propError;

    const propertyIds = properties?.map(p => p.id) || [];

    if (propertyIds.length === 0) {
      return [];
    }

    // Get verifications for these properties
    const { data, error } = await supabase
      .from("tenant_verifications")
      .select("*")
      .in("property_id", propertyIds)
      .eq("status", "pending");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching tenant verifications:", error);
    throw error;
  }
};

// Verify a tenant
export const verifyTenant = async (
  verificationId: string,
  managerId: string,
  approved: boolean,
  notes?: string
): Promise<void> => {
  try {
    const status = approved ? "verified" : "rejected";

    // Get verification details first to find tenant ID
    const { data: verification } = await supabase
      .from("tenant_verifications")
      .select("tenant_id")
      .eq("id", verificationId)
      .single();

    if (!verification?.tenant_id) throw new Error("Tenant not found");

    // 1. Update tenant verification record
    const { error: updateError } = await supabase
      .from("tenant_verifications")
      .update({
        status,
        verified_by: managerId,
        verified_at: new Date().toISOString(),
        verification_notes: approved ? notes : undefined,
        rejection_reason: !approved ? notes : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", verificationId);

    if (updateError) throw updateError;

    // 2. If approved, update tenant's profile to active
    if (approved) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          status: "active",
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", verification.tenant_id);

      if (profileError) throw profileError;
    }

    // 3. Create notification for tenant
    await supabase.from("notifications").insert({
      recipient_id: verification.tenant_id,
      sender_id: managerId,
      type: approved ? "verification_approved" : "verification_rejected",
      related_entity_type: "tenant",
      related_entity_id: verification.tenant_id,
      title: approved ? "Verification Approved" : "Verification Rejected",
      message: approved
        ? `Your tenant registration has been approved. You can now access your tenant portal and login.`
        : `Your tenant registration was rejected. Reason: ${notes || "See property manager for details"}`,
    });

    toast.success(approved ? "Tenant verified successfully" : "Tenant verification rejected");
  } catch (error) {
    console.error("Error verifying tenant:", error);
    throw error;
  }
};

// Get all pending manager approvals (for super admin)
export const getManagerApprovalsForAdmin = async (): Promise<ManagerApproval[]> => {
  try {
    const { data, error } = await supabase
      .from("manager_approvals")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching manager approvals:", error);
    throw error;
  }
};

// Approve or reject a property manager
export const approvePropertyManager = async (
  approvalId: string,
  adminId: string,
  approved: boolean,
  notes?: string
): Promise<void> => {
  try {
    const status = approved ? "approved" : "rejected";

    // Get the manager ID from the approval
    const { data: approval } = await supabase
      .from("manager_approvals")
      .select("manager_id")
      .eq("id", approvalId)
      .single();

    if (!approval) throw new Error("Approval not found");

    // 1. Update approval status in manager_approvals table
    const { error: updateApprovalError } = await supabase
      .from("manager_approvals")
      .update({
        status,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        approval_notes: approved ? notes : undefined,
        rejection_reason: !approved ? notes : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", approvalId);

    if (updateApprovalError) throw updateApprovalError;

    // 2. If approved, update the manager's profile to active immediately
    // Manager can login right away without waiting for email confirmation
    if (approved) {
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({
          role: "property_manager",
          status: "active",
          is_active: true,
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", approval.manager_id);

      if (updateProfileError) throw updateProfileError;
    }

    // 3. Create notification for manager
    await supabase.from("notifications").insert({
      recipient_id: approval.manager_id,
      sender_id: adminId,
      type: approved ? "approval_approved" : "approval_rejected",
      related_entity_type: "manager",
      related_entity_id: approval.manager_id,
      title: approved ? "Registration Approved" : "Registration Rejected",
      message: approved
        ? `Your property manager registration has been approved. You can now login and access your property management portal immediately.`
        : `Your property manager registration was rejected. Reason: ${notes || "See administrator for details"}`,
    });

    toast.success(approved ? "Manager approved successfully" : "Manager approval rejected");
  } catch (error) {
    console.error("Error approving manager:", error);
    throw error;
  }
};

// Get notifications for current user
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId);

    if (error) throw error;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error getting notification count:", error);
    return 0;
  }
};