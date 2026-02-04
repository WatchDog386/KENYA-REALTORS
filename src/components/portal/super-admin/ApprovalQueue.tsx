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
  Download,
  Eye,
  Check,
  X,
  AlertCircle,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
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
import { useApprovalSystem } from "@/hooks/useApprovalSystem";
import { toast } from "sonner";
import { formatDate } from "@/utils/dateHelpers";
import { formatCurrency } from "@/utils/formatCurrency";

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
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      // Filter locally based on search query
      // Or fetch with filters if backend supports it
      await fetchApprovalRequests();
    } else {
      await fetchApprovalRequests();
    }
  };

  // Filter approvals
  const filteredApprovals = approvals?.filter((approval) => {
    if (typeFilter !== "all" && (approval as any).request_type !== typeFilter) return false;
    if (statusFilter !== "all" && approval.status !== statusFilter)
      return false;
    return true;
  });

  // Handle approve
  const handleApprove = async (approvalId: string) => {
    try {
      await approveRequest(approvalId);
      toast.success("Request approved successfully");

      if (onApprovalUpdate) {
        onApprovalUpdate(approvalId, "approved");
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

      if (onApprovalUpdate) {
        onApprovalUpdate(selectedApprovalData.id, "rejected");
      }
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  // View approval details
  const viewApprovalDetails = (approval: any) => {
    setSelectedApprovalData(approval);
    setIsViewDialogOpen(true);
  };

  // Get approval type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case "property_listing":
        return "bg-blue-100 text-blue-800";
      case "tenant_application":
        return "bg-green-100 text-green-800";
      case "maintenance_request":
        return "bg-orange-100 text-orange-800";
      case "payment_verification":
        return "bg-purple-100 text-purple-800";
      case "contract_renewal":
        return "bg-indigo-100 text-indigo-800";
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

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#154279] to-[#0f325e] text-white py-12 px-6 shadow-xl mb-8 lg:rounded-b-3xl">
        <HeroBackground />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-[1400px] mx-auto">
          <div className="space-y-1">
             <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-inner">
                    <CheckCircle className="w-5 h-5 text-white" />
                 </div>
                 <span className="text-blue-100 font-bold tracking-wider text-xs uppercase">Requests</span>
             </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Approval <span className="text-[#F96302]">Queue</span>
            </h1>
            <p className="text-blue-100 text-sm mt-2 font-medium max-w-xl">
              Review, approve, or reject pending requests and system actions.
            </p>
          </div>

          <div className="flex items-center gap-3">
             <button
              className="group flex items-center gap-2 bg-white/10 text-white px-5 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all duration-300 rounded-xl border border-white/20 hover:border-white/40 shadow-sm backdrop-blur-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export Queue
            </button>
            
            <button
              onClick={() => {
                fetchApprovalRequests();
                fetchApprovalStats();
              }}
              className="group flex items-center gap-2 bg-white text-[#154279] px-5 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-blue-50 transition-all duration-300 rounded-xl shadow-lg border-2 border-white hover:shadow-xl hover:-translate-y-0.5"
            >
               <div className="mr-1 group-hover:rotate-180 transition-transform duration-500">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
               </div>
               Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-slate-200 bg-white hover:border-[#154279] transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-700">
              Pending Approvals
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#154279]">
              {approvalStats?.pending || 0}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Pending requests</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 bg-white hover:border-[#154279] transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-700">
              Total Requests
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#154279]">
              {approvalStats?.total || 0}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {approvalStats?.pending || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 bg-white hover:border-[#154279] transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-700">Approved</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#154279]">
              {approvalStats?.approved || 0}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {(
                ((approvalStats?.approved || 0) /
                  Math.max(approvalStats?.total || 1, 1)) *
                100
              ).toFixed(0)}
              % approval rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 bg-white hover:border-[#154279] transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-700">Rejected</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#154279]">
              {approvalStats?.rejected || 0}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {(
                ((approvalStats?.rejected || 0) /
                  Math.max(approvalStats?.total || 1, 1)) *
                100
              ).toFixed(0)}
              % rejection rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-2 border-slate-200 bg-white shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search approvals by ID, user, or property..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 bg-white border-2 border-slate-200 rounded-xl focus:border-[#154279] focus:ring-0"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] bg-white border-2 border-slate-200 rounded-xl text-slate-700">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="property_listing">
                    Property Listing
                  </SelectItem>
                  <SelectItem value="tenant_application">
                    Tenant Application
                  </SelectItem>
                  <SelectItem value="maintenance_request">
                    Maintenance Request
                  </SelectItem>
                  <SelectItem value="payment_verification">
                    Payment Verification
                  </SelectItem>
                  <SelectItem value="contract_renewal">
                    Contract Renewal
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-white border-2 border-slate-200 rounded-xl text-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={handleSearch}
                className="group flex items-center gap-2 bg-[#154279] text-white px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest hover:bg-[#0f325e] transition-all duration-300 rounded-xl shadow-md hover:shadow-lg border-2 border-[#154279]"
              >
                <Filter className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                Filter
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approvals Table */}
      <Card className="border-2 border-slate-200 bg-white shadow-lg">
        <CardHeader className="pb-4 border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="text-[#154279] font-black text-xl">Approval Requests</CardTitle>
          <CardDescription className="text-slate-600 font-medium mt-1">
            {filteredApprovals.length} requests found
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
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
                      className={
                        selectedApproval === approval.id ? "bg-gray-50" : ""
                      }
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
                          {approval.status.replace("_", " ")}
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
        </CardContent>
      </Card>

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
                <h4 className="font-semibold">Notes</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedApprovalData.notes || "No notes provided"}
                  </p>
                </div>
              </div>

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
              {selectedApprovalData.status === "pending" && (
                <>
                  <Separator />
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsRejectDialogOpen(true);
                        setIsViewDialogOpen(false);
                      }}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => {
                        handleApprove(selectedApprovalData.id);
                        setIsViewDialogOpen(false);
                      }}
                      className="text-white bg-electric hover:bg-electric/90"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
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
