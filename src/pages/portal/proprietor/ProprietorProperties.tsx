import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { proprietorService } from '@/services/proprietorService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Search, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ProprietorProperties = () => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadProperties();
    }, [user?.id]);

    const loadProperties = async () => {
        try {
            setLoading(true);
            setError(null);
            
            if (!user?.id) {
                setError('User not authenticated');
                return;
            }

            // Get proprietor record for this user
            const prop = await proprietorService.getProprietorByUserId(user.id);
            
            if (!prop?.id) {
                setError('No proprietor profile found. Please contact admin.');
                console.warn('No proprietor profile for user:', user.id);
                return;
            }

            console.log('Proprietor found:', prop.id);

            // Get properties assigned to this proprietor
            const { data: assignments, error: assignError } = await supabase
                .from('proprietor_properties')
                .select(`
                    id,
                    proprietor_id,
                    property_id,
                    ownership_percentage,
                    is_active,
                    assigned_at,
                    property:properties(
                        id,
                        name,
                        location,
                        type,
                        status,
                        image_url,
                        total_monthly_rental_expected
                    )
                `)
                .eq('proprietor_id', prop.id)
                .eq('is_active', true)
                .order('assigned_at', { ascending: false });

            if (assignError) {
                console.error('Error fetching proprietor assignments:', assignError);
                setError('Failed to load assigned properties');
                toast.error('Failed to load properties');
                return;
            }

            console.log('Assignments found:', assignments?.length || 0);
            setProperties(assignments || []);

        } catch (err: any) {
            console.error('Error loading properties:', err);
            setError(err.message || 'Failed to load properties');
            toast.error('Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    const filteredProperties = properties.filter(p => 
        p.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.property?.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 w-full space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Properties</h1>
                    <p className="text-slate-500">Manage and view your property portfolio</p>
                </div>
                <div className="flex items-center gap-4 p-6 bg-red-50 border border-red-200 rounded-2xl">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-red-900">Error Loading Properties</h3>
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 w-full space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Properties</h1>
                    <p className="text-slate-500">Manage and view your property portfolio</p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search properties..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filteredProperties.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">No properties found</h3>
                    <p className="text-slate-500">You don't have any properties matching your search.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProperties.map((prop) => (
                        <Card key={prop.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border-slate-200">
                            <div className="h-56 bg-slate-100 relative">
                                {prop.property?.image_url ? (
                                    <img src={prop.property.image_url} alt={prop.property.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                        <Building2 className="w-16 h-16" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <Badge className="bg-white/90 text-slate-800 hover:bg-white shadow-sm backdrop-blur-sm">
                                        {prop.property?.status || 'Active'}
                                    </Badge>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                                    <h3 className="font-bold text-xl text-white">
                                        {prop.property?.name}
                                    </h3>
                                    <div className="flex items-center text-white/90 text-sm mt-1">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        {prop.property?.location}
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Ownership</p>
                                        <p className="font-bold text-slate-800 text-lg">{prop.ownership_percentage}%</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Type</p>
                                        <p className="font-medium text-slate-800">{prop.property?.type || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Assigned Since</span>
                                    <span className="text-sm font-medium text-slate-700">
                                        {new Date(prop.assigned_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProprietorProperties;