import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, Star, ShieldCheck, 
  X, Plus, CheckCircle2 
} from "lucide-react";

export default function TestimonialsSleek() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- DATA ---
  const [testimonials, setTestimonials] = useState([
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
    {
      id: 2,
      headline: "Tenant Transparency",
      quote: "I finally have a real-time view of my rent payments. The SMS receipts give me peace of mind every month.",
      name: "Sarah M.",
      location: "Mombasa, Nyali",
      role: "Verified Tenant",
      rating: 5,
      impact: 94
    },
    {
      id: 3,
      headline: "Vendor Integration",
      quote: "Work orders are clear, photos are attached, and billing is instant. It's the most professional system I've used.",
      name: "David Ochieng",
      location: "Nakuru",
      role: "Contractor",
      rating: 4,
      impact: 88
    },
    {
      id: 4,
      headline: "Seamless Scaling",
      quote: "We doubled our unit count without hiring new staff. The 'Unit Volumetrics' feature is an absolute game changer.",
      name: "Metro Housing",
      location: "Nairobi, CBD",
      role: "Manager",
      rating: 5,
      impact: 99
    }
  ]);

  const [formData, setFormData] = useState({ name: "", role: "Tenant", location: "", review: "", rating: 5 });

  // --- LOGIC ---
  const totalPages = Math.ceil(testimonials.length / 2);
  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % totalPages);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + totalPages) % totalPages);
  const currentPair = testimonials.slice(activeIndex * 2, activeIndex * 2 + 2);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
        setTestimonials([{
            id: Date.now(),
            headline: "New User Feedback",
            quote: formData.review,
            name: formData.name,
            location: formData.location,
            role: formData.role,
            rating: formData.rating,
            impact: 85
        }, ...testimonials]);
        setIsSubmitting(false);
        setIsDrawerOpen(false);
        setFormData({ name: "", role: "Tenant", location: "", review: "", rating: 5 });
    }, 1000);
  };

  return (
    <section className="relative py-24 bg-[#F8F9FB] font-sans overflow-hidden text-[15px]">
      
      {/* 1. BACKGROUND: Clean, Breathable */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#E2E8F0] rounded-full blur-[100px] opacity-40"></div>
      </div>

      <div className="max-w-6xl mx-auto px-8 relative z-10">
        
        {/* 2. HEADER: Polished & Scaled */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
               <div className="w-8 h-[2px] bg-[#C0B283]"></div>
               <span className="text-xs font-bold uppercase tracking-widest text-[#64748B]">System Audit</span>
            </div>
            {/* Font size adjusted to be punchy but not overwhelming */}
            <h2 className="text-3xl md:text-4xl font-medium text-[#1E293B] tracking-tight leading-tight">
              Verified <span className="font-semibold text-[#0f172a]">Performance</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
             {/* Write Review Button */}
             <button 
               onClick={() => setIsDrawerOpen(true)}
               className="group flex items-center gap-3 px-5 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-[#C0B283] hover:shadow-md transition-all duration-300"
             >
               <div className="w-5 h-5 rounded bg-[#1E293B] flex items-center justify-center text-white group-hover:bg-[#C0B283] transition-colors">
                 <Plus className="w-3 h-3" />
               </div>
               <span className="text-xs font-bold uppercase tracking-widest text-[#1E293B]">Log Feedback</span>
             </button>

             {/* Navigation */}
             <div className="flex gap-2">
               <button onClick={prevSlide} className="w-10 h-10 flex items-center justify-center rounded border border-gray-200 bg-white text-[#64748B] hover:text-[#1E293B] hover:border-[#C0B283] transition-all">
                    <ChevronLeft className="w-4 h-4" />
               </button>
               <button onClick={nextSlide} className="w-10 h-10 flex items-center justify-center rounded bg-navy text-white hover:bg-[#0056A6] transition-all shadow-lg">
                    <ChevronRight className="w-4 h-4" />
               </button>
             </div>
          </div>
        </div>

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
                             <Star key={i} className={`w-3.5 h-3.5 ${i < item.rating ? "fill-[#C0B283] text-[#C0B283]" : "text-gray-200 fill-gray-100"}`} />
                          ))}
                      </div>
                      <ShieldCheck className="w-5 h-5 text-[#C0B283] opacity-50 group-hover:opacity-100 transition-opacity" />
                   </div>

                   {/* Content */}
                   <div className="mb-8 relative z-10">
                      <h3 className="text-lg font-semibold text-[#1E293B] mb-2 group-hover:text-[#C0B283] transition-colors">{item.headline}</h3>
                      <p className="text-[15px] text-[#64748B] leading-relaxed">"{item.quote}"</p>
                   </div>

                   {/* Footer */}
                   <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                      <div className="flex items-center gap-3">
                         <div className="w-9 h-9 rounded bg-[#F1F5F9] flex items-center justify-center text-[#64748B] text-xs font-bold border border-slate-100">
                            {item.name.charAt(0)}
                         </div>
                         <div>
                            <p className="text-xs font-bold text-[#1E293B] uppercase tracking-wide">{item.name}</p>
                            <p className="text-[11px] text-[#94A3B8]">{item.role} • {item.location}</p>
                         </div>
                      </div>
                      
                      <div className="px-3 py-1 rounded bg-[#F8F9FB] border border-gray-100 text-[10px] font-bold text-[#64748B] group-hover:border-[#C0B283] group-hover:text-[#C0B283] transition-colors">
                        Impact: <span className="text-slate-800 group-hover:text-[#C0B283]">{item.impact}%</span>
                      </div>
                   </div>

                   {/* Decorative Bottom Line */}
                   <div className="absolute bottom-0 left-0 h-[3px] bg-[#C0B283] w-0 group-hover:w-full transition-all duration-500 ease-in-out"></div>
                 </div>
               ))}
             </motion.div>
           </AnimatePresence>
        </div>
      </div>

      {/* 4. THE DRAWER: Dark Theme */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-sm z-40 transition-opacity"
            />
            
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0f172a] z-50 shadow-2xl flex flex-col border-l border-slate-800"
            >
                <div className="p-8 flex justify-between items-center border-b border-slate-800">
                    <div>
                        <h3 className="text-white text-lg font-medium">Submit <span className="text-[#C0B283]">Review</span></h3>
                    </div>
                    <button onClick={() => setIsDrawerOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 p-8 overflow-y-auto space-y-8">
                    
                    {/* Rating */}
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Overall Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button 
                                    type="button" 
                                    key={star} 
                                    onClick={() => setFormData({...formData, rating: star})}
                                    className={`w-10 h-10 flex items-center justify-center rounded border transition-all ${
                                        star <= formData.rating 
                                        ? "border-[#C0B283] bg-[#C0B283]/10 text-[#C0B283]" 
                                        : "border-slate-700 text-slate-600 hover:border-slate-500"
                                    }`}
                                >
                                    <Star className="w-4 h-4 fill-current" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-6">
                        {['Name', 'Location'].map((field) => (
                            <div key={field} className="group">
                                <label className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 block font-bold group-focus-within:text-[#C0B283] transition-colors">{field}</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full bg-transparent border-b border-slate-700 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#C0B283] transition-colors font-light text-sm"
                                    placeholder={field === 'Name' ? "e.g. John Doe" : "e.g. Nairobi, KE"}
                                    onChange={(e) => setFormData({...formData, [field.toLowerCase()]: e.target.value})}
                                />
                            </div>
                        ))}

                         <div className="group">
                            <label className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 block font-bold group-focus-within:text-[#C0B283] transition-colors">Experience</label>
                            <textarea 
                                rows={4}
                                required
                                className="w-full bg-[#1e293b]/50 border border-slate-700 rounded p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#C0B283] transition-colors font-light text-sm resize-none"
                                placeholder="Share your experience..."
                                onChange={(e) => setFormData({...formData, review: e.target.value})}
                            />
                        </div>
                    </div>
                </form>

                <div className="p-8 border-t border-slate-800 bg-[#0b1120]">
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-[#C0B283] text-[#0f172a] text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
                    >
                        {isSubmitting ? "Processing..." : "Submit Verification"}
                    </button>
                    <div className="flex justify-center gap-2 mt-4 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                        <CheckCircle2 className="w-3 h-3" /> SSL Encrypted
                    </div>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </section>
  );
}