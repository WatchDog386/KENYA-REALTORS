import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CreditCard, AlertTriangle, Droplets, Home, Zap, Trash2, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatCurrency";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PaystackPaymentDialog from "@/components/dialogs/PaystackPaymentDialog";

const MakePaymentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const paymentTypeParam = searchParams.get('type');
  const referenceId = searchParams.get('id');
  const dueAmount = searchParams.get('amount') ? parseFloat(searchParams.get('amount')!) : 0;

  const [paymentType, setPaymentType] = useState<string | null>(paymentTypeParam);
  const [amount, setAmount] = useState(dueAmount > 0 ? dueAmount.toString() : "");
  const [remarks, setRemarks] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [showPaystackDialog, setShowPaystackDialog] = useState(false);

  useEffect(() => {
    if (paymentTypeParam) {
        setPaymentType(paymentTypeParam);
    }
    // Fetch user email for Paystack
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, [paymentTypeParam, user?.email]);

  useEffect(() => {
    if (referenceId && paymentType) {
        fetchDetails();
    }
  }, [referenceId, paymentType]);

  const fetchDetails = async () => {
      try {
          if (paymentType === 'rent') {
              const { data } = await supabase.from('rent_payments').select('*').eq('id', referenceId).single();
              setDetails(data);
          } else {
              // 'water' or 'utility' both come from bills_and_utilities
              const { data } = await supabase.from('bills_and_utilities').select('*').eq('id', referenceId).single();
              setDetails(data);
          }
      } catch (e) {
          console.error("Error fetching bill details", e);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !amount) {
      toast.error("Please enter an amount");
      return;
    }

    if (!userEmail) {
      toast.error("Email not found. Please ensure you're logged in.");
      return;
    }

    // Open Paystack payment dialog
    setShowPaystackDialog(true);
  };

  const handlePaystackPaymentSuccess = async (transactionRef: string, paymentData: any) => {
    setLoading(true);
    try {
      const payAmount = parseFloat(amount);
      
      if (paymentType && referenceId && details) {
          // Update existing record
          const currentPaid = details.amount_paid || details.paid_amount || 0;
          const totalDue = details.amount || 0;
          const newPaidTotal = currentPaid + payAmount;
          
          let status = 'partial';
          if (newPaidTotal >= totalDue) status = 'completed';

          if (paymentType === 'rent') {
              const { error } = await supabase
                  .from('rent_payments')
                  .update({
                      amount_paid: newPaidTotal,
                      status: status,
                      payment_method: 'paystack',
                      paid_date: new Date().toISOString(),
                      remarks: remarks || details.remarks,
                      transaction_reference: transactionRef
                  })
                  .eq('id', referenceId);
              if (error) throw error;
          } else {
               const { error } = await supabase
                  .from('bills_and_utilities')
                  .update({
                      paid_amount: newPaidTotal,
                      status: status,
                      remarks: remarks || details.remarks,
                      payment_reference: transactionRef
                  })
                  .eq('id', referenceId);
               if (error) throw error;
          }
      } else {
          // New Manual Payment
           const { data: tenant } = await supabase
            .from("tenants")
            .select("id, unit_id, property_id")
            .eq("user_id", user.id)
            .single();

           if (!tenant) throw new Error("Tenant not found");

           // If it's rent, insert into rent_payments
           if (paymentType === 'rent') {
               const { error } = await supabase.from("rent_payments").insert([
                {
                  tenant_id: tenant.id,
                  unit_id: tenant.unit_id,
                  property_id: tenant.property_id,
                  amount: payAmount,
                  amount_paid: payAmount,
                  payment_date: new Date().toISOString(),
                  due_date: new Date().toISOString(),
                  payment_method: 'paystack',
                  status: "completed",
                  remarks: remarks || "Rent Payment via Paystack",
                  transaction_reference: transactionRef
                },
              ]);
              if (error) throw error;
           } else {
               const { error } = await supabase.from("bills_and_utilities").insert([
                   {
                       unit_id: tenant.unit_id,
                       bill_type: paymentType || 'utility',
                       amount: payAmount,
                       paid_amount: payAmount,
                       bill_date: new Date().toISOString(),
                       due_date: new Date().toISOString(),
                       status: 'completed',
                       remarks: remarks || `${paymentType} Payment via Paystack`,
                       payment_reference: transactionRef
                   }
               ]);
               if (error) throw error;
           }
      }

      toast.success("Payment processed successfully via Paystack!");
      navigate("/portal/tenant/payments");
    } catch (err) {
      console.error("Error processing payment:", err);
      toast.error("Failed to process payment");
    } finally {
      setLoading(false);
      setShowPaystackDialog(false);
    }
  };

  const getTitle = () => {
      if (paymentType === 'water') return 'Pay Water Bill';
      if (paymentType === 'rent') return 'Pay Rent';
      if (details?.bill_type) {
          return `Pay ${details.bill_type.charAt(0).toUpperCase() + details.bill_type.slice(1)} Bill`;
      }
      if (paymentType) return `Pay ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}`;
      return 'Make a Payment';
  };

  const getIcon = (type: string | null = paymentType) => {
      if (type === 'rent') return <Home size={24} className="text-blue-600"/>;
      if (type === 'water') return <Droplets size={24} className="text-cyan-600"/>;
      if (type === 'electricity') return <Zap size={24} className="text-yellow-500"/>;
      if (type === 'garbage') return <Trash2 size={24} className="text-green-600"/>;
      return <HelpCircle size={24} className="text-purple-600"/>; 
  };

  if (!paymentType) {
      // Payment Type Selection Screen
      return (
        <div className="space-y-6 max-w-4xl mx-auto font-nunito min-h-screen bg-slate-50 py-10 px-6">
            <div className="flex items-center gap-3 mb-8">
                <button
                onClick={() => navigate("/portal/tenant/payments")}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                <h1 className="text-3xl font-bold text-slate-900">Make New Payment</h1>
                <p className="text-slate-500">Select what you want to pay for</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { id: 'rent', label: 'Rent', icon: Home, color: 'bg-blue-50 text-blue-600 border-blue-100' },
                    { id: 'water', label: 'Water Bill', icon: Droplets, color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
                    { id: 'electricity', label: 'Electricity', icon: Zap, color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
                    { id: 'garbage', label: 'Garbage Collection', icon: Trash2, color: 'bg-green-50 text-green-600 border-green-100' },
                    { id: 'other', label: 'Other / Custom', icon: HelpCircle, color: 'bg-purple-50 text-purple-600 border-purple-100' },
                ].map((item) => (
                    <Card 
                        key={item.id} 
                        className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md border-2 border-transparent hover:border-slate-200`}
                        onClick={() => setPaymentType(item.id)}
                    >
                        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                            <div className={`p-4 rounded-full ${item.color}`}>
                                <item.icon size={32} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">{item.label}</h3>
                                <p className="text-sm text-slate-500 mt-1">Pay your {item.label.toLowerCase()}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto font-nunito min-h-screen bg-slate-50 py-10 px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
              if (referenceId) navigate("/portal/tenant/payments");
              else setPaymentType(null); // Go back to selection if no ID
          }}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#154279] to-[#F96302]">
            {getTitle()}
          </h1>
          <p className="text-sm text-gray-600">Secure payment gateway</p>
        </div>
      </div>

      <div className="grid gap-6">
        {details && (
            <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                        {getIcon()}
                        Bill Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-medium text-gray-900">{details.due_date ? new Date(details.due_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Total Due:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(details.amount)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Already Paid:</span>
                        <span className="font-bold text-green-700">{formatCurrency(details.amount_paid || details.paid_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                        <span className="text-blue-900 font-semibold">Remaining Balance:</span>
                        <span className="font-bold text-blue-900">
                            {formatCurrency((details.amount || 0) - (details.amount_paid || details.paid_amount || 0))}
                        </span>
                    </div>
                </CardContent>
            </Card>
        )}

        <Card className="shadow-lg border-t-4 border-t-[#F96302]">
            <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Enter amount and payment information</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Amount Input */}
                <div className="space-y-2">
                    <Label>Amount (KES)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                            KSh
                        </span>
                        <Input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="pl-12 text-lg font-semibold"
                        />
                    </div>
                </div>

                {/* Payment Method - Paystack Only */}
                <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="w-full border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-green-50 border-green-300 flex flex-col items-center justify-center gap-3">
                        <div className="flex items-center gap-2">
                            <CreditCard size={24} className="text-green-600"/>
                            <div>
                                <p className="font-bold text-green-700">Paystack Payment</p>
                                <p className="text-xs text-green-600">Secure online payment</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500">All payments are securely processed through Paystack. Your card details are never stored on our servers.</p>
                </div>

                {/* Remarks Field */}
                <div className="space-y-2">
                    <Label>Remarks / Payment For</Label>
                    <Textarea 
                        placeholder={details?.remarks ? `Current remark: ${details.remarks}` : "Specify what you are paying for (e.g. rent for January, partial payment...)"}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="resize-none"
                    />
                    <p className="text-xs text-slate-400">Add any specific details about this payment.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg flex gap-3 items-start text-sm text-slate-600">
                    <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={16} />
                    <p>By proceeding, you confirm this payment is accurate. A digital receipt will be created immediately.</p>
                </div>

                <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#154279] hover:bg-[#0f325e] text-white py-4 px-4 rounded-xl font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                {loading ? "Processing..." : `Pay via Paystack - ${amount ? formatCurrency(parseFloat(amount)) : '0.00'}`}
                </button>
            </form>
            </CardContent>
        </Card>
      </div>

      {/* Paystack Payment Dialog */}
      <PaystackPaymentDialog
        open={showPaystackDialog}
        onOpenChange={setShowPaystackDialog}
        email={userEmail}
        amount={parseFloat(amount) || 0}
        description={`${getTitle()} Payment`}
        paymentType={paymentType as any}
        referenceId={referenceId || undefined}
        onPaymentSuccess={handlePaystackPaymentSuccess}
        onPaymentError={(error) => {
          toast.error(error);
          setShowPaystackDialog(false);
        }}
      />
    </div>
  );
};

export default MakePaymentPage;
