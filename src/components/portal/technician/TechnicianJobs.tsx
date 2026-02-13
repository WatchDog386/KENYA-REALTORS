import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { technicianService } from '@/services/technicianService';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Search, Filter, Wrench, Calendar, MapPin, Eye, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const TechnicianJobs = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<any[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchJobs();
    }, [user?.id]);

    useEffect(() => {
        let result = jobs;

        if (statusFilter !== 'all') {
            result = result.filter(j => j.status === statusFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(j => 
                j.title?.toLowerCase().includes(query) ||
                j.description?.toLowerCase().includes(query) ||
                j.property?.name?.toLowerCase().includes(query)
            );
        }

        setFilteredJobs(result);
    }, [jobs, searchQuery, statusFilter]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            if (!user?.id) return;
            
            const tech = await technicianService.getTechnicianByUserId(user.id);
            if (tech?.id) {
                const data = await technicianService.getTechnicianJobs(tech.id);
                setJobs(data);
                setFilteredJobs(data);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>;
            case 'in_progress': return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
            case 'pending': return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#154279] tracking-tight mb-2">My Jobs</h1>
                    <p className="text-slate-500 font-medium">Manage your assigned maintenance tasks.</p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm mb-8">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                            placeholder="Search jobs..."
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
                                <TableHead className="w-[300px] font-bold text-[#154279]">Job Details</TableHead>
                                <TableHead className="font-bold text-[#154279]">Location</TableHead>
                                <TableHead className="font-bold text-[#154279]">Status</TableHead>
                                <TableHead className="font-bold text-[#154279]">Assigned Date</TableHead>
                                <TableHead className="text-right font-bold text-[#154279]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-slate-300 border-t-[#154279] rounded-full animate-spin" />
                                            <p className="text-slate-500 text-sm">Loading jobs...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredJobs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Wrench className="w-8 h-8 text-slate-300" />
                                            <p className="text-slate-500 font-medium">No jobs found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredJobs.map((job) => (
                                    <TableRow key={job.id} className="group hover:bg-slate-50/50">
                                        <TableCell>
                                            <div>
                                                <div className="font-bold text-slate-800">{job.title}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-[250px]">{job.description}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <MapPin className="w-4 h-4 text-[#F96302]" />
                                                {job.property?.name || 'Unknown Property'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(job.status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {new Date(job.created_at).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                <Eye className="w-4 h-4 text-slate-500 hover:text-[#154279]" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

export default TechnicianJobs;
