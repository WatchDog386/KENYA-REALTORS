// src/pages/portal/RefundStatusPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  Home,
  ChevronRight,
  Eye,
  FileText,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatCurrency';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HeroBackground } from '@/components/ui/HeroBackground';

interface Refund {
  id: string;
  tenant_id: string;
  property_id: string;
  lease_id: string;
  deposit_amount: number;
  refund_amount: number;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'completed';
  requested_date: string;
  processed_date?: string;
  completed_date?: string;
  reason?: string;
  notes?: string;
  tenant?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  property?: {
    title: string;
    address: string;
  };
  lease?: {
    start_date: string;
    end_date: string;
  };
}

const RefundStatusPage = () => {
  const { id } = useParams();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [filteredRefunds, setFilteredRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadRefunds();
  }, []);

  useEffect(() => {
    filterRefunds();
  }, [refunds, searchQuery, activeTab]);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      // First check if refunds table exists
      const { data: refundsData, error } = await supabase
        .from('refunds')
        .select('*')
        .order('requested_date', { ascending: false });

      if (error && error.code !== '42P01') { // Ignore "table doesn't exist" error
        console.error('Error loading refunds:', error);
      }

      // If refunds table exists and has data, use it
      if (refundsData && refundsData.length > 0) {
        // Fetch additional data for each refund
        const refundsWithDetails = await Promise.all(
          refundsData.map(async (refund) => {
            try {
              // Get tenant details
              const { data: tenant } = await supabase
                .from('profiles')
                .select('first_name, last_name, email')
                .eq('id', refund.tenant_id)
                .single();

              // Get property details
              const { data: property } = await supabase
                .from('properties')
                .select('title, address')
                .eq('id', refund.property_id)
                .single();

              return {
                ...refund,
                tenant: tenant || { first_name: 'Unknown', last_name: 'Tenant', email: 'unknown@example.com' },
                property: property || { title: 'Unknown Property', address: 'Unknown Address' }
              };
            } catch (err) {
              console.error('Error loading refund details:', err);
              return {
                ...refund,
                tenant: { first_name: 'Unknown', last_name: 'Tenant', email: 'unknown@example.com' },
                property: { title: 'Unknown Property', address: 'Unknown Address' }
              };
            }
          })
        );
        setRefunds(refundsWithDetails);
      } else {
        // Use mock data if no refunds table exists
        const mockRefunds: Refund[] = [
          {
            id: 'ref-001',
            tenant_id: 'tenant-001',
            property_id: 'prop-001',
            lease_id: 'lease-001',
            deposit_amount: 2000,
            refund_amount: 1800,
            status: 'completed',
            requested_date: '2024-01-15',
            processed_date: '2024-01-20',
            completed_date: '2024-01-25',
            reason: 'Lease ended normally',
            notes: 'Deducted for minor wall damage',
            tenant: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com'
            },
            property: {
              title: 'Luxury Apartment',
              address: '123 Main St'
            },
            lease: {
              start_date: '2023-01-01',
              end_date: '2024-01-01'
            }
          },
          {
            id: 'ref-002',
            tenant_id: 'tenant-002',
            property_id: 'prop-002',
            lease_id: 'lease-002',
            deposit_amount: 1500,
            refund_amount: 1500,
            status: 'processing',
            requested_date: '2024-02-01',
            processed_date: '2024-02-05',
            reason: 'Lease termination',
            tenant: {
              first_name: 'Jane',
              last_name: 'Smith',
              email: 'jane@example.com'
            },
            property: {
              title: 'Studio Loft',
              address: '456 Oak Ave'
            },
            lease: {
              start_date: '2023-06-01',
              end_date: '2024-02-01'
            }
          },
          {
            id: 'ref-003',
            tenant_id: 'tenant-003',
            property_id: 'prop-003',
            lease_id: 'lease-003',
            deposit_amount: 2500,
            refund_amount: 0,
            status: 'rejected',
            requested_date: '2024-01-20',
            processed_date: '2024-01-25',
            reason: 'Property damage',
            notes: 'Significant damage to flooring and appliances',
            tenant: {
              first_name: 'Mike',
              last_name: 'Johnson',
              email: 'mike@example.com'
            },
            property: {
              title: 'Modern Condo',
              address: '789 Pine Rd'
            },
            lease: {
              start_date: '2023-03-01',
              end_date: '2024-01-20'
            }
          },
          {
            id: 'ref-004',
            tenant_id: 'tenant-004',
            property_id: 'prop-004',
            lease_id: 'lease-004',
            deposit_amount: 1800,
            refund_amount: 1800,
            status: 'pending',
            requested_date: '2024-02-10',
            reason: 'Lease ended',
            tenant: {
              first_name: 'Sarah',
              last_name: 'Wilson',
              email: 'sarah@example.com'
            },
            property: {
              title: 'Garden Villa',
              address: '101 Garden St'
            },
            lease: {
              start_date: '2023-02-01',
              end_date: '2024-02-01'
            }
          }
        ];
        setRefunds(mockRefunds);
      }
    } catch (error) {
      console.error('Error loading refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRefunds = () => {
    let filtered = refunds;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(refund =>
        refund.tenant?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.tenant?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.property?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.property?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        refund.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(refund => refund.status === activeTab);
    }

    setFilteredRefunds(filtered);
  };

  const getStatusBadge = (status: Refund['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <RefreshCw className="w-3 h-3 mr-1" /> Processing
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" /> Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" /> Rejected
        </Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <CheckCircle className="w-3 h-3 mr-1" /> Completed
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getRefundStats = () => {
    const total = refunds.length;
    const pending = refunds.filter(r => r.status === 'pending').length;
    const processing = refunds.filter(r => r.status === 'processing').length;
    const approved = refunds.filter(r => r.status === 'approved').length;
    const rejected = refunds.filter(r => r.status === 'rejected').length;
    const completed = refunds.filter(r => r.status === 'completed').length;
    
    const totalDeposits = refunds.reduce((sum, refund) => sum + (refund.deposit_amount || 0), 0);
    const totalRefunds = refunds.reduce((sum, refund) => sum + (refund.refund_amount || 0), 0);
    const deductions = totalDeposits - totalRefunds;

    return {
      total,
      pending,
      processing,
      approved,
      rejected,
      completed,
      totalDeposits,
      totalRefunds,
      deductions,
      refundRate: totalDeposits > 0 ? (totalRefunds / totalDeposits) * 100 : 0
    };
  };

  const stats = getRefundStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading refund data...</p>
        </div>
      </div>
    );
  }

  // If viewing a specific refund
  if (id) {
    const refund = refunds.find(r => r.id === id);
    
    if (!refund) {
      return (
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Refund Not Found</h1>
          <p className="text-gray-600">The requested refund could not be found.</p>
          <Button asChild className="mt-4">
            <Link to="/portal/refund-status">Back to Refunds</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Refund Details</h1>
            <p className="text-gray-600">Refund ID: {refund.id}</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/portal/refund-status">
              ← Back to All Refunds
            </Link>
          </Button>
        </div>

        {/* Refund Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Refund Information</CardTitle>
                <CardDescription>Complete details for this deposit refund</CardDescription>
              </div>
              {getStatusBadge(refund.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Tenant Information</h3>
                <div className="space-y-2">
                  <p className="font-medium">{refund.tenant?.first_name} {refund.tenant?.last_name}</p>
                  <p className="text-sm text-gray-600">{refund.tenant?.email}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Property Information</h3>
                <div className="space-y-2">
                  <p className="font-medium">{refund.property?.title}</p>
                  <p className="text-sm text-gray-600">{refund.property?.address}</p>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Deposit Amount</h3>
                <p className="text-2xl font-bold">{formatCurrency(refund.deposit_amount)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Refund Amount</h3>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(refund.refund_amount)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Deductions</h3>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(refund.deposit_amount - refund.refund_amount)}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-4">Refund Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Requested</p>
                    <p className="text-sm text-gray-600">{formatDate(refund.requested_date)}</p>
                  </div>
                </div>
                {refund.processed_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Processed</p>
                      <p className="text-sm text-gray-600">{formatDate(refund.processed_date)}</p>
                    </div>
                  </div>
                )}
                {refund.completed_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Completed</p>
                      <p className="text-sm text-gray-600">{formatDate(refund.completed_date)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {refund.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <p className="text-gray-700">{refund.notes}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => window.print()}>
              <FileText className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
            <div className="flex gap-3">
              {refund.status === 'pending' && (
                <>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Refund
                  </Button>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main refund list view
  return (
    <div className="min-h-screen bg-gray-50/50">
      <section className="relative overflow-hidden bg-gradient-to-r from-[#154279] to-[#0f325e] text-white py-12 px-6 shadow-xl mb-8 lg:rounded-b-3xl">
        <HeroBackground />
        <div className="relative z-10 max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight">Refund Status Tracking</h1>
              <p className="text-lg text-blue-100 max-w-2xl font-light">
                Track and manage security deposit refunds
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={loadRefunds}
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
               <Button 
                className="bg-white text-[#154279] hover:bg-gray-100 font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-gray-600">Total Refunds</p>
            <p className="text-xs text-green-600 mt-1">
              {stats.refundRate.toFixed(1)}% refund rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRefunds)}</div>
            <p className="text-sm text-gray-600">Total Refunded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-gray-600">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.deductions)}</div>
            <p className="text-sm text-gray-600">Total Deductions</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search refunds by tenant, property, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filter
            </Button>
          </div>

          {/* Status Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="processing">Processing ({stats.processing})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <div className="text-sm text-gray-600">
                Showing all refund requests
              </div>
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
              <div className="text-sm text-gray-600">
                {stats.pending} refunds awaiting review
              </div>
            </TabsContent>
            <TabsContent value="processing" className="mt-4">
              <div className="text-sm text-gray-600">
                {stats.processing} refunds being processed
              </div>
            </TabsContent>
            <TabsContent value="approved" className="mt-4">
              <div className="text-sm text-gray-600">
                {stats.approved} refunds approved for payment
              </div>
            </TabsContent>
            <TabsContent value="rejected" className="mt-4">
              <div className="text-sm text-gray-600">
                {stats.rejected} refunds have been rejected
              </div>
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              <div className="text-sm text-gray-600">
                {stats.completed} refunds successfully completed
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <CardTitle>Refund Requests</CardTitle>
          <CardDescription>
            {filteredRefunds.length} refund{filteredRefunds.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRefunds.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No refunds found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? 'Try adjusting your search' : 'No refund requests in the system yet'}
              </p>
              <Button onClick={loadRefunds} className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Refund ID</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Deposit</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRefunds.map((refund) => (
                    <TableRow key={refund.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {refund.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {refund.tenant?.first_name} {refund.tenant?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{refund.tenant?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{refund.property?.title}</div>
                          <div className="text-sm text-gray-500">{refund.property?.address}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(refund.deposit_amount)}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(refund.refund_amount)}
                      </TableCell>
                      <TableCell>
                        {formatDate(refund.requested_date)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(refund.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/portal/refund-status/${refund.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredRefunds.length} of {refunds.length} refunds
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
};

export default RefundStatusPage;