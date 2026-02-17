import React, { useState, useEffect } from 'react';
import { Users, Building, Wrench, UserCheck, Loader2, Trash2, Plus, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeroBackground } from '@/components/ui/HeroBackground';

interface ProprietorAssignment {
  id: string;
  proprietor_id: string;
  property_id: string;
  ownership_percentage: number;
  assigned_at: string;
  proprietor?: {
    business_name?: string;
    profile?: {
      first_name?: string;
      last_name?: string;
    };
  };
  property?: {
    name: string;
  };
}

interface TechnicianAssignment {
  id: string;
  technician_id: string;
  property_id: string;
  assigned_at: string;
  technician?: {
    category?: {
      name: string;
    };
    profile?: {
      first_name?: string;
      last_name?: string;
    };
  };
  property?: {
    name: string;
  };
}

interface CaretakerAssignment {
  id: string;
  user_id: string;
  property_id: string;
  assignment_date: string;
  profile?: {
    first_name?: string;
    last_name?: string;
  };
  property?: {
    name: string;
  };
}

export const PropertyAssignmentAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('proprietors');
  const [proprietors, setProprietors] = useState<ProprietorAssignment[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianAssignment[]>([]);
  const [caretakers, setCaretakers] = useState<CaretakerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAllAssignments();
  }, []);

  const loadAllAssignments = async () => {
    try {
      setLoading(true);

      // Load proprietor assignments
      const { data: propData } = await supabase
        .from('proprietor_properties')
        .select(`
          id,
          proprietor_id,
          property_id,
          ownership_percentage,
          assigned_at,
          proprietors(
            business_name,
            profiles:user_id(first_name, last_name)
          ),
          properties(name)
        `)
        .eq('is_active', true);

      setProprietors(propData || []);

      // Load technician assignments
      const { data: techData } = await supabase
        .from('technician_property_assignments')
        .select(`
          id,
          technician_id,
          property_id,
          assigned_at,
          technicians(
            category_id,
            profiles:user_id(first_name, last_name),
            technician_categories:category_id(id, name)
          ),
          properties(name)
        `)
        .eq('is_active', true);

      const mappedTech = (techData || []).map(t => ({
        ...t,
        technician: {
          ...t.technician,
          category: t.technician?.technician_categories,
          profile: t.technician?.profiles
        }
      }));

      setTechnicians(mappedTech);

      // Load caretaker assignments
      const { data: careData } = await supabase
        .from('caretakers')
        .select(`
          id,
          user_id,
          property_id,
          assignment_date,
          profiles:user_id(first_name, last_name),
          properties(name)
        `)
        .eq('status', 'active')
        .not('property_id', 'is', null);

      const mappedCare = (careData || []).map(c => ({
        ...c,
        profile: c.profiles,
        property: c.properties
      }));

      setCaretakers(mappedCare);
    } catch (error: any) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const removeProprietorAssignment = async (id: string) => {
    if (!confirm('Remove this proprietor assignment?')) return;

    try {
      const { error } = await supabase
        .from('proprietor_properties')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Assignment removed');
      await loadAllAssignments();
    } catch (error: any) {
      toast.error('Failed to remove assignment');
    }
  };

  const removeTechnicianAssignment = async (id: string) => {
    if (!confirm('Remove this technician assignment?')) return;

    try {
      const { error } = await supabase
        .from('technician_property_assignments')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Assignment removed');
      await loadAllAssignments();
    } catch (error: any) {
      toast.error('Failed to remove assignment');
    }
  };

  const removeCaretakerAssignment = async (id: string) => {
    if (!confirm('Remove this caretaker assignment?')) return;

    try {
      const { error } = await supabase
        .from('caretakers')
        .update({ property_id: null })
        .eq('id', id);

      if (error) throw error;
      toast.success('Assignment removed');
      await loadAllAssignments();
    } catch (error: any) {
      toast.error('Failed to remove assignment');
    }
  };

  const getProprietorName = (prop: ProprietorAssignment) => {
    const profile = prop.proprietor?.profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return prop.proprietor?.business_name || 'Unknown';
  };

  const getTechnicianName = (tech: TechnicianAssignment) => {
    const profile = tech.technician?.profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return 'Unknown';
  };

  const getCaretakerName = (care: CaretakerAssignment) => {
    const profile = care.profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return 'Unknown';
  };

  const filteredProprietors = proprietors.filter(p =>
    getProprietorName(p).toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.property?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTechnicians = technicians.filter(t =>
    getTechnicianName(t).toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.property?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCaretakers = caretakers.filter(c =>
    getCaretakerName(c).toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.property?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#154279] to-[#0f325e] text-white py-12 px-6 shadow-xl mb-8 lg:rounded-b-3xl">
        <HeroBackground />
        <div className="relative z-10 max-w-[1400px] mx-auto">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">
              Property Staff Assignments
            </h1>
            <p className="text-lg text-blue-100 font-light">
              Manage proprietor, technician, and caretaker assignments
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Proprietor Assignments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{proprietors.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Technician Assignments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{technicians.length}</p>
                </div>
                <Wrench className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Caretaker Assignments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{caretakers.length}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader>
            <CardTitle>Assignments by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="proprietors" onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="proprietors">
                  Proprietors ({proprietors.length})
                </TabsTrigger>
                <TabsTrigger value="technicians">
                  Technicians ({technicians.length})
                </TabsTrigger>
                <TabsTrigger value="caretakers">
                  Caretakers ({caretakers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="proprietors" className="space-y-3 mt-4">
                {filteredProprietors.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredProprietors.map(prop => (
                      <div
                        key={prop.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {getProprietorName(prop)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Property: {prop.property?.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Ownership: {prop.ownership_percentage}% | Assigned:{' '}
                            {new Date(prop.assigned_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProprietorAssignment(prop.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No proprietors assigned</p>
                )}
              </TabsContent>

              <TabsContent value="technicians" className="space-y-3 mt-4">
                {filteredTechnicians.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredTechnicians.map(tech => (
                      <div
                        key={tech.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {getTechnicianName(tech)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Property: {tech.property?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {tech.technician?.category?.name || 'N/A'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Assigned: {new Date(tech.assigned_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTechnicianAssignment(tech.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No technicians assigned</p>
                )}
              </TabsContent>

              <TabsContent value="caretakers" className="space-y-3 mt-4">
                {filteredCaretakers.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredCaretakers.map(care => (
                      <div
                        key={care.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {getCaretakerName(care)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Property: {care.property?.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Assigned: {new Date(care.assignment_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCaretakerAssignment(care.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No caretakers assigned</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PropertyAssignmentAdmin;
