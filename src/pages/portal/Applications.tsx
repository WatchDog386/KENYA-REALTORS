// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroBackground } from "@/components/ui/HeroBackground";
import { FileText, Clock, CheckCircle, XCircle, Eye, Download, Plus, Search } from "lucide-react";

const Applications = () => {
  // Mock data for applications
  const applications = [
    {
      id: 1,
      property: "Modern Apartment - Westlands",
      date: "2024-03-15",
      status: "approved",
      amount: "45,000",
      documents: ["ID Copy", "Pay Slip", "Reference Letter"],
      nextStep: "Sign lease agreement"
    },
    {
      id: 2,
      property: "Studio Unit - Kilimani",
      date: "2024-03-10",
      status: "pending",
      amount: "32,000",
      documents: ["ID Copy", "Pay Slip"],
      nextStep: "Submit additional references"
    },
    {
      id: 3,
      property: "2 Bedroom - Lavington",
      date: "2024-03-05",
      status: "rejected",
      amount: "68,000",
      documents: ["ID Copy", "Bank Statement"],
      nextStep: "Apply for different property"
    },
    {
      id: 4,
      property: "Penthouse - Karen",
      date: "2024-03-01",
      status: "under_review",
      amount: "120,000",
      documents: ["ID Copy", "Pay Slip", "Bank Statement", "Reference Letter"],
      nextStep: "Wait for approval"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen antialiased text-slate-900 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Nunito', sans-serif; }
      `}</style>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] overflow-hidden py-10 shadow-lg mb-8 relative">
        <HeroBackground />
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between gap-10"
          >
            <div className="md:w-1/2">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/30">
                  Tenant Portal
                </span>
                <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">
                  Applications
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                My <span className="text-[#F96302]">Applications</span>
              </h1>
              
              <p className="text-sm text-blue-100 leading-relaxed mb-8 max-w-lg font-medium">
                Track and manage your rental applications, view status updates, and submit documents.
              </p>
              
              <div className="flex items-center gap-4">
                <button
                  className="group flex items-center gap-2 bg-[#F96302] text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#e05802] transition-all duration-300 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  New Application
                </button>
              </div>
            </div>
            
             <div className="md:w-1/2 w-full mt-6 md:mt-0 flex justify-end">
               <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white max-w-xs w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-blue-100 uppercase tracking-wider">Total Active</div>
                      <div className="text-xl font-bold">{applications.length} Applications</div>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#F96302] w-[40%]"></div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {applications.map((app) => (
            <Card key={app.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{app.property}</CardTitle>
                    <CardDescription>
                      Applied on {app.date} • Monthly Rent: Ksh {app.amount}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(app.status)} capitalize`}>
                    {getStatusIcon(app.status)} {app.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Documents Submitted:</h4>
                    <div className="flex flex-wrap gap-2">
                      {app.documents.map((doc, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {doc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Next Step:</p>
                      <p className="font-medium">{app.nextStep}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl border-none mb-1">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl border-none mb-1">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Applications</span>
                <span className="font-bold text-lg">4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Approved</span>
                <Badge className="bg-green-100 text-green-800">1</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <Badge className="bg-yellow-100 text-yellow-800">2</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rejected</span>
                <Badge className="bg-red-100 text-red-800">1</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-[#154279] hover:bg-[#0f325e] text-white font-bold rounded-xl" variant="default">
                Apply for New Property
              </Button>
              <Button className="w-full bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl border-none" variant="outline">
                View Available Properties
              </Button>
              <Button className="w-full bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl border-none" variant="outline">
                Download All Documents
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>• Complete all required documents to speed up approval</p>
              <p>• Follow up with landlords after 3 business days</p>
              <p>• Keep your contact information updated</p>
              <p>• Review lease agreements carefully before signing</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Applications;