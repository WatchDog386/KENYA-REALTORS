// src/pages/Index.tsx
// © 2025 Jeff. All rights reserved.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// ✅ REMOVED: import Hero from "@/components/Hero";
// ✅ REMOVED: import PageFooter from "@/components/PageFooter";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State variables (kept in case you use them for other sections)
  const [demoOpen, setDemoOpen] = useState(false);
  const [tiers, setTiers] = useState<any[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [tiersError, setTiersError] = useState<string | null>(null);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Fetch pricing tiers from Supabase
  useEffect(() => {
    let cancelled = false;

    const fetchTiers = async () => {
      setTiersLoading(true);
      setTiersError(null);

      const { data, error } = await supabase
        .from("tiers")
        .select("*")
        .order("id", { ascending: true });

      if (cancelled) return;

      if (error) {
        setTiersError(error.message || "Failed to load pricing tiers.");
        setTiers([]);
      } else {
        setTiers(Array.isArray(data) ? data : []);
      }

      setTiersLoading(false);
    };

    fetchTiers();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen text-gray-900 transition-colors duration-300 dark:text-gray-100">
      {/* Responsive helpers */}
      <style>{`
        .video-container {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
        }
        .video-container video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          background-color: #000;
        }
        @media (max-width: 640px) {
          html {
            font-size: 15px;
          }
        }
      `}</style>

      {/* ✅ HERO SECTION REMOVED 
         (It is now handled by PublicLayout or placed elsewhere)
      */}

      {/* ===== LANDING SECTIONS ===== */}
      <div className="container mx-auto px-4 py-8">
        {/* You can insert other sections here, or if this page 
            is just for logic, leave it empty/minimal. 
            Example: <PricingSection tiers={tiers} /> 
        */}
      </div>

      {/* ✅ FOOTER REMOVED 
         (It is now handled by PublicLayout)
      */}
    </div>
  );
};

export default Index;