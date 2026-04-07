// src/pages/auth/LoginPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle, Eye, EyeOff, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
    .font-auth { font-family: 'Poppins', 'Segoe UI', sans-serif; }
  `}</style>
);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { supabaseUser, isLoading: authLoading, getUserRole } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const mode = new URLSearchParams(location.search).get("mode");
    if (mode === "signup") {
      navigate("/register", { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (!authLoading && supabaseUser && isSuccess) {
      setTimeout(() => {
        const searchParams = new URLSearchParams(location.search);
        const redirect = searchParams.get("redirect");

        if (redirect) {
          navigate(redirect, { replace: true });
          return;
        }

        const userRole = getUserRole();
        let targetPath = "/profile";

        switch (userRole) {
          case "super_admin":
            targetPath = "/portal/super-admin";
            break;
          case "property_manager":
            targetPath = "/portal/manager";
            break;
          case "tenant":
            targetPath = "/portal/tenant";
            break;
          case "accountant":
            targetPath = "/portal/accountant";
            break;
          case "technician":
            targetPath = "/portal/technician";
                                 break;
          case "proprietor":
            targetPath = "/portal/proprietor";
            break;
          case "caretaker":
            targetPath = "/portal/caretaker";
            break;
          case "supplier":
            targetPath = "/portal/supplier";
            break;
          default:
            targetPath = "/profile";
        }

        navigate(targetPath, { replace: true });
      }, 2500);
    }
  }, [supabaseUser, authLoading, navigate, location.search, getUserRole, isSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!email || !password) {
        throw new Error("Credentials required.");
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("show-login-success-animation", "1");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      toast.success("Login successful! Redirecting...");
      setIsSuccess(true);
    } catch (loginError: any) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("show-login-success-animation");
      }
      setIsSubmitting(false);
      setError(loginError.message || "Invalid credentials.");
      toast.error(loginError.message || "Login failed");
    }
  };

  const helpRoute = email
    ? `/reset-password?email=${encodeURIComponent(email)}`
    : "/reset-password";

  return (
    <>
      <GlobalStyles />

      <div className="relative min-h-screen overflow-hidden bg-white font-auth subpixel-antialiased text-[#243041]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-12 top-16 h-52 w-52 rotate-45 rounded-[36px] bg-[#f0f4f8] shadow-sm" />
          <div className="absolute left-1/4 top-6 h-36 w-36 rotate-12 rounded-[30px] bg-[#f8fafc]" />
          <div className="absolute right-8 top-20 h-60 w-60 -rotate-12 rounded-[46px] bg-[#f1f5f9]" />
          <div className="absolute bottom-16 left-16 h-44 w-44 rotate-[28deg] rounded-[32px] bg-[#f4f7f9]" />
          <div className="absolute bottom-20 right-20 h-52 w-52 rotate-[38deg] rounded-[36px] bg-[#fdfdfd]" />
          <div className="absolute right-1/3 top-1/3 h-6 w-6 rounded-full bg-[#f1f5f9]" />
          <div className="absolute left-1/3 bottom-1/3 h-8 w-8 rounded-full bg-[#f0f4f8]" />
        </div>

        <div className="relative z-10 flex min-h-screen max-w-[1440px] mx-auto items-center justify-center gap-8 lg:gap-16 px-4 py-8 sm:px-6">
          
          {/* Left Side: The Image outside the form, mix-blend-multiply eliminates white borders */}
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="hidden lg:flex w-[550px] xl:w-[680px] shrink-0 justify-center -mt-20"
          >
            <img 
              src="/login.png" 
              alt="Login" 
              className="w-full h-auto object-contain mix-blend-multiply scale-110"
            />
          </motion.div>

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[860px] overflow-hidden border border-[#b7bcc3] bg-[#c8cbd1] shadow-[0_18px_55px_rgba(71,80,94,0.24)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 bg-[#bfc4cb] px-5 py-4 sm:px-7 border-[#a8aeb7]">
              <div className="flex items-center gap-3">
                <p className="text-[26px] font-bold leading-none text-[#111827] sm:text-[34px]">
                  Login
                  <span className="block text-[15px] font-normal text-[#4b5563] sm:ml-2 sm:inline sm:text-[20px]">
                    enter your credentials
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="h-8 min-w-[92px] rounded-xl bg-[#1fcf78] px-5 text-[11px] font-bold uppercase tracking-[0.04em] text-white shadow-sm"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="h-8 min-w-[92px] rounded-xl bg-white px-5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#4b5563] shadow-sm transition-colors hover:text-[#7a3ef2]"
                >
                  Sign Up
                </button>
              </div>
            </div>

            <form onSubmit={handleLogin} className="px-4 py-9 sm:px-10 md:px-14">
              <div className="mx-auto w-full max-w-[680px] space-y-5">
                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[130px_1fr] sm:gap-5">
                  <label
                    htmlFor="login-email"
                    className="text-[20px] font-semibold text-[#243041]"
                  >
                    Email:
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="h-11 w-full border border-[#b2b9c2] bg-[#eef1f4] px-4 text-[16px] text-[#1f2937] outline-none transition-colors focus:border-[#8e98a5]"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[130px_1fr] sm:gap-5">
                  <label
                    htmlFor="login-password"
                    className="text-[20px] font-semibold text-[#243041]"
                  >
                    Password:
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className="h-11 w-full border border-[#b2b9c2] bg-[#eef1f4] px-4 pr-11 text-[16px] text-[#1f2937] outline-none transition-colors focus:border-[#8e98a5]"
                      autoComplete={rememberMe ? "current-password" : "off"}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#748092] transition-colors hover:text-[#425166]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center pt-1">
                  <label className="inline-flex items-center gap-2 rounded border border-[#bfc6cf] bg-[#e9edf2] px-3 py-1.5 text-[13px] font-semibold text-[#506076]">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={() => setShowPassword((prev) => !prev)}
                      className="h-4 w-4 accent-[#8d98a7]"
                    />
                    Show password
                  </label>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border border-[#c2c8d0] bg-[#edf1f5] px-3 py-2 text-[14px] text-[#3b4c62]">
                  <label className="inline-flex items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 accent-[#18c673]"
                    />
                    Keep me signed in
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate(helpRoute)}
                    className="font-semibold text-[#3f638f] transition-colors hover:text-[#29486d]"
                  >
                    Need help signing in?
                  </button>
                </div>

                <div className="pt-3 text-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mx-auto inline-flex h-11 min-w-[190px] items-center justify-center bg-[#1fcf78] px-8 text-[16px] font-semibold leading-none text-white transition-colors hover:bg-[#17b567] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>

                <div
                  className={`mt-4 flex items-center justify-center gap-2 border px-4 py-2 text-center text-[18px] text-[#4b5f79] ${
                    error
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-[#c2c8d0] bg-[#edf1f5]"
                  }`}
                >
                  <span>{error || "Sign in to your account."}</span>
                  {!error && <X className="h-3 w-3 text-[#6f8096]" />}
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="rounded-lg border border-[#bcc3cc] bg-white/85 px-5 py-2 text-[18px] font-semibold text-[#5f6c7b] transition-colors hover:text-[#243041]"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
          ) : (
            <motion.div
              key="login-success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut", type: "spring", bounce: 0.4 }}
              className="flex w-full max-w-[500px] flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-[0_18px_55px_rgba(71,80,94,0.24)]"
            >
              <div className="relative mb-6">
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                  className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-[#22c55e]/10 text-[#22c55e]"
                >
                  <CheckCircle size={56} strokeWidth={2.5} />
                </motion.div>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ delay: 0.5, duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-[#22c55e]/20"
                />
              </div>
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-2 text-3xl font-extrabold text-[#111827]"
              >
                You Have Signed In Successfully
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8 font-semibold text-[#4b5563]"
              >
                Preparing your dashboard...
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-100"
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="h-full w-1/2 rounded-full bg-[#1a3252]"
                />
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default LoginPage;