// src/contexts/ApprovalContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

interface Approval {
  id: string;
  title: string;
  type: string;
  status: string;
  submitted_by: string;
  property_id?: string;
  description: string;
  priority: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
}

interface ApprovalContextType {
  // State
  pendingApprovals: Approval[];
  approvedApprovals: Approval[];
  rejectedApprovals: Approval[];
  
  // Stats
  approvalStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    today: number;
    thisWeek: number;
  };
  
  // Actions
  approveRequest: (approvalId: string, notes?: string) => Promise<void>;
  rejectRequest: (approvalId: string, reason: string) => Promise<void>;
  addComment: (approvalId: string, comment: string) => Promise<void>;
  getApproval: (approvalId: string) => Approval | undefined;
  
  // Filters
  filterByType: (type: string) => Approval[];
  filterByStatus: (status: string) => Approval[];
  filterByPriority: (priority: string) => Approval[];
  
  // Search
  searchApprovals: (query: string) => Approval[];
}

const ApprovalContext = createContext<ApprovalContextType | undefined>(undefined);

export const useApprovalContext = () => {
  const context = useContext(ApprovalContext);
  if (!context) {
    throw new Error('useApprovalContext must be used within an ApprovalProvider');
  }
  return context;
};

interface ApprovalProviderProps {
  children: ReactNode;
}

export const ApprovalProvider: React.FC<ApprovalProviderProps> = ({ children }) => {
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [approvedApprovals, setApprovedApprovals] = useState<Approval[]>([]);
  const [rejectedApprovals, setRejectedApprovals] = useState<Approval[]>([]);

  // Calculate stats
  const approvalStats = {
    total: pendingApprovals.length + approvedApprovals.length + rejectedApprovals.length,
    pending: pendingApprovals.length,
    approved: approvedApprovals.length,
    rejected: rejectedApprovals.length,
    today: pendingApprovals.filter(a => {
      const today = new Date().toDateString();
      const approvalDate = new Date(a.created_at).toDateString();
      return today === approvalDate;
    }).length,
    thisWeek: pendingApprovals.filter(a => {
      const now = new Date();
      const approvalDate = new Date(a.created_at);
      const diffTime = Math.abs(now.getTime() - approvalDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length,
  };

  // Approve a request
  const approveRequest = async (approvalId: string, notes?: string) => {
    try {
      // In a real app, you would make an API call here
      const approval = pendingApprovals.find(a => a.id === approvalId);
      if (approval) {
        // Move from pending to approved
        setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
        setApprovedApprovals(prev => [...prev, { ...approval, status: 'approved' }]);
        
        toast.success('Request approved successfully');
        
        // You would typically trigger notifications, emails, etc. here
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  // Reject a request
  const rejectRequest = async (approvalId: string, reason: string) => {
    try {
      // In a real app, you would make an API call here
      const approval = pendingApprovals.find(a => a.id === approvalId);
      if (approval) {
        // Move from pending to rejected
        setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
        setRejectedApprovals(prev => [...prev, { ...approval, status: 'rejected' }]);
        
        toast.success('Request rejected successfully');
        
        // You would typically send rejection email with reason here
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  // Add comment to approval
  const addComment = async (approvalId: string, comment: string) => {
    try {
      // In a real app, you would save the comment to your database
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Get approval by ID
  const getApproval = (approvalId: string) => {
    const allApprovals = [...pendingApprovals, ...approvedApprovals, ...rejectedApprovals];
    return allApprovals.find(a => a.id === approvalId);
  };

  // Filter approvals by type
  const filterByType = (type: string) => {
    const allApprovals = [...pendingApprovals, ...approvedApprovals, ...rejectedApprovals];
    if (type === 'all') return allApprovals;
    return allApprovals.filter(a => a.type === type);
  };

  // Filter approvals by status
  const filterByStatus = (status: string) => {
    switch (status) {
      case 'pending': return pendingApprovals;
      case 'approved': return approvedApprovals;
      case 'rejected': return rejectedApprovals;
      default: return [...pendingApprovals, ...approvedApprovals, ...rejectedApprovals];
    }
  };

  // Filter approvals by priority
  const filterByPriority = (priority: string) => {
    const allApprovals = [...pendingApprovals, ...approvedApprovals, ...rejectedApprovals];
    if (priority === 'all') return allApprovals;
    return allApprovals.filter(a => a.priority === priority);
  };

  // Search approvals
  const searchApprovals = (query: string) => {
    const allApprovals = [...pendingApprovals, ...approvedApprovals, ...rejectedApprovals];
    const searchTerm = query.toLowerCase();
    
    return allApprovals.filter(approval => 
      approval.title.toLowerCase().includes(searchTerm) ||
      approval.description.toLowerCase().includes(searchTerm) ||
      approval.type.toLowerCase().includes(searchTerm) ||
      approval.status.toLowerCase().includes(searchTerm)
    );
  };

  const value = {
    // State
    pendingApprovals,
    approvedApprovals,
    rejectedApprovals,
    
    // Stats
    approvalStats,
    
    // Actions
    approveRequest,
    rejectRequest,
    addComment,
    getApproval,
    
    // Filters
    filterByType,
    filterByStatus,
    filterByPriority,
    
    // Search
    searchApprovals,
  };

  return (
    <ApprovalContext.Provider value={value}>
      {children}
    </ApprovalContext.Provider>
  );
};