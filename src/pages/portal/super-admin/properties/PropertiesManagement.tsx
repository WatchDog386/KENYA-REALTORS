// src/pages/portal/super-admin/properties/PropertiesManagement.tsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building, Plus, Search, Filter, Eye, Edit, MapPin, Trash2, Home, Maximize, AlertCircle, Zap, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroBackground } from '@/components/ui/HeroBackground';
import { propertyService, Property, CreatePropertyDTO } from '@/services/propertyService';
import { supabase } from '@/integrations/supabase/client';
import AddPropertyModal from './AddPropertyModal';
import { toast } from 'sonner';

interface UtilityOption {
  id: string;
  utility_name: string;
  is_metered: boolean;
  price?: number;
  constant: number;
}

const PropertiesManagement: React.FC = () => {
  const { hasPermission } = useSuperAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [utilityOptions, setUtilityOptions] = useState<UtilityOption[]>([]);
  const [propertyUtilityMap, setPropertyUtilityMap] = useState<Record<string, string[]>>({});
  const [selectedPropertyForUtilities, setSelectedPropertyForUtilities] = useState<Property | null>(null);
  const [selectedUtilityIds, setSelectedUtilityIds] = useState<string[]>([]);
  const [savingUtilities, setSavingUtilities] = useState(false);
  const [newPropertyUtilityName, setNewPropertyUtilityName] = useState('');
  const [newPropertyUtilityIsRated, setNewPropertyUtilityIsRated] = useState(false);
  const [newPropertyUtilityPrice, setNewPropertyUtilityPrice] = useState(0);
  const [newPropertyUtilityRate, setNewPropertyUtilityRate] = useState(1);

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    await Promise.all([loadProperties(), loadUtilityAssignments()]);
  };

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
      initializePage();
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
      initializePage(); // Refresh list
    } catch (error) {
      console.error("Failed to delete property:", error);
      toast.error("Failed to delete property");
    }
  };

  const loadUtilityAssignments = async () => {
    try {
      const { data: constants, error: constantsError } = await supabase
        .from('utility_constants')
        .select('id, utility_name, is_metered, price, constant')
        .order('utility_name');

      if (constantsError) throw constantsError;

      const { data: assignments, error: assignmentError } = await supabase
        .from('property_utilities')
        .select('property_id, utility_constant_id');

      if (assignmentError) {
        const missingTable = assignmentError.message?.toLowerCase().includes('relation') && assignmentError.message?.toLowerCase().includes('property_utilities');
        if (missingTable) {
          setUtilityOptions(constants || []);
          setPropertyUtilityMap({});
          return;
        }
        throw assignmentError;
      }

      const mapped: Record<string, string[]> = {};
      (assignments || []).forEach((item: any) => {
        if (!mapped[item.property_id]) mapped[item.property_id] = [];
        mapped[item.property_id].push(item.utility_constant_id);
      });

      setUtilityOptions(constants || []);
      setPropertyUtilityMap(mapped);
    } catch (error) {
      console.error('Failed to load utility assignments:', error);
      toast.error('Failed to load property utilities');
    }
  };

  const openUtilityManager = (property: Property) => {
    setSelectedPropertyForUtilities(property);
    setSelectedUtilityIds(propertyUtilityMap[property.id] || []);
    setNewPropertyUtilityName('');
    setNewPropertyUtilityIsRated(false);
    setNewPropertyUtilityPrice(0);
    setNewPropertyUtilityRate(1);
  };

  const toggleUtilitySelection = (utilityId: string) => {
    setSelectedUtilityIds((prev) =>
      prev.includes(utilityId) ? prev.filter((id) => id !== utilityId) : [...prev, utilityId]
    );
  };

  const savePropertyUtilities = async () => {
    if (!selectedPropertyForUtilities) return;
    try {
      setSavingUtilities(true);

      const propertyId = selectedPropertyForUtilities.id;

      const { error: deleteError } = await supabase
        .from('property_utilities')
        .delete()
        .eq('property_id', propertyId);

      if (deleteError) throw deleteError;

      if (selectedUtilityIds.length > 0) {
        const inserts = selectedUtilityIds.map((utilityId) => ({
          property_id: propertyId,
          utility_constant_id: utilityId,
        }));

        const { error: insertError } = await supabase
          .from('property_utilities')
          .insert(inserts);

        if (insertError) throw insertError;
      }

      toast.success('Property utilities updated successfully');
      setSelectedPropertyForUtilities(null);
      await loadUtilityAssignments();
    } catch (error) {
      console.error('Failed to save property utilities:', error);
      toast.error('Failed to save property utilities');
    } finally {
      setSavingUtilities(false);
    }
  };

  const addUtilityForSelectedProperty = async () => {
    if (!selectedPropertyForUtilities) return;

    if (!newPropertyUtilityName.trim()) {
      toast.error('Enter utility name');
      return;
    }

    if (!newPropertyUtilityIsRated && Number(newPropertyUtilityPrice) <= 0) {
      toast.error('Enter fixed price for fixed utility');
      return;
    }

    if (newPropertyUtilityIsRated && Number(newPropertyUtilityRate) <= 0) {
      toast.error('Enter rate for rated utility');
      return;
    }

    try {
      setSavingUtilities(true);

      const normalizedName = newPropertyUtilityName.trim();
      let utilityId = '';

      const existing = utilityOptions.find(
        (item) => item.utility_name.toLowerCase() === normalizedName.toLowerCase()
      );

      if (existing) {
        utilityId = existing.id;
      } else {
        const { data: createdUtility, error: createError } = await supabase
          .from('utility_constants')
          .insert([
            {
              utility_name: normalizedName,
              is_metered: newPropertyUtilityIsRated,
              constant: newPropertyUtilityIsRated ? Number(newPropertyUtilityRate) : 1,
              price: newPropertyUtilityIsRated ? null : Number(newPropertyUtilityPrice),
              description: newPropertyUtilityIsRated ? `Rated utility - ${normalizedName}` : `Fixed utility - ${normalizedName}`,
            },
          ])
          .select('id')
          .single();

        if (createError) throw createError;
        utilityId = createdUtility.id;
      }

      const { error: assignmentError } = await supabase
        .from('property_utilities')
        .insert([
          {
            property_id: selectedPropertyForUtilities.id,
            utility_constant_id: utilityId,
          },
        ]);

      if (assignmentError && !assignmentError.message?.toLowerCase().includes('duplicate')) {
        throw assignmentError;
      }

      toast.success('Utility added to property successfully');
      setNewPropertyUtilityName('');
      setNewPropertyUtilityPrice(0);
      setNewPropertyUtilityRate(1);
      setNewPropertyUtilityIsRated(false);
      await loadUtilityAssignments();

      const { data: refreshedAssignments } = await supabase
        .from('property_utilities')
        .select('utility_constant_id')
        .eq('property_id', selectedPropertyForUtilities.id);

      setSelectedUtilityIds((refreshedAssignments || []).map((item: any) => item.utility_constant_id));
    } catch (error) {
      console.error('Failed to add utility to property:', error);
      toast.error('Failed to add utility to property');
    } finally {
      setSavingUtilities(false);
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

                    <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#154279] flex items-center gap-1">
                          <Zap size={12} className="text-[#F96302]" /> Utilities
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUtilityManager(property)}
                          className="h-7 text-[10px] px-2.5 border-[#154279]/20 text-[#154279] hover:bg-[#154279]/5"
                        >
                          Configure
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(propertyUtilityMap[property.id] || []).length === 0 ? (
                          <span className="text-[11px] text-slate-500">No utilities assigned</span>
                        ) : (
                          utilityOptions
                            .filter((option) => (propertyUtilityMap[property.id] || []).includes(option.id))
                            .slice(0, 4)
                            .map((option) => (
                              <Badge key={option.id} className="bg-white text-[#154279] border border-blue-200 text-[10px]">
                                {option.utility_name}
                              </Badge>
                            ))
                        )}
                        {(propertyUtilityMap[property.id] || []).length > 4 && (
                          <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                            +{(propertyUtilityMap[property.id] || []).length - 4} more
                          </Badge>
                        )}
                      </div>
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

      {selectedPropertyForUtilities && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl border-2 border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
              <div>
                <CardTitle className="text-xl text-[#154279]">Configure Property Utilities</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Select utilities available for <span className="font-semibold">{selectedPropertyForUtilities.name}</span>.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPropertyForUtilities(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X size={16} />
              </Button>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-sm font-bold text-[#154279]">Add Utility to This Property</p>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Utility Name</label>
                  <input
                    type="text"
                    value={newPropertyUtilityName}
                    onChange={(e) => setNewPropertyUtilityName(e.target.value)}
                    placeholder="e.g. WIFI, Parking, Borehole"
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Utility Type</label>
                    <select
                      value={newPropertyUtilityIsRated ? 'rated' : 'fixed'}
                      onChange={(e) => setNewPropertyUtilityIsRated(e.target.value === 'rated')}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="rated">Rated</option>
                    </select>
                  </div>
                  <div>
                    {newPropertyUtilityIsRated ? (
                      <>
                        <label className="text-xs font-semibold text-slate-600">Rate</label>
                        <input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={newPropertyUtilityRate}
                          onChange={(e) => setNewPropertyUtilityRate(Number(e.target.value || 0))}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                        />
                      </>
                    ) : (
                      <>
                        <label className="text-xs font-semibold text-slate-600">Fixed Price (KES)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newPropertyUtilityPrice}
                          onChange={(e) => setNewPropertyUtilityPrice(Number(e.target.value || 0))}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={addUtilityForSelectedProperty} disabled={savingUtilities} className="bg-[#154279] hover:bg-[#0f325e] text-white">
                    {savingUtilities ? 'Adding...' : 'Add Utility'}
                  </Button>
                </div>
              </div>

              {utilityOptions.length === 0 ? (
                <p className="text-sm text-slate-500">No utilities found. Add utilities from Billing and Invoicing page first.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {utilityOptions.map((utility) => (
                    <label
                      key={utility.id}
                      className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 cursor-pointer hover:border-[#154279]/40"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUtilityIds.includes(utility.id)}
                        onChange={() => toggleUtilitySelection(utility.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{utility.utility_name}</p>
                        <p className="text-xs text-slate-500">
                          {utility.is_metered ? `Metered • Rate Multiplier: ${utility.constant}` : `Fixed • KES ${Number(utility.price || 0).toLocaleString()}`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="border-t p-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedPropertyForUtilities(null)}>
                Cancel
              </Button>
              <Button onClick={savePropertyUtilities} disabled={savingUtilities} className="bg-[#154279] hover:bg-[#0f325e] text-white">
                {savingUtilities ? 'Saving...' : 'Save Utilities'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default PropertiesManagement;
