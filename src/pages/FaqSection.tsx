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
        id: "FAQ-101", category: "Billing", views: "1.2k", updated: "2 days ago",
        question: "How do I handle M-Pesa STK Push timeouts?",
        preview: "Steps to take when a customer does not receive the prompt.",
        content: { 
            answer: "If the STK push times out (approx 10s), do not immediately retry. First, verify the phone number format (must be 254...). If valid, check the transaction log. If the status is 'Failed', you may manually trigger a retry via the API.", 
            code: "POST /api/v1/payments/retry \n{\n  \"transaction_id\": \"TX123\",\n  \"reason\": \"timeout\"\n}" 
        }
    },
    {
        id: "FAQ-102", category: "Billing", views: "856", updated: "1 week ago",
        question: "What are the settlement timelines for M-Pesa deposits?",
        preview: "Understanding when funds reach your account.",
        content: { 
            answer: "M-Pesa deposits typically settle within 24 hours. Business deposits may take 48 hours during weekends. Check your transaction status in the Dashboard > Payments section.",
            code: "// Check settlement status\nGET /api/v1/settlements/{settlement_id}" 
        }
    },
    {
        id: "FAQ-201", category: "Leases", views: "2.3k", updated: "3 days ago",
        question: "How do I upload a lease document?",
        preview: "Step-by-step guide for document uploads.",
        content: { 
            answer: "Navigate to Properties > Lease Documents. Click 'Upload Document', select your PDF or image file, and add metadata (start date, end date, tenant). The system will auto-extract key details.",
            code: "POST /api/v1/leases/documents\nContent-Type: multipart/form-data" 
        }
    },
    {
        id: "FAQ-202", category: "Leases", views: "1.9k", updated: "5 days ago",
        question: "Can I set automatic lease renewal reminders?",
        preview: "Configure renewal notifications.",
        content: { 
            answer: "Yes. In Lease Settings, enable 'Auto-Reminder' and set the alert date (e.g., 60 days before expiry). The system will notify all stakeholders via SMS and email.",
            code: "// Enable renewal reminders\nPUT /api/v1/leases/{lease_id}/settings" 
        }
    },
    {
        id: "FAQ-301", category: "Tenants", views: "3.1k", updated: "1 day ago",
        question: "How do tenants reset their portal password?",
        preview: "Password recovery for tenant accounts.",
        content: { 
            answer: "Tenants can click 'Forgot Password' on the login page. They'll receive an email with a reset link valid for 24 hours. After reset, they can log in with the new password.",
            code: "POST /api/v1/auth/password-reset\n{\n  \"email\": \"tenant@example.com\"\n}" 
        }
    },
    {
        id: "FAQ-401", category: "API", views: "2.7k", updated: "4 days ago",
        question: "What are the API rate limits?",
        preview: "Understanding API throttling and quotas.",
        content: { 
            answer: "Standard tier: 1000 requests/hour. Premium tier: 10,000 requests/hour. If you exceed limits, you'll receive a 429 status code. Rate limit info is in the response headers.",
            code: "X-RateLimit-Limit: 1000\nX-RateLimit-Remaining: 950\nX-RateLimit-Reset: 1645000000" 
        }
    },
];

// ==========================================
// ACCORDION COMPONENT
// ==========================================
const FAQItem = ({ item, isOpen, onToggle }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(item.content.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div key={item.id} className="group">
            <div 
                onClick={onToggle}
                className={cn(
                    "table-row-hover grid grid-cols-12 gap-6 px-8 py-5 items-center cursor-pointer",
                    isOpen ? 'bg-blue-50/40 border-l-cta' : 'bg-white hover:bg-slate-50'
                )}
            >
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
                    <p className="text-xs text-slate-500">{item.preview}</p>
                </div>
                <div className="col-span-2">
                    <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded">
                        {item.category}
                    </span>
                </div>
                <div className="col-span-1 text-center">
                    <span className="text-xs font-medium text-slate-600">{item.views}</span>
                </div>
                <div className="col-span-1 flex justify-end">
                    <ChevronDown 
                        size={16} 
                        className={cn(
                            "text-slate-400 transition-transform duration-300",
                            isOpen && "rotate-180"
                        )}
                    />
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden bg-slate-50/50 border-b border-slate-100"
                    >
                        <div className="px-8 py-6 space-y-4">
                            <div>
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {item.content.answer}
                                </p>
                            </div>

                            {item.content.code && (
                                <div className="relative">
                                    <div className="bg-slate-800 text-slate-100 p-4 rounded border border-slate-700 overflow-x-auto">
                                        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
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
        <div className="flex h-screen bg-slate-50 overflow-hidden font-brand pt-[5rem] lg:pt-[8rem]">
            
            {/* --- SIDEBAR --- */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm h-full">
                {/* Branding */}
                <div className="h-24 flex items-center px-8 border-b border-slate-100">
                    <div className="flex flex-col">
                        <h1 className="font-black text-navy text-lg tracking-tight uppercase leading-none">REALTORS<span className="text-cta">.</span></h1>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Support</span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="p-6 flex-1 overflow-y-auto scroll-panel">
                    <div className="mb-8">
                        <p className="mb-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Modules</p>
                        <nav className="space-y-1">
                            {CATEGORIES.map((cat) => {
                                const isActive = activeCat === cat.id;
                                const count = cat.id === "All" ? RAW_FAQS.length : RAW_FAQS.filter(i => i.category === cat.id).length;
                                
                                return (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => handleCatClick(cat.id)}
                                        className={cn(
                                            "w-full nav-item-hover flex items-center justify-between px-4 py-3 rounded text-[10px] font-semibold uppercase tracking-wide transition-all duration-200 group border",
                                            isActive 
                                                ? 'bg-navy text-white border-navy' 
                                                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-navy'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <cat.icon className={cn(
                                                "w-4 h-4 transition-colors",
                                                isActive ? 'text-cta' : 'text-slate-400 group-hover:text-navy'
                                            )} />
                                            {cat.label}
                                        </div>
                                        <span className={cn(
                                            "text-[9px] px-2 py-0.5 rounded font-bold",
                                            isActive ? 'bg-cta text-white' : 'bg-slate-100 text-slate-500'
                                        )}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white">
                    <button className="w-full flex items-center justify-center gap-2 py-3 bg-navy text-white text-[10px] font-semibold uppercase tracking-wider hover:bg-cta transition-colors rounded shadow-sm">
                        <MessageSquare size={14} /> Contact Agent
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-8 scroll-panel">
                    
                    {/* FAQ Table */}
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-6 px-8 py-4 bg-navy border-b border-navy text-[10px] font-semibold text-white uppercase tracking-wider sticky top-0 z-10">
                            <div className="col-span-2">Reference ID</div>
                            <div className="col-span-5">Question</div>
                            <div className="col-span-2">Category</div>
                            <div className="col-span-1 text-center">Popularity</div>
                            <div className="col-span-1 text-right">More</div>
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
                    <div className="mt-8 flex items-center justify-between">
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
            </main>
        </div>
        </>
    );
}
