import React from 'react';
import { Calendar, Home, User, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ManagerVacationNotices = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vacation Notices</h1>
          <p className="text-gray-600">Manage tenant vacation and absence reports</p>
        </div>
        <Button>New Notice</Button>
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