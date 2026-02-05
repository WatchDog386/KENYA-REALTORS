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
import autoTable from "jspdf-autotable";
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
            const doc = new jsPDF();
            const primaryColor = "#154279";
            const secondaryColor = "#F96302";
            const fontName = "helvetica";
            
            // Shared Styles for Consistency
            const tableStyles = {
                font: fontName,
                fontSize: 10,
                cellPadding: 6,
                overflow: 'linebreak' as const,
                lineColor: [220, 220, 220] as [number, number, number],
                lineWidth: 0.1,
            };

            const headerStyles = {
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold' as const,
                font: fontName,
                halign: 'left' as const
            };

            // --- HEADER ---
            doc.setFillColor(primaryColor);
            doc.rect(0, 0, 210, 40, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont(fontName, "bold");
            doc.text("DIY RENTAL GUIDE", 14, 20);

            doc.setFontSize(10);
            doc.setFont(fontName, "normal");
            doc.text("2026 EDITION", 14, 28);

            doc.text("Realtors & Leasers", 195, 20, { align: "right" });
            doc.setFontSize(8);
            doc.text("realtorsandleasers.com", 195, 25, { align: "right" });

            // Initial Y position after header
            let finalY = 50;

            // Description
            doc.setTextColor(60, 60, 60);
            doc.setFontSize(12);
            doc.setFont(fontName, "normal");
            const descLines = doc.splitTextToSize(rentalGuideData.description, 180);
            doc.text(descLines, 14, finalY);
            finalY += (descLines.length * 7) + 10;

            // --- 1. BEFORE STARTING ---
            doc.setFontSize(14);
            doc.setTextColor(secondaryColor);
            doc.setFont(fontName, "bold");
            doc.text("1. Before You Start Renting", 14, finalY);
            finalY += 6;

            const beforeData = rentalGuideData.beforeRenting.map(item => [item.title, item.description, item.action]);
            
            autoTable(doc, {
                startY: finalY,
                head: [['Step', 'Description', 'Action Item']],
                body: beforeData,
                headStyles: headerStyles,
                styles: tableStyles,
                columnStyles: { 
                    0: { fontStyle: 'bold', cellWidth: 40 }, 
                    2: { textColor: secondaryColor, fontStyle: 'bold', cellWidth: 40 } 
                },
                theme: 'grid',
                margin: { top: 20 }
            });
            
            finalY = (doc as any).lastAutoTable.finalY + 15;

            // --- 2. VERIFICATION PROCESS ---
            if (finalY > 250) { doc.addPage(); finalY = 20; }
            doc.setFontSize(14);
            doc.setTextColor(secondaryColor);
            doc.text("2. Verification Process", 14, finalY);
            finalY += 6;

            const verifyData = rentalGuideData.verificationProcess.map(item => [
                item.step,
                item.details,
                item.checklist.join("\n• ")
            ]);

             autoTable(doc, {
                startY: finalY,
                head: [['Stage', 'Details', 'Keys Checklist']],
                body: verifyData,
                headStyles: headerStyles,
                styles: tableStyles,
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
                theme: 'grid',
                margin: { top: 20 }
            });

            finalY = (doc as any).lastAutoTable.finalY + 15;

            // --- 3. SEARCH STRATEGY ---
            if (finalY > 250) { doc.addPage(); finalY = 20; }
            doc.setFontSize(14);
            doc.setTextColor(secondaryColor);
            doc.text("3. Search Strategy & Red Flags", 14, finalY);
            finalY += 6;

             autoTable(doc, {
                startY: finalY,
                head: [['Red Flags To Avoid', 'What To Look For']],
                body: rentalGuideData.searchTips.redFlags.map((flag, i) => {
                    const look = rentalGuideData.searchTips.whatToLook[i] || "";
                    return [`⚠ ${flag}`, `✓ ${look}`];
                }),
                headStyles: headerStyles,
                styles: tableStyles,
                columnStyles: { 
                    0: { textColor: [180, 50, 50], fontStyle: 'bold', cellWidth: 90 },
                    1: { textColor: [30, 130, 30], fontStyle: 'normal' }
                },
                theme: 'grid',
                margin: { top: 20 }
            });
            finalY = (doc as any).lastAutoTable.finalY + 15;

            // --- 4. ESSENTIAL LEASE TERMS ---
            if (finalY > 250) { doc.addPage(); finalY = 20; }
            
            doc.setFontSize(14);
            doc.setTextColor(secondaryColor);
            doc.text("4. Essential Lease Terms", 14, finalY);
            finalY += 6;
            
            const leaseData = rentalGuideData.leaseExecution.essentialTerms.map(item => [item.term, item.explanation]);
            
            autoTable(doc, {
                startY: finalY,
                head: [['Term', 'Explanation']],
                body: leaseData,
                headStyles: headerStyles,
                styles: tableStyles,
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50} },
                theme: 'grid', // changed to grid for consistency
                margin: { top: 20 }
            });

             finalY = (doc as any).lastAutoTable.finalY + 10;
             
             // Never Agree To
             if (finalY > 240) { doc.addPage(); finalY = 20; }
             
             doc.setFontSize(12);
             doc.setFont(fontName, "bold");
             doc.setTextColor(180, 50, 50); // Red
             doc.text("⚠ NEVER AGREE TO:", 14, finalY);
             finalY += 6;
             
             doc.setFontSize(10);
             doc.setFont(fontName, "normal");
             doc.setTextColor(60, 60, 60);
             rentalGuideData.leaseExecution.neverAgreeVue.forEach(item => {
                 if (finalY > 280) { doc.addPage(); finalY = 20; }
                 doc.text(`• ${item}`, 20, finalY);
                 finalY += 6;
             });
             
             finalY += 10;

             // --- 5. COST BREAKDOWN ---
             if (finalY > 240) { doc.addPage(); finalY = 20; }
             doc.setFontSize(14);
             doc.setFont(fontName, "bold");
             doc.setTextColor(secondaryColor);
             doc.text("5. Estimated Cost Breakdown", 14, finalY);
             finalY += 6;
             
             const costBody = [
                 ...rentalGuideData.costBreakdown.upfront.map(c => ["Upfront", c.item, c.range]),
                 ...rentalGuideData.costBreakdown.monthly.map(c => ["Monthly", c.item, c.range])
             ];
             
             autoTable(doc, {
                startY: finalY,
                head: [['Category', 'Expense Item', 'Estimated Cost']],
                body: costBody,
                headStyles: headerStyles,
                styles: tableStyles,
                columnStyles: { 0: { fontStyle: 'bold' } },
                theme: 'grid',
                margin: { top: 20 }
             });
             
             finalY = (doc as any).lastAutoTable.finalY + 15;

             // --- 6. TENANT RIGHTS ---
             if (finalY > 220) { doc.addPage(); finalY = 20; }
             
             doc.setFontSize(14);
             doc.setTextColor(secondaryColor);
             doc.text("6. Important Tenant Rights", 14, finalY);
             finalY += 6;
             
             autoTable(doc, {
                startY: finalY,
                body: rentalGuideData.rentalRights.map(r => [`✓ ${r}`]),
                showHead: 'never',
                styles: { 
                    ...tableStyles,
                    cellPadding: 8, // More padding for important rights
                    fillColor: [248, 250, 252] // Light slate bg
                },
                columnStyles: { 0: { fontStyle: 'bold', textColor: primaryColor } },
                 margin: { top: 20 }
             });

            // Footer for all pages
            const pageCount = (doc as any).internal.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFillColor(primaryColor);
                // Footer bar
                doc.rect(0, 285, 210, 12, "F");
                
                doc.setFontSize(8);
                doc.setFont(fontName, "normal");
                doc.setTextColor(255, 255, 255);
                doc.text(`Page ${i} of ${pageCount}`, 195, 292, { align: "right" });
                doc.text("© 2026 Realtors & Leasers | DIY Rental Guide", 14, 292, { align: "left" });
            }

            doc.save("DIY_Rental_Guide_2026.pdf");
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
                            className="relative rounded-lg overflow-hidden bg-white border border-slate-200 shadow-sm"
                        >
                            <div className="p-6 bg-[#154279] text-white">
                                <div className="flex items-center gap-2">
                                    <Zap size={20} className="text-[#F96302]" />
                                    <h2 className="text-lg font-bold tracking-tight font-inter">
                                        Pre-Renting Checklist
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-200 mt-1 font-medium opacity-90">Complete these tasks to prepare for your rental journey</p>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                    {checklistData.map((item, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => toggleCheck(i)}
                                            className={cn(
                                                "flex items-center gap-3 p-4 rounded-md cursor-pointer transition-all duration-200",
                                                checkedItems[i] 
                                                    ? 'bg-[#154279]/5 border border-[#154279] shadow-sm' 
                                                    : 'bg-white border border-slate-200 hover:border-[#F96302]/50 hover:shadow-sm'
                                            )}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors",
                                                checkedItems[i] ? 'bg-[#154279]' : 'border-2 border-slate-300 bg-transparent'
                                            )}>
                                                {checkedItems[i] && <CheckCircle2 size={12} className="text-white" />}
                                            </div>
                                            <span className={cn("text-sm font-semibold", checkedItems[i] ? 'text-[#154279]' : 'text-slate-700')}>
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-100 pt-6">
                                    <button 
                                        onClick={handleDownloadPDF}
                                        disabled={downloadingPDF}
                                        className="gap-2 bg-[#154279] hover:bg-[#10305a] text-white h-11 px-6 w-full sm:w-auto text-sm font-bold rounded-md flex items-center justify-center shadow-sm transition-all active:scale-95"
                                    >
                                        <Download size={18} /> 
                                        {downloadingPDF ? "Generating PDF..." : "Download Official Guide"}
                                    </button>

                                    <div className="relative w-full sm:w-auto">
                                        <button 
                                            onClick={() => setShareType(shareType ? null : "menu")}
                                            className="gap-2 bg-white text-[#F96302] border border-[#F96302] hover:bg-[#F96302]/5 h-11 px-6 w-full sm:w-auto text-sm font-bold rounded-md flex items-center justify-center transition-all"
                                        >
                                            <Share2 size={18} /> Share
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
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-200">
                                <div className="h-4 w-1 bg-[#F96302]"></div>
                                <h3 className="text-xl font-bold text-[#154279]">Rental Journey</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {steps.map((step, idx) => {
                                const isActive = step.state === "active";
                                const isDone = step.state === "done";
                                const isUpcoming = step.state === "upcoming";
                                
                                return (
                                    <div 
                                        key={step.id}
                                        onClick={() => (setSelectedStep(idx), setShowModal(true))}
                                        className={cn(
                                            "relative flex flex-col rounded-lg overflow-hidden bg-white cursor-pointer transition-all duration-300 group",
                                            isActive 
                                                ? 'ring-2 ring-[#F96302] shadow-lg translate-y-[-2px]' 
                                                : 'border border-slate-200 hover:shadow-md hover:border-[#154279]/30'
                                        )}
                                    >
                                        {/* Thumbnail */}
                                        <div className="h-44 overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#154279]/90 via-[#154279]/20 to-transparent z-10" />
                                            <img 
                                                src={step.img} 
                                                alt={step.title} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                            />
                                            <div className="absolute top-3 left-3 bg-white text-[#154279] text-[10px] font-bold px-2.5 py-1 rounded shadow-sm z-20">
                                                STEP {step.id}
                                            </div>
                                            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
                                                <div className="w-9 h-9 bg-[#F96302] rounded flex items-center justify-center shadow-lg">
                                                    <step.icon size={18} className="text-white" />
                                                </div>
                                                <div className="text-white">
                                                    <p className="font-bold text-sm leading-none mb-1">{step.title}</p>
                                                    <p className="text-[10px] opacity-80 uppercase tracking-wide font-medium">{step.time}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 flex flex-col flex-1 bg-white">
                                            <p className="text-xs font-semibold text-[#154279] mb-1.5 uppercase tracking-wide opacity-70">{step.meta}</p>
                                            <p className="text-sm text-slate-600 mb-5 leading-relaxed font-medium">{step.description}</p>

                                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider",
                                                    isDone ? 'bg-green-100 text-green-700' 
                                                        : isActive ? 'bg-[#F96302]/10 text-[#F96302]'
                                                        : 'bg-slate-100 text-slate-500'
                                                )}>
                                                    {step.status}
                                                </span>
                                                <div className={cn(
                                                    "w-7 h-7 rounded flex items-center justify-center transition-colors",
                                                    isActive ? "bg-[#154279] text-white" : "text-slate-400 group-hover:text-[#154279]"
                                                )}>
                                                    <ChevronRight size={16} />
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
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-200">
                                <div className="h-4 w-1 bg-[#F96302]"></div>
                                <h3 className="text-xl font-bold text-[#154279]">Before You Start</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {rentalGuideData.beforeRenting.map((item, i) => (
                                    <div
                                        key={i}
                                        className="p-6 bg-white rounded-lg border border-slate-200 hover:border-[#154279]/30 hover:shadow-md transition-all duration-300"
                                    >
                                        <p className="text-base font-bold text-[#154279] mb-3">{item.title}</p>
                                        <p className="text-sm text-slate-500 mb-5 leading-relaxed font-medium">{item.description}</p>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(item.action);
                                                addNotification("Copied to clipboard!", "success");
                                            }}
                                            className="text-xs text-[#F96302] font-semibold flex items-center gap-2 bg-[#F96302]/5 hover:bg-[#F96302]/10 border border-[#F96302]/20 rounded px-4 py-2.5 w-full justify-center transition-colors"
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
                        className="rounded-lg overflow-hidden bg-white border border-slate-200 shadow-sm"
                    >
                        <div className="p-6 bg-[#154279] text-white flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={20} className="text-[#F96302]" />
                                    <h2 className="text-lg font-bold">
                                        Cost Breakdown
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-200 mt-1 font-medium opacity-90">Understand all the costs involved in your rental</p>
                            </div>
                            <div className="hidden sm:block text-[#F96302] opacity-20">
                                <DollarSign size={48} />
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-[#154279]/10">
                                        <div className="w-1 h-4 bg-[#154279]"></div>
                                        <p className="text-sm font-bold text-[#154279] uppercase tracking-wider">Upfront Costs</p>
                                    </div>
                                    <div className="space-y-0 text-sm">
                                        {rentalGuideData.costBreakdown.upfront.map((cost, i) => (
                                            <div 
                                                key={i}
                                                className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-2 rounded transition-colors"
                                            >
                                                <span className="font-semibold text-slate-600">{cost.item}</span>
                                                <span className="text-[#F96302] font-bold">{cost.range}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-[#F96302]/20">
                                        <div className="w-1 h-4 bg-[#F96302]"></div>
                                        <p className="text-sm font-bold text-[#154279] uppercase tracking-wider">Monthly Costs</p>
                                    </div>
                                    <div className="space-y-0 text-sm">
                                        {rentalGuideData.costBreakdown.monthly.map((cost, i) => (
                                            <div 
                                                key={i}
                                                className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-2 rounded transition-colors"
                                            >
                                                <span className="font-semibold text-slate-600">{cost.item}</span>
                                                <span className="text-[#F96302] font-bold">{cost.range}</span>
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
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-200">
                            <div className="h-4 w-1 bg-[#F96302]"></div>
                            <h3 className="text-xl font-bold text-[#154279]">Know Your Rights</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {rentalGuideData.rentalRights.map((right, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 rounded-md p-5 border-l-4 border-[#154279] shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <span className="font-bold text-[#154279] text-base leading-snug">✓</span>
                                    <span className="font-semibold leading-relaxed">{right}</span>
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
                        className="flex items-start gap-4 p-6 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 mt-8"
                    >
                        <AlertCircle size={20} className="shrink-0 mt-0.5 text-[#154279]" />
                        <p className="text-xs sm:text-sm leading-relaxed font-medium">
                            <span className="text-[#154279] font-bold uppercase tracking-wide">Disclaimer: </span>
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
                            <div className="p-6 space-y-8 overflow-y-auto">
                                {selectedStep === 0 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-bold text-[#154279] mb-4 flex items-center gap-2 text-lg">
                                                <MapPin size={20} className="text-[#F96302]" /> Where to Search
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {rentalGuideData.searchTips.platforms.map((platform, i) => (
                                                    <div key={i} className="bg-white border border-slate-200 hover:border-[#154279]/50 hover:shadow-md transition-all p-3 rounded-md cursor-pointer flex items-center justify-between group" onClick={() => {
                                                        const url = `https://www.${platform.toLowerCase().replace(/\s+/g, '')}.com`;
                                                        window.open(url, '_blank');
                                                        addNotification(`Opening ${platform}...`, "info");
                                                    }}>
                                                        <p className="font-semibold text-sm text-slate-700 group-hover:text-[#154279]">
                                                            {platform}
                                                        </p>
                                                        <ChevronRight size={14} className="text-slate-300 group-hover:text-[#F96302] transition-colors" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="bg-white border-l-4 border-red-500 shadow-sm p-5 rounded-r-lg">
                                                <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                    <AlertCircle size={16} /> Red Flags To Avoid
                                                </h3>
                                                <ul className="space-y-3">
                                                    {rentalGuideData.searchTips.redFlags.map((flag, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                                            <span className="font-medium">{flag}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-white border-l-4 border-green-500 shadow-sm p-5 rounded-r-lg">
                                                <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                    <CheckCircle size={16} /> What to Look For
                                                </h3>
                                                <ul className="space-y-3">
                                                    {rentalGuideData.searchTips.whatToLook.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                            <span className="font-medium">{item}</span>
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
                                            <div key={i} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                                                <h4 className="font-bold text-[#154279] mb-2 flex items-center gap-2 text-base">
                                                    <div className="w-6 h-6 rounded bg-[#154279]/10 flex items-center justify-center text-[#154279] text-xs font-bold">
                                                        {i + 1}
                                                    </div>
                                                    {process.step.split('. ')[1]}
                                                </h4>
                                                <p className="text-sm text-slate-600 mb-4 pl-8 font-medium italic">{process.details}</p>
                                                <div className="pl-8">
                                                    <div className="bg-slate-50 rounded border border-slate-100 p-4">
                                                        <p className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Verification Checklist</p>
                                                        <div className="space-y-2">
                                                            {process.checklist.map((item, j) => (
                                                                <label key={j} className="flex items-center gap-3 cursor-pointer group">
                                                                    <div className="relative flex items-center justify-center">
                                                                        <input type="checkbox" className="peer w-4 h-4 rounded border-2 border-slate-300 text-[#F96302] focus:ring-[#F96302] cursor-pointer accent-[#F96302] transition-all checked:border-[#F96302]" />
                                                                    </div>
                                                                    <span className="text-sm text-slate-600 font-medium group-hover:text-[#154279] transition-colors">{item}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedStep === 2 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-bold text-[#154279] mb-4 flex items-center gap-2 text-lg">
                                                <FileCheck size={20} className="text-[#F96302]" /> Essential Lease Terms
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {rentalGuideData.leaseExecution.essentialTerms.map((term, i) => (
                                                    <div key={i} className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm hover:border-[#154279]/30 transition-colors">
                                                        <p className="font-bold text-[#154279] text-sm mb-2 pb-2 border-b border-slate-100">{term.term}</p>
                                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{term.explanation}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-white border-l-4 border-red-500 shadow-sm p-6 rounded-r-lg">
                                            <h3 className="font-bold text-red-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                <AlertCircle size={18} /> Never Agree To These Terms
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {rentalGuideData.leaseExecution.neverAgreeVue.map((item, i) => (
                                                    <div key={i} className="flex items-start gap-2 p-3 bg-red-50/50 rounded border border-red-100">
                                                        <X size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                                                        <p className="text-sm font-semibold text-red-800 leading-snug">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedStep === 3 && (
                                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 py-2">
                                        {rentalGuideData.moveInLogistics.map((phase, i) => (
                                            <div key={i} className="relative pl-8">
                                                <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#F96302] ring-4 ring-white shadow-sm" />
                                                <h4 className="font-bold text-[#154279] mb-3 text-lg">{phase.phase}</h4>
                                                <ul className="space-y-2">
                                                    {phase.tasks.map((task, j) => (
                                                        <li key={j} className="flex items-center gap-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 p-3 rounded shadow-sm hover:shadow-md transition-all">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#154279] shrink-0" />
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
