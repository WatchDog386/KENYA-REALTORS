import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { caretakerService } from '@/services/caretakerService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  MapPin, 
  Users, 
  Home, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign,
  Loader2,
  AlertCircle,
  User,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';

interface PropertyDetails {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  location?: string;
  type?: string;
  total_units?: number;
  occupied_units?: number;
  monthly_rent?: number;
  status?: string;
  created_at?: string;
  manager?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

interface CaretakerData {
  id: string;
  hire_date?: string;
  assignment_date?: string;
  status: string;
  performance_rating?: number;
  property_id?: string;
}

const CaretakerProperty = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [caretaker, setCaretaker] = useState<CaretakerData | null>(null);
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [unitStats, setUnitStats] = useState({ total: 0, occupied: 0, vacant: 0, maintenance: 0 });

  useEffect(() => {
    if (user?.id) {
      fetchCaretakerProperty();
    }
  }, [user?.id]);

  const fetchCaretakerProperty = async () => {
    try {
      setLoading(true);
      
      // Get caretaker profile with property
      const caretakerData = await caretakerService.getCaretakerByUserId(user!.id);
      
      if (!caretakerData) {
        setLoading(false);
        return;
      }

      setCaretaker(caretakerData);

      if (!caretakerData.property_id) {
        setLoading(false);
        return;
      }

      // Fetch property data
      let propertyInfo = caretakerData.property;
      if (!propertyInfo) {
        // Fallback: Fetch property details directly
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', caretakerData.property_id)
          .single();

        if (!propertyError && propertyData) {
          propertyInfo = propertyData;
        } else {
          console.error('Property fetch error:', propertyError);
          propertyInfo = { id: caretakerData.property_id, name: 'Property' } as any;
        }
      }

      // Fetch the ACTUAL property manager from property_manager_assignments (not the person who assigned the caretaker)
      let actualManager = null;
      try {
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('property_manager_assignments')
          .select('property_manager_id')
          .eq('property_id', caretakerData.property_id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (!assignmentError && assignmentData?.property_manager_id) {
          // Fetch the manager's profile separately
          const { data: managerProfile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone')
            .eq('id', assignmentData.property_manager_id)
            .single();
          
          actualManager = managerProfile;
        }
      } catch (e) {
        console.warn('Could not fetch property manager assignment:', e);
      }

      setProperty({
        ...propertyInfo,
        manager: actualManager
      });

      // Fetch unit statistics
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('id, status')
        .eq('property_id', caretakerData.property_id);

      if (!unitsError && units) {
        const stats = {
          total: units.length,
          occupied: units.filter(u => u.status === 'occupied').length,
          vacant: units.filter(u => u.status === 'vacant' || u.status === 'available').length,
          maintenance: units.filter(u => u.status === 'maintenance').length
        };
        setUnitStats(stats);
      }

    } catch (error) {
      console.error('Error fetching caretaker property:', error);
      toast.error('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#154279]" />
      </div>
    );
  }

  if (!caretaker) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-amber-700 mb-2">Caretaker Assignment Pending</h2>
          <p className="text-amber-600 mb-4">
            Your account is set up as a caretaker, but you haven't been assigned to a property yet.
          </p>
          <div className="bg-white rounded-lg p-4 text-left text-sm text-slate-600 space-y-2">
            <p className="font-semibold text-slate-700">What to do:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Contact your property manager or administrator</li>
              <li>Ask them to assign you to a property via the <strong>Property Assignment</strong> page</li>
              <li>Once assigned, refresh this page to see your property details</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#154279] mb-4">My Property</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <Building className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-amber-700 mb-2">No Property Assigned</h2>
          <p className="text-amber-600">You have not been assigned to any property yet. Please contact your property manager.</p>
        </div>
      </div>
    );
  }

  const occupancyRate = unitStats.total > 0 
    ? Math.round((unitStats.occupied / unitStats.total) * 100) 
    : 0;

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#154279] tracking-tight mb-2">My Property</h1>
        <p className="text-slate-500 font-medium">View details about the property you're assigned to.</p>
      </div>

      {/* Property Hero Card */}
      <Card className="mb-8 overflow-hidden border-slate-200 shadow-lg">
        <div className="bg-gradient-to-r from-[#154279] to-[#0f325e] p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <Badge className="bg-white/20 text-white border-0 mb-4">{property.type || 'Residential'}</Badge>
              <h2 className="text-3xl font-bold mb-2">{property.name}</h2>
              <div className="flex items-center gap-2 text-blue-100">
                <MapPin className="w-4 h-4" />
                <span>{property.address || property.location || 'Address not specified'}</span>
                {property.city && <span>• {property.city}</span>}
                {property.state && <span>, {property.state}</span>}
              </div>
            </div>
            <div className="text-right">
              <Badge className={`${property.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'} border-0`}>
                {property.status || 'Active'}
              </Badge>
              {caretaker.assignment_date && (
                <p className="text-blue-100 text-sm mt-2">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Assigned: {new Date(caretaker.assignment_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Units</p>
                <p className="text-2xl font-bold text-slate-900">{unitStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Occupied</p>
                <p className="text-2xl font-bold text-slate-900">{unitStats.occupied}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Building className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Vacant</p>
                <p className="text-2xl font-bold text-slate-900">{unitStats.vacant}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Occupancy Rate</p>
                <p className="text-2xl font-bold text-slate-900">{occupancyRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Manager Info */}
      {property.manager && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#154279]" />
              Property Manager
            </CardTitle>
            <CardDescription>Your direct supervisor for this property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-[#154279] flex items-center justify-center text-white text-xl font-bold">
                {property.manager.first_name?.[0]}{property.manager.last_name?.[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {property.manager.first_name} {property.manager.last_name}
                </h3>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {property.manager.email}
                  </span>
                  {property.manager.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {property.manager.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CaretakerProperty;
