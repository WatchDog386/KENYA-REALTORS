import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MapPin, BedDouble, Bath, X, Search, ShoppingCart, Menu,
    ChevronRight, CheckCircle2, Maximize, User, Phone, 
    ArrowRight, PlayCircle, Home, Shield, Zap, Wifi, Clock, FileText
} from "lucide-react";

// --- 1. THEME & STYLES ---
const THEME = {
    orange: "#D85C2C",
    blue: "#00356B",
    text: "#1a1a1a",
    heading: "#00356B",
    bgLight: "#f8f9fa",
    border: "#e2e8f0"
};

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;800&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    
    body { font-family: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif; color: ${THEME.text}; background-color: ${THEME.bgLight}; }
    .font-nunito { font-family: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif; }
    
    h1, h2, h3, h4, h5, h6 { color: ${THEME.heading}; font-family: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif; }
    
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #ccc; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: ${THEME.orange}; }

    .hd-checkbox { accent-color: ${THEME.orange}; width: 18px; height: 18px; cursor: pointer; }
    
    .shadow-hover { transition: all 0.3s ease; }
    .shadow-hover:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0, 53, 107, 0.08); }
    
    /* Animation */
    .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; transform: translateY(20px); }
    @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }

    /* Mosaic Grid for Detail Page */
    .gallery-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; height: 400px; }
    .gallery-main { grid-row: span 2; height: 100%; }
    .gallery-sub { display: flex; flex-direction: column; gap: 10px; height: 100%; }
    .gallery-img { width: 100%; height: 100%; object-fit: cover; border-radius: 0; cursor: pointer; }

    @media (max-width: 768px) {
        .gallery-grid { display: flex; flex-direction: column; height: auto; }
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
    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFilters((prev: any) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="bg-[#00356B] p-6 rounded-lg shadow-lg border border-[#00356B] text-white font-nunito">
            <h3 className="font-bold text-lg mb-6 text-white flex items-center gap-2 tracking-tight">
                <Search size={18} className="text-[#D85C2C]" /> Find Your Unit
            </h3> 
            
            <div className="space-y-5">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2 block">Popular Searches</label>
                    <select 
                        name="keyword"
                        value={filters.keyword}
                        onChange={handleChange}
                        className="w-full bg-white/10 border border-white/10 p-3 rounded-lg text-sm text-white focus:ring-1 focus:ring-[#D85C2C] outline-none cursor-pointer backdrop-blur-sm [&>option]:text-[#484848]"
                    >
                        {SEARCH_PRESETS.map((preset, idx) => (
                            <option key={idx} value={preset.value}>
                                {preset.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2 block">Or Search Keyword</label>
                    <input 
                        type="text" 
                        name="keywordCustom"
                        placeholder="e.g. Luxury, Balcony, View..." 
                        onChange={(e) => {
                            if (e.target.value) {
                                setFilters((prev: any) => ({ ...prev, keyword: e.target.value }));
                            }
                        }}
                        className="w-full bg-white/10 border border-white/10 p-3 rounded-lg text-sm text-white placeholder:text-white/40 focus:ring-1 focus:ring-[#D85C2C] outline-none backdrop-blur-sm"
                    />
                </div>

                <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2 block">Apartment Type</label>
                    <select 
                        name="type" 
                        value={filters.type}
                        onChange={handleChange}
                        className="w-full bg-white/10 border border-white/10 p-3 rounded-lg text-sm text-white focus:ring-1 focus:ring-[#D85C2C] outline-none cursor-pointer backdrop-blur-sm [&>option]:text-[#484848]"
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
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2 block">Max Price: KES {Number(filters.maxPrice).toLocaleString()}</label>
                    <input 
                        type="range" 
                        name="maxPrice"
                        min="10000" 
                        max="150000" 
                        step="5000"
                        value={filters.maxPrice}
                        onChange={handleChange}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D85C2C]"
                    />
                    <div className="flex justify-between text-[10px] text-white/50 mt-1 font-bold">
                        <span>10k</span>
                        <span>150k+</span>
                    </div>
                </div>

                <div className="pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2 block">Tower Wing</label>
                    <div className="space-y-2">
                        {["Wing A (Executive)", "Wing B (Standard)", "Wing C (Economy)"].map((wing, i) => (
                            <label key={i} className="flex items-center gap-2 text-sm text-white cursor-pointer hover:text-[#D85C2C] transition-colors group">
                                <input type="checkbox" className="hd-checkbox border-white/20 bg-white/10" /> 
                                <span className="font-medium group-hover:translate-x-1 transition-transform">{wing}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button className="w-full bg-[#D85C2C] hover:bg-[#d85502] text-white font-bold py-3 rounded-lg uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-950/20">
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
            className="fixed inset-0 z-50 bg-[#00356B]/80 backdrop-blur-sm overflow-y-auto custom-scroll font-nunito"
        >
            {/* Header / Nav inside Modal */}
            <div className="sticky top-0 bg-white shadow-lg z-50 px-4 md:px-8 h-16 flex items-center justify-between border-b border-slate-200">
                <div className="font-bold text-xl text-[#00356B] tracking-tighter uppercase">AYDEN<span className="text-[#D85C2C]">HOMES</span></div>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-[#D85C2C] hover:text-white flex items-center justify-center transition-all border border-slate-200"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="max-w-7xl mx-auto bg-white min-h-screen pb-20 shadow-2xl">
                {/* 1. Title Header Section */}
                <div className="p-6 md:p-10 pb-6 flex flex-col md:flex-row justify-between items-start border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <div className="flex gap-2 mb-4">
                            <span className="bg-[#D85C2C] text-white text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest border border-[#D85C2C]/20">For Rent</span>
                            {item.featured && <span className="bg-[#00356B] text-white text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest border border-[#00356B]/20">Featured</span>} 
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-[#00356B] mb-3 tracking-tight leading-none">{item.title}</h1>
                        <p className="text-slate-500 flex items-center gap-2 text-sm md:text-base font-bold">
                            <MapPin size={18} className="text-[#D85C2C]"/> {item.location} <span className="text-slate-300">|</span> {item.floor}
                        </p>
                    </div>
                    <div className="mt-6 md:mt-0 text-left md:text-right bg-[#00356B] p-6 rounded-lg shadow-lg shadow-blue-900/10 border-b-4 border-[#D85C2C]">
                        <div className="text-[10px] font-bold text-white/60 mb-1 uppercase tracking-widest">Monthly Rent</div>
                        <div className="text-3xl md:text-4xl font-black text-white leading-none">KES {item.price.toLocaleString()}</div>
                        <p className="text-[#D85C2C] font-black text-xs mt-1 uppercase tracking-widest">All Inclusive</p>
                    </div>
                </div>

                {/* 2. Gallery Section */}
                <div className="p-6 md:p-10 pt-8">
                    <div className="gallery-grid">
                        <div className="gallery-main relative group overflow-hidden border border-slate-200">
                            <img src={item.gallery[0]} alt="Main" className="gallery-img transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl border border-slate-200 flex items-center gap-2 cursor-pointer hover:bg-[#D85C2C] hover:text-white transition-all transform hover:-translate-y-1">
                                <Maximize size={14}/> View Full Gallery
                            </div>
                        </div>
                        <div className="gallery-sub">
                            <img src={item.gallery[1]} alt="Sub 1" className="gallery-img border border-slate-200" />
                            <img src={item.gallery[2]} alt="Sub 2" className="gallery-img border border-slate-200" />
                        </div>
                    </div>
                </div>

                {/* 3. Main Content & Sidebar */}
                <div className="p-6 md:p-10 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* LEFT COLUMN: Details */}
                    <div className="lg:col-span-2">
                        {/* Quick Overview Badges */}
                        <div className="bg-slate-50 p-8 rounded-lg flex flex-wrap gap-8 md:gap-16 mb-12 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#00356B]/5 p-3 rounded-lg">
                                    <BedDouble size={28} className="text-[#D85C2C]"/>
                                </div>
                                <div>
                                    <span className="block font-black text-2xl text-[#00356B] leading-none">{item.beds}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Bedrooms</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-[#00356B]/5 p-3 rounded-lg">
                                    <Bath size={28} className="text-[#D85C2C]"/>
                                </div>
                                <div>
                                    <span className="block font-black text-2xl text-[#00356B] leading-none">{item.baths}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Bathrooms</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-[#00356B]/5 p-3 rounded-lg">
                                    <Maximize size={28} className="text-[#D85C2C]"/>
                                </div>
                                <div>
                                    <span className="block font-black text-2xl text-[#00356B] leading-none">{item.sqft}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sq Ft</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-12">
                            <h3 className="text-xl font-black text-[#00356B] mb-6 border-b-2 border-slate-100 pb-2 uppercase tracking-tight flex items-center gap-3">
                                <FileText size={20} className="text-[#D85C2C]" /> Description
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-[15px] font-medium">
                                {item.description}
                                <br/><br/>
                                Living at <strong className="text-[#00356B]">Ayden Home Towers</strong> offers a unique blend of community and privacy. 
                                Enjoy dedicated maintenance teams, secure biometric access, and a community app for all your utility payments.
                            </p>
                        </div>

                        {/* Amenities */}
                        <div className="mb-12">
                            <h3 className="text-xl font-black text-[#00356B] mb-6 border-b-2 border-slate-100 pb-2 uppercase tracking-tight flex items-center gap-3">
                                <Shield size={20} className="text-[#D85C2C]" /> Amenities
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                                {item.amenities.map((am:string, i:number) => (
                                    <div key={i} className="flex items-center gap-3 text-slate-600 text-[13px] font-bold">
                                        <div className="w-5 h-5 bg-[#D85C2C]/10 flex items-center justify-center rounded-lg">
                                            <CheckCircle2 size={12} className="text-[#D85C2C]"/>
                                        </div>
                                        {am}
                                    </div>
                                ))}
                                <div className="flex items-center gap-3 text-slate-600 text-[13px] font-bold">
                                    <div className="w-5 h-5 bg-[#D85C2C]/10 flex items-center justify-center rounded-lg">
                                        <CheckCircle2 size={12} className="text-[#D85C2C]"/>
                                    </div>
                                    CCTV Security
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 text-[13px] font-bold">
                                    <div className="w-5 h-5 bg-[#D85C2C]/10 flex items-center justify-center rounded-lg">
                                        <CheckCircle2 size={12} className="text-[#D85C2C]"/>
                                    </div>
                                    Borehole Water
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 text-[13px] font-bold">
                                    <div className="w-5 h-5 bg-[#D85C2C]/10 flex items-center justify-center rounded-lg">
                                        <CheckCircle2 size={12} className="text-[#D85C2C]"/>
                                    </div>
                                    Backup Generator
                                </div>
                            </div>
                        </div>

                        {/* Property Details Table */}
                        <div className="bg-slate-50 p-8 rounded-lg border border-slate-200">
                            <h3 className="text-lg font-black text-[#00356B] mb-6 uppercase tracking-tight">Technical Specs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
                                <div className="flex justify-between border-b border-slate-200 pb-3">
                                    <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Unit ID</span>
                                    <span className="font-black text-[#00356B]">{item.id}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 pb-3">
                                    <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Monthly Fee</span>
                                    <span className="font-black text-[#00356B]">KES {item.price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 pb-3">
                                    <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Floor Space</span>
                                    <span className="font-black text-[#00356B]">{item.sqft} Sq Ft</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 pb-3">
                                    <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Unit Type</span>
                                    <span className="font-black text-[#00356B]">{item.type}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 pb-3">
                                    <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Year Built</span>
                                    <span className="font-black text-[#00356B]">2024</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 pb-3">
                                    <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Status</span>
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">Available</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Contact Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#00356B] border border-[#00356B] rounded-lg p-8 shadow-2xl sticky top-24 transform md:rotate-1">
                            <h4 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                                <Clock size={20} className="text-[#D85C2C]" /> Schedule Visit
                            </h4>
                            <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
                                <div className="w-12 h-12 bg-white/10 rounded-lg overflow-hidden border border-white/20 p-1">
                                    <img src="https://i.pravatar.cc/150?u=ayden" alt="Agent" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="font-black text-white text-sm uppercase tracking-wide">Ayden Office</div>
                                    <div className="text-[10px] text-[#D85C2C] font-black uppercase tracking-[0.2em]">Primary Manager</div>
                                </div>
                            </div>

                            <form className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-1.5 block">Full Name</label>
                                    <input type="text" placeholder="John Doe" className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-[#D85C2C] outline-none transition-all"/>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-1.5 block">Email Address</label>
                                    <input type="email" placeholder="john@example.com" className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-[#D85C2C] outline-none transition-all"/>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-1.5 block">Message</label>
                                    <textarea rows={3} placeholder="I want to see this unit..." className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-[#D85C2C] outline-none transition-all resize-none"></textarea>
                                </div>
                                
                                <button className="w-full bg-[#D85C2C] hover:bg-white hover:text-[#D85C2C] text-white font-black py-4 rounded-lg transition-all uppercase tracking-widest text-xs shadow-xl shadow-orange-950/20">
                                    Reserve My Tour
                                </button>
                                <button className="w-full bg-transparent border-2 border-white/20 text-white font-black py-4 rounded-lg hover:bg-white/5 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                                    <Phone size={18} className="text-[#D85C2C]"/> Direct Line
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
    const listingsPerPage = 6;
    
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
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 text-[#1a1a1a] font-sans">
            
            {/* --- IMPROVED HERO SECTION --- */}
            <section className="bg-white pt-8 pb-12 lg:pt-10 lg:pb-16 border-b border-slate-200 font-nunito">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                    
                    {/* Main Image (7 Cols) - Clean centered layout */}
                    <div className="lg:col-span-7 h-[320px] lg:h-[400px] w-full rounded-lg overflow-hidden shadow-md border border-slate-200 relative group">
                        <div className="absolute top-6 left-6 z-20 bg-[#D85C2C] text-white text-[10px] font-black px-5 py-2 rounded-lg uppercase tracking-[0.2em] shadow-xl border border-white/10">
                            Now Leasing
                        </div>
                        <img
                            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1600"
                            alt="Ayden Home Towers Exterior"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#00356B] via-[#00356B]/40 to-transparent h-1/2 pointer-events-none"></div>
                        <div className="absolute bottom-8 left-8 text-white z-20">
                            <div className="text-[10px] font-black opacity-80 uppercase tracking-[0.3em] mb-2 text-[#D85C2C]">Premium Inventory</div>
                            <div className="text-3xl lg:text-5xl font-black leading-none tracking-tight" style={{ fontFamily: "'Nunito', sans-serif" }}>AYDEN HOME TOWERS</div>
                            <div className="text-sm font-bold opacity-70 mt-3 flex items-center gap-2">
                                <MapPin size={14} className="text-[#D85C2C]" /> NAIROBI WEST, KENYA
                            </div>
                        </div>
                    </div>

                    {/* Content Side (5 Cols) - Improved text hierarchy */}
                    <div className="lg:col-span-5 space-y-6">
                        <div>
                        <div className="flex items-center gap-3 mb-4">
                                    <div className="h-[2px] w-12 bg-[#D85C2C]"></div>
                                    <h2 className="text-[9px] font-black text-[#D85C2C] uppercase tracking-[0.3em]">Signature Living</h2>
                                </div>
                                <h1 className="text-4xl lg:text-5xl font-black text-[#00356B] leading-[0.9] tracking-tight mb-6" style={{ fontFamily: "'Nunito', sans-serif" }}>
                                    Modern Living<br/>
                                    <span className="text-[#D85C2C]">Perfected.</span>
                                </h1>
                            
                            <p className="text-slate-600 text-sm lg:text-base leading-relaxed mb-8 font-medium max-w-md">
                                Discover <strong className="font-black text-[#00356B]">Ayden Home Towers</strong> — a premier rental residential complex offering diverse living options. With over 100 meticulously designed units ranging from studios to 4-bedroom apartments, we provide affordable luxury living for every lifestyle.
                            </p>
                            
                            {/* Features Grid */}
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-10 pb-8 border-b border-slate-200">
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#00356B]">
                                    <Shield size={16} className="text-[#D85C2C]" />
                                    <span>24/7 Shield</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#00356B]">
                                    <Wifi size={16} className="text-[#D85C2C]" />
                                    <span>Giga Fiber</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#00356B]">
                                    <Home size={16} className="text-[#D85C2C]" />
                                    <span>Sleek Design</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#00356B]">
                                    <Zap size={16} className="text-[#D85C2C]" />
                                    <span>Grid Backup</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button className="flex-1 bg-[#00356B] text-white py-4 px-8 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 hover:bg-[#0f2e54] transition-all flex items-center justify-center gap-3 active:scale-95">
                                    Explore Units <ArrowRight size={16} className="text-[#D85C2C]" />
                                </button>
                                <button className="flex-1 border-2 border-slate-200 text-[#00356B] py-4 px-8 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] hover:border-[#00356B] hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95">
                                    <PlayCircle size={16} className="text-[#D85C2C]" /> Virtual Tour
                                </button>
                            </div>
                        </div>

                        {/* Industrial Style Thumbnails */}
                        <div className="mt-4">
                            <div className="flex justify-between items-end mb-4">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Gallery Preview</p>
                                <p className="text-[9px] font-black text-[#D85C2C] cursor-pointer hover:underline flex items-center gap-1 uppercase tracking-[0.2em]">
                                    View All <ChevronRight size={12} />
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 h-20">
                                <div className="relative rounded-lg overflow-hidden cursor-pointer group border border-slate-200">
                                    <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=400" 
                                             className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                             alt="Residential Unit" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all"></div>
                                </div>
                                <div className="relative rounded-lg overflow-hidden cursor-pointer group border border-slate-200">
                                    <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=400" 
                                             className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                             alt="Building Exterior" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all"></div>
                                </div>
                                <div className="relative rounded-lg overflow-hidden cursor-pointer group border border-slate-200">
                                    <img src="https://images.unsplash.com/photo-1493857671505-72967e2e2760?q=80&w=400" 
                                             className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                             alt="Common Area" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* --- END HERO SECTION --- */}

            {/* MAIN CONTENT AREA */}
            <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-6 relative z-30 mt-6">
                
                {/* SIDEBAR FILTER - NOW WITH BLUE THEME */}
                <div className="w-full md:w-[270px] flex-shrink-0">
                    <FilterSidebar filters={filters} setFilters={setFilters} />
                    
                    {/* Promo Banner */}
                    <div className="mt-6 bg-gradient-to-r from-[#D85C2C] to-[#ff7b2e] rounded-lg p-5 text-white text-center shadow-lg hidden md:block">
                        <h4 className="font-bold text-lg mb-2">Move In Special!</h4>
                        <p className="text-xs opacity-90 mb-3">Get 50% OFF your first month's rent when you sign a lease for Wing A units.</p>
                        <button className="bg-white text-[#D85C2C] px-4 py-2 rounded-lg font-bold text-xs hover:bg-gray-100 transition-colors">
                            View Details
                        </button>
                    </div>
                </div>

                {/* LISTINGS GRID */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-2xl text-navy">
                                Available Units
                            </h3>
                            <p className="text-gray-500 text-sm mt-1">
                                {filteredListings.length} units matching your criteria
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D85C2C] bg-white">
                                <option>Sort by: Newest</option>
                                <option>Sort by: Price (Low to High)</option>
                                <option>Sort by: Price (High to Low)</option>
                            </select>
                        </div>
                    </div>

                    {currentListings.length === 0 ? (
                        <div className="bg-white p-10 text-center rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-400 mb-2">No units match your criteria.</h3>
                            <button 
                                onClick={()=>setFilters({keyword:"", type:"All", maxPrice:150000})} 
                                className="text-[#D85C2C] font-bold hover:underline text-sm"
                            >
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {currentListings.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl group flex flex-col transition-all duration-500 hover:-translate-y-1"
                                >
                                    <div className="relative h-56 overflow-hidden cursor-pointer" onClick={() => setSelectedItem(item)}>
                                        <img src={item.gallery[0]} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                        
                                        {/* Tag Overlay */}
                                        <div className="absolute top-0 left-0 bg-[#00356B] text-white text-[9px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.2em] shadow-lg z-10">
                                            {item.type}
                                        </div>

                                        {item.featured && (
                                            <div className="absolute top-0 right-0 bg-[#D85C2C] text-white text-[9px] font-black px-4 py-2 rounded-lg uppercase tracking-[0.2em] shadow-lg z-10">
                                                Featured
                                            </div>
                                        )}
                                        
                                        {/* Bottom Info Gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#00356B]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        
                                        <div className="absolute bottom-4 right-4 bg-white text-[#00356B] px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 shadow-xl uppercase tracking-widest z-10">
                                            <Maximize size={12} className="text-[#D85C2C]"/> {item.gallery.length} Photos
                                        </div>
                                        
                                        <div className="absolute bottom-5 left-5 z-10 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                            <div className="bg-[#D85C2C] text-white font-black text-sm px-4 py-2 shadow-xl inline-block">
                                                KES {item.price.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 
                                                className="font-black text-lg text-[#00356B] cursor-pointer hover:text-[#D85C2C] transition-colors leading-tight line-clamp-1 uppercase tracking-tight"
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                {item.title}
                                            </h4>
                                        </div>

                                        <div className="text-[10px] font-bold text-slate-400 mb-5 flex items-center gap-2 uppercase tracking-widest">
                                            <MapPin size={12} className="text-[#D85C2C]"/> {item.location}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {item.amenities.slice(0, 3).map((am:string, i:number) => (
                                                <span key={i} className="bg-slate-50 text-slate-500 text-[9px] font-black px-2 py-1.5 rounded-lg border border-slate-100 uppercase tracking-wider">
                                                    {am}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-center border-t border-slate-100 pt-5 mt-auto">
                                            <div className="flex gap-5 text-[10px] font-black text-[#00356B] uppercase tracking-widest">
                                                <span className="flex items-center gap-2"><BedDouble size={14} className="text-[#D85C2C]"/> {item.beds}</span>
                                                <span className="flex items-center gap-1.2"><Maximize size={14} className="text-[#D85C2C]"/> {item.sqft}</span>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedItem(item)}
                                                className="text-[#00356B] hover:text-[#D85C2C] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group/btn"
                                            >
                                                View Unit <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Pagination */}
                    {filteredListings.length > 0 && (
                        <div className="mt-16 flex justify-center gap-3">
                            <button 
                                onClick={() => setCurrentPage(1)}
                                className={`w-12 h-12 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-md ${currentPage === 1 ? 'bg-[#00356B] text-white' : 'bg-white border border-slate-200 text-[#00356B] hover:bg-slate-50'}`}
                            >
                                01
                            </button>
                            <button 
                                onClick={() => setCurrentPage(2)}
                                className={`w-12 h-12 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-md ${currentPage === 2 ? 'bg-[#00356B] text-white' : 'bg-white border border-slate-200 text-[#00356B] hover:bg-slate-50'}`}
                            >
                                02
                            </button>
                            {totalPages > 2 && (
                                <button 
                                    onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                    className="w-12 h-12 rounded-lg bg-white border border-slate-200 text-[#00356B] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-md"
                                >
                                    Next
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
