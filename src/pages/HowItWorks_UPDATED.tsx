import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CheckCircle2, 
    Truck, 
    Download, 
    Share2, 
    ArrowRight, 
    ShieldCheck, 
    Clock, 
    AlertCircle, 
    ChevronRight, 
    Lock, 
    MapPin, 
    FileText, 
    X, 
    ExternalLink, 
    Copy, 
    CheckCircle, 
    Info, 
    Zap, 
    DollarSign, 
    Briefcase, 
    Mail, 
    Facebook, 
    Linkedin, 
    Twitter, 
    FileCheck 
} from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// --- GLOBAL STYLES FOR CLEAN FONT RENDERING ---
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        .font-nunito { 
            font-family: 'Nunito', sans-serif; 
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
    `}</style>
);

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
            { item: "Pet Deposit", range: "$200-$500 (if applicable)" },
            { item: "Application Fee", range: "$25-$75" }
        ],
        monthly: [
            { item: "Rent", range: "Market dependent" },
            { item: "Utilities", range: "$100-$300" },
            { item: "Internet", range: "$40-$100" },
            { item: "Renter's Insurance", range: "$10-$25" }
        ]
    }
};

export default function HowItWorks() {
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({ 0: true });
    const [progress, setProgress] = useState(20);
    const [selectedStep, setSelectedStep] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: string}>>([]);
    const [shareType, setShareType] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState("all");

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

    useEffect(() => {
        const total = 5;
        const checkedCount = Object.values(checkedItems).filter(Boolean).length;
        setProgress(Math.round((checkedCount / total) * 100));
        
        localStorage.setItem("rentalChecklist", JSON.stringify(checkedItems));
        localStorage.setItem("rentalProgress", String(Math.round((checkedCount / total) * 100)));
    }, [checkedItems]);

    useEffect(() => {
        const saved = localStorage.getItem("rentalChecklist");
        const savedProgress = localStorage.getItem("rentalProgress");
        if (saved) setCheckedItems(JSON.parse(saved));
        if (savedProgress) setProgress(parseInt(savedProgress));
    }, []);

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
            status: "Prepare", state: "locked", icon: FileText, img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop&q=100", description: "Review lease terms and understand your rights"
        },
        { 
            id: "04", title: "Move-In Logistics", meta: "Complete Handover", time: "Moving Day + 30 days", 
            status: "Final", state: "locked", icon: Truck, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&q=100", description: "Handle moving and setup utilities"
        }
    ];

    return (
        <div className="font-nunito w-full bg-gray-50 min-h-screen pt-24 pb-12">
            <GlobalStyles />
            <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
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
                <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-semibold tracking-[0.2em] text-cta uppercase bg-cta/10 px-3 py-1 rounded-full border border-cta/20">
                                    Step-by-Step Guide
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-navy tracking-tight">Complete DIY Rental Guide</h1>
                            <p className="text-muted-foreground mt-2 max-w-2xl font-light">Master the rental process with our comprehensive guide. From checking your credit to signing the lease clearly explained.</p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full max-w-xs p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex justify-between text-xs font-semibold text-navy uppercase mb-2">
                                <span>Preparation Score</span>
                                <span className="text-cta">{progress}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="h-full bg-cta" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTER/TAB BAR */}
                <div className="sticky top-20 z-30 mb-8 bg-gray-50/95 backdrop-blur-sm py-2">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                                    "px-4 py-2 rounded-lg font-medium text-xs uppercase tracking-wide whitespace-nowrap transition-all border shadow-sm",
                                    selectedFilter === filter.id 
                                        ? 'bg-navy text-white border-navy ring-2 ring-navy/20' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-cta hover:text-cta'
                                )}
                            >
                                <span className="mr-2">{filter.icon}</span>{filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    
                    {/* SECTION 1: CHECKLIST & ACTION BUTTONS */}
                    {(selectedFilter === "all" || selectedFilter === "preparation") && (
                    <Card className="border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                <Zap className="text-cta" size={24} /> Pre-Renting Checklist
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {checklistData.map((item, i) => (
                                    <motion.div 
                                        key={i} 
                                        whileHover={{ scale: 1.01 }}
                                        onClick={() => toggleCheck(i)}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 shadow-sm",
                                            checkedItems[i] 
                                                ? 'bg-blue-50/50 border-navy/20 ring-1 ring-navy/10' 
                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                                            checkedItems[i] ? 'bg-navy border-navy' : 'border-gray-300'
                                        )}>
                                            {checkedItems[i] && <CheckCircle2 size={14} className="text-white" />}
                                        </div>
                                        <span className={cn("text-sm font-medium", checkedItems[i] ? 'text-navy' : 'text-gray-600')}>
                                            {item}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button 
                                    onClick={handleDownloadPDF}
                                    disabled={downloadingPDF}
                                    className="gap-2 bg-navy hover:bg-navy/90 h-10 px-6 w-full sm:w-auto text-[11px] font-semibold"
                                >
                                    <Download size={16} /> 
                                    {downloadingPDF ? "Generating PDF..." : "Download Guide PDF"}
                                </Button>

                                <div className="relative w-full sm:w-auto">
                                    <Button 
                                        onClick={() => setShareType(shareType ? null : "menu")}
                                        className="gap-2 bg-cta hover:bg-cta/90 h-10 px-6 w-full sm:w-auto text-[11px] font-semibold"
                                    >
                                        <Share2 size={16} /> Share Guide
                                    </Button>

                                    <AnimatePresence>
                                        {shareType === "menu" && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-12 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl p-1 z-[60]"
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
                                                        className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-3"
                                                    >
                                                        <platform.icon size={14} /> {platform.label}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    )}

                    {/* SECTION 2: RENTAL JOURNEY STEPS */}
                    {(selectedFilter === "all" || selectedFilter === "search") && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="bg-cta/10 p-2 rounded-lg"><Truck className="text-cta" size={20} /></div>
                             <h3 className="text-xl font-bold text-navy">Rental Journey</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {steps.map((step, idx) => {
                                const isActive = step.state === "active";
                                const isLocked = step.state === "locked";
                                
                                return (
                                    <motion.div 
                                        key={step.id}
                                        whileHover={{ y: !isLocked ? -5 : 0 }}
                                        onClick={() => !isLocked && (setSelectedStep(idx), setShowModal(true))}
                                        className={cn(
                                            "group relative flex flex-col rounded-xl border transition-all duration-300 overflow-hidden",
                                            isActive 
                                                ? 'bg-white border-cta ring-1 ring-cta shadow-lg' 
                                                : isLocked
                                                    ? 'bg-gray-50 border-gray-200 opacity-80' 
                                                    : 'bg-white border-gray-200 hover:border-navy hover:shadow-md cursor-pointer'
                                        )}
                                    >
                                        {/* Thumbnail */}
                                        <div className="h-40 overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                            <img 
                                                src={step.img} 
                                                alt={step.title} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                            />
                                            <div className="absolute top-3 left-3 bg-navy/90 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-md z-20 border border-white/10">
                                                STEP {step.id}
                                            </div>
                                            <div className="absolute bottom-3 left-3 z-20 text-white">
                                                <step.icon size={20} className="mb-1 text-cta" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 flex flex-col flex-1">
                                            <h4 className="text-base font-semibold text-navy mb-1 group-hover:text-cta transition-colors">
                                                {step.title}
                                            </h4>
                                            
                                            <p className="text-xs text-muted-foreground mb-4 line-clamp-2 font-light">{step.description}</p>

                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
                                                <Clock size={12} className="text-cta" /> {step.time}
                                            </div>

                                            <div className="mt-auto flex items-center justify-between">
                                                {isLocked ? (
                                                    <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                                                        <Lock size={12} /> Locked
                                                    </span>
                                                ) : (
                                                    <span className={cn(
                                                        "text-[10px] font-bold uppercase px-2 py-1 rounded-md border",
                                                        step.state === 'done' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                                                    )}>
                                                        {step.status}
                                                    </span>
                                                )}
                                                {!isLocked && (
                                                    <div className="w-6 h-6 rounded-full bg-navy/5 flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-all">
                                                        <ChevronRight size={14} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                    )}

                    {/* SECTION 3: BEFORE YOU START */}
                    {(selectedFilter === "all" || selectedFilter === "preparation") && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="bg-cta/10 p-2 rounded-lg"><Info className="text-cta" size={20} /></div>
                             <h3 className="text-xl font-bold text-navy">Before You Start</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {rentalGuideData.beforeRenting.map((item, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -3 }}
                                    className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-cta/30 transition-all"
                                >
                                    <p className="text-base font-semibold text-navy mb-2">{item.title}</p>
                                    <p className="text-sm text-gray-600 mb-4 leading-relaxed font-light">{item.description}</p>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(item.action);
                                            addNotification("Copied to clipboard!", "success");
                                        }}
                                        className="text-xs text-cta font-semibold hover:text-navy flex items-center gap-1.5 transition-colors bg-cta/5 px-3 py-2 rounded-md w-full justify-center"
                                    >
                                        <Copy size={12} /> {item.action}
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* SECTION 4: COST BREAKDOWN */}
                    {(selectedFilter === "all" || selectedFilter === "costs") && (
                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50 border-b border-gray-100">
                             <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                <DollarSign className="text-cta" size={20} /> Cost Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Upfront Costs</p>
                                    <div className="space-y-3">
                                        {rentalGuideData.costBreakdown.upfront.map((cost, i) => (
                                            <div key={i} className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-cta/30 transition-all">
                                                <span className="font-medium text-navy text-sm">{cost.item}</span>
                                                <span className="text-cta font-semibold">{cost.range}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Monthly Costs</p>
                                    <div className="space-y-3">
                                        {rentalGuideData.costBreakdown.monthly.map((cost, i) => (
                                            <div key={i} className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:border-cta/30 transition-all">
                                                <span className="font-medium text-navy text-sm">{cost.item}</span>
                                                <span className="text-cta font-semibold">{cost.range}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    )}

                    {/* SECTION 5: KNOW YOUR RIGHTS */}
                    {(selectedFilter === "all" || selectedFilter === "rights") && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="bg-cta/10 p-2 rounded-lg"><ShieldCheck className="text-cta" size={20} /></div>
                             <h3 className="text-xl font-bold text-navy">Know Your Rights</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {rentalGuideData.rentalRights.map((right, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.02 }}
                                    className="flex items-start gap-3 text-sm text-navy bg-white p-4 border border-gray-200 rounded-xl shadow-sm hover:border-navy transition-all"
                                >
                                    <div className="mt-0.5 bg-green-100 rounded-full p-1">
                                        <CheckCircle2 size={14} className="text-green-600" />
                                    </div>
                                    <span className="font-medium leading-relaxed">{right}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* DISCLAIMER */}
                    <div className="flex items-start gap-4 p-6 bg-blue-50/50 rounded-xl border border-blue-100 text-navy">
                        <AlertCircle size={20} className="shrink-0 mt-0.5 text-cta" />
                        <p className="text-xs leading-relaxed font-light">
                            <span className="text-cta font-semibold block mb-1">Disclaimer:</span> This guide provides general information for educational purposes only. Local laws vary significantly by region. Always consult with a local housing authority or qualified attorney for specific legal advice regarding your situation.
                        </p>
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
                        className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
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
                            <div className="bg-navy text-white px-8 py-6 flex justify-between items-start sticky top-0 z-50 border-b border-white/10">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-cta text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">Step {steps[selectedStep].id}</span>
                                    </div>
                                    <h2 className="text-2xl font-bold">{steps[selectedStep].title}</h2>
                                    <p className="text-sm text-gray-300 mt-1 font-light opacity-90">{steps[selectedStep].description}</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-all text-white/70 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8 space-y-8 overflow-y-auto">
                                {selectedStep === 0 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold text-navy mb-4 flex items-center gap-2 text-lg">
                                                <MapPin size={20} className="text-cta" /> Where to Search
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {rentalGuideData.searchTips.platforms.map((platform, i) => (
                                                    <div key={i} className="group bg-gray-50 p-4 rounded-xl border border-gray-100 cursor-pointer hover:border-cta hover:bg-white hover:shadow-md transition-all" onClick={() => {
                                                        const url = `https://www.${platform.toLowerCase().replace(/\s+/g, '')}.com`;
                                                        window.open(url, '_blank');
                                                        addNotification(`Opening ${platform}...`, "info");
                                                    }}>
                                                        <p className="font-medium text-sm text-navy flex items-center justify-between">
                                                            {platform}
                                                            <ExternalLink size={14} className="text-gray-400 group-hover:text-cta" />
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                                                <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                                                    <AlertCircle size={18} /> Red Flags
                                                </h3>
                                                <ul className="space-y-2">
                                                    {rentalGuideData.searchTips.redFlags.map((flag, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-red-800 font-light">
                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                                            {flag}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                                                <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                                                    <CheckCircle size={18} /> What to Look For
                                                </h3>
                                                <ul className="space-y-2">
                                                    {rentalGuideData.searchTips.whatToLook.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-green-800 font-light">
                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedStep === 1 && (
                                    <div className="space-y-6">
                                        {rentalGuideData.verificationProcess.map((process, i) => (
                                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                                <h4 className="font-semibold text-navy mb-2 flex items-center gap-2 text-lg">
                                                    <div className="bg-cta/10 p-1.5 rounded-md"><ShieldCheck size={16} className="text-cta" /></div> 
                                                    {process.step}
                                                </h4>
                                                <p className="text-sm text-gray-600 mb-4 pl-9 font-light">{process.details}</p>
                                                <div className="pl-9">
                                                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                                                        {process.checklist.map((item, j) => (
                                                            <label key={j} className="flex items-center gap-3 cursor-pointer group">
                                                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cta focus:ring-cta cursor-pointer accent-cta" />
                                                                <span className="text-sm text-gray-700 group-hover:text-navy transition-colors font-light">{item}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedStep === 2 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold text-navy mb-4 flex items-center gap-2 text-lg">
                                                <FileCheck size={20} className="text-cta" /> Essential Lease Terms
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {rentalGuideData.leaseExecution.essentialTerms.map((term, i) => (
                                                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-cta/50 transition-all shadow-sm">
                                                        <p className="font-semibold text-navy text-sm mb-1">{term.term}</p>
                                                        <p className="text-xs text-muted-foreground leading-relaxed font-light">{term.explanation}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                                            <h3 className="font-semibold text-red-700 mb-4 flex items-center gap-2">
                                                <AlertCircle size={20} /> Never Agree To
                                            </h3>
                                            <div className="grid gap-3">
                                                {rentalGuideData.leaseExecution.neverAgreeVue.map((item, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                                                        <X size={16} className="text-red-500 flex-shrink-0" />
                                                        <p className="text-sm text-red-900 font-medium">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedStep === 3 && (
                                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 py-2">
                                        {rentalGuideData.moveInLogistics.map((phase, i) => (
                                            <div key={i} className="relative pl-8">
                                                <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cta ring-4 ring-white" />
                                                <h4 className="font-semibold text-navy mb-3 text-lg leading-none">{phase.phase}</h4>
                                                <ul className="space-y-2">
                                                    {phase.tasks.map((task, j) => (
                                                        <li key={j} className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 font-light">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
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
        </div>
    );
}
