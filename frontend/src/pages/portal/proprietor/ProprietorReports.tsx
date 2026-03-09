import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { proprietorService } from '@/services/proprietorService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Filter, Building2, Calendar, Loader2, DollarSign, TrendingUp, Users, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from '@/utils/formatCurrency';
import { toast } from 'sonner';

interface Report {
    id: string;
    proprietor_id: string;
    property_id: string;
    report_type: string;
    title: string;
    description?: string;
    data?: Record<string, any>;
    status: string;
    created_at: string;
    sent_at?: string;
}

const ProprietorReports = () => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<string>("");
    const [reports, setReports] = useState<Report[]>([]);
    const [filteredReports, setFilteredReports] = useState<Report[]>([]);
    const [proprietorId, setProprietorId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [proprietorName, setProprietorName] = useState<string>("");

    useEffect(() => {
        loadData();
    }, [user?.id]);

    useEffect(() => {
        // Filter reports when selected property changes
        if (selectedProperty && reports.length > 0) {
            const filtered = reports.filter(r => r.property_id === selectedProperty);
            setFilteredReports(filtered);
        }
    }, [selectedProperty, reports]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (!user?.id) {
                toast.error('User not authenticated');
                return;
            }

            // Get proprietor profile
            const prop = await proprietorService.getProprietorByUserId(user.id);
            if (!prop?.id) {
                toast.error('No proprietor profile found');
                return;
            }

            // Set proprietor name
            const profile = prop.profile;
            if (profile) {
                const name = profile.first_name && profile.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile.first_name || 'Proprietor';
                setProprietorName(name);
            }

            setProprietorId(prop.id);

            // Load properties
            const props = await proprietorService.getProprietorProperties(prop.id);
            setProperties(props);
            if (props.length > 0) {
                setSelectedProperty(props[0].property_id);
            }

            // Load all reports for this proprietor
            const allReports = await proprietorService.getProprietorReports(prop.id);
            setReports(allReports);

            if (allReports.length === 0) {
                toast.info('No reports found for your properties');
            }

        } catch (error: any) {
            console.error('Error loading data:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = (report: Report) => {
        try {
            const jsonString = JSON.stringify(report, null, 2);
            const element = document.createElement("a");
            element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(jsonString));
            element.setAttribute("download", `${report.title}-${new Date().toISOString().slice(0, 10)}.json`);
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            toast.success('Report downloaded');
        } catch (error) {
            console.error(error);
            toast.error('Failed to download report');
        }
    };

    const handleApproveReport = async (reportId: string) => {
        try {
            await proprietorService.approveAndSendReport(reportId);
            toast.success('Report approved and sent');
            await loadData();
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to approve report');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#154279]" />
                    <p className="text-slate-600 text-sm font-medium">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 w-full space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Performance Reports</h1>
                    <p className="text-slate-500 text-sm md:text-base">Reports for <span className="font-semibold text-[#154279]">{proprietorName}</span> - View detailed property performance</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                        <SelectTrigger className="w-full sm:w-[220px] bg-white">
                            <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="Select Property" />
                        </SelectTrigger>
                        <SelectContent>
                            {properties.map(p => (
                                <SelectItem key={p.property_id} value={p.property_id}>
                                    {p.property?.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button 
                        onClick={loadData} 
                        variant="outline"
                        className="flex items-center gap-2 whitespace-nowrap"
                    >
                        <Loader2 className="w-4 h-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Reports List */}
            {properties.length === 0 ? (
                <Card className="border-slate-200 bg-white">
                    <CardContent className="p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No Properties Found</h3>
                        <p className="text-slate-500">You don't have any properties assigned to generate reports.</p>
                    </CardContent>
                </Card>
            ) : filteredReports.length === 0 ? (
                <Card className="border-slate-200 bg-white">
                    <CardContent className="p-12 text-center">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No Reports Yet</h3>
                        <p className="text-slate-500">No reports have been generated for the selected property. Reports will appear here once they're available.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    <div className="text-sm font-medium text-slate-600">
                        Showing <span className="font-bold text-slate-900">{filteredReports.length}</span> report(s) for selected property
                    </div>

                    {filteredReports.map((report) => (
                        <Card key={report.id} className="border-slate-200 bg-white hover:shadow-md transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    {/* Report Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{report.title}</h3>
                                                {report.description && (
                                                    <p className="text-sm text-slate-600 mt-1">{report.description}</p>
                                                )}
                                            </div>
                                            <Badge variant={
                                                report.status === 'sent' ? 'default' :
                                                report.status === 'approved' ? 'secondary' :
                                                'outline'
                                            } className="capitalize whitespace-nowrap ml-2">
                                                {report.status}
                                            </Badge>
                                        </div>

                                        {/* Report metadata */}
                                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium mt-3">
                                            <div className="flex items-center gap-1">
                                                <FileText className="w-3 h-3" />
                                                Type: <span className="font-semibold text-slate-700">{report.report_type}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Created: <span className="font-semibold text-slate-700">{new Date(report.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {report.sent_at && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Sent: <span className="font-semibold text-slate-700">{new Date(report.sent_at).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Report Data Summary */}
                                        {report.data && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <p className="text-xs font-bold text-slate-600 uppercase mb-2">Summary Data</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {Object.entries(report.data).slice(0, 4).map(([key, value]) => (
                                                        <div key={key} className="p-2 bg-slate-50 rounded">
                                                            <p className="text-[10px] text-slate-500 uppercase font-semibold">{key}</p>
                                                            <p className="font-bold text-slate-900 text-sm">
                                                                {typeof value === 'number' && value > 999 
                                                                    ? `${(value / 1000).toFixed(1)}k`
                                                                    : String(value)
                                                                }
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 justify-start">
                                        <Button
                                            onClick={() => handleDownloadReport(report)}
                                            variant="outline"
                                            className="flex items-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </Button>
                                        {report.status === 'draft' && (
                                            <Button
                                                onClick={() => handleApproveReport(report.id)}
                                                className="bg-[#154279] hover:bg-[#0f325e] text-white flex items-center gap-2"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Approve
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProprietorReports;