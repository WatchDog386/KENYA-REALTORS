import React, { useState, useEffect } from 'react';
import { FileText, Search, Loader2, DollarSign, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Deposit {
  id: string;
  tenant_id: string;
  property_id: string;
  amount: number;
  deposit_date: string;
  return_date?: string;
  status: 'held' | 'released' | 'deducted' | 'returned';
  deduction_reason?: string;
  deduction_amount?: number;
  notes?: string;
  tenant?: any;
}

const ManagerDeposits = () => {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [propertyId, setPropertyId] = useState<string>('');

  useEffect(() => {
    loadDeposits();
  }, [user?.id]);

  const loadDeposits = async () => {
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

      // Fetch security deposits for this property
      const { data, error } = await supabase
        .from('security_deposits')
        .select('*, tenant:profiles(*)')
        .eq('property_id', assignments.property_id)
        .order('deposit_date', { ascending: false });

      if (error) throw error;
      setDeposits(data || []);
    } catch (err) {
      console.error('Error loading deposits:', err);
      toast.error('Failed to load security deposits');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseDeposit = async (depositId: string) => {
    try {
      const { error } = await supabase
        .from('security_deposits')
        .update({ status: 'released', return_date: new Date().toISOString() })
        .eq('id', depositId);

      if (error) throw error;
      toast.success('Deposit released');
      loadDeposits();
    } catch (err) {
      console.error('Error releasing deposit:', err);
      toast.error('Failed to release deposit');
    }
  };

  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch = !searchTerm || 
      deposit.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.tenant?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || deposit.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'held':
        return 'bg-blue-100 text-blue-800';
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-slate-100 text-slate-800';
      case 'deducted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const stats = {
    total: deposits.length,
    totalHeld: deposits.filter(d => d.status === 'held').reduce((sum, d) => sum + (d.amount || 0), 0),
    released: deposits.filter(d => d.status === 'released').length,
    deducted: deposits.filter(d => d.status === 'deducted').length,
    totalDeductions: deposits.filter(d => d.status === 'deducted').reduce((sum, d) => sum + (d.deduction_amount || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Security Deposits</h1>
          </div>
          <p className="text-slate-600">Manage tenant security deposits and refunds</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Total Held</p>
            <p className="text-3xl font-bold text-blue-600">${stats.totalHeld.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-2">{deposits.filter(d => d.status === 'held').length} deposits</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Released</p>
            <p className="text-3xl font-bold text-green-600">{stats.released}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Deducted</p>
            <p className="text-3xl font-bold text-red-600">${stats.totalDeductions.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-2">{stats.deducted} deductions</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Total Deposits</p>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
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
            <option value="held">Held</option>
            <option value="released">Released</option>
            <option value="deducted">Deducted</option>
            <option value="returned">Returned</option>
          </select>
        </div>

        {/* Deposits Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredDeposits.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-30 text-slate-400" />
            <p className="text-slate-600 text-lg">No deposits found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Tenant</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Deposit Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Details</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeposits.map(deposit => (
                    <tr key={deposit.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {deposit.tenant?.first_name} {deposit.tenant?.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{deposit.tenant?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        ${deposit.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(deposit.deposit_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(deposit.status)}`}>
                          {deposit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {deposit.status === 'deducted' && (
                          <div>
                            <p className="text-xs font-semibold">Deduction: ${deposit.deduction_amount?.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">{deposit.deduction_reason}</p>
                          </div>
                        )}
                        {deposit.return_date && (
                          <p className="text-xs">Returned: {new Date(deposit.return_date).toLocaleDateString()}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {deposit.status === 'held' && (
                          <Button 
                            onClick={() => handleReleaseDeposit(deposit.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Release
                          </Button>
                        )}
                        {deposit.status !== 'held' && (
                          <Button variant="outline" size="sm" disabled>
                            {deposit.status}
                          </Button>
                        )}
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

export default ManagerDeposits;
