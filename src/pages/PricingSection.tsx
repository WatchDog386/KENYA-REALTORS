import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { 
  ShoppingCart, Search, ChevronDown, Star, Heart, 
  Truck, Store, Check, Info, Filter, X, ArrowUpRight,
  Armchair, BedDouble, Warehouse, Building2, 
  ArrowRightLeft, Plus, Minus, Settings2, ShieldCheck,
  ChevronRight, Box, BarChart3, HelpCircle,
  Lock, Zap, Landmark
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILS ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ==========================================
// DATA: PRODUCTS
// ==========================================
const PRODUCTS = [
  {
    id: "prod-001",
    brand: "Realside Residential",
    title: "Studio Unit Management",
    baseModel: "RES-STU",
    colorTheme: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
    icon: <Armchair />,
    rating: 4.8,
    reviews: 420,
    hasVariants: true,
    variants: [
      { id: "v1", name: "Basic", price: 15000, diff: "Rent Only" },
      { id: "v2", name: "Standard", price: 20000, diff: "+ Maint. Log" },
      { id: "v3", name: "Premium", price: 25000, diff: "+ 24/7 Support" }
    ],
    features: ["Tenant Portal", "Auto-Pay"]
  },
  {
    id: "prod-002",
    brand: "Realside Residential",
    title: "1-Bedroom Suite",
    baseModel: "RES-1BR",
    colorTheme: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
    icon: <BedDouble />,
    rating: 4.9,
    reviews: 1250,
    hasVariants: true,
    variants: [
      { id: "v1", name: "Economy", price: 27000, diff: "Self-Managed" },
      { id: "v2", name: "Managed", price: 32000, diff: "Full Maintenance" },
      { id: "v3", name: "Executive", price: 38000, diff: "Concierge Included" }
    ],
    features: ["Utility Splitting", "Vacancy Ads"]
  },
  {
    id: "prod-003",
    brand: "Metro Commercial",
    title: "Retail Shop Ops",
    baseModel: "COM-RET",
    colorTheme: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
    icon: <Store />,
    rating: 4.5,
    reviews: 85,
    hasVariants: false,
    variants: [{ id: "v1", name: "Standard", price: 55000, diff: "Standard Config" }],
    features: ["CAM Reconciliation", "Asset Audit"]
  },
  {
    id: "prod-004",
    brand: "Metro Industrial",
    title: "Warehouse Logistics",
    baseModel: "IND-WHS",
    colorTheme: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
    icon: <Warehouse />,
    rating: 5.0,
    reviews: 32,
    hasVariants: true,
    variants: [
      { id: "v1", name: "Zone A", price: 85000, diff: "< 5000 sqft" },
      { id: "v2", name: "Zone B", price: 120000, diff: "> 5000 sqft" }
    ],
    features: ["Logistics Sync", "Security Patrol"]
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
        size={10} 
        className={cn(i < Math.floor(rating) ? "fill-cta text-cta" : "fill-gray-200 text-gray-200")}  
      />
    ))}
    <span className="text-[#004691] hover:underline ml-1 cursor-pointer font-bold">({count})</span>
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
    <div className="group relative bg-white border border-gray-200 rounded-[3px] hover:border-gray-400 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 flex flex-col h-[420px] overflow-hidden">
      
      {/* --- TOP: BRAND & ICONS --- */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-white z-10">
        <div>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
            {product.brand}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
             MDL #{product.baseModel}-{currentVariant.name.substring(0,3).toUpperCase()}
          </span>
        </div>
        <Heart size={16} className="text-gray-300 hover:text-cta cursor-pointer transition-colors" />
      </div>

      {/* --- MIDDLE: MAIN CONTENT --- */}
      <div className="flex-grow relative bg-[#F9FAFB]">
        <div className="absolute inset-0 flex flex-col p-4">
          <div className="flex-grow flex items-center justify-center relative">
             <motion.div 
               whileHover={{ scale: 1.05 }}
               className={cn("p-6 rounded-full shadow-sm border", product.colorTheme.bg, product.colorTheme.border)}
             >
                {React.cloneElement(product.icon, { size: 48, className: product.colorTheme.text })}
             </motion.div>
             {product.hasVariants && !isOpen && (
               <div className="absolute bottom-0 bg-white/80 backdrop-blur border border-gray-200 px-3 py-1 rounded-full text-[10px] font-bold text-[#004691] flex items-center gap-1 shadow-sm">
                  <Settings2 size={12} /> {product.variants.length} Configs
               </div>
             )}
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-bold text-[#333] leading-tight group-hover:text-[#F96302] transition-colors cursor-pointer">
              {product.title}
            </h3>
            <div className="mt-1 flex items-center justify-between">
               <Rating rating={product.rating} count={product.reviews} />
               <span className="text-[9px] font-bold text-green-700 flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded">
                 <Check size={10} /> In Stock
               </span>
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
              <div className="bg-[#004691] text-white p-3 flex items-center justify-between shadow-md">
                <span className="text-xs font-bold uppercase tracking-wide">Select Configuration</span>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-y-auto flex-grow p-0 scrollbar-thin scrollbar-thumb-gray-300">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-bold sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="p-3 pl-4">Tier</th>
                      <th className="p-3">Key Diff</th>
                      <th className="p-3 text-right pr-4">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((variant) => {
                      const isActive = selectedVariantId === variant.id;
                      return (
                        <tr 
                          key={variant.id}
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={cn(
                            "cursor-pointer text-xs border-b border-gray-100 transition-colors hover:bg-orange-50",
                            isActive ? "bg-blue-50/60" : "bg-white"
                          )}
                        >
                          <td className="p-3 pl-4">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-3 h-3 rounded-full border flex items-center justify-center",
                                isActive ? "border-[#F96302] bg-[#F96302]" : "border-gray-300"
                              )}>
                                {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </div>
                              <span className={cn("font-bold", isActive ? "text-[#004691]" : "text-gray-700")}>
                                {variant.name}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-gray-500 text-[10px]">{variant.diff}</td>
                          <td className="p-3 pr-4 text-right font-bold text-[#333]">
                            {variant.price.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="p-4 bg-gray-50 text-[10px] text-gray-600 space-y-2 border-t border-gray-200">
                   <p className="font-bold text-[#333] mb-1">Includes:</p>
                   {product.features.map((f, i) => (
                     <div key={i} className="flex gap-2">
                       <Check size={12} className="text-green-600 shrink-0" /> {f}
                     </div>
                   ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- BOTTOM: PRICE & ACTIONS --- */}
      <div className="bg-white p-4 border-t border-gray-200 z-30 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-end justify-between mb-3">
          <div className="flex flex-col">
             <span className="text-[10px] text-gray-400 font-bold uppercase">Your Price</span>
             <div className="flex items-start leading-none">
                <span className="text-xs font-bold mt-1 mr-0.5">KES</span>
                <span className="text-2xl font-black tracking-tight text-[#333]">
                  {currentVariant.price.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-gray-500 self-end mb-1 ml-1">/mo</span>
             </div>
          </div>
          {product.hasVariants && !isOpen && (
             <button onClick={() => setIsOpen(true)} className="text-[10px] font-bold text-[#004691] hover:text-[#F96302] hover:underline flex items-center gap-1">
               Change Config <ArrowUpRight size={12} />
             </button>
          )}
        </div>
        <div className="flex gap-2 h-10">
           <div className="w-20 border border-gray-300 rounded-[3px] flex items-center">
             <button onClick={() => handleQty(-1)} className="w-6 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100"><Minus size={12}/></button>
             <input readOnly value={qty} className="w-full h-full text-center text-xs font-bold focus:outline-none" />
             <button onClick={() => handleQty(1)} className="w-6 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100"><Plus size={12}/></button>
           </div>
           <button 
             onClick={() => { addToCart(product, currentVariant, qty); setIsOpen(false); }}
             className={cn("flex-1 text-xs font-bold uppercase tracking-wide rounded-[3px] transition-all flex items-center justify-center gap-2 shadow-sm", isInCart ? "bg-green-600 text-white hover:bg-green-700" : "bg-[#F96302] text-white hover:bg-[#d85500]")}
           >
             {isInCart ? <>In Cart <Check size={16}/></> : "Add to Cart"}
           </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENT: COMPARISON MATRIX
// ==========================================
const ComparisonMatrix = () => {
  return (
    <div className="mt-12 bg-white border border-gray-200 shadow-sm rounded-[3px] overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div>
           <h2 className="text-lg font-bold text-[#333] flex items-center gap-2">
             <BarChart3 className="text-[#004691]" size={20} /> Package Comparison Matrix
           </h2>
           <p className="text-xs text-gray-500 mt-1">Direct feature and pricing comparison across all property types</p>
        </div>
        <button className="text-xs font-bold text-[#004691] hover:underline flex items-center gap-1">
          Download PDF <ArrowUpRight size={12}/>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-white border-b border-gray-200">
              <th className="p-4 min-w-[200px] text-xs uppercase text-gray-400 font-bold">Property Type</th>
              <th className="p-4 min-w-[150px] bg-blue-50/30 text-xs uppercase text-[#004691] font-bold border-l border-r border-gray-100 text-center">
                Basic Tier
              </th>
              <th className="p-4 min-w-[150px] text-xs uppercase text-[#333] font-bold border-r border-gray-100 text-center">
                Standard Tier
              </th>
              <th className="p-4 min-w-[150px] bg-orange-50/30 text-xs uppercase text-cta font-bold text-center">
                Premium Tier
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PRODUCTS.map((prod) => {
               const v1 = prod.variants[0];
               const v2 = prod.variants[1] || null;
               const v3 = prod.variants[2] || null;
               return (
                <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-md", prod.colorTheme.bg, prod.colorTheme.text)}>
                        {React.cloneElement(prod.icon, { size: 16 })}
                      </div>
                      <div>
                        <div className="font-bold text-[#333] text-xs">{prod.title}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{prod.baseModel}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center border-l border-r border-gray-100 bg-blue-50/10">
                    <div className="font-bold text-gray-700">KES {v1.price.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{v1.name}</div>
                  </td>
                  <td className="p-4 text-center border-r border-gray-100">
                    {v2 ? (
                      <>
                        <div className="font-bold text-[#004691]">KES {v2.price.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{v2.name}</div>
                      </>
                    ) : <span className="text-gray-300 text-[10px] italic">--</span>}
                  </td>
                  <td className="p-4 text-center bg-orange-50/10">
                    {v3 ? (
                      <>
                         <div className="font-bold text-cta">KES {v3.price.toLocaleString()}</div>
                         <div className="text-[10px] text-gray-400 mt-0.5">{v3.name}</div>
                         <div className="inline-block mt-1 px-1.5 py-0.5 bg-cta text-white text-[8px] font-bold rounded uppercase tracking-wider">
                           Best Value
                         </div>
                      </>
                    ) : <span className="text-gray-300 text-[10px] italic">--</span>}
                  </td>
                </tr>
               )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT: PAYMENT SECTION (NEW)
// ==========================================
const PaymentMethodsSection = () => {
    const [selected, setSelected] = useState("mpesa");

    return (
        <div className="mt-8 bg-white border border-gray-200 shadow-sm rounded-[3px] py-12 flex flex-col items-center justify-center overflow-hidden">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center mb-10"
            >
                <div className="flex items-center gap-2 text-gray-800 font-bold text-lg">
                    <Lock className="w-5 h-5 text-gray-400" />
                    Secure Checkout
                </div>
                <p className="text-sm text-gray-400 font-medium mt-1">Select your preferred payment method</p>
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
                            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.95 }}
                            className="relative cursor-pointer w-24 h-20 sm:w-28 sm:h-24 rounded-2xl flex items-center justify-center z-10"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                            {/* Sliding Background */}
                            {isSelected && (
                                <motion.div 
                                    layoutId="active-pill"
                                    className="absolute inset-0 bg-blue-50 border-2 border-blue-200/60 rounded-2xl -z-10 shadow-sm"
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
                                        className={`drop-shadow-sm transition-colors duration-300 ${isSelected ? 'text-blue-800' : 'text-slate-600'}`}
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
                className="mt-10 flex items-center gap-6 opacity-70"
            >
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Verified</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Instant</span>
                 </div>
            </motion.div>
        </div>
    );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function PolishedPage() {
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
    <div className="min-h-screen bg-[#F5F6F7] font-sans text-[#333] pb-32">
      
      {/* REMOVED: PROPDEPOT HEADER SECTION */}

      <div className="max-w-[1400px] mx-auto px-4 py-8">
        
        {/* Page Title & Sort */}
        <div className="flex items-end justify-between mb-6 pb-4 border-b border-gray-300">
           <div>
              <h1 className="text-2xl font-light text-[#333]">Property Configurations</h1>
              <p className="text-xs text-gray-500 mt-1">Showing {PRODUCTS.length} products with real-time pricing</p>
           </div>
           <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[3px] text-xs font-bold hover:bg-gray-50">
                 <Filter size={14} /> Filter List
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-[3px] text-xs font-bold hover:bg-gray-50">
                 Sort: Top Sellers <ChevronDown size={14} />
              </button>
           </div>
        </div>

        {/* --- GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PRODUCTS.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              addToCart={addToCart}
              cartState={cart}
            />
          ))}
        </div>

        {/* --- COMPARISON TABLE --- */}
        <ComparisonMatrix />

        {/* --- ADDED: ANIMATED PAYMENT SECTION --- */}
        <PaymentMethodsSection />

      </div>

      {/* --- CART FOOTER --- */}
      <AnimatePresence>
         {cart.length > 0 && (
           <motion.div 
             initial={{ y: 100 }}
             animate={{ y: 0 }}
             exit={{ y: 100 }}
             className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-cta shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 px-6 py-4"
           >
              <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="bg-[#F96302] p-2 rounded text-white shadow-sm">
                       <ShoppingCart size={20} />
                    </div>
                    <div>
                       <div className="text-sm font-bold text-[#333]">{cart.reduce((a,c)=>a+c.qty,0)} Items in Cart</div>
                       <div className="text-xs text-gray-500">Pick up at Nairobi West or Schedule Delivery</div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-8">
                    <div className="text-right">
                       <span className="block text-[10px] font-bold text-gray-400 uppercase">Estimated Total</span>
                       <span className="block text-2xl font-black text-[#333] leading-none">
                         KES {cart.reduce((a, c) => a + (c.price * c.qty), 0).toLocaleString()}
                         <span className="text-xs font-normal text-gray-500 ml-1">/mo</span>
                       </span>
                    </div>
                    <button className="bg-[#F96302] hover:bg-[#d85500] text-white px-8 py-3 rounded-[3px] text-sm font-bold uppercase tracking-wider shadow-md transition-transform active:scale-95">
                       Secure Checkout
                    </button>
                 </div>
              </div>
           </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}