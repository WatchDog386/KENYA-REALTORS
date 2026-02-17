import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Phone, Mail, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CaretakersListProps {
  propertyId: string;
}

interface Caretaker {
  id: string;
  status: string;
  performance_rating: number;
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    avatar_url: string;
  };
}

export const CaretakersList: React.FC<CaretakersListProps> = ({ propertyId }) => {
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propertyId) loadCaretakers();
  }, [propertyId]);

  const loadCaretakers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('caretakers')
        .select(`
          id,
          status,
          performance_rating,
          profile:profiles(first_name, last_name, email, phone, avatar_url)
        `)
        .eq('property_id', propertyId)
        .eq('status', 'active');

      if (error) throw error;
      // Map data correctly if needed, though structure seems flat
      setCaretakers((data as any) || []);
    } catch (err) {
      console.error("Error loading caretakers:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Users className="h-5 w-5" /> Assigned Caretakers
      </h3>
      
      {caretakers.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No caretakers assigned to this property.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {caretakers.map((caretaker) => (
            <Card key={caretaker.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={caretaker.profile.avatar_url} />
                  <AvatarFallback>{caretaker.profile.first_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">
                      {caretaker.profile.first_name} {caretaker.profile.last_name}
                    </p>
                    <Badge variant={caretaker.status === 'active' ? 'default' : 'secondary'}>
                      Caretaker
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                     <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {caretaker.profile.phone}</p>
                     <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {caretaker.profile.email}</p>
                  </div>

                  <div className="flex gap-3 mt-2 text-xs font-medium text-gray-700">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {caretaker.performance_rating || 'N/A'}
                    </span>
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
