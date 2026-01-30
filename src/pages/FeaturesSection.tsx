import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MapPin, BedDouble, Bath, X, Search, ShoppingCart, Menu,
    ChevronRight, CheckCircle2, Maximize, User, Phone, 
    ArrowRight, PlayCircle, Home, Shield, Zap, Wifi
} from "lucide-react";

// --- 1. THEME & STYLES ---
const THEME = {
    orange: "#D85C2C",
    blue: "#00356B",
    text: "var(--dark-gray)",
    heading: "var(--dark-gray)",
    bgLight: "#f7f7f7",
    border: "#ebebeb"
};

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
    
    body { font-family: 'Nunito', sans-serif; color: ${THEME.text}; background-color: ${THEME.bgLight}; }
    h1, h2, h3, h4, h5, h6 { color: ${THEME.heading}; }
    
    .custom-scroll::-webkit-scrollbar { width: 8px; }
    .custom-scroll::-webkit-scrollbar-track { background: #fff; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--cta); }

    .hd-checkbox { accent-color: var(--cta); width: 18px; height: 18px; cursor: pointer; }
    
    .shadow-hover { transition: all 0.3s ease; }
    .shadow-hover:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    
    /* Animation */
    .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; transform: translateY(20px); }
    @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }

    /* Mosaic Grid for Detail Page */
    .gallery-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; height: 400px; }
    .gallery-main { grid-row: span 2; height: 100%; }
    .gallery-sub { display: flex; flex-direction: column; gap: 10px; height: 100%; }
    .gallery-img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; cursor: pointer; }

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

