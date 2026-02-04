// src/components/portal/manager/ManagerMaintenance.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Wrench, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MaintenanceRequest {
  id: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  tenant_name?: string;
}

const ManagerMaintenance: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);

  useEffect(() => {
    loadMaintenanceRequests();
  }, [user?.id]);

  const loadMaintenanceRequests = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get property assigned to manager
      const { data: assignment, error: assignmentError } = await supabase
        .from('property_manager_assignments')
        .select('property_id')
        .eq('property_manager_id', user.id)
        .single();

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        throw assignmentError;
      }

      if (!assignment) {
        setRequests([]);
        return;
      }

      // For now, just set empty - maintenance_requests table may not exist
      setRequests([]);
    } catch (error) {
      console.error('Error loading maintenance requests:', error);
      // Don't show error toast - table may not exist yet
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Wrench className="h-8 w-8" />
          Maintenance Requests
        </h1>
        <p className="text-gray-600">Manage maintenance requests for your property</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests ({requests.length})</CardTitle>
          <CardDescription>All maintenance requests in your property</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py=8">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No maintenance requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.description}</TableCell>
                      <TableCell>
                        <Badge>{request.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.priority === 'high' ? 'destructive' : 'secondary'}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.tenant_name || '-'}</TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerMaintenance;
