import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Droplets, Home, Zap, Trash2, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatCurrency";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import PaystackPaymentDialog from "@/components/dialogs/PaystackPaymentDialog";
import { downloadReceiptPDF, formatReceiptData, processPaymentWithReceipt, ReceiptData } from "../../../utils/receiptGenerator";
import { getTenantPortalAccessState, reconcileInitialAllocationInvoicesForTenant } from "@/services/tenantOnboardingService";
import { extractInvoiceLineItems } from "@/utils/invoiceLineItems";

interface OutstandingItem {
  id: string;
  source: 'rent' | 'bill';
  type: string;
  label: string;
  amount: number;
  amountPaid: number;
  pendingAmount: number;
}

const MakePaymentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  
  const paymentTypeParamRaw = searchParams.get('type');
  const paymentTypeParam = paymentTypeParamRaw === 'all' ? 'custom' : paymentTypeParamRaw;
  const referenceId = searchParams.get('id');
  const onboardingInvoiceId = searchParams.get('onboardingInvoiceId');
  const dueAmount = searchParams.get('amount') ? parseFloat(searchParams.get('amount')!) : 0;

  const [paymentType, setPaymentType] = useState<string | null>(paymentTypeParam);
  const [amount, setAmount] = useState(dueAmount > 0 ? dueAmount.toString() : "");
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [showPaystackDialog, setShowPaystackDialog] = useState(false);
  const [outstandingItems, setOutstandingItems] = useState<OutstandingItem[]>([]);
  const [suggestedOutstandingTotal, setSuggestedOutstandingTotal] = useState(0);
  const [onboardingInvoiceDetails, setOnboardingInvoiceDetails] = useState<any>(null);

  const isUuid = (value: string | null): boolean => {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  };

  const hasValidReferenceId = isUuid(referenceId);
  const hasValidOnboardingInvoiceId = isUuid(onboardingInvoiceId);

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
    if (hasValidReferenceId && paymentType) {
      fetchDetails();
      return;
    }

    if (paymentType === 'custom' || paymentType === 'rent' || paymentType === 'utility') {
      fetchOutstandingItems(paymentType);
      return;
    }

    setOutstandingItems([]);
  }, [hasValidReferenceId, paymentType, user?.id]);

  useEffect(() => {
    const fetchOnboardingInvoiceDetails = async () => {
      try {
        if (!user?.id || !hasValidOnboardingInvoiceId) {
          setOnboardingInvoiceDetails(null);
          return;
        }

        const { data: tenantRow } = await supabase
          .from('tenants')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        const tenantIdentifiers = [user.id, tenantRow?.id].filter(Boolean) as string[];

        const { data, error } = await supabase
          .from('invoices')
          .select('id, reference_number, amount, due_date, status, items, notes')
          .eq('id', onboardingInvoiceId)
          .in('tenant_id', tenantIdentifiers)
          .maybeSingle();

        if (error) {
          throw error;
        }

        setOnboardingInvoiceDetails(data || null);

        if (!amount && data?.amount) {
          setAmount(String(data.amount));
        }
      } catch (error) {
        console.error('Error fetching onboarding invoice details:', error);
        setOnboardingInvoiceDetails(null);
      }
    };

    fetchOnboardingInvoiceDetails();
  }, [onboardingInvoiceId, hasValidOnboardingInvoiceId, user?.id]);

  const buildOnboardingInvoiceBreakdown = (invoice: any) => {
    return extractInvoiceLineItems(invoice?.items);
  };

  const fetchDetails = async () => {
      try {
        if (!isUuid(referenceId)) {
          setDetails(null);
          return;
        }

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

  const fetchOutstandingItems = async (mode: string) => {
    if (!user?.id) return;

    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, unit_id')
        .eq('user_id', user.id)
        .single();

      if (!tenant?.unit_id) {
        setOutstandingItems([]);
        setAmount('');
        setSuggestedOutstandingTotal(0);
        return;
      }

      const items: OutstandingItem[] = [];

      if (mode === 'custom' || mode === 'rent') {
        const { data: rents } = await supabase
          .from('rent_payments')
          .select('*')
          .or(`tenant_id.eq.${user.id},tenant_id.eq.${tenant.id}`)
          .not('status', 'in', '(paid,completed)')
          .order('due_date', { ascending: true });

        for (const rent of rents || []) {
          const paid = Number(rent.amount_paid || 0);
          const total = Number(rent.amount || 0);
          const pending = Math.max(0, total - paid);
          if (pending <= 0) continue;

          items.push({
            id: rent.id,
            source: 'rent',
            type: 'rent',
            label: `Rent • ${rent.due_date ? new Date(rent.due_date).toLocaleDateString() : 'No due date'}`,
            amount: total,
            amountPaid: paid,
            pendingAmount: pending,
          });
        }
      }

      if (mode === 'custom' || mode === 'utility') {
        const { data: bills } = await supabase
          .from('bills_and_utilities')
          .select('*')
          .eq('unit_id', tenant.unit_id)
          .not('status', 'in', '(paid,completed)')
          .order('due_date', { ascending: true });

        for (const bill of bills || []) {
          const paid = Number(bill.paid_amount || 0);
          const total = Number(bill.amount || 0);
          const pending = Math.max(0, total - paid);
          if (pending <= 0) continue;

          const rawType = bill.bill_type || 'utility';
          const typeLabel = rawType.charAt(0).toUpperCase() + rawType.slice(1);
          items.push({
            id: bill.id,
            source: 'bill',
            type: rawType,
            label: `${typeLabel} • ${bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'No due date'}`,
            amount: total,
            amountPaid: paid,
            pendingAmount: pending,
          });
        }
      }

      const totalOutstanding = items.reduce((sum, item) => sum + item.pendingAmount, 0);
      setOutstandingItems(items);
      setSuggestedOutstandingTotal(totalOutstanding);

      if (dueAmount > 0) {
        setAmount(dueAmount.toString());
      } else if (totalOutstanding > 0) {
        setAmount(totalOutstanding.toString());
      } else {
        setAmount('');
      }
    } catch (error) {
      console.error('Error fetching outstanding items:', error);
      setOutstandingItems([]);
      setAmount('');
      setSuggestedOutstandingTotal(0);
    }
  };

  const resolveTenantPaymentContext = async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const { data: existingTenant, error: existingTenantError } = await supabase
      .from('tenants')
      .select('id, unit_id, property_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (existingTenantError) throw existingTenantError;
    if (existingTenant) return existingTenant;

    const { data: latestApplication, error: latestApplicationError } = await supabase
      .from('lease_applications')
      .select('property_id, unit_id')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestApplicationError) throw latestApplicationError;
    if (!latestApplication?.property_id || !latestApplication?.unit_id) {
      return null;
    }

    return {
      id: user.id,
      property_id: latestApplication.property_id,
      unit_id: latestApplication.unit_id,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !amount) {
      toast.error("Please enter an amount");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount greater than 0");
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
      let remainingAmount = payAmount;

      const onboardingInvoiceResult = await reconcileInitialAllocationInvoicesForTenant(
        user!.id,
        payAmount,
        transactionRef
      );
      const onboardingFlowUnlocked = onboardingInvoiceResult.finalized.length > 0;

      remainingAmount = Math.max(0, payAmount - onboardingInvoiceResult.appliedAmount);

      const firstFinalizedAssignment = onboardingInvoiceResult.finalized[0];
      const firstPaidOnboardingInvoice = onboardingInvoiceResult.paidInvoices[0];
      let receiptPropertyId =
        firstFinalizedAssignment?.propertyId ||
        firstPaidOnboardingInvoice?.propertyId ||
        null;
      let receiptUnitId =
        firstFinalizedAssignment?.unitId ||
        firstPaidOnboardingInvoice?.unitId ||
        null;
      let tenant: { id: string; property_id: string; unit_id: string } | null = null;

      if (remainingAmount > 0 || !receiptPropertyId || !receiptUnitId) {
        tenant = await resolveTenantPaymentContext();
        receiptPropertyId = receiptPropertyId || tenant?.property_id || null;
        receiptUnitId = receiptUnitId || tenant?.unit_id || null;
      }

      // Build receipt items based on payment type
      let receiptItems: ReceiptData['items'] = onboardingInvoiceResult.paidInvoices.map((invoice) => ({
        description: `Initial Move-In Invoice (${invoice.id.slice(0, 8)})`,
        amount: invoice.amount,
        type: 'other',
      }));
      let rentPaymentId: string | undefined;
      let billPaymentId: string | undefined;

      if (remainingAmount > 0 && !hasValidReferenceId && (paymentType === 'custom' || paymentType === 'rent' || paymentType === 'utility')) {
          const prioritizedItems = [...outstandingItems].sort((firstItem, secondItem) => {
            if (firstItem.source === 'rent' && secondItem.source !== 'rent') return -1;
            if (firstItem.source !== 'rent' && secondItem.source === 'rent') return 1;
            return 0;
          });

          for (const item of prioritizedItems) {
            if (remainingAmount <= 0) break;

            const allocation = Math.min(item.pendingAmount, remainingAmount);
            if (allocation <= 0) continue;

            if (item.source === 'rent') {
              const newPaidTotal = item.amountPaid + allocation;
              const nextStatus = newPaidTotal >= item.amount ? 'paid' : 'partial';

              const { error } = await supabase
                .from('rent_payments')
                .update({
                  amount_paid: newPaidTotal,
                  status: nextStatus,
                  payment_method: 'paystack',
                  paid_date: new Date().toISOString(),
                  transaction_id: transactionRef,
                })
                .eq('id', item.id);

              if (error) throw error;
              rentPaymentId = item.id;
            } else {
              const newPaidTotal = item.amountPaid + allocation;
              const nextStatus = newPaidTotal >= item.amount ? 'paid' : 'partial';

              const { error } = await supabase
                .from('bills_and_utilities')
                .update({
                  paid_amount: newPaidTotal,
                  status: nextStatus,
                  payment_reference: transactionRef,
                })
                .eq('id', item.id);

              if (error) throw error;
              billPaymentId = item.id;
            }

            receiptItems.push({
              description: item.label,
              amount: allocation,
              type: item.type as any,
            });

            remainingAmount -= allocation;
          }
        } else if (remainingAmount > 0 && paymentType && hasValidReferenceId && details) {
          // Update existing record
          const currentPaid = details.amount_paid || details.paid_amount || 0;
          const totalDue = details.amount || 0;
          const newPaidTotal = currentPaid + remainingAmount;
          const status = newPaidTotal >= totalDue ? 'paid' : 'partial';

          if (paymentType === 'rent') {
              const { error } = await supabase
                  .from('rent_payments')
                  .update({
                  amount_paid: newPaidTotal,
                  status,
                      payment_method: 'paystack',
                      paid_date: new Date().toISOString(),
                  transaction_id: transactionRef
                  })
                  .eq('id', referenceId);
              if (error) throw error;
              rentPaymentId = referenceId;
              receiptItems = [{
                description: 'Rent Payment',
                amount: remainingAmount,
                type: 'rent'
              }];
          } else {
               const { error } = await supabase
                  .from('bills_and_utilities')
                  .update({
                      paid_amount: newPaidTotal,
                    status,
                          remarks: details.remarks,
                      payment_reference: transactionRef
                  })
                  .eq('id', referenceId);
               if (error) throw error;
               billPaymentId = referenceId;
               receiptItems = [{
                description: `${paymentType?.charAt(0).toUpperCase()}${paymentType?.slice(1)} Bill`,
                amount: remainingAmount,
                type: (paymentType as any) || 'other'
              }];
          }
            } else if (remainingAmount > 0) {
           // New Manual Payment
           // If it's rent, insert into rent_payments
           if (!tenant?.property_id || !tenant?.unit_id) {
             throw new Error('No active tenant assignment context found for this payment.');
           }
           if (paymentType === 'rent') {
               const { data: rentData, error } = await supabase.from("rent_payments").insert([
                {
                    tenant_id: user!.id,
                  unit_id: tenant!.unit_id,
                  property_id: tenant!.property_id,
                  amount: remainingAmount,
                  due_date: new Date().toISOString(),
                  paid_date: new Date().toISOString(),
                  payment_method: 'paystack',
                  status: "paid",
                  transaction_id: transactionRef,
                },
              ])
              .select('id')
              .single();
              if (error) throw error;
              rentPaymentId = rentData?.id;
              receiptItems = [{
                description: 'Rent Payment',
                amount: remainingAmount,
                type: 'rent'
              }];
           } else {
               const { data: billData, error } = await supabase.from("bills_and_utilities").insert([
                   {
                     unit_id: tenant!.unit_id,
                       property_id: tenant!.property_id,
                       bill_type: (paymentType && paymentType !== 'custom' && paymentType !== 'all') ? paymentType : 'utility',
                     amount: remainingAmount,
                       paid_amount: remainingAmount,
                       due_date: new Date().toISOString(),
                       status: 'paid',
                           remarks: paymentType ? `${paymentType} payment` : undefined,
                           payment_reference: transactionRef
                   }
               ])
               .select('id')
               .single();
               if (error) throw error;
               billPaymentId = billData?.id;
               receiptItems = [{
                description: `${paymentType?.charAt(0).toUpperCase()}${paymentType?.slice(1)} Bill`,
                amount: remainingAmount,
                type: (paymentType as any) || 'other'
              }];
           }
      }

      if (receiptItems.length === 0) {
        receiptItems = [{
          description: 'Invoice Payment',
          amount: payAmount,
          type: 'other',
        }];
      }

      if (!receiptPropertyId || !receiptUnitId) {
        toast.warning('Payment was processed. Receipt generation will complete after assignment metadata sync.');
        navigate(onboardingFlowUnlocked ? "/portal/tenant" : "/portal/tenant/payments?tab=receipts");
        return;
      }

      // Generate receipt with retry logic
      let receiptCreated = false;
      let createdReceipt: any = null;
      let retries = 0;
      const maxRetries = 3;
      
      while (!receiptCreated && retries < maxRetries) {
        try {
          console.log('🎟️ Starting receipt creation (attempt ' + (retries + 1) + ')...', {
            tenantId: user.id,
            propertyId: receiptPropertyId,
            unitId: receiptUnitId,
            amount: payAmount,
            method: 'paystack',
            reference: transactionRef
          });
          const receipt = await processPaymentWithReceipt(
            user.id,  // Use actual auth.uid(), not tenant.id from tenants table
            receiptPropertyId,
            receiptUnitId,
            payAmount,
            'paystack',
            transactionRef,
            receiptItems,
            rentPaymentId,
            billPaymentId
          );
          console.log('✅ Receipt created successfully:', receipt);
          createdReceipt = receipt;
          receiptCreated = true;
        } catch (receiptErr) {
          retries++;
          const errorCode = (receiptErr as any)?.code;
          const errorStatus = (receiptErr as any)?.status;
          
          if (errorStatus === 409 && retries < maxRetries) {
            // Conflict error - retry with a new receipt number
            console.warn('⚠️ Receipt number conflict, retrying...', {
              attempt: retries,
              error: (receiptErr as any)?.message
            });
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            console.error('❌ Receipt generation failed after ' + retries + ' attempts:', receiptErr);
            console.error('Error details:', {
              message: (receiptErr as any)?.message,
              code: (receiptErr as any)?.code,
              status: (receiptErr as any)?.status,
              hint: (receiptErr as any)?.hint
            });
            // Don't throw - continue even if receipt creation fails
            break;
          }
        }
      }

      if (receiptCreated) {
        toast.success("Payment processed successfully. Receipt generated.");
      } else {
        toast.success("Payment successful! Receipt generation is in progress and will be available shortly.");
      }

      if (createdReceipt) {
        try {
          const receiptData = formatReceiptData(createdReceipt);
          downloadReceiptPDF(receiptData, `receipt-${receiptData.receiptNumber}.pdf`);
        } catch (downloadError) {
          console.warn('Receipt was created but auto-download failed:', downloadError);
        }
      }

      if (onboardingInvoiceResult.finalized.length > 0) {
        toast.success('Initial payment confirmed. Your unit assignment is now active and lease signing is unlocked.');
      }

      let shouldOpenDashboard = onboardingFlowUnlocked;
      if (onboardingInvoiceResult.paidInvoices.length > 0) {
        try {
          const latestAccessState = await getTenantPortalAccessState(user.id);
          shouldOpenDashboard = shouldOpenDashboard || !latestAccessState.isLocked;
        } catch (accessError) {
          console.warn('Could not refresh tenant access state after payment:', accessError);
        }
      }

      // After first-payment onboarding, send tenant directly to dashboard.
      if (shouldOpenDashboard) {
        navigate("/portal/tenant");
      } else {
        if (onboardingInvoiceResult.paidInvoices.length > 0) {
          toast.warning('Payment is confirmed, but assignment sync is still in progress. Please refresh shortly.');
        }
        navigate("/portal/tenant/payments?tab=receipts");
      }
    } catch (err) {
      console.error("Error processing payment:", err);
      toast.error("Failed to process payment");
    } finally {
      setLoading(false);
      setShowPaystackDialog(false);
    }
  };

  const getTitle = () => {
      if (paymentType === 'custom') return 'Pay All Outstanding Bills';
      if (paymentType === 'utility') return 'Pay Utility Bills';
      if (paymentType === 'water') return 'Pay Water Bill';
      if (paymentType === 'rent') return 'Pay Rent';
      if (details?.bill_type) {
          return `Pay ${details.bill_type.charAt(0).toUpperCase() + details.bill_type.slice(1)} Bill`;
      }
      if (paymentType) return `Pay ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}`;
      return 'Make a Payment';
  };

  const getIcon = (type: string | null = paymentType) => {
      if (type === 'custom') return <CreditCard size={24} className="text-purple-600"/>;
      if (type === 'rent') return <Home size={24} className="text-blue-600"/>;
      if (type === 'utility') return <Droplets size={24} className="text-cyan-600"/>;
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
                  { id: 'utility', label: 'Utilities Only', icon: Droplets, color: 'bg-cyan-50 text-cyan-600 border-cyan-100', desc: 'Pay utilities only' },
                  { id: 'custom', label: 'Lump Sum', icon: CreditCard, color: 'bg-purple-50 text-purple-600 border-purple-100', desc: 'Pay rent + utilities' },
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
                              <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
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
                    <p className="text-sm text-emerald-700 font-semibold">Instant mobile-style checkout</p>
        </div>
      </div>

      <div className="grid gap-6">
        {onboardingInvoiceDetails && (
          <Card className="bg-amber-50/60 border-amber-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-amber-900 flex items-center gap-2">
                <CreditCard size={18} />
                Initial Move-In Invoice
              </CardTitle>
              <CardDescription className="text-amber-800">
                Review this invoice breakdown before proceeding to payment.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-amber-800">Invoice Ref:</span>
                <span className="font-semibold text-amber-900">
                  {onboardingInvoiceDetails.reference_number || onboardingInvoiceDetails.id?.slice(0, 8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-800">Due Date:</span>
                <span className="font-semibold text-amber-900">
                  {onboardingInvoiceDetails.due_date
                    ? new Date(onboardingInvoiceDetails.due_date).toLocaleDateString()
                    : 'Immediately'}
                </span>
              </div>
              <div className="border-t border-amber-200 pt-2 mt-2 space-y-1.5">
                {buildOnboardingInvoiceBreakdown(onboardingInvoiceDetails).length === 0 ? (
                  <p className="text-xs text-amber-800">Line items will appear exactly as issued in Billing and Invoicing.</p>
                ) : (
                  buildOnboardingInvoiceBreakdown(onboardingInvoiceDetails).map((line, index) => (
                    <div key={`onboarding-line-${index}`} className="flex justify-between">
                      <span className="text-amber-800">{line.label}</span>
                      <span className="font-medium text-amber-900">{formatCurrency(line.amount)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-amber-300 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-amber-900">Total Invoice:</span>
                <span className="font-bold text-amber-900">{formatCurrency(Number(onboardingInvoiceDetails.amount || 0))}</span>
              </div>
            </CardContent>
          </Card>
        )}

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

        {!hasValidReferenceId && outstandingItems.length > 0 && (
          <Card className="bg-purple-50/50 border-purple-100 shadow-sm">
                <CardHeader className="pb-3">
              <CardTitle className="text-base text-purple-800 flex items-center gap-2">
                        <CreditCard size={18} />
                {paymentType === 'custom' ? 'Lump Sum Coverage (Rent + Utilities)' : paymentType === 'rent' ? 'Rent Bills' : 'Utility Bills'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
              {outstandingItems.map((item, idx) => (
                <div key={idx} className="flex justify-between p-2 bg-white rounded border border-purple-200">
                  <span className="text-gray-700">{item.label}</span>
                  <span className="font-semibold text-purple-900">{formatCurrency(item.pendingAmount)}</span>
                        </div>
                    ))}
              <div className="border-t border-purple-200 pt-2 mt-2 flex justify-between font-bold">
                <span className="text-purple-900">Total Outstanding:</span>
                <span className="text-purple-900">{formatCurrency(suggestedOutstandingTotal)}</span>
                    </div>
              <p className="text-xs text-purple-700 mt-2">
                Lump sum applies to rent first, then remaining amount is distributed across utility bills.
              </p>
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
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 font-semibold">
                            KSh
                        </span>
                        <Input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="pl-12 text-lg font-semibold h-12 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-200"
                        />
                    </div>
                    {!hasValidReferenceId && (
                      <p className="text-xs text-emerald-700 font-medium">
                        Pay full or partial—checkout opens right after.
                      </p>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {details && (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 font-semibold">
                      Due now: <span className="text-emerald-800">{formatCurrency((details.amount || 0) - (details.amount_paid || details.paid_amount || 0))}</span>
                    </div>
                  )}
                  {!details && suggestedOutstandingTotal > 0 && (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 font-semibold">
                      Outstanding: <span className="text-emerald-800">{formatCurrency(suggestedOutstandingTotal)}</span>
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
                {loading ? "Processing..." : `Pay ${amount ? formatCurrency(parseFloat(amount)) : '0.00'}`}
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
        referenceId={hasValidReferenceId ? referenceId || undefined : undefined}
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
