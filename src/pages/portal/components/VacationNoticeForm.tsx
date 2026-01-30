// src/pages/portal/components/VacationNoticeForm.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Home, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  User,
  Building,
  CalendarDays
} from 'lucide-react';
import { useApprovalContext } from '@/contexts/ApprovalContext';
import { toast } from 'sonner';

interface VacationNoticeFormProps {
  leaseId?: string;
  onSuccess?: (approvalId: string) => void;
}

interface VacationNoticeData {
  intendedVacateDate: string;
  noticePeriod: string;
  forwardingAddress: string;
  reason: string;
  handoverToManager: boolean;
  notes: string;
  forwardingPhone?: string;
  forwardingEmail?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  forwardingDocuments?: string[];
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

const VacationNoticeForm = ({ leaseId, onSuccess }: VacationNoticeFormProps) => {
  const { addApproval, pendingApprovals, filterByType } = useApprovalContext();
  const [formData, setFormData] = useState<VacationNoticeData>({
    intendedVacateDate: '',
    noticePeriod: '30',
    forwardingAddress: '',
    reason: '',
    handoverToManager: true,
    notes: '',
    forwardingPhone: '',
    forwardingEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    forwardingDocuments: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentApproval, setCurrentApproval] = useState<any>(null);

  // Mock lease data - In a real app, this would come from props or API
  const lease = {
    id: leaseId || 'LEASE-001',
    property: 'Sunset Apartments',
    property_id: 'PROP-001',
    unit: 'A304',
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    monthlyRent: 1800,
    depositAmount: 1800,
    tenantName: 'John Smith',
    tenantId: 'TENANT-001',
    leaseTerm: '12 months',
    propertyType: 'Apartment',
    propertyAddress: '123 Sunset Blvd, Los Angeles, CA 90001'
  };

  // Check for existing vacation notices for this lease
  useEffect(() => {
    const vacationApprovals = filterByType('vacation_notice');
    const existingApproval = vacationApprovals.find(
      approval => approval.property_id === lease.id && 
      (approval.status === 'pending' || approval.status === 'in_review')
    );
    
    if (existingApproval) {
      setCurrentApproval(existingApproval);
      // Pre-fill form with existing data if needed
      if (existingApproval.metadata) {
        setFormData(prev => ({
          ...prev,
          ...existingApproval.metadata
        }));
      }
    }
  }, [filterByType, lease.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.intendedVacateDate) {
      toast.error('Please select an intended vacate date');
      return;
    }

    if (new Date(formData.intendedVacateDate) < new Date()) {
      toast.error('Intended vacate date cannot be in the past');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a unique ID for the approval
      const approvalId = `VACATION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create the approval object
      const vacationApproval = {
        id: approvalId,
        title: `Vacation Notice - ${lease.property} ${lease.unit}`,
        type: 'vacation_notice',
        status: 'pending' as const,
        submitted_by: lease.tenantId,
        submitted_by_name: lease.tenantName,
        property_id: lease.id,
        property_name: lease.property,
        description: `Vacation notice submitted for ${lease.property} ${lease.unit}. Intended vacate date: ${formData.intendedVacateDate}. Reason: ${formData.reason}`,
        priority: 'medium' as const,
        attachments: [],
        comments: [],
        notes: formData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_date: calculateNoticeDate(),
        estimated_cost: 0,
        actual_cost: 0,
        category: 'tenant_move_out',
        assigned_to: 'MANAGER-001',
        tags: ['vacation', 'move_out', 'lease_termination'],
        metadata: {
          ...formData,
          leaseId: lease.id,
          leaseDetails: {
            property: lease.property,
            unit: lease.unit,
            monthlyRent: lease.monthlyRent,
            depositAmount: lease.depositAmount,
            leaseEndDate: lease.endDate,
            tenantName: lease.tenantName
          },
          timeline: {
            noticeDate: new Date().toISOString(),
            intendedVacateDate: formData.intendedVacateDate,
            noticePeriod: formData.noticePeriod,
            requiredNoticeBy: calculateNoticeDate()
          },
          checklist: {
            propertyInspectionScheduled: false,
            keysReturned: false,
            finalRentPaid: false,
            utilitiesTransferred: false,
            forwardingAddressProvided: !!formData.forwardingAddress
          }
        }
      };

      // Add to approval context
      await addApproval(vacationApproval);

      // Reset form
      setFormData({
        intendedVacateDate: '',
        noticePeriod: '30',
        forwardingAddress: '',
        reason: '',
        handoverToManager: true,
        notes: '',
        forwardingPhone: '',
        forwardingEmail: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        forwardingDocuments: []
      });

      setSubmitted(true);
      setCurrentApproval(vacationApproval);
      
      toast.success('Vacation notice submitted successfully!', {
        description: `Your notice has been submitted and is awaiting manager approval. Reference: ${approvalId}`
      });

      if (onSuccess) {
        onSuccess(approvalId);
      }

    } catch (error) {
      console.error('Error submitting vacation notice:', error);
      toast.error('Failed to submit vacation notice', {
        description: 'Please try again or contact support if the issue persists.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateNoticeDate = (): string => {
    if (!formData.intendedVacateDate) return '';
    const date = new Date(formData.intendedVacateDate);
    const noticeDays = parseInt(formData.noticePeriod);
    date.setDate(date.getDate() - noticeDays);
    return date.toISOString().split('T')[0];
  };

  const noticeDate = calculateNoticeDate();
  const today = new Date();
  const minVacateDate = new Date();
  minVacateDate.setDate(today.getDate() + 30); // Minimum 30 days from today

  const getVacationReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      'moving': 'Moving to a new location',
      'purchasing': 'Purchasing a home',
      'job': 'Job relocation',
      'financial': 'Financial reasons',
      'family': 'Family reasons',
      'health': 'Health reasons',
      'dissatisfied': 'Dissatisfied with property',
      'other': 'Other reasons'
    };
    return reasons[reason] || reason;
  };

  if (currentApproval && !submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Vacation Notice Already Submitted</h3>
            <p className="text-gray-600 mb-4">
              You have already submitted a vacation notice for this property. 
              It is currently <span className="font-semibold capitalize">{currentApproval.status}</span>.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-4">
              <p className="font-medium text-blue-800 mb-1">Reference: {currentApproval.id}</p>
              <p className="text-sm text-blue-700">
                Intended Vacate Date: {formatDate(currentApproval.metadata?.intendedVacateDate)}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setCurrentApproval(null)}
              className="mt-2"
            >
              Submit New Notice
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Vacation Notice Submitted!</h3>
            <p className="text-gray-600 mb-4">
              Your vacation notice has been submitted successfully. You will receive a confirmation email shortly.
            </p>
            {currentApproval && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Reference Number:</p>
                <p className="text-lg font-bold text-gray-900">{currentApproval.id}</p>
              </div>
            )}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <p className="text-sm font-medium text-blue-800 mb-2">Next Steps:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-center gap-2">
                  <CalendarDays className="w-3 h-3" />
                  <span>Manager will schedule property inspection (7-14 days before vacate)</span>
                </li>
                <li className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3" />
                  <span>Deposit refund process will begin after vacating (within 21 days)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Building className="w-3 h-3" />
                  <span>Final walkthrough must be completed with property manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span>All rent and utilities must be paid up to the vacate date</span>
                </li>
              </ul>
            </div>
            <div className="space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSubmitted(false);
                  setCurrentApproval(null);
                }}
              >
                Submit Another Notice
              </Button>
              <Button 
                onClick={() => {
                  // Navigate to dashboard or approvals page
                  window.location.href = '/portal/approvals';
                }}
              >
                View Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Submit Vacation Notice
        </CardTitle>
        <CardDescription>
          Notify us of your intention to vacate. This starts the deposit refund process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Lease Info */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-3 mb-3">
              <Home className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium">Current Lease Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Property</p>
                <p className="font-medium">{lease.property}</p>
                <p className="text-xs text-gray-500">{lease.propertyAddress}</p>
              </div>
              <div>
                <p className="text-gray-600">Unit</p>
                <p className="font-medium">{lease.unit}</p>
              </div>
              <div>
                <p className="text-gray-600">Lease End Date</p>
                <p className="font-medium">{formatDate(lease.endDate)}</p>
              </div>
              <div>
                <p className="text-gray-600">Security Deposit</p>
                <p className="font-medium flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {lease.depositAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Monthly Rent</p>
                <p className="font-medium flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {lease.monthlyRent.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Tenant</p>
                <p className="font-medium">{lease.tenantName}</p>
              </div>
            </div>
          </div>

          {/* Vacation Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Intended Vacate Date *
                </label>
                <input
                  type="date"
                  name="intendedVacateDate"
                  value={formData.intendedVacateDate}
                  onChange={handleChange}
                  required
                  min={minVacateDate.toISOString().split('T')[0]}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 30 days from today
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Notice Period *
                </label>
                <select
                  name="noticePeriod"
                  value={formData.noticePeriod}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="30">30 days (Standard)</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
            </div>

            {noticeDate && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Notice Date Calculation</p>
                    <p className="text-sm text-yellow-700">
                      Based on {formData.noticePeriod}-day notice period, you should submit this notice by:{' '}
                      <span className="font-bold">{formatDate(noticeDate)}</span>
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      {new Date(noticeDate) < new Date() ? (
                        <span className="font-medium">⚠️ This date has passed. Please submit immediately.</span>
                      ) : (
                        `You have ${Math.ceil((new Date(noticeDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Forwarding Address *
                </label>
                <input
                  type="text"
                  name="forwardingAddress"
                  value={formData.forwardingAddress}
                  onChange={handleChange}
                  required
                  placeholder="Where should we send your final documents and refund?"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Forwarding Phone
                </label>
                <input
                  type="tel"
                  name="forwardingPhone"
                  value={formData.forwardingPhone}
                  onChange={handleChange}
                  placeholder="Phone number for contact"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Forwarding Email *
                </label>
                <input
                  type="email"
                  name="forwardingEmail"
                  value={formData.forwardingEmail}
                  onChange={handleChange}
                  required
                  placeholder="Email for correspondence"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Reason for Vacating *
                </label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a reason...</option>
                  <option value="moving">Moving to a new location</option>
                  <option value="purchasing">Purchasing a home</option>
                  <option value="job">Job relocation</option>
                  <option value="financial">Financial reasons</option>
                  <option value="family">Family reasons</option>
                  <option value="health">Health reasons</option>
                  <option value="dissatisfied">Dissatisfied with property</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {formData.reason === 'other' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Please specify reason
                </label>
                <input
                  type="text"
                  name="reasonDetails"
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please specify your reason for vacating"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  placeholder="Contact person during move-out"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="Emergency contact number"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special instructions, concerns, or information for the property manager..."
                rows={3}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="handoverToManager"
                name="handoverToManager"
                checked={formData.handoverToManager}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="handoverToManager" className="text-sm text-gray-700">
                I agree to hand over the keys and complete a final property inspection with the manager
              </label>
            </div>
          </div>

          {/* Important Information */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 mb-2">Important Information</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• This notice is a legal document. Submitting false information may result in penalties</li>
                  <li>• You are responsible for rent until the vacate date or until a new tenant takes possession</li>
                  <li>• Security deposit refund begins after you vacate and complete final inspection</li>
                  <li>• You must provide a forwarding address for deposit refund and final statements</li>
                  <li>• All utilities must be transferred out of your name by the vacate date</li>
                  <li>• Property must be returned in the same condition (minus normal wear and tear)</li>
                  <li>• Cancellation of notice may require fees as per your lease agreement</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !formData.intendedVacateDate || !formData.forwardingAddress || !formData.forwardingEmail || !formData.reason}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting Notice...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Submit Vacation Notice
              </>
            )}
          </Button>

          <p className="text-sm text-gray-500 text-center">
            By submitting this form, you acknowledge that you have read and agree to the terms of your lease agreement and the vacation notice policy.
            This submission serves as your formal 30-day notice to vacate.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default VacationNoticeForm;