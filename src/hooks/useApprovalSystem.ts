import { useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  approvalService, 
  ApprovalRequest, 
  ApprovalStats, 
  ApprovalFilter 
} from "@/services/approvalService";

export const useApprovalSystem = () => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [stats, setStats] = useState<ApprovalStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    total: 0,
    by_type: {},
    today_pending: 0,
    this_week_pending: 0
  });
  const [selectedRequest, setSelectedRequest] =
    useState<ApprovalRequest | null>(null);

  // Fetch all approval requests
  const fetchApprovalRequests = useCallback(
    async (status?: string, type?: string) => {
      try {
        setLoading(true);
        const filters: ApprovalFilter = {};
        if (status && status !== "all") filters.status = status;
        if (type && type !== "all") filters.request_type = type; // Service maps this to query

        const data = await approvalService.getApprovalRequests(filters);
        setRequests(data);
        return data;
      } catch (err: any) {
        console.error("Error fetching approval requests:", err);
        // toast handled in service
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
      const statsData = await approvalService.getApprovalStats();
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
      const data = await approvalService.getApprovalRequestById(id);
      if (data) setSelectedRequest(data);
      return data;
    } catch (err: any) {
      console.error("Error fetching request:", err);
      // toast handled in service
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve request
  const approveRequest = useCallback(
    async (requestId: string, adminResponse?: string) => {
      try {
        setLoading(true);
        const result = await approvalService.processApprovalRequest({
            approvalId: requestId,
            status: "approved",
            adminResponse
        });

        if (result) {
            // Refresh data
            await fetchApprovalRequests();
            await fetchApprovalStats();
            return true;
        }
        return false;
      } catch (err: any) {
        console.error("Error approving request:", err);
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
        const result = await approvalService.processApprovalRequest({
            approvalId: requestId,
            status: "rejected",
            notes
        });

        if (result) {
            // Refresh data
            await fetchApprovalRequests();
            await fetchApprovalStats();
            return true;
        }
        return false;
      } catch (err: any) {
        console.error("Error rejecting request:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchApprovalRequests, fetchApprovalStats]
  );

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
        const result = await approvalService.createApprovalRequest({
            request_type: requestType,
            request_id: requestId,
            metadata,
            notes
        });
        
        return result;
      } catch (err: any) {
        console.error("Error creating approval request:", err);
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
        const status = action === "approve" ? "approved" : "rejected";
        const success = await approvalService.bulkProcessApprovals(requestIds, status, notes);

        if (success) {
            // Refresh data
            await fetchApprovalRequests();
            await fetchApprovalStats();
        }
        return success;
      } catch (err: any) {
        console.error("Error bulk processing requests:", err);
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
      return await approvalService.getPendingApprovalCount();
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