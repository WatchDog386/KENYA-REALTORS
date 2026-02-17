import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { maintenanceService } from '@/services/maintenanceService';
import { caretakerService } from '@/services/caretakerService';
import { technicianService } from '@/services/technicianService';
import { TechnicianCategory } from '@/types/newRoles';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Filter, Wrench, Calendar, Eye, FileText, Loader2, Plus, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const CaretakerMaintenance = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    
    // Create Dialog Inputs
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [categories, setCategories] = useState<TechnicianCategory[]>([]);
    const [newRequest, setNewRequest] = useState({
        title: '',
        description: '',
        priority: 'medium',
        categoryId: '',
        image: null as File | null
    });

    useEffect(() => {
        fetchRequests();
        fetchCategories();
    }, [user?.id]);

    const fetchRequests = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const userCaretaker = await caretakerService.getCaretakerByUserId(user.id);
            if (!userCaretaker) {
                toast.error('Caretaker profile not found');
                return;
            }
            
            // Get requests submitted by this caretaker
            const requests = await maintenanceService.getCaretakerRequests(userCaretaker.id);
            setRequests(requests);
            setFilteredRequests(requests);
        } catch (error: any) {
            console.error('Error fetching requests:', error);
            // toast.error('Failed to load maintenance requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = requests;

        if (statusFilter !== 'all') {
            result = result.filter(r => r.status === statusFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.title?.toLowerCase().includes(query) ||
                r.description?.toLowerCase().includes(query) ||
                r.tenant?.first_name?.toLowerCase().includes(query) ||
                r.tenant?.last_name?.toLowerCase().includes(query)
            );
        }

        setFilteredRequests(result);
    }, [requests, searchQuery, statusFilter]);


    const fetchCategories = async () => {
        try {
            const data = await technicianService.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleCreateRequest = async () => {
        if (!newRequest.title.trim() || !newRequest.description.trim() || !newRequest.categoryId) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setCreating(true);
            const userCaretaker = await caretakerService.getCaretakerByUserId(user!.id);
            if (!userCaretaker || !userCaretaker.property_id) {
                toast.error('Caretaker profile or property assignment not found');
                return;
            }

            await maintenanceService.createCaretakerMaintenanceRequest(
                userCaretaker.id,
                userCaretaker.property_id,
                newRequest.title,
                newRequest.description,
                newRequest.priority as any,
                newRequest.categoryId,
                newRequest.image || undefined
            );

            toast.success('Maintenance request created successfully');
            setIsCreateOpen(false);
            setNewRequest({
                title: '',
                description: '',
                priority: 'medium',
                categoryId: '',
                image: null
            });
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error('Error creating request:', error);
            toast.error('Failed to create request');
        } finally {
            setCreating(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'low': return 'bg-slate-100 text-slate-800 border-slate-200';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>;
            case 'in_progress': return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
            case 'assigned': return <Badge className="bg-purple-500 hover:bg-purple-600">Assigned</Badge>;
            case 'pending': return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
            case 'open': return <Badge className="bg-sky-500 hover:bg-sky-600">Open</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleCreateReport = (request: any) => {
        // Placeholder for creating a maintenance report
        toast.info("Report creation feature coming soon");
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#154279] tracking-tight mb-2">Maintenance Management</h1>
                    <p className="text-slate-500 font-medium">Track and manage property repairs and requests.</p>
                </div>
                <Button 
                    className="bg-[#F96302] hover:bg-[#d35400] text-white font-bold shadow-lg shadow-orange-200"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Log New Issue
                </Button>
            </div>

            <Card className="border-slate-200 shadow-sm mb-8">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                            placeholder="Search requests..."
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
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[300px] font-bold text-[#154279]">Issue</TableHead>
                                <TableHead className="font-bold text-[#154279]">Location</TableHead>
                                <TableHead className="font-bold text-[#154279]">Priority</TableHead>
                                <TableHead className="font-bold text-[#154279]">Status</TableHead>
                                <TableHead className="font-bold text-[#154279]">Reported</TableHead>
                                <TableHead className="text-right font-bold text-[#154279]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-slate-300 border-t-[#154279] rounded-full animate-spin" />
                                            <p className="text-slate-500 text-sm">Loading requests...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Wrench className="w-8 h-8 text-slate-300" />
                                            <p className="text-slate-500 font-medium">No maintenance requests found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRequests.map((request) => (
                                    <TableRow key={request.id} className="group hover:bg-slate-50/50">
                                        <TableCell>
                                            <div>
                                                <div className="font-bold text-slate-800">{request.title}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-[250px]">{request.description}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {request.unit ? (
                                                    <span className="font-bold text-slate-700">Unit {request.unit.unit_number}</span>
                                                ) : (
                                                    <span className="text-slate-500 italic">Common Area</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wide border ${getPriorityColor(request.priority)}`}>
                                                {request.priority}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(request.status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setDetailsOpen(true);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 text-slate-500 hover:text-[#154279]" />
                                                </Button>
                                                {/* Add more actions here */}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Create Request Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Log Maintenance Issue</DialogTitle>
                        <DialogDescription>
                            Report a maintenance issue at the property.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Issue Summary (Title) *</Label>
                            <Input
                                id="title"
                                value={newRequest.title}
                                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                                placeholder="E.g. Broken light in hallway"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select 
                                value={newRequest.categoryId} 
                                onValueChange={(val) => setNewRequest({ ...newRequest, categoryId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select 
                                value={newRequest.priority} 
                                onValueChange={(val) => setNewRequest({ ...newRequest, priority: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low - Cosmetic/Minor</SelectItem>
                                    <SelectItem value="medium">Medium - Standard Repair</SelectItem>
                                    <SelectItem value="high">High - Functionality Impaired</SelectItem>
                                    <SelectItem value="emergency">Emergency - Safety Hazard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Detailed Description *</Label>
                            <Textarea
                                id="description"
                                value={newRequest.description}
                                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                                placeholder="Describe the location and nature of the problem..."
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image">Attach Photo (Optional)</Label>
                            <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 text-center hover:bg-slate-100 transition-colors relative cursor-pointer">
                                <Input 
                                    id="image" 
                                    type="file" 
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setNewRequest({ ...newRequest, image: e.target.files[0] });
                                        }
                                    }}
                                />
                                <div className="flex flex-col items-center justify-center gap-2 text-slate-500 pointer-events-none">
                                    {newRequest.image ? (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-emerald-500" />
                                            <span className="text-sm font-medium text-emerald-600 truncate max-w-[200px]">{newRequest.image.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 opacity-50" />
                                            <span className="text-xs">Click to upload photo</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateRequest} disabled={creating} className="bg-[#154279]">
                            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Request Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#154279] flex items-center gap-2">
                            <Wrench className="w-5 h-5" />
                            Maintenance Details
                        </DialogTitle>
                        <DialogDescription>
                            Review full details of the maintenance request
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-6 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Status</div>
                                    {getStatusBadge(selectedRequest.status)}
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Priority</div>
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wide border ${getPriorityColor(selectedRequest.priority)}`}>
                                        {selectedRequest.priority}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-900 mb-2">Description</h3>
                                <p className="text-slate-600 text-sm leading-relaxed bg-white p-4 border border-slate-200 rounded-lg">
                                    {selectedRequest.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2">Tenant Details</h3>
                                    <div className="text-sm text-slate-600">
                                        <p className="font-medium text-slate-900">
                                            {selectedRequest.tenant?.first_name} {selectedRequest.tenant?.last_name}
                                        </p>
                                        <p>{selectedRequest.tenant?.email}</p>
                                        <p>{selectedRequest.tenant?.phone}</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2">Location</h3>
                                    <div className="text-sm text-slate-600">
                                        <p className="font-medium text-slate-900">
                                            {selectedRequest.unit ? `Unit ${selectedRequest.unit.unit_number}` : 'Common Property Area'}
                                        </p>
                                        <p>{selectedRequest.property?.name}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedRequest.image_url && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2">Attached Image</h3>
                                    <img 
                                        src={selectedRequest.image_url} // Note: This needs proper Supabase storage URL handling usually
                                        alt="Maintenance Issue" 
                                        className="w-full h-48 object-cover rounded-lg border border-slate-200"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
                                <Button className="bg-[#154279] hover:bg-[#0f325e]" onClick={() => handleCreateReport(selectedRequest)}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Generate Report
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CaretakerMaintenance;
