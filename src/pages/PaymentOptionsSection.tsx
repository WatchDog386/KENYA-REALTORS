import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Clock, ArrowRight, FileText, Home, Shield, 
  Wallet, Users, ChevronRight, Search, Calendar, 
  Share2, ThumbsUp, ArrowLeft, Bookmark, CheckCircle, MapPin
} from "lucide-react";

// --- 1. CONFIGURATION & TYPES ---

const THEME = {
  orange: "#D85C2C",
  blue: "#00356B",
  text: "#484848",
  heading: "#222222",
  bgLight: "#f7f7f7",
};

interface Article {
  id: number;
  title: string;
  description: string;
  category: string;
  stage: string;
  readTime: string;
  date: string;
  author: string;
  role: string;
  icon: React.ElementType; // Changed from 'any' for better TS support
  image: string;
  featured: boolean;
  content: string;
}

const STAGES = [
  { id: "planning", label: "Planning", icon: Wallet, desc: "Budgeting & Location" },
  { id: "hunting", label: "Hunting", icon: Search, desc: "Viewings & Vetting" },
  { id: "legal", label: "Signing", icon: FileText, desc: "Leases & Deposits" },
  { id: "moving", label: "Moving In", icon: Home, desc: "Logistics & Setup" },
];

// --- 2. DATA ---
const GUIDES: Article[] = [
  {
    id: 1,
    title: "First-Time Renter's Complete Guide",
    description: "Everything you need to know before signing your first lease in Kenya. From viewing properties to understanding your rights.",
    category: "Getting Started",
    stage: "planning",
    readTime: "10 min",
    date: "Oct 12, 2024",
    author: "Sarah Kamau",
    role: "Property Manager",
    icon: Home,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000",
    featured: true,
    content: `
      <p>Moving into your first apartment is a thrilling milestone, but the process can be overwhelming. In Kenya, the rental market moves fast, and being prepared is your best defense against scams and bad deals.</p>
      <h3>1. Determine Your Budget</h3>
      <p>The general rule of thumb is that your rent should not exceed 30% of your monthly income. However, in Nairobi, you must also account for:</p>
      <ul>
        <li><strong>Service Charge:</strong> Often separate from rent (approx. 10-15% of rent).</li>
        <li><strong>Utility Deposits:</strong> KPLC and Water tokens often require setup fees.</li>
        <li><strong>Agency Fees:</strong> Usually 10-50% of the first month's rent if using an agent.</li>
      </ul>
      <h3>2. The Viewing Process</h3>
      <p>Never pay a viewing fee unless you are dealing with a registered agency and they provide a receipt. When viewing a house, check water pressure, network signal strength, and security features.</p>
    `
  },
  {
    id: 2,
    title: "Understanding Your Lease Agreement",
    description: "A detailed breakdown of common lease terms, clauses to watch out for, and your rights as a tenant under Kenyan law.",
    category: "Legal",
    stage: "legal",
    readTime: "15 min",
    date: "Sep 28, 2024",
    author: "David Ochieng",
    role: "Legal Consultant",
    icon: FileText,
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1000",
    featured: false,
    content: `
      <p>Your lease is a legally binding document. Never sign it in a rush. This guide breaks down the jargon...</p>
      <h3>Key Clauses to Watch</h3>
      <p>Ensure you understand the termination clause. Most leases require at least one month's notice.</p>
    `
  },
  {
    id: 3,
    title: "Tenant Rights & Responsibilities",
    description: "Know your legal rights and obligations as a tenant. Learn about deposit protection, eviction procedures, and dispute resolution.",
    category: "Legal",
    stage: "legal",
    readTime: "12 min",
    date: "Nov 05, 2024",
    author: "David Ochieng",
    role: "Legal Consultant",
    icon: Shield,
    image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1000",
    featured: false,
    content: `
      <p>Tenants in Kenya are protected by the Rent Restriction Act. Here is what you need to know about evictions...</p>
      <h3>Illegal Evictions</h3>
      <p>A landlord cannot lock you out of your house without a court order. If this happens, report to the nearest Rent Tribunal immediately.</p>
    `
  },
  {
    id: 4,
    title: "Budgeting for Your Rental Home",
    description: "Calculate the true cost of renting, including utilities, deposits, and hidden costs. Plus tips for negotiating rent.",
    category: "Finance",
    stage: "planning",
    readTime: "8 min",
    date: "Oct 15, 2024",
    author: "Mercy Wanjiku",
    role: "Financial Advisor",
    icon: Wallet,
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1000",
    featured: false,
    content: `
      <p>Rent is just the beginning. Let's calculate the hidden costs of moving including moving trucks and curtains...</p>
      <h3>Hidden Costs</h3>
      <ul>
        <li>Curtains and Rods</li>
        <li>Extension Cables</li>
        <li>Gas Cylinder Deposit</li>
      </ul>
    `
  },
  {
    id: 5,
    title: "Moving In Checklist",
    description: "A comprehensive checklist for a smooth move-in process. Document condition, set up utilities, and avoid common mistakes.",
    category: "Moving",
    stage: "moving",
    readTime: "6 min",
    date: "Aug 22, 2024",
    author: "Team Ayden",
    role: "Logistics",
    icon: Home,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000",
    featured: false,
    content: `
      <p>Don't move a single box until you have performed a Move-In Inspection Report. Here is a downloadable checklist...</p>
      <h3>Utilities Setup</h3>
      <p>Ensure your KPLC meter number works and you can buy tokens before the movers leave.</p>
    `
  },
  {
    id: 6,
    title: "Living with Roommates Successfully",
    description: "Tips for finding compatible roommates, splitting expenses fairly, and maintaining a harmonious shared living space.",
    category: "Lifestyle",
    stage: "moving",
    readTime: "9 min",
    date: "Jul 10, 2024",
    author: "Sarah Kamau",
    role: "Property Manager",
    icon: Users,
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1000",
    featured: false,
    content: `
      <p>Communication is key. Establish ground rules early regarding guests, noise, and dishwashing duties...</p>
      <h3>Splitting Bills</h3>
      <p>Use apps like Splitwise to track shared expenses and avoid conflicts over money.</p>
    `
  },
];

