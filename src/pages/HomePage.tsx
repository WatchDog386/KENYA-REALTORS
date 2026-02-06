import React from "react";

/* ======================
   SECTIONS
====================== */
import Hero from "@/components/Hero"; 
import MobileHomeActions from "@/components/mobile/MobileHomeActions"; // New Mobile Layout Component
import HowItWorks from "@/pages/HowItWorks";          // Matches id="how-it-works"
// Matches id="features"
import PricingSection from "@/pages/PricingSection";   // Matches id="pricing"
import PaymentOptionsSection from "@/pages/PaymentOptionsSection"; // Matches id="payment-options"
import TestimonialsSection from "@/pages/TestimonialsSection"; // Matches id="testimonials"
import FaqSection from "@/pages/FaqSection";           // Matches id="faq"

const HomePage = () => {
  return (
    <div className="flex flex-col w-full">
      
      {/* 1. Hero Section (Top) */}
      {/* We add a top padding to account for the fixed Navbar */}
      <div className="pt-0"> 
        <Hero />
      </div>

      {/* 2. Mobile Specific Actions Grid (Hidden on Desktop) */}
      <MobileHomeActions />

      {/* 3. Content Sections - Stacked Vertically */}
      <div className="w-full flex flex-col space-y-0">
        
        {/* Testimonials Section - Hidden on Mobile */}
        <div className="hidden md:block">
          <TestimonialsSection />
        </div>

        {/* Apartments Features */}
       
        

        
       
      </div>
    </div>
  );
};

export default HomePage;