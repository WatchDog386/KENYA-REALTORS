import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { maintenanceService } from '@/services/maintenanceService';
import { caretakerService } from '@/services/caretakerService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Search, Filter, Wrench, Calendar, Eye, FileText } from 'lucide-react';
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

    useEffect(() => {
        fetchRequests();
    }, [user?.id]);

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

    const fetchRequests = async () => {
        try {
            setLoading(true);
            if (!user?.id) return;

            const caretaker = await caretakerService.getCaretakerByUserId(user.id);
            if (!caretaker?.property_id) {
                toast.error("No property assigned");
                return;
            }

            const data = await maintenanceService.getPropertyMaintenanceRequests(caretaker.property_id);
            setRequests(data);
            setFilteredRequests(data);
        } catch (error) {
            console.error('Error fetching maintenance requests:', error);
            toast.error('Failed to load maintenance requests');
        } finally {
            setLoading(false);
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
                <Button className="bg-[#F96302] hover:bg-[#d35400] text-white font-bold shadow-lg shadow-orange-200">
                    <Wrench className="w-4 h-4 mr-2" />
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
