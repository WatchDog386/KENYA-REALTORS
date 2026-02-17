import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { useAuth } from '@/contexts/AuthContext';
import {
  getPendingTransactions,
  getProcessedTransactions,
  getAccountingDashboardData,
  approveTransaction,
  rejectTransaction,
  processTransaction,
} from '@/services/accountingService';
import { AccountingTransaction, AccountingDashboardData } from '@/types/newRoles';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Search,
  Zap,
  Filter,
  RefreshCw,
  ArrowRight,
  FileText,
  CreditCard,
  Home
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AccountingDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<AccountingDashboardData | null>(null);
  const [allTransactions, setAllTransactions] = useState<AccountingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'rent' | 'bill' | 'payment'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [greeting, setGreeting] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<AccountingTransaction | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await getAccountingDashboardData();
      if (data) {
        setDashboardData(data);
        setAllTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error loading accounting dashboard:', error);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    await loadDashboardData();
  };

  const filteredTransactions = allTransactions.filter((transaction) => {
    const matchesType = filterType === 'all' || transaction.transaction_type === filterType;
    const matchesSearch =
      searchTerm === '' ||
      transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.property?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab properly
    const matchesTab = activeTab === 'pending' 
        ? transaction.status === 'pending'
        : transaction.status !== 'pending';

    return matchesType && matchesSearch && matchesTab;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <DollarSign className="w-5 h-5" />;
      case 'rent': return <Home className="w-5 h-5" />;
      case 'bill': return <FileText className="w-5 h-5" />;
      case 'payment': return <CreditCard className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin text-4xl text-[#154279]">⌛</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen antialiased text-slate-900 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Nunito', sans-serif; }
      `}</style>
      
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] overflow-hidden py-10 shadow-lg relative">
        <div className="max-w-[1400px] mx-auto px-6">
             <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="w-full md:w-2/3 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/30">
                          Accountant Portal
                        </span>
                        <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">
                          {greeting}
                        </span>
                    </div>
                    
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                        Welcome back, <span className="text-[#F96302]">{user?.first_name || "Accountant"}</span>
                    </h1>
                    
                    <p className="text-sm text-blue-100 leading-relaxed mb-8 max-w-lg font-medium">
                        You have <span className="text-white font-bold">{dashboardData?.totalPending || 0} pending transactions</span> requiring your attention today.
                    </p>

                    <button
                      onClick={handleRefresh}
                      className="group flex items-center gap-2 bg-white text-[#154279] px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500")} />
                      <span>Refresh Data</span>
                    </button>
                </div>
             </div>
        </div>
      </section>

      {/* DASHBOARD CONTENT */}
      <div className="max-w-[1400px] mx-auto px-6 -mt-8 pb-20 relative z-20">
      
      {/* 2. Key Metrics Grid - Summary Cards */}
      {dashboardData?.summaryByType && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Deposits */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl overflow-hidden h-full group">
                    <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign className="w-16 h-16 text-emerald-600" />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 rounded-xl">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 uppercase text-[10px] tracking-wider">Deposits</Badge>
                        </div>
                        <div className="text-2xl font-black text-slate-800 mb-1">
                            {dashboardData.summaryByType.deposits.count}
                        </div>
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transactions</div>
                        <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">
                            KES {dashboardData.summaryByType.deposits.amount.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Rent */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl overflow-hidden h-full group">
                    <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Home className="w-16 h-16 text-blue-600" />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Home className="w-6 h-6 text-blue-600" />
                            </div>
                            <Badge className="bg-blue-50 text-blue-600 border-blue-100 uppercase text-[10px] tracking-wider">Rent</Badge>
                        </div>
                        <div className="text-2xl font-black text-slate-800 mb-1">
                            {dashboardData.summaryByType.rent.count}
                        </div>
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transactions</div>
                        <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                            KES {dashboardData.summaryByType.rent.amount.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Bills */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl overflow-hidden h-full group">
                    <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FileText className="w-16 h-16 text-orange-600" />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-orange-50 rounded-xl">
                                <FileText className="w-6 h-6 text-orange-600" />
                            </div>
                            <Badge className="bg-orange-50 text-orange-600 border-orange-100 uppercase text-[10px] tracking-wider">Bills</Badge>
                        </div>
                        <div className="text-2xl font-black text-slate-800 mb-1">
                            {dashboardData.summaryByType.bills.count}
                        </div>
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transactions</div>
                        <div className="text-sm font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                            KES {dashboardData.summaryByType.bills.amount.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Payments */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl overflow-hidden h-full group">
                    <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <CreditCard className="w-16 h-16 text-purple-600" />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <CreditCard className="w-6 h-6 text-purple-600" />
                            </div>
                            <Badge className="bg-purple-50 text-purple-600 border-purple-100 uppercase text-[10px] tracking-wider">Payments</Badge>
                        </div>
                        <div className="text-2xl font-black text-slate-800 mb-1">
                            {dashboardData.summaryByType.payments.count}
                        </div>
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transactions</div>
                        <div className="text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block">
                            KES {dashboardData.summaryByType.payments.amount.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
      )}

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Transactions List - Left side (3 columns) */}
          <div className={cn("transition-all duration-300", selectedTransaction ? "lg:col-span-3" : "lg:col-span-4")}>
            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6 sticky top-0 z-10">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search transaction ref..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#154279]/20 text-sm font-medium focus:outline-none"
                  />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 text-sm">
                  {['pending', 'processed'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                        activeTab === tab
                          ? 'bg-[#154279] text-white shadow-md'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 focus:ring-2 focus:ring-[#154279]/20 cursor-pointer focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="deposit">Deposits</option>
                  <option value="rent">Rent</option>
                  <option value="bill">Bills</option>
                  <option value="payment">Payments</option>
                </select>
              </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    onClick={() => setSelectedTransaction(transaction)}
                    className={cn(
                        "bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden",
                        selectedTransaction?.id === transaction.id ? "ring-2 ring-[#154279] shadow-lg" : ""
                    )}
                  >
                     <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        transaction.transaction_type === 'rent' ? 'bg-blue-500' :
                        transaction.transaction_type === 'deposit' ? 'bg-emerald-500' :
                        transaction.transaction_type === 'bill' ? 'bg-orange-500' : 'bg-purple-500'
                    }`} />

                    <div className="flex justify-between items-start mb-3 pl-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                   transaction.transaction_type === 'rent' ? 'bg-blue-50 text-blue-600' :
                                   transaction.transaction_type === 'deposit' ? 'bg-emerald-50 text-emerald-600' :
                                   transaction.transaction_type === 'bill' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'
                           }`}>
                            {getTransactionIcon(transaction.transaction_type)}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold capitalize text-slate-800">{transaction.transaction_type}</h3>
                            <p className="text-xs text-slate-500">Ref: {transaction.reference_number}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ml-2 ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-[#154279]">KES {transaction.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 font-medium">{new Date(transaction.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-6 text-xs text-slate-500 pt-3 border-t border-slate-50 pl-2">
                      <div className="flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          <span className="font-semibold">{transaction.property?.name || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                         <span className="opacity-70">Mgr:</span>
                         <span className="font-semibold">{transaction.property_manager?.first_name} {transaction.property_manager?.last_name}</span>
                      </div>
                      {transaction.tenant_id && (
                        <div className="flex items-center gap-1">
                           <span className="opacity-70">Tnt:</span>
                           <span className="font-semibold">{transaction.tenant?.first_name} {transaction.tenant?.last_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-slate-100">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                     <AlertCircle className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-slate-800 font-bold text-lg mb-1">No transactions found</h3>
                  <p className="text-slate-500 text-sm">Try adjusting your filters or search terms.</p>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Details Sidebar - Right side (1 column) */}
          {selectedTransaction && (
          <div className="space-y-6">
             <Card className="border-none shadow-xl bg-white rounded-2xl sticky top-6">
                <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-2xl p-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                        Transaction Details
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedTransaction(null)} className="h-8 w-8 text-slate-400 hover:text-slate-600">
                        <span className="sr-only">Close</span>
                        ✕
                    </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="text-center pb-6 border-b border-slate-100">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Amount</p>
                        <p className="text-3xl font-black text-[#154279]">KES {selectedTransaction.amount.toLocaleString()}</p>
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-3 ${getStatusColor(selectedTransaction.status)}`}>
                            {selectedTransaction.status}
                        </div>
                    </div>

                    <div className="space-y-4">
                         {/* Reference */}
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Reference</p>
                            <p className="font-mono text-sm font-medium text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">{selectedTransaction.reference_number}</p>
                        </div>
                        
                         {/* Property */}
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-2 bg-blue-50 rounded-lg">
                                <Home className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Property</p>
                                <p className="font-bold text-slate-800">{selectedTransaction.property?.name}</p>
                                <p className="text-xs text-slate-500">Managed by {selectedTransaction.property_manager?.first_name} {selectedTransaction.property_manager?.last_name}</p>
                            </div>
                        </div>

                        {/* Date info */}
                         <div className="flex items-start gap-3">
                            <div className="mt-1 p-2 bg-slate-50 rounded-lg">
                                <Clock className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Timeline</p>
                                <p className="text-sm font-medium text-slate-700">Created: {new Date(selectedTransaction.created_at).toLocaleString()}</p>
                                {selectedTransaction.approved_at && (
                                    <p className="text-xs text-emerald-600 mt-1 font-semibold">Approved: {new Date(selectedTransaction.approved_at).toLocaleString()}</p>
                                )}
                            </div>
                        </div>

                         {/* Notes */}
                        {selectedTransaction.notes && (
                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                <p className="text-amber-800 text-xs font-bold uppercase tracking-wider mb-1">Notes</p>
                                <p className="text-amber-900 text-sm">{selectedTransaction.notes}</p>
                            </div>
                        )}
                    </div>
                
                    {/* Actions */}
                    <div className="pt-2">
                        {selectedTransaction.status === 'pending' && (
                            <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={() => handleApprove(selectedTransaction.id)}
                                className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                            >
                                Approve
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleReject(selectedTransaction.id)}
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            >
                                Reject
                            </Button>
                            </div>
                        )}

                        {selectedTransaction.status === 'approved' && (
                            <Button
                            onClick={() => handleProcess(selectedTransaction.id)}
                            className="w-full bg-[#154279] text-white hover:bg-[#0f2f58] shadow-lg shadow-blue-200"
                            >
                            Mark Processed
                            </Button>
                        )}
                    </div>
                </CardContent>
             </Card>
          </div>
        )}
      </div>
     </div>
    </div>
  );
};

