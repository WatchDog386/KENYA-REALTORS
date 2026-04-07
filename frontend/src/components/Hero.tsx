// src/pages/HomePage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  ChefHat,
  Loader
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { propertyService } from "@/services/propertyService";
import FeaturesSection from "@/pages/FeaturesSection";

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        .font-nunito { font-family: 'Nunito', sans-serif; }
    .hero-page-flat [class*='shadow-'] { box-shadow: none !important; }
    .hero-page-flat [class*='ring-'] { box-shadow: none !important; }
        
        /* Custom scrollbar for consistency */
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #ccc; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #F96302; }
    `}</style>
);

// ==========================================
// 1. DATA (live Supabase)
// ==========================================
const HERO_CACHE_KEY = "hero-home-cache-v1";
const HERO_CACHE_TTL_MS = 5 * 60 * 1000;
const HERO_BACKGROUND_IMAGE_URL = "/background.png";

type HeroCachePayload = {
  timestamp: number;
  slides: any[];
  listings: any[];
  unitDetails: any[];
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const deterministicRange = (seed: string, min: number, max: number): number => {
  const safeMax = Math.max(min, max);
  const span = safeMax - min + 1;
  return min + (hashString(seed) % span);
};

const parseAmenities = (rawAmenities: unknown): string[] => {
  if (Array.isArray(rawAmenities)) {
    return rawAmenities
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof rawAmenities === "string") {
    return rawAmenities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizePropertyStatus = (status: unknown): string => {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("maint")) return "Maintenance";
  if (normalized === "inactive" || normalized === "archived") return "Inactive";
  return "Available";
};

const getPropertyDisplayPrice = (prop: any): number => {
  const typePrices = (prop?.property_unit_types || [])
    .map((unitType: any) => Number(unitType?.price_per_unit || 0))
    .filter((value: number) => value > 0);

  if (typePrices.length > 0) {
    return Math.min(...typePrices);
  }

  const expectedIncome = Number(prop?.expected_income || 0);
  const totalUnits = Number(prop?.total_units || 0);
  if (expectedIncome > 0 && totalUnits > 0) {
    return Math.round(expectedIncome / totalUnits);
  }

  return deterministicRange(`${prop?.id || prop?.name || "property"}-price`, 30000, 180000);
};

const readHeroCache = (): HeroCachePayload | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(HERO_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<HeroCachePayload>;
    if (
      typeof parsed.timestamp !== "number" ||
      !Array.isArray(parsed.slides) ||
      !Array.isArray(parsed.listings) ||
      !Array.isArray(parsed.unitDetails)
    ) {
      return null;
    }

    return parsed as HeroCachePayload;
  } catch {
    return null;
  }
};

const writeHeroCache = (payload: HeroCachePayload): void => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(HERO_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Intentionally silent: cache failures should not block rendering.
  }
};

const clearHeroCache = (): void => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(HERO_CACHE_KEY);
  } catch {
    // Intentionally silent: cache failures should not block rendering.
  }
};

// ==========================================
// DETAIL MODAL (HowItWorks DESIGN STYLING)
// ==========================================
const DetailModal = ({ item, onClose }: { item: any; onClose: () => void }) => {
  if (!item) return null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
       const { data: { user } } = await supabase.auth.getUser();
       // Uses "John Kamau" ID if not logged in (fallback for demo)
       const applicantId = user?.id || 'f5b2f858-9319-4bd4-9e9d-8cd421ba1829';
       
      // Demo property ID
       const propertyId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
       // Unit A2 ID (Demo)
       const unitId = 'de7b8d75-8292-4fee-9f4e-ff6d20fd1560';

       const { error } = await supabase
         .from('lease_applications')
         .insert({
           applicant_id: applicantId,
           property_id: propertyId,
           unit_id: unitId,
           status: 'pending',
           notes: `WEB APPLICATION\nProperty: ${item.title}\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nMessage: ${formData.message}`
         });

       if (error) throw error;
       
       toast.success('Application submitted successfully!');
       setFormData({ name: '', email: '', phone: '', message: '' });
       onClose();
       
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error('Failed to submit application: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto custom-scroll font-nunito"
    >
      {/* Header / Nav inside Modal */}
      <div className="sticky top-0 bg-[#efeeee]  shadow-slate-200/50 z-50 px-4 md:px-8 h-16 flex items-center justify-between border-b border-transparent  font-nunito">
        <div className="font-bold text-xl text-[#154279] tracking-tighter uppercase">AYDEN<span className="text-[#F96302]">HOMES</span></div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-none bg-gray-100 hover:bg-[#F96302] hover:text-white flex items-center justify-center transition-all shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]"
        >
          <X size={18} />
        </button>
      </div>
      <div className="max-w-7xl mx-auto bg-[#efeeee] min-h-screen pb-20  font-nunito">
        {/* 1. Title Header Section */}
        <div className="p-6 md:p-10 pb-4 flex flex-col md:flex-row justify-between items-start border-b border-transparent  bg-[#efeeee]/50">
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
              <div className="absolute bottom-4 right-4 bg-[#efeeee]/90 backdrop-blur px-3 py-1.5 rounded-none text-xs font-bold shadow flex items-center gap-2 cursor-pointer hover:bg-[#F96302] hover:text-white transition-colors">
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
            <div className="bg-[#efeeee] p-6 rounded-none flex flex-wrap gap-6 md:gap-12 mb-8 border-transparent border-transparent  ">
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
              <h3 className="text-lg font-bold text-[#154279] mb-4 border-b border-transparent  pb-2 uppercase tracking-widest">Description</h3>
              <p className="text-gray-600 leading-relaxed text-sm font-medium">
                {item.description}
                <br /><br />
                Living in this property offers a unique blend of comfort and convenience.
                Enjoy dedicated maintenance teams, secure access, and modern amenities designed for contemporary living.
              </p>
            </div>

            {/* Property Details Table */}
            <div className="bg-[#efeeee] p-6 rounded-none mb-8 border-transparent border-transparent  ">
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
            <div className="bg-gradient-to-br from-[#154279] to-[#0f325e] border-transparent border-[#154279] rounded-none p-6  sticky top-24">
              <h4 className="text-base font-bold text-white mb-4 uppercase tracking-widest">Schedule a Tour</h4>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                  <img src="https://i.pravatar.cc/150?u=property" alt="Agent" />
                </div>
                <div>
                  <div className="font-bold text-white font-medium">Property Manager</div>
                  <div className="text-xs text-gray-200 font-bold uppercase">AYDEN HOMES</div>
                </div>
              </div>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <input 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  type="text" 
                  placeholder="Your Name" 
                  className="w-full bg-[#efeeee]/10 border-transparent border-white/30 rounded-none px-3 py-3 text-sm text-white placeholder:text-white/60 focus:ring-1 focus:ring-white/50 outline-none font-medium shadow-[inset_6px_6px_12px_#d1d1d1,inset_-6px_-6px_12px_#ffffff] border-transparent bg-[#efeeee]"
                  required
                />
                <input 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  type="email" 
                  placeholder="Your Email" 
                  className="w-full bg-[#efeeee]/10 border-transparent border-white/30 rounded-none px-3 py-3 text-sm text-white placeholder:text-white/60 focus:ring-1 focus:ring-white/50 outline-none font-medium shadow-[inset_6px_6px_12px_#d1d1d1,inset_-6px_-6px_12px_#ffffff] border-transparent bg-[#efeeee]"
                  required
                />
                <input 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  type="tel" 
                  placeholder="Your Phone" 
                  className="w-full bg-[#efeeee]/10 border-transparent border-white/30 rounded-none px-3 py-3 text-sm text-white placeholder:text-white/60 focus:ring-1 focus:ring-white/50 outline-none font-medium shadow-[inset_6px_6px_12px_#d1d1d1,inset_-6px_-6px_12px_#ffffff] border-transparent bg-[#efeeee]"
                  required
                />
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={3} 
                  placeholder="I am interested in this property..." 
                  className="w-full bg-[#efeeee] border-transparent border-gray-200 rounded-none px-3 py-3 text-sm focus:border-[#F96302] outline-none font-medium shadow-[inset_6px_6px_12px_#d1d1d1,inset_-6px_-6px_12px_#ffffff] border-transparent bg-[#efeeee]"
                ></textarea>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-[#F96302] text-white font-bold py-3 rounded-none hover:bg-[#d85502] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-75 disabled:cursor-not-allowed shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button type="button" className="w-full border-2 border-white text-white font-bold py-3 rounded-none hover:bg-[#efeeee] hover:text-[#154279] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]">
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
      className={`bg-[#efeeee] rounded-none overflow-hidden border-transparent transition-all duration-300 group flex flex-col font-nunito  cursor-pointer ${isActive ? 'border-[#F96302]  ring-1 ring-[#F96302]/20' : 'border-transparent  hover:border-[#154279] hover:'}`}
      onClick={handleViewProperty}
    >
      <div className="relative h-48 overflow-hidden cursor-pointer" onClick={handleViewProperty}>
        <img src={data.img} alt={data.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute top-4 left-4 bg-[#154279] text-white text-xs font-bold px-3 py-1 rounded-none uppercase tracking-wider ">
          {data.beds === 0 ? "Studio" : `${data.beds} Bedroom`}
        </div>

        <div className="absolute bottom-4 right-4 bg-[#efeeee]/95 backdrop-blur-sm px-2 py-1 rounded-none text-xs font-bold flex items-center gap-1 ">
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

        <div className="flex justify-between items-center border-t border-transparent  pt-3 mt-auto">
          <div className="flex gap-4 text-xs font-bold text-[#154279]">
            <span className="flex items-center gap-1"><Bed size={13} /> {data.beds}</span>
            <span className="flex items-center gap-1"><Bath size={13} /> {data.baths}</span>
            <span className="flex items-center gap-1"><Maximize size={13} /> {data.sqft}</span>
          </div>
          <button
            onClick={handleViewProperty}
            className="text-[#F96302] text-xs font-bold uppercase hover:text-[#d85502] transition-colors flex items-center gap-1 hover:underline shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]"
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
const VacancyCarousel = ({ onCardClick, onSlideChange, slides = [] }: { onCardClick: (slide: any) => void; onSlideChange: (slideId: number) => void; slides?: any[] }) => {
  const navigate = useNavigate();
  const [[page, direction], setPage] = useState([0, 0]);
  const safeSlides = slides || [];
  const slideLength = safeSlides.length > 0 ? safeSlides.length : 1;
  const slideIndex = Math.abs(page % slideLength);
  const currentSlide = safeSlides && safeSlides.length > slideIndex ? safeSlides[slideIndex] : null;
  
  useEffect(() => {
    const timer = setInterval(() => paginate(1), 5000);
    return () => clearInterval(timer);
  }, [page]);
  
  useEffect(() => {
    if (currentSlide) {
      onSlideChange(currentSlide.mapId);
    }
  }, [slideIndex, currentSlide]);
  
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

  const headlineParts = String(currentSlide?.headline || "").split("\n");
  const primaryHeadline = headlineParts[0] || "Find Your Next Home";
  const secondaryHeadline = headlineParts[1] || "Across Nairobi";
  const parsedPrice = Number.parseInt(String(currentSlide?.price || "0").replace(/,/g, ""), 10);
  const formattedPrice = Number.isNaN(parsedPrice)
    ? String(currentSlide?.price || "0")
    : parsedPrice.toLocaleString();
  
  // Show loading state if no slides are available
  if (!currentSlide || safeSlides.length === 0) {
    return (
      <div
        className="relative w-full h-[540px] md:h-[580px] font-nunito overflow-hidden bg-[#0f325e] bg-cover bg-center flex items-center justify-center pt-4 md:pt-8"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 50, 94, 0.78), rgba(21, 66, 121, 0.78)), url(${HERO_BACKGROUND_IMAGE_URL})`,
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader size={40} className="text-white animate-spin" />
          <p className="text-white font-bold text-sm">Loading properties...</p>
        </div>
      </div>
    );
  }
  
  return (
    <section
      className="hero-page-flat w-full bg-transparent border-b border-transparent font-nunito pt-4 md:pt-8"
      style={{
        backgroundImage: `linear-gradient(rgba(247, 247, 247, 0.78), rgba(247, 247, 247, 0.78)), url(${HERO_BACKGROUND_IMAGE_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-[1660px] mx-auto px-2 md:px-3 lg:px-4 py-4 md:py-6">
        <div className="relative overflow-hidden border border-white/40 bg-white/80 backdrop-blur-sm">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 280, damping: 28 }, opacity: { duration: 0.2 } }}
              className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px] md:min-h-[580px]"
            >
              <div className="lg:col-span-5 p-4 md:p-6 lg:p-7 flex flex-col bg-white/70 relative">
                <div className="mb-2">
                  <span className="inline-flex items-center gap-2 bg-[#0f335f] text-white text-[10px] md:text-xs font-black uppercase tracking-[0.16em] px-3 py-1">
                    <ShoppingCart size={12} />
                    {currentSlide.tag || "Featured"}
                  </span>
                </div>

                <h1 className="text-2xl md:text-4xl font-black text-[#0f335f] leading-[0.95] uppercase tracking-tight">
                  {primaryHeadline}
                  <span className="block text-[#F96302]">{secondaryHeadline}</span>
                </h1>

                <p className="mt-2 text-xs md:text-sm text-slate-600 leading-relaxed font-semibold max-w-[34ch]">
                  {String(currentSlide.description || "").slice(0, 110)}...
                </p>

                <div className="mt-3 space-y-2">
                  <div className="inline-flex items-center gap-2 bg-[#fff4ec] text-[#a74412] text-[11px] font-bold px-2.5 py-1 border-transparent border-[#ffd7bd]">
                    <MapPin size={14} />
                    {currentSlide.location}
                  </div>
                </div>

                <div className="mt-3 flex justify-start">
                    <button
                      onClick={() => navigate('/features')}
                      className="bg-[#F96302] hover:bg-[#e55a00] text-white font-black h-11 px-8 flex items-center justify-center uppercase tracking-[0.12em] text-[10px] md:text-[11px] transition-colors"
                    >
                      Browse Homes
                    </button>
                  </div>

                <div className="mt-4 border-transparent border-[#e3e3e3] bg-[#f8f8f8] p-3 md:p-4">
                  <p className="text-[9px] font-black text-[#0f335f] uppercase tracking-[0.2em]">Quick Search</p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <div className="sm:col-span-3 relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        readOnly
                        value={currentSlide.location || "Nairobi"}
                        className="w-full h-11 border border-slate-200 bg-white pl-9 pr-3 text-xs md:text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#F96302]"
                      />
                    </div>
                    <button
                      onClick={() => navigate('/features')}
                      className="sm:col-span-2 h-11 bg-[#0f335f] text-white text-[10px] md:text-[11px] font-black uppercase tracking-[0.12em] hover:bg-[#0c284a] transition-colors"
                    >
                      Find Homes
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 relative h-[540px] md:h-[640px] lg:h-auto lg:min-h-full">
                <img src={currentSlide.img} alt={currentSlide.subhead || "Featured property"} className="absolute inset-0 w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-l from-black/45 via-transparent to-transparent"></div>

                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 lg:p-5">
                  <div className="max-w-xl bg-black/45 backdrop-blur-[2px] border-transparent border-white/15 p-3 md:p-4">
                    <p className="text-[10px] md:text-xs font-black text-[#ffd6bd] uppercase tracking-[0.2em]">{currentSlide.subhead}</p>
                    <p className="mt-1.5 text-white text-sm md:text-xl font-black uppercase leading-tight">
                      {currentSlide.specs || "Ready-to-move units"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onCardClick(currentSlide)}
                        className="bg-[#F96302] text-white text-[10px] md:text-xs font-black uppercase tracking-[0.12em] px-3 py-1.5 hover:bg-[#d75502] transition-colors"
                      >
                        Book Tour
                      </button>
                      <button
                        onClick={() => navigate('/pricing')}
                        className="bg-[#efeeee] text-[#0f335f] text-[10px] md:text-xs font-black uppercase tracking-[0.12em] px-3 py-1.5 hover:bg-[#efeeee] transition-colors"
                      >
                        Financing
                      </button>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 flex items-center gap-2">
                  <button
                    onClick={() => paginate(-1)}
                    className="w-10 h-10 bg-[#efeeee]/90 hover:bg-[#efeeee] text-[#0f335f] border-transparent border-white/60 transition-colors flex items-center justify-center"
                    aria-label="Previous slide"
                  >
                    <ChevronRight size={18} className="rotate-180" />
                  </button>
                  <button
                    onClick={() => paginate(1)}
                    className="w-10 h-10 bg-[#efeeee]/90 hover:bg-[#efeeee] text-[#0f335f] border-transparent border-white/60 transition-colors flex items-center justify-center"
                    aria-label="Next slide"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 flex gap-1.5">
                  {safeSlides.map((slide, index) => (
                    <button
                      key={slide.id || index}
                      onClick={() => goToSlide(index)}
                      className={`h-1.5 transition-all ${slideIndex === index ? 'w-8 bg-[#F96302]' : 'w-4 bg-[#efeeee]/60 hover:bg-[#efeeee]'}`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const HomePage = () => {
  const navigate = useNavigate();
  const initialHeroCache = useMemo(() => readHeroCache(), []);
  const initialSlides =
    initialHeroCache?.slides?.length
      ? initialHeroCache.slides
      : [];
  const initialListings =
    initialHeroCache?.listings?.length
      ? initialHeroCache.listings
      : [];
  const initialUnits = initialHeroCache?.unitDetails || [];
  const [previewListing, setPreviewListing] = useState<any>(null);
  const [activeSlideId, setActiveSlideId] = useState<number>(0);
  const [activeListingId, setActiveListingId] = useState<number | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedBedroom, setSelectedBedroom] = useState<string>("");
  const [selectedPrice, setSelectedPrice] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Supabase data states
  const [vacancySlides, setVacancySlides] = useState<any[]>(initialSlides);
  const [listingsData, setListingsData] = useState<any[]>(initialListings);
  const [loadingProperties, setLoadingProperties] = useState(initialSlides.length === 0);
  const [unitDetails, setUnitDetails] = useState<any[]>(initialUnits);

  const locations = ["Pangani", "CBD", "Westlands", "Kilimani", "Karen", "Roysambu", "Upper Hill", "Spring Valley", "Muthaiga", "Riverside"];

  // Fetch properties and units from Supabase
  useEffect(() => {
    const cacheHasRenderableData =
      Boolean(initialHeroCache?.slides?.length) &&
      Boolean(initialHeroCache?.listings?.length);

    const cacheIsFresh =
      initialHeroCache &&
      Date.now() - initialHeroCache.timestamp < HERO_CACHE_TTL_MS;

    if (cacheIsFresh && cacheHasRenderableData) {
      return;
    }

    fetchPropertiesData();
  }, [initialHeroCache]);

  const fetchPropertiesData = async () => {
    const hasRenderableData = vacancySlides.length > 0 && listingsData.length > 0;

    try {
      if (!hasRenderableData) {
        setLoadingProperties(true);
      }

      const [properties, unitsData] = await Promise.all([
        propertyService.fetchProperties(),
        fetchUnitDetails(),
      ]);

      const liveProperties = (properties || []).filter((prop: any) => {
        const normalized = String(prop?.status || "").toLowerCase();
        return normalized !== "deleted";
      });
      
      if (liveProperties.length > 0) {
        // Transform properties to carousel format
        const slides = liveProperties.map((prop: any) => {
          const statusLabel = normalizePropertyStatus(prop.status);
          const displayPrice = getPropertyDisplayPrice(prop);

          return {
          id: deterministicRange(`${prop.id}-slide-id`, 100, 999999),
          tag: statusLabel,
          headline: `${prop.name}\nAvailable Now`,
          subhead: prop.location || "Premium Property",
          description: prop.description || `Explore this stunning property with modern amenities and excellent location. Perfect for professionals and families.`,
          img: prop.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop",
          price: String(displayPrice),
          location: prop.location || "Nairobi",
          specs: `${prop.total_units || 0} Units`,
          badge: statusLabel,
          mapId: deterministicRange(`${prop.id}-map-id`, 100, 999999),
          beds: deterministicRange(`${prop.id}-beds`, 1, 4),
          baths: deterministicRange(`${prop.id}-baths`, 1, 3),
          sqft: deterministicRange(`${prop.id}-sqft`, 500, 2500),
          amenities: parseAmenities(prop.amenities),
          floor: "Multiple Floors",
          gallery: [
            prop.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800",
            "https://images.unsplash.com/photo-1616594039325-18dcd0b4a20c?q=80&w=800"
          ],
          propertyId: prop.id
          };
        });

        // Transform properties to listings format
        const listings = liveProperties.map((prop: any) => {
          const statusLabel = normalizePropertyStatus(prop.status);
          const displayPrice = getPropertyDisplayPrice(prop);

          return {
          id: deterministicRange(`${prop.id}-listing-id`, 100, 999999),
          title: prop.name,
          address: prop.location,
          price: String(displayPrice),
          beds: deterministicRange(`${prop.id}-beds`, 1, 4),
          baths: deterministicRange(`${prop.id}-baths`, 1, 3),
          sqft: deterministicRange(`${prop.id}-sqft`, 500, 2500),
          rating: Number((deterministicRange(`${prop.id}-rating`, 42, 50) / 10).toFixed(1)),
          reviews: deterministicRange(`${prop.id}-reviews`, 5, 35),
          img: prop.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=500&auto=format&fit=crop",
          badge: statusLabel !== "Available" ? statusLabel : "Available",
          mapArea: prop.location?.split(",")[0] || "Nairobi",
          amenities: parseAmenities(prop.amenities),
          floor: "Ground Floor",
          description: prop.description || "Premium property with modern amenities",
          gallery: [
            prop.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=500&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800",
            "https://images.unsplash.com/photo-1616594039325-18dcd0b4a20c?q=80&w=800"
          ],
          propertyId: prop.id,
          unitTypes: prop.property_unit_types || []
          };
        });

        setVacancySlides(slides);
        setListingsData(listings);
        setUnitDetails(unitsData);

        writeHeroCache({
          timestamp: Date.now(),
          slides,
          listings,
          unitDetails: unitsData,
        });
      } else {
        setVacancySlides([]);
        setListingsData([]);
        setUnitDetails(unitsData);
        clearHeroCache();
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      if (!hasRenderableData) {
        setVacancySlides([]);
        setListingsData([]);
        toast.error("Failed to load live properties from Supabase.");
      }
    } finally {
      setLoadingProperties(false);
    }
  };

  const fetchUnitDetails = async () => {
    try {
      const { data: units, error } = await supabase
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
        `);

      if (error) throw error;

      return units || [];
    } catch (error) {
      console.error("Error fetching unit details:", error);
      return [];
    }
  };

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
    const mapPinId = vacancySlides.find(slide =>
      slide.location.includes(listing.mapArea) || listing.mapArea.includes(slide.location?.split(',')[0])
    )?.mapId || listing.id;
    setActiveSlideId(mapPinId);
  };

  // Filtering logic
  const filteredListings = (listingsData || []).filter((listing) => {
    const amenityMatch = selectedAmenities.length === 0 || selectedAmenities.some(am => 
      (listing.amenities || []).some(la => la.toLowerCase().includes(am.toLowerCase()))
    );
    const bedroomMatch = !selectedBedroom || (selectedBedroom === "0" ? listing.beds === 0 : listing.beds === parseInt(selectedBedroom));
    const locationMatch = !selectedLocation || listing.mapArea === selectedLocation;
    
    let priceMatch = true;
    if (selectedPrice) {
      const price = parseInt((listing.price || "0").replace(',', ''));
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
      <div className="antialiased min-h-0 md:min-h-screen bg-[#f7f7f7] text-[#484848] font-nunito">
        {/* NavbarSection removed to avoid duplication with MainLayout */}

        {/* Hero Carousel - Full width edge to edge */}
        <div className="w-full">
          <VacancyCarousel
            onCardClick={openPreview}
            onSlideChange={handleSlideChange}
            slides={vacancySlides}
          />
        </div>

        {/* Main Content Area - Hidden on mobile to remove gap */}
        <main className="w-full px-0 py-0 md:py-0 font-nunito hidden md:block">
          <FeaturesSection removeTopSpacing />
          {(selectedAmenities.length > 0 || selectedBedroom || selectedPrice || selectedLocation) ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4 border-b border-transparent  pb-2">
                <h2 className="text-base font-bold text-[#154279] flex items-center gap-2 uppercase tracking-widest">
                  <Home className="text-[#F96302]" size={18} />
                  Available Properties {filteredListings.length > 0 && `(${filteredListings.length} available)`}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 w-full mb-8">
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
              <div className="mt-4 p-3 bg-blue-50 border-transparent border-blue-100 rounded-none flex items-center gap-2.5 text-[#154279]">
                <AlertCircle size={16} className="shrink-0 text-[#F96302]" />
                <p className="text-[11px] leading-relaxed font-bold">
                  Click any property above to view details. Vacant units are listed below by unit type and property.
                </p>
              </div>

              {/* Vacant Units Section */}
              {filteredListings.length > 0 && (
                <div className="mt-12 pt-8 border-t-2 border-transparent ">
                  <div className="flex items-center gap-2 mb-6">
                    <Layers className="text-[#F96302]" size={22} />
                    <h3 className="text-lg font-bold text-[#154279] uppercase tracking-widest">Available Vacant Units</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {(() => {
                      const vacantUnitsList: any[] = [];
                      
                      // Collect all vacant units from filtered properties
                      filteredListings.forEach((property) => {
                        const propertyUnits = (unitDetails || []).filter(u => u.property_id === property.propertyId);
                        const vacantUnits = propertyUnits.filter((u: any) => {
                          const status = String(u.status || '').toLowerCase();
                          return status === 'available' || status === 'vacant';
                        });
                        
                        vacantUnits.forEach((unit) => {
                          vacantUnitsList.push({
                            ...unit,
                            propertyName: property.title,
                            propertyAddress: property.address,
                            unitTypeInfo: unit.property_unit_types
                          });
                        });
                      });
                      
                      if (vacantUnitsList.length === 0) {
                        return (
                          <div className="col-span-full text-center py-8 bg-[#efeeee] border-transparent border-transparent  rounded-none shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                            <p className="text-sm font-bold text-slate-600">No vacant units available for the selected filters</p>
                          </div>
                        );
                      }
                      
                      return vacantUnitsList.map((unit, idx) => (
                        <div 
                          key={idx}
                          className="bg-[#efeeee] border-l-4 border-l-[#F96302] p-4 rounded-none  hover: transition-all hover:border-l-[#d85502] cursor-pointer shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]"
                          onClick={() => openPreview(unit)}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                            {/* Unit Number */}
                            <div className="md:col-span-1">
                              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Unit Number</div>
                              <div className="text-lg font-extrabold text-[#154279] mt-1">{unit.unit_number}</div>
                            </div>

                            {/* Unit Type */}
                            <div className="md:col-span-1">
                              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Unit Type</div>
                              <div className="text-sm font-bold text-[#154279] mt-1">{unit.unitTypeInfo?.unit_type_name || 'Standard'}</div>
                              <div className="text-xs text-slate-600">{unit.unitTypeInfo?.unit_category || 'N/A'}</div>
                            </div>

                            {/* Property */}
                            <div className="md:col-span-2">
                              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Property</div>
                              <div className="text-sm font-bold text-[#154279] mt-1">{unit.propertyName}</div>
                              <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                                <MapPin size={12} /> {unit.propertyAddress}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="md:col-span-1">
                              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Monthly Rent</div>
                              <div className="text-lg font-extrabold text-[#F96302] mt-1">
                                KES {Number(unit.unitTypeInfo?.price_per_unit || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="mt-3 pt-3 border-t border-transparent  flex items-center justify-between">
                            <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                              ✓ Available
                            </span>
                            <button className="text-xs font-bold text-[#F96302] hover:text-[#d85502] uppercase tracking-wider flex items-center gap-1 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]">
                              View Details <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          ) : null}
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


