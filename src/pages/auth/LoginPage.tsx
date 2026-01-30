// src/pages/auth/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // Direct import for login action
import { useAuth } from "@/contexts/AuthContext"; // Context for session monitoring
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Battery, Wifi, Signal, 
  Eye, EyeOff, Mail, Lock, ArrowRight, UserCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- 1. UI COMPONENT: The Brand Logo ---
const BrandLogo = ({ width = "120", height = "120" }: { width?: string | number, height?: string | number }) => (
  <svg width={width} height={height} viewBox="0 0 200 200" className="drop-shadow-md">
    <defs>
      <linearGradient id="grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#B59325" />
      </linearGradient>
    </defs>
    <path fill="url(#grad-gold)" d="M110 90 V170 L160 150 V70 L110 90 Z" />
    <path fill="#1F2937" d="M160 70 L180 80 V160 L160 150 Z" />
    <path fill="url(#grad-gold)" d="M30 150 V50 L80 20 V120 L30 150 Z" />
    <path fill="#8A7D55" d="M80 20 L130 40 V140 L80 120 Z" />
    <g fill="#FFFFFF">
      <path d="M85 50 L100 56 V86 L85 80 Z" />
      <path d="M85 90 L100 96 V126 L85 120 Z" />
      <path d="M45 60 L55 54 V124 L45 130 Z" />
      <path d="M120 130 L140 122 V152 L120 160 Z" />
    </g>
  </svg>
);

// --- 2. UI COMPONENT: Portal Loader ---
const PortalLoader = ({ message = "Loading Workspace" }: { message?: string }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white rounded-[45px] md:rounded-[24px]"
    >
      <div className="w-64 flex flex-col items-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <BrandLogo width={60} height={60} />
        </motion.div>
        <div className="w-full h-[2px] bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-slate-900"
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>
        <div className="mt-3 text-[10px] font-medium tracking-[0.2em] text-slate-400 uppercase font-brand">
          {message}
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN PAGE COMPONENT ---
const LoginPage: React.FC = () => {
  // --- LOGIC SETUP (From File 1) ---
  const navigate = useNavigate();
  const location = useLocation();
  const { user, supabaseUser, isLoading: authLoading, getUserRole } = useAuth();
  
  // --- UI STATE (From File 2) ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Controls the PortalLoader animation
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --- CORE LOGIC: Handle Redirects & Roles (Preserved from File 1) ---
  useEffect(() => {
    // Only proceed if not loading auth context and we have a supabase user
    if (!authLoading && supabaseUser) {
      console.log("🔑 LoginPage: User authenticated, checking profile...");
      setIsSuccess(true); // Trigger the PortalLoader UI

      if (user) {
        // User has a profile - redirect to appropriate dashboard
        console.log("✅ LoginPage: User has profile, redirecting...");
        setRedirecting(true);

        setTimeout(() => {
          const searchParams = new URLSearchParams(location.search);
          const redirect = searchParams.get("redirect");

          if (redirect) {
            navigate(redirect, { replace: true });
          } else {
            // Determine redirect based on user role (Logic from File 1)
            const userRole = getUserRole();
            console.log(`🚀 LoginPage: User role determined: ${userRole}`);

            let targetPath = "/profile"; 

            switch (userRole) {
              case "super_admin": targetPath = "/portal/super-admin"; break;
              case "property_manager": targetPath = "/portal/manager"; break;
              case "tenant": targetPath = "/portal/tenant"; break;
              case "owner": targetPath = "/portal/owner"; break;
              default: targetPath = "/profile";
            }

            console.log(`🚀 LoginPage: Redirecting to ${targetPath}`);
            navigate(targetPath, { replace: true });
          }
        }, 800); // Slight delay to let the animation play
      } else {
        // User authenticated but no profile - Logic from File 1 (redirects to complete-profile)
        console.log("⚠️ LoginPage: User authenticated but no profile");
        // We will handle the UI for this inside the render, but we can also auto-redirect
        // depending on preference. File 1 auto-redirected after timeout.
        setTimeout(() => {
            navigate("/complete-profile", { replace: true });
        }, 800);
      }
    }
  }, [user, supabaseUser, authLoading, navigate, location.search, getUserRole]);

  // --- HANDLER: Login Submission ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const trimmedEmail = email.trim().toLowerCase();
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    // Password validation
    if (!password || password.length < 6) {
      toast.error("Please enter your password");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    try {
      // Attempt login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });

      if (loginError) {
        // Handle specific auth errors
        if (loginError.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        }
        if (loginError.message.includes("Email not confirmed")) {
          throw new Error("Please confirm your email before logging in. Check your inbox for a confirmation link.");
        }
        throw new Error(loginError.message || "Login failed");
      }

      if (!loginData.user) {
        throw new Error("Login failed. Please try again.");
      }

      // Check if user profile exists and is confirmed
      const { data: profileCheck, error: profileCheckError } = await supabase.rpc(
        "check_email_confirmed",
        { p_user_id: loginData.user.id }
      );

      if (profileCheckError) {
        console.error("Profile check error:", profileCheckError);
        throw new Error("Failed to verify user profile. Please contact support.");
      }

      toast.success("Login successful!");
      setIsSuccess(true);
      // We don't manually navigate here. 
      // The `useEffect` above detects the auth state change and handles the routing.
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.message || "Login failed. Please try again.";
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  // --- RENDER HELPERS ---
  const isProfilePending = supabaseUser && !user && !authLoading;

  return (
    <div className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-white flex items-center justify-center overflow-hidden font-brand">
      
      {/* Styles */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;800&display=swap');
          .font-brand { font-family: 'Inter', sans-serif; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-50 via-white to-gray-100 opacity-80 pointer-events-none" />

      {/* DEVICE CONTAINER */}
      <motion.div 
        key="device"
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex items-center justify-center p-4 w-full h-full"
      >
        <div 
          className="relative mx-auto bg-[#1a1a1a] transition-all duration-700 ease-in-out
            /* MOBILE (iPhone): Narrow, Taller, Rounder corners */
            w-[360px] xs:w-[380px] h-[780px] rounded-[55px]
            /* DESKTOP (Fold): Wide, Square-ish corners */
            md:w-[700px] md:h-[800px] md:rounded-[30px]
          "
          style={{
            boxShadow: `
              0 0 0 1px #333,
              0 0 0 4px #444,
              0 20px 50px -10px rgba(0,0,0,0.4),
              0 40px 80px -20px rgba(0,0,0,0.3)
            `
          }}
        >
          
          {/* --- PHYSICAL BUTTONS (Decorations) --- */}
          <div className="md:hidden">
            <div className="absolute -left-[3px] top-28 w-[3px] h-7 bg-gray-500 rounded-l-md" /> 
            <div className="absolute -left-[3px] top-44 w-[3px] h-14 bg-gray-500 rounded-l-md" /> 
            <div className="absolute -left-[3px] top-60 w-[3px] h-14 bg-gray-500 rounded-l-md" /> 
            <div className="absolute -right-[3px] top-40 w-[3px] h-20 bg-gray-500 rounded-r-md" /> 
          </div>
          <div className="hidden md:block">
            <div className="absolute -right-[3px] top-32 w-[3px] h-10 bg-gray-500 rounded-r-md" />
            <div className="absolute -right-[3px] top-48 w-[3px] h-14 bg-gray-500 rounded-r-md" />
          </div>

          {/* --- SCREEN CONTAINER --- */}
          <div className="relative w-full h-full bg-black overflow-hidden flex flex-col transition-all duration-700
                          rounded-[50px] border-[8px] border-[#1a1a1a] 
                          md:rounded-[26px] md:border-[6px]">
            
            {/* Dynamic Island / Punch Hole */}
            <div className="md:hidden absolute top-0 w-full h-14 z-50 flex justify-center items-start pt-3 pointer-events-none">
               <div className="w-[120px] h-[35px] bg-black rounded-full flex items-center justify-end pr-4">
                 <div className="w-3 h-3 rounded-full bg-[#1a1a1a] shadow-[inset_0_0_4px_rgba(255,255,255,0.1)]" />
               </div>
            </div>
            <div className="hidden md:block absolute top-4 left-1/2 translate-x-[150px] w-3 h-3 bg-black rounded-full z-50 pointer-events-none opacity-90" />

            {/* --- STATUS BAR --- */}
            <div className="w-full px-6 pt-3 pb-2 flex justify-between items-center z-40 select-none bg-white transition-all">
              <span className="text-black text-[14px] font-semibold">{time}</span>
              <div className="flex items-center gap-2 text-black">
                <Signal size={14} fill="currentColor" />
                <Wifi size={14} strokeWidth={2.5}/>
                <Battery size={18} className="ml-1"/>
              </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 bg-white relative w-full h-full flex flex-col justify-center px-6 md:px-16 overflow-y-auto no-scrollbar">
              
              <AnimatePresence mode="wait">
                
                {/* STATE 1: LOADING / REDIRECTING / SUCCESS */}
                {(authLoading || redirecting || isSuccess) ? (
                  <PortalLoader key="loader" message={redirecting ? "Redirecting..." : "Verifying Credentials"} />
                ) : 
                
                /* STATE 2: AUTHENTICATED BUT NO PROFILE (Almost There) */
                isProfilePending ? (
                  <motion.div 
                    key="no-profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm mx-auto text-center"
                  >
                     <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <UserCheck className="w-10 h-10 text-green-600" />
                     </div>
                     <h2 className="text-2xl font-brand font-bold text-gray-900 mb-2">Almost There!</h2>
                     <p className="text-gray-500 mb-6 text-sm">
                       Signed in as <span className="font-semibold text-gray-900">{supabaseUser.email}</span>
                     </p>
                     <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-6">
                      <p className="text-yellow-800 text-xs font-medium">
                        Your account needs a profile to continue. Redirecting you to setup...
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigate("/complete-profile")}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                    >
                      Complete Profile Now
                    </Button>
                    <Button
                      variant="ghost"
                      className="mt-4 text-xs text-gray-500 hover:text-gray-900"
                      onClick={async () => {
                         await supabase.auth.signOut();
                         window.location.reload();
                      }}
                    >
                      Sign Out
                    </Button>
                  </motion.div>
                ) : 
                
                /* STATE 3: LOGIN FORM (Default) */
                (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center">
                            <BrandLogo width={30} height={30} />
                        </div>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-brand font-semibold text-slate-900 tracking-tight">
                        Welcome Back
                      </h2>
                      <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                        Enter your credentials to access your account
                      </p>
                    </div>

                    {/* Form - Centered stack */}
                    <div className="w-full max-w-sm mx-auto">
                      <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Email</Label>
                          <div className="relative group">
                            <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors">
                              <Mail className="h-4 w-4" />
                            </div>
                            <Input
                              id="email"
                              type="email"
                              placeholder="john@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 h-11 bg-white border-2 border-slate-300 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 rounded-xl font-medium text-black placeholder:text-slate-400 transition-all"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between ml-1">
                            <Label htmlFor="password" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Password</Label>
                            <Link to="/reset-password" className="text-[10px] font-bold text-[#D4AF37] hover:underline">Forgot?</Link>
                          </div>
                          <div className="relative group">
                            <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors">
                              <Lock className="h-4 w-4" />
                            </div>
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 pr-10 h-11 !bg-white !text-black border-2 border-slate-300 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 rounded-xl font-medium placeholder:text-slate-400 transition-all dark:!bg-white dark:!text-black"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-12 bg-navy hover:bg-[#002855] text-white rounded-xl font-medium text-sm shadow-lg shadow-navy/20 mt-2 transition-all active:scale-[0.98]" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Signing in..." : <span className="flex items-center gap-2 justify-center">Sign In <ArrowRight className="w-4 h-4"/></span>}
                        </Button>
                      </form>

                      <div className="mt-8 text-center space-y-4">
                        <p className="text-xs text-slate-500">
                          Don't have an account? <Link to="/register" className="text-slate-900 font-bold hover:underline">Sign up</Link>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 md:w-48 h-[5px] md:h-[4px] bg-black/20 backdrop-blur-sm rounded-full z-50 transition-all" />
          </div>
          
          {/* Screen Reflection Overlay */}
          <div className="absolute inset-0 rounded-[55px] md:rounded-[30px] pointer-events-none z-[60] shadow-[inset_0_0_40px_rgba(255,255,255,0.05)] opacity-50 transition-all duration-700">
            <div className="absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/5 to-transparent mix-blend-multiply" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;