import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search,
    HelpCircle,
  CreditCard, 
  FileText, 
  Users, 
  Terminal, 
    ArrowRight,
  Copy, 
  Check, 
    LayoutGrid, 
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
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
    
        :root {
            --faq-navy: #0f335f;
            --faq-orange: #F96302;
            --faq-ink: #17253a;
            --faq-muted: #5b6473;
        }
    
    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    body { 
            font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: radial-gradient(circle at 85% -10%, #ffe4d2 0, rgba(255, 228, 210, 0) 38%), #f5f7fa;
            color: var(--faq-ink);
    }

        .h-support-title {
            font-family: 'Space Grotesk', 'Manrope', sans-serif;
        }

    .scroll-panel::-webkit-scrollbar { width: 6px; }
    .scroll-panel::-webkit-scrollbar-track { background: transparent; }
    .scroll-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .scroll-panel::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .faq-card-glow {
            transition: box-shadow 0.25s ease, transform 0.25s ease;
        }

        .faq-card-glow:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 35px -26px rgba(15, 51, 95, 0.55);
    }
  `}</style>
);

// ==========================================
// DATA
// ==========================================

const CATEGORY_META: Record<string, { icon: any; summary: string }> = {
    All: { icon: LayoutGrid, summary: "Browse every help topic" },
    General: { icon: HelpCircle, summary: "General platform guidance" },
    Support: { icon: MessageSquare, summary: "Contact and support timelines" },
    Tenants: { icon: Users, summary: "Tenant portal and maintenance" },
    Billing: { icon: CreditCard, summary: "Payments and finance" },
    Leases: { icon: FileText, summary: "Lease lifecycle questions" },
    API: { icon: Terminal, summary: "Integration and webhooks" },
    System: { icon: Server, summary: "System and admin settings" },
};

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
type FaqItemType = {
    id: string;
    category: string;
    views: string;
    updated: string;
    question: string;
    preview: string;
    content: {
        answer: string;
        code: string;
    };
};

const FAQItem = ({ item, isOpen, onToggle }: { item: FaqItemType; isOpen: boolean; onToggle: () => void }) => {
    const [copied, setCopied] = useState(false);
    const Icon = CATEGORY_META[item.category]?.icon || HelpCircle;

    const handleCopyCode = () => {
        if (!item.content.code) return;
        navigator.clipboard.writeText(item.content.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <article
            className={cn(
                "faq-card-glow group rounded-2xl border overflow-hidden transition-all duration-300",
                isOpen
                    ? "border-[#F96302]/60 bg-white shadow-[0_18px_40px_-28px_rgba(15,51,95,0.7)]"
                    : "border-slate-200/80 bg-white"
            )}
        >
            <button
                type="button"
                onClick={onToggle}
                className="w-full text-left px-4 py-4 md:px-6 md:py-5"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-[0.15em]">
                                {item.id}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#ffcfb1] bg-[#fff5ee] text-[#ad4a17] text-[10px] font-black uppercase tracking-[0.12em]">
                                <Icon size={12} />
                                {item.category}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100/80 text-slate-500 text-[10px] font-bold uppercase tracking-[0.08em]">
                                {item.views} views
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100/80 text-slate-500 text-[10px] font-bold uppercase tracking-[0.08em]">
                                Updated {item.updated}
                            </span>
                        </div>

                        <h3 className={cn(
                            "h-support-title text-lg md:text-xl font-bold leading-tight",
                            isOpen ? "text-[#0f335f]" : "text-slate-800"
                        )}>
                            {item.question}
                        </h3>

                        {!isOpen && (
                            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-[72ch]">
                                {item.preview}
                            </p>
                        )}
                    </div>

                    <span
                        className={cn(
                            "shrink-0 mt-1 rounded-full border p-2 transition-all duration-300",
                            isOpen
                                ? "border-[#F96302]/50 bg-[#fff3ea] text-[#F96302] rotate-180"
                                : "border-slate-200 bg-white text-slate-500 group-hover:border-slate-300 group-hover:text-slate-700"
                        )}
                    >
                        <ChevronDown size={16} />
                    </span>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        className="overflow-hidden border-t border-slate-100 bg-gradient-to-br from-[#fffdfa] to-white"
                    >
                        <div className="px-4 py-4 md:px-6 md:py-5 space-y-4">
                            <p className="text-sm md:text-[15px] text-slate-700 leading-relaxed font-medium max-w-[78ch]">
                                {item.content.answer}
                            </p>

                            {item.content.code && (
                                <div className="relative rounded-xl border border-[#0f335f]/20 overflow-hidden">
                                    <div className="bg-[#0f335f] text-slate-100 p-3 md:p-4 overflow-x-auto">
                                        <pre className="text-[11px] md:text-xs font-mono whitespace-pre-wrap break-words">
                                            {item.content.code}
                                        </pre>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopyCode}
                                        className="absolute top-3 right-3 p-2 bg-[#0a2646] hover:bg-[#133d6e] rounded-md transition-colors"
                                    >
                                        {copied ? (
                                            <Check size={14} className="text-emerald-300" />
                                        ) : (
                                            <Copy size={14} className="text-slate-200" />
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </article>
    );
};

// ==========================================
// MAIN PAGE
// ==========================================

export default function FAQSection() {
    const [activeCat, setActiveCat] = useState("All");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const categories = useMemo(
        () => ["All", ...Array.from(new Set(RAW_FAQS.map((item) => item.category)))],
        []
    );

    const categoryCounts = useMemo(() => {
        return categories.reduce<Record<string, number>>((acc, cat) => {
            acc[cat] = cat === "All"
                ? RAW_FAQS.length
                : RAW_FAQS.filter((item) => item.category === cat).length;
            return acc;
        }, {});
    }, [categories]);

    // Filter Logic
    const filteredData = useMemo(() => {
        return RAW_FAQS.filter((item) => {
            const categoryMatch = activeCat === "All" || item.category === activeCat;
            const query = searchQuery.trim().toLowerCase();
            const textMatch = !query || [
                item.question,
                item.preview,
                item.content.answer,
                item.category,
            ].join(" ").toLowerCase().includes(query);

            return categoryMatch && textMatch;
        });
    }, [activeCat, searchQuery]);

    const handleCatClick = (id: string) => {
        setActiveCat(id);
        setExpandedId(null); 
    };

    const ActiveCategoryIcon = CATEGORY_META[activeCat]?.icon || LayoutGrid;

    return (
        <>
        <GlobalStyles />
        <section className="relative overflow-hidden pt-[76px] md:pt-[96px] pb-14 md:pb-16 bg-transparent">
            <div className="absolute -top-40 -left-32 w-72 h-72 rounded-full bg-[#ffddc8]/40 blur-3xl pointer-events-none"></div>
            <div className="absolute top-[35%] -right-36 w-80 h-80 rounded-full bg-[#d9e8fb]/45 blur-3xl pointer-events-none"></div>

            <div className="relative max-w-[1200px] mx-auto px-4 md:px-6">
                <header className="rounded-[28px] bg-[#0f335f] text-white p-5 md:p-8 lg:p-10 border border-[#1f4b7f] shadow-[0_24px_56px_-30px_rgba(15,51,95,0.85)] overflow-hidden">
                    <div className="absolute -top-20 right-8 w-56 h-56 rounded-full bg-[#F96302]/25 blur-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-52 h-52 bg-gradient-to-tr from-[#F96302]/25 to-transparent"></div>

                    <div className="relative z-10">
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#ffd8c2]">Support Center</p>
                        <h2 className="h-support-title mt-3 text-2xl md:text-4xl font-bold leading-tight max-w-[22ch]">
                            Need help with rentals, billing, or onboarding?
                        </h2>
                        <p className="mt-3 text-sm md:text-base text-slate-100/90 max-w-[62ch] leading-relaxed">
                            Search answers instantly, browse by topic, or contact our support team when you need one-on-one guidance.
                        </p>

                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
                            <label className="relative flex items-center h-12 bg-white text-slate-700 border border-white/20 px-3">
                                <Search size={16} className="text-slate-500 mr-2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search questions: payments, maintenance, API..."
                                    className="w-full h-full bg-transparent outline-none text-sm font-semibold placeholder:text-slate-400"
                                />
                            </label>
                            <button className="h-12 px-5 bg-[#F96302] text-white font-black text-[11px] uppercase tracking-[0.14em] hover:bg-[#d75502] transition-colors flex items-center justify-center gap-2">
                                <MessageSquare size={16} />
                                Contact Support
                            </button>
                        </div>

                        <div className="mt-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#ffd8c2]">
                            <ActiveCategoryIcon size={14} />
                            Browsing: {activeCat}
                            <span className="text-white/60">|</span>
                            {filteredData.length} article{filteredData.length === 1 ? "" : "s"}
                        </div>
                    </div>
                </header>

                <div className="mt-6 flex flex-wrap gap-2">
                    {categories.map((cat) => {
                        const Icon = CATEGORY_META[cat]?.icon || HelpCircle;
                        const isActive = activeCat === cat;

                        return (
                            <button
                                key={cat}
                                onClick={() => handleCatClick(cat)}
                                className={cn(
                                    "h-10 px-3 md:px-4 border text-[11px] md:text-xs font-black uppercase tracking-[0.12em] flex items-center gap-2 transition-all",
                                    isActive
                                        ? "bg-[#0f335f] text-white border-[#0f335f] shadow-md"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-[#0f335f]/40 hover:text-[#0f335f]"
                                )}
                            >
                                <Icon size={14} className={isActive ? "text-[#ffb07d]" : "text-slate-500"} />
                                <span>{cat}</span>
                                <span className={cn(
                                    "inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[10px] rounded-sm",
                                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                                )}>
                                    {categoryCounts[cat]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                    <div className="xl:col-span-2 space-y-3">
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
                            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center">
                                <p className="h-support-title text-xl font-bold text-[#0f335f]">No matching FAQs</p>
                                <p className="mt-2 text-sm text-slate-500">
                                    Try a broader keyword or switch category to discover more help articles.
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setActiveCat("All");
                                    }}
                                    className="mt-5 h-11 px-5 bg-[#F96302] text-white text-xs font-black uppercase tracking-[0.12em] hover:bg-[#d75502] transition-colors"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>

                    <aside className="xl:col-span-1 xl:sticky xl:top-28">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-[0_20px_40px_-30px_rgba(15,51,95,0.5)]">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ad4a17]">Quick Help</p>
                            <h3 className="h-support-title mt-2 text-2xl font-bold text-[#0f335f] leading-tight">
                                Can't find what you need?
                            </h3>
                            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                                Share your issue and our team will route you to the right specialist.
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Avg Response</p>
                                    <p className="mt-1 text-lg font-black text-[#0f335f]">2 hrs</p>
                                </div>
                                <div className="border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Emergency</p>
                                    <p className="mt-1 text-lg font-black text-[#0f335f]">24/7</p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-2.5">
                                <button className="w-full h-11 bg-[#0f335f] text-white text-[11px] font-black uppercase tracking-[0.12em] hover:bg-[#0c284a] transition-colors flex items-center justify-center gap-2">
                                    Start Live Chat
                                    <ArrowRight size={15} />
                                </button>
                                <button className="w-full h-11 border-2 border-[#0f335f] text-[#0f335f] text-[11px] font-black uppercase tracking-[0.12em] hover:bg-[#0f335f] hover:text-white transition-colors">
                                    Open Contact Form
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </section>
        </>
    );
}
