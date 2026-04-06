import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { proprietorService } from '@/services/proprietorService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Search, AlertCircle, Percent, LayoutGrid, CalendarDays, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

            const prop = await proprietorService.getProprietorByUserId(user.id);
            if (!prop?.id) {
                setError('No proprietor profile found. Please contact admin.');
                return;
            }

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
                        image_url
                    )
                `)
                .eq('proprietor_id', prop.id)
                .eq('is_active', true)
                .order('assigned_at', { ascending: false });

            if (assignError) {
                setError('Failed to load assigned properties');
                toast.error('Failed to load properties');
                return;
            }

            setProperties(assignments || []);
        } catch (err: any) {
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

    const totalProperties = properties.length;
    const activeProperties = properties.filter(p => p.property?.status?.toLowerCase() === 'active' || p.property?.status?.toLowerCase() === 'Active').length;
    const avgOwnership = totalProperties > 0 
        ? Math.round(properties.reduce((sum, p) => sum + (Number(p.ownership_percentage) || 0), 0) / totalProperties) 
        : 0;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    if (error) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-6">
                <div className="flex items-center gap-4 p-6 bg-red-50/50 border border-red-200 rounded-2xl">
                    <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-semibold text-red-900">Error Loading Properties</h3>
                        <p className="text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/60 text-slate-600 text-sm font-medium mb-2">
                        <Building2 className="w-4 h-4" />
                        Portfolio Overview
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">My Properties</h1>
                    <p className="text-slate-500 text-base md:text-lg max-w-2xl">
                        Manage and monitor the performance of your real estate portfolio.
                    </p>
                </div>
                
                <div className="relative group w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <Input 
                        placeholder="Search by name or location..." 
                        className="pl-10 h-12 bg-white border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500/20 text-base rounded-xl transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats Overview */}
            {!loading && properties.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <Card className="bg-white border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                <LayoutGrid className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Properties</p>
                                <p className="text-2xl font-bold text-slate-900">{totalProperties}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Active Properties</p>
                                <p className="text-2xl font-bold text-slate-900">{activeProperties}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Percent className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Avg. Ownership</p>
                                <p className="text-2xl font-bold text-slate-900">{avgOwnership}%</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Content Section */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="animate-pulse flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm h-[420px]">
                            <div className="h-52 bg-slate-200 w-full" />
                            <div className="p-5 flex-1 flex flex-col gap-4">
                                <div className="h-6 bg-slate-200 rounded-md w-3/4 max-w-[200px]" />
                                <div className="h-4 bg-slate-200 rounded-md w-full" />
                                <div className="h-4 bg-slate-200 rounded-md w-2/3" />
                                <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                                    <div className="h-16 bg-slate-100 rounded-xl" />
                                    <div className="h-16 bg-slate-100 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProperties.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-24 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl"
                >
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                        <Building2 className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No properties found</h3>
                    <p className="text-slate-500 text-center max-w-md">
                        {searchTerm 
                            ? "We couldn't find any properties matching your search criteria. Try adjusting your terms." 
                            : "You don't have any properties assigned to your portfolio yet."}
                    </p>
                    {searchTerm && (
                        <Button 
                            variant="outline" 
                            className="mt-6 border-slate-200 bg-white"
                            onClick={() => setSearchTerm('')}
                        >
                            Clear search
                        </Button>
                    )}
                </motion.div>
            ) : (
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <AnimatePresence>
                        {filteredProperties.map((prop) => (
                            <motion.div key={prop.id} variants={itemVariants} layoutId={prop.id} className="h-full">
                                <Card className="group overflow-hidden rounded-2xl border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 h-full flex flex-col bg-white">
                                    <div className="h-52 relative overflow-hidden bg-slate-100">
                                        {prop.property?.image_url ? (
                                            <img 
                                                src={prop.property.image_url} 
                                                alt={prop.property.name} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100 group-hover:bg-slate-200 transition-colors">
                                                <Building2 className="w-16 h-16 opacity-50" />
                                            </div>
                                        )}
                                        
                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent flex flex-col justify-end p-5">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <Badge className={`backdrop-blur-md border-0 ${
                                                    prop.property?.status?.toLowerCase() === 'active' 
                                                    ? 'bg-emerald-500/90 text-white' 
                                                    : 'bg-white/90 text-slate-800'
                                                }`}>
                                                    {prop.property?.status || 'Active'}
                                                </Badge>
                                                <Badge variant="outline" className="bg-black/40 backdrop-blur-md border-white/20 text-white gap-1 flex items-center shadow-lg">
                                                    <Percent className="w-3 h-3" />
                                                    {prop.ownership_percentage}% Owned
                                                </Badge>
                                            </div>
                                            <h3 className="font-bold text-xl text-white line-clamp-1 group-hover:text-indigo-200 transition-colors">
                                                {prop.property?.name}
                                            </h3>
                                        </div>
                                    </div>
                                    
                                    <div className="p-5 flex-1 flex flex-col gap-5">
                                        <div className="flex items-start text-slate-600 text-sm">
                                            <MapPin className="w-4 h-4 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
                                            <span className="line-clamp-2 leading-relaxed">
                                                {prop.property?.location || 'Location not specified'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-auto">
                                            <div className="flex flex-col justify-center p-3 bg-slate-50/80 rounded-xl border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                                                <span className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                                                    <Building2 className="w-3.5 h-3.5" /> Property Type
                                                </span>
                                                <span className="font-semibold text-slate-700 capitalize text-sm truncate">
                                                    {prop.property?.type || 'Standard Unit'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col justify-center p-3 bg-slate-50/80 rounded-xl border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                                                <span className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                                                    <CalendarDays className="w-3.5 h-3.5" /> Assigned Date
                                                </span>
                                                <span className="font-semibold text-slate-700 text-sm truncate">
                                                    {new Date(prop.assigned_at).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
};

export default ProprietorProperties;
