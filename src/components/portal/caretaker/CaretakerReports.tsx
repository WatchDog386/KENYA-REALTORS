import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { caretakerDutyService, CaretakerDuty } from '@/services/caretakerDutyService';
import { caretakerService } from '@/services/caretakerService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  FileText,
  Check,
  Clock,
  Loader2,
  Download,
  Star,
  Send,
  X,
  ClipboardList,
  Award,
  Plus,
  ImagePlus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface DutyWithUI extends CaretakerDuty {
  showReportForm?: boolean;
}

const CaretakerReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [duties, setDuties] = useState<DutyWithUI[]>([]);
  const [caretakerId, setCaretakerId] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [selectedDuty, setSelectedDuty] = useState<DutyWithUI | null>(null);
  const [reportText, setReportText] = useState('');
  const [showNewReportDialog, setShowNewReportDialog] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    type: 'general',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    averageRating: 0
  });
  const [reportImages, setReportImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('duty-reports')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('duty-reports')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setReportImages(prev => [...prev, ...filesArray]);
    }
  };

  const removeImage = (index: number) => {
    setReportImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };



  useEffect(() => {
    if (user) {
      fetchCaretakerData();
    }
  }, [user]);

  const fetchCaretakerData = async () => {
    try {
      setLoading(true);
      const caretaker = await caretakerService.getCaretakerByUserId(user!.id);
      
      if (caretaker?.id) {
        setCaretakerId(caretaker.id);
        if (caretaker.property_id) {
            setPropertyId(caretaker.property_id);
        }
        await Promise.all([
          fetchDuties(caretaker.id),
          fetchStatistics(caretaker.id)
        ]);
      } else {
        toast.error('Could not load caretaker information');
      }
    } catch (error) {
      console.error('Error fetching caretaker data:', error);
      toast.error('Failed to load caretaker data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDuties = async (ctId: string) => {
    try {
      const allDuties = await caretakerDutyService.getCaretakerDuties(ctId);
      setDuties(allDuties);
    } catch (error) {
      console.error('Error fetching duties:', error);
      toast.error('Failed to load duties');
    }
  };

  const fetchStatistics = async (ctId: string) => {
    try {
      const stats = await caretakerDutyService.getCaretakerDutyStats(ctId);
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleStartDuty = async (duty: DutyWithUI) => {
    if (!caretakerId) return;
    try {
      await caretakerDutyService.startDuty(duty.id);
      toast.success('Duty started!');
      await fetchDuties(caretakerId);
    } catch (error) {
      console.error('Error starting duty:', error);
      toast.error('Failed to start duty');
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedDuty || !reportText.trim()) {
      toast.error('Please enter some content for the report');
      return;
    }

    try {
      setSubmitting(true);
      
      const imageUrls: string[] = [];
      if (reportImages.length > 0) {
        for (const file of reportImages) {
          const url = await uploadImage(file);
          imageUrls.push(url);
        }
      }

      const allImages = [...existingImages, ...imageUrls];

      // Update the duty with report text but don't mark as submitted
      await caretakerDutyService.updateDuty(selectedDuty.id, {
        report_text: reportText,
        report_images: allImages
      });
      toast.success('Report draft saved');
      setReportText('');
      setReportImages([]);
      setExistingImages([]);
      setSelectedDuty(null);
      if (caretakerId) {
        await fetchDuties(caretakerId);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedDuty || !reportText.trim()) {
      toast.error('Please enter content for the report');
      return;
    }

    try {
      setSubmitting(true);
      
      const imageUrls: string[] = [];
      if (reportImages.length > 0) {
        for (const file of reportImages) {
          const url = await uploadImage(file);
          imageUrls.push(url);
        }
      }

      const allImages = [...existingImages, ...imageUrls];

      await caretakerDutyService.submitReport(selectedDuty.id, {
        report_text: reportText,
        report_images: allImages
      });
      toast.success('Report submitted successfully to your property manager!');
      setReportText('');
      setReportImages([]);
      setExistingImages([]);
      setSelectedDuty(null);
      if (caretakerId) {
        await fetchDuties(caretakerId);
        await fetchStatistics(caretakerId);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAdhocReport = async () => {
    if (!newReport.title || !newReport.description) {
      toast.error('Please enter a title and description for the report');
      setSubmitting(false);
      return;
    }

    if (!propertyId) {
        toast.error('You are not assigned to a property.');
        setSubmitting(false);
        return;
    }

    try {
      setSubmitting(true);
      
      const imageUrls: string[] = [];
      if (reportImages.length > 0) {
        for (const file of reportImages) {
          const url = await uploadImage(file);
          imageUrls.push(url);
        }
      }

      await caretakerDutyService.createAdhocReport({
        caretaker_id: caretakerId!,
        property_id: propertyId!,
        title: newReport.title,
        description: newReport.description, // Initial description
        duty_type: newReport.type as any,
        priority: newReport.priority as any,
        report_text: newReport.description, // Same text for the report
        report_submitted: true,
        recurring: false,
        report_images: imageUrls
      });

      toast.success('Report submitted successfully!');
      setShowNewReportDialog(false);
      setNewReport({ title: '', description: '', type: 'general', priority: 'medium' });
      setReportImages([]);
      
      if (caretakerId) {
        await fetchDuties(caretakerId);
        await fetchStatistics(caretakerId);
      }
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
      completed: { color: 'bg-green-100 text-green-800', icon: <Check className="w-4 h-4" /> },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <X className="w-4 h-4" /> },
      overdue: { color: 'bg-red-200 text-red-900', icon: <AlertCircle className="w-4 h-4" /> }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-50 border-green-200',
      medium: 'bg-yellow-50 border-yellow-200',
      high: 'bg-orange-50 border-orange-200',
      urgent: 'bg-red-50 border-red-200'
    };
    return colors[priority] || 'bg-slate-50 border-slate-200';
  };

  const filteredDuties = duties.filter(duty => {
    if (activeTab === 'pending') return duty.status === 'pending';
    if (activeTab === 'in_progress') return duty.status === 'in_progress';
    if (activeTab === 'completed') return duty.status === 'completed';
    if (activeTab === 'reports') return duty.report_submitted;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#154279]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-[#154279]" />
            <h1 className="text-3xl font-bold text-[#154279]">Daily Reports & Logs</h1>
          </div>
          <p className="text-slate-600">Manage your assigned duties and submit reports to your property manager</p>
        </div>

        <Dialog 
          open={showNewReportDialog} 
          onOpenChange={(open) => {
            setShowNewReportDialog(open);
            if (!open) setReportImages([]);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => {
              setNewReport({ title: '', description: '', type: 'general', priority: 'medium' });
              setReportImages([]);
            }} className="bg-[#154279] hover:bg-[#0f2d5a] text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-[#154279]">Create New Report</DialogTitle>
              <DialogDescription>
                Submit a new report for an issue, maintenance request, or update to the property manager.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-slate-700">Report Title *</label>
                <Input 
                  value={newReport.title}
                  onChange={(e) => setNewReport({...newReport, title: e.target.value})}
                  placeholder="e.g., Leaking Pipe in Unit 4B"
                  className="border-slate-300"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-700">Type</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newReport.type}
                    onChange={(e) => setNewReport({...newReport, type: e.target.value})}
                  >
                    <option value="general">General Update</option>
                    <option value="maintenance">Maintenance Issue</option>
                    <option value="security">Security Incident</option>
                    <option value="inspection">Inspection</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-700">Priority</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newReport.priority}
                    onChange={(e) => setNewReport({...newReport, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block text-slate-700">Details *</label>
                <Textarea 
                  value={newReport.description}
                  onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                  placeholder="Describe the situation in detail..."
                  className="min-h-[150px] border-slate-300"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block text-slate-700">Attach Photos</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {reportImages.map((file, index) => (
                    <div key={index} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Preview ${index}`} 
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center text-slate-400 hover:border-[#154279] hover:text-[#154279] transition-colors"
                  >
                    <ImagePlus className="w-6 h-6 mb-1" />
                    <span className="text-xs">Add Photo</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  You can upload multiple photos to help describe the issue.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowNewReportDialog(false);
                setReportImages([]);
              }}>Cancel</Button>
              <Button 
                onClick={handleCreateAdhocReport} 
                disabled={submitting}
                className="bg-[#154279] text-white"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#154279] mb-1">{statistics.total}</div>
              <p className="text-sm text-slate-600">Total Duties</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-700 mb-1">{statistics.pending}</div>
              <p className="text-sm text-slate-600">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700 mb-1">{statistics.inProgress}</div>
              <p className="text-sm text-slate-600">In Progress</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-700 mb-1">{statistics.completed}</div>
              <p className="text-sm text-slate-600">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700 mb-1 flex items-center justify-center gap-1">
                {statistics.averageRating.toFixed(1)}
                <Star className="w-5 h-5 fill-purple-500" />
              </div>
              <p className="text-sm text-slate-600">Avg Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duties and Reports Tabs */}
      <Card className="border-slate-200 shadow-sm">
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-slate-200 px-6">
            <TabsList className="w-full justify-start bg-transparent border-b border-slate-200 rounded-none h-auto p-0">
              <TabsTrigger
                value="pending"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-[#154279] data-[state=active]:text-[#154279]"
              >
                <Clock className="w-4 h-4 mr-2" />
                Pending ({statistics.pending})
              </TabsTrigger>
              <TabsTrigger
                value="in_progress"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-[#154279] data-[state=active]:text-[#154279]"
              >
                <Loader2 className="w-4 h-4 mr-2" />
                In Progress ({statistics.inProgress})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-[#154279] data-[state=active]:text-[#154279]"
              >
                <Check className="w-4 h-4 mr-2" />
                Completed ({statistics.completed})
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-[#154279] data-[state=active]:text-[#154279]"
              >
                <FileText className="w-4 h-4 mr-2" />
                Submitted Reports
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-6">
            {filteredDuties.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 mb-2">
                  {activeTab === 'pending' && 'No pending duties at the moment'}
                  {activeTab === 'in_progress' && 'No duties in progress'}
                  {activeTab === 'completed' && 'No completed duties yet'}
                  {activeTab === 'reports' && 'No submitted reports yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDuties.map(duty => (
                  <div key={duty.id} className={`border rounded-lg p-5 ${getPriorityColor(duty.priority)}`}>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[#154279] mb-1">{duty.title}</h3>
                            {duty.description && (
                              <p className="text-sm text-slate-700 mb-2">{duty.description}</p>
                            )}
                          </div>
                          {getStatusBadge(duty.status)}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {duty.duty_type.charAt(0).toUpperCase() + duty.duty_type.slice(1).replace('_', ' ')}
                          </Badge>
                          {duty.due_date && (
                            <Badge variant="outline" className="text-xs">
                              Due: {new Date(duty.due_date).toLocaleDateString()}
                            </Badge>
                          )}
                          {duty.property?.name && (
                            <Badge variant="outline" className="text-xs">
                              {duty.property.name}
                            </Badge>
                          )}
                        </div>

                        {/* Report Status */}
                        {duty.status === 'completed' && (
                          <div className="mt-3 p-3 bg-white rounded border border-slate-200">
                            {duty.report_submitted ? (
                              <div>
                                <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                                  <Check className="w-4 h-4" />
                                  Report Submitted
                                </div>
                                <p className="text-sm text-slate-700 mb-2">
                                  Submitted on: {new Date(duty.report_submitted_at!).toLocaleString()}
                                </p>
                                {duty.report_text && (
                                  <div className="text-sm bg-slate-50 p-2 rounded mt-2 max-h-32 overflow-y-auto">
                                    <strong>Report:</strong> {duty.report_text}
                                  </div>
                                )}
                                {duty.report_images && duty.report_images.length > 0 && (
                                  <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                                    {duty.report_images.map((img, i) => (
                                      <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                                        <img src={img} alt={`Report attachment ${i+1}`} className="h-16 w-16 object-cover rounded border hover:opacity-90" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                                {duty.manager_feedback && (
                                  <div className="text-sm bg-blue-50 p-2 rounded mt-2 border-l-4 border-l-blue-400">
                                    <strong>Manager Feedback:</strong> {duty.manager_feedback}
                                    {duty.rating && (
                                      <div className="flex items-center gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-4 h-4 ${
                                              i < duty.rating!
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-slate-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm text-slate-700 mb-3">
                                  This duty is complete. Please submit a report to your property manager.
                                </p>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      onClick={() => {
                                        setSelectedDuty(duty);
                                        setReportText(duty.report_text || '');
                                        setReportImages([]);
                                      }}
                                      className="bg-[#154279] hover:bg-[#0f2d5a] text-white"
                                      size="sm"
                                    >
                                      <FileText className="w-4 h-4 mr-2" />
                                      Submit Report
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="dialog-content max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle className="text-[#154279]">
                                        Submit Report for: {selectedDuty?.title}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Provide details about the task completion and any relevant information
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4 py-4">
                                      {selectedDuty?.duty_type && (
                                        <div className="p-3 bg-slate-100 rounded text-sm">
                                          <strong>Duty Type:</strong> {selectedDuty.duty_type}
                                        </div>
                                      )}

                                      <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                          Report Details *
                                        </label>
                                        <Textarea
                                          value={reportText}
                                          onChange={(e) => setReportText(e.target.value)}
                                          placeholder="Describe what was completed, any issues encountered, materials used, time spent, etc..."
                                          className="min-h-[200px] border-slate-300 focus:border-[#154279]"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                          Attach Photos
                                        </label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                          {existingImages.map((url, index) => (
                                            <div key={`existing-${index}`} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                                              <img 
                                                src={url} 
                                                alt={`Existing ${index}`} 
                                                className="w-full h-full object-cover"
                                              />
                                              <button
                                                onClick={() => removeExistingImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 text-center">
                                                Saved
                                              </div>
                                            </div>
                                          ))}
                                          {reportImages.map((file, index) => (
                                            <div key={`new-${index}`} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                                              <img 
                                                src={URL.createObjectURL(file)} 
                                                alt={`Preview ${index}`} 
                                                className="w-full h-full object-cover"
                                              />
                                              <button
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                          <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center text-slate-400 hover:border-[#154279] hover:text-[#154279] transition-colors"
                                          >
                                            <ImagePlus className="w-6 h-6 mb-1" />
                                            <span className="text-xs">Add Photo</span>
                                          </button>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                          You can upload multiple photos to help describe the issue.
                                        </p>
                                      </div>
                                    </div>

                                    <DialogFooter className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setReportText('');
                                          setReportImages([]);
                                          setSelectedDuty(null);
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={handleSaveDraft}
                                        disabled={submitting}
                                        className="text-slate-700"
                                      >
                                        {submitting ? (
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                          <FileText className="w-4 h-4 mr-2" />
                                        )}
                                        Save Draft
                                      </Button>
                                      <Button
                                        onClick={handleSubmitReport}
                                        disabled={submitting}
                                        className="bg-[#F96302] hover:bg-[#d85502] text-white"
                                      >
                                        {submitting ? (
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                          <Send className="w-4 h-4 mr-2" />
                                        )}
                                        Submit & Send to Manager
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {duty.status === 'pending' && (
                          <Button
                            onClick={() => handleStartDuty(duty)}
                            className="bg-[#154279] hover:bg-[#0f2d5a] text-white whitespace-nowrap"
                            size="sm"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Start
                          </Button>
                        )}
                        {duty.status === 'in_progress' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => {
                                  setSelectedDuty(duty);
                                  setReportText(duty.report_text || '');
                                  
                                  // Safely handle report_images which might be a JSON string or array
                                  let images: string[] = [];
                                  const rawImages = duty.report_images as any;
                                  
                                  if (rawImages) {
                                    if (Array.isArray(rawImages)) {
                                      images = rawImages;
                                    } else if (typeof rawImages === 'string') {
                                      try {
                                        // internal check for JSON string array format
                                        if (rawImages.startsWith('[')) {
                                            images = JSON.parse(rawImages);
                                        } else {
                                            // legacy single string handling if any? Unlikely but safe.
                                            images = [rawImages];
                                        }
                                      } catch (e) {
                                        console.error("Failed to parse report_images", e);
                                        images = [];
                                      }
                                    }
                                  }
                                  
                                  setExistingImages(images);
                                  setReportImages([]);
                                }}
                                className="bg-[#154279] hover:bg-[#0f2d5a] text-white whitespace-nowrap"
                                size="sm"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Complete & Report
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="dialog-content max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-[#154279]">
                                  Submit Report for: {selectedDuty?.title}
                                </DialogTitle>
                                <DialogDescription>
                                  Mark this task as complete and provide a report
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 py-4">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Report Details *
                                  </label>
                                  <Textarea
                                    value={reportText}
                                    onChange={(e) => setReportText(e.target.value)}
                                    placeholder="Describe what was completed, any issues encountered, materials used, time spent, etc..."
                                    className="min-h-[200px] border-slate-300 focus:border-[#154279]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Attach Photos
                                  </label>
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {existingImages.map((url, index) => (
                                      <div key={`existing-${index}`} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                                        <img 
                                          src={url} 
                                          alt={`Existing ${index}`} 
                                          className="w-full h-full object-cover"
                                        />
                                        <button
                                          onClick={() => removeExistingImage(index)}
                                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 text-center">
                                          Saved
                                        </div>
                                      </div>
                                    ))}
                                    {reportImages.map((file, index) => (
                                      <div key={`new-${index}`} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                                        <img 
                                          src={URL.createObjectURL(file)} 
                                          alt={`Preview ${index}`} 
                                          className="w-full h-full object-cover"
                                        />
                                        <button
                                          onClick={() => removeImage(index)}
                                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => fileInputRef.current?.click()}
                                      className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center text-slate-400 hover:border-[#154279] hover:text-[#154279] transition-colors"
                                    >
                                      <ImagePlus className="w-6 h-6 mb-1" />
                                      <span className="text-xs">Add Photo</span>
                                    </button>
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    You can upload multiple photos to help describe the issue.
                                  </p>
                                </div>
                              </div>

                              <DialogFooter className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setReportText('');
                                    setReportImages([]);
                                    setSelectedDuty(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={handleSaveDraft}
                                  disabled={submitting}
                                  className="text-slate-700"
                                >
                                  {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <FileText className="w-4 h-4 mr-2" />
                                  )}
                                  Save Draft
                                </Button>
                                <Button
                                  onClick={handleSubmitReport}
                                  disabled={submitting}
                                  className="bg-[#F96302] hover:bg-[#d85502] text-white"
                                >
                                  {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                  )}
                                  Submit & Complete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Quick Messaging Section */}
      <Card className="border-slate-200 shadow-sm mt-8">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-[#154279] flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Need Help?
          </CardTitle>
          <CardDescription>
            Send a message to your property manager for any questions or issues
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Button 
            onClick={() => navigate('/portal/caretaker/messages')}
            className="bg-[#F96302] hover:bg-[#d85502] text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Go to Messages
          </Button>
        </CardContent>
      </Card>

      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        className="hidden"
        accept="image/*"
        multiple
      />
    </div>
  );
};

export default CaretakerReports;
