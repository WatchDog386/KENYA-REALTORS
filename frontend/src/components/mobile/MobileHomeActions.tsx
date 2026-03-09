import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlusCircle, User, MessageCircle, ArrowRight, Star, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const MobileHomeActions: React.FC = () => {
    const navigate = useNavigate();

    const quickActions = [
        { label: 'Find Home', icon: Search, color: '#0072ff', path: '/marketplace' },
        { label: 'List Property', icon: PlusCircle, color: '#FF416C', path: '/contact' },
        { label: 'My Portal', icon: User, color: '#11998e', path: '/portal' },
        { label: 'Support', icon: MessageCircle, color: '#8E2DE2', path: '/contact' },
    ];

    const mobileListings = [
         {
            id: 1,
            title: "One Bedrooms",
            price: "Avg 25k",
            location: "Various Locations",
            rating: 4.8,
            image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=400"
        },
        {
            id: 2,
            title: "Bedsitters/Studio",
            price: "Avg 15k",
            location: "City Wide",
            rating: 4.5,
            image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400"
        },
        {
            id: 3,
            title: "Rental Shops",
            price: "Inquire",
            location: "Commercial Zones",
            rating: 4.7,
            image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=400"
        },
        {
            id: 4,
            title: "Two Bedrooms",
            price: "Avg 45k",
            location: "Suburb Areas",
            rating: 4.9,
            image: "https://images.unsplash.com/photo-1600596542815-e32c0ee5ad11?q=80&w=400"
        },
        {
            id: 5,
            title: "Units",
            price: "Various",
            location: "Mixed Use",
            rating: 4.6,
            image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=400"
        }
    ];

    const partners = [
        "Housing Finance", "Knight Frank", "HassConsult", "Villa Care", "Optiven", "Centum", "Cytonn"
    ];

    return (
        <div className="w-full bg-slate-50 pb-6 md:hidden">
            
            {/* 1. Partners Marquee */}
            <div className="bg-white border-b border-gray-100 py-4 overflow-hidden">
                <div className="px-6 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trusted Partners</span>
                </div>
                <div className="flex relative overflow-hidden w-full">
                   <motion.div 
                        className="flex gap-8 items-center whitespace-nowrap min-w-full"
                        animate={{ x: [0, -400] }}
                        transition={{ 
                            repeat: Infinity, 
                            ease: "linear", 
                            duration: 15 
                        }}
                   >
                    {[...partners, ...partners, ...partners].map((partner, idx) => (
                        <span key={idx} className="text-sm font-bold text-gray-400 opacity-60 flex-shrink-0">
                            {partner}
                        </span>
                    ))}
                   </motion.div>
                </div>
            </div>

            {/* 2. Quick Actions - Floating Icons */}
            <div className="px-6 mb-8 mt-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#154279] mb-6 pl-2 border-l-4 border-[#F96302]">
                    Quick Actions
                </h3>
                <div className="flex justify-between items-start">
                    {quickActions.map((action, idx) => (
                        <motion.button
                            key={idx}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(action.path)}
                            className="flex flex-col items-center gap-3"
                        >
                            <div className="p-2">
                                <action.icon size={36} color={action.color} strokeWidth={2} />
                            </div>
                            <span className="text-[11px] font-bold text-gray-600 text-center leading-tight">
                                {action.label}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* 3. Featured Mobile Listings (Horizontal Scroll) */}
            <div className="pl-4 mb-6">
                <div className="flex items-center justify-between pr-4 mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#154279] pl-2 border-l-4 border-[#F96302]">
                        Find your apartments here
                    </h3>
                    <button 
                        onClick={() => navigate('/marketplace')}
                        className="text-[10px] font-bold text-[#F96302] flex items-center gap-1"
                    >
                        View All <ArrowRight size={12} />
                    </button>
                </div>
                
                {/* Horizontal Scroll Container */}
                <div className="flex gap-3 overflow-x-auto pb-4 pr-4 custom-scroll snap-x">
                    {mobileListings.map((item) => (
                        <div 
                            key={item.id}
                            className="min-w-[150px] bg-white rounded-xl shadow-sm border border-gray-100 snap-center p-3 flex flex-col justify-between"
                            onClick={() => navigate('/marketplace')}
                        >
                            <div>
                                <h4 className="text-sm font-bold text-[#154279] mb-1 leading-tight">{item.title}</h4>
                                <div className="flex items-center gap-1 text-gray-400 mb-3">
                                    <MapPin size={10} />
                                    <span className="text-[10px]">{item.location}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                <span className="text-gray-700 font-bold text-xs">
                                    {item.price}
                                </span>
                                <div className="w-5 h-5 bg-orange-50 rounded-full flex items-center justify-center">
                                    <ArrowRight size={10} className="text-[#F96302]" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default MobileHomeActions;
