import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    CheckCircle2, 
    Truck, 
    Download, 
    Share2, 
    Hammer, 
    ArrowRight, 
    ShieldCheck, 
    Clock, 
    Star, 
    AlertCircle, 
    ChevronRight,
    Lock,
    MapPin,
    FileText
} from "lucide-react";

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        .font-nunito { font-family: 'Nunito', sans-serif; }
        
        /* Custom scrollbar for consistency */
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #ccc; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #F96302; }
    `}</style>
);

export default function PolishedLeasingModule() {
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({ 0: true });
    const [progress, setProgress] = useState(0);

    const toggleCheck = (index: number) => {
        setCheckedItems(prev => ({ ...prev, [index]: !prev[index] }));
    };

    useEffect(() => {
        const total = 5;
        const checkedCount = Object.values(checkedItems).filter(Boolean).length;
        setProgress(Math.round((checkedCount / total) * 100));
    }, [checkedItems]);

    // Simulated Download Function
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = '#'; // Placeholder
        link.download = 'Leasing_Guide_101.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert("Downloading Leasing Guide PDF...");
    };

    const checklistData = [
        "Valid National ID / Passport",
        "KRA PIN Certificate",
        "Active M-Pesa or Bank Card",
        "Email Address (Signatures)",
        "Deposit Funds Ready"
    ];

    const steps = [
        { 
            id: "01", 
            title: "Discovery & Search", 
            meta: "Inventory Selection", 
            time: "1h", 
            status: "Completed", 
            state: "done",
            icon: MapPin,
            img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&q=100" // Increased quality
        },
        { 
            id: "02", 
            title: "Verification Tour", 
            meta: "Physical/Virtual View", 
            time: "30m", 
            status: "In Progress", 
            state: "active",
            icon: ShieldCheck,
            img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop&q=100" // Increased quality
        },
        { 
            id: "03", 
            title: "Lease Execution", 
            meta: "Digital Contract", 
            time: "15m", 
            status: "Locked", 
            state: "locked",
            icon: FileText,
            img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop&q=100" // Increased quality
        },
        { 
            id: "04", 
            title: "Move-In Logistics", 
            meta: "Access & Handover", 
            time: "24h", 
            status: "Locked", 
            state: "locked",
            icon: Truck,
            img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&q=100" // Increased quality
        }
    ];

    return (
        <>
            <GlobalStyles />
            <div className="font-nunito w-full bg-[#f7f7f7] p-6 md:p-12 flex justify-center min-h-[600px] items-center text-[#484848]">
                
                {/* --- MODULE CONTAINER --- */}
                <div className="w-full max-w-5xl bg-white rounded-none shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden flex flex-col">
                    
                    {/* 1. HEADER: Ayden Blue with Integrated Progress */}
                    <div className="bg-[#154279] px-8 py-6 relative overflow-hidden">
                        {/* Abstract bg noise */}
                        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 pointer-events-none" />

                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10">
                            <div className="flex items-start gap-5">
                                <div className="bg-white/10 p-3 rounded-none backdrop-blur-sm border border-white/10">
                                    <Hammer size={24} className="text-[#F96302] fill-[#F96302]" /> {/* Amplified Icon */}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold tracking-[0.2em] text-[#F96302] uppercase bg-[#F96302]/10 px-2 py-0.5 rounded-none border border-[#F96302]/20">
                                            Guide #101
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white leading-none tracking-tight">Leasing Dashboard</h2>
                                    <p className="text-sm text-slate-300 mt-1 font-medium opacity-80">Complete these steps to secure your unit.</p>
                                </div>
                            </div>

                            {/* Progress Indicator */}
                            <div className="flex items-end gap-4 min-w-[200px]">
                                <div className="flex-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase mb-2 tracking-wider">
                                        <span>Readiness</span>
                                        <span className="text-white">{progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-[#0f325e] rounded-none overflow-hidden border border-white/5">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-[#d85502] to-[#F96302]" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. MAIN LAYOUT GRID */}
                    <div className="flex flex-col md:flex-row h-full">
                        
                        {/* --- LEFT COLUMN: CHECKLIST (30%) --- */}
                        <div className="w-full md:w-[340px] bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col shrink-0">
                            
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-bold text-[#154279] uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-[#F96302]" /> Requirements
                                </h3>
                                <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-none">
                                    {checklistData.filter((_, i) => checkedItems[i]).length}/5
                                </span>
                            </div>

                            <div className="space-y-3 mb-8">
                                {checklistData.map((item, i) => (
                                    <label 
                                        key={i} 
                                        className={`
                                            flex items-center gap-3 p-3 rounded-none border cursor-pointer transition-all duration-200 group
                                            ${checkedItems[i] 
                                                ? 'bg-white border-[#154279] shadow-sm' 
                                                : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-5 h-5 rounded-none border-2 flex items-center justify-center transition-all flex-shrink-0
                                            ${checkedItems[i] ? 'bg-[#154279] border-[#154279]' : 'border-slate-300 group-hover:border-[#F96302]'}
                                        `}>
                                            {checkedItems[i] && <CheckCircle2 size={12} className="text-white" />}
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="hidden" 
                                            checked={!!checkedItems[i]} 
                                            onChange={() => toggleCheck(i)} 
                                        />
                                        <span className={`text-xs font-bold ${checkedItems[i] ? 'text-[#154279]' : 'text-slate-500'}`}>
                                            {item}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {/* Benefit Card */}
                            <div className="mt-auto relative overflow-hidden rounded-none bg-gradient-to-br from-[#154279] to-[#0f325e] p-5 text-white shadow-lg shadow-blue-900/10">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Truck size={80} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Truck size={16} className="text-[#F96302]" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F96302]">Logistics</span>
                                    </div>
                                    <p className="text-sm font-bold leading-tight mb-1">Free Move-In Truck</p>
                                    <p className="text-[10px] text-slate-300 mb-3">Available for verified 12-month leases.</p>
                                    <button className="text-[10px] bg-white/10 hover:bg-[#F96302] hover:text-white transition-all px-3 py-2 rounded-none font-bold backdrop-blur-sm border border-white/10 uppercase tracking-wide">
                                        Check Eligibility
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* --- RIGHT COLUMN: STEPS (70%) --- */}
                        <div className="flex-1 bg-white p-6 md:p-8">
                            
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-[#154279]">Execution Plan </h3>
                                    <p className="text-xs text-slate-500 mt-1 font-bold">Follow sequence strictly for reservation.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handleDownload}
                                        className="text-[#154279] hover:bg-slate-50 px-3 py-1.5 border border-slate-200 text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all hover:border-[#154279]"
                                    >
                                        <Download size={14} /> Download PDF
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {steps.map((step) => {
                                    const isActive = step.state === "active";
                                    const isLocked = step.state === "locked";
                                    
                                    return (
                                        <div 
                                            key={step.id} 
                                            className={`
                                                group relative flex items-center gap-5 p-4 rounded-none border transition-all duration-300
                                                ${isActive 
                                                    ? 'bg-white border-[#F96302] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-[#F96302]/10 scale-[1.01]' 
                                                    : isLocked
                                                        ? 'bg-slate-50 border-slate-100 opacity-80' // Reduced opacity, removed grayscale for better color pop
                                                        : 'bg-white border-slate-200 hover:border-[#154279] hover:shadow-md'
                                                }
                                            `}
                                        >
                                            {/* Thumbnail - Enhanced vibrancy */}
                                            <div className="w-16 h-16 shrink-0 rounded-none overflow-hidden relative shadow-sm border border-slate-100">
                                                <img 
                                                    src={step.img} 
                                                    alt={step.title} 
                                                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isLocked ? 'saturate-50' : 'saturate-100'}`} 
                                                />
                                                {/* Removed dark overlay to amplify color */}
                                                <div className="absolute top-0 left-0 bg-[#154279] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-none">
                                                    {step.id}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className={`text-sm font-bold truncate ${isActive ? 'text-[#154279]' : 'text-slate-700'}`}>
                                                        {step.title}
                                                    </h4>
                                                    
                                                    {isLocked ? (
                                                        <Lock size={14} className="text-slate-400" />
                                                    ) : (
                                                        <span className={`
                                                            text-[9px] font-bold uppercase px-2 py-0.5 rounded-none border
                                                            ${step.state === 'done' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-[#F96302] border-orange-100'}
                                                        `}>
                                                            {step.status}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                                                    <span className="font-bold text-slate-400">{step.meta}</span>
                                                    <span className="w-1 h-1 rounded-none bg-slate-300" />
                                                    <span className="flex items-center gap-1 font-bold text-[#154279]"><Clock size={12} className="text-[#F96302]" /> {step.time}</span>
                                                </div>
                                            </div>

                                            {/* Action Arrow */}
                                            {!isLocked && (
                                                <div className="shrink-0 w-8 h-8 rounded-none bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#154279] group-hover:text-white transition-all transform group-hover:translate-x-1 cursor-pointer">
                                                    <ChevronRight size={16} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Disclaimer */}
                            <div className="mt-6 flex items-start gap-2.5 p-3 rounded-none bg-blue-50 border border-blue-100 text-[#154279]">
                                <AlertCircle size={14} className="shrink-0 mt-0.5 text-[#F96302]" />
                                <p className="text-[11px] leading-relaxed font-bold">
                                    <strong className="text-[#F96302]">Note:</strong> Pricing and availability are dynamic. Completing Step 1 does not guarantee reservation until the Step 3 deposit is verified.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}