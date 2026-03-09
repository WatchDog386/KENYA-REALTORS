import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, Download, Search, Filter, Upload } from 'lucide-react';

const ProprietorDocuments = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const documents = [
        { id: 1, name: 'Management Agreement 2024', type: 'Contract', date: '2024-01-15', size: '2.4 MB' },
        { id: 2, name: 'February 2024 Financial Report', type: 'Financial', date: '2024-02-01', size: '1.1 MB' },
        { id: 3, name: 'Property Insurance Policy', type: 'Insurance', date: '2023-11-20', size: '4.5 MB' },
        { id: 4, name: 'Tax Documents 2023', type: 'Tax', date: '2024-01-10', size: '3.2 MB' },
    ];

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#154279]">Documents</h1>
                    <p className="text-slate-500">Access your contracts, reports, and other important files</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button className="bg-[#154279] hover:bg-[#0f325e]">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-[#154279]">File Repository</CardTitle>
                        <div className="flex items-center gap-2">
                             <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input 
                                    placeholder="Search documents..." 
                                    className="pl-9 h-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" className="h-9">
                                <Filter className="w-4 h-4 mr-2" />
                                Filter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {documents.map((doc) => (
                            <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800 group-hover:text-[#154279] transition-colors">
                                            {doc.name}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded-full font-medium">{doc.type}</span>
                                            <span>{doc.date}</span>
                                            <span>{doc.size}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-[#154279]">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProprietorDocuments;
