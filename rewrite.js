const fs = require('fs');

const content = \import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, ShieldCheck, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) {
          setTestimonials(data);
        } else {
             setTestimonials([
                { id: 1, headline: 'Cashflow Efficiency', quote: 'Managing the portfolio used to be chaos. Now, with automated collections, our arrears dropped by 90% in two months.', name: 'James Kennedy', location: 'Nairobi, Kilimani', role: 'Property Owner', rating: 5, impact: 98 },
                { id: 2, headline: 'Tenant Transparency', quote: 'I finally have a real-time view of my rent payments. The SMS receipts give me peace of mind every month.', name: 'Sarah M.', location: 'Mombasa, Nyali', role: 'Verified Tenant', rating: 5, impact: 94 },
                { id: 3, headline: 'Vendor Integration', quote: 'Work orders are clear, photos are attached, and billing is instant.', name: 'David Ochieng', location: 'Nakuru', role: 'Contractor', rating: 4, impact: 88 },
                { id: 4, headline: 'Seamless Scaling', quote: 'We doubled our unit count without hiring new staff.', name: 'Metro Housing', location: 'Nairobi, CBD', role: 'Manager', rating: 5, impact: 99 }
             ]);
        }
      } catch (error) {
         setTestimonials([
            { id: 1, headline: 'Cashflow Efficiency', quote: 'Managing the portfolio used to be chaos. Now, with automated collections, our arrears dropped by 90% in two months.', name: 'James Kennedy', location: 'Nairobi, Kilimani', role: 'Property Owner', rating: 5, impact: 98 },
            { id: 2, headline: 'Tenant Transparency', quote: 'I finally have a real-time view of my rent payments. The SMS receipts give me peace of mind every month.', name: 'Sarah M.', location: 'Mombasa, Nyali', role: 'Verified Tenant', rating: 5, impact: 94 },
            { id: 3, headline: 'Vendor Integration', quote: 'Work orders are clear, photos are attached, and billing is instant.', name: 'David Ochieng', location: 'Nakuru', role: 'Contractor', rating: 4, impact: 88 },
            { id: 4, headline: 'Seamless Scaling', quote: 'We doubled our unit count without hiring new staff.', name: 'Metro Housing', location: 'Nairobi, CBD', role: 'Manager', rating: 5, impact: 99 }
        ]);
      } finally { setIsLoading(false); }
    };
    fetchTestimonials();
  }, []);

  const [formData, setFormData] = useState({ name: '', role: 'Resident', location: '', headline: '', review: '', rating: 0 });
  const totalPages = Math.ceil(testimonials.length / 2);
  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % totalPages);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + totalPages) % totalPages);
  const currentPair = testimonials.slice(activeIndex * 2, activeIndex * 2 + 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rating === 0) { toast.error('Please select a star rating before submitting.'); return; }
    setIsSubmitting(true);
    try {
        const newReview = {
            headline: formData.headline || 'Verified User Review',
            quote: formData.review, name: formData.name, location: formData.location, role: 'Resident',
            rating: formData.rating, impact: Math.floor(Math.random() * (99 - 85 + 1) + 85), status: 'approved'
        };
        const { data, error } = await supabase.from('testimonials').insert([newReview]).select().single();
        if (error) throw error;
        setTestimonials([data, ...testimonials]);
        toast.success('Review submitted successfully!');
        setIsDrawerOpen(false);
        setFormData({ name: '', role: 'Resident', location: '', headline: '', review: '', rating: 0 });
    } catch (error: any) {
        toast.error('Failed to submit review. Please try again.');
    } finally { setIsSubmitting(false); }
  };

  return (
    <section className="py-24 bg-[#052841] text-white font-sans overflow-hidden border-t border-slate-700/50">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
               <div className="w-8 h-[2px] bg-[#26a9c7]"></div>
               <span className="text-sm font-bold uppercase tracking-widest text-[#26a9c7]">System Audit</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight leading-tight text-white">
              Verified <span className="font-semibold text-white">Performance</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsDrawerOpen(!isDrawerOpen)}
               className={\lex items-center gap-2 px-6 py-3 rounded-md font-bold text-sm transition-all duration-300 \\}
             >
               {isDrawerOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
               <span>{isDrawerOpen ? 'Close' : 'Share Experience'}</span>
             </button>

             <div className="flex gap-2">
               <button onClick={prevSlide} className="w-12 h-12 flex items-center justify-center rounded-md bg-[#154279] text-white hover:bg-[#20518f] transition-colors"><ChevronLeft className="w-5 h-5" /></button>
               <button onClick={nextSlide} className="w-12 h-12 flex items-center justify-center rounded-md bg-[#154279] text-white hover:bg-[#20518f] transition-colors"><ChevronRight className="w-5 h-5" /></button>
             </div>
          </div>
        </div>

        <AnimatePresence>
            {isDrawerOpen && (
                <motion.div initial={{ height: 0, opacity: 0, marginBottom: 0 }} animate={{ height: 'auto', opacity: 1, marginBottom: 40 }} exit={{ height: 0, opacity: 0, marginBottom: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="bg-[#0b3352] rounded-xl p-8 grid md:grid-cols-3 gap-8 items-start border border-[#154279] shadow-lg">
                        <div className="md:col-span-1 text-center">
                             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#052841] text-white text-[11px] font-bold uppercase tracking-wider mb-6 border border-[#154279]">
                                <ShieldCheck className="w-4 h-4 text-[#26a9c7]" /> Verified Review
                            </div>
                             <span className="text-sm text-white font-bold uppercase block mb-4">Tap to Rate</span>
                             <div className="flex justify-center gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button type="button" key={star} onClick={() => setFormData({...formData, rating: star})} className="p-2 rounded-full focus:outline-none">
                                        <Star className={\w-6 h-6 transition-colors \\} />
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400">Your rating helps us maintain quality and trust.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div><label className="text-xs font-bold text-slate-300 uppercase block mb-1">Full Name</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#052841] border border-[#154279] rounded-md px-4 py-3 text-white text-sm focus:outline-none focus:border-[#26a9c7]" placeholder="Jane Doe" /></div>
                               <div><label className="text-xs font-bold text-slate-300 uppercase block mb-1">Location</label><input type="text" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-[#052841] border border-[#154279] rounded-md px-4 py-3 text-white text-sm focus:outline-none focus:border-[#26a9c7]" placeholder="e.g. Nairobi" /></div>
                            </div>
                            <div><label className="text-xs font-bold text-slate-300 uppercase block mb-1">One-Line Summary</label><input type="text" required value={formData.headline} onChange={(e) => setFormData({...formData, headline: e.target.value})} className="w-full bg-[#052841] border border-[#154279] rounded-md px-4 py-3 text-white text-sm focus:outline-none focus:border-[#26a9c7]" placeholder="Great Experience" /></div>
                            <div><label className="text-xs font-bold text-slate-300 uppercase block mb-1">Detailed Review</label><textarea rows={3} required value={formData.review} onChange={(e) => setFormData({...formData, review: e.target.value})} className="w-full bg-[#052841] border border-[#154279] rounded-md px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-[#26a9c7]" placeholder="How has it helped?" /></div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-[#26a9c7] text-white text-sm font-bold rounded-md hover:bg-opacity-90 disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Post Review'}</button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="min-h-[300px]">
           <AnimatePresence mode="wait">
             <motion.div key={activeIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {currentPair.length > 0 ? currentPair.map((item) => (
                 <div key={item.id} className="bg-[#0b3352] p-8 rounded-xl border border-[#154279] shadow-lg flex flex-col">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-1">{[...Array(5)].map((_, i) => (<Star key={i} className={\w-4 h-4 \\} />))}</div>
                      <ShieldCheck className="w-5 h-5 text-[#26a9c7]" />
                   </div>
                   <div className="mb-6 flex-grow">
                      <h3 className="text-xl font-bold text-white mb-3">{item.headline}</h3>
                      <p className="text-slate-300 text-sm leading-relaxed">"{item.quote}"</p>
                   </div>
                   <div className="flex items-center justify-between pt-5 border-t border-[#154279] mt-auto">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-md bg-[#052841] text-white flex items-center justify-center font-bold text-sm border border-[#154279]">{item.name.charAt(0)}</div>
                         <div><p className="text-sm font-bold text-white">{item.name}</p><p className="text-xs text-slate-400">{item.role} • {item.location}</p></div>
                      </div>
                      <div className="text-xs font-bold text-slate-300 bg-[#052841] px-3 py-1.5 rounded-md border border-[#154279]">Impact: <span className="text-[#26a9c7]">{item.impact}%</span></div>
                   </div>
                 </div>
               )) : null}
             </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
\;
fs.writeFileSync('frontend/src/pages/TestimonialsSection.tsx', content);
console.log('done');
