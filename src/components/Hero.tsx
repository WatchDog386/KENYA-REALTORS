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
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Keep your existing import
import NavbarSection from "@/pages/NavbarSection";

// ==========================================
// 1. DATA (same)
// ==========================================
const VACANCY_SLIDES = [
  {
    id: 1,
    tag: "Move-In Special",
    headline: "New Vacancies\nJust Added",
    subhead: "Luxury Westlands Apartments",
    description: "Browse over 500+ verified listings. This unit features a gym, pool, and backup generator. First month 50% off.",
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
    description: "Located in a secure gated community with a huge backyard. Perfect for families with pets.",
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
    description: "High-speed elevator, fibre ready, and rooftop lounge access included. Studios starting low.",
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
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=400&auto=format&fit=crop",
    badge: "Top Rated",
    mapArea: "CBD",
    amenities: ["City View", "Modern Kitchen", "Balcony", "Gym Access"],
    floor: "15th Floor",
    description: "Experience urban living at its finest in this modern downtown loft featuring panoramic city views, premium finishes, and smart home technology.",
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
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop",
    badge: null,
    mapArea: "Karen",
    amenities: ["Spacious Garden", "Garage", "Children's Play Area", "Quiet Neighborhood"],
    floor: "Ground Floor",
    description: "Perfect family home in a serene Karen neighborhood. Features a spacious garden, modern kitchen, and proximity to international schools.",
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
    img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400&auto=format&fit=crop",
    badge: "Best Value",
    mapArea: "Roysambu",
    amenities: ["Affordable", "Furnished", "Utilities Included", "Laundry Access"],
    floor: "5th Floor",
    description: "Fully furnished studio apartment with all utilities included. Perfect for students or young professionals starting out in the city.",
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
    img: "https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=400&auto=format&fit=crop",
    badge: "New",
    mapArea: "Westlands",
    amenities: ["Panoramic View", "Private Terrace", "Jacuzzi", "Smart Home"],
    floor: "20th Floor",
    description: "The ultimate luxury condo offering breathtaking city views, private terrace with outdoor kitchen, and premium finishes throughout.",
    gallery: [
      "https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=1200",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800",
      "https://images.unsplash.com/photo-1616594039325-18dcd0b4a20c?q=80&w=800"
    ]
  }
];

