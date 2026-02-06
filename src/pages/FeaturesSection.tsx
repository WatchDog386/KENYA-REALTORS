import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MapPin, BedDouble, Bath, X, Search, ShoppingCart, Menu,
    ChevronRight, CheckCircle2, Maximize, User, Phone, 
    ArrowRight, PlayCircle, Home, Shield, Zap, Wifi, Clock, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

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

// --- 2. DATA - INITIAL LISTINGS (Page 1) ---
const INITIAL_LISTINGS = [
    {
        id: "AHT-304",
        title: "Luxury 3-Bedroom Panorama Suite",
        type: "3 Bedroom",
        price: 85000,
        floor: "12th Floor",
        rating: 5.0,
        location: "Ayden Home Towers, Wing A",
        beds: 3,
        baths: 3,
        sqft: 1850,
        featured: true,
        amenities: ["Ocean View", "Gym Access", "Swimming Pool", "High Speed Wifi", "Smart Home"],
        description: "Experience the pinnacle of luxury in this 12th-floor masterpiece. Featuring panoramic views of the city, a master suite with a jacuzzi, and a chef's kitchen.",
        gallery: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200",
            "https://images.unsplash.com/photo-1512918760383-eda2723ad6e1?q=80&w=800",
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=800"
        ]
    },
    {
        id: "AHT-202",
        title: "Modern 2-Bedroom Executive",
        type: "2 Bedroom",
        price: 55000,
        floor: "8th Floor",
        rating: 4.8,
        location: "Ayden Home Towers, Wing B",
        beds: 2,
        baths: 2,
        sqft: 1200,
        featured: true,
        amenities: ["Balcony", "Parking", "Security", "Laundry"],
        description: "Perfect for young families or professionals. This unit comes fully furnished with modern aesthetics, ample natural light, and dedicated parking.",
        gallery: [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200",
            "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=800",
            "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800"
        ]
    },
    {
        id: "AHT-105",
        title: "Spacious 1-Bedroom Apartment",
        type: "1 Bedroom",
        price: 35000,
        floor: "3rd Floor",
        rating: 4.5,
        location: "Ayden Home Towers, Wing B",
        beds: 1,
        baths: 1,
        sqft: 800,
        featured: false,
        amenities: ["Wifi", "Gym Access", "Security"],
        description: "A cozy yet spacious one-bedroom unit ideal for singles. Includes a dedicated workspace area and access to the tower's rooftop gym.",
        gallery: [
            "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=1200",
            "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800",
            "https://images.unsplash.com/photo-1631679706909-1844bbd07221?q=80&w=800"
        ]
    },
    {
        id: "AHT-001",
        title: "Standard Single Room / Bedsitter",
        type: "Bedsitter",
        price: 18000,
        floor: "Ground Floor",
        rating: 4.2,
        location: "Ayden Home Towers, Wing C",
        beds: 0,
        baths: 1,
        sqft: 350,
        featured: false,
        amenities: ["Water 24/7", "Security", "Tiled Floors"],
        description: "Affordable luxury. Our bedsitters are larger than average, featuring a separate kitchenette area, instant shower, and pre-installed fiber internet.",
        gallery: [
            "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=1200",
            "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800",
            "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=800"
        ]
    },
    {
        id: "AHT-205",
        title: "Premium 2-Bedroom with Balcony",
        type: "2 Bedroom",
        price: 60000,
        floor: "9th Floor",
        rating: 4.9,
        location: "Ayden Home Towers, Wing A",
        beds: 2,
        baths: 2,
        sqft: 1300,
        featured: false,
        amenities: ["Balcony", "Pool View", "Ensuite"],
        description: "Enjoy sunset views from your private balcony. This premium 2-bedroom unit features mahogany finishings and a spacious open-plan living area.",
        gallery: [
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200",
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800"
        ]
    },
    {
        id: "AHT-108",
        title: "Economy 1-Bedroom",
        type: "1 Bedroom",
        price: 28000,
        floor: "1st Floor",
        rating: 4.0,
        location: "Ayden Home Towers, Wing C",
        beds: 1,
        baths: 1,
        sqft: 650,
        featured: false,
        amenities: ["CCTV", "Water", "Tokens"],
        description: "A budget-friendly option without compromising quality. Perfect for students or young professionals starting out.",
        gallery: [
            "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1200",
            "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=800",
            "https://images.unsplash.com/photo-1556912173-3db9963f6bee?q=80&w=800"
        ]
    }
];

