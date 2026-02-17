// src/components/portal/super-admin/ManagerApprovalPanel.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getManagerApprovalsForAdmin, approvePropertyManager, ManagerApproval } from "@/services/approvalService";
import { useAuth } from "@/contexts/AuthContext";

export const ManagerApprovalPanel: React.FC = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ManagerApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadApprovals();
  }, [user?.id]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const data = await getManagerApprovalsForAdmin();
      setApprovals(data);
    } catch (error) {
      console.error("Error loading approvals:", error);
      toast.error("Failed to load pending manager approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    if (!user?.id) return;

    try {
      setProcessingId(approvalId);
      await approvePropertyManager(approvalId, user.id, true);
      setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
      toast.success("Property manager approved successfully");
    } catch (error) {
      console.error("Error approving manager:", error);
      toast.error("Failed to approve property manager");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (approvalId: string) => {
    if (!user?.id) return;

    const notes = rejectNotes[approvalId] || "";
    if (!notes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessingId(approvalId);
      await approvePropertyManager(approvalId, user.id, false, notes);
      setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
      setRejectNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[approvalId];
        return newNotes;
      });
      setShowRejectInput((prev) => {
        const newShow = { ...prev };
        delete newShow[approvalId];
        return newShow;
      });
      toast.success("Property manager rejection sent");
    } catch (error) {
      console.error("Error rejecting manager:", error);
      toast.error("Failed to reject property manager");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-purple-50 border border-purple-200 rounded-lg text-center"
      >
        <AlertCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
        <p className="text-slate-700 font-medium">No pending manager approvals</p>
        <p className="text-sm text-slate-600 mt-1">All property manager registrations have been reviewed</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800">Property Manager Approval Requests</h3>
        <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-lg">
          {approvals.length} pending
        </span>
      </div>

      <div className="space-y-3">
        {approvals.map((approval) => (
          <motion.div
            key={approval.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white border-2 border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              {/* Manager Info */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Manager Information</p>
                <p className="font-bold text-slate-800">ID: {approval.manager_id}</p>
                <p className="text-sm text-slate-600 mt-1">Status: <span className="font-bold text-purple-600">Pending Approval</span></p>
              </div>

              {/* Managed Properties */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Managed Properties</p>
                <div className="flex flex-wrap gap-1">
                  {approval.managed_properties && approval.managed_properties.length > 0 ? (
                    approval.managed_properties.map((prop, idx) => (
                      <span key={idx} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-lg font-medium">
                        {prop}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-600">No properties assigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="text-sm text-slate-600 mb-3">
              <p>Applied: {new Date(approval.created_at).toLocaleDateString()} {new Date(approval.created_at).toLocaleTimeString()}</p>
            </div>

            {/* Approval Notes */}
            {approval.approval_notes && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs font-bold text-green-800">Approval Notes:</p>
                <p className="text-sm text-green-700">{approval.approval_notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => handleApprove(approval.id)}
                disabled={processingId === approval.id}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === approval.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Approve
              </button>

              <button
                onClick={() => setShowRejectInput((prev) => ({ ...prev, [approval.id]: !prev[approval.id] }))}
                disabled={processingId === approval.id}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </div>

            {/* Reject Input */}
            {showRejectInput[approval.id] && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2"
              >
                <p className="text-xs font-bold text-red-800">Reason for rejection:</p>
                <textarea
                  value={rejectNotes[approval.id] || ""}
                  onChange={(e) => setRejectNotes((prev) => ({ ...prev, [approval.id]: e.target.value }))}
                  placeholder="Explain why this manager is not approved..."
                  className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm text-slate-700 placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowRejectInput((prev) => ({ ...prev, [approval.id]: false }));
                      setRejectNotes((prev) => {
                        const newNotes = { ...prev };
                        delete newNotes[approval.id];
                        return newNotes;
                      });
                    }}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(approval.id)}
                    disabled={processingId === approval.id}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-1"
                  >
                    {processingId === approval.id && <Loader2 className="w-3 h-3 animate-spin" />}
                    Confirm Rejection
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