// ==========================================
// DETAIL MODAL (AYDEN DESIGN)
// ==========================================
const DetailModal = ({ item, onClose }: { item: any; onClose: () => void }) => {
  if (!item) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto custom-scroll risa-font"
    >
      {/* Header / Nav inside Modal */}
      <div className="sticky top-0 bg-white shadow-md z-50 px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="font-bold text-xl text-navy risa-heading">AYDEN<span className="text-cta">HOMES</span></div>
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
              <span className="badge-navy">For Rent</span>
              {item.badge && <span className="bg-[#154279] text-white text-xs font-bold px-3 py-1 rounded uppercase risa-uppercase risa-subheading">{item.badge}</span>}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#222] mb-2 risa-heading">{item.title || item.subhead || item.headline}</h1>
            <p className="text-gray-500 flex items-center gap-2 text-sm risa-body">
              <MapPin size={16} className="text-[#F96302]" /> {item.address || item.location} - {item.floor}
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <div className="text-3xl font-extrabold text-cta risa-heading">KES {parseInt(item.price.replace(',', '')).toLocaleString()}</div>
            <p className="text-gray-400 font-bold text-sm risa-subheading">/ Month</p>
          </div>
        </div>
        {/* 2. Gallery Section */}
        <div className="p-6 md:p-10 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-[400px]">
            <div className="md:col-span-2 relative group overflow-hidden rounded-lg">
              <img src={item.gallery ? item.gallery[0] : item.img} alt="Main" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded text-xs font-bold shadow flex items-center gap-2 cursor-pointer hover:bg-[#F96302] hover:text-white transition-colors risa-subheading">
                <Maximize size={14} /> View Photos
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <img src={item.gallery ? item.gallery[1] : item.img} alt="Sub 1" className="h-1/2 w-full object-cover rounded-lg" />
              <img src={item.gallery ? item.gallery[2] : item.img} alt="Sub 2" className="h-1/2 w-full object-cover rounded-lg" />
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
                <BedDouble size={22} className="text-[#F96302]" />
                <div>
                  <span className="block font-bold text-base text-[#222] risa-heading">{item.beds}</span>
                  <span className="text-xs text-gray-500 font-bold uppercase risa-uppercase risa-subheading">Bedrooms</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bath size={22} className="text-[#F96302]" />
                <div>
                  <span className="block font-bold text-base text-[#222] risa-heading">{item.baths}</span>
                  <span className="text-xs text-gray-500 font-bold uppercase risa-uppercase risa-subheading">Bathrooms</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Maximize size={22} className="text-[#F96302]" />
                <div>
                  <span className="block font-bold text-base text-[#222] risa-heading">{item.sqft}</span>
                  <span className="text-xs text-gray-500 font-bold uppercase risa-uppercase risa-subheading">Sq Ft</span>
                </div>
              </div>
            </div>
            {/* Description */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#222] mb-4 border-b pb-2 risa-heading">Description</h3>
              <p className="text-gray-600 leading-relaxed text-sm risa-body">
                {item.description}
                <br /><br />
                Living in this property offers a unique blend of comfort and convenience.
                Enjoy dedicated maintenance teams, secure access, and modern amenities designed for contemporary living.
              </p>
            </div>
            {/* Amenities */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#222] mb-4 border-b pb-2 risa-heading">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {item.amenities?.map((am: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600 risa-body">
                    <CheckCircle2 size={14} className="text-[#F96302]" /> {am}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm text-gray-600 risa-body"><CheckCircle2 size={14} className="text-[#F96302]" /> CCTV Security</div>
                <div className="flex items-center gap-2 text-sm text-gray-600 risa-body"><CheckCircle2 size={14} className="text-[#F96302]" /> Borehole Water</div>
                <div className="flex items-center gap-2 text-sm text-gray-600 risa-body"><CheckCircle2 size={14} className="text-[#F96302]" /> Backup Generator</div>
              </div>
            </div>
            {/* Property Details Table */}
            <div className="bg-[#f9f9f9] p-6 rounded-lg mb-8">
              <h3 className="text-base font-bold text-[#222] mb-4 risa-heading">Property Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 text-sm">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-[#555] risa-subheading">Property ID:</span>
                  <span className="text-gray-500 risa-body">{item.id}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-[#555] risa-subheading">Price:</span>
                  <span className="text-gray-500 risa-body">KES {parseInt(item.price.replace(',', '')).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-[#555] risa-subheading">Property Size:</span>
                  <span className="text-gray-500 risa-body">{item.sqft} Sq Ft</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-[#555] risa-subheading">Bedrooms:</span>
                  <span className="text-gray-500 risa-body">{item.beds}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-[#555] risa-subheading">Year Built:</span>
                  <span className="text-gray-500 risa-body">2024</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-[#555] risa-subheading">Property Type:</span>
                  <span className="text-gray-500 risa-body">{item.beds === 0 ? 'Studio' : `${item.beds} Bedroom`}</span>
                </div>
              </div>
            </div>
          </div>
          {/* RIGHT COLUMN: Contact Form */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg sticky top-24">
              <h4 className="text-base font-bold text-[#154279] mb-4 risa-heading">Schedule a Tour</h4>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                  <img src="https://i.pravatar.cc/150?u=property" alt="Agent" />
                </div>
                <div>
                  <div className="font-bold text-[#333] risa-subheading">Property Manager</div>
                  <div className="text-xs text-[#F96302] font-bold risa-uppercase risa-subheading">FindHouse Office</div>
                </div>
              </div>
              <form className="space-y-3">
                <input type="text" placeholder="Your Name" className="w-full bg-[#f9f9f9] border border-gray-200 rounded px-3 py-3 text-sm focus:border-[#F96302] outline-none risa-body" />
                <input type="email" placeholder="Your Email" className="w-full bg-[#f9f9f9] border border-gray-200 rounded px-3 py-3 text-sm focus:border-[#F96302] outline-none risa-body" />
                <input type="tel" placeholder="Your Phone" className="w-full bg-[#f9f9f9] border border-gray-200 rounded px-3 py-3 text-sm focus:border-[#F96302] outline-none risa-body" />
                <textarea rows={3} placeholder="I am interested in this property..." className="w-full bg-[#f9f9f9] border border-gray-200 rounded px-3 py-3 text-sm focus:border-[#F96302] outline-none risa-body"></textarea>
                <button className="btn-primary">
                  Submit Request
                </button>
                <button className="w-full border-2 border-[#154279] text-[#154279] font-bold py-3 rounded hover:bg-[#154279] hover:text-white transition-all flex items-center justify-center gap-2 text-sm risa-subheading">
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
// MAP COMPONENT
// ==========================================
const NeighborhoodMap = ({ activeSlideId }: { activeSlideId?: number }) => {
  const mapPins = [
    {
      id: 104,
      area: "Westlands",
      title: "Luxury Condo w/ View",
      count: 12,
      top: "38%",
      left: "46%",
      price: "210k",
      description: "Premium apartments with city views",
      img: "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=200",
      listingId: 104,
      active: activeSlideId === 104
    },
    {
      id: 101,
      area: "CBD",
      title: "Modern Downtown Loft",
      count: 56,
      top: "48%",
      left: "52%",
      price: "85k",
      description: "Central business district studios",
      img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200",
      listingId: 101,
      active: activeSlideId === 101
    },
    {
      id: 103,
      area: "Roysambu",
      title: "Cozy Studio Apartment",
      count: 30,
      top: "22%",
      left: "70%",
      price: "25k",
      description: "Affordable starter apartments",
      img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200",
      listingId: 103,
      active: activeSlideId === 103
    },
    {
      id: 102,
      area: "Karen",
      title: "Suburban Family Home",
      count: 15,
      top: "75%",
      left: "28%",
      price: "150k",
      description: "Spacious family homes",
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200",
      listingId: 102,
      active: activeSlideId === 102
    },
  ];
  return (
    <div className="w-full bg-white border border-gray-200 shadow-sm mt-8 flex flex-col rounded-sm overflow-hidden risa-font">
      {/* 1. Map Control Bar */}
      <div className="p-4 border-b border-gray-200 bg-white flex flex-col md:flex-row justify-between items-center gap-4 z-10">
        <div>
          <h3 className="text-base font-bold text-[#333] flex items-center gap-2 uppercase tracking-tight risa-heading">
            <MapPin className="text-[#F96302]" size={18} /> Featured Properties Map
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 risa-body">
            Interactive map showing all 4 featured properties from the listings above.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm">
            <Search size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500 risa-body">Nairobi, KE</span>
          </div>
          <div className="flex gap-1">
            <button className="text-[10px] font-bold uppercase px-4 py-2 bg-[#1E3A5F] text-white rounded-sm hover:bg-[#152a45] transition-colors risa-uppercase risa-subheading">
              Map
            </button>
            <button className="text-[10px] font-bold uppercase px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-sm hover:bg-gray-50 transition-colors risa-uppercase risa-subheading">
              Satellite
            </button>
          </div>
        </div>
      </div>
      {/* 2. Map Container */}
      <div className="relative w-full h-[500px] min-h-[500px] bg-[#E5E3DF] overflow-hidden group">
        {/* MAP BACKGROUND (Placeholder for visual effect) */}
        <div className="absolute inset-0 pointer-events-none">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15955.27830383803!2d36.8219!3d-1.2921!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ske!4v1700000000000!5m2!1sen!2ske"
            style={{ filter: "saturate(0) contrast(1.1) brightness(1.1)", opacity: 0.8 }}
            title="Nairobi Property Map"
          ></iframe>
        </div>
        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-sm shadow-md p-3 z-20 max-w-[200px] border border-gray-200">
          <h4 className="text-xs font-bold text-[#333] mb-2 flex items-center gap-1 risa-subheading">
            <Layers size={12} /> Property Areas
          </h4>
          <div className="space-y-1">
            {mapPins.map(pin => (
              <div key={pin.id} className="flex items-center justify-between text-xs risa-body">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${pin.active ? 'bg-[#F96302] animate-pulse' : 'bg-[#1E3A5F]'}`}></div>
                  <span className={`font-medium ${pin.active ? 'text-[#F96302]' : 'text-gray-600'} ${pin.active ? 'risa-subheading' : ''}`}>
                    {pin.area}
                  </span>
                </div>
                <span className="font-bold text-gray-700 risa-subheading">Ksh {pin.price}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Custom Map Controls Overlay */}
        <div className="absolute right-4 bottom-20 flex flex-col shadow-lg rounded-sm overflow-hidden bg-white z-20 border border-gray-300">
          <button className="p-3 hover:bg-gray-50 text-gray-600 border-b border-gray-200">
            <Plus size={18} />
          </button>
          <button className="p-3 hover:bg-gray-50 text-gray-600">
            <Minus size={18} />
          </button>
        </div>
        {/* PINS - UPDATED STYLE */}
        {mapPins.map((pin) => (
          <div
            key={pin.id}
            className={`absolute transform -translate-x-1/2 -translate-y-full cursor-pointer group/pin z-10 hover:z-30 transition-all duration-300 ${pin.active ? 'animate-bounce' : ''}`}
            style={{ top: pin.top, left: pin.left }}
          >
            <div className="relative flex flex-col items-center">
              {/* Enhanced Price Tag Pin */}
              <div className={`
                ${pin.active ? 'bg-[#F96302] scale-110 shadow-lg' : 'bg-[#1E3A5F]'}
                text-white text-xs font-bold px-3 py-1.5 rounded-sm shadow-md
                border-2 border-white hover:scale-125 transition-all duration-300 flex items-center gap-1
                group-hover/pin:bg-[#F96302] relative z-20 risa-subheading
              `}>
                <MapPin size={12} />
                Ksh {pin.price}
              </div>
              {/* Triangle Arrow */}
              <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]
                ${pin.active ? 'border-t-[#F96302]' : 'border-t-[#1E3A5F]'}
                group-hover/pin:border-t-[#F96302] -mt-[1px] transition-colors`}>
              </div>
              {/* Pulsing Ring Effect for Active Pins */}
              {pin.active && (
                <div className="absolute w-16 h-16 border-2 border-[#F96302]/30 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
              )}
              {/* Tooltip on Hover */}
              <div className="absolute bottom-[140%] mb-2 opacity-0 group-hover/pin:opacity-100 transition-all duration-200
                bg-white shadow-xl rounded-sm overflow-hidden min-w-[180px] pointer-events-none transform translate-y-2
                group-hover/pin:translate-y-0 z-50 border border-gray-200">
                <div className="h-20 w-full bg-gray-100 overflow-hidden relative">
                  <img
                    src={pin.img}
                    className="w-full h-full object-cover"
                    alt={pin.area}
                  />
                  <div className="absolute top-1 left-1 bg-[#F96302] text-white text-xs font-bold px-2 py-0.5 rounded-sm risa-uppercase risa-subheading">
                    FOR RENT
                  </div>
                </div>
                <div className="p-3 border-t border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-[#F96302] uppercase risa-uppercase risa-subheading">{pin.area}</div>
                      <div className="text-sm font-black text-[#333] truncate risa-heading">{pin.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-[#1E3A5F] risa-heading">Ksh {pin.price}</div>
                      <div className="text-xs text-gray-500 uppercase risa-uppercase risa-subheading">month</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2 risa-body">{pin.description}</p>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={12} className="fill-[#F9A100] text-[#F9A100]" />
                    ))}
                    <span className="text-xs text-gray-500 ml-1 risa-body">({pin.count} listings)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* 3. Footer - Updated */}
      <div className="bg-[#f9fafb] p-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 risa-body">
        <div className="mb-2 md:mb-0">
          <div className="font-bold text-[#333] risa-subheading">Featured Properties Legend</div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs risa-body"><div className="w-3 h-3 rounded-sm bg-[#F96302]"></div> Active/Highlighted</span>
            <span className="flex items-center gap-1 text-xs risa-body"><div className="w-3 h-3 rounded-sm bg-[#1E3A5F]"></div> Available</span>
          </div>
        </div>
        <div className="text-xs risa-body">© 2026 FindHouse Map Data • All 4 listings shown on map</div>
      </div>
    </div>
  );
};

// ==========================================
// UPDATED LISTING CARD (AYDEN DESIGN)
// ==========================================
const ListingCard = ({ data, onClick, isActive }: { data: any; onClick: () => void; isActive?: boolean }) => {
  const [isSaved, setIsSaved] = useState(false);
  return (
    <div
      className={`bg-white rounded-none overflow-hidden border ${isActive ? 'border-[#F96302]' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col risa-font`}
    >
      <div className="relative h-48 overflow-hidden cursor-pointer" onClick={onClick}>
        <img src={data.img} alt={data.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute top-4 left-4 bg-gradient-to-r from-[#154279] to-[#1a56b4] text-white text-xs font-bold px-3 py-1 rounded-none uppercase tracking-wide shadow risa-uppercase risa-subheading">
          {data.beds === 0 ? "Studio" : `${data.beds} Bedroom`}
        </div>
        {data.badge && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-[#F96302] to-[#ff7b2e] text-white text-xs font-bold px-2 py-1 rounded-none uppercase risa-uppercase risa-subheading">
            {data.badge}
          </div>
        )}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-none text-xs font-bold flex items-center gap-1 shadow-sm risa-subheading">
          <Maximize size={12} /> 3
        </div>
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
          <div className="text-white font-bold text-base risa-heading">KES {data.price}</div>
          <div className="text-white/80 text-xs risa-body">{data.floor}</div>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h4
          className="font-bold text-sm text-[#222] mb-2 cursor-pointer hover:text-[#F96302] transition-colors leading-tight line-clamp-1 risa-heading"
          onClick={onClick}
        >
          {data.title}
        </h4>
        <div className="text-xs text-gray-500 mb-3 flex items-center gap-1 risa-body">
          <MapPin size={12} className="text-gray-400" /> {data.address}
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
          <span className="text-xs text-gray-500 font-medium risa-body">({data.reviews} reviews)</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {data.amenities?.slice(0, 2).map((am: string, i: number) => (
            <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-none risa-body">
              {am}
            </span>
          ))}
          {data.amenities?.length > 2 && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-none risa-body">
              +{data.amenities.length - 2}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-auto">
          <div className="flex gap-4 text-xs font-medium text-gray-500 risa-subheading">
            <span className="flex items-center gap-1"><Bed size={13} /> {data.beds}</span>
            <span className="flex items-center gap-1"><Bath size={13} /> {data.baths}</span>
            <span className="flex items-center gap-1"><Maximize size={13} /> {data.sqft}</span>
          </div>
          <button
            onClick={onClick}
            className="text-[#F96302] text-xs font-bold uppercase hover:text-[#d85502] transition-colors risa-uppercase risa-subheading"
          >
            Details →
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// CAROUSEL & CARD (UPDATED)
// ==========================================
const VacancyCarousel = ({ onCardClick, onSlideChange }: { onCardClick: (slide: any) => void; onSlideChange: (slideId: number) => void }) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const slideIndex = Math.abs(page % VACANCY_SLIDES.length);
  const currentSlide = VACANCY_SLIDES[slideIndex];
  // Auto-slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => paginate(1), 5000);
    return () => clearInterval(timer);
  }, [page]);
  // Notify parent component about slide change
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
    <div className="relative w-full h-[450px] bg-white border border-gray-200 overflow-hidden shadow-sm group risa-font">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
          className="absolute inset-0 flex flex-col md:flex-row h-full w-full bg-white"
        >
          <div className="w-full md:w-1/3 p-6 lg:p-10 flex flex-col justify-center relative z-10 bg-white border-r border-gray-100 h-full">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block bg-[#F9A100] text-[#333] text-xs font-black uppercase px-2 py-1 tracking-wider risa-uppercase risa-heading">
                {currentSlide.tag}
              </span>
              <span className="text-xs font-bold text-[#F96302] uppercase flex items-center gap-1 risa-uppercase risa-subheading">
                <Clock size={12} /> Auto-slides in 5s
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#333] leading-none mb-2 uppercase tracking-tight whitespace-pre-line risa-heading">
              {currentSlide.headline.split("\n")[0]} <br />{" "}
              <span className="text-[#F96302]">{currentSlide.headline.split("\n")[1]}</span>
            </h1>
            <p className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide border-b border-gray-100 pb-2 risa-uppercase risa-subheading">
              {currentSlide.subhead}
            </p>
            <div className="w-12 h-1 bg-[#F96302] mb-4"></div>
            <p className="text-sm text-gray-700 font-medium mb-6 leading-relaxed risa-body">
              {currentSlide.description}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => onCardClick(currentSlide)}
                className="bg-[#F96302] text-white font-bold text-sm uppercase py-3 px-6 hover:bg-[#d15200] transition-colors shadow-sm flex items-center justify-center gap-2 rounded-sm border border-[#F96302] risa-uppercase risa-subheading"
              >
                View This Listing <ChevronRight size={16} />
              </button>
              <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-400 uppercase risa-uppercase risa-subheading">
                <span className="cursor-pointer hover:text-[#333]">Save to list</span>
                <span className="w-px h-3 bg-gray-300"></span>
                <span className="cursor-pointer hover:text-[#333]">Share</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-2/3 h-full relative overflow-hidden bg-gray-100">
            <img src={currentSlide.img} alt="Property" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            <div className="absolute bottom-4 right-4 bg-white border border-gray-300 shadow-sm p-2.5 flex flex-col items-end min-w-[140px] z-20">
              <div className="bg-[#F9A100] text-[#333] text-xs font-black uppercase px-1.5 py-0.5 mb-1 leading-none risa-uppercase risa-heading">
                {currentSlide.badge}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-gray-500 risa-subheading">Ksh</span>
                <span className="text-xl font-black text-[#333] leading-none tracking-tight risa-heading">
                  {currentSlide.price}
                </span>
                <span className="text-xs font-bold text-gray-400 risa-subheading">/mo</span>
              </div>
              <div className="text-xs font-bold text-gray-700 mt-1 uppercase tracking-tight text-right risa-uppercase risa-subheading">
                {currentSlide.specs}
              </div>
              <div className="text-xs text-gray-400 font-medium text-right truncate max-w-[150px] risa-body">
                {currentSlide.location}
              </div>
              {/* Show which map area this corresponds to */}
              <div className="mt-1 pt-1 border-t border-gray-200">
                <div className="text-xs text-[#1E3A5F] font-bold uppercase risa-uppercase risa-subheading">
                  Located in: {currentSlide.mapId === 101 ? 'CBD' : currentSlide.mapId === 102 ? 'Karen' : currentSlide.mapId === 103 ? 'Roysambu' : 'Westlands'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      {/* Enhanced Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {VACANCY_SLIDES.map((slide, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-2 rounded-full transition-all duration-300 shadow-sm ${
              slideIndex === idx
                ? "bg-[#F96302] w-8"
                : "bg-white/70 w-2 hover:w-4 hover:bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT (UPDATED TO BE SELF-CONTAINED)
// ==========================================
const HomePage = () => {
  const [previewListing, setPreviewListing] = useState<any>(null);
  const [activeSlideId, setActiveSlideId] = useState<number>(104);
  const [activeListingId, setActiveListingId] = useState<number | null>(null);

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

  // Add Inter font dynamically (matches navbar)
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Add the CSS classes for font weights and styles
    const style = document.createElement('style');
    style.textContent = `
      .risa-font { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; letter-spacing: -0.015em; }
      .risa-heading { font-weight: 800; letter-spacing: -0.03em; }
      .risa-subheading { font-weight: 600; letter-spacing: -0.01em; }
      .risa-body { font-weight: 400; letter-spacing: -0.01em; }
      .risa-uppercase { font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="antialiased min-h-screen bg-white risa-font">
      <NavbarSection />

      {/* FIXED: Reduced top padding to eliminate large gap */}
      <main className="max-w-[1440px] mx-auto px-4 lg:px-8 py-4 pt-20">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1 font-medium risa-subheading">
          <span className="hover:underline cursor-pointer">Realtor</span>
          <ChevronRight size={12} />
          <span className="hover:underline cursor-pointer">Rentals</span>
          <ChevronRight size={12} />
          <span className="font-bold text-[#F96302] risa-subheading">Current Listings</span>
        </div>
        <div className="flex-1">
          {/* Carousel */}
          <div className="mb-6">
            <VacancyCarousel
              onCardClick={openPreview}
              onSlideChange={handleSlideChange}
            />
          </div>
          {/* Trending Rentals */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
              <h2 className="text-base font-bold text-[#333] flex items-center gap-2 uppercase tracking-tight risa-heading">
                <MapPin className="text-[#F96302]" size={18} />
                Trending Rentals (Mapped Below)
              </h2>
              <span className="text-xs font-bold text-[#F96302] cursor-pointer hover:underline risa-subheading">
                See All 124 Results &gt;
              </span>
            </div>
            {/* UPDATED: Grid with Ayden Design Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5 w-full">
              {LISTINGS_DATA.map((listing) => (
                <ListingCard
                  key={listing.id}
                  data={listing}
                  isActive={activeSlideId === listing.id || activeListingId === listing.id}
                  onClick={() => handleListingClick(listing)}
                />
              ))}
            </div>
            {/* Info Box */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-sm">
              <div className="flex items-center gap-2 text-blue-800 text-sm font-medium risa-subheading">
                <Navigation size={14} />
                Click any property card to see its location highlighted on the map below
              </div>
            </div>
          </div>
          {/* Map Section */}
          <NeighborhoodMap activeSlideId={activeSlideId} />
        </div>
        {/* Ayden Design Detail Modal */}
        <AnimatePresence>
          {previewListing && (
            <DetailModal item={previewListing} onClose={closePreview} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default HomePage;