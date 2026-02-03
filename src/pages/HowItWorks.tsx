import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CheckCircle2, 
    Truck,
    Download, 
    Share2, 
    ShieldCheck, 
    Clock, 
    AlertCircle, 
    ChevronRight, 
    Lock, 
    MapPin, 
    FileText, 
    X, 
    Copy, 
    CheckCircle, 
    Zap, 
    DollarSign, 
    Mail, 
    Facebook, 
    Linkedin, 
    Twitter, 
    FileCheck
} from "lucide-react";
import jsPDF from "jspdf";
import { cn } from "@/lib/utils";

// --- GLOBAL STYLES FOR CLEAN FONT RENDERING ---
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .font-inter { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
    `}</style>
);

// --- DESIGN SYSTEM ---
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

// --- COMPREHENSIVE RENTAL GUIDE DATA ---
const rentalGuideData = {
    title: "Complete DIY Rental Guide 2026",
    description: "Master the rental process with our comprehensive step-by-step guide",
    
    beforeRenting: [
        { title: "Check Your Credit Score", description: "Most landlords check credit. Aim for 620+ for better approval odds.", action: "Get free credit report at annualcreditreport.com" },
        { title: "Save for Deposits", description: "Plan to save 2-3x monthly rent (security deposit + first month).", action: "Create dedicated savings account" },
        { title: "Document Your Income", description: "Gather recent pay stubs, tax returns, bank statements, employment letter.", action: "Organize into folder" },
        { title: "Get References Ready", description: "Previous landlords, employers, character references boost applications.", action: "Reach out to references" },
        { title: "Check for Evictions", description: "Evictions stay on record 5-7 years. Understand your rental history.", action: "Order background report" }
    ],

    searchTips: {
        platforms: ["Zillow", "Apartments.com", "Trulia", "Rent.com", "Craigslist", "Local property managers"],
        redFlags: [
            "Asking for wire transfer before showing",
            "Prices significantly below market",
            "Pressure to decide immediately",
            "Poor communication or spelling errors",
            "Unwillingness to provide landlord info"
        ],
        whatToLook: [
            "Pet policies (if applicable)",
            "Utilities included/excluded",
            "Parking availability",
            "Maintenance response time",
            "Lease term flexibility"
        ]
    },

    verificationProcess: [
        { step: "1. Schedule Tour", details: "Visit during daylight. Check plumbing, electrical, appliances, walls.", checklist: ["Water pressure", "Light switches", "Stove/oven", "Cracks/damage", "Windows/locks"] },
        { step: "2. Document Condition", details: "Take photos/video of every room. Request existing damage list.", checklist: ["Empty rooms photos", "Appliance condition", "Carpet/flooring", "Paint condition", "Get landlord signature"] },
        { step: "3. Verify Landlord", details: "Confirm ownership, check local property records, verify contact.", checklist: ["Property ownership", "Phone verification", "Reference check", "Background clear", "Insurance verified"] },
        { step: "4. Review Lease", details: "Read all terms carefully. Understand costs, duration, policies.", checklist: ["All terms clear", "Pricing agreed", "Move-in date", "Break clause", "Pet policies"] }
    ],

    leaseExecution: {
        essentialTerms: [
            { term: "Lease Duration", explanation: "Usually 6-12 months. Longer leases offer stability but less flexibility." },
            { term: "Rent Amount & Due Date", explanation: "Total monthly rent and specific date payment is due. Late fees should be defined." },
            { term: "Deposit Amount", explanation: "Typically 1-2 months rent. Must be returned within 30-45 days after move-out." },
            { term: "Utilities & Services", explanation: "Clarify which utilities landlord covers vs. tenant responsibility." },
            { term: "Pet Policy", explanation: "Pet types/sizes allowed, pet deposits/fees, breed restrictions." },
            { term: "Maintenance & Repairs", explanation: "Who fixes what. Emergency response time. Maintenance contact info." },
            { term: "Subletting", explanation: "Can you sublet? What's the process? Any approval needed?" },
            { term: "Early Termination", explanation: "Break clause terms, early termination fees, notice period required." }
        ],
        neverAgreeVue: [
            "Non-refundable deposits or fees (illegal in most states)",
            "Unilateral rent increase mid-lease",
            "Waiving security deposit return rights",
            "Making repairs at tenant expense without agreement",
            "Entering without notice (illegal without emergency)"
        ]
    },

    moveInLogistics: [
        { phase: "1 Week Before", tasks: ["Confirm moving date", "Change address with USPS", "Notify utilities of move date", "Book moving company/truck"] },
        { phase: "Moving Day", tasks: ["Do walkthrough with landlord", "Document any existing damage", "Take photos of empty space", "Set up utilities"] },
        { phase: "After Move-In", tasks: ["Test all appliances", "Check all locks work", "Verify utilities connected", "Document any issues", "Send move-in condition email"] },
        { phase: "First Month", tasks: ["Set payment reminders", "Report maintenance issues", "Keep rent receipts", "Document all communications"] }
    ],

    rentalRights: [
        "Right to habitability - Safe, sanitary living conditions",
        "Right to privacy - Landlord needs notice before entering",
        "Right to repairs - Landlord must maintain property",
        "Right to refund deposit - Timeline varies by state",
        "Protection from retaliation - Can't punish requests for repairs",
        "Fair housing rights - No discrimination based on protected class"
    ],

    costBreakdown: {
        upfront: [
            { item: "Security Deposit", range: "1-2 months rent" },
            { item: "First Month Rent", range: "Full monthly amount" },
            { item: "Pet Deposit", range: "KES 25,000-65,000 (if applicable)" },
            { item: "Application Fee", range: "KES 3,000-10,000" }
        ],
        monthly: [
            { item: "Rent", range: "Market dependent" },
            { item: "Utilities", range: "KES 13,000-39,000" },
            { item: "Internet", range: "KES 5,000-13,000" },
            { item: "Renter's Insurance", range: "KES 1,300-3,200" }
        ]
    }
};

export default function HowItWorks() {
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
    const [progress, setProgress] = useState(0);
    const [selectedStep, setSelectedStep] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: string}>>([]);
    const [shareType, setShareType] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState("all");

    const isInitialMount = useRef(true);

    const toggleCheck = (index: number) => {
        setCheckedItems(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const addNotification = (message: string, type: "success" | "info" | "error" = "info") => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    // Load saved data on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("rentalChecklist");
            const savedProgress = localStorage.getItem("rentalProgress");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    setCheckedItems(parsed);
                }
            }
            if (savedProgress) {
                const parsedProgress = parseInt(savedProgress, 10);
                if (!isNaN(parsedProgress)) {
                    setProgress(parsedProgress);
                }
            }
        } catch (e) {
            console.error("Failed to load saved checklist", e);
            // Clear corrupted data
            localStorage.removeItem("rentalChecklist");
            localStorage.removeItem("rentalProgress");
        }
    }, []);

    // Save to localStorage when checkedItems changes (skip initial mount)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        try {
            const total = 5;
            const checkedCount = Object.values(checkedItems).filter(Boolean).length;
            const newProgress = Math.round((checkedCount / total) * 100);
            setProgress(newProgress);
            
            localStorage.setItem("rentalChecklist", JSON.stringify(checkedItems));
            localStorage.setItem("rentalProgress", String(newProgress));
        } catch (e) {
            console.error("Failed to save checklist", e);
        }
    }, [checkedItems]);

    const handleDownloadPDF = () => {
        setDownloadingPDF(true);
        try {
            const pdf = new jsPDF();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yPosition = 10;

            pdf.setFontSize(20);
            pdf.text(rentalGuideData.title, 10, yPosition);
            yPosition += 10;

            pdf.setFontSize(11);
            pdf.text(rentalGuideData.description, 10, yPosition);
            yPosition += 15;

            pdf.setFontSize(14);
            pdf.text("Before You Start Renting:", 10, yPosition);
            yPosition += 8;

            rentalGuideData.beforeRenting.forEach(item => {
                if (yPosition > pageHeight - 20) {
                    pdf.addPage();
                    yPosition = 10;
                }
                pdf.setFontSize(11);
                pdf.text(`• ${item.title}`, 15, yPosition);
                yPosition += 5;
                pdf.setFontSize(9);
                pdf.text(item.description, 15, yPosition, { maxWidth: 180 });
                yPosition += 8;
            });

            yPosition += 5;

            if (yPosition > pageHeight - 40) {
                pdf.addPage();
                yPosition = 10;
            }
            pdf.setFontSize(14);
            pdf.text("Where to Search:", 10, yPosition);
            yPosition += 8;
            pdf.setFontSize(10);
            pdf.text(rentalGuideData.searchTips.platforms.join(", "), 15, yPosition, { maxWidth: 180 });
            yPosition += 15;

            pdf.setFontSize(14);
            pdf.text("Red Flags to Avoid:", 10, yPosition);
            yPosition += 8;
            rentalGuideData.searchTips.redFlags.forEach(flag => {
                if (yPosition > pageHeight - 20) {
                    pdf.addPage();
                    yPosition = 10;
                }
                pdf.setFontSize(9);
                pdf.text(`⚠ ${flag}`, 15, yPosition, { maxWidth: 180 });
                yPosition += 6;
            });

            if (yPosition > pageHeight - 40) {
                pdf.addPage();
                yPosition = 10;
            }
            pdf.setFontSize(14);
            pdf.text("Essential Lease Terms:", 10, yPosition);
            yPosition += 8;
            rentalGuideData.leaseExecution.essentialTerms.forEach(item => {
                if (yPosition > pageHeight - 20) {
                    pdf.addPage();
                    yPosition = 10;
                }
                pdf.setFontSize(10);
                pdf.text(`• ${item.term}`, 15, yPosition);
                yPosition += 5;
                pdf.setFontSize(9);
                pdf.text(item.explanation, 15, yPosition, { maxWidth: 175 });
                yPosition += 8;
            });

            if (yPosition > pageHeight - 40) {
                pdf.addPage();
                yPosition = 10;
            }
            pdf.setFontSize(14);
            pdf.text("Know Your Rental Rights:", 10, yPosition);
            yPosition += 8;
            rentalGuideData.rentalRights.forEach(right => {
                if (yPosition > pageHeight - 20) {
                    pdf.addPage();
                    yPosition = 10;
                }
                pdf.setFontSize(9);
                pdf.text(`✓ ${right}`, 15, yPosition, { maxWidth: 180 });
                yPosition += 6;
            });

            pdf.save("DIY_Rental_Guide_2026.pdf");
            addNotification("PDF downloaded successfully!", "success");
        } catch (error) {
            addNotification("Failed to generate PDF", "error");
            console.error("PDF generation error:", error);
        } finally {
            setDownloadingPDF(false);
        }
    };

    const handleShare = (platform: string) => {
        const text = "Check out this comprehensive DIY Rental Guide 2026! Learn everything about finding, verifying, and securing your perfect rental.";
        const url = window.location.href;
        let shareUrl = "";
        switch(platform) {
            case "email": shareUrl = `mailto:?subject=DIY Rental Guide 2026&body=${encodeURIComponent(text + "\n\n" + url)}`; break;
            case "twitter": shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`; break;
            case "facebook": shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`; break;
            case "linkedin": shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`; break;
        }
        if (shareUrl) {
            if (platform === "email") window.location.href = shareUrl;
            else window.open(shareUrl, "_blank", "width=600,height=400");
            addNotification(`Shared on ${platform}!`, "success");
        }
    };

    const checklistData = [
        "Credit score checked",
        "Financial documents prepared",
        "References collected",
        "Search platforms reviewed",
        "Property viewing checklist ready"
    ];

    const steps = [
        { 
            id: "01", title: "Discovery & Search", meta: "Find Your Perfect Rental", time: "1-2 weeks", 
            status: "Start Here", state: "done", icon: MapPin, img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop&q=100", description: "Browse rental platforms and filter by your needs"
        },
        { 
            id: "02", title: "Verification Tour", meta: "Inspect & Document", time: "2-5 days", 
            status: "Next", state: "active", icon: ShieldCheck, img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop&q=100", description: "Visit property and verify landlord credentials"
        },
        { 
            id: "03", title: "Lease Execution", meta: "Review & Sign Agreement", time: "1-3 days", 
            status: "Prepare", state: "upcoming", icon: FileText, img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop&q=100", description: "Review lease terms and understand your rights"
        },
        { 
            id: "04", title: "Move-In Logistics", meta: "Complete Handover", time: "Moving Day + 30 days", 
            status: "Final Step", state: "upcoming", icon: Truck, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&q=100", description: "Handle moving and setup utilities"
        }
    ];

    return (
        <>
            <GlobalStyles />
            <div className="min-h-screen bg-slate-50 font-inter text-slate-800 pb-32" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                {/* Fixed navbar offset - prevents content cutoff */}
                <div className="pt-8 md:pt-10 lg:pt-12"></div>

                <div className="max-w-[1400px] mx-auto px-4 py-12 sm:py-16 md:py-20">
                {/* NOTIFICATION TOASTS */}
                <div className="fixed top-24 right-4 z-50 space-y-2 pointer-events-none">
                    <AnimatePresence>
                    {notifications.map(notif => (
                        <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={cn(
                                "px-4 py-3 rounded-lg text-white font-medium text-sm flex items-center gap-2 shadow-lg pointer-events-auto",
                                notif.type === "success" ? "bg-green-600" : notif.type === "error" ? "bg-red-600" : "bg-blue-600"
                            )}
                        >
                            {notif.type === "success" && <CheckCircle2 size={16} />}
                            {notif.message}
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>

                    {/* PAGE HEADER */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 pb-6 border-b border-slate-200/60"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-px w-8 bg-[#F96302]"></div>
                            <span className="text-[10px] font-semibold text-[#F96302] uppercase tracking-widest">DIY Rental Guide</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#154279] leading-tight tracking-tight">
                            Complete Rental Guide 2026
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm font-normal">
                            Master the entire rental process step-by-step with our comprehensive guide
                        </p>
                    </motion.div>

                    {/* FILTER/TAB BAR */}
                    <div className="sticky top-20 z-30 mb-8 bg-slate-50/95 backdrop-blur-sm py-3 px-1">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {[
                                { id: "all", label: "All Sections", icon: "⭐" },
                                { id: "preparation", label: "Preparation", icon: "📋" },
                                { id: "search", label: "Search", icon: "🔍" },
                                { id: "verification", label: "Verification", icon: "✓" },
                                { id: "lease", label: "Lease", icon: "📝" },
                                { id: "costs", label: "Costs", icon: "💰" },
                                { id: "rights", label: "Rights", icon: "🛡️" }
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setSelectedFilter(filter.id)}
                                    className={cn(
                                        "px-4 py-2 font-medium text-xs rounded-full whitespace-nowrap",
                                        selectedFilter === filter.id 
                                            ? 'bg-[#154279] text-white' 
                                            : 'bg-white text-slate-600 border border-slate-200'
                                    )}
                                >
                                    <span className="mr-1.5">{filter.icon}</span>{filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                    
                        {/* SECTION 1: CHECKLIST & ACTION BUTTONS */}
                        {(selectedFilter === "all" || selectedFilter === "preparation") && (
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="relative rounded-xl overflow-hidden bg-white border border-slate-200/60"
                        >
                            <div className="p-6 bg-[#154279] text-white">
                                <div className="flex items-center gap-2">
                                    <Zap size={20} className="text-[#F96302]" />
                                    <h2 className="text-lg font-semibold tracking-tight">
                                        Pre-Renting Checklist
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-300 mt-1 font-normal">Complete these tasks to prepare for your rental journey</p>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                                    {checklistData.map((item, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => toggleCheck(i)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer",
                                                checkedItems[i] 
                                                    ? 'bg-[#154279]/5 border border-[#154279]/20' 
                                                    : 'bg-slate-50 border border-slate-100'
                                            )}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0",
                                                checkedItems[i] ? 'bg-[#154279]' : 'border border-slate-300 bg-white'
                                            )}>
                                                {checkedItems[i] && <CheckCircle2 size={12} className="text-white" />}
                                            </div>
                                            <span className={cn("text-sm font-medium", checkedItems[i] ? 'text-[#154279]' : 'text-slate-700')}>
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button 
                                        onClick={handleDownloadPDF}
                                        disabled={downloadingPDF}
                                        className="gap-2 bg-[#154279] text-white h-10 px-5 w-full sm:w-auto text-sm font-medium rounded-lg flex items-center justify-center"
                                    >
                                        <Download size={16} /> 
                                        {downloadingPDF ? "Generating..." : "Download PDF"}
                                    </button>

                                    <div className="relative w-full sm:w-auto">
                                        <button 
                                            onClick={() => setShareType(shareType ? null : "menu")}
                                            className="gap-2 bg-[#F96302] text-white h-10 px-5 w-full sm:w-auto text-sm font-medium rounded-lg flex items-center justify-center"
                                        >
                                            <Share2 size={16} /> Share
                                        </button>

                                    <AnimatePresence>
                                        {shareType === "menu" && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-12 left-0 w-44 bg-white rounded-lg border border-slate-200 shadow-lg p-1 z-[60]"
                                            >
                                                {[
                                                    { id: "email", label: "Email", icon: Mail },
                                                    { id: "twitter", label: "Twitter", icon: Twitter },
                                                    { id: "facebook", label: "Facebook", icon: Facebook },
                                                    { id: "linkedin", label: "LinkedIn", icon: Linkedin }
                                                ].map(platform => (
                                                    <button 
                                                        key={platform.id}
                                                        onClick={() => { handleShare(platform.id); setShareType(null); }} 
                                                        className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 rounded-md flex items-center gap-3"
                                                    >
                                                        <platform.icon size={14} /> {platform.label}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        )}

                        {/* SECTION 2: RENTAL JOURNEY STEPS */}
                        {(selectedFilter === "all" || selectedFilter === "search") && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-px w-8 bg-[#F96302]"></div>
                                <h3 className="text-lg font-semibold text-[#154279]">Rental Journey</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {steps.map((step, idx) => {
                                const isActive = step.state === "active";
                                const isDone = step.state === "done";
                                const isUpcoming = step.state === "upcoming";
                                
                                return (
                                    <div 
                                        key={step.id}
                                        onClick={() => (setSelectedStep(idx), setShowModal(true))}
                                        className={cn(
                                            "relative flex flex-col rounded-xl overflow-hidden bg-white shadow-sm cursor-pointer",
                                            isActive 
                                                ? 'ring-2 ring-[#F96302] shadow-md' 
                                                : 'border border-slate-200'
                                        )}
                                    >
                                        {/* Thumbnail */}
                                        <div className="h-40 overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#154279]/80 via-[#154279]/20 to-transparent z-10" />
                                            <img 
                                                src={step.img} 
                                                alt={step.title} 
                                                className="w-full h-full object-cover" 
                                            />
                                            <div className="absolute top-3 left-3 bg-white text-[#154279] text-xs font-bold px-3 py-1.5 rounded-full z-20 shadow-sm">
                                                Step {step.id}
                                            </div>
                                            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
                                                <div className="w-8 h-8 bg-[#F96302] rounded-full flex items-center justify-center">
                                                    <step.icon size={16} className="text-white" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 flex flex-col flex-1 bg-white">
                                            <h4 className="text-base font-bold text-[#154279] mb-2">
                                                {step.title}
                                            </h4>
                                            
                                            <p className="text-sm text-slate-600 mb-4 leading-relaxed">{step.description}</p>

                                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 bg-slate-50 rounded-lg px-3 py-2">
                                                <Clock size={14} className="text-[#F96302]" /> 
                                                <span className="font-medium">{step.time}</span>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                                                <span className={cn(
                                                    "text-xs font-bold px-3 py-1.5 rounded-full",
                                                    isDone ? 'bg-green-100 text-green-700' 
                                                        : isActive ? 'bg-[#F96302]/10 text-[#F96302]'
                                                        : 'bg-[#154279]/10 text-[#154279]'
                                                )}>
                                                    {step.status}
                                                </span>
                                                <div className="w-8 h-8 bg-[#154279] rounded-full flex items-center justify-center">
                                                    <ChevronRight size={16} className="text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    )}

                        {/* SECTION 3: BEFORE YOU START */}
                        {(selectedFilter === "all" || selectedFilter === "preparation") && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-px w-8 bg-[#F96302]"></div>
                                <h3 className="text-lg font-semibold text-[#154279]">Before You Start</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {rentalGuideData.beforeRenting.map((item, i) => (
                                    <div
                                        key={i}
                                        className="p-5 bg-white rounded-xl border border-slate-200/60"
                                    >
                                        <p className="text-sm font-semibold text-[#154279] mb-2">{item.title}</p>
                                        <p className="text-sm text-slate-500 mb-4 leading-relaxed font-normal">{item.description}</p>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(item.action);
                                                addNotification("Copied to clipboard!", "success");
                                            }}
                                            className="text-xs text-[#F96302] font-medium flex items-center gap-1.5 bg-[#F96302]/5 rounded-lg px-3 py-2 w-full justify-center"
                                        >
                                            <Copy size={12} /> {item.action}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        )}

                    {/* SECTION 4: COST BREAKDOWN */}
                    {(selectedFilter === "all" || selectedFilter === "costs") && (
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="rounded-xl overflow-hidden bg-white border border-slate-200/60"
                    >
                        <div className="p-6 bg-[#154279] text-white">
                            <div className="flex items-center gap-2">
                                <DollarSign size={20} className="text-[#F96302]" />
                                <h2 className="text-lg font-semibold">
                                    Cost Breakdown
                                </h2>
                            </div>
                            <p className="text-xs text-slate-300 mt-1 font-normal">Understand all the costs involved in your rental</p>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Upfront Costs</p>
                                    <div className="space-y-2">
                                        {rentalGuideData.costBreakdown.upfront.map((cost, i) => (
                                            <div 
                                                key={i}
                                                className="flex justify-between items-center bg-slate-50 rounded-lg p-3"
                                            >
                                                <span className="font-medium text-slate-700 text-sm">{cost.item}</span>
                                                <span className="text-[#F96302] font-semibold text-sm">{cost.range}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Monthly Costs</p>
                                    <div className="space-y-2">
                                        {rentalGuideData.costBreakdown.monthly.map((cost, i) => (
                                            <div 
                                                key={i}
                                                className="flex justify-between items-center bg-slate-50 rounded-lg p-3"
                                            >
                                                <span className="font-medium text-slate-700 text-sm">{cost.item}</span>
                                                <span className="text-[#F96302] font-semibold text-sm">{cost.range}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    )}

                    {/* SECTION 5: KNOW YOUR RIGHTS */}
                    {(selectedFilter === "all" || selectedFilter === "rights") && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-px w-8 bg-[#F96302]"></div>
                            <h3 className="text-lg font-semibold text-[#154279]">Know Your Rights</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {rentalGuideData.rentalRights.map((right, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 text-sm text-slate-700 bg-white rounded-xl p-4 border border-slate-200/60"
                                >
                                    <div className="mt-0.5 bg-green-50 p-1 rounded-md">
                                        <CheckCircle2 size={12} className="text-green-500" />
                                    </div>
                                    <span className="font-medium leading-relaxed">{right}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* DISCLAIMER */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex items-start gap-3 p-5 bg-blue-50/50 rounded-xl border border-blue-100 text-slate-600"
                    >
                        <AlertCircle size={18} className="shrink-0 mt-0.5 text-blue-500" />
                        <p className="text-sm leading-relaxed font-normal">
                            <span className="text-blue-600 font-semibold">Disclaimer: </span>
                            This guide provides general information for educational purposes only. Local laws vary significantly by region. Always consult with a local housing authority or qualified attorney for specific legal advice.
                        </p>
                    </motion.div>
                    </div>

                </div>
            </div>

            {/* STEP DETAIL MODAL */}
            <AnimatePresence>
                {showModal && selectedStep !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="bg-[#154279] text-white px-6 py-5 flex justify-between items-start sticky top-0 z-50 rounded-t-2xl">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-[#F96302] text-white text-[10px] font-medium px-2 py-0.5 rounded-full">Step {steps[selectedStep].id}</span>
                                    </div>
                                    <h2 className="text-xl font-semibold">{steps[selectedStep].title}</h2>
                                    <p className="text-sm text-slate-300 mt-1 font-normal">{steps[selectedStep].description}</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1.5 rounded-full text-white/80"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-6 overflow-y-auto">
                                {selectedStep === 0 && (
                                    <div className="space-y-5">
                                        <div>
                                            <h3 className="font-semibold text-[#154279] mb-3 flex items-center gap-2 text-base">
                                                <MapPin size={18} className="text-[#F96302]" /> Where to Search
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {rentalGuideData.searchTips.platforms.map((platform, i) => (
                                                    <div key={i} className="bg-slate-50 p-3 rounded-lg cursor-pointer" onClick={() => {
                                                        const url = `https://www.${platform.toLowerCase().replace(/\s+/g, '')}.com`;
                                                        window.open(url, '_blank');
                                                        addNotification(`Opening ${platform}...`, "info");
                                                    }}>
                                                        <p className="font-medium text-sm text-slate-700">
                                                            {platform}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="bg-red-50/50 p-4 rounded-xl">
                                                <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2 text-sm">
                                                    <AlertCircle size={16} /> Red Flags
                                                </h3>
                                                <ul className="space-y-1.5">
                                                    {rentalGuideData.searchTips.redFlags.map((flag, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                                                            {flag}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-green-50/50 p-4 rounded-xl">
                                                <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2 text-sm">
                                                    <CheckCircle size={16} /> What to Look For
                                                </h3>
                                                <ul className="space-y-1.5">
                                                    {rentalGuideData.searchTips.whatToLook.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-green-500 shrink-0" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedStep === 1 && (
                                    <div className="space-y-4">
                                        {rentalGuideData.verificationProcess.map((process, i) => (
                                            <div key={i} className="bg-slate-50 rounded-xl p-4">
                                                <h4 className="font-semibold text-[#154279] mb-2 flex items-center gap-2 text-base">
                                                    <ShieldCheck size={16} className="text-[#F96302]" /> 
                                                    {process.step}
                                                </h4>
                                                <p className="text-sm text-slate-600 mb-3 pl-6">{process.details}</p>
                                                <div className="pl-6">
                                                    <div className="space-y-2 bg-white rounded-lg p-3">
                                                        {process.checklist.map((item, j) => (
                                                            <label key={j} className="flex items-center gap-2 cursor-pointer">
                                                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#F96302] focus:ring-[#F96302] cursor-pointer accent-[#F96302]" />
                                                                <span className="text-sm text-slate-600">{item}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedStep === 2 && (
                                    <div className="space-y-5">
                                        <div>
                                            <h3 className="font-semibold text-[#154279] mb-3 flex items-center gap-2 text-base">
                                                <FileCheck size={18} className="text-[#F96302]" /> Essential Lease Terms
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {rentalGuideData.leaseExecution.essentialTerms.map((term, i) => (
                                                    <div key={i} className="bg-slate-50 p-3 rounded-lg">
                                                        <p className="font-medium text-[#154279] text-sm mb-1">{term.term}</p>
                                                        <p className="text-xs text-slate-500 leading-relaxed">{term.explanation}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-red-50/50 p-4 rounded-xl">
                                            <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2 text-sm">
                                                <AlertCircle size={16} /> Never Agree To
                                            </h3>
                                            <div className="space-y-2">
                                                {rentalGuideData.leaseExecution.neverAgreeVue.map((item, i) => (
                                                    <div key={i} className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                                                        <X size={14} className="text-red-500 flex-shrink-0" />
                                                        <p className="text-sm text-red-800">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedStep === 3 && (
                                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 py-2">
                                        {rentalGuideData.moveInLogistics.map((phase, i) => (
                                            <div key={i} className="relative pl-6">
                                                <span className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-[#F96302] ring-4 ring-white" />
                                                <h4 className="font-semibold text-[#154279] mb-2 text-base">{phase.phase}</h4>
                                                <ul className="space-y-1.5">
                                                    {phase.tasks.map((task, j) => (
                                                        <li key={j} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                                                            <div className="w-1 h-1 rounded-full bg-slate-400" />
                                                            {task}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
