import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, Star, ShieldCheck, 
  X, Plus, CheckCircle2 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        .font-nunito { font-family: 'Nunito', sans-serif; }
    `}</style>
);

interface Testimonial {
  id: string | number;
  headline: string;
  quote: string;
  name: string;
  location: string;
  role: string;
  rating: number;
  impact: number;
}

export default function TestimonialsSleek() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch testimonials from Supabase
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setTestimonials(data);
        } else {
             // Fallback if no DB data yet
             setTestimonials([
                {
                  id: 1,
                  headline: "Cashflow Efficiency",
                  quote: "Managing the portfolio used to be chaos. Now, with automated collections, our arrears dropped by 90% in two months.",
                  name: "James Kennedy",
                  location: "Nairobi, Kilimani",
                  role: "Property Owner",
                  rating: 5,
                  impact: 98 
                },
                // ... other hardcoded fallbacks could go here
             ]);
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error);
         // Keep hardcoded data on error for demo purposes
         setTestimonials([
            { id: 1, headline: "Cashflow Efficiency", quote: "Managing the portfolio used to be chaos. Now, with automated collections, our arrears dropped by 90% in two months.", name: "James Kennedy", location: "Nairobi, Kilimani", role: "Property Owner", rating: 5, impact: 98 },
            { id: 2, headline: "Tenant Transparency", quote: "I finally have a real-time view of my rent payments. The SMS receipts give me peace of mind every month.", name: "Sarah M.", location: "Mombasa, Nyali", role: "Verified Tenant", rating: 5, impact: 94 },
            { id: 3, headline: "Vendor Integration", quote: "Work orders are clear, photos are attached, and billing is instant. It's the most professional system I've used.", name: "David Ochieng", location: "Nakuru", role: "Contractor", rating: 4, impact: 88 },
            { id: 4, headline: "Seamless Scaling", quote: "We doubled our unit count without hiring new staff. The 'Unit Volumetrics' feature is an absolute game changer.", name: "Metro Housing", location: "Nairobi, CBD", role: "Manager", rating: 5, impact: 99 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const [formData, setFormData] = useState({ 
    name: "", 
    role: "Resident", 
    location: "", 
    headline: "", 
    review: "", 
    rating: 0 
  });

  // --- LOGIC ---
  const totalPages = Math.ceil(testimonials.length / 2);
  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % totalPages);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + totalPages) % totalPages);
  const currentPair = testimonials.slice(activeIndex * 2, activeIndex * 2 + 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      toast.error("Please select a star rating before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
        const newReview = {
            headline: formData.headline || "Verified User Review",
            quote: formData.review,
            name: formData.name,
            location: formData.location,
            role: "Resident", // Default role
            rating: formData.rating,
            impact: Math.floor(Math.random() * (99 - 85 + 1) + 85),
            status: 'approved' // Auto-approve for demo
        };

        const { data, error } = await supabase
            .from('testimonials')
            .insert([newReview])
            .select()
            .single();

        if (error) throw error;

        // Optimistic update
        setTestimonials([data, ...testimonials]);
        toast.success("Review submitted successfully!");
        
        setIsDrawerOpen(false);
        setFormData({ name: "", role: "Resident", location: "", headline: "", review: "", rating: 0 });
    } catch (error: any) {
        console.error("Error submitting review:", error);
        toast.error("Failed to submit review. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-32 bg-[#efeeee] font-nunito overflow-hidden text-[16px]">
      <GlobalStyles />
      
      {/* 1. BACKGROUND: Clean, Breathable */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#efeeee] rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#E2E8F0] rounded-full blur-[100px] opacity-40"></div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 relative z-10">
        

        {/* 2. HEADER: Polished & Scaled */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
               <div className="w-8 h-[2px] bg-[#F96302]"></div>
               <span className="text-sm font-bold uppercase tracking-widest text-[#64748B]">System Audit</span>
            </div>
            {/* Font size adjusted to be punchy but not overwhelming */}
            <h2 className="text-3xl md:text-5xl font-medium text-[#154279] tracking-tight leading-tight">
              Verified <span className="font-semibold text-[#0f172a]">Performance</span>
            </h2>
          </div>

          <div className="flex items-center gap-6">
             {/* Toggle Review Form Button (Skeuomorphic) */}
             <button 
               onClick={() => setIsDrawerOpen(!isDrawerOpen)}
               className={`relative group flex items-center gap-3 px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-300 ${
                 isDrawerOpen 
                 ? "bg-[#efeeee] text-[#154279] shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff]" 
                 : "bg-[#efeeee] text-[#154279] shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] hover:text-[#F96302]"
               }`}
             >
               <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                 isDrawerOpen 
                 ? "bg-[#154279] text-white shadow-[2px_2px_4px_#d1d1d1]" 
                 : "bg-[#F96302] text-white shadow-[2px_2px_4px_#d1d1d1]"
               }`}>
                 {isDrawerOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
               </div>
               <span>
                 {isDrawerOpen ? "Close Form" : "Share Experience"}
               </span>
             </button>

             {/* Navigation (Skeuomorphic) */}
             <div className="flex gap-4">
               <button onClick={prevSlide} className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl bg-[#efeeee] text-[#64748B] hover:text-[#F96302] transition-colors shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]">
                    <ChevronLeft className="w-5 h-5" />
               </button>
               <button onClick={nextSlide} className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl bg-[#efeeee] text-[#64748B] hover:text-[#154279] transition-colors shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]">
                    <ChevronRight className="w-5 h-5" />
               </button>
             </div>
          </div>
        </div>

        {/* 2.5 INLINE REVIEW FORM (Collapsible Skeuomorphic) */}
        <AnimatePresence>
            {isDrawerOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                    animate={{ height: "auto", opacity: 1, marginBottom: 56 }}
                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="bg-[#efeeee] rounded-[2rem] p-8 md:p-10 shadow-[inset_8px_8px_16px_#d1d1d1,inset_-8px_-8px_16px_#ffffff] grid md:grid-cols-3 gap-10 items-start mt-6">
                        
                        {/* Rating Column */}
                        <div className="md:col-span-1 border border-white/40 bg-transparent rounded-3xl p-8 text-center shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff]">
                             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#efeeee] shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] text-[#154279] text-[11px] font-bold uppercase tracking-wider mb-8">
                                <ShieldCheck className="w-4 h-4 text-[#F96302]" /> Verified Review
                            </div>
                            
                             <span className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-6 block">Tap to Rate</span>
                             <div className="flex justify-center gap-3 mb-6 md:mb-8">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        type="button" 
                                        key={star} 
                                        onClick={() => setFormData({...formData, rating: star})}
                                        className={`group transition-all duration-300 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-[#efeeee] ${
                                          star <= formData.rating 
                                          ? "shadow-[inset_3px_3px_6px_#d1d1d1,inset_-3px_-3px_6px_#ffffff]" 
                                          : "shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]"
                                        }`}
                                    >
                                        <Star 
                                          className={`w-5 h-5 md:w-6 md:h-6 transition-colors drop-shadow-sm ${
                                            star <= formData.rating 
                                            ? "fill-[#F96302] text-[#F96302]" 
                                            : "text-gray-400 fill-gray-300 group-hover:text-orange-300"
                                          }`} 
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-[#64748B] font-semibold leading-relaxed px-2">
                                Your rating helps us maintain quality and trust within our community.
                            </p>
                        </div>

                        {/* Form Column */}
                        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="space-y-3">
                                  <label className="text-sm font-black text-[#154279] uppercase tracking-wider ml-2">Full Name</label>
                                  <input 
                                      type="text" 
                                      required
                                      value={formData.name}
                                      className="w-full bg-[#efeeee] border-none rounded-xl px-5 py-4 text-[#154279] font-semibold placeholder-gray-400 focus:outline-none focus:ring-0 transition-all text-sm shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff]"
                                      placeholder="Jane Doe"
                                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                                  />
                               </div>
                               <div className="space-y-3">
                                  <label className="text-sm font-black text-[#154279] uppercase tracking-wider ml-2">Location</label>
                                  <input 
                                      type="text" 
                                      required
                                      value={formData.location}
                                      className="w-full bg-[#efeeee] border-none rounded-xl px-5 py-4 text-[#154279] font-semibold placeholder-gray-400 focus:outline-none focus:ring-0 transition-all text-sm shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff]"
                                      placeholder="e.g. Kilimani"
                                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                                  />
                               </div>
                            </div>

                            <div className="space-y-3">
                               <label className="text-sm font-black text-[#154279] uppercase tracking-wider ml-2">One-Line Summary</label>
                               <input 
                                   type="text" 
                                   required
                                   value={formData.headline}
                                   className="w-full bg-[#efeeee] border-none rounded-xl px-5 py-4 text-[#154279] font-semibold placeholder-gray-400 focus:outline-none focus:ring-0 transition-all text-sm shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff]"
                                   placeholder="e.g. Great Experience, Highly Recommended"
                                   onChange={(e) => setFormData({...formData, headline: e.target.value})}
                               />
                            </div>

                             <div className="space-y-3">
                                <label className="text-sm font-black text-[#154279] uppercase tracking-wider ml-2">Detailed Review</label>
                                <textarea 
                                    rows={4}
                                    required
                                    value={formData.review}
                                    className="w-full bg-[#efeeee] border-none rounded-xl px-5 py-4 text-[#154279] font-semibold placeholder-gray-400 focus:outline-none focus:ring-0 transition-all text-sm resize-none shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff]"
                                    placeholder="How has the system helped you?"
                                    onChange={(e) => setFormData({...formData, review: e.target.value})}
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button 
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-10 py-4 bg-[#efeeee] text-[#154279] text-sm font-bold uppercase tracking-widest hover:text-[#F96302] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]"
                                >
                                    {isSubmitting ? "Submitting..." : "Post Review"}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* 3. CARDS: Skeuomorphic & Larger */}
        <div className="min-h-[400px]">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeIndex}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.4, ease: "easeOut" }}
               className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 px-4 py-6"
             >
               {currentPair.map((item) => (
                 <div 
                    key={item.id} 
                    className="bg-[#efeeee] p-8 md:p-12 rounded-3xl shadow-[10px_10px_20px_#d1d1d1,-10px_-10px_20px_#ffffff] hover:shadow-[inset_2px_2px_5px_#d1d1d1,inset_-2px_-2px_5px_#ffffff] transition-all duration-500 group relative overflow-hidden"
                 >
                   {/* Top Row */}
                   <div className="flex justify-between items-start mb-6 md:mb-8">
                      <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                             <Star key={i} className={`w-4 h-4 md:w-5 md:h-5 drop-shadow-sm ${i < item.rating ? "fill-[#F96302] text-[#F96302]" : "text-gray-300 fill-gray-200"}`} />
                          ))}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#efeeee] shadow-[inset_3px_3px_6px_#d1d1d1,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center">
                         <ShieldCheck className="w-5 h-5 text-[#F96302]" />
                      </div>
                   </div>

                   {/* Content */}
                   <div className="mb-8 md:mb-10 relative z-10 flex-grow">
                      <h3 className="text-xl md:text-2xl font-bold text-[#154279] mb-4 group-hover:text-[#F96302] transition-colors">{item.headline}</h3>
                      <p className="text-base md:text-lg text-[#64748B] leading-relaxed italic">"{item.quote}"</p>
                   </div>

                   {/* Footer */}
                   <div className="flex items-center justify-between border-t border-slate-300/30 pt-6 md:pt-8 mt-auto">
                      <div className="flex items-center gap-4 md:gap-5">
                         <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#efeeee] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-[#154279] text-sm md:text-base font-black uppercase">
                            {item.name.charAt(0)}
                         </div>
                         <div>
                            <p className="text-[13px] md:text-base font-black text-[#154279] tracking-wide">{item.name}</p>
                            <p className="text-[11px] md:text-sm text-[#94A3B8] font-semibold">{item.role} • {item.location}</p>
                         </div>
                      </div>
                      
                      <div className="px-4 py-2 md:px-5 md:py-3 rounded-xl bg-[#efeeee] shadow-[inset_3px_3px_6px_#d1d1d1,inset_-3px_-3px_6px_#ffffff] text-[10px] md:text-xs font-bold text-[#64748B] transition-colors">
                        Impact: <span className="text-[#154279] text-base group-hover:text-[#F96302] ml-1">{item.impact}%</span>
                      </div>
                   </div>
                 </div>
               ))}
             </motion.div>
           </AnimatePresence>
        </div>
      </div>

      {/* 4. MODAL REMOVED (now inline) */}

    </section>
  );
}