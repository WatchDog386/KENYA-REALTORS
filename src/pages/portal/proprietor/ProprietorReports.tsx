import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { proprietorService } from '@/services/proprietorService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProprietorReports = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, [user?.id]);

    const loadReports = async () => {
        try {
            if (!user?.id) return;
            const prop = await proprietorService.getProprietorByUserId(user.id);
            if (prop?.id) {
                const data = await proprietorService.getProprietorReports(prop.id);
                setReports(data);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8 w-full space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
                    <p className="text-slate-500">Financial and property performance reports</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filter Reports
                </Button>
            </div>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    {reports.length === 0 ? (
                        <div className="p-24 text-center">
                            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No reports available</h3>
                            <p className="text-slate-500 mt-1">Check back later for monthly updates.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {reports.map((report) => (
                                <div key={report.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg mb-1">{report.title}</h4>
                                            <p className="text-slate-500">{report.description}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {report.report_type}
                                                </Badge>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(report.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={
                                            report.status === 'sent' ? 'default' : 
                                            report.status === 'draft' ? 'secondary' : 'outline'
                                        } className="capitalize">
                                            {report.status}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
                                            <Download className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ProprietorReports;