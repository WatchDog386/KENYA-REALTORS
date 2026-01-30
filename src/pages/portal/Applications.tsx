// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle, Eye, Download } from "lucide-react";

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
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
        <p className="text-gray-600">Track and manage your rental applications</p>
      </div>

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
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
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
              <Button className="w-full" variant="default">
                Apply for New Property
              </Button>
              <Button className="w-full" variant="outline">
                View Available Properties
              </Button>
              <Button className="w-full" variant="outline">
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
  );
};

export default Applications;