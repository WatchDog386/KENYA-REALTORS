// src/pages/AuthPage.tsx
// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Battery,
  Wifi,
  Signal,
  Fingerprint,
  Lock,
  ChevronRight,
  Eye,
  EyeOff,
  Mail,
  Key,
  LogIn,
  UserPlus,
  AlertCircle,
  Home,
  Smartphone,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, resendVerificationEmail, user } = useAuth();

  const [powerState, setPowerState] = useState<"off" | "booting" | "on">("off");
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">(
    "signin"
  );
  const [authLoading, setAuthLoading] = useState(false);
  const [time, setTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showResendButton, setShowResendButton] = useState(false);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (user) {
      handlePostLoginRedirect(user);
    }
  }, [user]);

  // Time update
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // 🔑 ROLE-BASED REDIRECT
  const handlePostLoginRedirect = (user: any) => {
    const role =
      user.role ||
      (user.email === "fanteskorri36@gmail.com" ? "admin" : "tenant");
    const redirectPath = role === "admin" ? "/portal/admin" : "/portal/tenant";
    navigate(redirectPath, { replace: true });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleUnlock = () => {
    if (powerState === "off") {
      setPowerState("booting");
      setTimeout(() => setPowerState("on"), 2200);
    }
  };

  const switchAuthMode = (mode: "signin" | "signup" | "forgot") => {
    setAuthMode(mode);
    setError("");
    setSuccess("");
    setShowResendButton(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError("");
    setSuccess("");

    try {
      await signIn(formData.email, formData.password);
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Invalid login credentials");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError("");
    setSuccess("");
    setShowResendButton(false);

    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required");
      setAuthLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setAuthLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setAuthLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setAuthLoading(false);
      return;
    }

    try {
      await signUp(formData.email, formData.password, {
        full_name: formData.name,
      });
      setSuccess(
        `Account created successfully!\nPlease check your email for the verification link.\nYou must verify before signing in.`
      );
      setShowResendButton(true);
    } catch (error: any) {
      console.error("Sign up error:", error);
      if (
        error.message?.includes("already registered") ||
        error.message?.includes("already exists")
      ) {
        setError("This email is already registered. Please sign in instead.");
      } else if (error.message?.includes("invalid email")) {
        setError("Please enter a valid email address.");
      } else if (error.message?.includes("rate limit")) {
        setError("Too many attempts. Please try again later.");
      } else {
        setError(error.message || "Failed to create account.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setError("Please enter your email address first");
      return;
    }
    setAuthLoading(true);
    setError("");
    setSuccess("");

    try {
      await resendVerificationEmail(formData.email);
      setSuccess("Verification email sent! Check your inbox.");
      setShowResendButton(false);
    } catch (error: any) {
      console.error("Resend verification error:", error);
      setError(error.message || "Failed to resend verification email");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError("");
    setSuccess("");

    if (!formData.email) {
      setError("Please enter your email address");
      setAuthLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );
      if (error) throw error;
      setSuccess("Password reset email sent! Check your inbox.");
      setFormData((prev) => ({ ...prev, email: "" }));
    } catch (error: any) {
      console.error("Forgot password error:", error);
      setError(error.message || "Failed to send reset email");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google login error:", err);
      setError("Google login failed. Please try again.");
    }
  };

  // --- INJECT FONTS ---
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      .font-modern { font-family: 'Space Grotesk', sans-serif; }
      .font-clean { font-family: 'Poppins', sans-serif; }
      body { overflow: hidden; }
      input:focus { outline: none !important; box-shadow: none !important; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.2); border-radius: 3px; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  const renderAuthForm = () => {
    switch (authMode) {
      case "signup":
        return (
          <form onSubmit={handleSignUp} className="space-y-6 relative z-0">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-300 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-700" />
                  <p className="text-red-700 text-xs font-medium">{error}</p>
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-50 border border-green-300 rounded-xl"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
                  <p className="text-green-700 text-xs font-medium whitespace-pre-line">
                    {success}
                  </p>
                </div>
                {showResendButton && (
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={authLoading}
                      className="text-xs text-green-800 hover:text-green-900 hover:underline transition-colors font-medium"
                    >
                      Didn't receive the email? Resend
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* NAME */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-700">
                  <Home size={18} />
                </div>
                <Input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="h-12 w-full bg-transparent border-0 border-b-[1px] border-gray-300 rounded-none pl-8 pr-0 py-2 text-base text-gray-900 font-clean font-medium placeholder:text-gray-700 placeholder:font-light focus:border-[#0056A6] focus:border-b-[1.5px] transition-all duration-500 ease-in-out shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </motion.div>

            {/* EMAIL */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500">
                  <Mail size={18} />
                </div>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="h-12 w-full bg-transparent border-0 border-b-[1px] border-gray-300 rounded-none pl-8 pr-0 py-2 text-base text-gray-900 font-clean font-medium placeholder:text-gray-700 placeholder:font-light focus:border-[#0056A6] focus:border-b-[1.5px] transition-all duration-500 ease-in-out shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </motion.div>

            {/* PASSWORD */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-700">
                  <Key size={18} />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password (min. 6 characters)"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="h-12 w-full bg-transparent border-0 border-b-[1px] border-gray-300 rounded-none pl-8 pr-10 py-2 text-base text-gray-900 font-clean font-medium placeholder:text-gray-700 placeholder:font-light focus:border-[#0056A6] focus:border-b-[1.5px] transition-all duration-500 ease-in-out shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-700 hover:text-[#0056A6] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            {/* CONFIRM PASSWORD */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-700">
                  <Key size={18} />
                </div>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="h-12 w-full bg-transparent border-0 border-b-[1px] border-gray-300 rounded-none pl-8 pr-10 py-2 text-base text-gray-900 font-clean font-medium placeholder:text-gray-700 placeholder:font-light focus:border-[#0056A6] focus:border-b-[1.5px] transition-all duration-500 ease-in-out shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-700 hover:text-[#0056A6] transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="space-y-4 pt-2"
            >
              <Button
                type="submit"
                disabled={authLoading}
                className="w-full h-12 bg-gradient-to-r from-[#0056A6] to-[#0077CC] hover:from-[#004080] hover:to-[#0056A6] text-white font-modern font-semibold text-xs tracking-wider uppercase rounded-xl flex items-center justify-between px-6 transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-blue-500/30"
              >
                <span>
                  {authLoading ? "Creating Account..." : "Create Account"}
                </span>
                {!authLoading && <UserPlus size={16} />}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchAuthMode("signin")}
                  className="text-xs text-gray-700 hover:text-[#0056A6] transition-colors font-clean font-medium"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </motion.div>
          </form>
        );

      case "forgot":
        return (
          <form
            onSubmit={handleForgotPassword}
            className="space-y-6 relative z-0"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-300 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-700" />
                  <p className="text-red-700 text-xs font-medium">{error}</p>
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-50 border border-green-300 rounded-xl"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
                  <p className="text-green-700 text-xs font-medium">{success}</p>
                </div>
              </motion.div>
            )}

            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-[#0056A6]/20 to-[#0077CC]/20 rounded-full flex items-center justify-center">
                <Key className="w-6 h-6 text-[#0056A6]" />
              </div>
              <h3 className="text-lg font-modern font-semibold text-gray-900 mb-2">
                Reset Password
              </h3>
              <p className="text-sm text-gray-700 font-clean font-medium">
                Enter your email for reset instructions
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-700">
                  <Mail size={18} />
                </div>
                <Input
                  type="email"
                  name="email"
                  placeholder="Your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="h-12 w-full bg-transparent border-0 border-b-[1px] border-gray-300 rounded-none pl-8 pr-0 py-2 text-base text-gray-900 font-clean font-medium placeholder:text-gray-700 placeholder:font-light focus:border-[#0056A6] focus:border-b-[1.5px] transition-all duration-500 ease-in-out shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="space-y-4 pt-2"
            >
              <Button
                type="submit"
                disabled={authLoading}
                className="w-full h-12 bg-gradient-to-r from-[#0056A6] to-[#0077CC] hover:from-[#004080] hover:to-[#0056A6] text-white font-modern font-semibold text-xs tracking-wider uppercase rounded-xl flex items-center justify-between px-6 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
              >
                <span>
                  {authLoading ? "Sending..." : "Send Reset Instructions"}
                </span>
                {!authLoading && <Smartphone size={16} />}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchAuthMode("signin")}
                  className="text-xs text-gray-700 hover:text-[#0056A6] transition-colors font-clean font-medium"
                >
                  Back to sign in
                </button>
              </div>
            </motion.div>
          </form>
        );

      default: // signin
        return (
          <form onSubmit={handleLogin} className="space-y-6 relative z-0">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-300 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-700" />
                  <p className="text-red-700 text-xs font-medium">{error}</p>
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-50 border border-green-300 rounded-xl"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
                  <p className="text-green-700 text-xs font-medium">{success}</p>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500">
                  <Mail size={18} />
                </div>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="h-12 w-full "
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500">
                  <Key size={18} />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="h-12 w-full bg-transparent border-0 border-b-[1px] border-gray-300 rounded-none pl-8 pr-10 py-2 text-base text-gray-900 font-clean font-medium placeholder:text-gray-700 placeholder:font-light focus:border-[#0056A6] focus:border-b-[1.5px] transition-all duration-500 ease-in-out shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-700 hover:text-[#0056A6] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="w-4 h-4 rounded border-gray-300 text-[#0056A6] focus:ring-[#0056A6]"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 text-xs text-gray-700 font-clean font-medium"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => switchAuthMode("forgot")}
                className="text-xs text-[#0056A6] hover:underline font-clean font-medium"
              >
                Forgot password?
              </button>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-4 pt-2"
            >
              <Button
                type="submit"
                disabled={authLoading}
                className="w-full h-12 bg-gradient-to-r from-[#0056A6] to-[#0077CC] hover:from-[#004080] hover:to-[#0056A6] text-white font-modern font-semibold text-xs tracking-wider uppercase rounded-xl flex items-center justify-between px-6 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
              >
                <span>{authLoading ? "Signing In..." : "Sign In"}</span>
                {!authLoading && <LogIn size={16} />}
              </Button>

              {/* GOOGLE BUTTON */}
              <Button
                type="button"
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full h-12 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 font-clean font-medium text-xs tracking-wide rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchAuthMode("signup")}
                  className="text-xs text-gray-700 hover:text-[#0056A6] transition-colors font-clean font-medium"
                >
                  Don't have an account? Sign up
                </button>
              </div>
            </motion.div>
          </form>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col lg:flex-row items-center justify-center lg:gap-24 overflow-hidden font-clean">
      {/* DEVICE */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-20 flex-shrink-0 flex items-center justify-center w-full lg:w-auto"
      >
        <div className="pointer-events-auto relative bg-gradient-to-br from-gray-900 to-black shadow-2xl mx-auto w-[90vw] h-[85dvh] max-w-[400px] max-h-[850px] border-[10px] border-gray-900 rounded-[2.5rem] lg:w-[400px] lg:h-[800px] lg:border-[12px] lg:rounded-[3rem]">
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent rounded-r-[2.2rem] lg:rounded-r-[2.8rem] pointer-events-none z-20" />
          <div className="absolute -left-[14px] top-32 w-[4px] h-10 bg-gray-800 rounded-l-md" />
          <div className="absolute -left-[14px] top-48 w-[4px] h-16 bg-gray-800 rounded-l-md" />
          <div className="absolute -right-[14px] top-40 w-[4px] h-24 bg-gray-800 rounded-r-md" />

          <div className="w-full h-full bg-gradient-to-br from-white via-gray-50 to-white rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden flex flex-col relative shadow-inner">
            <div
              className={`absolute top-0 w-full px-6 pt-5 flex justify-between items-center z-30 transition-colors duration-700 ${
                powerState === "off" ? "text-white/40" : "text-gray-800"
              }`}
            >
              <span className="text-xs font-modern font-semibold">{time}</span>
              <div className="flex gap-1.5 opacity-90">
                <Signal size={13} />
                <Wifi size={13} />
                <Battery size={15} />
              </div>
            </div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-20 pointer-events-none" />

            <AnimatePresence mode="wait">
              {powerState === "off" && (
                <motion.div
                  key="locked"
                  exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-between py-20 cursor-pointer group"
                  onClick={handleUnlock}
                >
                  <div className="mt-10 text-center">
                    <Lock className="w-6 h-6 text-white/40 mx-auto mb-2" />
                    <span className="text-white/40 text-[10px] tracking-widest uppercase font-modern">
                      Locked
                    </span>
                  </div>
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.4, 0.1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 bg-white rounded-full blur-md"
                    />
                    <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md relative z-10">
                      <Fingerprint
                        className="w-8 h-8 text-white/90"
                        strokeWidth={1}
                      />
                    </div>
                  </div>
                  <motion.div
                    className="text-center space-y-2"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <p className="text-white text-4xl font-modern font-bold tracking-wide">
                      Realtors
                    </p>
                    <p className="text-white/80 text-[10px] uppercase tracking-[0.2em] font-modern font-semibold">
                      Touch to Unlock
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {powerState === "booting" && (
                <motion.div
                  key="booting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute inset-0 bg-white flex flex-col items-center justify-center"
                >
                  <motion.img
                    src="/realtor.jpg"
                    alt="Realtor Logo"
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="w-56 h-auto object-contain mb-10"
                  />
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ height: [10, 25, 10] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-1 bg-[#0056A6] rounded-full"
                    />
                    <motion.div
                      animate={{ height: [10, 25, 10] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      className="w-1 bg-[#0077CC] rounded-full"
                    />
                    <motion.div
                      animate={{ height: [10, 25, 10] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      className="w-1 bg-[#004080] rounded-full"
                    />
                  </div>
                </motion.div>
              )}

              {powerState === "on" && (
                <motion.div
                  key="unlocked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="flex-1 flex flex-col px-8 pt-32 bg-gradient-to-br from-white via-gray-50 to-white h-full relative"
                >
                  <div className="mb-6 relative z-0">
                    <motion.h2
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-modern font-bold text-gray-900"
                    >
                      {authMode === "signin"
                        ? "Welcome back."
                        : authMode === "signup"
                        ? "Create Account."
                        : "Reset Password."}
                    </motion.h2>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm text-gray-700 mt-2 font-clean font-medium"
                    >
                      {authMode === "signin"
                        ? "Sign in to access your portal"
                        : authMode === "signup"
                        ? "Join our community today"
                        : "We'll help you regain access"}
                    </motion.p>
                  </div>
                  {renderAuthForm()}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-auto mb-6 text-center"
                  >
                    <p className="text-[10px] text-gray-400 font-modern font-semibold tracking-widest">
                      REALTORS KENYA
                    </p>
                  </motion.div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* RIGHT TEXT */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        className="hidden lg:flex flex-col items-start max-w-xl"
      >
        <div className="flex items-center gap-3 mb-10">
          <div className="h-[1px] w-12 bg-gradient-to-r from-[#0056A6] to-[#0077CC]"></div>
          <span className="text-xs font-modern font-bold tracking-[0.2em] text-[#0056A6] uppercase">
            Est. 2024
          </span>
        </div>
        <h1 className="text-6xl font-modern font-bold text-gray-950 leading-none mb-8 tracking-tight whitespace-nowrap">
          Realtors Kenya<span className="text-[#0056A6]">.</span>
        </h1>
        <div className="space-y-6 mb-12 pl-4 border-l-2 border-gray-300">
          <p className="text-3xl font-modern font-semibold text-gray-900 italic">
            "Your gateway to premium properties."
          </p>
          <p className="text-sm font-clean text-gray-700 leading-7 font-medium max-w-md">
            Discover, rent, and manage properties with ease. Experience seamless
            property management powered by cutting-edge technology and
            exceptional service.
          </p>
        </div>
        {powerState === "off" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex items-center gap-4 group cursor-pointer"
            onClick={handleUnlock}
          >
            <div className="w-12 h-12 rounded-full border border-gray-400 flex items-center justify-center group-hover:border-[#0056A6] group-hover:bg-gradient-to-r from-[#0056A6] to-[#0077CC] transition-all duration-300">
              <Fingerprint
                size={20}
                className="text-gray-600 group-hover:text-white transition-colors"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-modern font-bold uppercase tracking-widest text-gray-900">
                Touch Device
              </span>
              <span className="text-[10px] text-gray-700 font-clean font-medium">
                to begin session
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AuthPage;
