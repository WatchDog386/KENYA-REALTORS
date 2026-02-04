import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RentPayment {
  id: string;
  tenant_id: string;
  property_id: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  created_at: string;
  tenant?: any;
}

const ManagerRentCollection = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [propertyId, setPropertyId] = useState<string>('');

  useEffect(() => {
    loadRentPayments();
  }, [user?.id]);

  const loadRentPayments = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      // Get manager's assigned property
      const { data: assignments, error: assignError } = await supabase
        .from('property_manager_assignments')
        .select('property_id')
        .eq('property_manager_id', user.id)
        .single();

      if (assignError || !assignments) {
        toast.error('No property assigned to you');
        return;
      }

      setPropertyId(assignments.property_id);

      // Fetch rent payments for this property
      const { data, error } = await supabase
        .from('rent_payments')
        .select('*, tenant:profiles(*)')
        .eq('property_id', assignments.property_id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Error loading rent payments:', err);
      toast.error('Failed to load rent payments');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.tenant?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || payment.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const stats = {
    total: payments.length,
    paid: payments.filter(p => p.status === 'paid').length,
    pending: payments.filter(p => p.status === 'pending').length,
    overdue: payments.filter(p => p.status === 'overdue').length,
    totalDue: payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + (p.amount || 0), 0),
    totalCollected: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Rent Collection</h1>
          </div>
          <p className="text-slate-600">Track and manage tenant rent payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Total Collected</p>
            <p className="text-3xl font-bold text-green-600">${stats.totalCollected.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-2">{stats.paid} payments received</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">${stats.totalDue.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-2">{stats.pending + stats.overdue} payments due</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Overdue</p>
            <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-xs text-slate-500 mt-2">Requires immediate action</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by tenant name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<Search size={16} className="text-slate-400" />}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="partial">Partial</option>
          </select>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-30 text-slate-400" />
            <p className="text-slate-600 text-lg">No rent payments found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Tenant</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Due Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Paid Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(payment => (
                    <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {payment.tenant?.first_name} {payment.tenant?.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{payment.tenant?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        ${payment.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(payment.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerRentCollection;
