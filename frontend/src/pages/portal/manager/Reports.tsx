import React from 'react';
import { FileText, Download, BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ManagerReports = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#00356B] to-[#00356B]/80 rounded-xl shadow-lg p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Reports</h1>
            <p className="text-blue-100 text-sm mt-1">Generate and view operational reports</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="monthly">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Summary
            </CardTitle>
            <CardDescription>Key metrics for your properties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Monthly Revenue</p>
                    <p className="text-sm text-gray-500">From all properties</p>
                  </div>
                </div>
                <span className="text-xl font-bold">KSh 450,000</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Occupancy Rate</p>
                    <p className="text-sm text-gray-500">Average across properties</p>
                  </div>
                </div>
                <span className="text-xl font-bold">85.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Quick Reports
            </CardTitle>
            <CardDescription>Generate specific reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Rent Collection Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Maintenance Summary
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Tenant Directory
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Financial Statement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerReports;