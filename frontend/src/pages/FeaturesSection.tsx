import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
    MapPin, BedDouble, Bath, X, Search, ShoppingCart, Menu,
    ChevronRight, CheckCircle2, Maximize, User, Phone, 
    ArrowRight, PlayCircle, Home, Shield, Zap, Wifi, Clock, FileText, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// --- 1. THEME & STYLES (Matching DIY Rental Guide) ---
const THEME = {
    primary: "#154279",
    secondary: "#F96302",
    white: "#ffffff",
    bgLight: "#f8fafc",
    slate50: "#f8fafc",
    slate100: "#e2e8f0",
    slate200: "#cbd5e1",
    slate500: "#64748b",
    slate600: "#475569",
    slate700: "#334155",
    slate900: "#0f172a",
    textDark: "#484848",
    textMid: "#666666"
};

const DEFAULT_UNIT_IMAGE = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1400&auto=format&fit=crop";
const FEATURES_BACKGROUND_IMAGE_URL = "/background.png";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    .font-inter { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .features-flat-dark [class*='shadow'] { box-shadow: none !important; }
        .features-flat-dark [class*='ring-'] { box-shadow: none !important; }
    
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

    /* Mosaic Grid for Detail Page */
    .gallery-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; height: 400px; border-radius: 12px; overflow: hidden; }
    .gallery-main { grid-row: span 2; height: 100%; }
    .gallery-sub { display: flex; flex-direction: column; gap: 10px; height: 100%; }
    .gallery-img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }

    @media (max-width: 768px) {
        .gallery-grid { display: flex; flex-direction: column; height: auto; border-radius: 12px; }
        .gallery-main { height: 250px; }
        .gallery-sub { display: none; }
    }
  `}</style>
);

// --- 2. SUB-COMPONENTS ---

const FilterSidebar = ({ filters, setFilters, allListings, loading, properties, unitTypes }: any) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFilters((prev: any) => ({ ...prev, [name]: value }));
    };

    // Get unique properties from the properties array passed in
    const uniqueProperties = properties || [];

    // Get unique unit types from the unitTypes array passed in
    const uniqueUnitTypes = unitTypes || [];

    return (
        <div className="bg-gradient-to-br from-[#f0f4f8] via-white to-[#e8ecf1] p-4 md:p-6 rounded-none md:rounded-none  md: border-2 border-transparent  font-inter overflow-hidden mb-4 md:mb-0 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
            <div 
                className="flex items-center justify-between mb-0 md:mb-6 pb-2 md:pb-4 border-b-0 md:border-b-2 border-[#154279] cursor-pointer md:cursor-default"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                <div className="flex items-center gap-2">
                    <Zap size={18} className="text-[#F96302]" />
                    <h3 className="font-bold text-sm md:text-lg text-[#154279] tracking-tight uppercase">
                        Find Your Unit
                    </h3>
                </div>
                {/* Mobile Toggle Icon */}
                <div className="md:hidden bg-[#efeeee] p-1.5 rounded-full text-[#154279] shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                   <ChevronRight size={14} className={cn("transition-transform duration-300", isMobileOpen ? "rotate-90" : "")} />
                </div>
            </div>
            
            <div className={cn("mt-4 md:mt-0 space-y-4 md:space-y-5", isMobileOpen ? "block" : "hidden md:block")}>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-3 border-[#F96302] border-t-transparent rounded-full shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]"></div>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="text-[9px] md:text-[10px] font-bold text-[#154279] uppercase tracking-[0.15em] mb-1.5 md:mb-2 block">🏢 Select Property</label>
                            <select 
                                name="property"
                                value={filters.property || ""}
                                onChange={handleChange}
                                className="w-full bg-[#efeeee] border-2 border-transparent  p-2.5 md:p-3 rounded-none text-xs md:text-sm text-slate-700 focus:ring-2 focus:ring-[#F96302]/20 focus:border-[#F96302] outline-none cursor-pointer shadow-[inset_6px_6px_12px_#d1d1d1,inset_-6px_-6px_12px_#ffffff] border-transparent bg-[#efeeee]"
                            >
                                <option value="">All Properties ({uniqueProperties.length})</option>
                                {uniqueProperties.map((prop: any) => (
                                    <option key={prop.id} value={prop.id}>
                                        {prop.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[9px] md:text-[10px] font-bold text-[#154279] uppercase tracking-[0.15em] mb-1.5 md:mb-2 block">🏠 Unit Type</label>
                            <select 
                                name="type" 
                                value={filters.type}
                                onChange={handleChange}
                                className="w-full bg-[#efeeee] border-2 border-transparent  p-2.5 md:p-3 rounded-none text-xs md:text-sm text-slate-700 focus:ring-2 focus:ring-[#F96302]/20 focus:border-[#F96302] outline-none cursor-pointer shadow-[inset_6px_6px_12px_#d1d1d1,inset_-6px_-6px_12px_#ffffff] border-transparent bg-[#efeeee]"
                            >
                                <option value="">All Unit Types ({uniqueUnitTypes.length})</option>
                                {uniqueUnitTypes.map((unitType: any, idx: number) => (
                                    <option key={idx} value={unitType.id}>
                                        {unitType.unit_type_name || unitType.name || "Unit"} - KES {(unitType.price_per_unit || 0).toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-[#154279] uppercase tracking-[0.15em] mb-2 block">💰 Max Price: KES {Number(filters.maxPrice || 500000).toLocaleString()}</label>
                            <input 
                                type="range" 
                                name="maxPrice"
                                min="10000" 
                                max="500000" 
                                step="5000"
                                value={filters.maxPrice || 500000}
                                onChange={handleChange}
                                className="w-full h-2 bg-slate-300 rounded-none appearance-none cursor-pointer accent-[#F96302] shadow-[inset_6px_6px_12px_#d1d1d1,inset_-6px_-6px_12px_#ffffff] border-transparent bg-[#efeeee]"
                            />
                            <div className="flex justify-between text-[10px] text-[#154279] mt-2 font-bold">
                                <span>10k</span>
                                <span>500k+</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="text-[10px] font-bold text-[#154279] uppercase tracking-[0.15em] mb-3 block">📊 Vacant Units Available</label>
                            <div className="bg-[#efeeee] p-3 rounded-none border-transparent border-transparent shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                <p className="text-sm font-bold text-[#F96302]">{allListings.length} Units Available</p>
                                <p className="text-xs text-slate-600 mt-1">Properties: {properties.length}</p>
                                <p className="text-xs text-slate-600">Types: {unitTypes.length}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setFilters({ property: "", type: "", maxPrice: 500000 })}
                            className="w-full bg-[#154279] hover:bg-[#F96302] text-white font-bold py-3 rounded-none text-[10px] uppercase tracking-[0.15em] transition-all ">
                            Reset Filters
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const DetailModal = ({ item, onClose }: { item: any, onClose: () => void }) => {
    const navigate = useNavigate();
    const [manager, setManager] = React.useState<any>(null);
    const [activeImageIndex, setActiveImageIndex] = React.useState(0);

    const handleApply = () => {
        const params = new URLSearchParams({
            propertyId: item.propertyId || item.properties?.id || '',
            unitId: item.id || '',
            propertyName: item.propertyName || item.properties?.name || item.title || '',
            unitNumber: item.unitNumber || item.unit_number || '',
            location: item.location || item.properties?.location || '',
            unitTypeId: item.typeId ? String(item.typeId) : '',
            unitTypeName: item.type || '',
            rent: item.price ? String(item.price) : '',
            status: item.rawStatus || item.status || 'available'
        });

        navigate(`/applications?${params.toString()}`);
    };

    React.useEffect(() => {
        const fetchManager = async () => {
            if (!item?.properties?.id) return;
            const propId = item.properties.id;

            // 1. Check property_manager_assignments
            const { data: assignments } = await supabase
                .from('property_manager_assignments')
                .select('property_manager_id')
                .eq('property_id', propId)
                .eq('status', 'active')
                .limit(1);

            let mId = assignments?.[0]?.property_manager_id;

            // 2. Check caretakers
            if (!mId) {
                const { data: caretakers } = await supabase
                    .from('caretakers')
                    .select('user_id')
                    .eq('property_id', propId)
                    .eq('status', 'active')
                    .limit(1);
                mId = caretakers?.[0]?.user_id;
            }

            // 3. fetch profile
            if (mId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url, role')
                    .eq('id', mId)
                    .single();
                setManager(profile);
            }
        };
        fetchManager();
    }, [item]);

    if (!item) return null;

    const managerName = manager?.full_name || "Property Office";
    const managerRole = manager?.role === 'property_manager' ? "Primary Manager" : manager?.role === 'caretaker' ? "Caretaker" : "Site Manager";
    const managerAvatar = manager?.avatar_url || "https://i.pravatar.cc/150?u=manager";

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto custom-scroll font-inter"
        >
            {/* Header / Nav inside Modal */}
            <div className="sticky top-0 bg-[#efeeee]  z-50 px-4 md:px-8 h-16 flex items-center justify-between border-b border-transparent ">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#154279] bg-[#efeeee] hover:text-white hover:bg-[#154279] transition-all shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]"
                    >
                        <ArrowLeft size={14} />
                        Back
                    </button>
                    <div className="font-semibold text-xl text-[#154279] tracking-tight">AYDEN<span className="text-[#F96302]">HOMES</span></div>
                </div>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-none bg-[#efeeee] hover:bg-[#F96302] hover:text-white flex items-center justify-center transition-all shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="max-w-7xl mx-auto bg-[#efeeee] min-h-screen pb-20  ">
                {/* 1. Title Header Section */}
                <div className="p-6 md:p-10 pb-6 flex flex-col md:flex-row justify-between items-start border-b border-transparent  bg-[#efeeee]/50 ">
                    <div>
                        <div className="flex gap-2 mb-4">
                            <span className="bg-[#F96302] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">For Rent</span>
                            {item.featured && <span className="bg-[#154279] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">Featured</span>} 
                        </div>
                        <h1 className="text-2xl md:text-4xl font-semibold text-[#154279] mb-3 tracking-tight leading-tight">{item.title}</h1>
                        <p className="text-slate-500 flex items-center gap-2 text-sm font-normal">
                            <MapPin size={16} className="text-[#F96302]"/> {item.location} <span className="text-slate-300">|</span> {item.floor}
                        </p>
                    </div>
                    <div className="mt-6 md:mt-0 text-left md:text-right bg-[#154279] p-6 rounded-none shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                        <div className="text-xs font-medium text-white/70 mb-1">Monthly Rent</div>
                        <div className="text-2xl md:text-3xl font-bold text-white leading-none">KES {item.price.toLocaleString()}</div>
                        <p className="text-[#F96302] font-medium text-sm mt-1">All Inclusive</p>
                    </div>
                </div>

                {/* 2. Main Image Section */}
                <div className="p-6 md:p-10 pt-4">
                    {item.gallery && item.gallery.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            <div className="w-full h-[300px] md:h-[400px] rounded-none overflow-hidden  relative group shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                <img 
                                    src={item.gallery[activeImageIndex]} 
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none"></div>
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                    <span className="bg-[#efeeee]/90 text-[#154279] text-xs px-3 py-1.5 rounded-full font-bold backdrop-blur-sm shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                        {item.propertyName}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Thumbnail Gallery Navigation */}
                            {item.gallery.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2 custom-scroll">
                                    {item.gallery.map((img: string, idx: number) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={cn(
                                                "w-24 h-20 rounded-none overflow-hidden shrink-0 border-2 transition-all",
                                                activeImageIndex === idx ? "border-[#F96302] opacity-100 ring-2 ring-[#F96302]/30" : "border-transparent opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <img src={img} alt={`Thumbnail ${idx+1}`} className="w-full h-full object-cover"/>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full bg-[#154279]/5 rounded-none border-transparent border-[#154279]/10 p-6 flex items-center justify-center h-24 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                             <span className="text-[#154279] font-medium text-sm flex items-center gap-2">
                                <FileText size={18} className="text-[#F96302]" /> Detailed Unit Information Below
                             </span>
                        </div>
                    )}
                </div>

                {/* 3. Main Content & Sidebar */}
                <div className="p-6 md:p-10 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* LEFT COLUMN: Details */}
                    <div className="lg:col-span-2">
                        {/* Quick Overview Badges */}
                        <div className="bg-[#efeeee] p-6 rounded-none flex flex-wrap gap-8 md:gap-12 mb-10 border-transparent border-transparent shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#154279]/5 p-3 rounded-none shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                    <Bath size={24} className="text-[#F96302]"/>
                                </div>
                                <div>
                                    <span className="block font-bold text-2xl text-[#154279] leading-none">{item.baths}</span>
                                    <span className="text-xs text-slate-500 font-medium">Bathroom(s)</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px w-8 bg-[#F96302]"></div>
                                <h3 className="text-lg font-semibold text-[#154279]">Description</h3>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-sm font-normal">
                                {item.description}
                                <br/><br/>
                                Living at <strong className="text-[#154279]">this property</strong> offers a unique blend of community and privacy. 
                                Enjoy dedicated maintenance teams, secure biometric access, and a community app for all your utility payments.
                            </p>
                        </div>

                        {/* Property Info */}
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px w-8 bg-[#F96302]"></div>
                                <h3 className="text-lg font-semibold text-[#154279]">Property & Unit Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 text-slate-700 text-sm font-medium bg-[#efeeee] rounded-none p-4 border-transparent border-transparent shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                    <Home size={20} className="text-[#F96302]"/>
                                    <div>
                                        <span className="block text-[10px] uppercase text-slate-500 font-bold mb-0.5">Property Name</span>
                                        <span className="text-[#154279]">{item.propertyName}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700 text-sm font-medium bg-[#efeeee] rounded-none p-4 border-transparent border-transparent shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                    <BedDouble size={20} className="text-[#F96302]"/>
                                    <div>
                                        <span className="block text-[10px] uppercase text-slate-500 font-bold mb-0.5">Unit Type</span>
                                        <span className="text-[#154279]">{item.type}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700 text-sm font-medium bg-[#efeeee] rounded-none p-4 border-transparent border-transparent shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                    <FileText size={20} className="text-[#F96302]"/>
                                    <div>
                                        <span className="block text-[10px] uppercase text-slate-500 font-bold mb-0.5">Unit Number</span>
                                        <span className="text-[#154279]">{item.unitNumber || "Not Specified"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700 text-sm font-medium bg-[#efeeee] rounded-none p-4 border-transparent border-transparent shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                    <Clock size={20} className="text-[#F96302]"/>
                                    <div>
                                        <span className="block text-[10px] uppercase text-slate-500 font-bold mb-0.5">Status</span>
                                        <span className="text-emerald-600 font-bold uppercase tracking-wider">{item.floor}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Property Details Table */}
                        <div className="bg-[#efeeee] p-6 rounded-none border-transparent border-transparent shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-px w-8 bg-[#F96302]"></div>
                                <h3 className="text-lg font-semibold text-[#154279]">Technical Specs</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex justify-between bg-[#efeeee] rounded-none p-3 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                    <span className="font-medium text-slate-500 text-sm">Unit ID</span>
                                    <span className="font-semibold text-[#154279]">{item.id}</span>
                                </div>
                                <div className="flex justify-between bg-[#efeeee] rounded-none p-3 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                    <span className="font-medium text-slate-500 text-sm">Monthly Fee</span>
                                    <span className="font-semibold text-[#F96302]">KES {item.price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between bg-[#efeeee] rounded-none p-3 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                    <span className="font-medium text-slate-500 text-sm">Unit Type</span>
                                    <span className="font-semibold text-[#154279]">{item.type}</span>
                                </div>
                                <div className="flex justify-between bg-[#efeeee] rounded-none p-3 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                    <span className="font-medium text-slate-500 text-sm">Year Built</span>
                                    <span className="font-semibold text-[#154279]">2024</span>
                                </div>
                                <div className="flex justify-between bg-[#efeeee] rounded-none p-3 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                    <span className="font-medium text-slate-500 text-sm">Status</span>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 text-xs font-medium rounded-full shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">Available</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Contact Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#154279] rounded-none p-6  sticky top-24 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                            <div className="flex items-center gap-2 mb-5">
                                <Clock size={18} className="text-[#F96302]" />
                                <h4 className="text-lg font-semibold text-white">Schedule Visit</h4>
                            </div>
                            <div className="flex items-center gap-4 mb-6 bg-[#efeeee]/10 p-4 rounded-none shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                <div className="w-12 h-12 bg-[#efeeee]/10 rounded-none overflow-hidden shrink-0 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                    <img src={managerAvatar} alt="Agent" className="w-full h-full object-cover" />
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-medium text-white text-sm truncate" title={managerName}>{managerName}</div>
                                    <div className="text-xs text-[#F96302] truncate">{managerRole}</div>
                                </div>
                            </div>

                            <form className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-white/70 mb-1.5 block">Full Name</label>
                                    <input type="text" placeholder="John Doe" className="w-full bg-[#efeeee]/10 border-transparent border-white/20 rounded-none px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#F96302] outline-none transition-all shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]"/>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/70 mb-1.5 block">Email Address</label>
                                    <input type="email" placeholder="john@example.com" className="w-full bg-[#efeeee]/10 border-transparent border-white/20 rounded-none px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#F96302] outline-none transition-all shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]"/>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/70 mb-1.5 block">Message</label>
                                    <textarea rows={3} placeholder="I want to see this unit..." className="w-full bg-[#efeeee]/10 border-transparent border-white/20 rounded-none px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#F96302] outline-none transition-all resize-none shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]"></textarea>
                                </div>
                                
                                <button className="w-full bg-[#F96302] hover:bg-[#e55a00] text-white font-medium py-3 rounded-none transition-all text-sm shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                                    Reserve My Tour
                                </button>
                                <button className="w-full bg-transparent border-transparent border-white/30 text-white font-medium py-3 rounded-none hover:bg-[#efeeee]/10 transition-all flex items-center justify-center gap-2 text-sm shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]">
                                    <Phone size={16} className="text-[#F96302]"/> Direct Line
                                </button>
                            </form>
                        </div>
                    </div>

                </div>

                <div className="px-6 md:px-10 pb-10">
                    <div className="bg-[#efeeee] border border-transparent p-4 md:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                        <p className="text-sm md:text-base font-semibold text-[#154279]">
                            Ready to apply for this unit?
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2.5 border border-[#154279]/30 text-[#154279] text-xs font-bold uppercase tracking-wide hover:bg-[#154279]/5 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-5 py-2.5 bg-[#F96302] hover:bg-[#e55a00] text-white text-xs font-bold uppercase tracking-wide inline-flex items-center gap-2 transition-colors"
                            >
                                Apply Now
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- 4. MAIN PAGE COMPONENT ---
type FeaturesSectionProps = {
    removeTopSpacing?: boolean;
};

export default function AydenTowersListing({ removeTopSpacing = false }: FeaturesSectionProps) {
    const navigate = useNavigate();
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [allListings, setAllListings] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [unitTypes, setUnitTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        property: "",
        type: "",
        maxPrice: 500000
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState("Newest");
    const listingsPerPage = 6;

    // Fetch all properties and vacant units from database
    useEffect(() => {
        const fetchListings = async () => {
            try {
                setLoading(true);
                console.log('Starting to fetch listings...');

                const fetchUnits = async (includeSampleImage: boolean) => {
                    const unitTypeColumns = includeSampleImage
                        ? `
                            id,
                            name,
                            unit_type_name,
                            price_per_unit,
                            sample_image_url
                          `
                        : `
                            id,
                            name,
                            unit_type_name,
                            price_per_unit
                          `;

                    return supabase
                        .from('units')
                        .select(`
                            id,
                            unit_number,
                            status,
                            property_id,
                            unit_type_id,
                            price,
                            image_url,
                            properties(
                                id,
                                name,
                                location,
                                amenities,
                                description,
                                image_url
                            ),
                            property_unit_types(
                                ${unitTypeColumns}
                            )
                        `)
                        .in('status', ['available', 'vacant'])
                        .order('created_at', { ascending: false });
                };

                // Fetch vacant units with all related info (with compatibility fallback)
                let { data: unitsData, error: unitsError } = await fetchUnits(true);
                if (unitsError && String(unitsError.message || '').toLowerCase().includes('sample_image_url')) {
                    const fallback = await fetchUnits(false);
                    unitsData = fallback.data;
                    unitsError = fallback.error;
                }
                
                if (unitsError) {
                    console.error('Units fetch error:', unitsError);
                    throw unitsError;
                }
                
                console.log('Units data received:', unitsData);

                const propertiesMap = new Map<string, any>();
                const unitTypesMap = new Map<string, any>();

                (unitsData || []).forEach((unit: any) => {
                    const unitProperty = Array.isArray(unit.properties) ? unit.properties[0] : unit.properties;
                    if (unitProperty?.id && !propertiesMap.has(unitProperty.id)) {
                        propertiesMap.set(unitProperty.id, unitProperty);
                    }

                    const unitType = Array.isArray(unit.property_unit_types) ? unit.property_unit_types[0] : unit.property_unit_types;
                    if (unitType?.id && !unitTypesMap.has(unitType.id)) {
                        unitTypesMap.set(unitType.id, unitType);
                    }
                });

                setProperties(Array.from(propertiesMap.values()));
                setUnitTypes(Array.from(unitTypesMap.values()));
                
                // Transform database data into listing format
                const listings = (unitsData || []).map((unit: any) => {
                    const unitProperty = Array.isArray(unit.properties) ? unit.properties[0] : unit.properties;
                    const prop = unitProperty || {};
                    
                    // Parse amenities if it's a string
                    let amenities: string[] = [];
                    if (typeof prop.amenities === 'string') {
                        try {
                            amenities = JSON.parse(prop.amenities);
                        } catch {
                            amenities = prop.amenities ? prop.amenities.split(',').map((a: string) => a.trim()) : [];
                        }
                    } else if (Array.isArray(prop.amenities)) {
                        amenities = prop.amenities;
                    }
                    
                    // Fallback to our mapped unit types if the embedded object is incomplete or an array
                    let ut = unit.property_unit_types;
                    if (Array.isArray(ut)) ut = ut[0];
                    if (!ut || (!ut.unit_type_name && !ut.name)) {
                        ut = unitTypesMap.get(unit.unit_type_id) || ut || {};
                    }

                    const typeName = ut.unit_type_name || ut.name || "Unit";

                    const parseImageList = (value: any): string[] => {
                        if (!value) return [];
                        if (Array.isArray(value)) return value.filter(Boolean);
                        if (typeof value === 'string') {
                            try {
                                const parsed = JSON.parse(value);
                                if (Array.isArray(parsed)) return parsed.filter(Boolean);
                            } catch {
                                return [value].filter(Boolean);
                            }
                        }
                        return [];
                    };

                    const unitImages = parseImageList(unit.image_url);
                    const unitTypeSampleImages = parseImageList(ut.sample_image_url);
                    const propertyImages = parseImageList(prop.image_url);

                    // Keep unit cards consistent by using the shared unit-type image first.
                    const galleryImages = unitTypeSampleImages.length > 0
                        ? unitTypeSampleImages
                        : propertyImages.length > 0
                            ? propertyImages
                            : unitImages;
                    const thumbnail = galleryImages[0] || propertyImages[0] || DEFAULT_UNIT_IMAGE;

                    return {
                        id: unit.id,
                        unitNumber: unit.unit_number,
                        title: prop.name || "Property",
                        type: typeName,
                        typeId: ut.id || unit.unit_type_id,
                        rawStatus: unit.status,
                        price: Number(unit.price ?? ut.price_per_unit ?? 0),
                        floor: "Available",
                        rating: 4.5,
                        location: prop.location || "Not specified",
                        propertyName: prop.name,
                        propertyId: unit.property_id,
                        beds: parseInt(typeName?.split(' ')[0] || '0'),
                        baths: 1,
                        sqft: 0,
                        featured: false,
                        amenities: amenities.slice(0, 5),
                        description: prop.description || 'Premium rental unit with modern amenities and excellent facilities.',
                        gallery: galleryImages.length > 0 ? galleryImages : [thumbnail],
                        thumbnail,
                    };
                });
                
                console.log('Final listings:', listings);
                setAllListings(listings);
                
            } catch (error) {
                console.error('Error fetching listings:', error);
                setAllListings([]);
                setProperties([]);
                setUnitTypes([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchListings();
    }, []);
    
    // Derived State for Filtering
    const filteredListings = useMemo(() => {
        const filtered = allListings.filter(item => {
            const matchesProperty = !filters.property || item.propertyId === filters.property;
            const matchesType = !filters.type || item.typeId === filters.type;
            const matchesPrice = item.price <= (filters.maxPrice || 500000);

            return matchesProperty && matchesType && matchesPrice;
        });
        
        const sorted = [...filtered];
        if (sortBy === "Price (Low to High)") {
            sorted.sort((a, b) => a.price - b.price);
        } else if (sortBy === "Price (High to Low)") {
            sorted.sort((a, b) => b.price - a.price);
        } else if (sortBy === "Unit Type") {
            sorted.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
        }
        
        return sorted;
    }, [filters, allListings, sortBy]);
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredListings.length / listingsPerPage);
    const startIndex = (currentPage - 1) * listingsPerPage;
    const currentListings = filteredListings.slice(startIndex, startIndex + listingsPerPage);

    // Color Theme Helper for Cards based on Unit Type
    const getCardTheme = (typeStr: string) => {
        const lower = typeStr?.toLowerCase() || '';
        if (lower.includes('studio') || lower.includes('bedsit')) {
            return {
                cardBg: "bg-orange-50",
                border: "border-transparent",
                header: "border-transparent",
                tag: "bg-orange-500 text-white",
                title: "text-orange-950 hover:text-orange-600",
                price: "text-orange-700",
                icon: "text-orange-500",
                innerBox: "bg-orange-100/50 border-transparent",
                priceBg: "bg-orange-100/50 border-transparent"
            };
        }
        if (lower.includes('1') || lower.includes('one')) {
            return {
                cardBg: "bg-blue-50",
                border: "border-transparent",
                header: "border-transparent",
                tag: "bg-blue-600 text-white",
                title: "text-blue-950 hover:text-blue-600",
                price: "text-blue-700",
                icon: "text-blue-500",
                innerBox: "bg-blue-100/50 border-transparent",
                priceBg: "bg-blue-100/50 border-transparent"
            };
        }
        if (lower.includes('2') || lower.includes('two')) {
            return {
                cardBg: "bg-emerald-50",
                border: "border-transparent",
                header: "border-transparent",
                tag: "bg-emerald-600 text-white",
                title: "text-emerald-950 hover:text-emerald-600",
                price: "text-emerald-700",
                icon: "text-emerald-500",
                innerBox: "bg-emerald-100/50 border-transparent",
                priceBg: "bg-emerald-100/50 border-transparent"
            };
        }
        if (lower.includes('3') || lower.includes('three') || lower.includes('villa') || lower.includes('penthouse')) {
            return {
                cardBg: "bg-indigo-50",
                border: "border-transparent",
                header: "border-transparent",
                tag: "bg-indigo-600 text-white",
                title: "text-indigo-950 hover:text-indigo-600",
                price: "text-indigo-700",
                icon: "text-indigo-500",
                innerBox: "bg-indigo-100/50 border-transparent",
                priceBg: "bg-indigo-100/50 border-transparent"
            };
        }
        // Default (White/Dark Blue/Orange accents)
        return {
            cardBg: "bg-[#efeeee]",
            border: "border-transparent",
            header: "border-transparent",
            tag: "bg-[#154279] text-white",
            title: "text-[#154279] hover:text-[#F96302]",
            price: "text-[#F96302]",
            icon: "text-[#F96302]",
            innerBox: "bg-[#efeeee] border-transparent",
            priceBg: "bg-gradient-to-r from-[#f0f4f8] via-white to-[#e8ecf1] border-transparent"
        };
    };

    return (
        <>
        <GlobalStyles />
        <div
            className="features-flat-dark min-h-screen text-slate-800 font-inter"
            style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                backgroundImage: `linear-gradient(rgba(247, 247, 247, 0.82), rgba(247, 247, 247, 0.82)), url(${FEATURES_BACKGROUND_IMAGE_URL})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >

            {/* MAIN CONTENT AREA */}
            <div
                className={cn(
                    "w-full pb-16 flex flex-col md:flex-row gap-0",
                    removeTopSpacing ? "pt-0 md:pt-0" : "pt-4 md:pt-6"
                )}
                style={{ paddingLeft: "2cm", paddingRight: "2cm" }}
            >
                
                {/* SIDEBAR FILTER */}
                <div className="w-full md:w-[320px] flex-shrink-0">
                    <FilterSidebar filters={filters} setFilters={setFilters} allListings={allListings} loading={loading} properties={properties} unitTypes={unitTypes} />
                    
                    {/* Promo Banner */}
                    <div className="mt-6 bg-[#F96302] rounded-none p-5 text-white  hidden md:block shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap size={18} />
                            <h4 className="font-semibold text-base">Move In Special!</h4>
                        </div>
                        <p className="text-sm opacity-90 mb-4 font-normal">Get 50% OFF your first month's rent when you sign a lease for Wing A units.</p>
                        <button className="bg-[#efeeee] text-[#F96302] px-4 py-2.5 rounded-none font-medium text-sm hover:bg-[#efeeee] transition-colors w-full shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]">
                            View Details
                        </button>
                    </div>
                </div>

                {/* LISTINGS GRID */}
                <div className="flex-1 px-2 md:px-4 lg:px-5">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-px w-8 bg-[#F96302]"></div>
                                <span className="text-xs font-medium text-[#F96302]">Available Properties</span>
                            </div>
                            <h3 className="font-semibold text-xl text-[#154279]">
                                Available Units
                            </h3>
                            <p className="text-slate-500 text-sm mt-1 font-normal">
                                {filteredListings.length} units matching your criteria
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border border-transparent  rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-[#F96302] bg-[#efeeee] font-medium text-slate-700 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]"
                            >
                                <option value="Newest">Sort by: Newest</option>
                                <option value="Price (Low to High)">Sort by: Price (Low to High)</option>
                                <option value="Price (High to Low)">Sort by: Price (High to Low)</option>
                                <option value="Unit Type">Sort by: Unit Type</option>
                            </select>
                        </div>
                    </div>

                    {currentListings.length === 0 ? (
                        <div className="bg-[#efeeee] p-10 text-center rounded-none  border-transparent border-transparent shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                            <h3 className="text-lg font-semibold text-slate-400 mb-2">No units match your criteria.</h3>
                            <button 
                                onClick={()=>setFilters({property:"", type:"", maxPrice:500000})} 
                                className="text-[#F96302] font-medium hover:underline text-sm"
                            >
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {currentListings.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                      className={cn("rounded-none overflow-hidden  hover: group flex flex-col transition-all duration-300", getCardTheme(item.type).cardBg, getCardTheme(item.type).border)}
                                  >
                                    <div className={cn("relative h-44 overflow-hidden cursor-pointer", getCardTheme(item.type).header)} onClick={() => setSelectedItem(item)}>
                                        <img
                                            src={item.thumbnail || DEFAULT_UNIT_IMAGE}
                                            alt={item.title || item.propertyName || 'Available Unit'}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            onError={(event) => {
                                                (event.target as HTMLImageElement).src = DEFAULT_UNIT_IMAGE;
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
                                        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                                            <div className={cn("text-[9px] font-bold px-3 py-1.5 uppercase tracking-[0.15em] inline-block", getCardTheme(item.type).tag)}>
                                                AVAILABLE
                                            </div>
                                            {item.featured && (
                                                <div className="bg-[#F96302] text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-[0.15em] inline-block">
                                                    Featured
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-3 left-3">
                                            <span className="bg-[#efeeee]/90 text-[#154279] text-[10px] px-2.5 py-1 rounded-none font-bold uppercase tracking-wide">
                                                {item.type}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h4
                                            className={cn("font-bold text-sm cursor-pointer transition-colors leading-tight mb-2 line-clamp-1 uppercase tracking-tight", getCardTheme(item.type).title)}
                                            onClick={() => setSelectedItem(item)}
                                        >
                                            {item.propertyName}
                                        </h4>

                                        <div className="text-[10px] text-slate-500 mb-4 flex items-center gap-2 font-semibold uppercase tracking-wide">
                                            <MapPin size={12} className={getCardTheme(item.type).icon}/> {item.location}
                                        </div>

                                        <div className="flex flex-col gap-2 mb-4">
                                            <div className={cn("flex items-center gap-2 p-2 rounded-none", getCardTheme(item.type).innerBox)}>
                                                <Home size={14} className={getCardTheme(item.type).icon} />
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider w-20">Property:</span>
                                                <span className="text-xs font-semibold text-[#154279] line-clamp-1">{item.propertyName}</span>
                                            </div>
                                            <div className={cn("flex items-center gap-2 p-2 rounded-none", getCardTheme(item.type).innerBox)}>
                                                <BedDouble size={14} className={getCardTheme(item.type).icon} />
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider w-20">Unit Type:</span>
                                                <span className="text-xs font-semibold text-[#154279]">{item.type}</span>
                                            </div>
                                            <div className={cn("flex items-center gap-2 p-2 rounded-none", getCardTheme(item.type).innerBox)}>
                                                <FileText size={14} className={getCardTheme(item.type).icon} />
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider w-20">Unit No:</span>
                                                <span className="text-xs font-semibold text-[#154279]">{item.unitNumber}</span>
                                            </div>
                                        </div>

                                        {/* Price Section - Like Pricing Page */}
                                        <div className={cn("pt-4 mt-auto -mx-5 -mb-5 p-4", getCardTheme(item.type).priceBg)}>
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className={cn("text-[9px] font-bold uppercase tracking-[0.15em]", getCardTheme(item.type).price)}>Rent</span>
                                                    <div className="flex items-baseline leading-none mt-1">
                                                        <span className={cn("text-[10px] font-bold mr-1", getCardTheme(item.type).price)}>KES</span>
                                                        <span className={cn("text-xl font-bold tracking-tight", getCardTheme(item.type).price)}>{item.price.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            const params = new URLSearchParams({
                                                                propertyId: item.propertyId || '',
                                                                unitId: item.id || '',
                                                                propertyName: item.propertyName || '',
                                                                unitNumber: item.unitNumber || '',
                                                                location: item.location || '',
                                                                unitTypeId: item.typeId ? String(item.typeId) : '',
                                                                unitTypeName: item.type || '',
                                                                rent: item.price ? String(item.price) : '',
                                                                status: item.rawStatus || 'available'
                                                            });
                                                            navigate(`/applications?${params.toString()}`);
                                                        }}
                                                        className="px-3 py-2 bg-[#F96302] hover:bg-[#e55a00] text-white font-bold text-[9px] uppercase tracking-[0.1em] transition-all flex items-center gap-1 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#ab4401,inset_-2px_-2px_4px_#ff8203]"
                                                    >
                                                        Apply <ArrowRight size={12}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => setSelectedItem(item)}
                                                        className="px-3 py-2 bg-[#154279] hover:bg-[#11325c] text-white font-bold text-[9px] uppercase tracking-[0.1em] transition-all flex items-center gap-1 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#0e2a4f,inset_-2px_-2px_4px_#1c5aa3]"
                                                    >
                                                        View <ChevronRight size={12}/>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                    
                    {/* Pagination */}
                    {filteredListings.length > 0 && (
                        <div className="mt-10 flex justify-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(1)}
                                className={cn(
                                    "w-10 h-10 rounded-none font-medium text-sm transition-all",
                                    currentPage === 1 
                                        ? 'bg-[#154279] text-white' 
                                        : 'bg-[#efeeee] border-transparent border-transparent  text-slate-600 hover:bg-[#efeeee]'
                                )}
                            >
                                1
                            </button>
                            <button 
                                onClick={() => setCurrentPage(2)}
                                className={cn(
                                    "w-10 h-10 rounded-none font-medium text-sm transition-all",
                                    currentPage === 2 
                                        ? 'bg-[#154279] text-white' 
                                        : 'bg-[#efeeee] border-transparent border-transparent  text-slate-600 hover:bg-[#efeeee]'
                                )}
                            >
                                2
                            </button>
                            {totalPages > 2 && (
                                <button 
                                    onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                    className="px-4 h-10 rounded-none bg-[#efeeee] border-transparent border-transparent  text-slate-600 font-medium text-sm hover:bg-[#efeeee] transition-all flex items-center gap-2 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]"
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* FULL SCREEN DETAILS MODAL */}
            <AnimatePresence>
                {selectedItem && (
                    <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
                )}
            </AnimatePresence>
        </div>
        </>
    );
}
