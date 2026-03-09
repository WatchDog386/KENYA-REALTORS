import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RefundRequest {
  id: string;
  depositAmount: number;
  requestDate: string;
  status: "pending" | "processing" | "approved" | "completed" | "disputed";
  estimatedReturnDate?: string;
  actualReturnDate?: string;
  deductions: Array<{
    reason: string;
    amount: number;
  }>;
  refundAmount: number;
  notes?: string;
}

const RefundStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const [refunds, setRefunds] = useState<RefundRequest[]>([
    {
      id: "1",
      depositAmount: 1500,
      requestDate: "2026-01-15",
      status: "processing",
      estimatedReturnDate: "2026-02-15",
      deductions: [],
      refundAmount: 1500,
      notes: "Standard security deposit return process",
    },
    {
      id: "2",
      depositAmount: 2000,
      requestDate: "2025-12-01",
      status: "completed",
      actualReturnDate: "2025-12-20",
      deductions: [
        {
          reason: "Carpet cleaning",
          amount: 200,
        },
        {
          reason: "Wall repair",
          amount: 150,
        },
      ],
      refundAmount: 1650,
      notes: "Deductions for maintenance items",
    },
  ]);

  // Mock CRUD functions for future implementation
  /*
  const fetchRefunds = async () => {
    try {
      const response = await fetch(`/api/tenant/refunds`);
      const data = await response.json();
      setRefunds(data);
    } catch (error) {
      console.error("Error fetching refunds:", error);
    }
  };

  const createRefundRequest = async (newRequest: Omit<RefundRequest, 'id'>) => {
    try {
      const response = await fetch(`/api/tenant/refunds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      });
      const data = await response.json();
      setRefunds([...refunds, data]);
    } catch (error) {
      console.error("Error creating refund request:", error);
    }
  };

  const updateRefundStatus = async (id: string, updatedStatus: Partial<RefundRequest>) => {
    try {
      const response = await fetch(`/api/tenant/refunds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStatus),
      });
      const data = await response.json();
      setRefunds(refunds.map(refund => refund.id === id ? data : refund));
    } catch (error) {
      console.error("Error updating refund status:", error);
    }
  };

  const deleteRefundRequest = async (id: string) => {
    try {
      await fetch(`/api/tenant/refunds/${id}`, {
        method: 'DELETE',
      });
      setRefunds(refunds.filter(refund => refund.id !== id));
    } catch (error) {
      console.error("Error deleting refund request:", error);
    }
  };
  */

  const getStatusColor = (status: RefundRequest["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "processing":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "approved":
        return "bg-green-50 border-green-200 text-green-800";
      case "completed":
        return "bg-emerald-50 border-emerald-200 text-emerald-800";
      case "disputed":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getStatusIcon = (status: RefundRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Clock size={18} />;
      case "processing":
        return <Clock size={18} />;
      case "approved":
        return <CheckCircle size={18} />;
      case "completed":
        return <CheckCircle size={18} />;
      case "disputed":
        return <AlertCircle size={18} />;
      default:
        return <DollarSign size={18} />;
    }
  };

  const getStatusLabel = (status: RefundRequest["status"]) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/portal/tenant")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight">
            Refund Status
          </h1>
          <p className="text-sm text-gray-600">Track your deposit refund requests</p>
        </div>
      </div>

      {refunds.length > 0 ? (
        <div className="space-y-4">
          {refunds.map((refund) => (
            <Card key={refund.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header with status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Request Date</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(refund.requestDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border font-medium text-sm ${getStatusColor(
                        refund.status
                      )}`}
                    >
                      {getStatusIcon(refund.status)}
                      {getStatusLabel(refund.status)}
                    </div>
                  </div>

                  {/* Deposit and Refund amounts */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 uppercase font-semibold">
                        Original Deposit
                      </p>
                      <p className="text-xl font-bold text-gray-800 mt-1">
                        ${refund.depositAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-[#00356B] text-white rounded-lg">
                      <p className="text-xs font-semibold uppercase">Refund Amount</p>
                      <p className="text-xl font-bold mt-1">
                        ${refund.refundAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Deductions if any */}
                  {refund.deductions.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-semibold text-gray-800 mb-2">Deductions</p>
                      <div className="space-y-2">
                        {refund.deductions.map((deduction, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-100"
                          >
                            <div>
                              <p className="text-sm text-gray-700">{deduction.reason}</p>
                            </div>
                            <p className="font-semibold text-orange-700">
                              -${deduction.amount.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    {refund.estimatedReturnDate && refund.status !== "completed" && (
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-gray-600">Estimated Return</p>
                        <p className="font-medium text-gray-800">
                          {new Date(refund.estimatedReturnDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {refund.actualReturnDate && (
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-gray-600">Returned On</p>
                        <p className="font-medium text-green-700">
                          {new Date(refund.actualReturnDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {refund.notes && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-2">
                        Notes
                      </p>
                      <p className="text-sm text-gray-700">{refund.notes}</p>
                    </div>
                  )}

                  {/* Dispute button for completed refunds */}
                  {refund.status === "completed" && (
                    <button className="w-full mt-4 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm">
                      Dispute Refund
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500 text-center py-8">
              No refund requests found. You will see your deposit refund status here when you move out.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Refund Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-blue-900">Refund Timeline:</span> Deposits are
              typically processed within 30 days of move-out. You'll receive updates on this page.
            </p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-blue-900">Deductions:</span> Any deductions for
              damages or unpaid fees will be itemized and shown in your refund details.
            </p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-blue-900">Questions:</span> If you have questions
              about your refund, contact support through the Help section.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RefundStatusPage;