// --- PAGE 2 LISTINGS ---
const PAGE_2_LISTINGS = [
    {
        id: "AHT-406",
        title: "Penthouse 4-Bedroom Executive Suite",
        type: "4 Bedroom",
        price: 125000,
        floor: "15th Floor",
        rating: 5.0,
        location: "Ayden Home Towers, Wing A",
        beds: 4,
        baths: 4,
        sqft: 2200,
        featured: true,
        amenities: ["Panoramic View", "Private Terrace", "Jacuzzi", "Smart Home", "Wine Cellar"],
        description: "The ultimate luxury penthouse offering breathtaking 360-degree city views, private terrace with outdoor kitchen, and premium finishes throughout.",
        gallery: [
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200",
            "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800",
            "https://images.unsplash.com/photo-1616594039325-18dcd0b4a20c?q=80&w=800"
        ]
    },
    {
        id: "AHT-309",
        title: "Executive 3-Bedroom Family Unit",
        type: "3 Bedroom",
        price: 92000,
        floor: "10th Floor",
        rating: 4.9,
        location: "Ayden Home Towers, Wing A",
        beds: 3,
        baths: 3,
        sqft: 1650,
        featured: true,
        amenities: ["Family Friendly", "Play Area", "Storage", "Ensuite Master"],
        description: "Perfect for growing families, this spacious unit features a children's play area, extra storage, and proximity to the rooftop playground.",
        gallery: [
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200",
            "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=800",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800"
        ]
    },
    {
        id: "AHT-212",
        title: "Modern 2-Bedroom Corner Unit",
        type: "2 Bedroom",
        price: 62000,
        floor: "7th Floor",
        rating: 4.7,
        location: "Ayden Home Towers, Wing B",
        beds: 2,
        baths: 2,
        sqft: 1100,
        featured: false,
        amenities: ["Corner Unit", "Extra Windows", "Balcony", "Modern Kitchen"],
        description: "Corner unit with extra natural light from two sides. Features a modern open-concept kitchen with premium appliances.",
        gallery: [
            "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?q=80&w=1200",
            "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?q=80&w=800",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800"
        ]
    },
    {
        id: "AHT-115",
        title: "Premium 1-Bedroom Studio",
        type: "1 Bedroom",
        price: 42000,
        floor: "5th Floor",
        rating: 4.6,
        location: "Ayden Home Towers, Wing B",
        beds: 1,
        baths: 1,
        sqft: 750,
        featured: false,
        amenities: ["Study Nook", "Walk-in Closet", "Premium Finishes", "City View"],
        description: "Elegant studio apartment with custom-built storage solutions, dedicated study area, and high-end fixtures throughout.",
        gallery: [
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200",
            "https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5?q=80&w=800",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800"
        ]
    },
    {
        id: "AHT-003",
        title: "Deluxe Bedsitter with Balcony",
        type: "Bedsitter",
        price: 22000,
        floor: "2nd Floor",
        rating: 4.3,
        location: "Ayden Home Towers, Wing C",
        beds: 0,
        baths: 1,
        sqft: 420,
        featured: false,
        amenities: ["Private Balcony", "Modern Kitchenette", "Smart TV", "Security"],
        description: "Upgraded bedsitter with private balcony, modern kitchenette with breakfast bar, and pre-installed smart home features.",
        gallery: [
            "https://images.unsplash.com/photo-1558036117-15e82a2c9a9a?q=80&w=1200",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800",
            "https://images.unsplash.com/photo-1558036117-15e82a2c9a9a?q=80&w=800"
        ]
    },
    {
        id: "AHT-110",
        title: "Budget-Friendly Studio Apartment",
        type: "Studio",
        price: 25000,
        floor: "Ground Floor",
        rating: 4.1,
        location: "Ayden Home Towers, Wing C",
        beds: 0,
        baths: 1,
        sqft: 380,
        featured: false,
        amenities: ["All Inclusive", "Furnished", "Utilities Included", "Laundry Access"],
        description: "Fully furnished studio with all utilities included. Perfect for students or young professionals seeking hassle-free living.",
        gallery: [
            "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1200",
            "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?q=80&w=800",
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800"
        ]
    }
];

// --- 3. SUB-COMPONENTS ---

const SEARCH_PRESETS = [
    { label: "All Amenities", value: "" },
    { label: "🏊 Swimming Pool", value: "Swimming Pool" },
    { label: "💪 Gym Access", value: "Gym Access" },
    { label: "🌐 High Speed Wifi", value: "High Speed Wifi" },
    { label: "🏠 Smart Home", value: "Smart Home" },
    { label: "🏖️ Ocean View", value: "Ocean View" },
    { label: "🏠 Pool View", value: "Pool View" },
    { label: "🛗 High-Speed Elevator", value: "High-Speed Elevator" },
    { label: "🌐 Fiber Ready", value: "Fiber Ready" },
    { label: "🍽️ Rooftop Lounge", value: "Rooftop Lounge" },
    { label: "🅿️ Parking", value: "Parking" },
    { label: "🔒 Security", value: "Security" },
    { label: "🧺 Laundry", value: "Laundry" },
    { label: "🛏️ Ensuite", value: "Ensuite" },
    { label: "🧵 Ensuite Master", value: "Ensuite Master" },
    { label: "👶 Family Friendly", value: "Family Friendly" },
    { label: "🎪 Play Area", value: "Play Area" },
    { label: "📦 Storage", value: "Storage" },
    { label: "🚪 Corner Unit", value: "Corner Unit" },
    { label: "☀️ Extra Windows", value: "Extra Windows" },
    { label: "🌳 Balcony", value: "Balcony" },
    { label: "🍳 Modern Kitchen", value: "Modern Kitchen" },
    { label: "💧 Water 24/7", value: "Water 24/7" },
    { label: "🪟 Tiled Floors", value: "Tiled Floors" },
    { label: "📹 CCTV", value: "CCTV" },
    { label: "💧 Borehole Water", value: "Borehole Water" },
    { label: "🔋 Backup Generator", value: "Backup Generator" },
];

const FilterSidebar = ({ filters, setFilters }: any) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFilters((prev: any) => ({ ...prev, [name]: value }));
    };

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
                <div>
                    <label className="text-[9px] md:text-[10px] font-bold text-[#154279] uppercase tracking-[0.15em] mb-1.5 md:mb-2 block">Popular Searches</label>
                    <select 
                        name="keyword"
                        value={filters.keyword}
                        onChange={handleChange}
                        className="w-full bg-white border-2 border-slate-300 p-2.5 md:p-3 rounded-none text-xs md:text-sm text-slate-700 focus:ring-2 focus:ring-[#F96302]/20 focus:border-[#F96302] outline-none cursor-pointer"
                    >
                        {SEARCH_PRESETS.map((preset, idx) => (
                            <option key={idx} value={preset.value}>
                                {preset.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-[9px] md:text-[10px] font-bold text-[#154279] uppercase tracking-[0.15em] mb-1.5 md:mb-2 block">Or Search Keyword</label>
                    <input 
                        type="text" 
                        name="keywordCustom"
                        placeholder="e.g. Luxury, Balcony, View..." 
                        onChange={(e) => {
                            if (e.target.value) {
                                setFilters((prev: any) => ({ ...prev, keyword: e.target.value }));
                            }
                        }}
                        className="w-full bg-white border-2 border-slate-300 p-2 text-xs md:p-3 md:text-sm rounded-none text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-[#F96302]/20 focus:border-[#F96302] outline-none"
                    />
                </div>

                <div>
                    <label className="text-[9px] md:text-[10px] font-bold text-[#154279] uppercase tracking-[0.15em] mb-1.5 md:mb-2 block">Apartment Type</label>
                    <select 
                        name="type" 
                        value={filters.type}
                        onChange={handleChange}
                        className="w-full bg-white border-2 border-slate-300 p-2.5 md:p-3 rounded-none text-xs md:text-sm text-slate-700 focus:ring-2 focus:ring-[#F96302]/20 focus:border-[#F96302] outline-none cursor-pointer"
                    >
                        <option value="All">All Types</option>
                        <option value="3 Bedroom">3 Bedrooms</option>
                        <option value="2 Bedroom">2 Bedrooms</option>
                        <option value="1 Bedroom">1 Bedrooms</option>
                        <option value="Bedsitter">Bedsitters</option>
                        <option value="4 Bedroom">4 Bedrooms</option>
                        <option value="Studio">Studio</option>
                    </select>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-[#154279] uppercase tracking-[0.15em] mb-2 block">Max Price: KES {Number(filters.maxPrice).toLocaleString()}</label>
                    <input 
                        type="range" 
                        name="maxPrice"
                        min="10000" 
                        max="150000" 
                        step="5000"
                        value={filters.maxPrice}
                        onChange={handleChange}
                        className="w-full h-2 bg-slate-300 rounded-none appearance-none cursor-pointer accent-[#F96302]"
                    />
                    <div className="flex justify-between text-[10px] text-[#154279] mt-2 font-bold">
                        <span>10k</span>
                        <span>150k+</span>
                    </div>
                </div>

                <div className="pt-2">
                    <label className="text-[10px] font-bold text-[#154279] uppercase tracking-[0.15em] mb-3 block">Tower Wing</label>
                    <div className="space-y-2">
                        {["Wing A (Executive)", "Wing B (Standard)", "Wing C (Economy)"].map((wing, i) => (
                            <label key={i} className="flex items-center gap-3 text-sm text-[#154279] cursor-pointer hover:text-[#F96302] transition-colors group p-2 rounded-none hover:bg-white/50">
                                <input type="checkbox" className="w-4 h-4 accent-[#F96302]" /> 
                                <span className="font-semibold">{wing}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button className="w-full bg-[#154279] hover:bg-[#F96302] text-white font-bold py-3 rounded-none text-[10px] uppercase tracking-[0.15em] transition-all shadow-lg">
                    Search Availability
                </button>
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
    const [filters, setFilters] = useState({
        keyword: "",
        type: "All",
        maxPrice: 150000
    });
    const [currentPage, setCurrentPage] = useState(1);
    const listingsPerPage = 3;
    
    // Combine both sets of listings
    const ALL_LISTINGS = [...INITIAL_LISTINGS, ...PAGE_2_LISTINGS];
    
    // Derived State for Filtering
    const filteredListings = useMemo(() => {
        return ALL_LISTINGS.filter(item => {
            const matchesKeyword = item.title.toLowerCase().includes(filters.keyword.toLowerCase()) || 
                                   item.amenities.some(am => am.toLowerCase().includes(filters.keyword.toLowerCase()));
            const matchesType = filters.type === "All" || item.type === filters.type;
            const matchesPrice = item.price <= filters.maxPrice;
            
            return matchesKeyword && matchesType && matchesPrice;
        });
    }, [filters, ALL_LISTINGS]);
    
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
                            className="lg:col-span-7 h-[280px] lg:h-[380px] relative rounded-none overflow-hidden shadow-2xl border-2 border-slate-300"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1600"
                                alt="Ayden Home Towers Exterior"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#154279]/80 via-[#154279]/20 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 text-white z-20">
                                <div className="text-xl lg:text-4xl font-semibold leading-tight tracking-tight">AYDEN HOME TOWERS</div>
                                <div className="text-sm font-normal opacity-90 mt-2 flex items-center gap-2">
                                    <MapPin size={14} className="text-[#F96302]" /> Nairobi West, Kenya
                                </div>
                            </div>
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
                    <FilterSidebar filters={filters} setFilters={setFilters} />
                    
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
                            <select className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#F96302] bg-white font-medium text-slate-700">
                                <option>Sort by: Newest</option>
                                <option>Sort by: Price (Low to High)</option>
                                <option>Sort by: Price (High to Low)</option>
                            </select>
                        </div>
                    </div>

                    {currentListings.length === 0 ? (
                        <div className="bg-white p-10 text-center rounded-xl shadow-sm border border-slate-200/60">
                            <h3 className="text-lg font-semibold text-slate-400 mb-2">No units match your criteria.</h3>
                            <button 
                                onClick={()=>setFilters({keyword:"", type:"All", maxPrice:150000})} 
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