const FilterSidebar = ({ filters, setFilters }: any) => {
    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFilters((prev: any) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="bg-navy p-6 rounded-none shadow-sm border border-navy text-white">
            <h3 className="font-bold text-lg mb-6 text-white flex items-center gap-2">
                <Search size={18} className="text-cta" /> Find Your Unit
            </h3> 
            
            <div className="space-y-5">
                <div>
                    <label className="text-xs font-bold uppercase text-navy/50 mb-2 block">Search</label>
                    <input 
                        type="text" 
                        name="keyword"
                        placeholder="Keyword (e.g. Balcony)" 
                        value={filters.keyword}
                        onChange={handleChange}
                        className="w-full bg-white border-none p-3 rounded-none text-sm text-dark-gray focus:ring-1 focus:ring-cta outline-none"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold uppercase text-navy/50 mb-2 block">Apartment Type</label>
                    <select 
                        name="type" 
                        value={filters.type}
                        onChange={handleChange}
                        className="w-full bg-white border-none p-3 rounded-none text-sm text-dark-gray focus:ring-1 focus:ring-cta outline-none cursor-pointer"
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
                    <label className="text-xs font-bold uppercase text-navy/50 mb-2 block">Max Price: KES {Number(filters.maxPrice).toLocaleString()}</label>
                    <input 
                        type="range" 
                        name="maxPrice"
                        min="10000" 
                        max="150000" 
                        step="5000"
                        value={filters.maxPrice}
                        onChange={handleChange}
                        className="w-full h-1 bg-gray-400 rounded-lg appearance-none cursor-pointer accent-cta"
                    />
                    <div className="flex justify-between text-[10px] text-navy/50 mt-1 font-bold">
                        <span>10k</span>
                        <span>150k+</span>
                    </div>
                </div>

                <div className="pt-2">
                    <label className="text-xs font-bold uppercase text-navy/50 mb-2 block">Tower Wing</label>
                    <div className="space-y-2">
                        {["Wing A (Executive)", "Wing B (Standard)", "Wing C (Economy)"].map((wing, i) => (
                            <label key={i} className="flex items-center gap-2 text-sm text-white cursor-pointer hover:text-cta">
                                <input type="checkbox" className="hd-checkbox rounded-sm" /> {wing}
                            </label>
                        ))}
                    </div>
                </div>

                <button className="btn-primary w-full">
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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto custom-scroll"
        >
            {/* Header / Nav inside Modal */}
            <div className="sticky top-0 bg-white shadow-md z-50 px-4 md:px-8 h-16 flex items-center justify-between">
                <div className="font-bold text-xl text-navy">AYDEN<span className="text-cta">HOMES</span></div>
                <button 
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-cta hover:text-white flex items-center justify-center transition-all"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="max-w-7xl mx-auto bg-white min-h-screen pb-20">
                {/* 1. Title Header Section */}
                <div className="p-6 md:p-10 pb-4 flex flex-col md:flex-row justify-between items-start border-b border-gray-100">
                    <div>
                        <div className="flex gap-2 mb-3">
                            <span className="bg-[#F96302] text-white text-xs font-bold px-3 py-1 rounded uppercase">For Rent</span>
                            {item.featured && <span className="badge-navy">Featured</span>} 
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#222] mb-2">{item.title}</h1>
                        <p className="text-gray-500 flex items-center gap-2 text-sm md:text-base">
                            <MapPin size={18} className="text-[#F96302]"/> {item.location} - {item.floor}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                        <div className="text-3xl font-extrabold text-[#F96302]">KES {item.price.toLocaleString()}</div>
                        <p className="text-gray-400 font-bold text-sm">/ Month</p>
                    </div>
                </div>

                {/* 2. Gallery Section */}
                <div className="p-6 md:p-10 pt-6">
                    <div className="gallery-grid">
                        <div className="gallery-main relative group overflow-hidden">
                            <img src={item.gallery[0]} alt="Main" className="gallery-img transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded text-xs font-bold shadow flex items-center gap-2 cursor-pointer hover:bg-[#F96302] hover:text-white transition-colors">
                                <Maximize size={14}/> View Photos
                            </div>
                        </div>
                        <div className="gallery-sub">
                            <img src={item.gallery[1]} alt="Sub 1" className="gallery-img h-1/2" />
                            <img src={item.gallery[2]} alt="Sub 2" className="gallery-img h-1/2" />
                        </div>
                    </div>
                </div>

                {/* 3. Main Content & Sidebar */}
                <div className="p-6 md:p-10 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    
                    {/* LEFT COLUMN: Details */}
                    <div className="lg:col-span-2">
                        {/* Quick Overview Badges */}
                        <div className="bg-[#f7f7f7] p-6 rounded-lg flex flex-wrap gap-6 md:gap-12 mb-8 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <BedDouble size={24} className="text-[#F96302]"/>
                                <div>
                                    <span className="block font-bold text-lg text-[#222]">{item.beds}</span>
                                    <span className="text-xs text-gray-500 font-bold uppercase">Bedrooms</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Bath size={24} className="text-[#F96302]"/>
                                <div>
                                    <span className="block font-bold text-lg text-[#222]">{item.baths}</span>
                                    <span className="text-xs text-gray-500 font-bold uppercase">Bathrooms</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Maximize size={24} className="text-[#F96302]"/>
                                <div>
                                    <span className="block font-bold text-lg text-[#222]">{item.sqft}</span>
                                    <span className="text-xs text-gray-500 font-bold uppercase">Sq Ft</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-[#222] mb-4 border-b pb-2">Description</h3>
                            <p className="text-gray-600 leading-relaxed text-[15px]">
                                {item.description}
                                <br/><br/>
                                Living at Ayden Home Towers offers a unique blend of community and privacy. 
                                Enjoy dedicated maintenance teams, secure biometric access, and a community app for all your utility payments.
                            </p>
                        </div>

                        {/* Amenities */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-[#222] mb-4 border-b pb-2">Amenities</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {item.amenities.map((am:string, i:number) => (
                                    <div key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                                        <CheckCircle2 size={16} className="text-[#F96302]"/> {am}
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 text-gray-600 text-sm"><CheckCircle2 size={16} className="text-[#F96302]"/> CCTV Security</div>
                                <div className="flex items-center gap-2 text-gray-600 text-sm"><CheckCircle2 size={16} className="text-[#F96302]"/> Borehole Water</div>
                                <div className="flex items-center gap-2 text-gray-600 text-sm"><CheckCircle2 size={16} className="text-[#F96302]"/> Backup Generator</div>
                            </div>
                        </div>

                        {/* Property Details Table */}
                        <div className="bg-[#f9f9f9] p-6 rounded-lg mb-8">
                            <h3 className="text-lg font-bold text-[#222] mb-4">Property Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 text-sm">
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="font-bold text-[#555]">Property ID:</span>
                                    <span className="text-gray-500">{item.id}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="font-bold text-[#555]">Price:</span>
                                    <span className="text-gray-500">KES {item.price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="font-bold text-[#555]">Property Size:</span>
                                    <span className="text-gray-500">{item.sqft} Sq Ft</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="font-bold text-[#555]">Bedrooms:</span>
                                    <span className="text-gray-500">{item.beds}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="font-bold text-[#555]">Year Built:</span>
                                    <span className="text-gray-500">2024</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="font-bold text-[#555]">Property Type:</span>
                                    <span className="text-gray-500">{item.type}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Contact Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg sticky top-24">
                            <h4 className="text-lg font-bold text-navy mb-4">Schedule a Tour</h4>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                                    <img src="https://i.pravatar.cc/150?u=ayden" alt="Agent" />
                                </div>
                                <div>
                                    <div className="font-bold text-[#333]">Ayden Office</div>
                                    <div className="text-xs text-[#F96302] font-bold">Property Manager</div>
                                </div>
                            </div>

                            <form className="space-y-3">
                                <input type="text" placeholder="Your Name" className="w-full bg-[#f9f9f9] border border-gray-200 rounded px-3 py-3 text-sm focus:border-[#F96302] outline-none"/>
                                <input type="email" placeholder="Your Email" className="w-full bg-[#f9f9f9] border border-gray-200 rounded px-3 py-3 text-sm focus:border-[#F96302] outline-none"/>
                                <input type="tel" placeholder="Your Phone" className="w-full bg-[#f9f9f9] border border-gray-200 rounded px-3 py-3 text-sm focus:border-[#F96302] outline-none"/>
                                <textarea rows={3} placeholder="I am interested in this property..." className="w-full bg-[#f9f9f9] border border-gray-200 rounded px-3 py-3 text-sm focus:border-[#F96302] outline-none"></textarea>
                                
                                <button className="w-full bg-[#F96302] hover:bg-[#d85502] text-white font-bold py-3 rounded transition-all">
                                    Submit Request
                                </button>
                                <button className="w-full border-2 border-navy text-navy font-bold py-3 rounded hover:bg-navy hover:text-white transition-all flex items-center justify-center gap-2">
                                    <Phone size={18}/> Call Us
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
        <div className="min-h-screen bg-[#f7f7f7] text-[#484848] font-sans">
            
            {/* --- IMPROVED HERO SECTION --- */}
            <section className="bg-gradient-to-br from-white to-gray-50 pt-8 pb-12 lg:pt-10 lg:pb-16 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                    
                    {/* Main Image (7 Cols) - Made more compact */}
                    <div className="lg:col-span-7 h-[320px] lg:h-[400px] w-full rounded-xl overflow-hidden shadow-md relative group">
                        <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-[#F96302] to-[#ff7b2e] text-white text-xs font-bold px-4 py-2 rounded-lg uppercase tracking-wider shadow-lg">
                            Now Leasing
                        </div>
                        <img
                            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1600"
                            alt="Ayden Home Towers Exterior"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 via-black/40 to-transparent h-2/3 pointer-events-none"></div>
                        <div className="absolute bottom-6 left-6 text-white z-20">
                            <div className="text-xs font-bold opacity-90 uppercase tracking-widest mb-1">Premium Living</div>
                            <div className="text-2xl lg:text-3xl font-extrabold leading-tight">Ayden Home Towers</div>
                            <div className="text-sm opacity-90 mt-1">Nairobi West</div>
                        </div>
                    </div>

                    {/* Content Side (5 Cols) - Improved text hierarchy */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="fade-in-up">
                            <div className="mb-4">
                                <h2 className="text-sm font-bold text-[#F96302] uppercase tracking-widest mb-2">Welcome to</h2>
                                <h1 className="text-3xl lg:text-4xl font-extrabold text-[#154279] leading-tight mb-4">
                                    Modern Living<br/>
                                    <span className="text-[#F96302]">Perfected.</span>
                                </h1>
                            </div>
                            
                            <p className="text-gray-600 text-sm lg:text-base leading-relaxed mb-6 font-normal tracking-tight">
                                Discover <strong className="font-bold text-[#154279]">Ayden Home Towers</strong> — a sanctuary in the city featuring luxury 1, 2, and 3-bedroom apartments. 
                                Secure, stylish, and built for community living.
                            </p>
                            
                            {/* Features Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="flex items-center gap-2 text-sm">
                                    <Shield size={16} className="text-[#F96302]" />
                                    <span className="font-medium">24/7 Security</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Wifi size={16} className="text-[#F96302]" />
                                    <span className="font-medium">Fiber Internet</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Home size={16} className="text-[#F96302]" />
                                    <span className="font-medium">Modern Design</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Zap size={16} className="text-[#F96302]" />
                                    <span className="font-medium">Backup Power</span>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 mb-6">
                                <button className="flex-1 bg-navy text-white py-3 px-4 rounded-lg font-bold text-sm shadow hover:shadow-md transition-all flex items-center justify-center gap-2">
                                    View All Units <ArrowRight size={16} />
                                </button>
                                <button className="flex-1 border-2 border-[#154279] text-[#154279] py-3 px-4 rounded-lg font-bold text-sm hover:bg-[#154279] hover:text-white transition-all flex items-center justify-center gap-2">
                                    <PlayCircle size={16} /> Virtual Tour
                                </button>
                            </div>
                        </div>

                        {/* Thumbnails Row - Made smaller */}
                        <div className="mt-4">
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Gallery</p>
                                <p className="text-xs font-bold text-[#F96302] cursor-pointer hover:underline flex items-center gap-1">
                                    View All <ChevronRight size={12} />
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 h-20">
                                <div className="relative rounded-lg overflow-hidden cursor-pointer group border border-gray-200">
                                    <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w-400" 
                                             className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                             alt="Lobby" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all"></div>
                                </div>
                                <div className="relative rounded-lg overflow-hidden cursor-pointer group border border-gray-200">
                                    <img src="https://images.unsplash.com/photo-1512918760383-eda2723ad6e1?q=80&w-400" 
                                             className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                             alt="Pool" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all"></div>
                                </div>
                                <div className="relative rounded-lg overflow-hidden cursor-pointer group border border-gray-200">
                                    <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w-400" 
                                             className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                             alt="Room" />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* --- END HERO SECTION --- */}

            {/* MAIN CONTENT AREA */}
            <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 relative z-30 mt-6">
                
                {/* SIDEBAR FILTER - NOW WITH BLUE THEME */}
                <div className="w-full md:w-[300px] flex-shrink-0">
                    <FilterSidebar filters={filters} setFilters={setFilters} />
                    
                    {/* Promo Banner */}
                    <div className="mt-6 bg-gradient-to-r from-[#F96302] to-[#ff7b2e] rounded-none p-5 text-white text-center shadow-lg hidden md:block">
                        <h4 className="font-bold text-lg mb-2">Move In Special!</h4>
                        <p className="text-xs opacity-90 mb-3">Get 50% OFF your first month's rent when you sign a lease for Wing A units.</p>
                        <button className="bg-white text-[#F96302] px-4 py-2 rounded-none font-bold text-xs hover:bg-gray-100 transition-colors">
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
                            <select className="border border-gray-200 rounded-none px-3 py-2 text-sm focus:outline-none focus:border-[#F96302] bg-white">
                                <option>Sort by: Newest</option>
                                <option>Sort by: Price (Low to High)</option>
                                <option>Sort by: Price (High to Low)</option>
                            </select>
                        </div>
                    </div>

                    {currentListings.length === 0 ? (
                        <div className="bg-white p-10 text-center rounded-none shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-400 mb-2">No units match your criteria.</h3>
                            <button 
                                onClick={()=>setFilters({keyword:"", type:"All", maxPrice:150000})} 
                                className="text-[#F96302] font-bold hover:underline text-sm"
                            >
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {currentListings.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="bg-white rounded-none overflow-hidden border border-gray-100 shadow-sm hover:shadow-md shadow-hover group flex flex-col transition-all duration-300"
                                >
                                    <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => setSelectedItem(item)}>
                                        <img src={item.gallery[0]} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute top-4 left-4 bg-gradient-to-r from-[#154279] to-[#1a56b4] text-white text-[10px] font-bold px-3 py-1 rounded-none uppercase tracking-wide shadow">
                                            {item.type}
                                        </div>
                                        {item.featured && (
                                            <div className="absolute top-4 right-4 bg-gradient-to-r from-[#F96302] to-[#ff7b2e] text-white text-[10px] font-bold px-2 py-1 rounded-none uppercase">
                                                FEATURED
                                            </div>
                                        )}
                                        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-none text-xs font-bold flex items-center gap-1 shadow-sm">
                                            <Maximize size={12}/> {item.gallery.length}
                                        </div>
                                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                                            <div className="text-white font-bold text-lg">KES {item.price.toLocaleString()}</div>
                                            <div className="text-white/80 text-xs">{item.floor}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h4 
                                            className="font-bold text-base text-[#222] mb-2 cursor-pointer hover:text-[#F96302] transition-colors leading-tight line-clamp-1"
                                            onClick={() => setSelectedItem(item)}
                                        >
                                            {item.title}
                                        </h4>
                                        <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                                            <MapPin size={12} className="text-gray-400"/> {item.location}
                                        </div>

                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {item.amenities.slice(0, 2).map((am:string, i:number) => (
                                                <span key={i} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-none">
                                                    {am}
                                                </span>
                                            ))}
                                            {item.amenities.length > 2 && (
                                                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-none">
                                                    +{item.amenities.length - 2}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-auto">
                                            <div className="flex gap-4 text-xs font-medium text-gray-500">
                                                <span className="flex items-center gap-1"><BedDouble size={13}/> {item.beds}</span>
                                                <span className="flex items-center gap-1"><Bath size={13}/> {item.baths}</span>
                                                <span className="flex items-center gap-1"><Maximize size={13}/> {item.sqft}</span>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedItem(item)}
                                                className="text-[#F96302] text-xs font-bold uppercase hover:text-[#d85502] transition-colors"
                                            >
                                                Details →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Pagination */}
                    {filteredListings.length > 0 && (
                        <div className="mt-10 flex justify-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(1)}
                                className={`w-10 h-10 rounded-none font-bold ${currentPage === 1 ? 'bg-navy text-white hover:bg-[#0f325e]' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                1
                            </button>
                            <button 
                                onClick={() => setCurrentPage(2)}
                                className={`w-10 h-10 rounded-none font-bold ${currentPage === 2 ? 'bg-[#154279] text-white hover:bg-[#0f325e]' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                2
                            </button>
                            {totalPages > 2 && (
                                <button 
                                    onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                    className="w-10 h-10 rounded-none bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 flex items-center justify-center"
                                >
                                    <ChevronRight size={16}/>
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