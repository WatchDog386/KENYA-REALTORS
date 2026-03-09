import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wrench, Phone, Mail, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TechniciansListProps {
  propertyId: string;
}

interface AssignedTechnician {
  id: string; // assignment id
  technician: {
    id: string;
    category: { name: string };
    profile: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      avatar_url: string;
    };
    average_rating: number;
    total_jobs_completed: number;
    status: string;
  };
}

export const TechniciansList: React.FC<TechniciansListProps> = ({ propertyId }) => {
  const [technicians, setTechnicians] = useState<AssignedTechnician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propertyId) loadTechnicians();
  }, [propertyId]);

  const loadTechnicians = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('technician_property_assignments')
        .select(`
          id,
          technician:technicians(
            id,
            status,
            average_rating,
            total_jobs_completed,
            category:technician_categories(name),
            profile:profiles(first_name, last_name, email, phone, avatar_url)
          )
        `)
        .eq('property_id', propertyId)
        .eq('is_active', true);

      if (error) throw error;
      setTechnicians(data || []);
    } catch (err) {
      console.error("Error loading technicians:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Wrench className="h-5 w-5" /> Assigned Technicians
      </h3>
      
      {technicians.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No technicians assigned to this property.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {technicians.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={item.technician.profile.avatar_url} />
                  <AvatarFallback>{item.technician.profile.first_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">
                      {item.technician.profile.first_name} {item.technician.profile.last_name}
                    </p>
                    <Badge variant={item.technician.status === 'active' ? 'default' : 'secondary'}>
                      {item.technician.category?.name || 'Technician'}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                     <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {item.technician.profile.phone}</p>
                     <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {item.technician.profile.email}</p>
                  </div>

                  <div className="flex gap-3 mt-2 text-xs font-medium text-gray-700">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {item.technician.average_rating || 'N/A'}
                    </span>
                    <span>{item.technician.total_jobs_completed} Jobs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
