import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MapPin, BedDouble, Bath, X, Search, ShoppingCart, Menu,
    ChevronRight, CheckCircle2, Maximize, User, Phone, 
    ArrowRight, PlayCircle, Home, Shield, Zap, Wifi, Clock, FileText
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

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    .font-inter { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    
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
        <div className="bg-gradient-to-br from-[#f0f4f8] via-white to-[#e8ecf1] p-4 md:p-6 rounded-lg md:rounded-none shadow-lg md:shadow-2xl border-2 border-slate-300 font-inter overflow-hidden mb-4 md:mb-0">
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
                <div className="md:hidden bg-slate-200 p-1.5 rounded-full text-[#154279]">
                   <ChevronRight size={14} className={cn("transition-transform duration-300", isMobileOpen ? "rotate-90" : "")} />
                </div>
            </div>
            
            <div className={cn("mt-4 md:mt-0 space-y-4 md:space-y-5", isMobileOpen ? "block" : "hidden md:block")}>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-3 border-[#F96302] border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="text-[9px] md:text-[10px] font-bold text-[#154279] uppercase tracking-[0.15em] mb-1.5 md:mb-2 block">🏢 Select Property</label>
                            <select 
                                name="property"
                                value={filters.property || ""}
                                onChange={handleChange}
                                className="w-full bg-white border-2 border-slate-300 p-2.5 md:p-3 rounded-none text-xs md:text-sm text-slate-700 focus:ring-2 focus:ring-[#F96302]/20 focus:border-[#F96302] outline-none cursor-pointer"
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
                                className="w-full bg-white border-2 border-slate-300 p-2.5 md:p-3 rounded-none text-xs md:text-sm text-slate-700 focus:ring-2 focus:ring-[#F96302]/20 focus:border-[#F96302] outline-none cursor-pointer"
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
                                className="w-full h-2 bg-slate-300 rounded-none appearance-none cursor-pointer accent-[#F96302]"
                            />
                            <div className="flex justify-between text-[10px] text-[#154279] mt-2 font-bold">
                                <span>10k</span>
                                <span>500k+</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="text-[10px] font-bold text-[#154279] uppercase tracking-[0.15em] mb-3 block">📊 Vacant Units Available</label>
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <p className="text-sm font-bold text-[#F96302]">{allListings.length} Units Available</p>
                                <p className="text-xs text-slate-600 mt-1">Properties: {properties.length}</p>
                                <p className="text-xs text-slate-600">Types: {unitTypes.length}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setFilters({ property: "", type: "", maxPrice: 500000 })}
                            className="w-full bg-[#154279] hover:bg-[#F96302] text-white font-bold py-3 rounded-none text-[10px] uppercase tracking-[0.15em] transition-all shadow-lg">
                            Reset Filters
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const DetailModal = ({ item, onClose }: { item: any, onClose: () => void }) => {
    const [manager, setManager] = React.useState<any>(null);
    const [activeImageIndex, setActiveImageIndex] = React.useState(0);

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
            <div className="sticky top-0 bg-white shadow-sm z-50 px-4 md:px-8 h-16 flex items-center justify-between border-b border-slate-200/60">
                <div className="font-semibold text-xl text-[#154279] tracking-tight">AYDEN<span className="text-[#F96302]">HOMES</span></div>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-[#F96302] hover:text-white flex items-center justify-center transition-all"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="max-w-7xl mx-auto bg-white min-h-screen pb-20 shadow-lg rounded-b-xl">
                {/* 1. Title Header Section */}
                <div className="p-6 md:p-10 pb-6 flex flex-col md:flex-row justify-between items-start border-b border-slate-200/60 bg-slate-50/50 rounded-t-xl">
                    <div>
                        <div className="flex gap-2 mb-4">
                            <span className="bg-[#F96302] text-white text-xs font-medium px-3 py-1.5 rounded-full">For Rent</span>
                            {item.featured && <span className="bg-[#154279] text-white text-xs font-medium px-3 py-1.5 rounded-full">Featured</span>} 
                        </div>
                        <h1 className="text-2xl md:text-4xl font-semibold text-[#154279] mb-3 tracking-tight leading-tight">{item.title}</h1>
                        <p className="text-slate-500 flex items-center gap-2 text-sm font-normal">
                            <MapPin size={16} className="text-[#F96302]"/> {item.location} <span className="text-slate-300">|</span> {item.floor}
                        </p>
                    </div>
                    <div className="mt-6 md:mt-0 text-left md:text-right bg-[#154279] p-6 rounded-xl shadow-sm">
                        <div className="text-xs font-medium text-white/70 mb-1">Monthly Rent</div>
                        <div className="text-2xl md:text-3xl font-bold text-white leading-none">KES {item.price.toLocaleString()}</div>
                        <p className="text-[#F96302] font-medium text-sm mt-1">All Inclusive</p>
                    </div>
                </div>

                {/* 2. Main Image Section */}
                <div className="p-6 md:p-10 pt-4">
                    {item.gallery && item.gallery.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-sm relative group">
                                <img 
                                    src={item.gallery[activeImageIndex]} 
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none"></div>
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                    <span className="bg-white/90 text-[#154279] text-xs px-3 py-1.5 rounded-full font-bold backdrop-blur-sm">
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
                                                "w-24 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all",
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
                        <div className="w-full bg-[#154279]/5 rounded-xl border border-[#154279]/10 p-6 flex items-center justify-center h-24">
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
                        <div className="bg-slate-50 p-6 rounded-xl flex flex-wrap gap-8 md:gap-12 mb-10 border border-slate-200/60">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#154279]/5 p-3 rounded-lg">
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
                                <div className="flex items-center gap-3 text-slate-700 text-sm font-medium bg-slate-50 rounded-lg p-4 border border-slate-100">
                                    <Home size={20} className="text-[#F96302]"/>
                                    <div>
                                        <span className="block text-[10px] uppercase text-slate-500 font-bold mb-0.5">Property Name</span>
                                        <span className="text-[#154279]">{item.propertyName}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700 text-sm font-medium bg-slate-50 rounded-lg p-4 border border-slate-100">
                                    <BedDouble size={20} className="text-[#F96302]"/>
                                    <div>
                                        <span className="block text-[10px] uppercase text-slate-500 font-bold mb-0.5">Unit Type</span>
                                        <span className="text-[#154279]">{item.type}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700 text-sm font-medium bg-slate-50 rounded-lg p-4 border border-slate-100">
                                    <FileText size={20} className="text-[#F96302]"/>
                                    <div>
                                        <span className="block text-[10px] uppercase text-slate-500 font-bold mb-0.5">Unit Number</span>
                                        <span className="text-[#154279]">{item.unitNumber || "Not Specified"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700 text-sm font-medium bg-slate-50 rounded-lg p-4 border border-slate-100">
                                    <Clock size={20} className="text-[#F96302]"/>
                                    <div>
                                        <span className="block text-[10px] uppercase text-slate-500 font-bold mb-0.5">Status</span>
                                        <span className="text-emerald-600 font-bold uppercase tracking-wider">{item.floor}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Property Details Table */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200/60">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-px w-8 bg-[#F96302]"></div>
                                <h3 className="text-lg font-semibold text-[#154279]">Technical Specs</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex justify-between bg-slate-50 rounded-lg p-3">
                                    <span className="font-medium text-slate-500 text-sm">Unit ID</span>
                                    <span className="font-semibold text-[#154279]">{item.id}</span>
                                </div>
                                <div className="flex justify-between bg-slate-50 rounded-lg p-3">
                                    <span className="font-medium text-slate-500 text-sm">Monthly Fee</span>
                                    <span className="font-semibold text-[#F96302]">KES {item.price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between bg-slate-50 rounded-lg p-3">
                                    <span className="font-medium text-slate-500 text-sm">Unit Type</span>
                                    <span className="font-semibold text-[#154279]">{item.type}</span>
                                </div>
                                <div className="flex justify-between bg-slate-50 rounded-lg p-3">
                                    <span className="font-medium text-slate-500 text-sm">Year Built</span>
                                    <span className="font-semibold text-[#154279]">2024</span>
                                </div>
                                <div className="flex justify-between bg-slate-50 rounded-lg p-3">
                                    <span className="font-medium text-slate-500 text-sm">Status</span>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 text-xs font-medium rounded-full">Available</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Contact Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#154279] rounded-xl p-6 shadow-sm sticky top-24">
                            <div className="flex items-center gap-2 mb-5">
                                <Clock size={18} className="text-[#F96302]" />
                                <h4 className="text-lg font-semibold text-white">Schedule Visit</h4>
                            </div>
                            <div className="flex items-center gap-4 mb-6 bg-white/10 p-4 rounded-lg">
                                <div className="w-12 h-12 bg-white/10 rounded-lg overflow-hidden shrink-0">
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
                                    <input type="text" placeholder="John Doe" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#F96302] outline-none transition-all"/>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/70 mb-1.5 block">Email Address</label>
                                    <input type="email" placeholder="john@example.com" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#F96302] outline-none transition-all"/>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/70 mb-1.5 block">Message</label>
                                    <textarea rows={3} placeholder="I want to see this unit..." className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#F96302] outline-none transition-all resize-none"></textarea>
                                </div>
                                
                                <button className="w-full bg-[#F96302] hover:bg-[#e55a00] text-white font-medium py-3 rounded-lg transition-all text-sm">
                                    Reserve My Tour
                                </button>
                                <button className="w-full bg-transparent border border-white/30 text-white font-medium py-3 rounded-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm">
                                    <Phone size={16} className="text-[#F96302]"/> Direct Line
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
};

// --- 4. MAIN PAGE COMPONENT ---
export default function AydenTowersListing() {
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
                    const galleryImages = unitImages.length > 0
                        ? unitImages
                        : unitTypeSampleImages.length > 0
                            ? unitTypeSampleImages
                            : propertyImages;

                    return {
                        id: unit.id,
                        unitNumber: unit.unit_number,
                        title: prop.name || "Property",
                        type: typeName,
                        typeId: ut.id || unit.unit_type_id,
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
                        gallery: galleryImages
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
    // Current Property Data based on filter
    const activeProperty = useMemo(() => {
        if (!filters.property) return null;
        return properties.find(p => p.id === filters.property) || null;
    }, [filters.property, properties]);

    const [propertyManager, setPropertyManager] = useState<any>(null);

    useEffect(() => {
        const fetchManager = async () => {
            if (!activeProperty?.id) {
                setPropertyManager(null);
                return;
            }
            const propId = activeProperty.id;

            const { data: assignments } = await supabase
                .from('property_manager_assignments')
                .select('property_manager_id')
                .eq('property_id', propId)
                .eq('status', 'active')
                .limit(1);

            let mId = assignments?.[0]?.property_manager_id;

            if (!mId) {
                const { data: caretakers } = await supabase
                    .from('caretakers')
                    .select('user_id')
                    .eq('property_id', propId)
                    .eq('status', 'active')
                    .limit(1);
                mId = caretakers?.[0]?.user_id;
            }

            if (mId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, phone, role, avatar_url')
                    .eq('id', mId)
                    .single();
                setPropertyManager(profile);
            } else {
                setPropertyManager(null);
            }
        };
        fetchManager();
    }, [activeProperty?.id]);

    const heroImage = activeProperty?.image_url || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1600";
    const heroTitle = activeProperty?.name ? activeProperty.name.toUpperCase() : "FEATURED PROPERTY";
    const heroLocation = activeProperty?.location || "Nairobi West, Kenya";
    const heroDescName = activeProperty?.name || "this property";
    const heroDesc = activeProperty?.description || `Discover ${heroDescName} — a premier rental residential complex offering diverse living options.`;
    
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
            cardBg: "bg-white",
            border: "border-transparent",
            header: "border-transparent",
            tag: "bg-[#154279] text-white",
            title: "text-[#154279] hover:text-[#F96302]",
            price: "text-[#F96302]",
            icon: "text-[#F96302]",
            innerBox: "bg-slate-50 border-transparent",
            priceBg: "bg-gradient-to-r from-[#f0f4f8] via-white to-[#e8ecf1] border-transparent"
        };
    };

    return (
        <>
        <GlobalStyles />
        <div className="min-h-screen bg-slate-50 text-slate-800 font-inter" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            
            {/* --- HERO SECTION (DIY Rental Guide Style) --- */}
            <section className="bg-slate-50 pt-24 pb-12 lg:pt-28 lg:pb-16">
                <div className="max-w-[1400px] mx-auto px-4">
                    
                    {/* Page Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 pb-6 border-b border-slate-200/60"
                    >
                        <h1 className="text-xl sm:text-2xl md:text-4xl font-semibold text-[#154279] leading-tight tracking-tight">
                            Available Properties & Units
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm font-normal">
                            Browse {allListings.length} vacant units across our portfolio of premium properties
                        </p>
                    </motion.div>

                    {/* Featured Hero - Image Card + Text Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Image Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="lg:col-span-7 h-[280px] lg:h-[380px] relative rounded-none overflow-hidden"
                        >
                            <img
                                src={heroImage}
                                alt={heroDescName}
                                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                            />
                        </motion.div>

                        {/* Text Content - No Card */}
                        <div className="lg:col-span-5 flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px w-8 bg-[#F96302]"></div>
                                <span className="text-xs font-medium text-[#F96302]">Signature Living</span>
                            </div>
                            <h2 className="text-xl lg:text-3xl font-semibold text-[#154279] leading-tight tracking-tight mb-4">
                                Modern Living<br/>
                                <span className="text-[#F96302]">Perfected.</span>
                            </h2>

                            <p className="text-slate-600 text-sm leading-relaxed mb-6 font-normal">
                                {heroDesc}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button className="bg-[#F96302] text-white py-3 px-6 rounded-lg font-medium text-sm hover:bg-[#e55a00] transition-all flex items-center justify-center gap-2">
                                    Explore Units <ArrowRight size={16} />
                                </button>
                                {propertyManager?.phone ? (
                                    <a href={`tel:${propertyManager.phone}`} className="border border-slate-200 text-[#154279] py-3 px-6 rounded-lg font-medium text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                        <Phone size={16} className="text-[#F96302]" /> Contact Manager
                                    </a>
                                ) : (
                                    <button className="border border-slate-200 text-[#154279] py-3 px-6 rounded-lg font-medium text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                        <Phone size={16} className="text-[#F96302]" /> Contact Manager
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* --- END HERO SECTION --- */}

            {/* MAIN CONTENT AREA */}
            <div className="max-w-[1400px] mx-auto px-4 pb-16 flex flex-col md:flex-row gap-6">
                
                {/* SIDEBAR FILTER */}
                <div className="w-full md:w-[280px] flex-shrink-0">
                    <FilterSidebar filters={filters} setFilters={setFilters} allListings={allListings} loading={loading} properties={properties} unitTypes={unitTypes} />
                    
                    {/* Promo Banner */}
                    <div className="mt-6 bg-[#F96302] rounded-xl p-5 text-white shadow-sm hidden md:block">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap size={18} />
                            <h4 className="font-semibold text-base">Move In Special!</h4>
                        </div>
                        <p className="text-sm opacity-90 mb-4 font-normal">Get 50% OFF your first month's rent when you sign a lease for Wing A units.</p>
                        <button className="bg-white text-[#F96302] px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors w-full">
                            View Details
                        </button>
                    </div>
                </div>

                {/* LISTINGS GRID */}
                <div className="flex-1">
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
                                className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#F96302] bg-white font-medium text-slate-700"
                            >
                                <option value="Newest">Sort by: Newest</option>
                                <option value="Price (Low to High)">Sort by: Price (Low to High)</option>
                                <option value="Price (High to Low)">Sort by: Price (High to Low)</option>
                                <option value="Unit Type">Sort by: Unit Type</option>
                            </select>
                        </div>
                    </div>

                    {currentListings.length === 0 ? (
                        <div className="bg-white p-10 text-center rounded-xl shadow-sm border border-slate-200/60">
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
                                      className={cn("rounded-none overflow-hidden shadow-2xl hover:shadow-xl group flex flex-col transition-all duration-300", getCardTheme(item.type).cardBg, getCardTheme(item.type).border)}
                                  >
                                          {/* Minimal Unit Card Top (No Image) */}
                                          <div className={cn("p-4 cursor-pointer", getCardTheme(item.type).header)} onClick={() => setSelectedItem(item)}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className={cn("text-[9px] font-bold px-3 py-1.5 uppercase tracking-[0.15em] inline-block", getCardTheme(item.type).tag)}>
                                                    AVAILABLE
                                                </div>
                                                {item.featured && (
                                                    <div className="bg-[#F96302] text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-[0.15em] inline-block">
                                                        Featured
                                                    </div>
                                                )}
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
                                            <div className={cn("flex items-center gap-2 p-2 rounded-lg", getCardTheme(item.type).innerBox)}>
                                                <Home size={14} className={getCardTheme(item.type).icon} />
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider w-20">Property:</span>
                                                <span className="text-xs font-semibold text-[#154279] line-clamp-1">{item.propertyName}</span>
                                            </div>
                                            <div className={cn("flex items-center gap-2 p-2 rounded-lg", getCardTheme(item.type).innerBox)}>
                                                <BedDouble size={14} className={getCardTheme(item.type).icon} />
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider w-20">Unit Type:</span>
                                                <span className="text-xs font-semibold text-[#154279]">{item.type}</span>
                                            </div>
                                            <div className={cn("flex items-center gap-2 p-2 rounded-lg", getCardTheme(item.type).innerBox)}>
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
                                                                location: item.location || ''
                                                            });
                                                            window.location.href = `/applications?${params.toString()}`;
                                                        }}
                                                        className="px-3 py-2 bg-[#F96302] hover:bg-[#e55a00] text-white font-bold text-[9px] uppercase tracking-[0.1em] transition-all flex items-center gap-1 shadow-lg"
                                                    >
                                                        Apply <ArrowRight size={12}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => setSelectedItem(item)}
                                                        className="px-3 py-2 bg-[#154279] hover:bg-[#11325c] text-white font-bold text-[9px] uppercase tracking-[0.1em] transition-all flex items-center gap-1 shadow-lg"
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
                                    "w-10 h-10 rounded-lg font-medium text-sm transition-all",
                                    currentPage === 1 
                                        ? 'bg-[#154279] text-white' 
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                )}
                            >
                                1
                            </button>
                            <button 
                                onClick={() => setCurrentPage(2)}
                                className={cn(
                                    "w-10 h-10 rounded-lg font-medium text-sm transition-all",
                                    currentPage === 2 
                                        ? 'bg-[#154279] text-white' 
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                )}
                            >
                                2
                            </button>
                            {totalPages > 2 && (
                                <button 
                                    onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                    className="px-4 h-10 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
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
