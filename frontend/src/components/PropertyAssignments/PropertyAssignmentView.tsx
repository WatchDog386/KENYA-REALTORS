import React, { useState, useEffect } from 'react';
import { Users, Building, Wrench, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PropertyAssignmentViewProps {
  propertyId: string;
}

interface ProprietorAssignment {
  id: string;
  proprietor_id: string;
  ownership_percentage: number;
  proprietor?: {
    business_name?: string;
    profile?: {
      first_name?: string;
      last_name?: string;
      email?: string;
    };
  };
}

interface TechnicianAssignment {
  id: string;
  technician_id: string;
  technician?: {
    category?: {
      name: string;
    };
    profile?: {
      first_name?: string;
      last_name?: string;
      email?: string;
    };
  };
}

interface CaretakerInfo {
  id: string;
  user_id: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export const PropertyAssignmentView: React.FC<PropertyAssignmentViewProps> = ({
  propertyId
}) => {
  const [proprietors, setProprietors] = useState<ProprietorAssignment[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianAssignment[]>([]);
  const [caretaker, setCaretaker] = useState<CaretakerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, [propertyId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);

      // Load proprietors
      const { data: proprietorData } = await supabase
        .from('proprietor_properties')
        .select(`
          id,
          proprietor_id,
          ownership_percentage,
          proprietors(
            business_name,
            profiles:user_id(first_name, last_name, email)
          )
        `)
        .eq('property_id', propertyId)
        .eq('is_active', true);

      setProprietors(proprietorData || []);

      // Load technicians
      const { data: technicianData } = await supabase
        .from('technician_property_assignments')
        .select(`
          id,
          technician_id,
          technicians(
            category_id,
            profiles:user_id(first_name, last_name, email),
            technician_categories:category_id(id, name)
          )
        `)
        .eq('property_id', propertyId)
        .eq('is_active', true);

      // Map technician data
      const mappedTechs = (technicianData || []).map(t => ({
        ...t,
        technician: {
          ...t.technician,
          category: t.technician?.technician_categories,
          profile: t.technician?.profiles
        }
      }));

      setTechnicians(mappedTechs);

      // Load caretaker
      const { data: caretakerData } = await supabase
        .from('caretakers')
        .select(`
          id,
          user_id,
          profiles:user_id(first_name, last_name, email)
        `)
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .single();

      if (caretakerData) {
        setCaretaker({
          ...caretakerData,
          profile: caretakerData.profiles
        });
      }
    } catch (error: any) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProprietorName = (assignment: ProprietorAssignment) => {
    const profile = assignment.proprietor?.profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return assignment.proprietor?.business_name || 'Unknown';
  };

  const getTechnicianName = (assignment: TechnicianAssignment) => {
    const profile = assignment.technician?.profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return 'Unknown';
  };

  const getCaretakerName = () => {
    if (!caretaker?.profile) return 'Unknown';
    const { first_name, last_name } = caretaker.profile;
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const hasAssignments = proprietors.length > 0 || technicians.length > 0 || caretaker;

  if (!hasAssignments) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No staff assigned to this property yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4" />
          Property Staff Assignments
        </CardTitle>
        <CardDescription className="text-xs">All staff members assigned to this property</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="proprietors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="proprietors" className="text-xs">
              Proprietors ({proprietors.length})
            </TabsTrigger>
            <TabsTrigger value="technicians" className="text-xs">
              Technicians ({technicians.length})
            </TabsTrigger>
            <TabsTrigger value="caretaker" className="text-xs">
              Caretaker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proprietors" className="mt-4 space-y-2">
            {proprietors.length > 0 ? (
              proprietors.map(proprietor => (
                <div
                  key={proprietor.id}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getProprietorName(proprietor)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Ownership: {proprietor.ownership_percentage}%
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Proprietor
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No proprietors assigned</p>
            )}
          </TabsContent>

          <TabsContent value="technicians" className="mt-4 space-y-2">
            {technicians.length > 0 ? (
              technicians.map(technician => (
                <div
                  key={technician.id}
                  className="flex items-center justify-between p-3 bg-purple-50 border border-purple-100 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getTechnicianName(technician)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {technician.technician?.category?.name || 'N/A'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Wrench className="w-3 h-3 mr-1" />
                    Technician
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No technicians assigned</p>
            )}
          </TabsContent>

          <TabsContent value="caretaker" className="mt-4">
            {caretaker ? (
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {getCaretakerName()}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {caretaker.profile?.email || 'N/A'}
                </p>
                <Badge className="mt-3 text-xs bg-green-600">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Assigned
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No caretaker assigned</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
