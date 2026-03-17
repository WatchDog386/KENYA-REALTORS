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

// --- 2. DATA - FETCHED FROM DATABASE ---
// All property and unit data is now fetched from Supabase in real-time
// See fetchListings function in the main component

// --- 3. SUB-COMPONENTS ---

const FilterSidebar = ({ filters, setFilters, allListings, loading }: any) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFilters((prev: any) => ({ ...prev, [name]: value }));
    };

    // Get unique properties from listings
    const uniqueProperties = Array.from(
        new Map(
            allListings
                .filter((item: any) => item.propertyName)
                .map((item: any) => [item.propertyName, { id: item.propertyId, name: item.propertyName }])
        ).values()
    );

    // Get unique unit types from listings
    const uniqueUnitTypes = Array.from(
        new Map(
            allListings
                .filter((item: any) => item.type && item.price)
                .map((item: any) => [item.type, { type: item.type, price: item.price }])
        ).values()
    );

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
                                <option value="">All Properties ({allListings.length})</option>
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
                                <option value="All">All Unit Types</option>
                                {uniqueUnitTypes.map((unitType: any, idx) => (
                                    <option key={idx} value={unitType.type}>
                                        {unitType.type} - KES {(unitType.price || 0).toLocaleString()}
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
                                <p className="text-xs text-slate-600 mt-1">Properties: {uniqueProperties.length}</p>
                            </div>
                        </div>

                        <button className="w-full bg-[#154279] hover:bg-[#F96302] text-white font-bold py-3 rounded-none text-[10px] uppercase tracking-[0.15em] transition-all shadow-lg">
                            Search Availability
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const DetailModal = ({ item, onClose }: { item: any, onClose: () => void }) => {
    if (!item) return null;

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

                {/* 2. Gallery Section */}
                <div className="p-6 md:p-10 pt-8">
                    <div className="gallery-grid rounded-xl overflow-hidden">
                        <div className="gallery-main relative group overflow-hidden">
                            <img src={item.gallery[0]} alt="Main" className="gallery-img transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur px-4 py-2 rounded-lg text-xs font-medium shadow-lg flex items-center gap-2 cursor-pointer hover:bg-[#F96302] hover:text-white transition-all">
                                <Maximize size={14}/> View Full Gallery
                            </div>
                        </div>
                        <div className="gallery-sub">
                            <img src={item.gallery[1]} alt="Sub 1" className="gallery-img rounded-tr-xl" />
                            <img src={item.gallery[2]} alt="Sub 2" className="gallery-img rounded-br-xl" />
                        </div>
                    </div>
                </div>

                {/* 3. Main Content & Sidebar */}
                <div className="p-6 md:p-10 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* LEFT COLUMN: Details */}
                    <div className="lg:col-span-2">
                        {/* Quick Overview Badges */}
                        <div className="bg-slate-50 p-6 rounded-xl flex flex-wrap gap-8 md:gap-12 mb-10 border border-slate-200/60">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#154279]/5 p-3 rounded-lg">
                                    <BedDouble size={24} className="text-[#F96302]"/>
                                </div>
                                <div>
                                    <span className="block font-bold text-2xl text-[#154279] leading-none">{item.beds}</span>
                                    <span className="text-xs text-slate-500 font-medium">Bedrooms</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-[#154279]/5 p-3 rounded-lg">
                                    <Bath size={24} className="text-[#F96302]"/>
                                </div>
                                <div>
                                    <span className="block font-bold text-2xl text-[#154279] leading-none">{item.baths}</span>
                                    <span className="text-xs text-slate-500 font-medium">Bathrooms</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-[#154279]/5 p-3 rounded-lg">
                                    <Maximize size={24} className="text-[#F96302]"/>
                                </div>
                                <div>
                                    <span className="block font-bold text-2xl text-[#154279] leading-none">{item.sqft}</span>
                                    <span className="text-xs text-slate-500 font-medium">Sq Ft</span>
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
                                Living at <strong className="text-[#154279]">Ayden Home Towers</strong> offers a unique blend of community and privacy. 
                                Enjoy dedicated maintenance teams, secure biometric access, and a community app for all your utility payments.
                            </p>
                        </div>

                        {/* Amenities */}
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px w-8 bg-[#F96302]"></div>
                                <h3 className="text-lg font-semibold text-[#154279]">Amenities</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {item.amenities.map((am:string, i:number) => (
                                    <div key={i} className="flex items-center gap-3 text-slate-700 text-sm font-medium bg-slate-50 rounded-lg p-3">
                                        <CheckCircle2 size={16} className="text-[#F96302]"/>
                                        {am}
                                    </div>
                                ))}
                                <div className="flex items-center gap-3 text-slate-700 text-sm font-medium bg-slate-50 rounded-lg p-3">
                                    <CheckCircle2 size={16} className="text-[#F96302]"/>
                                    CCTV Security
                                </div>
                                <div className="flex items-center gap-3 text-slate-700 text-sm font-medium bg-slate-50 rounded-lg p-3">
                                    <CheckCircle2 size={16} className="text-[#F96302]"/>
                                    Borehole Water
                                </div>
                                <div className="flex items-center gap-3 text-slate-700 text-sm font-medium bg-slate-50 rounded-lg p-3">
                                    <CheckCircle2 size={16} className="text-[#F96302]"/>
                                    Backup Generator
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
                                    <span className="font-medium text-slate-500 text-sm">Floor Space</span>
                                    <span className="font-semibold text-[#154279]">{item.sqft} Sq Ft</span>
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
                                <div className="w-12 h-12 bg-white/10 rounded-lg overflow-hidden">
                                    <img src="https://i.pravatar.cc/150?u=ayden" alt="Agent" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-medium text-white text-sm">Ayden Office</div>
                                    <div className="text-xs text-[#F96302]">Primary Manager</div>
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
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        property: "",
        type: "All",
        maxPrice: 500000
    });
    const [currentPage, setCurrentPage] = useState(1);
    const listingsPerPage = 3;
    
    // Fetch all properties and vacant units from database
    useEffect(() => {
        const fetchListings = async () => {
            try {
                setLoading(true);
                console.log('Starting to fetch listings...');
                
                // Fetch vacant units with all related info
                const { data: unitsData, error: unitsError } = await supabase
                    .from('units')
                    .select(`
                        id,
                        unit_number,
                        status,
                        property_id,
                        unit_type_id,
                        property_unit_types(
                            id,
                            unit_type_name,
                            price_per_unit
                        )
                    `)
                    .eq('status', 'available')
                    .order('created_at', { ascending: false });
                
                if (unitsError) {
                    console.error('Units fetch error:', unitsError);
                    throw unitsError;
                }
                
                console.log('Units data received:', unitsData);
                
                // Now fetch properties separately
                const propertyIds = (unitsData || []).map((u: any) => u.property_id).filter(Boolean);
                console.log('Property IDs to fetch:', propertyIds);
                
                const { data: propertiesData, error: propertiesError } = await supabase
                    .from('properties')
                    .select('id, name, location, type, image_url, description, amenities')
                    .in('id', propertyIds);
                
                if (propertiesError) {
                    console.error('Properties fetch error:', propertiesError);
                    throw propertiesError;
                }
                
                console.log('Properties data received:', propertiesData);
                
                // Create a map of properties for quick lookup
                const propertiesMap = new Map();
                (propertiesData || []).forEach((prop: any) => {
                    propertiesMap.set(prop.id, prop);
                });
                
                // Transform database data into listing format
                const listings = (unitsData || []).map((unit: any) => {
                    const prop = propertiesMap.get(unit.property_id) || {};
                    const unitType = unit.property_unit_types || {};
                    
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
                    
                    return {
                        id: unit.id,
                        unitNumber: unit.unit_number,
                        title: `${unitType.unit_type_name} at ${prop.name}`,
                        type: unitType.unit_type_name,
                        price: unitType.price_per_unit || 0,
                        floor: "Available",
                        rating: 4.5,
                        location: prop.location || "Not specified",
                        propertyName: prop.name,
                        propertyId: unit.property_id,
                        beds: parseInt(unitType.unit_type_name?.split(' ')[0] || '0'),
                        baths: 1,
                        sqft: 0,
                        featured: false,
                        amenities: amenities.slice(0, 5),
                        description: prop.description || 'Premium rental unit with modern amenities and excellent facilities.',
                        gallery: prop.image_url ? [prop.image_url, "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=800", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800"] : [
                            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200",
                            "https://images.unsplash.com/photo-1512918760383-eda2723ad6e1?q=80&w=800",
                            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=800"
                        ]
                    };
                });
                
                console.log('Final listings:', listings);
                setAllListings(listings);
                
            } catch (error) {
                console.error('Error fetching listings:', error);
                setAllListings([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchListings();
    }, []);
    
    // Derived State for Filtering
    const filteredListings = useMemo(() => {
        return allListings.filter(item => {
            const matchesProperty = filters.property === "" || item.id.includes(filters.property) || item.propertyName.toLowerCase().includes(filters.property?.toLowerCase() || "");
            const matchesType = filters.type === "All" || item.type === filters.type;
            const matchesPrice = item.price <= (filters.maxPrice || 500000);
            
            return matchesProperty && matchesType && matchesPrice;
        });
    }, [filters, allListings]);
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredListings.length / listingsPerPage);
    const startIndex = (currentPage - 1) * listingsPerPage;
    const currentListings = filteredListings.slice(startIndex, startIndex + listingsPerPage);

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
                            Ayden Home Towers
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm font-normal">
                            Discover your perfect home from our selection of 100+ premium rental units
                        </p>
                    </motion.div>

                    {/* Featured Hero - Image Card + Text Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Image Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="lg:col-span-7 h-[280px] lg:h-[380px] relative rounded-none overflow-hidden border border-slate-200"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1600"
                                alt="Ayden Home Towers Exterior"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
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
                                Discover <strong className="text-[#154279]">Ayden Home Towers</strong> — a premier rental residential complex offering diverse living options. With over 100 meticulously designed units ranging from studios to 4-bedroom apartments.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button className="bg-[#F96302] text-white py-3 px-6 rounded-lg font-medium text-sm hover:bg-[#e55a00] transition-all flex items-center justify-center gap-2">
                                    Explore Units <ArrowRight size={16} />
                                </button>
                                <button className="border border-slate-200 text-[#154279] py-3 px-6 rounded-lg font-medium text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    <PlayCircle size={16} className="text-[#F96302]" /> Virtual Tour
                                </button>
                            </div>

                            {/* Gallery Preview */}
                            <div className="mt-6 pt-6 border-t border-slate-200">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-xs font-medium text-slate-500">Gallery Preview</p>
                                    <p className="text-xs font-medium text-[#F96302] cursor-pointer hover:underline flex items-center gap-1">
                                        View All <ChevronRight size={12} />
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-2 h-16">
                                    <div className="relative rounded-lg overflow-hidden cursor-pointer">
                                        <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=400" 
                                             className="w-full h-full object-cover" 
                                             alt="Residential Unit" />
                                    </div>
                                    <div className="relative rounded-lg overflow-hidden cursor-pointer">
                                        <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=400" 
                                             className="w-full h-full object-cover" 
                                             alt="Building Exterior" />
                                    </div>
                                    <div className="relative rounded-lg overflow-hidden cursor-pointer">
                                        <img src="https://images.unsplash.com/photo-1493857671505-72967e2e2760?q=80&w=400" 
                                             className="w-full h-full object-cover" 
                                             alt="Common Area" />
                                    </div>
                                </div>
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
                    <FilterSidebar filters={filters} setFilters={setFilters} allListings={allListings} loading={loading} />
                    
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
                                {loading ? "Loading..." : `${filteredListings.length} units matching your criteria`}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#F96302] bg-white font-medium text-slate-700">
                                <option>Sort by: Newest</option>
                                <option>Sort by: Price (Low to High)</option>
                                <option>Sort by: Price (High to Low)</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white p-10 text-center rounded-xl shadow-sm border border-slate-200/60">
                            <div className="flex justify-center mb-4">
                                <div className="animate-spin h-8 w-8 border-4 border-[#F96302] border-t-transparent rounded-full"></div>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-600">Loading available units...</h3>
                        </div>
                    ) : currentListings.length === 0 ? (
                        <div className="bg-white p-10 text-center rounded-xl shadow-sm border border-slate-200/60">
                            <h3 className="text-lg font-semibold text-slate-400 mb-2">No units match your criteria.</h3>
                            <button 
                                onClick={()=>setFilters({property:"", type:"All", maxPrice:500000})} 
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
                                    className="bg-white rounded-none overflow-hidden border-2 border-slate-300 shadow-2xl hover:shadow-xl group flex flex-col transition-all duration-300 hover:border-[#154279]"
                                >
                                    <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => setSelectedItem(item)}>
                                        <img src={item.gallery[0]} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        
                                        {/* Tag Overlay */}
                                        <div className="absolute top-0 left-0 bg-[#154279] text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-[0.15em] z-10">
                                            {item.type}
                                        </div>

                                        {item.featured && (
                                            <div className="absolute top-0 right-0 bg-[#F96302] text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-[0.15em] z-10">
                                                Featured
                                            </div>
                                        )}
                                        
                                        {/* Bottom gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#154279]/80 via-transparent to-transparent"></div>
                                        
                                        <div className="absolute bottom-3 right-3 bg-white/90 text-[#154279] px-2.5 py-1 rounded-none text-[10px] font-bold flex items-center gap-1.5 z-10 uppercase tracking-wide">
                                            <Maximize size={12} className="text-[#F96302]"/> {item.gallery.length} Photos
                                        </div>
                                    </div>
                                    
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h4 
                                            className="font-bold text-sm text-[#154279] cursor-pointer hover:text-[#F96302] transition-colors leading-tight mb-2 line-clamp-1 uppercase tracking-tight"
                                            onClick={() => setSelectedItem(item)}
                                        >
                                            {item.title}
                                        </h4>

                                        <div className="text-[10px] text-slate-500 mb-4 flex items-center gap-2 font-semibold uppercase tracking-wide">
                                            <MapPin size={12} className="text-[#F96302]"/> {item.location}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {item.amenities.slice(0, 3).map((am:string, i:number) => (
                                                <span key={i} className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-1 rounded-none uppercase">
                                                    {am}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Price Section - Like Pricing Page */}
                                        <div className="border-t-2 border-[#154279] pt-4 mt-auto bg-gradient-to-r from-[#f0f4f8] via-white to-[#e8ecf1] -mx-5 -mb-5 p-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#154279]">Price/Month</span>
                                                    <div className="flex items-baseline leading-none mt-1">
                                                        <span className="text-[10px] font-bold mr-1 text-[#154279]">KES</span>
                                                        <span className="text-xl font-bold tracking-tight text-[#154279]">{item.price.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setSelectedItem(item)}
                                                    className="px-3 py-2 bg-[#154279] hover:bg-[#F96302] text-white font-bold text-[9px] uppercase tracking-[0.1em] transition-all flex items-center gap-1 shadow-lg"
                                                >
                                                    View <ChevronRight size={12}/>
                                                </button>
                                            </div>
                                            <div className="flex gap-4 text-[10px] text-[#154279] font-bold mt-2">
                                                <span className="flex items-center gap-1"><BedDouble size={14} className="text-[#F96302]"/> {item.beds} Beds</span>
                                                <span className="flex items-center gap-1"><Maximize size={14} className="text-[#F96302]"/> {item.sqft} sqft</span>
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
