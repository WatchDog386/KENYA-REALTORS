// src/components/portal/caretaker/CaretakerDuties.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { caretakerService } from '@/services/caretakerService';
import { caretakerDutyService, CaretakerDuty, DutyReportTemplate } from '@/services/caretakerDutyService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  ClipboardList,
  Play,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  Search,
  Star,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const CaretakerDuties = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [caretaker, setCaretaker] = useState<any>(null);
  const [duties, setDuties] = useState<CaretakerDuty[]>([]);
  const [filteredDuties, setFilteredDuties] = useState<CaretakerDuty[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0, averageRating: 0 });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Report dialog
  const [selectedDuty, setSelectedDuty] = useState<CaretakerDuty | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportTemplate, setReportTemplate] = useState<DutyReportTemplate | null>(null);
  const [reportText, setReportText] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  // View report dialog
  const [viewingDuty, setViewingDuty] = useState<CaretakerDuty | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  useEffect(() => {
    let result = duties;

    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.title?.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query) ||
        d.duty_type?.toLowerCase().includes(query)
      );
    }

    setFilteredDuties(result);
  }, [duties, searchQuery, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get caretaker profile
      const caretakerData = await caretakerService.getCaretakerByUserId(user!.id);
      if (!caretakerData) {
        toast.error("Caretaker profile not found");
        setLoading(false);
        return;
      }
      setCaretaker(caretakerData);

      // Fetch duties
      const dutiesData = await caretakerDutyService.getCaretakerDuties(caretakerData.id);
      setDuties(dutiesData);
      setFilteredDuties(dutiesData);

      // Fetch stats
      const statsData = await caretakerDutyService.getCaretakerDutyStats(caretakerData.id);
      setStats(statsData);

    } catch (error) {
      console.error('Error fetching duties:', error);
      toast.error('Failed to load duties');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDuty = async (duty: CaretakerDuty) => {
    try {
      await caretakerDutyService.startDuty(duty.id);
      toast.success('Duty started!');
      fetchData();
    } catch (error) {
      console.error('Error starting duty:', error);
      toast.error('Failed to start duty');
    }
  };

  const openReportDialog = async (duty: CaretakerDuty) => {
    setSelectedDuty(duty);
    setReportText('');
    setBeforeImage(null);
    setAfterImage(null);
    setBeforePreview(null);
    setAfterPreview(null);

    // Load template for this duty type
    try {
      const template = await caretakerDutyService.getTemplateByDutyType(duty.duty_type);
      setReportTemplate(template);
    } catch (error) {
      console.error('Error loading template:', error);
    }
    
    setIsReportDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      
      if (type === 'before') {
        setBeforeImage(file);
        setBeforePreview(preview);
      } else {
        setAfterImage(file);
        setAfterPreview(preview);
      }
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user!.id}/${fileName}`;

        // Try 'duty-reports' first, fallback to 'public' if not created
        let { error: uploadError } = await supabase.storage
            .from('duty-reports')
            .upload(filePath, file);

        if (uploadError) {
             // Fallback to property-images if duty-reports fails
             const { error: fallbackError } = await supabase.storage
                .from('property-images')
                .upload(filePath, file);
             
             if (fallbackError) {
                 throw fallbackError;
             }
             
             const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(filePath);
             return publicUrl;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('duty-reports')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedDuty || !reportText.trim()) {
      toast.error('Please enter a report');
      return;
    }

    try {
      setSubmittingReport(true);
      
      const imageUrls: string[] = [];
      if (beforeImage) {
        const url = await uploadImage(beforeImage);
        if (url) imageUrls.push(url);
      }
      if (afterImage) {
        const url = await uploadImage(afterImage);
        if (url) imageUrls.push(url);
      }

      await caretakerDutyService.submitReport(selectedDuty.id, {
        report_text: reportText,
        report_images: imageUrls
      });
      
      // Send notification message if manager exists
      if (caretaker?.property_manager) {
           await supabase.from('messages').insert({
               sender_id: user!.id,
               recipient_id: caretaker.property_manager.id,
               content: `New Duty Report Submitted: ${selectedDuty.title}\n\n${reportText.substring(0, 100)}...`,
               is_read: false
           });
      } else if (caretaker?.property_id) {
           // Find manager via property assignment
           const { data: assignment } = await supabase
              .from('property_manager_assignments')
              .select('property_manager_id')
              .eq('property_id', caretaker.property_id)
              .eq('status', 'active')
              .maybeSingle();
           
           if (assignment?.property_manager_id) {
               await supabase.from('messages').insert({
                   sender_id: user!.id,
                   recipient_id: assignment.property_manager_id,
                   content: `New Duty Report Submitted: ${selectedDuty.title}\n\n${reportText.substring(0, 100)}...`,
                   is_read: false
               });
           }
      }

      toast.success('Report submitted successfully!');
      setIsReportDialogOpen(false);
      setSelectedDuty(null);
      setReportText('');
      setBeforeImage(null);
      setAfterImage(null);
      fetchData();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const openViewDialog = (duty: CaretakerDuty) => {
    setViewingDuty(duty);
    setIsViewDialogOpen(true);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge className="bg-red-500 hover:bg-red-600">Urgent</Badge>;
      case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case 'medium': return <Badge className="bg-blue-500 hover:bg-blue-600">Medium</Badge>;
      case 'low': return <Badge className="bg-slate-500 hover:bg-slate-600">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500 hover:bg-blue-600"><Clock className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'pending': return <Badge className="bg-amber-500 hover:bg-amber-600"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'overdue': return <Badge className="bg-red-500 hover:bg-red-600"><AlertTriangle className="w-3 h-3 mr-1" /> Overdue</Badge>;
      case 'cancelled': return <Badge variant="outline">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDutyTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      cleaning: 'bg-cyan-100 text-cyan-800',
      security: 'bg-purple-100 text-purple-800',
      maintenance: 'bg-orange-100 text-orange-800',
      inspection: 'bg-indigo-100 text-indigo-800',
      general: 'bg-slate-100 text-slate-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={`${colors[type] || colors.other} border-0`}>{type}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#154279]" />
      </div>
    );
  }

  if (!caretaker) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-amber-700 mb-2">Caretaker Assignment Pending</h2>
          <p className="text-amber-600 mb-4">
            Your account is set up as a caretaker, but you haven't been assigned to a property yet.
          </p>
          <div className="bg-white rounded-lg p-4 text-left text-sm text-slate-600 space-y-2">
            <p className="font-semibold text-slate-700">What to do:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Contact your property manager or administrator</li>
              <li>Ask them to assign you to a property via the <strong>Property Assignment</strong> page</li>
              <li>Once assigned, refresh this page to see your duties</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#154279] tracking-tight mb-2">My Duties</h1>
          <p className="text-slate-500 font-medium">View and manage your assigned tasks and responsibilities.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-sm text-slate-500">Total Duties</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-sm text-slate-500">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-sm text-slate-500">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
            <p className="text-sm text-slate-500">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <p className="text-2xl font-bold text-slate-900">{stats.averageRating || '-'}</p>
            </div>
            <p className="text-sm text-slate-500">Avg. Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm mb-6">
        <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search duties..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Duties Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#154279]" />
            Assigned Duties
          </CardTitle>
          <CardDescription>Tasks assigned to you by your property manager</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDuties.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No duties found</p>
              <p className="text-sm">You don't have any assigned duties yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDuties.map((duty) => (
                    <TableRow key={duty.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{duty.title}</p>
                          {duty.description && (
                            <p className="text-sm text-slate-500 line-clamp-1">{duty.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getDutyTypeBadge(duty.duty_type)}</TableCell>
                      <TableCell>{getPriorityBadge(duty.priority)}</TableCell>
                      <TableCell>
                        {duty.due_date ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3" />
                            {new Date(duty.due_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(duty.status)}</TableCell>
                      <TableCell>
                        {duty.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span>{duty.rating}/5</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {duty.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartDuty(duty)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Play className="w-3 h-3 mr-1" /> Start
                            </Button>
                          )}
                          {duty.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => openReportDialog(duty)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                              <FileText className="w-3 h-3 mr-1" /> Submit Report
                            </Button>
                          )}
                          {duty.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openViewDialog(duty)}
                            >
                              <FileText className="w-3 h-3 mr-1" /> View Report
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Duty Report</DialogTitle>
            <DialogDescription>
              Complete the report for: <strong>{selectedDuty?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {reportTemplate && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">
                  Template: {reportTemplate.name}
                </p>
                <p className="text-xs text-blue-600">{reportTemplate.description}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <Label htmlFor="report">Duty Report *</Label>
              <Textarea
                id="report"
                placeholder="Describe what you accomplished, any issues encountered, and other relevant details..."
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                rows={8}
                className="resize-none bg-white text-slate-900 border-slate-200 placeholder:text-slate-400"
              />
            </div>

            {/* Before & After Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Before Work</Label>
                <div 
                    className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 text-center hover:bg-slate-100 transition-colors cursor-pointer relative"
                    onClick={() => document.getElementById('before-upload')?.click()}
                >
                  <input 
                    type="file" 
                    id="before-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            setBeforeImage(e.target.files[0]);
                            setBeforePreview(URL.createObjectURL(e.target.files[0]));
                        }
                    }}
                  />
                  {beforePreview ? (
                      <div className="relative aspect-video w-full rounded-md overflow-hidden">
                          <img src={beforePreview} alt="Before" className="object-cover w-full h-full" />
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                setBeforeImage(null);
                                setBeforePreview(null);
                            }}
                          >
                              <X className="w-3 h-3" />
                          </Button>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500 py-4">
                        <ClipboardList className="w-8 h-8 opacity-50" />
                        <span className="text-xs">Upload initial condition photo</span>
                      </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">After Work</Label>
                <div 
                    className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 text-center hover:bg-slate-100 transition-colors cursor-pointer relative"
                    onClick={() => document.getElementById('after-upload')?.click()}
                >
                  <input 
                    type="file" 
                    id="after-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            setAfterImage(e.target.files[0]);
                            setAfterPreview(URL.createObjectURL(e.target.files[0]));
                        }
                    }}
                  />
                  {afterPreview ? (
                      <div className="relative aspect-video w-full rounded-md overflow-hidden">
                          <img src={afterPreview} alt="After" className="object-cover w-full h-full" />
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                setAfterImage(null);
                                setAfterPreview(null);
                            }}
                          >
                              <X className="w-3 h-3" />
                          </Button>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500 py-4">
                        <CheckCircle className="w-8 h-8 opacity-50" />
                        <span className="text-xs">Upload completed work photo</span>
                      </div>
                  )}
                </div>
              </div>
            </div>

            {reportTemplate?.template_fields && (
              <div className="p-3 bg-slate-50 rounded-lg border">
                <p className="text-sm font-medium text-slate-700 mb-2">Suggested sections to include:</p>
                <ul className="text-sm text-slate-600 space-y-1">
                  {reportTemplate.template_fields.map((field: any, index: number) => (
                    <li key={index}>• {field.label}{field.required ? ' *' : ''}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsReportDialogOpen(false)}
              className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReport} 
              disabled={submittingReport || !reportText.trim()}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {submittingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Duty Report</DialogTitle>
            <DialogDescription>
              Report for: <strong>{viewingDuty?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Status</p>
                <p className="font-medium">{viewingDuty?.status}</p>
              </div>
              <div>
                <p className="text-slate-500">Completed At</p>
                <p className="font-medium">
                  {viewingDuty?.completed_at 
                    ? new Date(viewingDuty.completed_at).toLocaleString()
                    : '-'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Report</Label>
              <div className="p-4 bg-slate-50 rounded-lg border min-h-[150px] whitespace-pre-wrap">
                {viewingDuty?.report_text || 'No report submitted'}
              </div>
            </div>

            {(() => {
              // Handle image parsing and display
              let images: string[] = [];
              const rawImages = viewingDuty?.report_images;
              
              if (Array.isArray(rawImages)) {
                  images = rawImages;
              } else if (typeof rawImages === 'string') {
                  try {
                      const parsed = JSON.parse(rawImages);
                      if (Array.isArray(parsed)) {
                          images = parsed;
                      } else {
                          // Try single string
                          if (rawImages.trim().length > 0) images = [rawImages];
                      }
                  } catch (e) {
                      // If fail, treat as single string image path if not empty
                      if (rawImages.trim().length > 0) {
                          images = [rawImages];
                      }
                  }
              }

              if (images.length === 0) return null;

              // Resolve image URLs
              const resolvedImages = images.map(img => {
                  if (typeof img !== 'string') return '';
                  if (img.startsWith('http')) return img;
                  // If not http, assume it's a relative path in duty-reports
                  return supabase.storage.from('duty-reports').getPublicUrl(img).data.publicUrl;
              }).filter(Boolean);

              return (
                  <div className="space-y-2">
                      <Label>Attached Photos</Label>
                      <div className="grid grid-cols-2 gap-4">
                          {resolvedImages.map((img, idx) => (
                              <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video group cursor-pointer" onClick={() => window.open(img, '_blank')}>
                                  <img 
                                      src={img} 
                                      alt={`Report attachment ${idx+1}`} 
                                      className="w-full h-full object-cover transition-transform hover:scale-105" 
                                  />
                              </div>
                          ))}
                      </div>
                  </div>
              );
            })()}

            {viewingDuty?.manager_feedback && (
              <div className="space-y-2">
                <Label>Manager Feedback</Label>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-slate-700">{viewingDuty.manager_feedback}</p>
                  {viewingDuty.rating && (
                    <div className="flex items-center gap-1 mt-2 text-amber-600">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span className="font-bold">{viewingDuty.rating}/5</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaretakerDuties;
