import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  CreditCard, 
  FileText, 
  Users, 
  Terminal, 
  Copy, 
  Check, 
  Layout, 
  Server, 
  MessageSquare,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==========================================
// GLOBAL STYLES
// ==========================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    
    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #f8fafc;
      color: #334155;
    }

    .scroll-panel::-webkit-scrollbar { width: 6px; }
    .scroll-panel::-webkit-scrollbar-track { background: transparent; }
    .scroll-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .scroll-panel::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

    .nav-item-hover { position: relative; overflow: hidden; }
    .nav-item-hover::before {
        content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 3px;
        background-color: #D85C2C; transform: scaleY(0); transition: transform 0.2s ease;
    }
    .nav-item-hover:hover::before { transform: scaleY(1); }

    .table-row-hover { transition: all 0.15s ease-in-out; border-left: 3px solid transparent; }
    .table-row-hover:hover {
        background-color: #f1f5f9; border-left-color: #D85C2C; transform: translateX(2px);
    }
  `}</style>
);

// ==========================================
// DATA
// ==========================================

const CATEGORIES = [
    { id: "All", label: "All Topics", icon: Layout },
    { id: "Billing", label: "Billing & Finance", icon: CreditCard },
    { id: "Leases", label: "Lease Management", icon: FileText },
    { id: "Tenants", label: "Tenant Portal", icon: Users },
    { id: "API", label: "API Integration", icon: Terminal },
    { id: "System", label: "System Config", icon: Server },
];

const RAW_FAQS = [
    {
        id: "FAQ-101", category: "General", views: "2.1k", updated: "2 days ago",
        question: "What are your business hours?",
        preview: "When can you reach our support team.",
        content: { 
            answer: "We operate 24/7 to serve you better. Our customer support team is available round the clock via phone, email, and live chat. During peak hours (8 AM - 6 PM EAT), you'll get faster responses.", 
            code: "" 
        }
    },
    {
        id: "FAQ-102", category: "Support", views: "1.8k", updated: "1 week ago",
        question: "How quickly will I receive a response?",
        preview: "Expected response times for different channels.",
        content: { 
            answer: "Email inquiries are answered within 2 hours. Phone calls are answered immediately during business hours. Live chat responses are instant. Critical issues get priority response.",
            code: "" 
        }
    },
    {
        id: "FAQ-201", category: "Support", views: "2.3k", updated: "3 days ago",
        question: "Do you offer emergency support?",
        preview: "How to get help with urgent issues.",
        content: { 
            answer: "Yes! We have a dedicated emergency hotline for urgent property issues. Use the emergency option in the chat or call our 24/7 support line for immediate assistance.",
            code: "" 
        }
    },
    {
        id: "FAQ-202", category: "General", views: "1.9k", updated: "5 days ago",
        question: "Can I schedule a meeting with management?",
        preview: "How to arrange a meeting with our team.",
        content: { 
            answer: "Absolutely. You can request a meeting through the contact form by selecting 'Partnership' or 'General Inquiry'. We'll get back to you within 24 hours to schedule.",
            code: "" 
        }
    },
    {
        id: "FAQ-301", category: "Tenants", views: "3.1k", updated: "1 day ago",
        question: "How do I report a maintenance issue?",
        preview: "Steps to report maintenance problems.",
        content: { 
            answer: "Tenants can report maintenance through the tenant portal or call our maintenance hotline. Property managers should use the admin dashboard. Emergency issues should be reported immediately by phone.",
            code: "" 
        }
    },
    {
        id: "FAQ-401", category: "General", views: "2.7k", updated: "4 days ago",
        question: "What payment methods do you accept?",
        preview: "Available payment options.",
        content: { 
            answer: "We accept M-Pesa, bank transfers, credit/debit cards, and online wallets. All payment methods are secure and encrypted for your protection.",
            code: "" 
        }
    },
];

// ==========================================
// ACCORDION COMPONENT
// ==========================================
const FAQItem = ({ item, isOpen, onToggle }: { item: any, isOpen: boolean, onToggle: () => void }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(item.content.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div key={item.id} className="group border-b border-slate-100 last:border-0 relative">
            <div 
                onClick={onToggle}
                className={cn(
                    "relative w-full cursor-pointer transition-all duration-200",
                    isOpen ? 'bg-blue-50/40' : 'bg-white hover:bg-slate-50'
                )}
            >
                {/* Desktop Grid Layout */}
                <div className="hidden md:grid grid-cols-12 gap-6 px-8 py-5 items-center">
                    <div className="col-span-2">
                        <span className="text-[10px] font-semibold font-mono text-slate-400 group-hover:text-navy bg-slate-100 px-2 py-1 rounded">
                            {item.id}
                        </span>
                    </div>
                    <div className="col-span-5">
                        <div className={cn(
                            "text-sm font-semibold transition-colors mb-1",
                            isOpen ? 'text-navy' : 'text-slate-700 group-hover:text-navy'
                        )}>
                            {item.question}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{item.preview}</p>
                    </div>
                    <div className="col-span-2">
                        <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded">
                            {item.category}
                        </span>
                    </div>
                    <div className="col-span-1 text-center">
                        <span className="text-xs font-medium text-slate-600">{item.views}</span>
                    </div>
                    <div className="col-span-2 flex justify-end">
                        <ChevronDown 
                            size={16} 
                            className={cn(
                                "text-slate-400 transition-transform duration-300",
                                isOpen && "rotate-180"
                            )}
                        />
                    </div>
                </div>

                {/* Mobile Stacked Layout */}
                <div className="md:hidden flex flex-col px-3 py-3 gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-semibold font-mono text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded">
                            {item.id}
                        </span>
                        <div className="flex items-center gap-2">
                             <span className="text-[9px] font-medium text-slate-600 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full">
                                {item.category}
                            </span>
                            <ChevronDown 
                                size={14} 
                                className={cn(
                                    "text-slate-400 transition-transform duration-300",
                                    isOpen && "rotate-180"
                                )}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <div className={cn(
                            "text-xs font-semibold transition-colors mb-1 pr-2",
                            isOpen ? 'text-navy' : 'text-slate-700'
                        )}>
                            {item.question}
                        </div>
                        {!isOpen && (
                            <p className="text-[10px] text-slate-500 line-clamp-2">{item.preview}</p>
                        )}
                    </div>
                </div>

                {/* Accent Border on Left when active */}
                {isOpen && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F96302]"></div>
                )}
            </div>

            {/* Expanded Content - Shared */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                    >
                        <div className="px-3 py-4 md:px-8 md:py-6 space-y-2 md:space-y-4">
                            <div>
                                <p className="text-[11px] md:text-sm text-slate-700 leading-relaxed font-medium">
                                    {item.content.answer}
                                </p>
                            </div>

                            {item.content.code && (
                                <div className="relative">
                                    <div className="bg-slate-800 text-slate-100 p-3 md:p-4 rounded border border-slate-700 overflow-x-auto">
                                        <pre className="text-[10px] md:text-xs font-mono whitespace-pre-wrap break-words">
                                            {item.content.code}
                                        </pre>
                                    </div>
                                    <button
                                        onClick={handleCopyCode}
                                        className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                                    >
                                        {copied ? (
                                            <Check size={14} className="text-green-400" />
                                        ) : (
                                            <Copy size={14} className="text-slate-300" />
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ==========================================
// MAIN PAGE
// ==========================================

export default function FAQSection() {
    const [activeCat, setActiveCat] = useState("All");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Filter Logic
    const filteredData = useMemo(() => {
        if (activeCat === "All") return RAW_FAQS;
        return RAW_FAQS.filter(item => item.category === activeCat);
    }, [activeCat]);

    const handleCatClick = (id: string) => {
        setActiveCat(id);
        setExpandedId(null); 
    };

    return (
        <>
        <GlobalStyles />
        <div className="flex flex-col md:flex-row min-h-screen md:h-screen bg-slate-50 md:overflow-hidden font-brand pt-[60px] md:pt-[5rem]">
            
            {/* --- SIDEBAR (Desktop Fixed / Mobile Horizontal) --- */}
            <aside className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col z-20 shadow-sm md:h-full sticky top-[60px] md:static shrink-0">
                {/* Branding - Hidden on Mobile */}
                <div className="hidden md:flex h-24 items-center px-8 border-b border-slate-100">
                    <div className="flex flex-col">
                        <h1 className="font-black text-navy text-lg tracking-tight uppercase leading-none">REALTORS<span className="text-cta">.</span></h1>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Support</span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="p-2 md:p-6 overflow-x-auto md:overflow-y-auto scroll-panel w-full">
                    {/* Mobile Label */}
                    <div className="md:hidden px-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Select Topic
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 md:gap-0 md:space-y-1 mb-0 md:mb-8 min-w-max md:min-w-0">
                        <p className="hidden md:block mb-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Modules</p>
                        {CATEGORIES.map((cat) => {
                            const isActive = activeCat === cat.id;
                            const count = cat.id === "All" ? RAW_FAQS.length : RAW_FAQS.filter(i => i.category === cat.id).length;
                            
                            return (
                                <button 
                                    key={cat.id} 
                                    onClick={() => handleCatClick(cat.id)}
                                    className={cn(
                                        "flex-shrink-0 md:flex-shrink md:w-full nav-item-hover flex items-center justify-between px-3 py-2 md:py-3 rounded-full md:rounded text-[10px] font-semibold uppercase tracking-wide transition-all duration-200 group border whitespace-nowrap",
                                        isActive 
                                            ? 'bg-navy text-white border-navy shadow-md md:shadow-none' 
                                            : 'bg-white md:bg-transparent text-slate-600 border-slate-200 md:border-transparent hover:bg-slate-50 hover:text-navy hover:border-slate-300 md:hover:border-transparent'
                                    )}
                                >
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <cat.icon className={cn(
                                            "w-3 h-3 md:w-4 md:h-4 transition-colors",
                                            isActive ? 'text-cta' : 'text-slate-400 group-hover:text-navy'
                                        )} />
                                        {cat.label}
                                    </div>
                                    <span className={cn(
                                        "hidden md:block text-[9px] px-2 py-0.5 rounded font-bold",
                                        isActive ? 'bg-cta text-white' : 'bg-slate-100 text-slate-500'
                                    )}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Button - Desktop Only */}
                <div className="hidden md:block p-6 border-t border-slate-100 bg-white mt-auto">
                    <button className="w-full flex items-center justify-center gap-2 py-3 bg-navy text-white text-[10px] font-semibold uppercase tracking-wider hover:bg-cta transition-colors rounded shadow-sm">
                        <MessageSquare size={14} /> Contact Agent
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-[calc(100vh-130px)] md:h-auto">

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-panel pb-24 md:pb-8">
                    
                    {/* FAQ Table */}
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                        {/* Table Header - Desktop Only */}
                        <div className="hidden md:grid grid-cols-12 gap-6 px-8 py-4 bg-navy border-b border-navy text-[10px] font-semibold text-white uppercase tracking-wider sticky top-0 z-10">
                            <div className="col-span-2">Reference ID</div>
                            <div className="col-span-5">Question</div>
                            <div className="col-span-2">Category</div>
                            <div className="col-span-1 text-center">Popularity</div>
                            <div className="col-span-2 text-right">More</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-slate-100 bg-white">
                            {filteredData.length > 0 ? (
                                filteredData.map((faq) => {
                                    const isOpen = expandedId === faq.id;
                                    return (
                                        <FAQItem
                                            key={faq.id}
                                            item={faq}
                                            isOpen={isOpen}
                                            onToggle={() => setExpandedId(isOpen ? null : faq.id)}
                                        />
                                    );
                                })
                            ) : (
                                <div className="col-span-full px-8 py-12 text-center">
                                    <p className="text-slate-500 text-sm font-medium">No FAQs found for this category.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-slate-600 font-medium">
                            Showing {filteredData.length} of {RAW_FAQS.length} results
                        </p>
                        <div className="flex gap-2">
                            <button className="p-2 rounded border border-slate-200 bg-white hover:border-navy hover:bg-slate-50 transition-all text-slate-600 hover:text-navy">
                                <ChevronRight size={16} className="rotate-180" />
                            </button>
                            <button className="p-2 rounded border border-slate-200 bg-white hover:border-navy hover:bg-slate-50 transition-all text-slate-600 hover:text-navy">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Floating Contact Button */}
                <div className="md:hidden fixed bottom-6 right-6 z-50">
                    <button className="flex items-center justify-center w-14 h-14 bg-[#F96302] text-white rounded-full shadow-lg hover:scale-105 transition-transform">
                        <MessageSquare size={24} />
                    </button>
                </div>

            </main>
        </div>
        </>
    );
}
