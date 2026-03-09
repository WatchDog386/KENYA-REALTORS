// src/components/portal/manager/ManagerCaretakerDuties.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { caretakerService } from '@/services/caretakerService';
import { caretakerDutyService, CaretakerDuty, CreateDutyInput } from '@/services/caretakerDutyService';
import { useManager } from '@/hooks/useManager';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Loader2,
  Plus,
  ClipboardList,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  Search,
  Star,
  MoreVertical,
  Eye,
  MessageSquare,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Caretaker {
  id: string;
  user_id: string;
  property_id: string;
  status: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const DUTY_TYPES = [
  { value: 'general', label: 'General Task' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'security', label: 'Security' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'other', label: 'Other' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const ManagerCaretakerDuties = () => {
  const { user } = useAuth();
  const { getAssignedProperties } = useManager();
  
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [duties, setDuties] = useState<CaretakerDuty[]>([]);
  const [filteredDuties, setFilteredDuties] = useState<CaretakerDuty[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Create duty dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDuty, setNewDuty] = useState({
    caretaker_id: '',
    title: '',
    description: '',
    duty_type: 'general',
    priority: 'medium',
    due_date: ''
  });

  // Review dialog
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewingDuty, setReviewingDuty] = useState<CaretakerDuty | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // View details dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingDuty, setViewingDuty] = useState<CaretakerDuty | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchCaretakers();
      fetchDuties();
    }
  }, [selectedPropertyId]);

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
        (d.caretaker as any)?.profile?.first_name?.toLowerCase().includes(query) ||
        (d.caretaker as any)?.profile?.last_name?.toLowerCase().includes(query)
      );
    }

    setFilteredDuties(result);
  }, [duties, searchQuery, statusFilter]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await getAssignedProperties();
      setProperties(data || []);
      if (data && data.length > 0) {
        setSelectedPropertyId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchCaretakers = async () => {
    try {
      const data = await caretakerService.getCaretakersForProperty(selectedPropertyId);
      setCaretakers(data || []);
    } catch (error) {
      console.error('Error fetching caretakers:', error);
    }
  };

  const fetchDuties = async () => {
    try {
      const data = await caretakerDutyService.getPropertyDuties(selectedPropertyId);
      setDuties(data);
      setFilteredDuties(data);
    } catch (error) {
      console.error('Error fetching duties:', error);
      toast.error('Failed to load duties');
    }
  };

  const handleCreateDuty = async () => {
    if (!newDuty.caretaker_id || !newDuty.title.trim()) {
      toast.error('Please select a caretaker and enter a title');
      return;
    }

    try {
      setCreating(true);
      
      const input: CreateDutyInput = {
        caretaker_id: newDuty.caretaker_id,
        property_id: selectedPropertyId,
        title: newDuty.title,
        description: newDuty.description || undefined,
        duty_type: newDuty.duty_type,
        priority: newDuty.priority,
        due_date: newDuty.due_date || undefined
      };

      await caretakerDutyService.createDuty(input);
      toast.success('Duty assigned successfully!');
      
      setIsCreateDialogOpen(false);
      setNewDuty({
        caretaker_id: '',
        title: '',
        description: '',
        duty_type: 'general',
        priority: 'medium',
        due_date: ''
      });
      fetchDuties();
    } catch (error) {
      console.error('Error creating duty:', error);
      toast.error('Failed to assign duty');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelDuty = async (dutyId: string) => {
    if (!confirm('Are you sure you want to cancel this duty?')) return;

    try {
      await caretakerDutyService.cancelDuty(dutyId);
      toast.success('Duty cancelled');
      fetchDuties();
    } catch (error) {
      console.error('Error cancelling duty:', error);
      toast.error('Failed to cancel duty');
    }
  };

  const openReviewDialog = (duty: CaretakerDuty) => {
    console.log("Opening review dialog for duty:", duty);
    setReviewingDuty(duty);
    setReviewFeedback('');
    setReviewRating(5);
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewingDuty) return;

    try {
      setSubmittingReview(true);
      await caretakerDutyService.reviewDuty(
        reviewingDuty.id,
        reviewFeedback,
        reviewRating
      );
      toast.success('Review submitted!');
      setIsReviewDialogOpen(false);
      setReviewingDuty(null);
      fetchDuties();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const openViewDialog = (duty: CaretakerDuty) => {
    setViewingDuty(duty);
    setIsViewDialogOpen(true);
  };

  const getCaretakerName = (duty: CaretakerDuty) => {
    const caretaker = duty.caretaker as any;
    if (caretaker?.profile) {
      return `${caretaker.profile.first_name} ${caretaker.profile.last_name}`;
    }
    return 'Unknown';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge className="bg-red-500 hover:bg-red-600 text-white">Urgent</Badge>;
      case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">High</Badge>;
      case 'medium': return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Medium</Badge>;
      case 'low': return <Badge className="bg-slate-500 hover:bg-slate-600 text-white">Low</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00356B] to-[#00356B]/80 rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Caretaker Duties Management</h1>
            <p className="text-blue-100">Assign and track caretaker responsibilities</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger className="w-[220px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select Property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={caretakers.length === 0}
              className="bg-[#F96302] hover:bg-[#d85502] text-white font-bold"
            >
              <Plus className="w-4 h-4 mr-2" /> Assign Duty
            </Button>
          </div>
        </div>
      </div>

      {/* Caretakers Overview */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-[#00356B]" />
            Property Caretakers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {caretakers.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No caretakers assigned to this property</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {caretakers.map((caretaker) => (
                <div
                  key={caretaker.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00356B] flex items-center justify-center text-white font-bold">
                    {caretaker.profile?.first_name?.[0]}{caretaker.profile?.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {caretaker.profile?.first_name} {caretaker.profile?.last_name}
                    </p>
                    <p className="text-xs text-slate-500">{caretaker.profile?.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
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
            <ClipboardList className="w-5 h-5 text-[#00356B]" />
            Assigned Duties
          </CardTitle>
          <CardDescription>Track and manage caretaker tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDuties.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No duties found</p>
              <p className="text-sm">Click "Assign Duty" to create a new task</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caretaker</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Report</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDuties.map((duty) => (
                    <TableRow key={duty.id}>
                      <TableCell>
                        <span className="font-medium">{getCaretakerName(duty)}</span>
                      </TableCell>
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
                        {duty.report_submitted ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-0">Submitted</Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {duty.status === 'completed' && !duty.rating && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openReviewDialog(duty);
                              }}
                              className="h-8 text-[#00356B] border-[#00356B] hover:bg-[#00356B] hover:text-white"
                            >
                              Review
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openViewDialog(duty)}>
                                <Eye className="w-4 h-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              {duty.status === 'completed' && !duty.rating && (
                                <DropdownMenuItem onClick={() => openReviewDialog(duty)}>
                                  <MessageSquare className="w-4 h-4 mr-2" /> Review & Rate
                                </DropdownMenuItem>
                              )}
                              {(duty.status === 'pending' || duty.status === 'in_progress') && (
                                <DropdownMenuItem 
                                  onClick={() => handleCancelDuty(duty.id)}
                                  className="text-red-600"
                                >
                                  <X className="w-4 h-4 mr-2" /> Cancel
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Create Duty Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign New Duty</DialogTitle>
            <DialogDescription>
              Create a new task for a caretaker
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="caretaker">Caretaker *</Label>
              <Select
                value={newDuty.caretaker_id}
                onValueChange={(val) => setNewDuty({ ...newDuty, caretaker_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select caretaker" />
                </SelectTrigger>
                <SelectContent>
                  {caretakers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.profile?.first_name} {c.profile?.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                className="bg-white text-slate-900 border-slate-200"
                placeholder="Enter duty title"
                value={newDuty.title}
                onChange={(e) => setNewDuty({ ...newDuty, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                className="bg-white text-slate-900 border-slate-200"
                placeholder="Describe the task..."
                value={newDuty.description}
                onChange={(e) => setNewDuty({ ...newDuty, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duty_type">Type</Label>
                <Select
                  value={newDuty.duty_type}
                  onValueChange={(val) => setNewDuty({ ...newDuty, duty_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DUTY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newDuty.priority}
                  onValueChange={(val) => setNewDuty({ ...newDuty, priority: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date (Optional)</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={newDuty.due_date}
                onChange={(e) => setNewDuty({ ...newDuty, due_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDuty}
              disabled={creating || !newDuty.caretaker_id || !newDuty.title.trim()}
              className="bg-[#F96302] hover:bg-[#d85502]"
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Assign Duty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Duty</DialogTitle>
            <DialogDescription>
              Provide feedback for: <strong>{reviewingDuty?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {reviewingDuty?.report_text && (
              <div className="space-y-2">
                <Label>Caretaker's Report</Label>
                <div className="p-3 bg-slate-50 rounded-lg border text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {reviewingDuty.report_text}
                </div>
              </div>
            )}

            {(() => {
              // Parse images if they come as a JSON string (sometimes happens with Supabase array columns)
              let images: string[] = [];
              if (Array.isArray(reviewingDuty?.report_images)) {
                images = reviewingDuty.report_images;
              } else if (typeof reviewingDuty?.report_images === 'string') {
                try {
                  images = JSON.parse(reviewingDuty.report_images);
                  if (!Array.isArray(images)) images = [];
                } catch (e) {
                  images = [];
                }
              }

              if (images.length === 0) return null;

              // Resolve image URLs
              const resolvedImages = images.map(img => {
                if (img.startsWith('http')) return img;
                // If not http, assume it's a relative path in duty-reports
                return supabase.storage.from('duty-reports').getPublicUrl(img).data.publicUrl;
              });

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

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${star <= reviewRating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-slate-600 font-medium">{reviewRating}/5</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Provide feedback for the caretaker..."
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="bg-[#00356B] hover:bg-[#00254B]"
            >
              {submittingReview ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Duty Details</DialogTitle>
            <DialogDescription>
              {viewingDuty?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 font-medium">Caretaker</p>
                <p className="font-semibold">{viewingDuty ? getCaretakerName(viewingDuty) : '-'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Status</p>
                <p>{viewingDuty?.status}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Type</p>
                <p className="capitalize">{viewingDuty?.duty_type}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Priority</p>
                <p className="capitalize">{viewingDuty?.priority}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Due Date</p>
                <p>{viewingDuty?.due_date ? new Date(viewingDuty.due_date).toLocaleString() : 'Not set'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Created</p>
                <p>{viewingDuty?.created_at ? new Date(viewingDuty.created_at).toLocaleString() : '-'}</p>
              </div>
            </div>

            {viewingDuty?.description && (
              <div className="space-y-2">
                <Label>Description</Label>
                <div className="p-3 bg-slate-50 rounded-lg border text-sm">
                  {viewingDuty.description}
                </div>
              </div>
            )}

            {viewingDuty?.report_text && (
              <div className="space-y-2">
                <Label>Caretaker Report</Label>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm whitespace-pre-wrap">
                  {viewingDuty.report_text}
                </div>
              </div>
            )}

            {(() => {
              // Parse images if they come as a JSON string (sometimes happens with Supabase array columns)
              let images: string[] = [];
              if (Array.isArray(viewingDuty?.report_images)) {
                images = viewingDuty.report_images;
              } else if (typeof viewingDuty?.report_images === 'string') {
                try {
                  images = JSON.parse(viewingDuty.report_images);
                  if (!Array.isArray(images)) images = [];
                } catch (e) {
                  images = [];
                }
              }

              if (images.length === 0) return null;

              // Resolve image URLs
              const resolvedImages = images.map(img => {
                if (img.startsWith('http')) return img;
                return supabase.storage.from('duty-reports').getPublicUrl(img).data.publicUrl;
              });

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
                <Label>Your Feedback</Label>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm">{viewingDuty.manager_feedback}</p>
                  {viewingDuty.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-amber-700">{viewingDuty.rating}/5</span>
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

export default ManagerCaretakerDuties;
