// src/pages/portal/components/ApprovalActionButtons.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

interface ApprovalActionButtonsProps {
  requestId: string;
  currentStatus: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails?: (id: string) => void;
  showViewDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ApprovalActionButtons = ({
  requestId,
  currentStatus,
  onApprove,
  onReject,
  onViewDetails,
  showViewDetails = true,
  size = 'md'
}: ApprovalActionButtonsProps) => {
  const sizeClass = size === 'sm' ? 'h-8 px-3 text-xs' : size === 'lg' ? 'h-12 px-6 text-base' : 'h-10 px-4';

  if (currentStatus !== 'pending') {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${
          currentStatus === 'approved' ? 'text-green-600' :
          currentStatus === 'rejected' ? 'text-red-600' :
          'text-yellow-600'
        }`}>
          {currentStatus === 'approved' ? 'Approved' :
           currentStatus === 'rejected' ? 'Rejected' :
           'In Review'}
        </span>
        {showViewDetails && onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(requestId)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Details
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => onApprove(requestId)}
        className={`bg-green-600 hover:bg-green-700 ${sizeClass}`}
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Approve
      </Button>
      <Button
        onClick={() => onReject(requestId)}
        variant="destructive"
        className={sizeClass}
      >
        <XCircle className="w-4 h-4 mr-2" />
        Reject
      </Button>
      {showViewDetails && onViewDetails && (
        <Button
          variant="outline"
          className={sizeClass}
          onClick={() => onViewDetails(requestId)}
        >
          <Eye className="w-4 h-4 mr-2" />
          Details
        </Button>
      )}
    </div>
  );
};

export default ApprovalActionButtons;