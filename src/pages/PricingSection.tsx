import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { 
  ShoppingCart, Star, Heart, Check, Filter, X, ArrowUpRight,
  BedDouble, Warehouse, Building2, Plus, Minus, Settings2, 
  ShieldCheck, BarChart3, Lock, Zap, Landmark,
  Home, Briefcase, TrendingUp
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;800&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    
    body { font-family: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif; }
    .font-nunito { font-family: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif; }
    h1, h2, h3, h4, h5, h6 { font-family: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif; }
  `}</style>
);

// --- UTILS ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- DESIGN SYSTEM (UNIFIED WITH FEATURES PAGE) ---
const THEME = {
  navy: "#00356B",
  orange: "#D85C2C",
  orangeHover: "#d85502",
  white: "#ffffff",
  offwhite: "#f7f7f7",
  lightblue: "#eef5ff",
  text: "#1a1a1a",
  darkGray: "#484848",
  midGray: "#666666",
  lightGray: "#e2e8f0",
  border: "#e2e8f0",
  bgLight: "#f8f9fa"
};

// ==========================================
// DATA: PRODUCTS
// ==========================================
const PRODUCTS = [
  {
    id: "prod-001",
    brand: "Residential",
    title: "Studio Unit Management",
    baseModel: "RES-STU",
    icon: <Home size={24} />,
    rating: 4.8,
    reviews: 420,
    hasVariants: true,
    variants: [
      { id: "v1", name: "Basic", price: 15000, diff: "Rent Only" },
      { id: "v2", name: "Standard", price: 20000, diff: "+ Maintenance" },
      { id: "v3", name: "Premium", price: 25000, diff: "+ 24/7 Support" }
    ],
    features: ["Tenant Portal", "Auto-Pay", "Monthly Reports", "Document Storage"]
  },
  {
    id: "prod-002",
    brand: "Residential",
    title: "1-Bedroom Suite Management",
    baseModel: "RES-1BR",
    icon: <BedDouble size={24} />,
    rating: 4.9,
    reviews: 1250,
    hasVariants: true,
    variants: [
      { id: "v1", name: "Economy", price: 27000, diff: "Self-Managed" },
      { id: "v2", name: "Managed", price: 32000, diff: "Full Maintenance" },
      { id: "v3", name: "Executive", price: 38000, diff: "Concierge Service" }
    ],
    features: ["Utility Splitting", "Vacancy Ads", "Tenant Screening", "Legal Support"]
  },
  {
    id: "prod-003",
    brand: "Commercial",
    title: "Retail Shop Operations",
    baseModel: "COM-RET",
    icon: <Briefcase size={24} />,
    rating: 4.5,
    reviews: 85,
    hasVariants: false,
    variants: [{ id: "v1", name: "Standard", price: 55000, diff: "Complete Config" }],
    features: ["CAM Reconciliation", "Asset Audit", "Tenant Support", "Analytics"]
  },
  {
    id: "prod-004",
    brand: "Industrial",
    title: "Warehouse Logistics Management",
    baseModel: "IND-WHS",
    icon: <Warehouse size={24} />,
    rating: 5.0,
    reviews: 32,
    hasVariants: true,
    variants: [
      { id: "v1", name: "Zone A", price: 85000, diff: "< 5000 sqft" },
      { id: "v2", name: "Zone B", price: 120000, diff: "> 5000 sqft" }
    ],
    features: ["Logistics Sync", "Security Integration", "Monthly Analytics", "Reports"]
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
  <div className="flex items-center gap-0.5 text-[10px] mb-2">
    {[...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={11} 
        className={i < Math.floor(rating) ? `fill-[${THEME.orange}] text-[${THEME.orange}]` : "fill-gray-200 text-gray-200"}  
      />
    ))}
    <span className="ml-1 cursor-pointer font-bold text-gray-600 hover:text-[#D85C2C] transition-colors uppercase tracking-widest">{count} Reviews</span>
  </div>
);

// ==========================================
// COMPONENT: PRODUCT CARD
// ==========================================
const ProductCard = ({ product, addToCart, cartState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0].id);
  const [qty, setQty] = useState(1);

  const currentVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0];
  const isInCart = cartState.some(item => item.uniqueId === `${product.id}-${currentVariant.name}`);

  const handleQty = (delta) => setQty(prev => Math.max(1, prev + delta));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white border border-gray-200 rounded-xl hover:border-[#D85C2C] hover:shadow-xl transition-all duration-300 flex flex-col h-[440px] overflow-hidden shadow-sm hover:shadow-2xl"
    >
      
      {/* --- TOP: BRAND & ICONS --- */}
      <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gradient-to-br from-white to-gray-50">
        <div>
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-2">
            {product.brand}
          </span>
          <span className="text-[10px] text-gray-700 font-bold tracking-tight">
            {product.baseModel}-{currentVariant.name.substring(0,3).toUpperCase()}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.15 }}
          className="text-gray-400 hover:text-[#D85C2C] transition-colors"
        >
          <Heart size={18} />
        </motion.button>
      </div>

      {/* --- MIDDLE: MAIN CONTENT --- */}
      <div className="flex-grow relative bg-gradient-to-br from-gray-50 to-white p-5 flex flex-col items-center justify-center">
        <motion.div 
          whileHover={{ scale: 1.08 }}
          className="p-5 rounded-2xl shadow-md border border-gray-100 bg-gradient-to-br from-blue-50 to-blue-100"
        >
          <span style={{ color: THEME.navy }}>{product.icon}</span>
        </motion.div>
        
        {product.hasVariants && !isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 bg-white/95 backdrop-blur border border-gray-200 px-3 py-1.5 rounded-full text-[9px] font-bold text-[#D85C2C] flex items-center gap-1.5 shadow-md"
          >
            <Settings2 size={12} /> {product.variants.length} Options
          </motion.div>
        )}
        
        <div className="mt-3 text-center w-full px-2">
          <h3 className="text-[13px] font-black text-[#00356B] leading-tight group-hover:text-[#D85C2C] transition-colors cursor-pointer uppercase tracking-tight">
            {product.title}
          </h3>
          <div className="mt-2 flex items-center justify-center">
            <Rating rating={product.rating} count={product.reviews} />
          </div>
        </div>
      </div>

      {/* --- OVERLAY: CONFIGURATION VIEW --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 bg-white z-20 flex flex-col"
          >
            <div className="bg-[#00356B] text-white p-3 flex items-center justify-between shadow-lg">
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Select Plan</span>
              <motion.button 
                whileHover={{ rotate: 90 }}
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/20 p-1 rounded transition-colors"
              >
                <X size={16} />
              </motion.button>
            </div>

            <div className="overflow-y-auto flex-grow p-0 scrollbar-thin scrollbar-thumb-gray-300">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[9px] text-gray-600 uppercase font-black sticky top-0 border-b border-gray-200 tracking-[0.15em]">
                  <tr>
                    <th className="p-3 pl-4">Plan</th>
                    <th className="p-3">Details</th>
                    <th className="p-3 text-right pr-4">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((variant) => {
                    const isActive = selectedVariantId === variant.id;
                    return (
                      <motion.tr 
                        key={variant.id}
                        onClick={() => setSelectedVariantId(variant.id)}
                        whileHover={{ backgroundColor: "rgba(216, 92, 44, 0.05)" }}
                        className={cn(
                          "cursor-pointer text-xs border-b border-gray-100 transition-colors",
                          isActive ? "bg-blue-50/50" : "bg-white"
                        )}
                      >
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center",
                              isActive ? "border-[#D85C2C] bg-[#D85C2C]" : "border-gray-300"
                            )}>
                              {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <span className={cn("font-bold", isActive ? "text-[#00356B]" : "text-gray-700")}>
                              {variant.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600 text-[9px]">{variant.diff}</td>
                        <td className="p-3 pr-4 text-right font-bold text-[#484848]">
                          {variant.price.toLocaleString()}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 text-[9px] text-gray-700 space-y-2 border-t border-gray-200">
                <p className="font-black text-[#00356B] mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                  <Check size={14} className="text-[#D85C2C]" /> Plan Includes:
                </p>
                {product.features.map((f, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Check size={12} className="text-[#D85C2C] shrink-0 mt-0.5" /> 
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- BOTTOM: PRICE & ACTIONS --- */}
      <div className="bg-white p-5 border-t border-gray-200 z-30 shadow-sm">
        <div className="flex items-end justify-between mb-3">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">Price/Month</span>
            <div className="flex items-baseline leading-none mt-1">
              <span className="text-[10px] font-bold text-gray-600 mr-1">KES</span>
              <span className="text-2xl font-black tracking-tight text-[#00356B]">
                {currentVariant.price.toLocaleString()}
              </span>
            </div>
          </div>
          {product.hasVariants && !isOpen && (
            <motion.button 
              whileHover={{ x: 3 }}
              onClick={() => setIsOpen(true)} 
              className="text-[9px] font-black text-[#D85C2C] hover:text-[#d85502] transition-colors flex items-center gap-1 uppercase tracking-widest"
            >
              Change <ArrowUpRight size={12} />
            </motion.button>
          )}
        </div>
        <div className="flex gap-2 h-10">
          <div className="w-20 border border-gray-300 rounded-lg flex items-center bg-gray-50">
            <button onClick={() => handleQty(-1)} className="w-6 h-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"><Minus size={12}/></button>
            <input readOnly value={qty} className="w-full h-full text-center text-xs font-bold focus:outline-none bg-transparent" />
            <button onClick={() => handleQty(1)} className="w-6 h-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"><Plus size={12}/></button>
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => { addToCart(product, currentVariant, qty); setIsOpen(false); }}
            className={cn(
              "flex-1 text-[11px] font-black uppercase tracking-[0.15em] rounded-lg transition-all flex items-center justify-center gap-2 shadow-md",
              isInCart 
                ? "bg-green-600 text-white hover:bg-green-700" 
                : "bg-[#D85C2C] text-white hover:bg-[#d85502]"
            )}
          >
            {isInCart ? <>In Cart <Check size={14}/></> : <>Add<Check size={14}/></>}
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
      className="mt-16 bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden"
    >
      <div className="p-6 md:p-8 border-b border-gray-200 bg-gradient-to-br from-white to-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[#00356B] flex items-center gap-2 tracking-tight uppercase">
            <BarChart3 className="text-[#D85C2C]" size={24} /> Pricing Comparison
          </h2>
          <p className="text-[10px] md:text-[11px] text-gray-600 mt-2 font-bold uppercase tracking-widest">Compare all property management plans side-by-side</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          className="text-[10px] font-black text-[#D85C2C] hover:text-[#d85502] transition-colors flex items-center gap-1 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 uppercase tracking-widest"
        >
          Download <ArrowUpRight size={14}/>
        </motion.button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-white border-b border-gray-200">
              <th className="p-4 min-w-[220px] text-[10px] uppercase text-gray-600 font-black tracking-[0.2em]">Property Type</th>
              <th className="p-4 min-w-[160px] bg-blue-50/30 text-[10px] uppercase text-[#00356B] font-black border-l border-r border-gray-100 text-center tracking-[0.2em]">
                Basic
              </th>
              <th className="p-4 min-w-[160px] text-[10px] uppercase text-[#484848] font-black border-r border-gray-100 text-center tracking-[0.2em]">
                Standard
              </th>
              <th className="p-4 min-w-[160px] bg-orange-50/30 text-[10px] uppercase text-[#D85C2C] font-black text-center tracking-[0.2em]">
                Premium
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PRODUCTS.map((prod) => {
              const v1 = prod.variants[0];
              const v2 = prod.variants[1] || null;
              const v3 = prod.variants[2] || null;
              return (
                <motion.tr 
                  key={prod.id} 
                  whileHover={{ backgroundColor: "rgba(216, 92, 44, 0.02)" }}
                  className="hover:bg-orange-50/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-blue-50/50 text-[#00356B]">
                        {prod.icon}
                      </div>
                      <div>
                        <div className="font-bold text-[#00356B] text-xs">{prod.title}</div>
                        <div className="text-[10px] text-gray-500 font-semibold mt-0.5">{prod.baseModel}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center border-l border-r border-gray-100 bg-blue-50/10">
                    <div className="font-black text-[#00356B] text-[11px] uppercase tracking-tight">KES {v1.price.toLocaleString()}</div>
                    <div className="text-[9px] text-gray-600 mt-1 font-bold uppercase tracking-widest">{v1.name}</div>
                  </td>
                  <td className="p-4 text-center border-r border-gray-100">
                    {v2 ? (
                      <>
                        <div className="font-black text-[#00356B] text-[11px] uppercase tracking-tight">KES {v2.price.toLocaleString()}</div>
                        <div className="text-[9px] text-gray-600 mt-1 font-bold uppercase tracking-widest">{v2.name}</div>
                      </>
                    ) : <span className="text-gray-400 text-[10px] italic">N/A</span>}
                  </td>
                  <td className="p-4 text-center bg-orange-50/10">
                    {v3 ? (
                      <>
                        <div className="font-black text-[#D85C2C] text-[11px] uppercase tracking-tight">KES {v3.price.toLocaleString()}</div>
                        <div className="text-[9px] text-gray-600 mt-1 font-bold uppercase tracking-widest">{v3.name}</div>
                        <motion.div 
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          className="inline-block mt-2 px-2 py-0.5 bg-[#D85C2C] text-white text-[8px] font-bold rounded-full uppercase tracking-wider"
                        >
                          Top Tier
                        </motion.div>
                      </>
                    ) : <span className="text-gray-400 text-[10px] italic">N/A</span>}
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
            className="mt-16 bg-white border border-gray-200 shadow-lg rounded-xl py-12 flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center mb-10"
            >
                <div className="flex items-center gap-2 text-[#00356B] font-black text-lg tracking-tight uppercase">
                    <Lock className="w-5 h-5 text-[#D85C2C]" />
                    Secure Checkout Options
                </div>
                <p className="text-[11px] text-gray-600 font-bold mt-2 uppercase tracking-widest">Multiple payment methods for your convenience</p>
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
                            whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.95 }}
                            className="relative cursor-pointer w-24 h-20 sm:w-28 sm:h-24 rounded-2xl flex items-center justify-center z-10"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                            {/* Sliding Background */}
                            {isSelected && (
                                <motion.div 
                                    layoutId="active-pill"
                                    className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-[#D85C2C] rounded-2xl -z-10 shadow-lg"
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                />
                            )}

                            {/* Icon / Logo */}
                            <motion.div 
                                className="relative z-20 p-1"
                                animate={isSelected ? { y: [0, -3, 0] } : { y: 0 }}
                                transition={isSelected ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
                            >
                                {method.isIcon ? (
                                    <Landmark 
                                        size={36} 
                                        strokeWidth={1.5}
                                        className={`drop-shadow-sm transition-colors duration-300 ${isSelected ? 'text-[#D85C2C]' : 'text-gray-500'}`}
                                    />
                                ) : (
                                    <img 
                                        src={method.image} 
                                        alt={method.name} 
                                        className="h-8 sm:h-10 w-auto object-contain drop-shadow-md filter contrast-110 saturate-110" 
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
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50/50 border border-green-200 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-green-700">Encrypted</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 border border-blue-200 rounded-full">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-700">Instant</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50/50 border border-orange-200 rounded-full">
                    <TrendingUp className="w-3.5 h-3.5 text-[#D85C2C]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#D85C2C]">Verified</span>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function PricingPage() {
  const [cart, setCart] = useState([]);

  const addToCart = (product, variant, qty) => {
    const uniqueId = `${product.id}-${variant.name}`;
    setCart(prev => {
      const exists = prev.find(p => p.uniqueId === uniqueId);
      if (exists) {
         return prev.map(p => p.uniqueId === uniqueId ? { ...p, qty: p.qty + qty } : p);
      }
      return [...prev, { 
        uniqueId, 
        title: product.title, 
        variant: variant.name, 
        price: variant.price, 
        qty 
      }];
    });
  };

  return (
    <>
    <GlobalStyles />
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 font-nunito text-[#1a1a1a] pb-32">
      
      {/* Fixed navbar offset - prevents content cutoff */}
      <div className="pt-24 md:pt-28 lg:pt-32"></div>

      <div className="max-w-[1400px] mx-auto px-4 py-12 sm:py-16 md:py-20">
        
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 pb-8 border-b border-gray-200"
        >
          <div className="flex items-baseline gap-2 mb-4">
            <div className="h-[2px] w-12 bg-[#D85C2C]"></div>
            <h2 className="text-[9px] font-black text-[#D85C2C] uppercase tracking-[0.3em]">Property Rentals</h2>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#00356B] leading-tight tracking-tight">
            Rental Prices
          </h1>
          <p className="text-gray-600 mt-3 text-[11px] sm:text-xs font-bold uppercase tracking-widest">
            Flexible pricing designed for property owners, managers, and investors
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
              addToCart={addToCart}
              cartState={cart}
            />
          ))}
        </motion.div>

        {/* --- COMPARISON TABLE --- */}
        <ComparisonMatrix />

        {/* --- PAYMENT SECTION --- */}
        <PaymentMethodsSection />

      </div>

      {/* --- CART FOOTER --- */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-[#D85C2C] shadow-2xl z-50 px-4 sm:px-6 py-4 font-nunito"
          >
            <div className="max-w-[1400px] mx-auto flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="bg-[#D85C2C] p-2.5 sm:p-3 rounded-lg text-white shadow-lg"
                >
                  <ShoppingCart size={20} />
                </motion.div>
                <div>
                  <div className="text-[10px] sm:text-[11px] font-black text-[#00356B] uppercase tracking-widest">{cart.reduce((a,c)=>a+c.qty,0)} Items in Cart</div>
                  <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Ready for checkout</div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 sm:gap-8">
                <div className="text-right">
                  <span className="block text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Estimated Total</span>
                  <span className="block text-xl sm:text-2xl font-black text-[#00356B] leading-none">
                    KES {cart.reduce((a, c) => a + (c.price * c.qty), 0).toLocaleString()}
                    <span className="text-[10px] font-bold text-gray-600 ml-1">/mo</span>
                  </span>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-[#D85C2C] hover:bg-[#d85502] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] shadow-lg transition-all"
                >
                  Proceed to Checkout
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
    </>
  );
}
