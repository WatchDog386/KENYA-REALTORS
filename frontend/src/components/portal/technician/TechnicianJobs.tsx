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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Wrench, Calendar, MapPin, ClipboardList, FileText, CheckCircle2, XCircle, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type CompletionMaterialLine = {
    item: string;
    quantity: string;
    unitPrice: string;
};

const TechnicianJobs = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<any[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
    const [technicianId, setTechnicianId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [vacancyInspections, setVacancyInspections] = useState<any[]>([]);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [selectedInspection, setSelectedInspection] = useState<any>(null);
    const [reportText, setReportText] = useState('');
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [procurementDialogOpen, setProcurementDialogOpen] = useState(false);
    const [selectedJobForProcurement, setSelectedJobForProcurement] = useState<any>(null);
    const [damageReport, setDamageReport] = useState('');
    const [requiredTools, setRequiredTools] = useState('');
    const [requiredMaterials, setRequiredMaterials] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [supplierEmail, setSupplierEmail] = useState('');
    const [supplierPhone, setSupplierPhone] = useState('');
    const [estimatedCost, setEstimatedCost] = useState('');
    const [proprietorReport, setProprietorReport] = useState('');
    const [procurementSubmitting, setProcurementSubmitting] = useState(false);
    const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
    const [selectedJobForCompletion, setSelectedJobForCompletion] = useState<any>(null);
    const [completionNotes, setCompletionNotes] = useState('');
    const [hoursSpent, setHoursSpent] = useState('');
    const [completionCost, setCompletionCost] = useState('');
    const [beforePhoto, setBeforePhoto] = useState<File | null>(null);
    const [progressPhoto, setProgressPhoto] = useState<File | null>(null);
    const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
    const [completionMaterials, setCompletionMaterials] = useState<CompletionMaterialLine[]>([
        { item: '', quantity: '', unitPrice: '' }
    ]);
    const [completionSubmitting, setCompletionSubmitting] = useState(false);

    const addCompletionMaterialRow = () => {
        setCompletionMaterials((prev) => [...prev, { item: '', quantity: '', unitPrice: '' }]);
    };

    const removeCompletionMaterialRow = (index: number) => {
        setCompletionMaterials((prev) => {
            if (prev.length === 1) {
                return [{ item: '', quantity: '', unitPrice: '' }];
            }
            return prev.filter((_, rowIndex) => rowIndex !== index);
        });
    };

    const updateCompletionMaterialRow = (
        index: number,
        field: keyof CompletionMaterialLine,
        value: string
    ) => {
        setCompletionMaterials((prev) => prev.map((row, rowIndex) => (
            rowIndex === index ? { ...row, [field]: value } : row
        )));
    };

    const uploadMaintenancePhoto = async (
        propertyId: string,
        requestId: string,
        phase: 'before' | 'progress' | 'after',
        file: File
    ): Promise<string> => {
        const extension = file.name.split('.').pop() || 'jpg';
        const filePath = `${propertyId}/${requestId}-${phase}-${Date.now()}.${extension}`;
        const { data, error } = await supabase.storage
            .from('maintenance-images')
            .upload(filePath, file, { upsert: false });

        if (error) throw error;

        const { data: publicData } = supabase.storage
            .from('maintenance-images')
            .getPublicUrl(data.path);

        return publicData?.publicUrl || data.path;
    };

    const notifyMaintenanceStakeholders = async (
        job: any,
        title: string,
        message: string,
        includeTenant: boolean = true
    ) => {
        if (!user?.id || !job?.property_id) return;

        const recipientIds = new Set<string>();

        if (includeTenant && job.tenant_id) {
            recipientIds.add(job.tenant_id);
        }

        const [{ data: managers }, { data: accountants }, { data: superAdmins }] = await Promise.all([
            supabase
                .from('property_manager_assignments')
                .select('property_manager_id')
                .eq('property_id', job.property_id)
                .eq('status', 'active'),
            supabase
                .from('profiles')
                .select('id')
                .eq('role', 'accountant'),
            supabase
                .from('profiles')
                .select('id')
                .eq('role', 'super_admin')
        ]);

        (managers || []).forEach((row: any) => row.property_manager_id && recipientIds.add(row.property_manager_id));
        (accountants || []).forEach((row: any) => row.id && recipientIds.add(row.id));
        (superAdmins || []).forEach((row: any) => row.id && recipientIds.add(row.id));

        recipientIds.delete(user.id);

        if (recipientIds.size === 0) return;

        const notifications = Array.from(recipientIds).map((recipientId) => ({
            recipient_id: recipientId,
            sender_id: user.id,
            type: 'maintenance',
            title,
            message,
            related_entity_type: 'maintenance_request',
            related_entity_id: job.id,
            read: false,
        }));

        await supabase.from('notifications').insert(notifications);
    };

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
                setTechnicianId(tech.id);
                const data = await technicianService.getTechnicianJobs(tech.id);
                setJobs(data);
                setFilteredJobs(data);
                await fetchVacancyInspections(tech.id);
            } else {
                setTechnicianId(null);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    const fetchVacancyInspections = async (technicianId: string) => {
        try {
            const { data: assignmentRows, error: assignmentError } = await supabase
                .from('technician_property_assignments')
                .select('property_id')
                .eq('technician_id', technicianId)
                .eq('is_active', true);

            if (assignmentError) throw assignmentError;

            const propertyIds = (assignmentRows || [])
                .map((row: any) => row.property_id)
                .filter(Boolean);

            if (propertyIds.length === 0) {
                setVacancyInspections([]);
                return;
            }

            const { data: notices, error: noticesError } = await supabase
                .from('vacancy_notices')
                .select(`
                    id,
                    property_id,
                    unit_id,
                    move_out_date,
                    status,
                    inspection_date,
                    reason,
                    created_at,
                    properties(name),
                    units(unit_number)
                `)
                .in('property_id', propertyIds)
                .eq('status', 'inspection_scheduled')
                .order('inspection_date', { ascending: true });

            if (noticesError) throw noticesError;

            setVacancyInspections(notices || []);
        } catch (error) {
            console.error('Error fetching vacancy inspections:', error);
            toast.error('Could not load vacancy inspections');
        }
    };

    const submitInspectionReport = async () => {
        if (!user?.id || !selectedInspection || !reportText.trim()) return;

        try {
            setReportSubmitting(true);

            const reportBody = `TECHNICIAN INSPECTION REPORT\n\n${reportText.trim()}`;

            const { error: msgError } = await supabase
                .from('vacancy_notice_messages')
                .insert({
                    vacancy_notice_id: selectedInspection.id,
                    sender_id: user.id,
                    message: reportBody,
                });

            if (msgError) throw msgError;

            await supabase
                .from('vacancy_notices')
                .update({
                    manager_response: reportBody,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', selectedInspection.id);

            const recipientIds = new Set<string>();

            const { data: managerRows } = await supabase
                .from('property_manager_assignments')
                .select('property_manager_id')
                .eq('property_id', selectedInspection.property_id)
                .eq('status', 'active');
            (managerRows || []).forEach((row: any) => {
                if (row.property_manager_id) recipientIds.add(row.property_manager_id);
            });

            const { data: proprietorRows } = await supabase
                .from('proprietor_properties')
                .select('proprietor_id')
                .eq('property_id', selectedInspection.property_id)
                .eq('is_active', true);
            (proprietorRows || []).forEach((row: any) => {
                if (row.proprietor_id) recipientIds.add(row.proprietor_id);
            });

            const { data: superAdmins } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'super_admin');
            (superAdmins || []).forEach((row: any) => {
                if (row.id) recipientIds.add(row.id);
            });

            recipientIds.delete(user.id);

            if (recipientIds.size > 0) {
                const notifications = Array.from(recipientIds).map((recipientId) => ({
                    recipient_id: recipientId,
                    sender_id: user.id,
                    type: 'vacancy_update',
                    title: 'Vacant Unit Inspection Report Submitted',
                    message: `Technician submitted damages and required tools/materials report for unit ${selectedInspection.units?.unit_number || ''}.`,
                    related_entity_type: 'vacancy_notice',
                    related_entity_id: selectedInspection.id,
                    read: false,
                }));

                await supabase.from('notifications').insert(notifications);
            }

            toast.success('Inspection report sent to manager, proprietor, and super admin');
            setReportText('');
            setReportDialogOpen(false);

            const tech = await technicianService.getTechnicianByUserId(user.id);
            if (tech?.id) {
                await fetchVacancyInspections(tech.id);
            }
        } catch (error: any) {
            console.error('Error submitting inspection report:', error);
            toast.error(error?.message || 'Failed to submit inspection report');
        } finally {
            setReportSubmitting(false);
        }
    };

    const submitProcurementOrder = async () => {
        if (!user?.id || !selectedJobForProcurement) return;
        if (!damageReport.trim() || !requiredMaterials.trim() || !supplierName.trim() || !estimatedCost) {
            toast.error('Please complete damage report, materials, supplier and estimated cost');
            return;
        }

        try {
            setProcurementSubmitting(true);

            const technician = await technicianService.getTechnicianByUserId(user.id);
            if (!technician?.id) {
                toast.error('Technician profile not found');
                return;
            }

            const lpoNumber = `LPO-${Date.now()}`;
            const invoiceNumber = `INV-MNT-${Date.now()}`;
            const estimate = Number(estimatedCost || 0);

            const { data: report, error: reportError } = await supabase
                .from('maintenance_completion_reports')
                .insert({
                    maintenance_request_id: selectedJobForProcurement.id,
                    technician_id: technician.id,
                    property_id: selectedJobForProcurement.property_id,
                    notes: damageReport.trim(),
                    tools_required: requiredTools.trim() || null,
                    materials_used: requiredMaterials.trim(),
                    supplier_name: supplierName.trim(),
                    supplier_email: supplierEmail.trim() || null,
                    supplier_phone: supplierPhone.trim() || null,
                    lpo_number: lpoNumber,
                    invoice_number: invoiceNumber,
                    cost_estimate: estimate,
                    proprietor_report: proprietorReport.trim() || damageReport.trim(),
                    status: 'submitted',
                    submitted_at: new Date().toISOString(),
                    supplier_notified_at: new Date().toISOString(),
                })
                .select('id')
                .single();

            if (reportError) throw reportError;

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);

            const { error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    reference_number: invoiceNumber,
                    property_id: selectedJobForProcurement.property_id,
                    tenant_id: selectedJobForProcurement.tenant_id || null,
                    amount: estimate,
                    due_date: dueDate.toISOString().split('T')[0],
                    issued_date: new Date().toISOString().split('T')[0],
                    status: 'unpaid',
                    items: {
                        type: 'maintenance_procurement',
                        lpo_number: lpoNumber,
                        supplier_name: supplierName.trim(),
                        supplier_email: supplierEmail.trim() || null,
                        supplier_phone: supplierPhone.trim() || null,
                        materials: requiredMaterials.trim(),
                        tools: requiredTools.trim() || null,
                        maintenance_request_id: selectedJobForProcurement.id,
                        maintenance_report_id: report.id,
                    },
                    notes: `LPO:${lpoNumber};MAINTENANCE_REQUEST_ID:${selectedJobForProcurement.id};SUPPLIER:${supplierName.trim()};SUPPLIER_EMAIL:${supplierEmail.trim() || ''};REPORT_ID:${report.id}`,
                });

            if (invoiceError) throw invoiceError;

            const recipientIds = new Set<string>();

            // Route to supplier users that match nominated supplier email.
            if (supplierEmail.trim()) {
                const { data: supplierProfiles } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('role', 'supplier')
                    .ilike('email', supplierEmail.trim());

                (supplierProfiles || []).forEach((row: any) => row.id && recipientIds.add(row.id));
            }

            const { data: accountants } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'accountant');
            (accountants || []).forEach((row: any) => row.id && recipientIds.add(row.id));

            const { data: managers } = await supabase
                .from('property_manager_assignments')
                .select('property_manager_id')
                .eq('property_id', selectedJobForProcurement.property_id)
                .eq('status', 'active');
            (managers || []).forEach((row: any) => row.property_manager_id && recipientIds.add(row.property_manager_id));

            const { data: proprietors } = await supabase
                .from('proprietor_properties')
                .select('proprietor_id')
                .eq('property_id', selectedJobForProcurement.property_id)
                .eq('is_active', true);
            (proprietors || []).forEach((row: any) => row.proprietor_id && recipientIds.add(row.proprietor_id));

            const { data: superAdmins } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'super_admin');
            (superAdmins || []).forEach((row: any) => row.id && recipientIds.add(row.id));

            recipientIds.delete(user.id);

            if (recipientIds.size > 0) {
                const notifications = Array.from(recipientIds).map((recipientId) => ({
                    recipient_id: recipientId,
                    sender_id: user.id,
                    type: 'maintenance',
                    title: 'New Maintenance LPO/Invoice Submitted',
                    message: `${lpoNumber} created for ${selectedJobForProcurement.title}. Supplier: ${supplierName.trim()}. Awaiting accountant approval/payment tracking.`,
                    related_entity_type: 'maintenance_request',
                    related_entity_id: selectedJobForProcurement.id,
                    read: false,
                }));
                await supabase.from('notifications').insert(notifications);
            }

            toast.success('LPO/Invoice submitted to accounting and shared for reporting');
            setProcurementDialogOpen(false);
            setSelectedJobForProcurement(null);
            setDamageReport('');
            setRequiredTools('');
            setRequiredMaterials('');
            setSupplierName('');
            setSupplierEmail('');
            setSupplierPhone('');
            setEstimatedCost('');
            setProprietorReport('');
        } catch (error: any) {
            console.error('Error submitting procurement order:', error);
            toast.error(error?.message || 'Failed to submit LPO/Invoice');
        } finally {
            setProcurementSubmitting(false);
        }
    };

    const handleAcceptJob = async (job: any) => {
        if (!technicianId || !user?.id) {
            toast.error('Technician profile not found');
            return;
        }

        try {
            const { error } = await supabase
                .from('maintenance_requests')
                .update({
                    assigned_to_technician_id: technicianId,
                    technician_id: technicianId,
                    status: 'in_progress',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', job.id);

            if (error) throw error;

            await supabase.from('technician_job_updates').insert({
                maintenance_request_id: job.id,
                technician_id: technicianId,
                status: 'accepted',
                notes: 'Technician accepted this maintenance request and started work',
                update_type: 'status_change',
                created_by: user.id,
            });

            await notifyMaintenanceStakeholders(
                job,
                'Maintenance request accepted',
                `Technician accepted request "${job.title}" and work is now in progress.`,
                true
            );

            toast.success('Job accepted and moved to in progress. Tenant and manager have been notified.');
            await fetchJobs();
        } catch (error: any) {
            console.error('Error accepting job:', error);
            toast.error(error?.message || 'Failed to accept job');
        }
    };

    const handleRejectJob = async (job: any) => {
        if (!technicianId || !user?.id) {
            toast.error('Technician profile not found');
            return;
        }

        try {
            const { error } = await supabase
                .from('maintenance_requests')
                .update({
                    assigned_to_technician_id: null,
                    technician_id: null,
                    status: 'pending',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', job.id)
                .eq('assigned_to_technician_id', technicianId);

            if (error) throw error;

            await supabase.from('technician_job_updates').insert({
                maintenance_request_id: job.id,
                technician_id: technicianId,
                status: 'rejected',
                notes: 'Technician rejected this assignment; request returned to queue',
                update_type: 'status_change',
                created_by: user.id,
            });

            await notifyMaintenanceStakeholders(
                job,
                'Maintenance request rejected',
                `Technician rejected request "${job.title}". It has been returned to the maintenance queue.`,
                true
            );

            toast.success('Job rejected and returned to queue.');
            await fetchJobs();
        } catch (error: any) {
            console.error('Error rejecting job:', error);
            toast.error(error?.message || 'Failed to reject job');
        }
    };

    const handleStartJob = async (job: any) => {
        if (!technicianId || !user?.id) {
            toast.error('Technician profile not found');
            return;
        }

        try {
            const { error } = await supabase
                .from('maintenance_requests')
                .update({
                    assigned_to_technician_id: technicianId,
                    technician_id: technicianId,
                    status: 'in_progress',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', job.id);

            if (error) throw error;

            await supabase.from('technician_job_updates').insert({
                maintenance_request_id: job.id,
                technician_id: technicianId,
                status: 'in_progress',
                notes: 'Technician started repair work',
                update_type: 'status_change',
                created_by: user.id,
            });

            await notifyMaintenanceStakeholders(
                job,
                'Maintenance work started',
                `Repair work for "${job.title}" is now in progress.`,
                true
            );

            toast.success('Job moved to in progress.');
            await fetchJobs();
        } catch (error: any) {
            console.error('Error starting job:', error);
            toast.error(error?.message || 'Failed to start job');
        }
    };

    const submitCompletionEvidence = async () => {
        if (!user?.id || !technicianId || !selectedJobForCompletion) return;
        if (!beforePhoto || !progressPhoto || !afterPhoto) {
            toast.error('Before, in-progress, and after photos are required.');
            return;
        }

        const normalizedMaterials = completionMaterials
            .map((line) => ({
                item: line.item.trim(),
                quantity: Number(line.quantity),
                unitPrice: Number(line.unitPrice),
            }))
            .filter((line) => line.item && line.quantity > 0 && line.unitPrice > 0);

        if (normalizedMaterials.length === 0) {
            toast.error('Please add at least one material with quantity and unit price.');
            return;
        }

        try {
            setCompletionSubmitting(true);

            const [beforeUrl, progressUrl, afterUrl] = await Promise.all([
                uploadMaintenancePhoto(selectedJobForCompletion.property_id, selectedJobForCompletion.id, 'before', beforePhoto),
                uploadMaintenancePhoto(selectedJobForCompletion.property_id, selectedJobForCompletion.id, 'progress', progressPhoto),
                uploadMaintenancePhoto(selectedJobForCompletion.property_id, selectedJobForCompletion.id, 'after', afterPhoto),
            ]);

            const materialsTotal = normalizedMaterials.reduce(
                (sum, line) => sum + (line.quantity * line.unitPrice),
                0
            );
            const resolvedCost = completionCost ? Number(completionCost) : materialsTotal;
            const materialsSummary = normalizedMaterials
                .map((line, index) => {
                    const lineTotal = line.quantity * line.unitPrice;
                    return `${index + 1}. ${line.item} | Qty: ${line.quantity} | Unit: KES ${line.unitPrice.toFixed(2)} | Total: KES ${lineTotal.toFixed(2)}`;
                })
                .join('\n');

            const { data: report, error: reportError } = await supabase
                .from('maintenance_completion_reports')
                .insert({
                    maintenance_request_id: selectedJobForCompletion.id,
                    technician_id: technicianId,
                    property_id: selectedJobForCompletion.property_id,
                    notes: completionNotes.trim() || null,
                    hours_spent: hoursSpent ? Number(hoursSpent) : null,
                    materials_used: materialsSummary,
                    cost_estimate: resolvedCost,
                    actual_cost: resolvedCost,
                    before_work_image_url: beforeUrl,
                    in_progress_image_url: progressUrl,
                    after_repair_image_url: afterUrl,
                    status: 'submitted',
                    submitted_at: new Date().toISOString(),
                })
                .select('id')
                .single();

            if (reportError) throw reportError;

            const { error: updateError } = await supabase
                .from('maintenance_requests')
                .update({
                    assigned_to_technician_id: technicianId,
                    technician_id: technicianId,
                    status: 'completed',
                    completion_status: 'submitted',
                    completion_report_id: report.id,
                    work_start_photo: beforeUrl,
                    work_progress_photos: [progressUrl],
                    work_completion_photo: afterUrl,
                    actual_cost: resolvedCost,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', selectedJobForCompletion.id);

            if (updateError) throw updateError;

            await supabase.from('technician_job_updates').insert({
                maintenance_request_id: selectedJobForCompletion.id,
                technician_id: technicianId,
                status: 'completed',
                notes: `Repair completed with before, progress, and after evidence plus ${normalizedMaterials.length} material line item(s)`,
                update_type: 'status_change',
                created_by: user.id,
            });

            await notifyMaintenanceStakeholders(
                selectedJobForCompletion,
                'Maintenance completed with evidence',
                `Request "${selectedJobForCompletion.title}" has been completed. Photos, materials, and cost report are now available.`,
                true
            );

            toast.success('Completion evidence submitted and shared with tenant, manager, accountant, and super admin.');
            setCompletionDialogOpen(false);
            setSelectedJobForCompletion(null);
            setCompletionNotes('');
            setHoursSpent('');
            setCompletionCost('');
            setBeforePhoto(null);
            setProgressPhoto(null);
            setAfterPhoto(null);
            setCompletionMaterials([{ item: '', quantity: '', unitPrice: '' }]);
            await fetchJobs();
        } catch (error: any) {
            console.error('Error submitting completion evidence:', error);
            toast.error(error?.message || 'Failed to submit completion evidence');
        } finally {
            setCompletionSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>;
            case 'in_progress': return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
            case 'assigned': return <Badge className="bg-indigo-500 hover:bg-indigo-600">Assigned</Badge>;
            case 'pending': return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
            case 'cancelled': return <Badge className="bg-slate-500 hover:bg-slate-600">Cancelled</Badge>;
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
                                <SelectItem value="assigned">Assigned</SelectItem>
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
                                            <div className="flex flex-wrap justify-end gap-2">
                                                {job.status === 'pending' && (!job.assigned_to_technician_id || job.assigned_to_technician_id === technicianId) && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 text-xs bg-[#154279] hover:bg-[#10335f]"
                                                        onClick={() => handleAcceptJob(job)}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
                                                    </Button>
                                                )}

                                                {job.status === 'pending' && job.assigned_to_technician_id === technicianId && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-50"
                                                        onClick={() => handleRejectJob(job)}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" /> Reject
                                                    </Button>
                                                )}

                                                {(job.status === 'assigned' || (job.status === 'pending' && job.assigned_to_technician_id === technicianId)) && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs"
                                                        onClick={() => handleStartJob(job)}
                                                    >
                                                        <PlayCircle className="w-4 h-4 mr-1" /> Start
                                                    </Button>
                                                )}

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs"
                                                    disabled={!['assigned', 'in_progress'].includes(job.status)}
                                                    onClick={() => {
                                                        setSelectedJobForProcurement(job);
                                                        setDamageReport(job.description || '');
                                                        setRequiredTools('');
                                                        setRequiredMaterials('');
                                                        setSupplierName('');
                                                        setSupplierEmail('');
                                                        setSupplierPhone('');
                                                        setEstimatedCost('');
                                                        setProprietorReport('');
                                                        setProcurementDialogOpen(true);
                                                    }}
                                                >
                                                    <ClipboardList className="w-4 h-4 mr-1" /> LPO / Invoice
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                                                    disabled={!['assigned', 'in_progress'].includes(job.status)}
                                                    onClick={() => {
                                                        setSelectedJobForCompletion(job);
                                                        setCompletionNotes('');
                                                        setHoursSpent('');
                                                        setCompletionCost('');
                                                        setBeforePhoto(null);
                                                        setProgressPhoto(null);
                                                        setAfterPhoto(null);
                                                        setCompletionMaterials([{ item: '', quantity: '', unitPrice: '' }]);
                                                        setCompletionDialogOpen(true);
                                                    }}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-1" /> Complete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Card className="border-slate-200 shadow-sm">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[#154279] tracking-tight">Vacancy Inspections (24hrs)</h2>
                        <p className="text-slate-500 text-sm">Inspect vacated units and report damages plus required tools/materials.</p>
                    </div>
                    <Badge className="bg-[#F96302] hover:bg-[#F96302] text-white">{vacancyInspections.length} due</Badge>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold text-[#154279]">Property / Unit</TableHead>
                                <TableHead className="font-bold text-[#154279]">Move-out Date</TableHead>
                                <TableHead className="font-bold text-[#154279]">Inspection Time</TableHead>
                                <TableHead className="font-bold text-[#154279]">Reason</TableHead>
                                <TableHead className="text-right font-bold text-[#154279]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vacancyInspections.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                                        No vacancy inspection assigned right now.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                vacancyInspections.map((inspection) => (
                                    <TableRow key={inspection.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="font-semibold text-slate-800">{inspection.properties?.name || 'Unknown Property'}</div>
                                            <div className="text-xs text-slate-500">Unit {inspection.units?.unit_number || '-'}</div>
                                        </TableCell>
                                        <TableCell>{new Date(inspection.move_out_date).toLocaleDateString()}</TableCell>
                                        <TableCell>{inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleString() : '-'}</TableCell>
                                        <TableCell className="max-w-[280px] truncate" title={inspection.reason || ''}>{inspection.reason || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedInspection(inspection);
                                                    setReportText('');
                                                    setReportDialogOpen(true);
                                                }}
                                            >
                                                Submit Report
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Inspection Report</DialogTitle>
                        <DialogDescription>
                            Include all observed damages and the tools/materials/items required for repair.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Textarea
                            rows={10}
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            placeholder="Example:\n- Damages found:\n- Repair work needed:\n- Tools required:\n- Materials/items required:\n- Urgency notes:"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReportDialogOpen(false)} disabled={reportSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={submitInspectionReport} disabled={reportSubmitting || !reportText.trim()}>
                            {reportSubmitting ? 'Submitting...' : 'Send Report'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={procurementDialogOpen} onOpenChange={setProcurementDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create Repair LPO / Invoice</DialogTitle>
                        <DialogDescription>
                            Report damages, required tools/materials, and supplier so accounting can approve and pay in-system.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input value={damageReport} onChange={(e) => setDamageReport(e.target.value)} placeholder="Damage summary" />
                        <Textarea rows={3} value={requiredTools} onChange={(e) => setRequiredTools(e.target.value)} placeholder="Tools required" />
                        <Textarea rows={3} value={requiredMaterials} onChange={(e) => setRequiredMaterials(e.target.value)} placeholder="Materials / items required" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Nominated supplier name" />
                            <Input value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} placeholder="Supplier email" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} placeholder="Supplier phone" />
                            <Input type="number" min="0" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} placeholder="Estimated cost" />
                        </div>
                        <Textarea rows={4} value={proprietorReport} onChange={(e) => setProprietorReport(e.target.value)} placeholder="Summary report for proprietor" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setProcurementDialogOpen(false)} disabled={procurementSubmitting}>Cancel</Button>
                        <Button onClick={submitProcurementOrder} disabled={procurementSubmitting}>
                            <FileText className="w-4 h-4 mr-1" /> {procurementSubmitting ? 'Submitting...' : 'Submit LPO/Invoice'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={completionDialogOpen} onOpenChange={setCompletionDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Submit Completion Evidence</DialogTitle>
                        <DialogDescription>
                            Upload before, in-progress, and after repair photos. This is shared with tenant, manager, accountant, and super admin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Textarea
                            rows={4}
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            placeholder="Completion notes and work summary"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input
                                type="number"
                                min="0"
                                value={hoursSpent}
                                onChange={(e) => setHoursSpent(e.target.value)}
                                placeholder="Hours spent"
                            />
                            <Input
                                type="number"
                                min="0"
                                value={completionCost}
                                onChange={(e) => setCompletionCost(e.target.value)}
                                placeholder="Final cost"
                            />
                        </div>
                        <div className="space-y-2 rounded-md border border-slate-200 p-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700">Materials used (item, quantity, unit price) *</label>
                                <Button type="button" size="sm" variant="outline" onClick={addCompletionMaterialRow}>
                                    <Plus className="w-4 h-4 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {completionMaterials.map((line, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-2 items-center">
                                        <Input
                                            value={line.item}
                                            onChange={(e) => updateCompletionMaterialRow(index, 'item', e.target.value)}
                                            placeholder="Material name"
                                        />
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={line.quantity}
                                            onChange={(e) => updateCompletionMaterialRow(index, 'quantity', e.target.value)}
                                            placeholder="Qty"
                                        />
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={line.unitPrice}
                                            onChange={(e) => updateCompletionMaterialRow(index, 'unitPrice', e.target.value)}
                                            placeholder="Unit price"
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => removeCompletionMaterialRow(index)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2 rounded-md border border-slate-200 p-3">
                            <label className="text-sm font-medium text-slate-700">Before repair photo *</label>
                            <Input type="file" accept="image/*" onChange={(e) => setBeforePhoto(e.target.files?.[0] || null)} />
                        </div>
                        <div className="space-y-2 rounded-md border border-slate-200 p-3">
                            <label className="text-sm font-medium text-slate-700">In-progress repair photo *</label>
                            <Input type="file" accept="image/*" onChange={(e) => setProgressPhoto(e.target.files?.[0] || null)} />
                        </div>
                        <div className="space-y-2 rounded-md border border-slate-200 p-3">
                            <label className="text-sm font-medium text-slate-700">After repair photo *</label>
                            <Input type="file" accept="image/*" onChange={(e) => setAfterPhoto(e.target.files?.[0] || null)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCompletionDialogOpen(false)} disabled={completionSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={submitCompletionEvidence} disabled={completionSubmitting}>
                            {completionSubmitting ? 'Submitting...' : 'Submit Completion'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TechnicianJobs;
