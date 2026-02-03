// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import React, { useState, ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";

// ✅ Correct Frontend Navbar Import for public pages
import NavbarSection from "@/pages/NavbarSection"; 

// ✅ Footer Import
import Footer from "@/components/PageFooter";

// ✅ Leasing Module Import (The Modal)
import PolishedLeasingModule from "@/components/PolishedLeasingModule"; 

// ✅ CTA Banner Import
import CTABanner from "@/pages/CTABanner";

const MainLayout: React.FC<{ children?: ReactNode }> = ({ children }) => {
  // State to manage the visibility of the Leasing Modal
  const [isLeasingOpen, setIsLeasingOpen] = useState(false);
  const location = useLocation();

  // Check if current route is an auth-related page
  const isAuthPage = location.pathname.includes('/auth') || 
                     location.pathname.includes('/reset-password') ||
                     location.pathname.includes('/login') ||
                     location.pathname.includes('/register');

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* 1. Frontend Navbar for public pages - Only show on non-auth pages */}
      {!isAuthPage && (
        <NavbarSection />
      )}

      {/* 2. Main Content 
          Adjust padding based on whether navbar is shown
      */}
      <main className={`flex-grow ${!isAuthPage ? 'pt-24 lg:pt-32' : ''}`}>
        <Outlet />
      </main>

      {/* ✅ 3. CTA Banner - Only show on non-auth pages */}
      {!isAuthPage && <CTABanner />}

      {/* 4. Footer - Only show on non-auth pages */}
      {!isAuthPage && <Footer />}

      {/* 5. Leasing Module Modal */}
      <PolishedLeasingModule 
        isOpen={isLeasingOpen} 
        onClose={() => setIsLeasingOpen(false)} 
      />
    </div>
  );
};

export default MainLayout;