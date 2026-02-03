import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { 
  ShoppingCart, Star, Heart, Check, Filter, X, ArrowUpRight,
  BedDouble, Warehouse, Building2, Plus, Minus, Settings2, 
  ShieldCheck, BarChart3, Lock, Zap, Landmark,
  Home, Briefcase, TrendingUp, Download, ChevronRight, AlertCircle,
  Shield, CheckCircle
} from "lucide-react";
import { 
  MdApartment, MdKingBed, MdBusiness, MdStorefront,
  MdLocalFireDepartment, MdCheckCircle, MdArrowForward
} from "react-icons/md";
import { 
  FaCouch, FaWarehouse, FaShoppingCart 
} from "react-icons/fa";
import { BiBuildingHouse } from "react-icons/bi";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
    
    body { font-family: 'Nunito', sans-serif; }
    .font-nunito { font-family: 'Nunito', sans-serif; }
    h1, h2, h3, h4, h5, h6 { font-family: 'Nunito', sans-serif; }
    
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #ccc; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #F96302; }
  `}</style>
);

// --- UTILS ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- DESIGN SYSTEM (UNIFIED WITH HOW IT WORKS) ---
const THEME = {
  primary: "#154279",
  secondary: "#F96302",
  white: "#ffffff",
  bgLight: "#f7f7f7",
  slate50: "#f8fafc",
  slate100: "#e2e8f0",
  slate200: "#cbd5e1",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate900: "#0f172a",
  textDark: "#484848",
  textMid: "#666666",
  textLight: "#64748b"
};

// ==========================================
// DATA: PRODUCTS
// ==========================================
const PRODUCTS = [
  {
    id: "prod-001",
    brand: "Residential",
    title: "Studio Unit",
    baseModel: "STU-001",
    icon: <MdApartment size={32} />,
    rating: 4.8,
    reviews: 420,
    hasVariants: true,
    variants: [
      { id: "v1", name: "Compact", price: 8000, diff: "22 sqm" },
      { id: "v2", name: "Standard", price: 12000, diff: "28 sqm" },
      { id: "v3", name: "Deluxe", price: 15000, diff: "35 sqm" }
    ],
    features: ["Fully Furnished", "En-Suite Bathroom", "Kitchenette", "24/7 Security"]
  },
  {
    id: "prod-002",
    brand: "Residential",
    title: "Bedsitter Unit",
    baseModel: "BED-001",
    icon: <FaCouch size={32} />,
    rating: 4.9,
    reviews: 1250,
    hasVariants: true,
    variants: [
      { id: "v1", name: "Single", price: 15000, diff: "40 sqm" },
      { id: "v2", name: "Spacious", price: 20000, diff: "50 sqm" },
      { id: "v3", name: "Premium", price: 25000, diff: "65 sqm" }
    ],
    features: ["Separate Living Area", "Private Bathroom", "Built-in Kitchen", "Windows"]
  },
  {
    id: "prod-003",
    brand: "Residential",
    title: "One Bedroom Apartment",
    baseModel: "1BR-001",
    icon: <MdKingBed size={32} />,
    rating: 4.5,
    reviews: 85,
    hasVariants: false,
    variants: [{ id: "v1", name: "Standard", price: 32000, diff: "75 sqm" }],
    features: ["Spacious Bedroom", "Separate Living Room", "Full Kitchen", "Balcony Access"]
  },
  {
    id: "prod-004",
    brand: "Commercial",
    title: "Retail Shop",
    baseModel: "SHOP-001",
    icon: <MdStorefront size={32} />,
    rating: 5.0,
    reviews: 32,
    hasVariants: true,
    variants: [
      { id: "v1", name: "Small", price: 18000, diff: "20 sqm" },
      { id: "v2", name: "Large", price: 28000, diff: "40 sqm" }
    ],
    features: ["Ground Floor Location", "Display Windows", "Secure Storage", "Daily Foot Traffic"]
  }
];

// ==========================================
// DATA: PAYMENTS
// ==========================================
const PAYMENT_METHODS = [
    { 
        id: "mpesa", 
        name: "M-Pesa", 
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/512px-M-PESA_LOGO-01.svg.png",
    },
    { 
        id: "paypal", 
        name: "PayPal", 
        image: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
    },
    { 
        id: "visa", 
        name: "Visa", 
        image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg",
    },
    { 
        id: "mastercard", 
        name: "Mastercard", 
        image: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",
    },
    { 
        id: "bank", 
        name: "Bank Transfer", 
        isIcon: true, 
    },
];

// ==========================================
// ANIMATIONS
// ==========================================
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25, scale: 0.8 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { type: 'spring' as const, stiffness: 300, damping: 18 },
    },
};

// ==========================================
// SUB-COMPONENT: RATING
// ==========================================
const Rating = ({ rating, count }) => (
  <div className="flex items-center gap-0.5 text-[10px]">
    {[...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={11} 
        className={i < Math.floor(rating) ? `fill-[${THEME.secondary}] text-[${THEME.secondary}]` : "fill-slate-200 text-slate-200"}  
      />
    ))}
    <span className="ml-1 cursor-pointer font-bold text-slate-500 hover:text-[#F96302] transition-colors uppercase tracking-widest text-[9px]">{count} Reviews</span>
  </div>
);

// ==========================================
// COMPONENT: PRODUCT CARD
// ==========================================
const ProductCard = ({ product, onViewPlans }) => {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0].id);

  const currentVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "group relative border-2 rounded-2xl transition-all duration-300 flex flex-col h-full overflow-hidden",
        "bg-gradient-to-br from-white via-[#154279]/5 to-slate-50 border-slate-300",
        "hover:border-[#F96302] hover:shadow-2xl hover:shadow-[#F96302]/30 hover:scale-[1.02]",
        "shadow-lg shadow-slate-300/30"
      )}
    >
      
      {/* --- DECORATIVE CORNER ACCENT --- */}
      <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-20 bg-gradient-to-br from-[#154279] group-hover:from-[#F96302] transition-all duration-300" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
      


      {/* --- MIDDLE: MAIN CONTENT --- */}
      <div className="flex-grow relative p-8 flex flex-col items-center justify-center">
        {/* Gradient background layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#154279] to-transparent opacity-10 pointer-events-none group-hover:from-[#F96302] transition-all duration-300" />
        
        <motion.div 
          whileHover={{ scale: 1.15, rotate: 5 }}
          className="relative z-10"
        >
          <span style={{ color: "#F96302", filter: "drop-shadow(0 2px 8px rgba(249, 99, 2, 0.3))" }} className="transition-transform duration-300 text-9xl">
            {product.icon}
          </span>
        </motion.div>
        
        {product.hasVariants && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 backdrop-blur px-3 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1.5 shadow-lg border z-20 bg-[#f0f4f8]/95 border-[#154279] text-[#154279]"
          >
            <Settings2 size={12} /> {product.variants.length} Options
          </motion.div>
        )}
        
        <div className="relative z-10 mt-6 text-center w-full px-2">
          <h3 className="text-[13px] font-bold leading-tight group-hover:scale-105 transition-all cursor-pointer uppercase tracking-tight text-[#154279] group-hover:text-[#F96302]">
            {product.title}
          </h3>
          <div className="mt-4 flex items-center justify-center">
            <Rating rating={product.rating} count={product.reviews} />
          </div>
        </div>
      </div>



      {/* --- BOTTOM: PRICE & ACTIONS --- */}
      <div className="relative z-30 p-6 border-t-3 shadow-lg transition-all bg-gradient-to-r from-[#f0f4f8] via-white to-[#e8ecf1] border-[#154279] group-hover:border-[#F96302]">
        {/* Decorative element */}
        <div className="absolute bottom-0 right-0 w-20 h-20 opacity-10 pointer-events-none group-hover:opacity-20 transition-all duration-300">
          {product.icon}
        </div>
        
        <div className="flex items-end justify-between relative z-10">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#154279]">
              Price/Month
            </span>
            <div className="flex items-baseline leading-none mt-2">
              <span className="text-[10px] font-bold mr-1 text-[#154279]">
                KES
              </span>
              <span className="text-2xl font-bold tracking-tight text-[#154279]">
                {currentVariant.price.toLocaleString()}
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            onClick={onViewPlans}
            className="px-4 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-[0.15em] transition-all flex items-center gap-2 bg-[#154279] hover:bg-[#F96302] text-white shadow-lg hover:shadow-xl"
          >
            View Plans <ChevronRight size={14} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ==========================================
// COMPONENT: COMPARISON MATRIX
// ==========================================
const ComparisonMatrix = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-16 bg-white border-2 border-slate-300 shadow-2xl rounded-2xl overflow-hidden"
    >
      <div className="p-8 border-b-3 border-slate-300 bg-gradient-to-br from-[#154279] via-[#154279] to-[#154279] text-white">
        <div>
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 tracking-tight uppercase">
            <BarChart3 size={24} /> Unit Comparison
          </h2>
          <p className="text-[10px] md:text-[11px] text-slate-200 mt-2 font-bold uppercase tracking-widest">Compare all available units side-by-side</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/30">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#e8ecf1] to-[#f0f4f8] border-b-2 border-[#154279]">
              <th className="p-4 text-[10px] uppercase text-[#154279] font-bold tracking-[0.2em]">Unit Type</th>
              <th className="p-4 bg-gradient-to-b from-[#e8ecf1]/50 to-[#f0f4f8]/50 text-[10px] uppercase text-[#154279] font-bold border-l-2 border-r-2 border-[#154279] text-center tracking-[0.2em]">
                Option 1
              </th>
              <th className="p-4 bg-slate-100/50 text-[10px] uppercase text-slate-700 font-bold border-r-2 border-[#154279] text-center tracking-[0.2em]">
                Option 2
              </th>
              <th className="p-4 bg-gradient-to-b from-orange-200/50 to-orange-100/50 text-[10px] uppercase text-[#F96302] font-bold text-center tracking-[0.2em]">
                Option 3
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-200">
            {PRODUCTS.map((prod) => {
              const v1 = prod.variants[0];
              const v2 = prod.variants[1] || null;
              const v3 = prod.variants[2] || null;
              const isResidential = prod.brand === "Residential";
              return (
                <motion.tr 
                  key={prod.id} 
                  whileHover={{ scale: 1.01, backgroundColor: isResidential ? "rgba(21, 66, 121, 0.03)" : "rgba(249, 99, 2, 0.03)" }}
                  className="transition-all hover:shadow-md"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div style={{ color: "#F96302", filter: "drop-shadow(0 2px 6px rgba(249, 99, 2, 0.3))" }}>
                        {prod.icon}
                      </div>
                      <div>
                        <div className="font-bold text-[#154279] text-xs">{prod.title}</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{prod.baseModel}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center border-l-2 border-r-2 border-[#154279] bg-[#f0f4f8]/20">
                    <div className="font-bold text-[#154279] text-[11px] uppercase tracking-tight">KES {v1.price.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-600 mt-1 font-bold uppercase tracking-widest">{v1.name}</div>
                  </td>
                  <td className="p-4 text-center border-r-2 border-[#154279] bg-slate-50/30">
                    {v2 ? (
                      <>
                        <div className="font-bold text-[#154279] text-[11px] uppercase tracking-tight">KES {v2.price.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-600 mt-1 font-bold uppercase tracking-widest">{v2.name}</div>
                      </>
                    ) : <span className="text-slate-400 text-[10px] italic font-semibold">N/A</span>}
                  </td>
                  <td className="p-4 text-center bg-[#f0f4f8]/5">
                    {v3 ? (
                      <>
                        <div className="font-bold text-[#F96302] text-[11px] uppercase tracking-tight">KES {v3.price.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-600 mt-1 font-bold uppercase tracking-widest">{v3.name}</div>
                        <motion.div 
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          className="inline-block mt-2 px-2 py-0.5 bg-gradient-to-r from-[#F96302] to-orange-600 text-white text-[8px] font-bold rounded-lg uppercase tracking-wider shadow-md"
                        >
                          ⭐ Top Tier
                        </motion.div>
                      </>
                    ) : <span className="text-slate-400 text-[10px] italic font-semibold">N/A</span>}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

// ==========================================
// COMPONENT: PAYMENT SECTION
// ==========================================
const PaymentMethodsSection = () => {
    const [selected, setSelected] = useState("mpesa");

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 py-12 flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center mb-10"
            >
                <div className="flex items-center gap-2 text-[#154279] font-bold text-lg tracking-tight uppercase">
                    <Lock className="w-5 h-5 text-[#F96302]" />
                    Secure Checkout Options
                </div>
                <p className="text-[11px] text-slate-600 font-bold mt-2 uppercase tracking-widest">Multiple payment methods for your convenience</p>
            </motion.div>

            {/* ANIMATED SELECTOR CONTAINER */}
            <motion.div 
                className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 px-4"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
            >
                {PAYMENT_METHODS.map((method) => {
                    const isSelected = selected === method.id;
                    return (
                        <motion.div 
                            key={method.id}
                            variants={itemVariants}
                            onClick={() => setSelected(method.id)}
                            className={cn(
                              "relative cursor-pointer w-24 h-20 sm:w-28 sm:h-24 rounded-lg flex items-center justify-center z-10 transition-all duration-300",
                              isSelected ? "scale-110 drop-shadow-lg" : "hover:scale-105"
                            )}
                            style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                            {/* Icon / Logo */}
                            <motion.div 
                                className="relative z-20"
                                animate={isSelected ? { y: [0, -3, 0] } : { y: 0 }}
                                transition={isSelected ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
                            >
                                {method.isIcon ? (
                                    <Landmark 
                                        size={40} 
                                        strokeWidth={1.5}
                                        className={`drop-shadow-md transition-colors duration-300 ${isSelected ? 'text-[#F96302]' : 'text-[#154279]'}`}
                                    />
                                ) : (
                                    <img 
                                        src={method.image} 
                                        alt={method.name} 
                                        className={cn(
                                          "h-8 sm:h-10 w-auto object-contain filter contrast-110 saturate-110 transition-all duration-300",
                                          isSelected ? "drop-shadow-[0_0_8px_rgba(249,99,2,0.5)] brightness-125" : "drop-shadow-md"
                                        )}
                                    />
                                )}
                            </motion.div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-4 mt-10 px-4"
            >
                <motion.div 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/60 border border-[#154279]/20 rounded-lg backdrop-blur-sm transition-all duration-300 hover:border-[#F96302]/40 hover:bg-orange-50/40"
                    whileHover={{ scale: 1.05 }}
                >
                    <Shield className="w-3.5 h-3.5 text-[#154279]" />
                    <span className="text-[11px] font-bold text-[#154279] uppercase tracking-wide">Encrypted</span>
                </motion.div>

                <motion.div 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/60 border border-[#154279]/20 rounded-lg backdrop-blur-sm transition-all duration-300 hover:border-[#F96302]/40 hover:bg-orange-50/40"
                    whileHover={{ scale: 1.05 }}
                >
                    <Zap className="w-3.5 h-3.5 text-[#154279]" />
                    <span className="text-[11px] font-bold text-[#154279] uppercase tracking-wide">Instant</span>
                </motion.div>

                <motion.div 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/60 border border-[#154279]/20 rounded-lg backdrop-blur-sm transition-all duration-300 hover:border-[#F96302]/40 hover:bg-orange-50/40"
                    whileHover={{ scale: 1.05 }}
                >
                    <CheckCircle className="w-3.5 h-3.5 text-[#154279]" />
                    <span className="text-[11px] font-bold text-[#154279] uppercase tracking-wide">Verified</span>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function PricingPage() {
  const comparisonRef = React.useRef<HTMLDivElement>(null);

  const scrollToComparison = () => {
    comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
    <GlobalStyles />
    <div className="min-h-screen bg-slate-50 font-nunito text-slate-900 pb-32">
      
      {/* Fixed navbar offset - prevents content cutoff */}
      <div className="pt-8 md:pt-10 lg:pt-12"></div>

      <div className="max-w-[1400px] mx-auto px-4 py-12 sm:py-16 md:py-20">
        
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 pb-8 border-b border-slate-200"
        >
          <div className="flex items-baseline gap-2 mb-4">
            <div className="h-[2px] w-12 bg-[#F96302]"></div>
            <h2 className="text-[9px] font-bold text-[#F96302] uppercase tracking-[0.3em]">Ayden Homes</h2>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#154279] leading-tight tracking-tight">
            Available Unit Prices
          </h1>
          <p className="text-slate-600 mt-3 text-[11px] sm:text-xs font-bold uppercase tracking-widest">
            Explore our diverse range of residential and commercial units
          </p>
        </motion.div>

        {/* --- GRID --- */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {PRODUCTS.map(product => (
            <ProductCard 
              key={product.id} 
              product={product}
              onViewPlans={scrollToComparison}
            />
          ))}
        </motion.div>

        {/* --- COMPARISON TABLE --- */}
        <div ref={comparisonRef}>
          <ComparisonMatrix />
        </div>

        {/* --- PAYMENT SECTION --- */}
        <PaymentMethodsSection />

      </div>

    </div>
    </>
  );
}
