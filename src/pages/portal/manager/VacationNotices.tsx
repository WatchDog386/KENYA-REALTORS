import React from 'react';
import { Calendar, Home, User, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ManagerVacationNotices = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#D85C2C] to-[#D85C2C]/80 rounded-xl shadow-lg p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Vacation Notices</h1>
            <p className="text-orange-100 text-sm mt-1">Manage tenant vacation and absence reports</p>
          </div>
        </div>
        <Button className="bg-white text-[#D85C2C] hover:bg-gray-100">New Notice</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Vacations</CardTitle>
          <CardDescription>Tenants who will be away from their units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vacation notices</h3>
            <p className="text-gray-500 mb-6">
              When tenants submit vacation notices, they will appear here
            </p>
            <Button>Send Vacation Notice Request</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerVacationNotices;