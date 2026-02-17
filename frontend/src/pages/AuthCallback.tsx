// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing authentication...");
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔐 AuthCallback: Starting authentication processing");
        
        // Get the redirect_to parameter if it exists
        const redirectTo = searchParams.get('redirect_to') || localStorage.getItem('redirect_after_login');
        if (redirectTo) {
          console.log("📍 Found redirect target:", redirectTo);
          localStorage.removeItem('redirect_after_login');
        }

        // Check for any error in the URL (OAuth errors)
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error("❌ OAuth error:", error, errorDescription);
          setStatus("error");
          setMessage(errorDescription || "Authentication failed. Please try again.");
          setTimeout(() => navigate("/login", { state: { error } }), 3000);
          return;
        }

        // Get the hash from the URL for OAuth callbacks
        const hash = window.location.hash;
        if (hash.includes('access_token') || hash.includes('error')) {
          console.log("🔄 Processing OAuth callback from hash");
          
          const { data: { session }, error: hashError } = await supabase.auth.getSession();
          
          if (hashError) {
            console.error("❌ Hash session error:", hashError);
            setStatus("error");
            setMessage("Failed to process authentication. Please try again.");
            setTimeout(() => navigate("/login"), 3000);
            return;
          }

          if (!session) {
            console.warn("⚠️ No session found in hash callback");
            setStatus("error");
            setMessage("Session not found. Please try logging in again.");
            setTimeout(() => navigate("/login"), 3000);
            return;
          }

          console.log("✅ Session established for user:", session.user.email);
          await handleSuccessfulAuth(session, redirectTo);
          return;
        }

        // Handle regular session-based authentication
        console.log("🔄 Checking for existing session");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          setStatus("error");
          setMessage("Authentication failed. Please try again.");
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        if (session) {
          console.log("✅ Found existing session");
          await handleSuccessfulAuth(session, redirectTo);
        } else {
          console.warn("⚠️ No active session found");
          setStatus("error");
          setMessage("Please log in to continue.");
          setTimeout(() => navigate("/login"), 2000);
        }
      } catch (error) {
        console.error("🔥 Auth callback error:", error);
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again.");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    const handleSuccessfulAuth = async (session: any, redirectTo: string | null) => {
      try {
        setStatus("success");
        setMessage("Authentication successful! Redirecting...");
        
        // Store session in localStorage for cross-tab sync
        localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        
        // Get user profile to determine role
        console.log("👤 Fetching user profile");
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, is_complete")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          console.warn("⚠️ Profile fetch error (user may need to complete profile):", profileError);
          
          // Check if profile exists at all
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!existingProfile) {
            console.log("📝 No profile found, redirecting to complete-profile");
            setTimeout(() => navigate("/complete-profile"), 1500);
            return;
          }
          
          // If profile exists but fetch failed for other reasons, continue to dashboard
          console.log("ℹ️ Profile exists but fetch had issues, continuing to dashboard");
        }

        // Determine redirect path
        let finalRedirectPath = "/portal";
        
        if (redirectTo) {
          // Validate redirect path to prevent open redirects
          const validPaths = [
            '/portal', '/portal/admin', '/portal/tenant', '/portal/properties',
            '/portal/leases', '/portal/payments', '/portal/profile', '/marketplace'
          ];
          
          if (validPaths.some(path => redirectTo.startsWith(path))) {
            finalRedirectPath = redirectTo;
          }
        } else if (profile) {
          // Role-based redirect if no specific redirect
          if (profile.role === 'super_admin') {
            finalRedirectPath = "/portal/super-admin";
          } else if (profile.role === 'property_manager') {
            finalRedirectPath = "/portal/manager";
          } else if (profile.role === 'accountant') {
            finalRedirectPath = "/portal/accountant";
          } else if (profile.role === 'technician') {
            finalRedirectPath = "/portal/technician";
          } else if (profile.role === 'proprietor') {
            finalRedirectPath = "/portal/proprietor";
          } else if (profile.role === 'caretaker') {
            finalRedirectPath = "/portal/caretaker";
          } else {
            finalRedirectPath = "/portal/tenant";
          }
          
          // Check if profile needs completion
          if (!profile.is_complete) {
            console.log("📝 Profile incomplete, redirecting to complete-profile");
            finalRedirectPath = "/complete-profile";
          }
        }

        console.log("📍 Final redirect path:", finalRedirectPath);
        setRedirectPath(finalRedirectPath);

        // Clear any stored redirects
        localStorage.removeItem('redirect_after_login');
        
        // Redirect after short delay for better UX
        setTimeout(() => {
          navigate(finalRedirectPath, { replace: true });
        }, 1500);

      } catch (error) {
        console.error("❌ Error in successful auth handler:", error);
        setStatus("error");
        setMessage("Failed to process your profile. Please contact support.");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000B29] via-[#003A75] to-[#0056A6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center">
          <motion.div
            animate={{ 
              rotate: status === "loading" ? 360 : 0,
              scale: status === "success" ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              rotate: { 
                duration: 1.5, 
                repeat: status === "loading" ? Infinity : 0, 
                ease: "linear" 
              },
              scale: status === "success" ? {
                duration: 0.5,
                times: [0, 0.5, 1]
              } : {}
            }}
            className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
              status === "loading" ? "bg-blue-500/20" : 
              status === "success" ? "bg-green-500/20" : 
              "bg-red-500/20"
            }`}
          >
            {status === "loading" ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : status === "success" ? (
              <motion.svg 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 text-green-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </motion.svg>
            ) : (
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </motion.div>

          <motion.h2 
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white mb-3"
          >
            {status === "loading" ? "Authenticating..." : 
             status === "success" ? "Success!" : "Authentication Failed"}
          </motion.h2>
          
          <p className="text-white/80 mb-6">
            {message}
          </p>

          {status === "loading" && (
            <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-full bg-white"
              />
            </div>
          )}

          {status === "success" && redirectPath && (
            <div className="text-white/60 text-sm mt-4">
              <p>Redirecting to: <span className="font-mono text-white/80">{redirectPath}</span></p>
            </div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <button
                onClick={() => navigate("/login")}
                className="w-full px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors font-medium"
              >
                Return to Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-white/60 text-sm text-center">
            Secured by Supabase Authentication
          </p>
          {import.meta.env.DEV && (
            <div className="mt-2 text-white/40 text-xs text-center">
              Mode: {import.meta.env.MODE} | Env: {import.meta.env.VITE_SUPABASE_URL ? "✅" : "❌"}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCallback;