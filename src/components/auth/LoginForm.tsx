// src/components/auth/LoginForm.tsx
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Key,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSwitchToForgot: () => void;
  onSuccess?: () => void;
  onGoogleLogin?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToSignup,
  onSwitchToForgot,
  onSuccess,
  onGoogleLogin,
}) => {
  const { signIn, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trim(), // Trim whitespace
    }));
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoggingIn(true);
    setError("");
    setSuccess("");

    try {
      console.log("🔐 Attempting login with:", formData.email);

      // Use the updated signIn from AuthContext
      const result = await signIn(formData.email, formData.password);

      if (result.success) {
        setSuccess("Login successful! Redirecting...");

        // Call onSuccess callback
        onSuccess?.();

        // Handle redirect after successful login
        setTimeout(() => {
          const searchParams = new URLSearchParams(location.search);
          const redirect = searchParams.get("redirect");
          if (redirect) {
            navigate(redirect, { replace: true });
          }
          // Note: AuthProvider will handle the main redirect based on role
        }, 1500);
      } else {
        // Handle error from signIn
        let errorMessage = result.error || "Login failed. Please try again.";

        // Improve error messages for better UX
        if (errorMessage.includes("Invalid email or password")) {
          errorMessage =
            "Invalid email or password. Please check your credentials.";
        } else if (errorMessage.includes("Email not confirmed")) {
          errorMessage = "Please verify your email address before logging in.";
        } else if (errorMessage.includes("No account found")) {
          errorMessage =
            "No account found with this email. Please sign up first.";
        } else if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("too many attempts")
        ) {
          errorMessage =
            "Too many attempts. Please try again in a few minutes.";
        }

        setError(errorMessage);
      }
    } catch (error: any) {
      console.error("❌ Login error:", error);

      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setIsLoggingIn(true);

      console.log("🔗 Initiating Google OAuth...");

      // Import supabase dynamically to avoid import issues
      const { supabase } = await import("@/integrations/supabase/client");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }

      // The OAuth flow will redirect, so we don't need to do anything else here
      console.log("✅ Google OAuth initiated successfully");
    } catch (err: any) {
      console.error("❌ Google login error:", err);

      let errorMessage =
        "Google login is currently unavailable. Please try again later.";
      if (err.message) {
        if (err.message.includes("popup")) {
          errorMessage =
            "Pop-up was blocked. Please allow pop-ups for this site or try the email login.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setIsLoggingIn(false);

      // Fallback to parent handler if provided
      if (onGoogleLogin) {
        onGoogleLogin();
      }
    }
  };

  const handleForgotPassword = () => {
    if (!formData.email) {
      setError("Please enter your email address first");
      return;
    }

    // Navigate to reset password with email pre-filled
    navigate(`/reset-password?email=${encodeURIComponent(formData.email)}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoggingIn && !authLoading) {
      handleLogin(e as any);
    }
  };

  const isLoading = authLoading || isLoggingIn;

  return (
    <div className="flex-1 flex flex-col px-8 pt-32 bg-white h-full relative">
      <div className="mb-6 relative z-0">
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-classy text-[#1a1a1a]"
        >
          Welcome back.
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-gray-400 mt-2 font-light"
        >
          Sign in to access your portal
        </motion.p>
      </div>

      <form
        onSubmit={handleLogin}
        onKeyPress={handleKeyPress}
        className="space-y-6 relative z-0"
      >
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-red-600 text-xs font-medium">Login Failed</p>
                <p className="text-red-500 text-xs mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-green-600 text-xs font-medium">Success!</p>
                <p className="text-green-500 text-xs mt-1">{success}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* EMAIL FIELD */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative group">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail size={18} />
            </div>
            <Input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              autoComplete="email"
              className="
                h-12 w-full
                bg-transparent 
                border-0 border-b-[1px] border-gray-200 
                rounded-none 
                pl-8 pr-0 py-2
                text-base text-gray-800 font-light
                placeholder:text-gray-300 placeholder:font-extralight
                focus:border-black focus:border-b-[1.5px]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-500 ease-in-out
                shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0
              "
            />
          </div>
        </motion.div>

        {/* PASSWORD FIELD */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative group">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">
              <Key size={18} />
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              autoComplete="current-password"
              className="
                h-12 w-full
                bg-transparent 
                border-0 border-b-[1px] border-gray-200 
                rounded-none 
                pl-8 pr-10 py-2
                text-base text-gray-800 font-light
                placeholder:text-gray-300 placeholder:font-extralight
                focus:border-black focus:border-b-[1.5px]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-500 ease-in-out
                shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0
              "
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={showPassword ? "Hide password" : "Show password"}
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
              disabled={isLoading}
              className="w-4 h-4 rounded border-gray-300 text-[#0056A6] focus:ring-[#0056A6] focus:ring-2 focus:ring-offset-0 disabled:opacity-50"
              defaultChecked
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 text-xs text-gray-600 select-none"
            >
              Remember me
            </label>
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={isLoading}
            className="text-xs text-[#0056A6] hover:underline hover:text-[#004080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={isLoading}
            className="
              w-full h-12 
              bg-[#1a1a1a] hover:bg-black 
              text-white font-medium text-xs 
              tracking-[0.15em] uppercase 
              rounded-full 
              flex items-center justify-center gap-2
              transition-all duration-300 
              shadow-lg shadow-black/10 hover:shadow-black/20
              disabled:opacity-50 disabled:cursor-not-allowed
              transform hover:-translate-y-0.5 active:translate-y-0
            "
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <LogIn size={16} />
              </>
            )}
          </Button>

          {/* Google Login Button */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="outline"
            className="
              w-full h-12 
              bg-white hover:bg-gray-50
              border border-gray-200 hover:border-gray-300
              text-gray-700 font-medium text-xs tracking-wide 
              rounded-full 
              flex items-center justify-center gap-3 
              transition-all duration-300
              shadow-sm hover:shadow-md
              disabled:opacity-50 disabled:cursor-not-allowed
              transform hover:-translate-y-0.5 active:translate-y-0
            "
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

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToSignup}
                disabled={isLoading}
                className="text-[#0056A6] hover:text-[#004080] hover:underline font-medium transition-colors disabled:opacity-50"
              >
                Sign up
              </button>
            </p>
          </div>
        </motion.div>
      </form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-auto mb-6 text-center"
      >
        <p className="text-[9px] text-gray-300 font-medium tracking-widest">
          REALTORS KENYA
        </p>
      </motion.div>
    </div>
  );
};

export default LoginForm;
