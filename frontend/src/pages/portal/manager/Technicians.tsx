import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Shield, 
  Search,
  Loader2,
  Wrench
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TechnicianAssignment {
  id: string;
  technician: {
    id: string;
    specializations: string[];
    is_available: boolean;
    average_rating: number;
    user: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      avatar_url: string;
    };
    category: {
      name: string;
    };
  };
  property: {
    id: string;
    name: string;
    address: string;
  };
}

const ManagerTechnicians = () => {
  const [assignments, setAssignments] = useState<TechnicianAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      
      // Fetch technician assignments for properties managed by the current user
      // RLS policies should handle the filtering based on property manager role
      const { data, error } = await supabase
        .from('technician_property_assignments')
        .select(`
          id,
          technician:technicians(
            id,
            specializations,
            is_available,
            average_rating,
            user:profiles!technicians_user_id_fkey(
              first_name,
              last_name,
              email,
              phone,
              avatar_url
            ),
            category:technician_categories(name)
          ),
          property:properties(
            id,
            name,
            address
          )
        `)
        .eq('is_active', true);

      if (error) throw error;
      setAssignments(data || []);
    } catch (err) {
      console.error('Error fetching technicians:', err);
      toast.error('Failed to load technician assignments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const searchString = searchTerm.toLowerCase();
    const tech = assignment.technician.user;
    const prop = assignment.property;
    const cat = assignment.technician.category;

    return (
      tech.first_name?.toLowerCase().includes(searchString) ||
      tech.last_name?.toLowerCase().includes(searchString) ||
      tech.email?.toLowerCase().includes(searchString) ||
      prop.name.toLowerCase().includes(searchString) ||
      cat?.name.toLowerCase().includes(searchString)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Assigned Technicians</h1>
          <p className="text-gray-500 mt-1">View technicians assigned to your properties</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Search technicians..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map((assignment) => {
          const { technician, property } = assignment;
          const user = technician.user;

          return (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold truncate">
                    {user.first_name} {user.last_name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="font-normal text-xs">
                      {technician.category?.name || 'Technician'}
                    </Badge>
                    {technician.is_available ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 text-xs shadow-none">Available</Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500 text-xs">Busy</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate" title={property.name}>{property.name}</span>
                  </div>
                  <div className="flex items-center text-gray-600 gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{user.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center text-gray-600 gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate" title={user.email}>{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm border-t pt-3 mt-2">
                  <div className="flex items-center gap-1 text-yellow-600 font-medium">
                    <Star className="w-4 h-4 fill-current" />
                    {technician.average_rating || 'N/A'}
                  </div>
                  {technician.specializations && technician.specializations.length > 0 && (
                    <div className="flex gap-1 overflow-hidden">
                       <span className="text-gray-500 text-xs">
                          {technician.specializations.slice(0, 2).join(', ')}
                          {technician.specializations.length > 2 && '...'}
                       </span>
                    </div>
                  )}
                </div>
                
                <Button className="w-full mt-2" variant="outline">
                  View Schedule
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {filteredAssignments.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No assigned technicians found</p>
            <p className="text-gray-400 text-sm mt-1">Technicians assigned to your properties will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerTechnicians;
