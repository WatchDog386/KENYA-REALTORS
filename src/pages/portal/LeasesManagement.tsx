import React from 'react';
import { FileText, Plus, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Calendar, Home } from 'lucide-react';
import { HeroBackground } from '@/components/ui/HeroBackground';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const LeasesManagement: React.FC = () => {
  // Mock data preserved from original component but enhanced
  const leases = [
    { tenant: "John Doe", property: "Sunset Villa", start: "2024-01-01", end: "2024-12-31", rent: "$2,500", status: "Active" },
    { tenant: "Jane Smith", property: "Urban Loft", start: "2023-06-01", end: "2024-05-31", rent: "$3,200", status: "Expiring Soon" },
    { tenant: "Bob Johnson", property: "Garden Apartment", start: "2024-03-01", end: "2025-02-28", rent: "$1,800", status: "Active" }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <section className="relative overflow-hidden bg-gradient-to-r from-[#154279] to-[#0f325e] text-white py-12 px-6 shadow-xl mb-8 lg:rounded-b-3xl">
        <HeroBackground />
        <div className="relative z-10 max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight">Leases Management</h1>
              <p className="text-lg text-blue-100 max-w-2xl font-light">
                Track active leases, renewals, and tenant agreements.
              </p>
            </div>
            
            <Button
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-semibold"
            >
              <Plus className="mr-2 h-5 w-5" /> 
              Create New Lease
            </Button>
          </div>
        </div>
      </section>
      
      <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">
        
        {/* Metric Cards - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Active Leases</p>
                        <h3 className="text-3xl font-black text-[#154279] mt-2">8</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" /> +2% from last month
                </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Expiring Soon</p>
                        <h3 className="text-3xl font-black text-[#154279] mt-2">2</h3>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-xl">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                </div>
                 <div className="mt-4 text-xs font-medium text-slate-400">
                    Requires action within 30 days
                </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Overdue Payments</p>
                        <h3 className="text-3xl font-black text-[#154279] mt-2">1</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                </div>
                 <div className="mt-4 text-xs font-medium text-red-600">
                    Total outstanding: $1,200
                </div>
            </CardContent>
          </Card>
        </div>


        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-4">
             <h3 className="text-lg font-bold text-[#154279] flex items-center gap-2">
                <FileText className="h-5 w-5" /> Recent Agreements
             </h3>
             <div className="flex gap-2">
                 {/* Placeholder for filters */}
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-left">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rent</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leases.map((lease, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-700">{lease.tenant}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-2 text-slate-600">
                            <Home className="h-4 w-4 text-slate-400" />
                            {lease.property}
                         </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-slate-600 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {lease.start} - {lease.end}
                         </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-[#154279]">
                        {lease.rent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        lease.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                        lease.status === 'Expiring Soon' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {lease.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-[#154279]">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeasesManagement;