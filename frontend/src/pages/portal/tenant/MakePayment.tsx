import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Droplets, Home, Zap, Trash2, HelpCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatCurrency";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import PaystackPaymentDialog from "@/components/dialogs/PaystackPaymentDialog";

const MakePaymentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  console.log("⚙️ LOADED: frontend/src/pages/portal/tenant/MakePayment.tsx");
  
  const paymentTypeParam = searchParams.get('type');
  const referenceId = searchParams.get('id');
  const dueAmount = searchParams.get('amount') ? parseFloat(searchParams.get('amount')!) : 0;

    const [paymentType, setPaymentType] = useState<string | null>(paymentTypeParam);
    const [amount, setAmount] = useState(dueAmount > 0 ? dueAmount.toString() : "");
    const remarks = "";
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [showPaystackDialog, setShowPaystackDialog] = useState(false);
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  useEffect(() => {
    if (paymentTypeParam) {
        setPaymentType(paymentTypeParam);
    }
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, [paymentTypeParam, user?.email]);

  useEffect(() => {
    if (referenceId && paymentType && paymentType !== 'all') {
        fetchDetails();
    } else if (paymentType === 'all') {
        fetchTotalOutstanding();
    }
  }, [referenceId, paymentType]);

  // Debug: Log when dialog state changes
  useEffect(() => {
    console.log("showPaystackDialog changed:", showPaystackDialog);
  }, [showPaystackDialog]);

  const fetchDetails = async () => {
      try {
          if (paymentType === 'rent') {
              const { data } = await supabase.from('rent_payments').select('*').eq('id', referenceId).single();
              setDetails(data);
          } else if (paymentType === 'utility') {
              // Fetch from utility_readings instead
              const { data } = await supabase.from('utility_readings').select('*').eq('id', referenceId).single();
              if (data) {
                setDetails({
                  ...data,
                  amount: data.total_bill,
                  amount_paid: 0,
                  status: data.status
                });
              }
          } else {
              const { data } = await supabase.from('bills_and_utilities').select('*').eq('id', referenceId).single();
              setDetails(data);
          }
      } catch (e) {
          console.error("Error fetching bill details", e);
      }
  };

  const fetchTotalOutstanding = async () => {
      try {
          if (!user?.id) return;

          // Get tenant info
          const { data: tenantData } = await supabase
              .from('tenants')
              .select('unit_id, property_id')
              .eq('user_id', user.id)
              .eq('status', 'active')
              .single();
          
          if (!tenantData) return;

          // Fetch all rent payments that are not paid
          const { data: rentData } = await supabase
              .from("rent_payments")
              .select("*")
              .eq("tenant_id", user.id)
              .neq("status", "paid")
              .neq("status", "completed");

          // Fetch utility readings that are not paid
          const { data: utilityData } = await supabase
              .from("utility_readings")
              .select("*")
              .eq("unit_id", tenantData.unit_id)
              .neq("status", "paid");

          let total = 0;
          if (rentData) {
              total += rentData.reduce((sum, p) => sum + (p.amount - (p.amount_paid || 0)), 0);
          }
          if (utilityData) {
              total += utilityData.reduce((sum, u) => sum + u.total_bill, 0);
          }

          setTotalOutstanding(total);
          setAmount(total.toString());
      } catch (e) {
          console.error("Error fetching outstanding:", e);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted - handleSubmit called");
    console.log("user?.id:", user?.id);
    console.log("amount:", amount);
    console.log("userEmail:", userEmail);
    
        if (!user?.id || !amount) {
            toast.error("Please enter an amount");
            return;
        }

        if (!userEmail) {
            toast.error("Email not found. Please ensure you're logged in.");
            return;
        }

        console.log("Setting showPaystackDialog to true");
        setShowPaystackDialog(true);
        console.log("showPaystackDialog state set");
  };

  const handlePaystackPaymentSuccess = async (transactionRef: string, paymentData: any) => {
    setLoading(true);
    try {
      const payAmount = parseFloat(amount);
      const { data: tenantData } = await supabase
          .from("tenants")
          .select("id, unit_id, property_id")
          .eq("user_id", user.id)
          .single();

      if (!tenantData) throw new Error("Tenant not found");

      if (paymentType === 'all') {
          // Handle payment for all outstanding bills
          // Fetch all unpaid rent and utility readings
          const { data: rentData } = await supabase
              .from("rent_payments")
              .select("*")
              .eq("tenant_id", user.id)
              .neq("status", "paid")
              .neq("status", "completed");

          const { data: utilityData } = await supabase
              .from("utility_readings")
              .select("*")
              .eq("unit_id", tenantData.unit_id)
              .neq("status", "paid");

          let remainingPayment = payAmount;

          // Apply payments to rent first
          if (rentData && remainingPayment > 0) {
              for (const rent of rentData) {
                  const rentBalance = rent.amount - (rent.amount_paid || 0);
                  const paymentForThisRent = Math.min(remainingPayment, rentBalance);
                  
                  const newPaidTotal = (rent.amount_paid || 0) + paymentForThisRent;
                  const status = newPaidTotal >= rent.amount ? 'completed' : 'partial';

                  await supabase
                      .from('rent_payments')
                      .update({
                          amount_paid: newPaidTotal,
                          status: status,
                          payment_method: 'paystack',
                          paid_date: new Date().toISOString(),
                          remarks: remarks || `Partial payment on ${new Date().toLocaleDateString()}`,
                          transaction_reference: transactionRef
                      })
                      .eq('id', rent.id);

                  remainingPayment -= paymentForThisRent;
                  if (remainingPayment <= 0) break;
              }
          }

          // Apply remaining payment to utilities
          if (utilityData && remainingPayment > 0) {
              for (const utility of utilityData) {
                  const utilityBalance = utility.total_bill;
                  const paymentForThisUtility = Math.min(remainingPayment, utilityBalance);
                  
                  // For utility_readings, if fully paid, mark as paid
                  const status = paymentForThisUtility >= utilityBalance ? 'paid' : 'partial';

                  await supabase
                      .from('utility_readings')
                      .update({
                          status: status,
                          updated_at: new Date().toISOString()
                      })
                      .eq('id', utility.id);

                  remainingPayment -= paymentForThisUtility;
                  if (remainingPayment <= 0) break;
              }
          }
      } else if (paymentType && referenceId && details) {
          // Update existing record
          const currentPaid = details.amount_paid || 0;
          const totalDue = details.amount || 0;
          const newPaidTotal = currentPaid + payAmount;
          
          let status = 'partial';
          if (newPaidTotal >= totalDue) status = 'completed';

          if (paymentType === 'rent') {
              await supabase
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
          } else if (paymentType === 'utility') {
               // Update utility_readings
               await supabase
                  .from('utility_readings')
                  .update({
                      status: (newPaidTotal >= totalDue) ? 'paid' : 'partial',
                      updated_at: new Date().toISOString()
                  })
                  .eq('id', referenceId);
          } else {
               await supabase
                  .from('bills_and_utilities')
                  .update({
                      paid_amount: newPaidTotal,
                      status: status,
                      remarks: remarks || details.remarks,
                      payment_reference: transactionRef
                  })
                  .eq('id', referenceId);
          }
      } else {
          // New Manual Payment
           if (paymentType === 'rent') {
               await supabase.from("rent_payments").insert([
                {
                  tenant_id: tenantData.id,
                  unit_id: tenantData.unit_id,
                  property_id: tenantData.property_id,
                  amount: payAmount,
                  amount_paid: payAmount,
                  payment_date: new Date().toISOString(),
                  due_date: new Date().toISOString(),
                  payment_method: 'paystack',
                  status: "completed",
                  remarks: remarks || "Rent payment",
                  transaction_reference: transactionRef
                },
              ]);
           } else {
               await supabase.from("bills_and_utilities").insert([
                   {
                       unit_id: tenantData.unit_id,
                       bill_type: (paymentType && paymentType !== 'custom' && paymentType !== 'all') ? paymentType : 'utility',
                       amount: payAmount,
                       paid_amount: payAmount,
                       bill_date: new Date().toISOString(),
                       due_date: new Date().toISOString(),
                       status: 'paid',
                       remarks: remarks || `${paymentType || 'Utility'} payment`,
                       payment_reference: transactionRef
                   }
               ]);
           }
      }

      toast.success("Payment processed successfully!");
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
      if (paymentType === 'all') return 'Pay All Outstanding Bills';
      if (paymentType === 'utility') return 'Pay Utility Bills';
      if (paymentType === 'rent') return 'Pay Rent';
      if (details?.bill_type) {
          return `Pay ${details.bill_type.charAt(0).toUpperCase() + details.bill_type.slice(1)} Bill`;
      }
      if (paymentType) return `Pay ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}`;
      return 'Make a Payment';
  };

  const getIcon = (type: string | null = paymentType) => {
      if (type === 'all') return <CheckCircle size={24} className="text-green-600"/>;
      if (type === 'rent') return <Home size={24} className="text-blue-600"/>;
      if (type === 'utility') return <Droplets size={24} className="text-cyan-600"/>;
      if (type === 'electricity') return <Zap size={24} className="text-yellow-500"/>;
      if (type === 'garbage') return <Trash2 size={24} className="text-green-600"/>;
      return <HelpCircle size={24} className="text-purple-600"/>; 
  };

  if (!paymentType) {
      // Payment Type Selection Screen
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-nunito py-10 px-4">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <button
                    onClick={() => navigate("/portal/tenant/payments")}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                    <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                    <h1 className="text-4xl font-bold text-slate-900">Make Payment</h1>
                    <p className="text-slate-600 mt-1">Select what you want to pay for</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { id: 'all', label: 'Pay All Bills', description: 'Pay rent + utilities combined', icon: CheckCircle, color: 'bg-gradient-to-br from-green-50 to-emerald-50 text-green-600 border-green-200', badge: 'Recommended' },
                        { id: 'rent', label: 'Rent Payment', description: 'Pay your monthly rent', icon: Home, color: 'bg-blue-50 text-blue-600 border-blue-100' },
                        { id: 'utility', label: 'Utility Bills', description: 'Pay water, electricity & other charges', icon: Droplets, color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
                    ].map((item) => (
                        <Card 
                            key={item.id}
                            className={cn(
                                `cursor-pointer transition-all hover:scale-[1.03] hover:shadow-xl border-2 relative`,
                                item.color
                            )}
                            onClick={() => setPaymentType(item.id)}
                        >
                            {item.badge && (
                                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#154279] to-[#F96302] text-white text-xs font-bold px-3 py-1 rounded-full">
                                    {item.badge}
                                </div>
                            )}
                            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                                <div className="p-4 rounded-full bg-white/50">
                                    <item.icon size={40} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{item.label}</h3>
                                    <p className="text-sm text-slate-600 mt-2">{item.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-nunito py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
                if (referenceId) navigate("/portal/tenant/payments");
                else setPaymentType(null);
            }}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                            {getIcon()}
                            {getTitle()}
                        </h1>
                        <p className="text-sm text-emerald-700 font-semibold mt-1">Instant mobile-style checkout</p>
                    </div>
        </div>

        <div className="grid gap-6">
          {details && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardHeader className="pb-3">
                      <CardTitle className="text-base text-blue-900">Bill Details</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3">
                      <div className="flex justify-between">
                          <span className="text-gray-700">Due Date:</span>
                          <span className="font-semibold text-gray-900">{details.due_date ? new Date(details.due_date).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-700">Total Due:</span>
                          <span className="font-bold text-gray-900">{formatCurrency(details.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-700">Already Paid:</span>
                          <span className="font-bold text-green-700">{formatCurrency(details.amount_paid || details.paid_amount || 0)}</span>
                      </div>
                      <div className="flex justify-between border-t border-blue-300 pt-3 mt-3">
                          <span className="text-blue-900 font-semibold">Remaining Balance:</span>
                          <span className="font-bold text-blue-900 text-lg">
                              {formatCurrency((details.amount || 0) - (details.amount_paid || details.paid_amount || 0))}
                          </span>
                      </div>
                  </CardContent>
              </Card>
          )}

          {paymentType === 'all' && totalOutstanding > 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-100">
                  <CardHeader className="pb-3">
                      <CardTitle className="text-base text-green-900">Summary of Outstanding Bills</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                      <div className="flex justify-between pb-3 border-b border-green-300">
                          <span className="text-gray-700">Total Amount Due:</span>
                          <span className="font-bold text-green-900 text-lg">{formatCurrency(totalOutstanding)}</span>
                      </div>
                      <p className="text-xs text-green-800 mt-3 italic">This payment will cover all your outstanding rent and utility bills.</p>
                  </CardContent>
              </Card>
          )}

          <Card className="shadow-xl border-2 border-emerald-200 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100">
              <CardTitle className="flex items-center gap-2 text-emerald-800">Payment Details</CardTitle>
              <CardDescription className="text-emerald-700 font-medium">M-Pesa-inspired: crisp, green, and fast.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                      <Label className="text-sm text-emerald-900 font-semibold">Amount to pay (KES)</Label>
                      <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700 font-semibold">KSh</span>
                          <Input
                              type="number"
                              step="0.01"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="0.00"
                              className="pl-14 text-lg font-semibold h-12 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-200"
                          />
                      </div>
                      {details && (
                          <p className="text-xs text-emerald-700 font-medium">
                              Balance due: {formatCurrency((details.amount || 0) - (details.amount_paid || details.paid_amount || 0))}
                          </p>
                      )}
                      {paymentType === 'all' && totalOutstanding > 0 && (
                          <p className="text-xs text-emerald-700 font-medium">Total outstanding: {formatCurrency(totalOutstanding)}</p>
                      )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {details && (
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 font-semibold">
                        Due now: <span className="text-emerald-800">{formatCurrency((details.amount || 0) - (details.amount_paid || details.paid_amount || 0))}</span>
                      </div>
                    )}
                    {!details && totalOutstanding > 0 && (
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 font-semibold">
                        Outstanding: <span className="text-emerald-800">{formatCurrency(totalOutstanding)}</span>
                      </div>
                    )}
                    <div className="rounded-lg border border-emerald-100 bg-white px-4 py-3 text-sm text-emerald-800">
                      Secure mobile checkout · encrypted · instant receipt
                    </div>
                  </div>

                  <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-4 rounded-xl font-bold tracking-wide transition-all disabled:opacity-60 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                  {loading ? (
                      <span>Processing...</span>
                  ) : (
                      <span>Pay {amount ? formatCurrency(parseFloat(amount)) : '0.00'}</span>
                  )}
                  </button>
              </form>
              </CardContent>
          </Card>
        </div>

        {/* DEBUG: Show dialog state */}
        {showPaystackDialog && (
          <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg z-50 max-w-xs">
            <p className="font-bold">✓ Dialog state is TRUE</p>
            <p className="text-sm">The dialog SHOULD be opening now</p>
          </div>
        )}

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
    </div>
  );
};

export default MakePaymentPage;
