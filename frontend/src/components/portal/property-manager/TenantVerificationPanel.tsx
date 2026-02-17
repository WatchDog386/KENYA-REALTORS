// src/components/portal/property-manager/TenantVerificationPanel.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getTenantVerificationsForManager, verifyTenant, TenantVerification } from "@/services/approvalService";
import { useAuth } from "@/contexts/AuthContext";

export const TenantVerificationPanel: React.FC = () => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<TenantVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadVerifications();
  }, [user?.id]);

  const loadVerifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getTenantVerificationsForManager(user.id);
      setVerifications(data);
    } catch (error) {
      console.error("Error loading verifications:", error);
      toast.error("Failed to load pending tenant verifications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verificationId: string) => {
    if (!user?.id) return;

    try {
      setProcessingId(verificationId);
      await verifyTenant(verificationId, user.id, true);
      setVerifications((prev) => prev.filter((v) => v.id !== verificationId));
      toast.success("Tenant approved successfully");
    } catch (error) {
      console.error("Error approving tenant:", error);
      toast.error("Failed to approve tenant");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (verificationId: string) => {
    if (!user?.id) return;

    const notes = rejectNotes[verificationId] || "";
    if (!notes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessingId(verificationId);
      await verifyTenant(verificationId, user.id, false, notes);
      setVerifications((prev) => prev.filter((v) => v.id !== verificationId));
      setRejectNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[verificationId];
        return newNotes;
      });
      setShowRejectInput((prev) => {
        const newShow = { ...prev };
        delete newShow[verificationId];
        return newShow;
      });
      toast.success("Tenant rejection sent");
    } catch (error) {
      console.error("Error rejecting tenant:", error);
      toast.error("Failed to reject tenant");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (verifications.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center"
      >
        <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
        <p className="text-slate-700 font-medium">No pending tenant verifications</p>
        <p className="text-sm text-slate-600 mt-1">All tenant registrations have been reviewed</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800">Tenant Verification Requests</h3>
        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-lg">
          {verifications.length} pending
        </span>
      </div>

      <div className="space-y-3">
        {verifications.map((verification) => (
          <motion.div
            key={verification.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white border-2 border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              {/* Tenant Info */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Tenant Information</p>
                <p className="font-bold text-slate-800">House Number: {verification.house_number}</p>
                <p className="text-sm text-slate-600 mt-1">Status: <span className="font-bold text-orange-600">Pending Verification</span></p>
              </div>

              {/* Property Info */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Property</p>
                <p className="font-bold text-slate-800">{verification.property_id}</p>
                <p className="text-sm text-slate-600 mt-1">Registered: {new Date(verification.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Verification Notes */}
            {verification.verification_notes && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs font-bold text-green-800">Verification Notes:</p>
                <p className="text-sm text-green-700">{verification.verification_notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => handleApprove(verification.id)}
                disabled={processingId === verification.id}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === verification.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Approve
              </button>

              <button
                onClick={() => setShowRejectInput((prev) => ({ ...prev, [verification.id]: !prev[verification.id] }))}
                disabled={processingId === verification.id}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </div>

            {/* Reject Input */}
            {showRejectInput[verification.id] && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2"
              >
                <p className="text-xs font-bold text-red-800">Reason for rejection:</p>
                <textarea
                  value={rejectNotes[verification.id] || ""}
                  onChange={(e) => setRejectNotes((prev) => ({ ...prev, [verification.id]: e.target.value }))}
                  placeholder="Explain why this tenant is being rejected..."
                  className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm text-slate-700 placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowRejectInput((prev) => ({ ...prev, [verification.id]: false }));
                      setRejectNotes((prev) => {
                        const newNotes = { ...prev };
                        delete newNotes[verification.id];
                        return newNotes;
                      });
                    }}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(verification.id)}
                    disabled={processingId === verification.id}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-1"
                  >
                    {processingId === verification.id && <Loader2 className="w-3 h-3 animate-spin" />}
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
