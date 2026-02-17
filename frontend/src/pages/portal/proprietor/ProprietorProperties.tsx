import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { proprietorService } from '@/services/proprietorService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Search, AlertCircle, Loader2, DollarSign, Users, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ProprietorProperties = () => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [proprietorName, setProprietorName] = useState<string>('');

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

            // Set proprietor name
            const profile = prop.profile;
            if (profile) {
                const name = profile.first_name && profile.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile.first_name || 'Proprietor';
                setProprietorName(name);
            } else {
                setProprietorName('Proprietor');
            }

            console.log('Proprietor found:', prop.id);

            // Get properties assigned to this proprietor with full details
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
                        total_monthly_rental_expected,
                        total_units,
                        occupied_units,
                        monthly_rent
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
            <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#154279]" />
                    <p className="text-slate-600 text-sm font-medium">Loading your properties...</p>
                </div>
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
        <div className="p-8 w-full space-y-6 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Properties</h1>
                    <p className="text-slate-500">Property portfolio for <span className="font-semibold text-[#154279]">{proprietorName}</span></p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search properties..." 
                        className="pl-10 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filteredProperties.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
                    <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">No properties found</h3>
                    <p className="text-slate-500">You don't have any properties matching your search.</p>
                </div>
            ) : (
                <div>
                    <div className="mb-6 text-sm font-medium text-slate-600">
                        Showing <span className="font-bold text-slate-900">{filteredProperties.length}</span> of <span className="font-bold text-slate-900">{properties.length}</span> properties
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProperties.map((prop) => {
                            const occupancyRate = prop.property?.total_units 
                                ? Math.round((prop.property?.occupied_units || 0) / prop.property.total_units * 100)
                                : 0;
                            const monthlyRent = (prop.property?.monthly_rent || 0) * (prop.ownership_percentage / 100);

                            return (
                                <Card key={prop.id} className="overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer border-slate-200 bg-white">
                                    <div className="h-56 bg-gradient-to-br from-slate-200 to-slate-300 relative overflow-hidden">
                                        {prop.property?.image_url ? (
                                            <img src={prop.property.image_url} alt={prop.property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-300">
                                                <Building2 className="w-16 h-16" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4">
                                            <Badge className={`${
                                                prop.property?.status === 'active' ? 'bg-emerald-500' :
                                                prop.property?.status === 'inactive' ? 'bg-red-500' :
                                                'bg-yellow-500'
                                            } text-white shadow-md backdrop-blur-sm`}>
                                                {prop.property?.status || 'Active'}
                                            </Badge>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                            <h3 className="font-bold text-xl text-white">
                                                {prop.property?.name}
                                            </h3>
                                            <div className="flex items-center text-white/90 text-sm mt-1">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                {prop.property?.location}
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-5 space-y-4">
                                        {/* Key Metrics */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <p className="text-xs text-blue-700 uppercase font-bold mb-1">Ownership</p>
                                                <p className="font-bold text-slate-900 text-lg">{prop.ownership_percentage}%</p>
                                            </div>
                                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                                <p className="text-xs text-orange-700 uppercase font-bold mb-1">Type</p>
                                                <p className="font-semibold text-slate-800">{prop.property?.type || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {/* Units & Occupancy */}
                                        {prop.property?.total_units && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs text-purple-700 uppercase font-bold">Units</p>
                                                        <Home className="w-3 h-3 text-purple-600" />
                                                    </div>
                                                    <p className="font-bold text-slate-900 text-lg">{prop.property.total_units}</p>
                                                </div>
                                                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs text-emerald-700 uppercase font-bold">Occupied</p>
                                                        <Users className="w-3 h-3 text-emerald-600" />
                                                    </div>
                                                    <p className="font-bold text-slate-900 text-lg">{occupancyRate}%</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Monthly Rent */}
                                        {monthlyRent > 0 && (
                                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-emerald-600" />
                                                        <p className="text-xs text-emerald-700 uppercase font-bold">Monthly (Your Share)</p>
                                                    </div>
                                                    <p className="font-bold text-emerald-700">KES {monthlyRent.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Assigned Since</span>
                                            <span className="font-semibold text-slate-700">
                                                {new Date(prop.assigned_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProprietorProperties;