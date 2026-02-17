// src/pages/portal/super-admin/properties/PropertiesManagement.tsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building, Plus, Search, Filter, Eye, Edit, MapPin, Trash2, Home, Maximize, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroBackground } from '@/components/ui/HeroBackground';
import { propertyService, Property, CreatePropertyDTO } from '@/services/propertyService';
import AddPropertyModal from './AddPropertyModal';
import { toast } from 'sonner';

const PropertiesManagement: React.FC = () => {
  const { hasPermission } = useSuperAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await propertyService.fetchProperties();
      setProperties(data);
    } catch (error) {
      console.error("Failed to load properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProperty = async (data: CreatePropertyDTO) => {
    try {
      await propertyService.createProperty(data);
      toast.success("Property created successfully");
      loadProperties();
    } catch (error) {
      console.error("Failed to create property:", error);
      toast.error("Failed to create property");
    }
  };

  const handleDeleteProperty = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    try {
      await propertyService.deleteProperty(id);
      toast.success("Property deleted successfully");
      loadProperties(); // Refresh list
    } catch (error) {
      console.error("Failed to delete property:", error);
      toast.error("Failed to delete property");
    }
  };

  const filteredProperties = properties.filter(prop => {
    const matchesSearch = prop.name.toLowerCase().includes(searchQuery.toLowerCase()) || prop.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading && properties.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#154279]" />
          <p className="text-slate-600 text-sm font-semibold">Loading properties...</p>
        </motion.div>
      </div>
    );
  }

  // Permission check might be needed, currently just hiding if strictly not allowed
  if (!hasPermission('manage_properties')) {
    // ... existing permission error UI ...
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-md text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#154279] mb-2">Access Denied</h1>
            <p className="text-slate-600 text-sm mb-6">You don't have permission to access this page.</p>
            <Button onClick={() => navigate("/portal/super-admin/dashboard")} className="w-full bg-[#154279] hover:bg-[#0f325e] text-white font-bold rounded-xl">Back to Dashboard</Button>
          </motion.div>
        </div>
      );
  }

  const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0);
  const totalExpectedIncome = properties.reduce((sum, p) => sum + (p.expected_income || 0), 0);
  
  // Since we don't have occupancy data in clean slate, we can mock or calculate later if needed.
  // For now let's just use mock occupancy logic or hide it.
  const occupancyRate = 0; 

  return (
    <>
      <Helmet>
        <title>Properties Management | Super Admin</title>
        <meta name="description" content="Manage all properties and assign managers" />
      </Helmet>

      <div className="bg-slate-50 min-h-screen antialiased text-slate-900 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
          body { font-family: 'Nunito', sans-serif; }
        `}</style>

        {/* HERO SECTION */}
        <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] overflow-hidden py-10 shadow-lg mb-8 relative">
          <HeroBackground />
          <div className="max-w-[1400px] mx-auto px-6 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="md:w-1/2">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/30">Super Admin</span>
                  <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">Properties</span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                  Properties <span className="text-[#F96302]">Management</span>
                </h1>
                <p className="text-sm text-blue-100 leading-relaxed mb-8 max-w-lg font-medium">
                  Oversee all property listings, occupancy rates, and assignments. Monitor performance and manage portfolios.
                </p>
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsAddModalOpen(true)} className="group flex items-center gap-2 bg-[#F96302] text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#e05802] transition-all duration-300 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5">
                    <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Add Property
                  </button>
                </div>
              </div>
              <div className="md:w-1/2 w-full mt-6 md:mt-0 flex justify-end">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white max-w-xs w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-lg"><Building className="w-6 h-6 text-white" /></div>
                    <div>
                      <div className="text-xs font-medium text-blue-100 uppercase tracking-wider">Total Properties</div>
                      <div className="text-xl font-bold">{properties.length} Properties</div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-blue-100 border-t border-white/10 pt-2">
                    <span>Expected Income</span>
                    <span className="font-bold">KES {(totalExpectedIncome).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Total Properties', value: properties.length.toString(), icon: Building, color: 'bg-[#154279]' },
              { label: 'Total Units', value: totalUnits.toString(), icon: Home, color: 'bg-cyan-500' },
              { label: 'Monthly Collection', value: `KES ${totalExpectedIncome.toLocaleString()}`, icon: MapPin, color: 'bg-emerald-500' },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className={`${stat.color} text-white rounded-xl p-6 shadow-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider opacity-80">{stat.label}</p>
                      <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-lg"><Icon className="w-6 h-6" /></div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Filter Section */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Search className="w-5 h-5 text-[#F96302]" /> Filter & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Search properties, locations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none transition-all font-medium text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.length === 0 ? (
               <div className="col-span-full py-10 text-center">
                  <div className="inline-block p-4 rounded-full bg-slate-100 mb-4"><Building className="w-8 h-8 text-slate-300" /></div>
                  <h3 className="text-lg font-bold text-slate-600">No properties found</h3>
                  <p className="text-slate-400 text-sm">Create property to get started</p>
               </div>
            ) : filteredProperties.map((property, idx) => (
              <motion.div key={property.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}>
                <Card className="hover:shadow-lg transition-shadow overflow-hidden group h-full flex flex-col">
                  {/* Image Section */}
                  <div className="relative h-48 overflow-hidden bg-slate-200">
                    {property.image_url ? (
                      <img src={property.image_url} alt={property.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400"><Building className="w-12 h-12" /></div>
                    )}
                    <div className="absolute top-3 left-3 bg-[#154279]/90 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                       Active
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/90 text-[#154279] px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <Maximize size={12} className="text-[#F96302]" /> {property.total_units} Units
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <h4 className="font-bold text-[#154279] mb-1 line-clamp-1">{property.name}</h4>
                    <div className="text-xs text-slate-500 mb-4 flex items-center gap-2">
                      <MapPin size={12} className="text-[#F96302]" /> {property.location}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-2 rounded-lg text-xs">
                        <div className="text-center p-1 border-r border-slate-200">
                          <span className="block text-slate-400 font-semibold mb-1">UNITS</span>
                          <span className="font-bold text-slate-700">{property.total_units}</span>
                        </div>
                        <div className="text-center p-1">
                          <span className="block text-slate-400 font-semibold mb-1">INCOME</span>
                          <span className="font-bold text-slate-700">{(property.expected_income || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {property.property_unit_types?.slice(0, 3).map((ut, i) => (
                        <span key={i} className="bg-slate-100 text-slate-600 text-[10px] items-center flex gap-1 font-bold px-2 py-1 rounded-full border border-slate-200">
                           {ut.name} <span className="bg-white px-1 rounded-sm text-slate-800">{ut.units_count}</span>
                        </span>
                      ))}
                      {(property.property_unit_types?.length || 0) > 3 && (
                        <span className="bg-slate-100 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-200">+{((property.property_unit_types?.length || 0) - 3)} more</span>
                      )}
                    </div>
                    
                    <div className="mt-auto border-t border-slate-200 pt-4 flex justify-between items-center gap-2">
                       <Button variant="outline" size="sm" onClick={() => {/* Manage logic */}} className="flex-1 bg-[#154279] hover:bg-[#0f325e] text-white font-bold rounded-xl border-none text-xs">
                          Manage
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => handleDeleteProperty(property.id, e)} className="text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      <AddPropertyModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={handleCreateProperty} 
      />
    </>
  );
};

export default PropertiesManagement;
