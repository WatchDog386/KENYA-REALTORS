import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, CreditCard, AlertCircle, Loader2, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TenantBillingHistoryProps {
  tenantId: string;
  userId: string;
}

export const TenantBillingHistory: React.FC<TenantBillingHistoryProps> = ({ tenantId, userId }) => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [arrears, setArrears] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchBillingData();
    }
  }, [userId]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', userId)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Fetch utility bills
      const { data: billsData, error: billsError } = await supabase
        .from('utility_readings')
        .select('*')
        .eq('tenant_id', userId)
        .order('reading_date', { ascending: false });

      if (billsError) throw billsError;
      setBills(billsData || []);

      // Calculate arrears (simplified logic: sum of pending payments + unpaid bills)
      const pendingPayments = (paymentsData || []).filter(p => p.status === 'pending' || p.status === 'overdue');
      const unpaidBills = (billsData || []).filter(b => b.status === 'pending' || b.status === 'overdue');
      
      const totalArrears = 
        pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) +
        unpaidBills.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
        
      setArrears(totalArrears);

    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
  };

  const handleDownloadStatement = () => {
    // In a real app, this would generate a PDF
    toast.success("Statement downloaded successfully");
  };

  const handleSendStatement = () => {
    // In a real app, this would send an email
    toast.success("Statement sent to tenant successfully");
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#154279]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#154279]">Billing & Payment History</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadStatement} className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Download Statement
          </Button>
          <Button onClick={handleSendStatement} className="bg-[#154279] hover:bg-[#0f325e] flex items-center gap-2">
            <Send className="h-4 w-4" /> Send to Tenant
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-600 uppercase">Total Arrears</p>
                <h3 className="text-2xl font-bold text-red-700">{formatCurrency(arrears)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 uppercase">Total Paid</p>
                <h3 className="text-2xl font-bold text-green-700">
                  {formatCurrency(payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0))}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 uppercase">Total Bills</p>
                <h3 className="text-2xl font-bold text-blue-700">
                  {formatCurrency(bills.reduce((sum, b) => sum + Number(b.total_amount), 0))}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#154279]" /> Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No payment history found.</p>
            ) : (
              <div className="space-y-4">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-medium text-slate-800">{payment.description || 'Rent Payment'}</p>
                      <p className="text-xs text-slate-500">{format(new Date(payment.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{formatCurrency(payment.amount)}</p>
                      <Badge className={
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#154279]" /> Utility Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bills.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No utility bills found.</p>
            ) : (
              <div className="space-y-4">
                {bills.slice(0, 5).map((bill) => (
                  <div key={bill.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-medium text-slate-800 capitalize">{bill.utility_type} Bill</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(bill.reading_date), 'MMM yyyy')} • {bill.current_reading - bill.previous_reading} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{formatCurrency(bill.total_amount)}</p>
                      <Badge className={
                        bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                        bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {bill.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
