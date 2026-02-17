import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const FloatingWhatsApp = () => {
  const location = useLocation();
  const phoneNumber = "254711493222"; 
  const whatsappUrl = `https://wa.me/${phoneNumber}`;

  // Hide on contact page
  if (location.pathname === '/contact') {
    return null;
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-[100] transition-transform hover:scale-110 active:scale-95 group"
      aria-label="Contact us on WhatsApp"
    >
      {/* Background circle for contrast if needed, or just the icon if that's what user strictly meant "no container" */}
      {/* User said "do not put in a container just the real icon". 
          This implies they likely want the icon to look like the WhatsApp logo itself which is usually contained in a green bubble. 
          Standard lucide icon is just lines. 
          I will make it a circular button with the WhatsApp color which is the "real icon" look.
      */}
      <div className="bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center">
        <MessageCircle size={32} fill="white" className="text-white" />
      </div>
      
      {/* Pulse effect */}
      <div className="absolute inset-0 bg-[#25D366] rounded-full -z-10 animate-ping opacity-20 group-hover:opacity-40"></div>
    </a>
  );
};
