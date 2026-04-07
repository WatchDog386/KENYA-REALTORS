// src/components/portal/super-admin/ApprovalQueue.tsx
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Home,
  DollarSign,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  Check,
  X,
  AlertCircle,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HeroBackground } from "@/components/ui/HeroBackground";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useApprovalSystem } from "@/hooks/useApprovalSystem";
import { toast } from "sonner";
import { formatDate } from "@/utils/dateHelpers";

interface ApprovalQueueProps {
  onApprovalUpdate?: (approvalId: string, status: string) => void;
}

const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ onApprovalUpdate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedApprovalData, setSelectedApprovalData] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminReply, setAdminReply] = useState(""); // Add admin reply state

  const {
    requests: approvals,
    stats,
    loading,
    fetchApprovalRequests,
    fetchApprovalStats,
    approveRequest,
    rejectRequest,
  } = useApprovalSystem();

  // Load initial data
  useEffect(() => {
    fetchApprovalRequests();
    fetchApprovalStats();
  }, [fetchApprovalRequests, fetchApprovalStats]); // Add dependencies

  // Handle search
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await fetchApprovalRequests();
    } else {
      await fetchApprovalRequests();
    }
  };

  // Helper filter for status including in_progress as pending
  const normalizeStatus = (status: string) => {
    if (status === 'in_progress') return 'pending';
    return status;
  }

  // Filter approvals
  const filteredApprovals = approvals?.filter((approval) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const type = (approval as any).approval_type || (approval as any).request_type; // handle inconsistent naming
    const requesterName = approval.requested_by_user ? `${approval.requested_by_user.first_name} ${approval.requested_by_user.last_name}` : '';
    // Use metadata action_title if available for search
    const actionTitle = approval.metadata?.action_title || '';
    
    if (searchQuery && !type?.toLowerCase().includes(searchLower) && 
        !requesterName.toLowerCase().includes(searchLower) &&
        !actionTitle.toLowerCase().includes(searchLower)) {
       return false;
    }
    
    // Type filter
    if (typeFilter !== "all" && type !== typeFilter) return false;

    // Status filter
    if (statusFilter !== "all") {
       const effectiveStatus = normalizeStatus(approval.status);
       const filterStatus = normalizeStatus(statusFilter);
       if (effectiveStatus !== filterStatus) return false;
    }
      
    return true;
  });

  // Handle approve - updated to take ID optional or use state
  const handleApprove = async (id?: string) => {
    // If id passed, use it, otherwise use state
    const targetId = id || selectedApprovalData?.id;
    if (!targetId) return;
    
    try {
      await approveRequest(targetId, adminReply || "");
      toast.success("Request approved successfully");
      setIsViewDialogOpen(false);
      setAdminReply("");

      fetchApprovalRequests();
      fetchApprovalStats();

      if (onApprovalUpdate) {
        onApprovalUpdate(targetId, "approved");
      }
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedApprovalData || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await rejectRequest(selectedApprovalData.id, rejectionReason);
      toast.success("Request rejected successfully");
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedApprovalData(null);

      fetchApprovalRequests();
      fetchApprovalStats();

      if (onApprovalUpdate) {
        onApprovalUpdate(selectedApprovalData.id, "rejected");
      }
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  // Handle reply only
  const handleReply = async () => {
    if (!selectedApprovalData || !adminReply.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    try {
      // Use "in_progress" to indicate a dialog has started but decision isn't final
      // or keep current status
      const currentStatus = selectedApprovalData.status === 'pending' ? 'in_progress' : selectedApprovalData.status;
      
      // We need to call the service manually or extend the hook, 
      // but here we can just update via supabase directly or use a tailored service call if available.
      // Since useApprovalSystem exposes specific methods, let's try to reuse or just do direct update here for 'reply only'
      
      const { error } = await supabase
        .from('approvals')
        .update({
           admin_response: adminReply,
           status: currentStatus, // Keep status or move to in_progress
           updated_at: new Date().toISOString()
        })
        .eq('id', selectedApprovalData.id);

      if (error) throw error;

      toast.success("Reply sent successfully");
      setIsViewDialogOpen(false);
      setAdminReply("");
      
      // Refresh
      fetchApprovalRequests();
      fetchApprovalStats();

    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    }
  };

  // View approval details
  const viewApprovalDetails = (approval: any) => {
    setSelectedApprovalData(approval);
    setAdminReply(approval.admin_response || ""); // Pre-fill with existing reply if any
    setIsViewDialogOpen(true);
  };

  // Get approval type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case "property_addition":
      case "property_listing":
        return "bg-blue-100 text-blue-800";
      case "tenant_addition":
      case "tenant_application":
        return "bg-green-100 text-green-800";
      case "maintenance_approval":
      case "maintenance_request":
        return "bg-orange-100 text-orange-800";
      case "deposit_refund":
      case "payment_verification":
        return "bg-purple-100 text-purple-800";
      case "lease_termination":
      case "contract_renewal":
        return "bg-indigo-100 text-indigo-800";
      case "permission_request":
        return "bg-cyan-100 text-cyan-800";
      case "manager_assignment":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "under_review":
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Stats are already available from the hook
  const approvalStats = stats;

  const handlePrintSummary = () => {
    // Generate an HTML string for the entire approval history (or current filtered list)
    const printableContent = (approvals || [])
      .map(
        (app: any) => {
          const type = (app.approval_type || app.request_type || "N/A").replace(/_/g, " ").toUpperCase();
          const requester = app.requested_by_user ? `${app.requested_by_user.first_name} ${app.requested_by_user.last_name}` : "Unknown";
          const status = app.status.toUpperCase();
          const date = new Date(app.created_at).toLocaleString();
          return `
            <div style="border-bottom: 1px solid #ccc; padding: 12px 0;">
              <div><strong>ID:</strong> ${app.id}</div>
              <div><strong>Type:</strong> ${type}</div>
              <div><strong>Requester:</strong> ${requester}</div>
              <div><strong>Status:</strong> <span style="font-weight:bold; color: ${status === 'APPROVED' ? 'green' : status === 'REJECTED' ? 'red' : 'orange'};">${status}</span></div>
              <div><strong>Submitted:</strong> ${date}</div>
            </div>
          `;
        }
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Approval Summary Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #154279; border-bottom: 2px solid #154279; padding-bottom: 10px; margin-bottom: 5px; }
            .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
            .content { margin-top: 20px; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Approval Queue Summary</h1>
          <div class="meta">Generated on ${new Date().toLocaleString()}</div>
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #154279; color: white; border: none; cursor: pointer; margin-bottom: 20px;">Print Now</button>
          <div class="content">
            ${printableContent || "<p>No records found.</p>"}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Automatically trigger print dialog
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="bg-[#d7dce1] min-h-screen pb-14 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <section className="border-b border-[#bcc3cd] bg-[#eef1f4] px-6 py-5 mb-4">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6a7788]">Approval Workflow</p>
            <h1 className="mt-1 text-[36px] font-bold leading-none text-[#1f2937]">Approval Queue</h1>
            <p className="mt-2 text-[13px] font-medium text-[#5f6b7c]">Review and process requests without the clutter.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintSummary}
              className="inline-flex items-center gap-2 h-10 rounded-none border border-[#b6bec8] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]"
            >
              <FileText className="h-3.5 w-3.5" />
              Print Summary
            </button>

            <button
              onClick={() => {
                fetchApprovalRequests();
                fetchApprovalStats();
              }}
              className="inline-flex items-center gap-2 h-10 rounded-none border border-[#154279] bg-[#154279] px-4 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#10335f]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="border border-[#bcc3cd] bg-[#eef1f4] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Pending Approvals</p>
          <p className="mt-1 text-[34px] font-bold leading-none text-[#1f2937]">{approvalStats?.pending || 0}</p>
          <p className="mt-1 text-[12px] font-medium text-[#5f6b7c]">Needs review</p>
        </div>
        <div className="border border-[#bcc3cd] bg-[#eef1f4] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Total Requests</p>
          <p className="mt-1 text-[34px] font-bold leading-none text-[#1f2937]">{approvalStats?.total || 0}</p>
          <p className="mt-1 text-[12px] font-medium text-[#5f6b7c]">All records</p>
        </div>
        <div className="border border-[#bcc3cd] bg-[#eef1f4] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Approved</p>
          <p className="mt-1 text-[34px] font-bold leading-none text-[#1f2937]">{approvalStats?.approved || 0}</p>
          <p className="mt-1 text-[12px] font-medium text-[#5f6b7c]">Processed ok</p>
        </div>
        <div className="border border-[#bcc3cd] bg-[#eef1f4] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Rejected</p>
          <p className="mt-1 text-[34px] font-bold leading-none text-[#1f2937]">{approvalStats?.rejected || 0}</p>
          <p className="mt-1 text-[12px] font-medium text-[#5f6b7c]">Needs correction</p>
        </div>
      </div>

      {/* Filters and Search */}
      <section className="border border-[#bcc3cd] bg-[#eef1f4] p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8595] h-4 w-4" />
            <Input
              placeholder="Search approvals by ID, user, or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 h-10 rounded-none border border-[#b6bec8] bg-white text-[13px]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-none border border-[#b6bec8] bg-white px-3 text-[13px] font-semibold text-[#1f2937] md:min-w-[180px]"
          >
            <option value="all">ALL TYPES</option>
            <option value="permission_request">PERMISSION REQUEST</option>
            <option value="manager_assignment">MANAGER ASSIGNMENT</option>
            <option value="deposit_refund">DEPOSIT REFUND</option>
            <option value="property_addition">PROPERTY ADDITION</option>
            <option value="user_creation">USER CREATION</option>
            <option value="lease_termination">LEASE TERMINATION</option>
            <option value="maintenance_approval">MAINTENANCE APPROVAL</option>
            <option value="role_assignment">ROLE ASSIGNMENT</option>
            <option value="tenant_addition">TENANT ADDITION</option>
            <option value="tenant_removal">TENANT REMOVAL</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-none border border-[#b6bec8] bg-white px-3 text-[13px] font-semibold text-[#1f2937] md:min-w-[150px]"
          >
            <option value="all">ALL STATUS</option>
            <option value="pending">PENDING</option>
            <option value="under_review">UNDER REVIEW</option>
            <option value="approved">APPROVED</option>
            <option value="rejected">REJECTED</option>
          </select>

          <button
            onClick={handleSearch}
            className="inline-flex items-center justify-center gap-2 h-10 rounded-none border border-[#154279] bg-[#154279] px-4 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#10335f]"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>
      </section>

      {/* Approvals Table */}
      <section className="border border-[#bcc3cd] bg-[#eef1f4]">
        <div className="border-b border-[#c4cad3] px-4 py-3">
          <h2 className="text-[20px] font-bold text-[#1f2937]">Approval Requests</h2>
          <p className="text-[12px] font-medium text-[#5f6b7c]">
            {filteredApprovals.length} requests found
          </p>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No pending approvals</h3>
              <p className="text-gray-500">All requests have been processed</p>
            </div>
          ) : (
            <div className="border border-[#c4cad3] bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#c4cad3] bg-[#e8ecf1] hover:bg-[#e8ecf1]">
                    <TableHead>Request</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovals.map((approval) => (
                    <TableRow
                      key={approval.id}
                      className={selectedApproval === approval.id ? "bg-[#f0f4f9]" : "hover:bg-[#f7f9fc]"}
                      onClick={() => {
                        setSelectedApproval(approval.id);
                      }}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {`${approval.request_type.replace(
                              "_",
                              " "
                            )} - #${approval.id.slice(0, 8)}`}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {approval.notes || "No details provided"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getTypeColor((approval as any).request_type)}
                        >
                          {(approval as any).request_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {approval.requested_by_user?.first_name?.[0] ||
                                "U"}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {approval.requested_by_user?.first_name}{" "}
                              {approval.requested_by_user?.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {approval.requested_by_user?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {approval.request_data?.name ? (
                          <div className="flex items-center gap-2">
                            <Home className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">
                              {approval.request_data.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getPriorityColor("medium")}
                        >
                          Medium
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(approval.status)}
                        >
                          {approval.status === 'in_progress' ? 'Under Review' : approval.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {formatDate(approval.created_at)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {approval.status === "pending"
                              ? "Pending"
                              : approval.status}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => viewApprovalDetails(approval)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {approval.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleApprove(approval.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedApprovalData(approval);
                                  setIsRejectDialogOpen(true);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => viewApprovalDetails(approval)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {approval.requested_by_user?.email && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    window.location.href = `mailto:${approval.requested_by_user.email}`;
                                  }}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Email User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Report Issue
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>

      {/* View Approval Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Approval Request Details</DialogTitle>
            <DialogDescription className="text-gray-600">
              Review all details before making a decision
            </DialogDescription>
          </DialogHeader>

          {selectedApprovalData && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {`${selectedApprovalData.request_type.replace(
                        "_",
                        " "
                      )} - #${selectedApprovalData.id.slice(0, 8)}`}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className={getTypeColor(
                          selectedApprovalData.request_type
                        )}
                      >
                        {selectedApprovalData.request_type.replace("_", " ")}
                      </Badge>
                      <Badge className={getPriorityColor("medium")}>
                        Medium Priority
                      </Badge>
                      <Badge
                        className={getStatusColor(selectedApprovalData.status)}
                      >
                        {selectedApprovalData.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Submitted</div>
                    <div className="font-medium">
                      {formatDate(selectedApprovalData.created_at)}
                    </div>
                  </div>
                </div>

                <Separator />
              </div>

              {/* Submitted By */}
              <div className="space-y-3">
                <h4 className="font-semibold">Submitted By</h4>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {selectedApprovalData.requested_by_user
                        ?.first_name?.[0] || "U"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {selectedApprovalData.requested_by_user?.first_name}{" "}
                      {selectedApprovalData.requested_by_user?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedApprovalData.requested_by_user?.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              {selectedApprovalData.request_data?.name && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Request Details</h4>
                  <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Name</div>
                      <div className="font-medium">
                        {selectedApprovalData.request_data.name}
                      </div>
                    </div>
                    {selectedApprovalData.request_data.address && (
                      <div>
                        <div className="text-sm text-gray-500">Address</div>
                        <div className="font-medium flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {selectedApprovalData.request_data.address}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Request Notes */}
              <div className="space-y-3">
                <h4 className="font-semibold">Notes / Reason</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedApprovalData.notes || "No notes provided"}
                  </p>
                </div>
              </div>
              
              {/* Admin Reply Input */}
               {selectedApprovalData.status === "pending" || selectedApprovalData.status === "in_progress" ? (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" /> Administrative Reply (Optional)
                  </h4>
                  <Textarea
                    placeholder="Enter a message back to the manager (e.g. Approved, please proceed)"
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    className="bg-white border-blue-100 focus:border-blue-400"
                    rows={3}
                  />
                </div>
               ) : null}

              {/* Attachments */}
              {selectedApprovalData.attachments &&
                selectedApprovalData.attachments.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Attachments</h4>
                    <div className="space-y-2">
                      {selectedApprovalData.attachments.map(
                        (attachment: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 border rounded-lg"
                          >
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm flex-1">
                              {attachment.name}
                            </span>
                            <Button size="sm" variant="outline">
                              Download
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              {(selectedApprovalData.status === "pending" || selectedApprovalData.status === "in_progress") && (
                <>
                  <Separator />
                  <div className="flex justify-end gap-3 flex-wrap sm:flex-nowrap">
                   <Button
                      variant="outline"
                      onClick={() => {
                         // Send reply only
                         handleReply();
                      }}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      disabled={!adminReply.trim()}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Reply & Review
                    </Button>
                    <div className="hidden sm:block h-6 w-px bg-slate-200 mx-2"></div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (adminReply.trim()) setRejectionReason(adminReply);
                        setIsRejectDialogOpen(true);
                        setIsViewDialogOpen(false);
                      }}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {adminReply.trim() ? "Reply & Reject" : "Reject"}
                    </Button>
                    <Button
                      onClick={() => handleApprove()}
                      className="text-white bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {adminReply.trim() ? "Reply & Approve" : "Approve"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Reject Approval Request</DialogTitle>
            <DialogDescription className="text-gray-600">
              Please provide a reason for rejecting this request. The user will
              be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                className="border-gray-200 focus:border-gray-400 resize-none"
                rows={4}
              />
            </div>
            <div className="text-sm text-gray-500">
              This reason will be sent to the user who submitted the request.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleReject} variant="destructive">
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
};

export default ApprovalQueue;
