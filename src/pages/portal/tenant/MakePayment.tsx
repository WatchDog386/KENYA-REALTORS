import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MakePaymentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!tenant) {
        toast.error("Tenant profile not found");
        return;
      }

      const { error } = await supabase.from("rent_payments").insert([
        {
          tenant_id: tenant.id,
          amount: parseFloat(amount),
          payment_date: new Date().toISOString(),
          due_date: new Date().toISOString(),
          payment_method: paymentMethod,
          status: "completed",
        },
      ]);

      if (error) throw error;

      toast.success("Payment recorded successfully!");
      navigate("/portal/tenant/payments");
    } catch (err) {
      console.error("Error processing payment:", err);
      toast.error("Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/portal/tenant/payments")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight">
            Make a Payment
          </h1>
          <p className="text-sm text-gray-600">Submit your rent payment</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00356B] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00356B] focus:border-transparent"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="text-blue-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Payment Processing
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your payment will be processed securely and you'll receive
                    a confirmation email.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00356B] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#002a54] transition-colors disabled:opacity-50"
            >
              {loading ? "Processing..." : "Submit Payment"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MakePaymentPage;
