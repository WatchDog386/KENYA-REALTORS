// src/pages/portal/components/RefundStatusBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle, DollarSign } from 'lucide-react';

interface RefundStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'in_review' | 'refunded';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RefundStatusBadge = ({ status, showIcon = true, size = 'md' }: RefundStatusBadgeProps) => {
  const config = {
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      iconColor: 'text-yellow-600'
    },
    approved: {
      label: 'Approved',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-200',
      iconColor: 'text-green-600'
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-200',
      iconColor: 'text-red-600'
    },
    in_review: {
      label: 'In Review',
      icon: AlertCircle,
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      iconColor: 'text-blue-600'
    },
    refunded: {
      label: 'Refunded',
      icon: DollarSign,
      className: 'bg-purple-100 text-purple-800 border-purple-200',
      iconColor: 'text-purple-600'
    }
  };

  const currentConfig = config[status];
  const Icon = currentConfig.icon;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : size === 'lg' ? 'text-base px-4 py-2' : 'text-sm px-3 py-1.5';

  return (
    <Badge className={`${currentConfig.className} ${sizeClass}`}>
      {showIcon && <Icon className={`w-3 h-3 mr-1 ${currentConfig.iconColor}`} />}
      {currentConfig.label}
    </Badge>
  );
};

export default RefundStatusBadge;