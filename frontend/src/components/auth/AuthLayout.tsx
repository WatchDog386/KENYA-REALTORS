import React from 'react';
import { Battery, Wifi, Signal } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  powerState?: 'off' | 'booting' | 'on';
  time?: string;
  onUnlock?: () => void;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  powerState = 'on',
  time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  onUnlock 
}) => {
  return (
    <div className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-[#F5F5F7] flex flex-col lg:flex-row items-center justify-center lg:gap-24 overflow-hidden">
      {/* Device Container */}
      <div className="relative z-20 flex-shrink-0 flex items-center justify-center w-full lg:w-auto">
        <div 
          className="pointer-events-auto relative bg-[#121212] shadow-2xl mx-auto
                     w-[90vw] h-[85dvh] max-w-[400px] max-h-[850px]
                     border-[10px] border-[#121212] rounded-[3rem] ring-1 ring-gray-300
                     lg:w-[400px] lg:h-[800px] lg:border-[12px] lg:rounded-[3.5rem]"
        >
          {/* Glossy Reflection */}
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent rounded-r-[2.5rem] lg:rounded-r-[3rem] pointer-events-none z-20" />

          {/* Side Buttons */}
          <div className="absolute -left-[14px] top-32 w-[4px] h-10 bg-[#2a2a2a] rounded-l-md" />
          <div className="absolute -left-[14px] top-48 w-[4px] h-16 bg-[#2a2a2a] rounded-l-md" />
          <div className="absolute -right-[14px] top-40 w-[4px] h-24 bg-[#2a2a2a] rounded-r-md" />

          {/* SCREEN CONTAINER */}
          <div className="w-full h-full bg-white rounded-[2.3rem] lg:rounded-[2.8rem] overflow-hidden flex flex-col relative shadow-inner">
            
            {/* Status Bar */}
            <div className={`absolute top-0 w-full px-6 pt-5 flex justify-between items-center z-30 transition-colors duration-700 ${powerState === 'off' ? 'text-white/40' : 'text-slate-900'}`}>
              <span className="text-xs font-semibold">{time}</span>
              <div className="flex gap-1.5 opacity-90">
                <Signal size={13}/>
                <Wifi size={13}/>
                <Battery size={15}/>
              </div>
            </div>

            {/* Dynamic Island Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-20 pointer-events-none" />

            {/* Content */}
            <div className="flex-1 h-full relative">
              {children}
            </div>
            
            {/* Home Bar */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-100 rounded-full" />
          </div>
        </div>
      </div>

      {/* Right Content (Desktop Only) */}
      <div className="hidden lg:flex flex-col items-start max-w-xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-[1px] w-12 bg-[#0056A6]"></div>
          <span className="text-xs font-bold tracking-[0.2em] text-[#0056A6] uppercase">Est. 2024</span>
        </div>

        <h1 className="text-6xl font-classy text-[#1a1a1a] leading-none mb-8 tracking-tight whitespace-nowrap">
          Realtors Kenya.
        </h1>

        <div className="space-y-6 mb-12 pl-2 border-l border-gray-200">
          <p className="text-3xl font-classy text-[#1a1a1a] italic">
            "Your gateway to premium properties."
          </p>
          <p className="text-sm font-ui text-gray-500 leading-7 font-light max-w-md">
            Discover, rent, and manage properties with ease. Experience seamless property management 
            powered by cutting-edge technology and exceptional service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;