// Start of Helper Functions and Components
const getTransactionTypeColor = (type: string) => {

    switch (type) {
        case 'rent': return 'border-l-4 border-blue-500';
        case 'deposit': return 'border-l-4 border-emerald-500';
        case 'bill': return 'border-l-4 border-orange-500';
        case 'payment': return 'border-l-4 border-purple-500';
        default: return 'border-l-4 border-gray-300';
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'approved': return 'bg-emerald-100 text-emerald-700';
        case 'pending': return 'bg-amber-100 text-amber-700';
        case 'rejected': return 'bg-red-100 text-red-700';
        case 'processed': return 'bg-blue-100 text-blue-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

// Stat Card (New Style)
const StatCard = ({ icon, label, value, color }: any) => (
  <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center hover:shadow-md transition-all ${color} bg-white`}>
    <div className={`p-2 rounded-full mb-2 bg-opacity-20 bg-current`}>{icon}</div>
    <p className="text-xs font-bold uppercase tracking-wide opacity-70 mb-1">{label}</p>
    <p className="text-lg font-extrabold">{value}</p>
  </div>
);

// Summary Card
const SummaryCard = ({ label, count, amount, icon, color }: any) => (
  <div className={`${color} rounded-lg p-4 border border-slate-200 bg-white shadow-sm hover:shadow-md transition`}>
    <p className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">{icon} {label}</p>
    <div className="flex justify-between items-end">
        <div>
            <p className="text-2xl font-extrabold text-slate-800">{count}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Transactions</p>
        </div>
        <p className="text-sm font-bold text-slate-600 bg-white/50 px-2 py-1 rounded">KES {amount.toLocaleString()}</p>
    </div>
  </div>
);

export default AccountingDashboard;
