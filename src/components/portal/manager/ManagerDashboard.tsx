// src/components/portal/manager/ManagerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building, Users, DollarSign, TrendingUp } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  location: string;
  total_units?: number;
}

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignedProperty, setAssignedProperty] = useState<Property | null>(null);
  const [stats, setStats] = useState({
    units: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadManagerData();
  }, [user?.id]);

  const loadManagerData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      let propertyId = id;

      // If no ID in URL, get the first assigned property
      if (!propertyId) {
        const { data: assignment, error: assignmentError } = await supabase
          .from('property_manager_assignments')
          .select('property_id')
          .eq('property_manager_id', user.id)
          .single();

        if (assignmentError && assignmentError.code !== 'PGRST116') {
          throw assignmentError;
        }

        if (assignment) {
          propertyId = assignment.property_id;
        }
      }

      if (!propertyId) {
        toast.info('No property assigned or selected');
        setLoading(false);
        return;
      }

      // Get property details
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id, name, location')
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;
      setAssignedProperty(property);

      // Get property units from units table for accurate stats
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('id, status')
        .eq('property_id', propertyId);

      if (unitsError) throw unitsError;

      const totalUnits = units?.length || 0;
      const occupiedUnits = units?.filter(u => u.status?.toLowerCase() === 'occupied').length || 0;
      const vacantUnits = units?.filter(u => u.status?.toLowerCase() === 'vacant').length || 0;

      setStats({
        units: totalUnits,
        occupiedUnits,
        vacantUnits,
        totalRevenue: 0 // Calculate from payments if needed
      });
    } catch (error) {
      console.error('Error loading manager data:', error);
      toast.error('Failed to load property data');
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

  if (!assignedProperty) {
    return (
      <div className="p-8">
        <Card className="bg-amber-50 border-2 border-amber-200">
          <CardHeader>
            <CardTitle>No Property Assigned</CardTitle>
            <CardDescription>
              You haven't been assigned to manage any properties yet. Please contact your super admin.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
        <p className="text-gray-600">Manage your assigned property</p>
      </div>

      {/* Property Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-6 w-6 text-blue-600" />
                {assignedProperty.name}
              </CardTitle>
              <CardDescription className="mt-2">{assignedProperty.location}</CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-800">Assigned</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Total Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.units}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Occupied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.occupiedUnits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Vacant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.vacantUnits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.units > 0 ? Math.round((stats.occupiedUnits / stats.units) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/portal/manager/properties/units')}>
            <Building className="mr-2 h-4 w-4" />
            Manage Units
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/portal/manager/tenants')}>
            <Users className="mr-2 h-4 w-4" />
            View All Tenants
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/portal/manager/maintenance')}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Maintenance Requests
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/portal/manager/payments')}>
            <DollarSign className="mr-2 h-4 w-4" />
            Payment Records
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDashboard;
