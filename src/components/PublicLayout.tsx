// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

// ✅ Correct Frontend Navbar Import for public pages
import NavbarSection from "@/pages/NavbarSection"; 

// ✅ Footer Import
import Footer from "@/components/PageFooter";

// ✅ Leasing Module Import (The Modal)
import PolishedLeasingModule from "@/components/PolishedLeasingModule"; 

// ✅ CTA Banner Import
import CTABanner from "@/pages/CTABanner";

export default function PublicLayout() {
  // State to manage the visibility of the Leasing Modal
  const [isLeasingOpen, setIsLeasingOpen] = useState(false);
  const location = useLocation();

  // Check if current route is an auth-related page
  const isAuthPage = location.pathname.includes('/auth') || 
                     location.pathname.includes('/reset-password');

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* 1. Frontend Navbar for public pages - Only show on non-auth pages */}
      {!isAuthPage && (
        <NavbarSection onOpenLeasing={() => setIsLeasingOpen(true)} />
      )}

      {/* 2. Main Content 
          Using CSS variables defined in global.css:
          Mobile: 7rem (112px = 40px top bar + 72px main bar)
          Desktop: 10.5rem (168px = 40px top bar + 72px main bar + 56px subnav)
      */}
      <main className={`flex-grow ${!isAuthPage ? 'with-navbar' : 'no-navbar'}`}>
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
}