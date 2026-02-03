// src/pages/HomePage.tsx
import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Star,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Clock,
  Heart,
  Eye,
  Navigation,
  Plus,
  Minus,
  Layers,
  Search,
  X,
  CheckCircle2,
  BedDouble,
  User,
  Phone,
  Home,
  Shield,
  Zap,
  Wifi,
  ShoppingCart,
  Menu,
  PlayCircle,
  ArrowRight,
  AlertCircle,
  Waves,
  Dumbbell,
  Smartphone,
  Mountain,
  Flower2,
  Cable,
  Car,
  ShieldCheck,
  Shirt,
  Sofa,
  ChefHat
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Keep your existing import
import NavbarSection from "@/pages/NavbarSection";

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        .font-nunito { font-family: 'Nunito', sans-serif; }
        
        /* Custom scrollbar for consistency */
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #ccc; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #F96302; }
    `}</style>
);

// ==========================================
// 1. DATA (same)
// =========================================="
const VACANCY_SLIDES = [
  {
    id: 1,
    tag: "Move-In Special",
    headline: "New Vacancies\nJust Added",
    subhead: "Luxury Westlands Apartments",
    description: "Browse over 500+ verified listings with premium amenities. This stunning luxury unit features a fully equipped gym, Olympic-size swimming pool, and reliable backup generator. Move-in special: first month 50% off for verified tenants. Perfect for professionals and families seeking upscale urban living.",
    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop",
    price: "85,000",
    location: "Westlands, Nairobi",
    specs: "2 Bed • 2 Bath",
    badge: "Special Buy",
    mapId: 104,
    beds: 2,
    baths: 2,
    sqft: 1200,
    amenities: ["Gym Access", "Swimming Pool", "Backup Generator", "24/7 Security"],
    floor: "8th Floor",
    gallery: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800",
      "https://images.unsplash.com/photo-1616594039325-18dcd0b4a20c?q=80&w=800"
    ]
  },
  {
    id: 2,
    tag: "Just Listed",
    headline: "Garden Estate\nFamily Home",
    subhead: "Spacious 4-Bedroom Bungalow",
    description: "Located in a secure gated community with professionally landscaped grounds and a huge backyard ideal for recreation. This spacious family residence is perfect for families with children and pets. Features mature trees, ample parking, and proximity to top-rated schools and shopping centers.",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop",
    price: "150,000",
    location: "Garden Estate, Thika Rd",
    specs: "4 Bed • 3 Bath",
    badge: "New",
    mapId: 102,
    beds: 4,
    baths: 3,
    sqft: 2200,
    amenities: ["Gated Community", "Large Backyard", "Pet Friendly", "Parking"],
    floor: "Ground Floor",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800"
    ]
  },
  {
    id: 3,
    tag: "Best Value",
    headline: "Modern CBD\nStudio Lofts",
    subhead: "Walking Distance to Offices",
    description: "Premium studio apartments featuring high-speed elevator access, fiber-ready connectivity for remote work, and exclusive rooftop lounge. Modern finishes with open-concept layouts. Ideal for young professionals and entrepreneurs. Studios starting at competitive rates with flexible lease terms.",
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2070&auto=format&fit=crop",
    price: "35,000",
    location: "Moi Avenue, CBD",
    specs: "Studio • 450 sqft",
    badge: "Hot Deal",
    mapId: 101,
    beds: 0,
    baths: 1,
    sqft: 450,
    amenities: ["High-Speed Elevator", "Fiber Ready", "Rooftop Lounge", "Central Location"],
    floor: "12th Floor",
    gallery: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=800",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800"
    ]
  }
];

const LISTINGS_DATA = [
  {
    id: 101,
    title: "Modern Downtown Loft",
    address: "1200 Moi Ave, CBD",
    price: "85,000",
    beds: 1, baths: 1, sqft: 850,
    rating: 4.8, reviews: 24,
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=500&auto=format&fit=crop",
    badge: "Top Rated",
    mapArea: "CBD",
    amenities: ["City View", "Modern Kitchen", "Balcony", "Gym Access", "High-Speed Wifi", "Smart Home"],
    floor: "15th Floor",
    description: "Experience premium urban living at its finest in this modern downtown loft featuring panoramic city views, high-end finishes, and integrated smart home technology. Located on the 15th floor with excellent natural lighting and contemporary interior design. Perfect for professionals.",
    gallery: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200",
      "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=800",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800"
    ]
  },
  {
    id: 102,
    title: "Suburban Family Home",
    address: "45 Karen Road, Karen",
    price: "150,000",
    beds: 3, baths: 2, sqft: 1500,
    rating: 4.9, reviews: 12,
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=500&auto=format&fit=crop",
    badge: null,
    mapArea: "Karen",
    amenities: ["Spacious Garden", "Garage", "Children's Play Area", "Quiet Neighborhood", "Parking", "Gated Community"],
    floor: "Ground Floor",
    description: "Perfect family home in the serene and prestigious Karen neighborhood. This residential gem features a spacious well-maintained garden, modern fully-equipped kitchen, children's play area, and proximity to top international schools. Quiet, secure, and family-friendly environment.",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800"
    ]
  },
  {
    id: 103,
    title: "Cozy Studio Apartment",
    address: "88 Thika Rd, Roysambu",
    price: "25,000",
    beds: 0, baths: 1, sqft: 450,
    rating: 4.5, reviews: 8,
    img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=500&auto=format&fit=crop",
    badge: "Best Value",
    mapArea: "Roysambu",
    amenities: ["Affordable", "Furnished", "Utilities Included", "Laundry Access", "24/7 Security"],
    floor: "5th Floor",
    description: "Fully furnished studio apartment with all utilities included in a vibrant neighborhood. Perfect for students, young professionals, or anyone starting out in the city. Building features 24/7 security, laundry facilities, and communal areas.",
    gallery: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800",
      "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=800"
    ]
  },
  {
    id: 104,
    title: "Luxury Condo w/ View",
    address: "500 Westlands Rd, Westlands",
    price: "210,000",
    beds: 2, baths: 2, sqft: 1200,
    rating: 5.0, reviews: 3,
    img: "https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=500&auto=format&fit=crop",
    badge: "New",
    mapArea: "Westlands",
    amenities: ["Panoramic View", "Private Terrace", "Jacuzzi", "Smart Home", "Swimming Pool", "Backup Generator"],
    floor: "20th Floor",
    description: "The ultimate luxury condo offering breathtaking panoramic city views from the 20th floor. Features a private terrace with outdoor kitchen, built-in jacuzzi, and integrated smart home technology. Premium finishes throughout with contemporary design aesthetics.",
    gallery: [
      "https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=1200",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800",
      "https://images.unsplash.com/photo-1616594039325-18dcd0b4a20c?q=80&w=800"
    ]
  },
  {
    id: 105,
    title: "Modern Apartment with Pool",
    address: "120 Forest Road, Kilimani",
    price: "95,000",
    beds: 2, baths: 2, sqft: 950,
    rating: 4.7, reviews: 15,
    img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=500&auto=format&fit=crop",
    badge: "Featured",
    mapArea: "Kilimani",
    amenities: ["Swimming Pool", "Gym Access", "Backup Generator", "24/7 Security", "Modern Kitchen", "Balcony"],
    floor: "7th Floor",
    description: "Contemporary apartment complex in the heart of Kilimani with world-class amenities including Olympic-size swimming pool, fully equipped gym, and 24-hour security. Perfect for families and young professionals seeking luxury living.",
    gallery: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800"
    ]
  },
  {
    id: 106,
    title: "Cozy Westlands Studio",
    address: "88 Westlands Avenue, Westlands",
    price: "45,000",
    beds: 0, baths: 1, sqft: 550,
    rating: 4.6, reviews: 10,
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=500&auto=format&fit=crop",
    badge: "Hot Deal",
    mapArea: "Westlands",
    amenities: ["High-Speed Wifi", "Fiber Ready", "Modern Kitchen", "Furnished", "Utilities Included"],
    floor: "10th Floor",
    description: "Stylish studio apartment perfectly situated in the vibrant Westlands district. Fully equipped with high-speed fiber connectivity, ideal for digital nomads and remote workers. Walking distance to restaurants, shopping, and entertainment.",
    gallery: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800",
      "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=800"
    ]
  },
  {
    id: 107,
    title: "Executive Penthouse",
    address: "500 Upper Hill Road, Upper Hill",
    price: "280,000",
    beds: 3, baths: 3, sqft: 1800,
    rating: 5.0, reviews: 2,
    img: "https://images.unsplash.com/photo-1616594039325-18dcd0b4a20c?q=80&w=500&auto=format&fit=crop",
    badge: "Luxury",
    mapArea: "Upper Hill",
    amenities: ["Panoramic View", "Private Elevator", "Home Theater", "Chef's Kitchen", "Wine Cellar", "Smart Home"],
    floor: "22nd Floor",
    description: "Exclusive penthouse offering unparalleled luxury and sophistication. Features a private elevator access, smart home automation, wine cellar, and 360-degree city views. Perfect for discerning executives.",
    gallery: [
      "https://images.unsplash.com/photo-1616594039325-18dcd0b4a20c?q=80&w=1200",
      "https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=800",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800"
    ]
  },
  {
    id: 109,
    title: "1-Bedroom City Center",
    address: "250 Haile Selassie Ave, CBD",
    price: "55,000",
    beds: 1, baths: 1, sqft: 680,
    rating: 4.6, reviews: 9,
    img: "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=500&auto=format&fit=crop",
    badge: null,
    mapArea: "CBD",
    amenities: ["City View", "Modern Kitchen", "Gym Access", "Security", "Furnished"],
    floor: "8th Floor",
    description: "Compact 1-bedroom apartment in the bustling CBD perfect for professionals. Modern finishes with good natural lighting and easy access to business district.",
    gallery: [
      "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=1200",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800"
    ]
  },
  {
    id: 110,
    title: "3-Bedroom Family Home",
    address: "72 Spring Valley, Nairobi",
    price: "175,000",
    beds: 3, baths: 2, sqft: 1400,
    rating: 4.9, reviews: 14,
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=500&auto=format&fit=crop",
    badge: null,
    mapArea: "Spring Valley",
    amenities: ["Spacious Garden", "Parking", "Quiet Neighborhood", "Garage", "Security", "Backup Generator"],
    floor: "Ground Floor",
    description: "Spacious 3-bedroom family home in the peaceful Spring Valley neighborhood with large garden and parking. Ideal for families with children.",
    gallery: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800"
    ]
  },
  {
    id: 111,
    title: "4-Bedroom Luxury Estate",
    address: "15 Muthaiga Estate, Muthaiga",
    price: "320,000",
    beds: 4, baths: 3, sqft: 2000,
    rating: 5.0, reviews: 5,
    img: "https://images.unsplash.com/photo-1616594039325-18dcd0b4a20c?q=80&w=500&auto=format&fit=crop",
    badge: "Luxury",
    mapArea: "Muthaiga",
    amenities: ["Large Garden", "Swimming Pool", "Home Theater", "Smart Home", "Security", "Backup Generator"],
    floor: "Ground Floor",
    description: "Premium 4-bedroom estate in exclusive Muthaiga neighborhood featuring swimming pool, large grounds, and smart home technology. Perfect for executives.",
    gallery: [
      "https://images.unsplash.com/photo-1616594039325-18dcd0b4a20c?q=80&w=1200",
      "https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=800",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800"
    ]
  },
  {
    id: 112,
    title: "1-Bedroom Kilimani Apartment",
    address: "88 Kenyatta Avenue, Kilimani",
    price: "62,000",
    beds: 1, baths: 1, sqft: 720,
    rating: 4.7, reviews: 11,
    img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=500&auto=format&fit=crop",
    badge: null,
    mapArea: "Kilimani",
    amenities: ["Balcony", "Gym Access", "Swimming Pool", "Utilities Included", "Security"],
    floor: "6th Floor",
    description: "Modern 1-bedroom apartment in Kilimani with access to shared gym and pool. Perfect for young professionals seeking comfort and convenience.",
    gallery: [
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800",
      "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=800"
    ]
  },
  {
    id: 113,
    title: "2-Bedroom Westlands Apartment",
    address: "200 Mpaka Road, Westlands",
    price: "125,000",
    beds: 2, baths: 2, sqft: 1050,
    rating: 4.8, reviews: 12,
    img: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=500&auto=format&fit=crop",
    badge: "Featured",
    mapArea: "Westlands",
    amenities: ["City View", "Gym Access", "Security", "Parking", "Modern Kitchen", "Fiber Ready"],
    floor: "9th Floor",
    description: "Contemporary 2-bedroom apartment in vibrant Westlands with excellent views, modern kitchen, and high-speed fiber connectivity.",
    gallery: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1200",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800"
    ]
  },
  {
    id: 114,
    title: "Studio Upper Hill",
    address: "150 Limuru Road, Upper Hill",
    price: "38,000",
    beds: 0, baths: 1, sqft: 420,
    rating: 4.5, reviews: 7,
    img: "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=500&auto=format&fit=crop",
    badge: "Budget",
    mapArea: "Upper Hill",
    amenities: ["Furnished", "Utilities Included", "Security", "Laundry Access", "Affordable"],
    floor: "3rd Floor",
    description: "Affordable studio apartment in Upper Hill, fully furnished with utilities included. Perfect for budget-conscious renters and students.",
    gallery: [
      "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=1200",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800"
    ]
  }
];

// ==========================================
// DETAIL MODAL (HowItWorks DESIGN STYLING)
// ==========================================
const DetailModal = ({ item, onClose }: { item: any; onClose: () => void }) => {
  if (!item) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto custom-scroll font-nunito"
    >
      {/* Header / Nav inside Modal */}
      <div className="sticky top-0 bg-white shadow-lg shadow-slate-200/50 z-50 px-4 md:px-8 h-16 flex items-center justify-between border-b border-slate-200 font-nunito">
        <div className="font-bold text-xl text-[#154279] tracking-tighter uppercase">AYDEN<span className="text-[#F96302]">HOMES</span></div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-none bg-gray-100 hover:bg-[#F96302] hover:text-white flex items-center justify-center transition-all"
        >
          <X size={18} />
        </button>
      </div>
      <div className="max-w-7xl mx-auto bg-white min-h-screen pb-20 shadow-2xl font-nunito">
        {/* 1. Title Header Section */}
        <div className="p-6 md:p-10 pb-4 flex flex-col md:flex-row justify-between items-start border-b border-slate-200 bg-slate-50/50">
          <div>
            <div className="flex gap-2 mb-3">
              <span className="bg-gradient-to-r from-[#154279] to-[#0f325e] text-white text-xs font-bold px-3 py-1 rounded-none uppercase tracking-wider">For Rent</span>
              {item.badge && <span className="bg-[#154279] text-white text-xs font-bold px-3 py-1 rounded-none uppercase tracking-wider">{item.badge}</span>}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#154279] mb-2 tracking-tight">{item.title || item.subhead || item.headline}</h1>
            <p className="text-gray-600 flex items-center gap-2 text-sm font-bold">
              <MapPin size={16} className="text-[#F96302]" /> {item.address || item.location} - {item.floor}
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <div className="text-3xl font-extrabold text-[#F96302]">KES {parseInt(item.price.replace(',', '')).toLocaleString()}</div>
            <p className="text-gray-400 font-bold text-sm">/ Month</p>
          </div>
        </div>
        {/* 2. Gallery Section */}
        <div className="p-6 md:p-10 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-[400px]">
            <div className="md:col-span-2 relative group overflow-hidden rounded-none">
              <img src={item.gallery ? item.gallery[0] : item.img} alt="Main" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-none text-xs font-bold shadow flex items-center gap-2 cursor-pointer hover:bg-[#F96302] hover:text-white transition-colors">
                <Maximize size={14} /> View Photos
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <img src={item.gallery ? item.gallery[1] : item.img} alt="Sub 1" className="h-1/2 w-full object-cover rounded-none" />
              <img src={item.gallery ? item.gallery[2] : item.img} alt="Sub 2" className="h-1/2 w-full object-cover rounded-none" />
            </div>
          </div>
        </div>
        {/* 3. Main Content & Sidebar */}
        <div className="p-6 md:p-10 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT COLUMN: Details */}
          <div className="lg:col-span-2">
            {/* Quick Overview Badges */}
            <div className="bg-slate-50 p-6 rounded-none flex flex-wrap gap-6 md:gap-12 mb-8 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <BedDouble size={22} className="text-[#F96302]" />
                <div>
                  <span className="block font-bold text-base text-[#222]">{item.beds}</span>
                  <span className="text-xs text-gray-500 font-bold uppercase">Bedrooms</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bath size={22} className="text-[#F96302]" />
                <div>
                  <span className="block font-bold text-base text-[#222]">{item.baths}</span>
                  <span className="text-xs text-gray-500 font-bold uppercase">Bathrooms</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Maximize size={22} className="text-[#F96302]" />
                <div>
                  <span className="block font-bold text-base text-[#222]">{item.sqft}</span>
                  <span className="text-xs text-gray-500 font-bold uppercase">Sq Ft</span>
                </div>
              </div>
            </div>
            {/* Description */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#154279] mb-4 border-b border-slate-200 pb-2 uppercase tracking-widest">Description</h3>
              <p className="text-gray-600 leading-relaxed text-sm font-medium">
                {item.description}
                <br /><br />
                Living in this property offers a unique blend of comfort and convenience.
                Enjoy dedicated maintenance teams, secure access, and modern amenities designed for contemporary living.
              </p>
            </div>

            {/* Property Details Table */}
            <div className="bg-slate-50 p-6 rounded-none mb-8 border border-slate-200 shadow-md">
              <h3 className="text-base font-bold text-[#154279] mb-4 uppercase tracking-widest">Property Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 text-sm">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-[#555]">Property ID:</span>
                  <span className="text-gray-500">{item.id}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-[#555]">Price:</span>
                  <span className="text-gray-500">KES {parseInt(item.price.replace(',', '')).toLocaleString()}</span>
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
                  <span className="text-gray-500">{item.beds === 0 ? 'Studio' : `${item.beds} Bedroom`}</span>
                </div>
              </div>
            </div>
          </div>
          {/* RIGHT COLUMN: Contact Form */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-[#154279] to-[#0f325e] border border-[#154279] rounded-none p-6 shadow-lg sticky top-24">
              <h4 className="text-base font-bold text-white mb-4 uppercase tracking-widest">Schedule a Tour</h4>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                  <img src="https://i.pravatar.cc/150?u=property" alt="Agent" />
                </div>
                <div>
                  <div className="font-bold text-white font-medium">Property Manager</div>
                  <div className="text-xs text-gray-200 font-bold uppercase">AYDEN HOMES</div>
                </div>
              </div>
              <form className="space-y-3">
                <input type="text" placeholder="Your Name" className="w-full bg-white/10 border border-white/30 rounded-none px-3 py-3 text-sm text-white placeholder:text-white/60 focus:ring-1 focus:ring-white/50 outline-none font-medium" />
                <input type="email" placeholder="Your Email" className="w-full bg-white/10 border border-white/30 rounded-none px-3 py-3 text-sm text-white placeholder:text-white/60 focus:ring-1 focus:ring-white/50 outline-none font-medium" />
                <input type="tel" placeholder="Your Phone" className="w-full bg-white/10 border border-white/30 rounded-none px-3 py-3 text-sm text-white placeholder:text-white/60 focus:ring-1 focus:ring-white/50 outline-none font-medium" />
                <textarea rows={3} placeholder="I am interested in this property..." className="w-full bg-white border border-gray-200 rounded-none px-3 py-3 text-sm focus:border-[#F96302] outline-none font-medium"></textarea>
                <button className="w-full bg-[#F96302] text-white font-bold py-3 rounded-none hover:bg-[#d85502] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
                  Submit Request
                </button>
                <button className="w-full border-2 border-white text-white font-bold py-3 rounded-none hover:bg-white hover:text-[#154279] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                  <Phone size={16} /> Call Us
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ==========================================
// UPDATED LISTING CARD (HowItWorks STYLING)
// ==========================================
const ListingCard = ({ data, onClick, isActive }: { data: any; onClick: () => void; isActive?: boolean }) => {
  const [isSaved, setIsSaved] = useState(false);
  
  const handleViewProperty = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };
  
  return (
    <div
      className={`bg-white rounded-none overflow-hidden border transition-all duration-300 group flex flex-col font-nunito shadow-md cursor-pointer ${isActive ? 'border-[#F96302] shadow-lg ring-1 ring-[#F96302]/20' : 'border-slate-200 hover:border-[#154279] hover:shadow-lg'}`}
      onClick={handleViewProperty}
    >
      <div className="relative h-48 overflow-hidden cursor-pointer" onClick={handleViewProperty}>
        <img src={data.img} alt={data.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute top-4 left-4 bg-[#154279] text-white text-xs font-bold px-3 py-1 rounded-none uppercase tracking-wider shadow-md">
          {data.beds === 0 ? "Studio" : `${data.beds} Bedroom`}
        </div>

        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-none text-xs font-bold flex items-center gap-1 shadow-md">
          <Maximize size={12} /> 3
        </div>
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-3 pt-8">
          <div className="text-white font-bold text-base">KES {data.price}</div>
          <div className="text-white/80 text-xs font-bold">{data.floor}</div>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h4
          className="font-bold text-sm text-[#154279] mb-2 cursor-pointer hover:text-[#F96302] transition-colors leading-tight line-clamp-1 uppercase"
          onClick={onClick}
        >
          {data.title}
        </h4>
        <div className="text-xs text-gray-600 mb-3 flex items-center gap-1 font-bold">
          <MapPin size={12} className="text-[#F96302]" /> {data.address}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                className={
                  i < Math.floor(data.rating) ? "fill-[#F96302] text-[#F96302]" : "text-gray-300"
                }
              />
            ))}
          </div>
          <span className="text-xs text-gray-600 font-bold">({data.reviews} reviews)</span>
        </div>

        <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-auto">
          <div className="flex gap-4 text-xs font-bold text-[#154279]">
            <span className="flex items-center gap-1"><Bed size={13} /> {data.beds}</span>
            <span className="flex items-center gap-1"><Bath size={13} /> {data.baths}</span>
            <span className="flex items-center gap-1"><Maximize size={13} /> {data.sqft}</span>
          </div>
          <button
            onClick={handleViewProperty}
            className="text-[#F96302] text-xs font-bold uppercase hover:text-[#d85502] transition-colors flex items-center gap-1 hover:underline"
          >
            Open in New <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// CAROUSEL & CARD (UPDATED WITH HowItWorks STYLING)
// ==========================================
const VacancyCarousel = ({ onCardClick, onSlideChange }: { onCardClick: (slide: any) => void; onSlideChange: (slideId: number) => void }) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const slideIndex = Math.abs(page % VACANCY_SLIDES.length);
  const currentSlide = VACANCY_SLIDES[slideIndex];
  
  useEffect(() => {
    const timer = setInterval(() => paginate(1), 5000);
    return () => clearInterval(timer);
  }, [page]);
  
  useEffect(() => {
    onSlideChange(currentSlide.mapId);
  }, [slideIndex]);
  
  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };
  
  const goToSlide = (index: number) => {
    const direction = index > slideIndex ? 1 : -1;
    setPage([index, direction]);
  };
  
  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 1, zIndex: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? "100%" : "-100%", opacity: 1 })
  };
  
  return (
    <div className="relative w-full h-[500px] lg:h-[600px] font-nunito overflow-hidden">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
          className="absolute inset-0 h-full w-full"
        >
          {/* Full-width Image */}
          <div className="w-full h-full relative overflow-hidden">
            <img src={currentSlide.img} alt="Property" className="w-full h-full object-cover" />
            
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
            
            {/* Text overlay - positioned at bottom left */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-16">
              <div className="max-w-[700px]">
                <h1 className="text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-white leading-none mb-3 uppercase tracking-tight">
                  {currentSlide.headline.split("\n")[0]}{" "}
                  <span className="text-[#F96302]">{currentSlide.headline.split("\n")[1]}</span>
                </h1>
                
                <p className="text-xs md:text-sm font-bold text-white/90 mb-4 uppercase tracking-[0.15em]">
                  {currentSlide.subhead}
                </p>
                
                <div className="w-12 h-1 bg-[#F96302] mb-4"></div>
                
                <p className="text-xs md:text-sm text-white/80 font-medium mb-6 leading-relaxed max-w-[550px] hidden md:block line-clamp-1">
                  {currentSlide.description.substring(0, 80)}...
                </p>
                
                <button 
                  className="bg-[#F96302] text-white font-bold py-3 px-8 hover:bg-[#d85502] transition-all shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em]" 
                  onClick={() => onCardClick(currentSlide)}
                >
                  View This Listing <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const HomePage = () => {
  const [previewListing, setPreviewListing] = useState<any>(null);
  const [activeSlideId, setActiveSlideId] = useState<number>(104);
  const [activeListingId, setActiveListingId] = useState<number | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedBedroom, setSelectedBedroom] = useState<string>("");
  const [selectedPrice, setSelectedPrice] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const locations = ["Pangani", "CBD", "Westlands", "Kilimani", "Karen", "Roysambu", "Upper Hill", "Spring Valley", "Muthaiga", "Riverside"];

  useEffect(() => {
    let dir = 1;
    let current = 0;
    const interval = setInterval(() => {
      if (current >= locations.length - 1) dir = -1;
      if (current <= 0) dir = 1;
      current += dir;
      setHighlightedIndex(current);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const amenitiesList = [
    "Swimming Pool", "Gym Access", "High-Speed Wifi", "Smart Home", 
    "Panoramic View", "Garden Access", "Fiber Ready", "Backup Generator",
    "Parking", "Security", "Laundry", "Furnished", "Balcony", "Modern Kitchen"
  ];

  const amenityIcons: Record<string, any> = {
    "Swimming Pool": Waves,
    "Gym Access": Dumbbell,
    "High-Speed Wifi": Wifi,
    "Smart Home": Smartphone,
    "Panoramic View": Mountain,
    "Garden Access": Flower2,
    "Fiber Ready": Cable,
    "Backup Generator": Zap,
    "Parking": Car,
    "Security": ShieldCheck,
    "Laundry": Shirt,
    "Furnished": Sofa,
    "Balcony": Mountain,
    "Modern Kitchen": ChefHat
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const openPreview = (listing: any) => {
    setPreviewListing(listing);
    setActiveListingId(listing.id);
  };

  const closePreview = () => setPreviewListing(null);

  const handleSlideChange = (slideId: number) => {
    setActiveSlideId(slideId);
  };

  const handleListingClick = (listing: any) => {
    openPreview(listing);
    const mapPinId = VACANCY_SLIDES.find(slide =>
      slide.location.includes(listing.mapArea) || listing.mapArea.includes(slide.location?.split(',')[0])
    )?.mapId || listing.id;
    setActiveSlideId(mapPinId);
  };

  // Filtering logic
  const filteredListings = LISTINGS_DATA.filter((listing) => {
    const amenityMatch = selectedAmenities.length === 0 || selectedAmenities.some(am => 
      listing.amenities.some(la => la.toLowerCase().includes(am.toLowerCase()))
    );
    const bedroomMatch = !selectedBedroom || (selectedBedroom === "0" ? listing.beds === 0 : listing.beds === parseInt(selectedBedroom));
    const locationMatch = !selectedLocation || listing.mapArea === selectedLocation;
    
    let priceMatch = true;
    if (selectedPrice) {
      const price = parseInt(listing.price.replace(',', ''));
      if (selectedPrice === "budget") priceMatch = price < 35000;
      else if (selectedPrice === "economy") priceMatch = price >= 35000 && price <= 60000;
      else if (selectedPrice === "standard") priceMatch = price > 60000 && price <= 100000;
      else if (selectedPrice === "premium") priceMatch = price > 100000 && price <= 150000;
      else if (selectedPrice === "luxury") priceMatch = price > 150000;
    }
    
    return amenityMatch && bedroomMatch && priceMatch && locationMatch;
  });

  // Auto-open details when only one listing matches
  useEffect(() => {
    if (filteredListings.length === 1) {
      openPreview(filteredListings[0]);
    } else {
      closePreview();
    }
  }, [filteredListings]);

  return (
    <>
      <GlobalStyles />
      <div className="antialiased min-h-screen bg-[#f7f7f7] text-[#484848] font-nunito">
        <NavbarSection />

        {/* Hero Carousel - Full width edge to edge */}
        <div className="w-full">
          <VacancyCarousel
            onCardClick={openPreview}
            onSlideChange={handleSlideChange}
          />
        </div>

        <main className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6 font-nunito">
          {/* Quick Search Section - HowItWorks Inspired Design */}
          <div className="mb-8">
            {/* Header with Gradient Background */}
            <div className="bg-gradient-to-r from-[#154279] to-[#0f325e] px-6 md:px-8 py-5 relative overflow-hidden rounded-t-lg">
              <div className="absolute top-0 right-0 w-48 h-full bg-white/5 skew-x-12 pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/10 p-2.5 rounded-none backdrop-blur-sm border border-white/10">
                  <Search size={18} className="text-[#F96302]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white tracking-widest uppercase">Quick Search Filters</h3>
                  <p className="text-xs text-slate-300 mt-0.5 font-bold opacity-80">Find your perfect property in seconds</p>
                </div>
              </div>
            </div>

            {/* Filter Content */}
            <div className="p-6 md:p-8 bg-[#f7f7f7]">
              {/* Amenities Checkboxes */}
              <div className="mb-8 pb-8 border-b border-slate-200/40">
                <div className="flex items-center gap-2 mb-5">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#154279]">✨ Select Amenities</h4>
                  {selectedAmenities.length > 0 && <span className="text-[10px] font-bold bg-[#F96302] text-white px-2 py-0.5 rounded-none">{selectedAmenities.length} Selected</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {amenitiesList.map((amenity, idx) => {
                    const Icon = amenityIcons[amenity] || Star;
                    return (
                    <label key={idx} className="flex items-center gap-2 cursor-pointer group p-2.5 rounded-lg hover:bg-white/50 transition-all duration-200">
                      <div className={`
                        w-5 h-5 rounded-none border-2 flex items-center justify-center transition-all flex-shrink-0
                        ${selectedAmenities.includes(amenity) 
                          ? 'bg-[#F96302] border-[#F96302] shadow-sm shadow-orange-500/30' 
                          : 'border-slate-300 group-hover:border-[#F96302]'
                        }
                      `}>
                        {selectedAmenities.includes(amenity) && (
                          <CheckCircle2 size={14} className="text-white" />
                        )}
                      </div>
                      <input 
                        type="checkbox" 
                        checked={selectedAmenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        <Icon size={20} className="text-[#F96302] stroke-[2.5]" />
                        <span className="text-sm font-extrabold text-[#154279]">
                          {amenity}
                        </span>
                      </div>
                    </label>
                  )})}
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-5">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#154279]">📍 Select Location</h4>
                  {selectedLocation && <span className="text-[10px] font-bold bg-[#F96302] text-white px-2 py-0.5 rounded-none">1 Selected</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {locations.map((loc, idx) => (
                    <button
                      key={loc}
                      onClick={() => {
                        if (loc === "Pangani") {
                          window.location.href = "/features";
                        } else {
                          setSelectedLocation(selectedLocation === loc ? "" : loc);
                        }
                      }}
                      className={`px-3 py-2.5 rounded-none border-2 font-bold text-xs transition-all duration-300 ease-out tracking-wide uppercase group transform hover:-translate-y-1 hover:shadow-lg active:scale-95 ${
                        selectedLocation === loc || highlightedIndex === idx
                          ? 'bg-[#154279] text-white border-[#154279] shadow-md shadow-blue-900/20'
                          : 'bg-[#F96302] text-white border-[#F96302] hover:bg-[#154279] hover:border-[#154279]'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Other Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7">
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#154279] mb-3 block">🛏️ Bedrooms</label>
                  <select 
                    value={selectedBedroom}
                    onChange={(e) => setSelectedBedroom(e.target.value)}
                    className="w-full border-2 border-slate-300 p-3 rounded-lg text-sm text-[#484848] focus:ring-2 focus:ring-[#F96302] focus:border-[#F96302] outline-none cursor-pointer bg-white/80 hover:bg-white hover:border-[#154279] transition-all font-bold"
                  >
                    <option value="">All Types</option>
                    <option value="0">Studio</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4">4 Bedrooms</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#154279] mb-3 block">💰 Price Range</label>
                  <select 
                    value={selectedPrice}
                    onChange={(e) => setSelectedPrice(e.target.value)}
                    className="w-full border-2 border-slate-300 p-3 rounded-lg text-sm text-[#484848] focus:ring-2 focus:ring-[#F96302] focus:border-[#F96302] outline-none cursor-pointer bg-white/80 hover:bg-white hover:border-[#154279] transition-all font-bold"
                  >
                    <option value="">All Prices</option>
                    <option value="budget">Under 35,000</option>
                    <option value="economy">35,000 - 60,000</option>
                    <option value="standard">60,000 - 100,000</option>
                    <option value="premium">100,000 - 150,000</option>
                    <option value="luxury">150,000+</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Display */}
              {(selectedAmenities.length > 0 || selectedBedroom || selectedPrice || selectedLocation) && (
                <div className="pt-6 border-t-2 border-slate-200/40">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active Filters:</span>
                    {selectedLocation && (
                      <span className="bg-gradient-to-r from-[#F96302] to-[#d85502] text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-sm">
                        📍 {selectedLocation}
                      </span>
                    )}
                    {selectedAmenities.map(am => (
                      <span key={am} className="bg-gradient-to-r from-[#154279] to-[#0f325e] text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-sm">
                        ✓ {am}
                      </span>
                    ))}
                    {selectedBedroom && (
                      <span className="bg-slate-300 text-slate-700 text-xs px-3 py-1.5 rounded-full font-bold">
                        🛏️ {selectedBedroom === "0" ? "Studio" : `${selectedBedroom} Bed`}
                      </span>
                    )}
                    {selectedPrice && (
                      <span className="bg-slate-300 text-slate-700 text-xs px-3 py-1.5 rounded-full font-bold">
                        💰 {selectedPrice}
                      </span>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedAmenities([]);
                        setSelectedBedroom("");
                        setSelectedPrice("");
                        setSelectedLocation("");
                      }}
                      className="ml-auto text-xs font-bold text-white bg-[#154279] hover:bg-[#0f2e54] px-4 py-1.5 rounded-full uppercase tracking-wider transition-all hover:shadow-md"
                    >
                      ✕ Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trending Rentals - Only Show When Filters Are Applied */}
          {(selectedAmenities.length > 0 || selectedBedroom || selectedPrice || selectedLocation) ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-[#154279] flex items-center gap-2 uppercase tracking-widest">
                  <MapPin className="text-[#F96302]" size={18} />
                  Ayden Homes {filteredListings.length > 0 && `(${filteredListings.length} results)`}
                </h2>
                <span 
                  onClick={() => {
                    setSelectedAmenities([]);
                    setSelectedBedroom("");
                    setSelectedPrice("");
                    setSelectedLocation("");
                  }}
                  className="text-xs font-bold text-[#F96302] cursor-pointer hover:underline uppercase tracking-wider"
                >
                  Reset Filters &gt;
                </span>
              </div>
              {/* Grid with Property Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5 w-full">
                {filteredListings.length > 0 ? (
                  filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      data={listing}
                      isActive={activeSlideId === listing.id || activeListingId === listing.id}
                      onClick={() => handleListingClick(listing)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-lg font-bold text-slate-600">No properties match your filters.</p>
                    <button 
                      onClick={() => {
                        setSelectedAmenities([]);
                        setSelectedBedroom("");
                        setSelectedPrice("");
                        setSelectedLocation("");
                      }}
                      className="mt-4 bg-[#154279] text-white font-bold py-2 px-6 rounded-none hover:bg-[#0f2e54] transition-colors uppercase text-sm tracking-wider"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
              {/* Info Box */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-none flex items-center gap-2.5 text-[#154279]">
                <AlertCircle size={16} className="shrink-0 text-[#F96302]" />
                <p className="text-[11px] leading-relaxed font-bold">
                  Click any property to open it in a new browser window
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6 text-center py-12 bg-white border border-slate-200 rounded-none shadow-md">
              <div className="flex flex-col items-center gap-4">
                <MapPin size={40} className="text-red-500" />
                <div>
                  <h3 className="text-lg font-bold text-[#154279] mb-2 uppercase tracking-widest">Apply Filters to Search</h3>
                  <p className="text-sm text-slate-600 font-bold">Use the filters above to find properties by location, amenities, bedrooms, and price</p>
                </div>
              </div>
            </div>
          )}
        </main>
        
        {/* Ayden Design Detail Modal */}
        <AnimatePresence>
          {previewListing && (
            <DetailModal item={previewListing} onClose={closePreview} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default HomePage;
