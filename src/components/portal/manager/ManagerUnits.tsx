import React, { useState, useEffect } from 'react';
import { Building, Search, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Unit {
  id: string;
  unit_number: string;
  property_id: string;
  unit_type_id: string;
  floor_number?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  status: string;
  monthly_rent?: number;
  unit_type?: any;
  property?: any;
}

const ManagerUnits = () => {
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyId, setPropertyId] = useState<string>('');

  useEffect(() => {
    loadUnits();
  }, [user?.id]);

  const loadUnits = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      // Get manager's assigned property
      const { data: assignments, error: assignError } = await supabase
        .from('property_manager_assignments')
        .select('property_id')
        .eq('property_manager_id', user.id)
        .single();

      if (assignError || !assignments) {
        toast.error('No property assigned to you');
        return;
      }

      setPropertyId(assignments.property_id);

      // Fetch units for this property
      const { data, error } = await supabase
        .from('property_unit_types')
        .select(`
          *,
          unit_type:property_unit_types(*)
        `)
        .eq('property_id', assignments.property_id)
        .order('unit_number', { ascending: true });

      if (error) throw error;
      setUnits(data || []);
    } catch (err) {
      console.error('Error loading units:', err);
      toast.error('Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = units.filter(unit =>
    unit.unit_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'occupied':
        return 'bg-green-100 text-green-800';
      case 'vacant':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-slate-900">Units</h1>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus size={16} className="mr-2" />
              Add Unit
            </Button>
          </div>
          <p className="text-slate-600">Manage all units in your property</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            placeholder="Search units by number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<Search size={16} className="text-slate-400" />}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Building className="w-16 h-16 mx-auto mb-4 opacity-30 text-slate-400" />
            <p className="text-slate-600 text-lg">No units found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUnits.map(unit => (
              <div key={unit.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Unit {unit.unit_number}</h3>
                    {unit.floor_number && (
                      <p className="text-sm text-slate-600">Floor {unit.floor_number}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(unit.status)}`}>
                    {unit.status || 'Vacant'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  {unit.bedrooms !== null && unit.bedrooms !== undefined && (
                    <p><span className="font-semibold">Bedrooms:</span> {unit.bedrooms}</p>
                  )}
                  {unit.bathrooms !== null && unit.bathrooms !== undefined && (
                    <p><span className="font-semibold">Bathrooms:</span> {unit.bathrooms}</p>
                  )}
                  {unit.square_footage && (
                    <p><span className="font-semibold">Sq. Ft:</span> {unit.square_footage.toLocaleString()}</p>
                  )}
                  {unit.monthly_rent && (
                    <p><span className="font-semibold">Rent:</span> ${unit.monthly_rent.toLocaleString()}</p>
                  )}
                </div>

                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && units.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-sm text-slate-600 mb-2">Total Units</p>
              <p className="text-3xl font-bold text-slate-900">{units.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-sm text-slate-600 mb-2">Occupied</p>
              <p className="text-3xl font-bold text-green-600">{units.filter(u => u.status === 'occupied').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-sm text-slate-600 mb-2">Vacant</p>
              <p className="text-3xl font-bold text-yellow-600">{units.filter(u => u.status === 'vacant').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-sm text-slate-600 mb-2">Maintenance</p>
              <p className="text-3xl font-bold text-red-600">{units.filter(u => u.status === 'maintenance').length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerUnits;
