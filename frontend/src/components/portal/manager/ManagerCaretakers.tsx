import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Search,
  Loader2,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Caretaker {
  id: string;
  status: string;
  hire_date: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    avatar_url: string;
  };
  property: {
    id: string;
    name: string;
    address: string;
  };
}

const ManagerCaretakers = () => {
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCaretakers();
  }, []);

  const fetchCaretakers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('caretakers')
        .select(`
          id,
          status,
          hire_date,
          user:profiles!caretakers_user_id_fkey(
            first_name,
            last_name,
            email,
            phone,
            avatar_url
          ),
          property:properties(
            id,
            name,
            address
          )
        `);

      if (error) throw error;
      setCaretakers(data || []);
    } catch (err) {
      console.error('Error fetching caretakers:', err);
      toast.error('Failed to load caretakers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCaretakers = caretakers.filter(caretaker => {
    const searchString = searchTerm.toLowerCase();
    const user = caretaker.user;
    const prop = caretaker.property;

    return (
      user.first_name?.toLowerCase().includes(searchString) ||
      user.last_name?.toLowerCase().includes(searchString) ||
      user.email?.toLowerCase().includes(searchString) ||
      prop.name.toLowerCase().includes(searchString)
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Caretakers</h1>
          <p className="text-gray-500 mt-1">Manage caretakers for your properties</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Search caretakers..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCaretakers.map((caretaker) => {
          const { user, property } = caretaker;

          return (
            <Card key={caretaker.id} className="hover:shadow-lg transition-shadow duration-200 group">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-2 ring-transparent group-hover:ring-primary/10 transition-all">
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
                    <Badge variant={caretaker.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {caretaker.status || 'Active'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="bg-gray-100 p-1.5 rounded-md">
                        <MapPin className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="truncate font-medium">{property.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="bg-gray-100 p-1.5 rounded-md">
                        <Phone className="w-4 h-4 text-gray-500" />
                    </div>
                    <span>{user.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="bg-gray-100 p-1.5 rounded-md">
                        <Mail className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="truncate" title={user.email}>{user.email}</span>
                  </div>
                  {caretaker.hire_date && (
                    <div className="flex items-center gap-3 text-gray-600">
                        <div className="bg-gray-100 p-1.5 rounded-md">
                            <Calendar className="w-4 h-4 text-gray-500" />
                        </div>
                        <span>Hired: {new Date(caretaker.hire_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                    <Button className="w-full" variant="outline" size="sm">
                        Details
                    </Button>
                    <Button className="w-full" variant="secondary" size="sm">
                        Message
                    </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredCaretakers.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No caretakers found</p>
            <p className="text-gray-400 text-sm mt-1">Caretakers assigned to your properties will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerCaretakers;
