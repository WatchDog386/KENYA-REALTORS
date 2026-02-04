import React, { useState, useEffect } from 'react';
import { FileText, Search, Loader2, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Lease {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id?: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  status: 'active' | 'expired' | 'terminated' | 'pending';
  lease_file_url?: string;
  notes?: string;
  tenant?: any;
  unit?: any;
}

const ManagerLeases = () => {
  const { user } = useAuth();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [propertyId, setPropertyId] = useState<string>('');

  useEffect(() => {
    loadLeases();
  }, [user?.id]);

  const loadLeases = async () => {
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

      // Fetch leases for this property
      const { data, error } = await supabase
        .from('leases')
        .select('*, tenant:profiles(*), unit:property_unit_types(*)')
        .eq('property_id', assignments.property_id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setLeases(data || []);
    } catch (err) {
      console.error('Error loading leases:', err);
      toast.error('Failed to load leases');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeases = leases.filter(lease => {
    const matchesSearch = !searchTerm || 
      lease.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.tenant?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.unit?.unit_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || lease.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const isLeaseActive = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return today >= start && today <= end;
  };

  const stats = {
    total: leases.length,
    active: leases.filter(l => isLeaseActive(l.start_date, l.end_date)).length,
    pending: leases.filter(l => l.status === 'pending').length,
    expiring30: leases.filter(l => {
      const endDate = new Date(l.end_date);
      const today = new Date();
      const daysUntilExpiry = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length,
    totalRent: leases.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.monthly_rent || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Leases</h1>
          </div>
          <p className="text-slate-600">Manage tenant leases and agreements</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Active Leases</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Expiring in 30 Days</p>
            <p className="text-3xl font-bold text-orange-600">{stats.expiring30}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Monthly Rent</p>
            <p className="text-3xl font-bold text-blue-600">${stats.totalRent.toLocaleString()}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by tenant name, email, or unit..."
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
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        {/* Leases Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredLeases.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-30 text-slate-400" />
            <p className="text-slate-600 text-lg">No leases found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Tenant</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Unit</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Rent</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Start Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">End Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeases.map(lease => (
                    <tr key={lease.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {lease.tenant?.first_name} {lease.tenant?.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{lease.tenant?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {lease.unit?.unit_number || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        ${lease.monthly_rent?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(lease.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(lease.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lease.status)}`}>
                          {lease.status}
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

export default ManagerLeases;
