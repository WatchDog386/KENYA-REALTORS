import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../integrations/supabase/client';
import { 
  Building, 
  Briefcase, 
  Loader2, 
  MapPin, 
  Phone, 
  Mail, 
  TrendingUp, 
  RefreshCw,
  Home,
  Users,
  DollarSign,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { cn } from "../../../lib/utils";

interface ProprietorProfile {
  id: string;
  user_id: string;
  business_name?: string;
  status: string;
  properties_count: number;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  };
}

interface OwnedProperty {
  id: string;
  proprietor_id: string;
  property_id: string;
  ownership_percentage: number;
  assigned_at: string;
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    status: string;
    monthly_rent: number;
    occupied_units: number;
    total_units: number;
  };
}

export const ProprietorDashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const [proprietor, setProprietor] = useState<ProprietorProfile | null>(null);
  const [properties, setProperties] = useState<OwnedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    if (authUser?.id) {
      loadProprietorData();
    }
  }, [authUser?.id]);

  const loadProprietorData = async () => {
    try {
      setLoading(true);

      // Get proprietor profile
      const { data: propData, error: propError } = await supabase
        .from('proprietors')
        .select('*')
        .eq('user_id', authUser?.id)
        .single();

      if (propError) throw propError;

      // Get the user profile separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, avatar_url')
        .eq('id', authUser?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Could not fetch profile:', profileError);
      }

      const mappedProp = {
        ...propData,
        profile: profileData || undefined
      };

      setProprietor(mappedProp);

      // Get owned properties
      const { data: propsData, error: propsError } = await supabase
        .from('proprietor_properties')
        .select(`
          id,
          proprietor_id,
          property_id,
          ownership_percentage,
          assigned_at,
          properties(
            id,
            name,
            address,
            city,
            state,
            zip_code,
            status,
            monthly_rent,
            occupied_units,
            total_units
          )
        `)
        .eq('proprietor_id', propData.id)
        .eq('is_active', true);

      if (propsError) throw propsError;

      const mappedProps = (propsData || []).map((p: any) => ({
        ...p,
        property: p.properties
      }));

      setProperties(mappedProps);
    } catch (error: any) {
      console.error('Error loading proprietor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadProprietorData();
  };

  const getProprietorName = () => {
    if (!proprietor) return "Proprietor";
    const { first_name, last_name } = proprietor.profile || {};
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    }
    return proprietor.business_name || 'Proprietor';
  };

  const totalMonthlyRent = properties.reduce(
    (sum, p) => sum + ((p.property?.monthly_rent || 0) * (p.ownership_percentage / 100)),
    0
  );

  const totalUnits = properties.reduce(
    (sum, p) => sum + (p.property?.total_units || 0),
    0
  );

  const occupiedUnits = properties.reduce(
    (sum, p) => sum + (p.property?.occupied_units || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin text-4xl text-[#154279]">⌛</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen antialiased text-slate-900 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Nunito', sans-serif; }
      `}</style>
      
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] overflow-hidden py-10 shadow-lg relative">
        <div className="w-full px-4 md:px-8">
             <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="w-full md:w-2/3 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/30">
                          Proprietor Portal
                        </span>
                        <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">
                          {greeting}
                        </span>
                    </div>
                    
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                        Welcome back, <span className="text-[#F96302]">{getProprietorName()}</span>
                    </h1>
                    
                    <p className="text-sm text-blue-100 leading-relaxed mb-8 max-w-lg font-medium">
                        You have <span className="text-white font-bold">{properties.length} properties</span> in your portfolio.
                    </p>

                    <button
                      onClick={handleRefresh}
                      className="group flex items-center gap-2 bg-white text-[#154279] px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500")} />
                      <span>Refresh Data</span>
                    </button>
                </div>
             </div>
        </div>
      </section>

      {/* DASHBOARD CONTENT */}
      <div className="w-full px-4 md:px-8 -mt-8 pb-20 relative z-20">
      
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Properties */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl overflow-hidden h-full group">
                    <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Building2 className="w-16 h-16 text-emerald-600" />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 rounded-xl">
                                <Building2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 uppercase text-[10px] tracking-wider">Portfolio</Badge>
                        </div>
                        <div className="text-2xl font-black text-slate-800 mb-1">
                            {properties.length}
                        </div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Properties</div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Total Units */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl overflow-hidden h-full group">
                    <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Home className="w-16 h-16 text-blue-600" />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Home className="w-6 h-6 text-blue-600" />
                            </div>
                            <Badge className="bg-blue-50 text-blue-600 border-blue-100 uppercase text-[10px] tracking-wider">Units</Badge>
                        </div>
                        <div className="text-2xl font-black text-slate-800 mb-1">
                            {totalUnits}
                        </div>
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Units</div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Occupied Units */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl overflow-hidden h-full group">
                    <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-16 h-16 text-[#F96302]" />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-orange-50 rounded-xl">
                                <Users className="w-6 h-6 text-[#F96302]" />
                            </div>
                            <Badge className="bg-orange-50 text-[#F96302] border-orange-100 uppercase text-[10px] tracking-wider">Occupancy</Badge>
                        </div>
                        <div className="text-2xl font-black text-slate-800 mb-1">
                            {occupiedUnits} <span className="text-sm text-slate-400 font-semibold">/ {totalUnits}</span>
                        </div>
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Occupied Units</div>
                        <div className="text-sm font-semibold text-[#F96302] bg-orange-50 px-2 py-1 rounded inline-block">
                             {totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0}% Occupancy
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Monthly Income */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl overflow-hidden h-full group">
                    <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign className="w-16 h-16 text-purple-600" />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <DollarSign className="w-6 h-6 text-purple-600" />
                            </div>
                            <Badge className="bg-purple-50 text-purple-600 border-purple-100 uppercase text-[10px] tracking-wider">Income</Badge>
                        </div>
                        <div className="text-2xl font-black text-slate-800 mb-1">
                            {properties.length > 0 ? 'KES ' + totalMonthlyRent.toLocaleString('en-US', { maximumFractionDigits: 0 }) : 'KES 0'}
                        </div>
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Est. Monthly Income</div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>

        {/* Business Profile + Properties Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Business Profile */}
            <div className="lg:col-span-1 space-y-6">
                 <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                             <CardTitle className="text-lg font-bold text-[#154279]">Business Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {proprietor ? (
                                <>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Business Name</p>
                                        <p className="text-base font-bold text-slate-800">
                                        {proprietor.business_name || getProprietorName()}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</p>
                                        <div className="space-y-2 mt-2">
                                        {proprietor.profile?.email && (
                                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                                 <Mail className="w-4 h-4" />
                                            </div>
                                            {proprietor.profile.email}
                                            </div>
                                        )}
                                        {proprietor.profile?.phone && (
                                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                                 <Phone className="w-4 h-4" />
                                            </div>
                                            {proprietor.profile.phone}
                                            </div>
                                        )}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Status</p>
                                        <div className="mt-2">
                                            <Badge
                                                className={cn(
                                                    "px-3 py-1 text-[10px] uppercase tracking-wider",
                                                    proprietor.status === 'active'
                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                                )}
                                            >
                                                {proprietor.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-slate-500 text-sm">No profile data available.</p>
                            )}
                        </CardContent>
                    </Card>
                 </motion.div>
            </div>

            {/* Right Column: Properties List */}
            <div className="lg:col-span-2 space-y-6">
                 <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-2">
                    <div>
                        <h2 className="text-xl font-black text-[#154279] tracking-tight">My Properties</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                            Use custom view to manage specific properties
                        </p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {properties.map((ownership, index) => (
                        <motion.div 
                            key={ownership.id}
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.2 + (index * 0.1) }}
                        >
                            <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white rounded-2xl overflow-hidden group h-full">
                                <CardHeader className="pb-3 border-b border-slate-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-base font-bold text-[#154279] line-clamp-1">
                                                {ownership.property?.name || 'Unknown Property'}
                                            </CardTitle>
                                            <div className="text-xs text-slate-500 mt-1 flex items-start gap-1 font-medium">
                                                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#F96302]" />
                                                <span className="line-clamp-1">
                                                    {ownership.property?.address}, {ownership.property?.city}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-[#154279] group-hover:text-white transition-colors">
                                             <Building2 className="w-4 h-4" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                         <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ownership</p>
                                            <p className="text-sm font-bold text-slate-700 mt-0.5">{ownership.ownership_percentage}%</p>
                                         </div>
                                         <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                                            <Badge
                                                className={cn(
                                                    "mt-0.5 text-[10px] uppercase font-bold tracking-wide",
                                                    ownership.property?.status === 'available'
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                )}
                                            >
                                                {ownership.property?.status || 'Unknown'}
                                            </Badge>
                                         </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Units</p>
                                            <p className="text-sm font-bold text-slate-700">
                                                {ownership.property?.occupied_units}/{ownership.property?.total_units}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Income</p>
                                            <p className="text-sm font-black text-[#154279]">
                                                KES {(
                                                ((ownership.property?.monthly_rent || 0) *
                                                    ownership.ownership_percentage) /
                                                100
                                                ).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                 </div>
                 
                 {properties.length === 0 && (
                     <Card className="border-dashed border-2 bg-slate-50/50 shadow-none">
                        <CardContent className="py-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-1">
                            No Properties Assigned
                            </h3>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto">
                            You haven't been assigned any properties yet. Contact the administrator to get started.
                            </p>
                        </CardContent>
                    </Card>
                 )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default ProprietorDashboard;