// --- 3. SUB-COMPONENTS ---

// A. Notification Toast
const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, x: "-50%" }}
    animate={{ opacity: 1, y: 0, x: "-50%" }}
    exit={{ opacity: 0, y: 50, x: "-50%" }}
    className="fixed bottom-8 left-1/2 z-[110] bg-[#222] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3"
  >
    <CheckCircle size={18} className="text-cta" />
    <span className="font-bold text-sm">{message}</span>
  </motion.div>
);

// B. Article Reader
const ArticleReader = ({ article, onBack, toggleBookmark, isBookmarked }: { article: Article, onBack: () => void, toggleBookmark: (id: number) => void, isBookmarked: boolean }) => {
  
  useEffect(() => window.scrollTo(0, 0), []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: "100%" }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-white z-[100] overflow-y-auto font-nunito text-[#484848]"
    >
      
      {/* 1. HERO SECTION (Full Width) */}
      <div className="relative h-[50vh] md:h-[60vh] w-full">
        <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
        
        {/* Floating Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-3 z-10">
           <button 
             onClick={(e) => { e.stopPropagation(); toggleBookmark(article.id); }}
             className={`p-3 rounded-full backdrop-blur-md border border-white/20 transition-all ${
               isBookmarked 
               ? 'bg-cta text-white shadow-lg scale-110' 
               : 'bg-black/30 text-white hover:bg-black/50'
             }`}
           >
             <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
           </button>
           <button className="p-3 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/50 transition-all">
             <Share2 size={20} />
           </button>
        </div>

        {/* Gradient Overlay & Title */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent flex flex-col justify-end p-6 md:p-12">
          <div className="max-w-4xl mx-auto w-full">
            <span className="text-cta font-bold uppercase tracking-widest text-xs mb-3 bg-white/10 backdrop-blur w-fit px-3 py-1 border border-white/20 rounded">
              {article.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight drop-shadow-md mt-4">
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-cta flex items-center justify-center font-bold text-white text-lg border-2 border-white/20">
                  {article.author.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="leading-none">{article.author}</span>
                  <span className="text-white/60 text-xs font-normal">{article.role}</span>
                </div>
              </div>
              <div className="h-8 w-[1px] bg-white/20 hidden md:block"></div>
              <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                <Clock size={14} className="text-cta" /> 
                {article.readTime} Read
              </div>
              <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                <Calendar size={14} className="text-cta" /> 
                {article.date}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTENT CONTAINER */}
      <div className="max-w-4xl mx-auto px-6 py-12 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Main Text */}
        <div className="md:col-span-8 article-content text-lg leading-relaxed text-gray-700">
           <div dangerouslySetInnerHTML={{ __html: article.content }} />
           
           {/* Helpful Section */}
           <div className="mt-16 pt-8 border-t border-gray-100">
             <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-xl border border-blue-100">
               <div>
                  <div className="font-bold text-[#154279] mb-1">Was this guide helpful?</div>
                  <div className="text-sm text-gray-500">Your feedback helps us improve.</div>
               </div>
               <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 shadow-sm hover:border-green-500 hover:text-green-600 transition-all rounded-lg font-bold text-sm group">
                  <ThumbsUp size={18} className="group-hover:scale-110 transition-transform" /> Yes, thanks!
               </button>
             </div>
           </div>
        </div>

        {/* Sidebar (Desktop Only) */}
        <div className="hidden md:block md:col-span-4 space-y-8">
          <div className="bg-[#f7f7f7] p-6 rounded-xl border border-gray-200 sticky top-10">
            <h4 className="font-bold text-[#154279] mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
              <Shield size={14}/> About the Author
            </h4>
            <div className="flex items-start gap-4 mb-4">
               <div className="w-12 h-12 rounded-full bg-[#154279] flex items-center justify-center font-bold text-white text-lg">
                  {article.author.charAt(0)}
               </div>
               <div>
                  <div className="font-bold text-gray-900">{article.author}</div>
                  <div className="text-xs text-[#F96302] font-bold">{article.role}</div>
               </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              An experienced professional in the Kenyan property market, dedicated to helping tenants navigate legal and financial hurdles.
            </p>
          </div>
        </div>
      </div>

      {/* 3. FOOTER NAVIGATION */}
      <div className="bg-gray-50 border-t border-gray-200 py-10 mt-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-xl font-bold text-navy mb-6">Done reading?</h3>
          
          <button 
            onClick={onBack}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-cta text-white text-lg font-bold rounded-full hover:bg-cta/90 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 w-full md:w-auto min-w-[200px]"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to All Guides
          </button>
          
          <p className="mt-4 text-sm text-gray-400">
            Or browse more topics in the <span className="font-bold text-gray-500">Planning</span> stage.
          </p>
        </div>
      </div>

    </motion.div>
  );
};

// C. Journey Stage Selector
const JourneyStepper = ({ activeStage, setStage }: { activeStage: string, setStage: (id: string) => void }) => {
  return (
    <div className="mb-12">
      <div className="flex flex-col md:flex-row justify-between items-center relative gap-4">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-0"></div>
        
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.id;
          return (
            <button 
              key={stage.id}
              onClick={() => setStage(stage.id)}
              className={`relative z-10 flex md:flex-col items-center gap-3 md:gap-4 p-4 md:p-0 w-full md:w-auto bg-white md:bg-transparent border md:border-0 rounded-lg md:rounded-none transition-all duration-300 ${isActive ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${isActive ? 'bg-[#F96302] border-white shadow-lg text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                <Icon size={isActive ? 24 : 20} />
              </div>
              <div className="text-left md:text-center">
                <div className={`font-bold text-sm uppercase tracking-wider ${isActive ? 'text-[#154279]' : 'text-gray-500'}`}>{stage.label}</div>
                <div className="text-xs text-gray-400 hidden md:block">{stage.desc}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  );
};

// --- 4. MAIN COMPONENT ---
const RentalGuidesSection = () => {
  const [viewMode, setViewMode] = useState<"grid" | "guided">("grid");
  const [activeStage, setActiveStage] = useState("planning");
  const [searchQuery, setSearchQuery] = useState("");
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Global Styles injection (Quick fix for fonts)
  const GlobalStyles = () => (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
      .font-nunito { font-family: 'Nunito', sans-serif; }
      .article-content h3 { font-size: 1.5rem; font-weight: 800; color: ${THEME.blue}; margin-top: 2rem; margin-bottom: 1rem; }
      .article-content p { margin-bottom: 1.2rem; line-height: 1.8; color: ${THEME.text}; }
      .article-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
    `}</style>
  );

  // Handlers
  const toggleBookmark = (id: number) => {
    if (bookmarks.includes(id)) {
      setBookmarks(prev => prev.filter(b => b !== id));
      setToastMsg("Removed from bookmarks");
    } else {
      setBookmarks(prev => [...prev, id]);
      setToastMsg("Article saved for later");
    }
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredGuides = GUIDES.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (viewMode === "guided") {
      return matchesSearch && guide.stage === activeStage;
    }
    return matchesSearch;
  });

  return (
    <>
      <GlobalStyles />
      <AnimatePresence>
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {readingArticle ? (
          <ArticleReader 
            key="reader" 
            article={readingArticle} 
            onBack={() => setReadingArticle(null)}
            toggleBookmark={toggleBookmark}
            isBookmarked={bookmarks.includes(readingArticle.id)}
          />
        ) : (
          <motion.section 
            key="grid"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="py-12 bg-[#f7f7f7] font-nunito text-[#484848] min-h-screen"
          >
            <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
              
              {/* Top Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
                <div>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-[#154279] leading-tight mb-2">
                    Ayden <span className="text-[#F96302]">Guides</span>
                  </h2>
                  <p className="text-gray-500 text-lg">Expert advice for navigating the rental market.</p>
                </div>

                <div className="flex items-center bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
                  <button 
                    onClick={() => setViewMode("grid")}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#154279] text-white shadow' : 'text-gray-500 hover:text-[#154279]'}`}
                  >
                    Browse All
                  </button>
                  <button 
                    onClick={() => setViewMode("guided")}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${viewMode === 'guided' ? 'bg-[#154279] text-white shadow' : 'text-gray-500 hover:text-[#154279]'}`}
                  >
                    <MapPin size={16} /> Guided Journey
                  </button>
                </div>
              </div>

              {/* SEARCH BAR */}
              <div className="w-full relative group mb-10">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F96302] transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search topics (e.g. 'deposit', 'lease', 'eviction')..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-none border border-gray-200 focus:outline-none focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] shadow-sm text-lg"
                  />
              </div>

              {/* GUIDED MODE NAVIGATION */}
              <AnimatePresence>
                {viewMode === "guided" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#154279]/5 border border-[#154279]/10 p-6 md:p-8 rounded-2xl mb-12">
                      <div className="text-center mb-8">
                        <h3 className="font-bold text-[#154279] text-xl">Where are you in your journey?</h3>
                        <p className="text-sm text-gray-500">Select a stage to see relevant guides.</p>
                      </div>
                      <JourneyStepper activeStage={activeStage} setStage={setActiveStage} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CONTENT GRID */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredGuides.length > 0 ? (
                  filteredGuides.map((guide) => {
                    const Icon = guide.icon;
                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={guide.id} 
                        className="group bg-white border border-gray-100 p-8 cursor-pointer flex flex-col h-full hover:shadow-xl transition-all duration-300 rounded-lg relative overflow-hidden"
                        onClick={() => setReadingArticle(guide)}
                      >
                        {/* Bookmark Ribbon */}
                        {bookmarks.includes(guide.id) && (
                           <div className="absolute top-0 right-4 bg-[#F96302] text-white p-1 pb-2 rounded-b shadow-md">
                              <Bookmark size={14} fill="currentColor" />
                           </div>
                        )}

                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 bg-blue-50 text-[#154279] flex items-center justify-center rounded-lg group-hover:bg-[#154279] group-hover:text-white transition-colors duration-300">
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border border-gray-100 px-2 py-1 rounded">
                            {guide.category}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-[#222222] mb-3 group-hover:text-[#F96302] transition-colors leading-tight">
                          {guide.title}
                        </h3>
                        
                        <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                          {guide.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                           <div className="text-xs text-gray-400 font-bold flex items-center gap-2">
                             <Clock size={12} /> {guide.readTime}
                           </div>
                           <div className="text-xs font-bold text-[#F96302] flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                             Read Guide <ChevronRight className="w-3 h-3" />
                           </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <div className="text-gray-300 mb-4"><Search size={64} className="mx-auto" /></div>
                    <h3 className="text-xl font-bold text-gray-700">No guides found</h3>
                    <p className="text-gray-500">Try adjusting your search filters.</p>
                  </div>
                )}
              </div>

            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
};

export default RentalGuidesSection;