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
    <section className="relative py-24 bg-[#F8F9FB] font-nunito overflow-hidden text-[15px]">
      <GlobalStyles />
      
      {/* 1. BACKGROUND: Clean, Breathable */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#E2E8F0] rounded-full blur-[100px] opacity-40"></div>
      </div>

      <div className="max-w-6xl mx-auto px-8 relative z-10">
        

        {/* 2. HEADER: Polished & Scaled */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
               <div className="w-8 h-[2px] bg-[#F96302]"></div>
               <span className="text-xs font-bold uppercase tracking-widest text-[#64748B]">System Audit</span>
            </div>
            {/* Font size adjusted to be punchy but not overwhelming */}
            <h2 className="text-3xl md:text-4xl font-medium text-[#154279] tracking-tight leading-tight">
              Verified <span className="font-semibold text-[#0f172a]">Performance</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
             {/* Toggle Review Form Button */}
             <button 
               onClick={() => setIsDrawerOpen(!isDrawerOpen)}
               className={`relative group flex items-center gap-3 px-6 py-3 border rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden ${
                 isDrawerOpen 
                 ? "bg-[#154279] border-[#154279] text-white" 
                 : "bg-[#F96302] border-[#F96302] text-[#154279] shadow-[#F96302]/30 shadow-md hover:scale-105"
               }`}
             >
               {/* Shine Effect */}
               {!isDrawerOpen && (
                 <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
               )}

               <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                 isDrawerOpen 
                 ? "bg-white/20 text-white" 
                 : "bg-white text-[#F96302]"
               }`}>
                 {isDrawerOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
               </div>
               <span className="text-xs font-black uppercase tracking-widest">
                 {isDrawerOpen ? "Close Form" : "Share Your Experience"}
               </span>
             </button>

             {/* Navigation */}
             <div className="flex gap-2">
               <button onClick={prevSlide} className="w-10 h-10 flex items-center justify-center rounded border border-gray-200 bg-white text-[#64748B] hover:text-[#154279] hover:border-[#F96302] transition-all">
                    <ChevronLeft className="w-4 h-4" />
               </button>
               <button onClick={nextSlide} className="w-10 h-10 flex items-center justify-center rounded bg-[#154279] text-white hover:bg-[#0f325e] transition-all shadow-lg">
                    <ChevronRight className="w-4 h-4" />
               </button>
             </div>
          </div>
        </div>

        {/* 2.5 INLINE REVIEW FORM (Collapsible) */}
        <AnimatePresence>
            {isDrawerOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                    animate={{ height: "auto", opacity: 1, marginBottom: 48 }}
                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] grid md:grid-cols-3 gap-8 items-start">
                        
                        {/* Rating Column */}
                        <div className="md:col-span-1 bg-gray-50/50 rounded-xl p-6 text-center border border-gray-100">
                             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#154279]/5 text-[#154279] text-[10px] font-bold uppercase tracking-wider mb-6">
                                <ShieldCheck className="w-3 h-3" /> Verified Review
                            </div>
                            
                             <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-4 block">Tap to Rate</span>
                             <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        type="button" 
                                        key={star} 
                                        onClick={() => setFormData({...formData, rating: star})}
                                        className={`group transition-all duration-300 ${star <= formData.rating ? 'scale-110' : 'hover:scale-105'}`}
                                    >
                                        <Star 
                                          className={`w-8 h-8 transition-colors ${
                                            star <= formData.rating 
                                            ? "fill-[#F96302] text-[#F96302]" 
                                            : "text-gray-200 fill-gray-50 group-hover:text-orange-200"
                                          }`} 
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-[11px] text-[#64748B] leading-relaxed px-4">
                                Your rating helps us maintain quality and trust within our community.
                            </p>
                        </div>

                        {/* Form Column */}
                        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-5">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                               <div className="space-y-2">
                                  <label className="text-xs font-bold text-[#154279]">Full Name</label>
                                  <input 
                                      type="text" 
                                      required
                                      value={formData.name}
                                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#154279] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F96302]/20 focus:border-[#F96302] transition-all text-sm"
                                      placeholder="Jane Doe"
                                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-xs font-bold text-[#154279]">Location</label>
                                  <input 
                                      type="text" 
                                      required
                                      value={formData.location}
                                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#154279] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F96302]/20 focus:border-[#F96302] transition-all text-sm"
                                      placeholder="e.g. Kilimani"
                                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                                  />
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-xs font-bold text-[#154279]">One-Line Summary</label>
                               <input 
                                   type="text" 
                                   required
                                   value={formData.headline}
                                   className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#154279] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F96302]/20 focus:border-[#F96302] transition-all text-sm"
                                   placeholder="e.g. Great Experience, Highly Recommended"
                                   onChange={(e) => setFormData({...formData, headline: e.target.value})}
                               />
                            </div>

                             <div className="space-y-2">
                                <label className="text-xs font-bold text-[#154279]">Detailed Review</label>
                                <textarea 
                                    rows={3}
                                    required
                                    value={formData.review}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-[#154279] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F96302]/20 focus:border-[#F96302] transition-all text-sm resize-none"
                                    placeholder="How has the system helped you?"
                                    onChange={(e) => setFormData({...formData, review: e.target.value})}
                                />
                            </div>

                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full md:w-auto px-8 py-3 bg-[#154279] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#F96302] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-900/10 float-right"
                            >
                                {isSubmitting ? "Submitting..." : "Post Review"}
                            </button>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* 3. CARDS: Clean Rectangles */}
        <div className="min-h-[340px]">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeIndex}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.4, ease: "easeOut" }}
               className="grid grid-cols-1 md:grid-cols-2 gap-6"
             >
               {currentPair.map((item) => (
                 <div 
                    key={item.id} 
                    className="bg-white p-8 rounded-lg border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.05)] transition-all duration-500 group relative overflow-hidden"
                 >
                   {/* Top Row */}
                   <div className="flex justify-between items-start mb-5">
                      <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                             <Star key={i} className={`w-3.5 h-3.5 ${i < item.rating ? "fill-[#F96302] text-[#F96302]" : "text-gray-200 fill-gray-100"}`} />
                          ))}
                      </div>
                      <ShieldCheck className="w-5 h-5 text-[#F96302] opacity-50 group-hover:opacity-100 transition-opacity" />
                   </div>

                   {/* Content */}
                   <div className="mb-8 relative z-10">
                      <h3 className="text-lg font-semibold text-[#154279] mb-2 group-hover:text-[#F96302] transition-colors">{item.headline}</h3>
                      <p className="text-[15px] text-[#64748B] leading-relaxed">"{item.quote}"</p>
                   </div>

                   {/* Footer */}
                   <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                      <div className="flex items-center gap-3">
                         <div className="w-9 h-9 rounded-full bg-[#154279] flex items-center justify-center text-white text-xs font-bold border border-transparent">
                            {item.name.charAt(0)}
                         </div>
                         <div>
                            <p className="text-xs font-bold text-[#154279] capitalize tracking-wide">{item.name}</p>
                            <p className="text-[11px] text-[#94A3B8]">{item.role} • {item.location}</p>
                         </div>
                      </div>
                      
                      <div className="px-3 py-1 rounded bg-[#F8F9FB] border border-gray-100 text-[10px] font-bold text-[#64748B] group-hover:border-[#F96302] group-hover:text-[#F96302] transition-colors">
                        Impact: <span className="text-slate-800 group-hover:text-[#F96302]">{item.impact}%</span>
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