import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Building, Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight,
  Battery, Wifi, Signal 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

// --- UI COMPONENTS ---

const BrandLogo = ({ width = "120", height = "120" }: { width?: string | number, height?: string | number }) => (
  <svg width={width} height={height} viewBox="0 0 200 200" className="drop-shadow-md">
    <defs>
      <linearGradient id="grad-gold-reg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#B59325" />
      </linearGradient>
    </defs>
    <path fill="url(#grad-gold-reg)" d="M110 90 V170 L160 150 V70 L110 90 Z" />
    <path fill="#1F2937" d="M160 70 L180 80 V160 L160 150 Z" />
    <path fill="url(#grad-gold-reg)" d="M30 150 V50 L80 20 V120 L30 150 Z" />
    <path fill="#8A7D55" d="M80 20 L130 40 V140 L80 120 Z" />
    <g fill="#FFFFFF">
      <path d="M85 50 L100 56 V86 L85 80 Z" />
      <path d="M85 90 L100 96 V126 L85 120 Z" />
      <path d="M45 60 L55 54 V124 L45 130 Z" />
      <path d="M120 130 L140 122 V152 L120 160 Z" />
    </g>
  </svg>
);

const PortalLoader = () => {
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
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white"
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
        <div className="mt-3 text-[10px] font-medium tracking-[0.2em] text-slate-400 uppercase font-sans">
          Creating Account
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN PAGE COMPONENT ---

const RegisterPage = () => {
  const navigate = useNavigate();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --- LOGIC ---
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "tenant",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedName = formData.fullName.trim();
    const trimmedPhone = formData.phone.trim();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Name validation
    if (!trimmedName || trimmedName.length < 2) {
      toast.error("Please enter a valid full name (at least 2 characters)");
      return;
    }

    // Phone validation (basic)
    if (!trimmedPhone || trimmedPhone.length < 7) {
      toast.error("Please enter a valid phone number");
      return;
    }

    // Password validation
    if (!formData.password || formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Password strength check
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    if (formData.password.length < 8 && (!hasUpperCase || !hasNumber)) {
      toast.error("Password should be at least 8 characters or contain uppercase and numbers");
    }

    setLoading(true);

    try {
      // Step 1: Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify?email=${encodeURIComponent(trimmedEmail)}`,
          data: {
            full_name: trimmedName,
            phone: trimmedPhone,
          },
        },
      });

      if (authError) {
        // Handle specific auth errors
        if (authError.message.includes("already registered")) {
          throw new Error("This email is already registered. Please log in or use a different email.");
        }
        throw new Error(authError.message || "Failed to create account");
      }

      if (!authData.user) {
        throw new Error("Account creation failed. Please try again.");
      }

      // Step 2: Create profile in database
      const { data: profileResult, error: profileError } = await supabase.rpc(
        "create_user_profile",
        {
          p_user_id: authData.user.id,
          p_email: trimmedEmail,
          p_first_name: trimmedName.split(" ")[0],
          p_last_name: trimmedName.split(" ").slice(1).join(" ") || "",
          p_phone: trimmedPhone,
          p_role: formData.role,
          p_status: "active", // Start as active, email confirmed after link click
        }
      );

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Profile creation failed, but auth succeeded - log user out
        await supabase.auth.signOut();
        throw new Error("Failed to create user profile. Please contact support.");
      }

      if (profileResult && profileResult.length > 0 && !profileResult[0].success) {
        await supabase.auth.signOut();
        throw new Error(profileResult[0].message || "Failed to complete registration");
      }

      toast.success("Account created! Please check your email to confirm your address.");
      setIsSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-white flex items-center justify-center overflow-hidden font-sans">
      
      <style>
        {`
          /* Custom Scrollbar */
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-50 via-white to-gray-100 opacity-80 pointer-events-none" />

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <PortalLoader key="portal" />
        ) : (
          /* RESPONSIVE DEVICE CONTAINER */
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
              
              {/* --- 1. IPHONE PHYSICAL BUTTONS (Mobile Only) --- */}
              <div className="md:hidden">
                <div className="absolute -left-[3px] top-28 w-[3px] h-7 bg-gray-500 rounded-l-md" /> {/* Mute */}
                <div className="absolute -left-[3px] top-44 w-[3px] h-14 bg-gray-500 rounded-l-md" /> {/* Vol Up */}
                <div className="absolute -left-[3px] top-60 w-[3px] h-14 bg-gray-500 rounded-l-md" /> {/* Vol Down */}
                <div className="absolute -right-[3px] top-40 w-[3px] h-20 bg-gray-500 rounded-r-md" /> {/* Power */}
              </div>

              {/* --- 2. FOLD PHYSICAL BUTTONS (Desktop Only) --- */}
              <div className="hidden md:block">
                <div className="absolute -right-[3px] top-32 w-[3px] h-10 bg-gray-500 rounded-r-md" />
                <div className="absolute -right-[3px] top-48 w-[3px] h-14 bg-gray-500 rounded-r-md" />
              </div>

              {/* --- 3. FOLD HINGE (Desktop Only) --- */}
              <div className="hidden md:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent z-40 pointer-events-none opacity-30" />

              {/* --- INNER BEZEL & SCREEN --- */}
              <div className="relative w-full h-full bg-black overflow-hidden flex flex-col transition-all duration-700
                              rounded-[50px] border-[8px] border-[#1a1a1a] /* Mobile Radius */
                              md:rounded-[26px] md:border-[6px]             /* Desktop Radius */
              ">
                
                {/* --- 4. DYNAMIC ISLAND (Mobile Only) --- */}
                <div className="md:hidden absolute top-0 w-full h-14 z-50 flex justify-center items-start pt-3 pointer-events-none">
                   <div className="w-[120px] h-[35px] bg-black rounded-full flex items-center justify-end pr-4">
                      <div className="w-3 h-3 rounded-full bg-[#1a1a1a] shadow-[inset_0_0_4px_rgba(255,255,255,0.1)]" />
                   </div>
                </div>

                {/* --- 5. PUNCH HOLE CAMERA (Desktop Only) --- */}
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
                <div className="flex-1 bg-white relative w-full h-full flex flex-col px-6 md:px-8 pb-8 pt-4 overflow-y-auto no-scrollbar">
                  
                  {/* Header */}
                  <div className="text-center mb-6 md:mb-8 flex-shrink-0 mt-4 md:mt-0">
                    <div className="flex justify-center mb-4">
                      <BrandLogo width={40} height={40} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                      Create Account
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                      Join our exclusive property network
                    </p>
                  </div>

                  {/* FORM 
                      - Mobile: grid-cols-1 (Standard vertical stack)
                      - Desktop: grid-cols-2 (Side by side for Fold)
                  */}
                  <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 md:gap-y-5">
                    
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Full Name</Label>
                      <div className="relative group">
                        <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors">
                          <User className="h-4 w-4" />
                        </div>
                        <Input
                          id="fullName"
                          name="fullName"
                          type="text"
                          placeholder="John Kamau"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 rounded-xl transition-all font-medium text-slate-900"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Phone</Label>
                      <div className="relative group">
                        <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors">
                          <Phone className="h-4 w-4" />
                        </div>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+254 712..."
                          value={formData.phone}
                          onChange={handleChange}
                          className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 rounded-xl transition-all font-medium text-slate-900"
                          required
                        />
                      </div>
                    </div>

                    {/* Email (Spans 2 cols on desktop) */}
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Email Address</Label>
                      <div className="relative group">
                        <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors">
                          <Mail className="h-4 w-4" />
                        </div>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 rounded-xl transition-all font-medium text-slate-900"
                          required
                        />
                      </div>
                    </div>

                    {/* Role Selection (Spans 2 cols on desktop) */}
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="role" className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">I am a</Label>
                      <Select 
                        value={formData.role} 
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 rounded-xl font-medium text-slate-900 pl-3">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tenant">Tenant / Looking to Rent</SelectItem>
                          <SelectItem value="property_manager">Property Manager</SelectItem>
                          <SelectItem value="property_owner">Property Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Password</Label>
                      <div className="relative group">
                        <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors">
                          <Lock className="h-4 w-4" />
                        </div>
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleChange}
                          className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 rounded-xl transition-all font-medium text-slate-900"
                          required
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Confirm</Label>
                      <div className="relative group">
                        <div className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors">
                          <Lock className="h-4 w-4" />
                        </div>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 rounded-xl transition-all font-medium text-slate-900"
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

                    {/* Submit Button */}
                    <div className="md:col-span-2 pt-2 md:pt-4">
                      <Button type="submit" className="w-full h-12 bg-navy hover:bg-[#002855] text-white rounded-xl font-medium text-sm shadow-lg shadow-navy/20 group" disabled={loading}>
                        {loading ? "Creating..." : <span className="flex items-center gap-2">Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"/></span>}
                      </Button>
                    </div>

                  </form>

                  {/* Footer */}
                  <div className="mt-8 mb-4 md:mt-auto pt-6 text-center space-y-4 flex-shrink-0">
                    <p className="text-xs text-slate-500">
                      Already have an account? <Link to="/login" className="text-slate-900 font-bold hover:underline">Sign in</Link>
                    </p>
                    <div className="border-t border-slate-100 pt-3">
                       <p className="text-[10px] text-slate-400 leading-tight">
                         By registering, you agree to our <Link to="/terms" className="text-slate-600 hover:underline">Terms</Link> and <Link to="/privacy" className="text-slate-600 hover:underline">Privacy Policy</Link>
                       </p>
                    </div>
                  </div>

                </div>
                {/* --- END SCREEN CONTENT --- */}

                {/* Home Indicator - Bottom Bar */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 md:w-48 h-[5px] md:h-[4px] bg-black/20 backdrop-blur-sm rounded-full z-50" />
              </div>
              
              {/* Reflection */}
              <div className="absolute inset-0 rounded-[55px] md:rounded-[30px] pointer-events-none z-[60] shadow-[inset_0_0_40px_rgba(255,255,255,0.05)] opacity-50 transition-all duration-700">
                 <div className="absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/5 to-transparent mix-blend-multiply" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegisterPage;