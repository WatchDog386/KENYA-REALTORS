// src/pages/portal/components/DepositRefundTracker.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface DepositRefundTrackerProps {
  refundId?: string;
}

// Simple formatDate function
const formatDate = (dateString: string, format: 'short' | 'long' | 'relative' = 'short'): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  // Default short format
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const DepositRefundTracker = ({ refundId }: DepositRefundTrackerProps) => {
  const [refund, setRefund] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - in real app, fetch from API
  useEffect(() => {
    setTimeout(() => {
      setRefund({
        id: refundId || 'REF-2024-001',
        originalDeposit: 1200,
        refundAmount: 950,
        status: 'in_review',
        progress: 65,
        steps: [
          { id: 1, name: 'Vacation Notice', status: 'completed', date: '2024-01-10' },
          { id: 2, name: 'Property Inspection', status: 'completed', date: '2024-01-12' },
          { id: 3, name: 'Deductions Calculated', status: 'completed', date: '2024-01-15' },
          { id: 4, name: 'Manager Review', status: 'current', date: '2024-01-18' },
          { id: 5, name: 'Admin Approval', status: 'pending' },
          { id: 6, name: 'Payment Processing', status: 'pending' },
        ],
        deductions: [
          { category: 'Cleaning', amount: 150 },
          { category: 'Minor Repairs', amount: 100 },
        ],
        estimatedCompletion: '2024-02-01'
      });
      setLoading(false);
    }, 800);
  }, [refundId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'current':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100';
      case 'current': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Deposit Refund Tracker
        </CardTitle>
        <CardDescription>
          Track your security deposit refund progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Refund Progress</span>
            <span className="text-sm font-bold">{refund.progress}%</span>
          </div>
          <Progress value={refund.progress} className="h-2" />
        </div>

        {/* Amount Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Original Deposit</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(refund.originalDeposit)}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Expected Refund</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(refund.refundAmount)}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3">
          <h4 className="font-medium">Refund Process</h4>
          {refund.steps.map((step: any, index: number) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(step.status)}`}>
                {getStatusIcon(step.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    step.status === 'current' ? 'text-blue-700' :
                    step.status === 'completed' ? 'text-green-700' :
                    'text-gray-700'
                  }`}>
                    {step.name}
                  </span>
                  {step.date && (
                    <span className="text-sm text-gray-500">{formatDate(step.date)}</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {step.status === 'completed' && 'Completed'}
                  {step.status === 'current' && 'In Progress'}
                  {step.status === 'pending' && 'Pending'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Deductions Summary */}
        {refund.deductions && refund.deductions.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Deductions Applied</h4>
            <div className="space-y-2">
              {refund.deductions.map((deduction: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{deduction.category}</span>
                  <span className="font-medium text-red-600">-{formatCurrency(deduction.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Completion */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Estimated Completion</p>
              <p className="text-sm text-yellow-700">
                {formatDate(refund.estimatedCompletion)} • Refund ID: {refund.id}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            View Full Details
          </button>
          <button className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <FileText className="w-4 h-4 inline mr-2" />
            Download Report
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DepositRefundTracker;