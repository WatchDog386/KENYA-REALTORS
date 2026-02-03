// src/pages/auth/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, CheckCircle, User, ArrowLeft } from "lucide-react";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    .font-technical { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  `}</style>
);

// Brand Colors
const BRAND = {
  PRIMARY: "#00356B",
  ACCENT: "#D85C2C",
  SUCCESS: "#86bc25",
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, supabaseUser, isLoading: authLoading, getUserRole } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");
    if (mode === "signup") setIsSignUp(true);
    else if (mode === "signin") setIsSignUp(false);
  }, [location.search]);

  useEffect(() => {
    if (!authLoading && supabaseUser && isSuccess) {
      setTimeout(() => {
        const searchParams = new URLSearchParams(location.search);
        const redirect = searchParams.get("redirect");
        if (redirect) {
          navigate(redirect, { replace: true });
        } else {
          const userRole = getUserRole();
          let targetPath = "/profile"; 
          switch (userRole) {
            case "super_admin": targetPath = "/portal/super-admin"; break;
            case "property_manager": targetPath = "/portal/manager"; break;
            case "tenant": targetPath = "/portal/tenant"; break;
            case "owner": targetPath = "/portal/owner"; break;
            default: targetPath = "/profile";
          }
          navigate(targetPath, { replace: true });
        }
      }, 2000);
    }
  }, [user, supabaseUser, authLoading, navigate, location.search, getUserRole, isSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (!email || !password) throw new Error("Credentials required.");
      
      // Sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      
      // Check if user is approved before allowing login
      if (signInData.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", signInData.user.id)
          .single();
        
        if (profileError) {
          console.warn("Profile fetch warning:", profileError);
        }
        
        // If pending (property manager or tenant), show approval message
        if (profile && profile.status === "pending") {
          console.log("⏳ User pending approval:", signInData.user.id);
          // Sign out user who isn't approved yet
          await supabase.auth.signOut();
          setIsSubmitting(false);
          const roleText = profile.role === "property_manager" ? "Property Manager" : "Tenant";
          setError(`Your ${roleText} account is pending approval. You'll be able to login once the administrator approves your registration.`);
          toast.error(`⏳ Approval Pending - Your ${roleText} account is being reviewed.`, { duration: 7000 });
          return;
        }
      }
      
      toast.success("Login successful!");
      setIsSuccess(true);
    } catch (error: any) {
      setIsSubmitting(false);
      setError(error.message || "Invalid credentials.");
      toast.error(error.message || "Login failed");
    }
  };

  return (
    <>
      <GlobalStyles />
      <div
        className="min-h-screen w-full flex items-center justify-center p-4 font-technical relative"
        style={{
          backgroundColor: "#1a232e",
        }}
      >

        {/* Back to Home Button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white hover:text-gray-200 transition-colors group"
          aria-label="Back to home"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back Home</span>
        </button>

        <div className="relative bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-[850px] min-h-[600px] md:min-h-[520px] z-10">
          
          {/* SIGN UP FORM */}
          <div
            className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-full md:w-1/2 z-[1] 
              ${isSignUp ? "opacity-100 z-[5] md:translate-x-full" : "opacity-0 z-[1] md:opacity-100 md:translate-x-0"}
            `}
          >
            <div
              className="bg-white flex flex-col items-center justify-center h-full px-6 sm:px-10 text-center"
            >
              <h1 className="font-bold text-2xl md:text-3xl mb-4" style={{ color: BRAND.PRIMARY }}>
                Create Account
              </h1>
              <span className="text-xs text-gray-500 mb-6 font-medium">
                Complete your registration
              </span>

              <button
                type="button"
                onClick={() => navigate("/register")}
                className="mt-6 text-white text-xs font-black py-3 px-12 rounded-md uppercase tracking-wider hover:brightness-110 transition-all shadow-sm"
                style={{ backgroundColor: BRAND.ACCENT }}
              >
                Go to Register Page
              </button>

              <div className="flex items-center gap-4 w-full my-6">
                <div className="h-px bg-gray-200 w-full"></div>
                <span className="text-xs font-bold text-gray-400">OR</span>
                <div className="h-px bg-gray-200 w-full"></div>
              </div>

              <div className="mt-6 md:hidden">
                <p className="text-xs text-gray-500">Already have an account?</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError("");
                  }}
                  className="text-xs font-bold uppercase mt-2 hover:underline"
                  style={{ color: BRAND.ACCENT }}
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>

          {/* SIGN IN FORM */}
          <div
            className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-full md:w-1/2 z-[2]
               ${isSignUp ? "opacity-0 z-[1] md:opacity-100 md:translate-x-full" : "opacity-100 z-[5] md:translate-x-0"}
            `}
          >
            <form
              className="bg-white flex flex-col items-center justify-center h-full px-6 sm:px-10 text-center"
              onSubmit={handleLogin}
            >
              <h1 className="font-bold text-2xl md:text-3xl mb-6" style={{ color: BRAND.PRIMARY }}>
                Sign In
              </h1>

              <div className="w-full space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className="bg-gray-50 border border-[#d1d5db] px-4 py-3 text-sm w-full outline-none rounded-lg focus:ring-1 focus:ring-[#00356B] focus:border-[#00356B] transition-all"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="bg-gray-50 border border-[#d1d5db] px-4 py-3 text-sm w-full outline-none rounded-lg focus:ring-1 focus:ring-[#00356B] focus:border-[#00356B] transition-all"
                />
              </div>

              <Link
                to="/reset-password"
                className="text-xs mt-3 hover:underline font-medium transition-colors"
                style={{ color: BRAND.PRIMARY }}
              >
                Forgot Password?
              </Link>

              {error && !isSignUp && (
                <p className="text-red-500 text-xs mt-2 font-bold">{error}</p>
              )}

              <button
                type="submit"
                className="mt-6 text-white text-xs font-black py-3 px-16 rounded-md uppercase tracking-wider hover:brightness-110 transition-all shadow-sm"
                disabled={isSubmitting}
                style={{ backgroundColor: BRAND.ACCENT }}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Login"}
              </button>

              <div className="flex items-center gap-4 w-full my-6">
                <div className="h-px bg-gray-200 w-full"></div>
                <span className="text-xs font-bold text-gray-400">OR</span>
                <div className="h-px bg-gray-200 w-full"></div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsSubmitting(true);
                    setError("");
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
                    if (error) throw error;
                  } catch (error: any) {
                    setError(error.message || "Google login failed");
                    setIsSubmitting(false);
                    toast.error(error.message || "Google login failed");
                  }
                }}
                disabled={isSubmitting}
                className="w-full text-gray-700 text-xs font-black py-3 px-12 rounded-md uppercase tracking-wider hover:brightness-95 transition-all shadow-sm border border-gray-300 bg-white flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                Continue with Google
              </button>

              <div className="mt-6 md:hidden">
                <p className="text-xs text-gray-500">Don't have an account?</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError("");
                  }}
                  className="text-xs font-bold uppercase mt-2 hover:underline"
                  style={{ color: BRAND.ACCENT }}
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>

          {/* OVERLAY PANEL (Desktop Only) */}
          <div
            className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100]
              ${isSignUp ? "-translate-x-full rounded-tr-[100px]" : "translate-x-0 rounded-tl-[100px]"}
            `}
          >
            <div
              className={`bg-[#00356B] text-white relative -left-full h-full w-[200%] transition-transform duration-700 ease-in-out
                ${isSignUp ? "translate-x-1/2" : "translate-x-0"}
              `}
            >
              <div
                className={`absolute flex flex-col items-center justify-center h-full w-1/2 px-8 text-center top-0 transition-transform duration-700 ease-in-out
                  ${isSignUp ? "translate-x-0" : "-translate-x-[20%]"}
                `}
              >
                <div className="mb-6 h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-lg border-2" style={{ borderColor: BRAND.SUCCESS }}>
                  <User className="w-8 h-8" style={{ color: BRAND.PRIMARY }} strokeWidth={1.8} />
                </div>
                <h1 className="font-bold text-2xl md:text-3xl mb-3" style={{ color: BRAND.SUCCESS }}>Welcome Back!</h1>
                <p className="text-sm text-white/90 mb-6 max-w-[260px]">
                  Enter your details to access your dashboard.
                </p>
                <button
                  type="button"
                  className="text-xs font-black py-2.5 px-8 rounded-md uppercase tracking-wider hover:bg-white/10 transition-colors"
                  style={{ backgroundColor: 'white', color: BRAND.PRIMARY }}
                  onClick={() => {
                    setIsSignUp(false);
                    setError("");
                  }}
                >
                  Sign In
                </button>
              </div>

              <div
                className={`absolute right-0 flex flex-col items-center justify-center h-full w-1/2 px-8 text-center top-0 transition-transform duration-700 ease-in-out
                  ${isSignUp ? "translate-x-[20%]" : "translate-x-0"}
                `}
              >
                <div className="mb-6 h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-lg border-2" style={{ borderColor: BRAND.SUCCESS }}>
                  <User className="w-8 h-8" style={{ color: BRAND.PRIMARY }} strokeWidth={1.8} />
                </div>
                <h1 className="font-bold text-2xl md:text-3xl mb-3" style={{ color: BRAND.SUCCESS }}>Join REALTORS</h1>
                <p className="text-sm text-white/90 mb-6 max-w-[260px]">
                  Register to unlock all features and start managing properties.
                </p>
                <button
                  type="button"
                  className="text-xs font-black py-2.5 px-8 rounded-md uppercase tracking-wider hover:bg-white/10 transition-colors"
                  style={{ backgroundColor: 'white', color: BRAND.PRIMARY }}
                  onClick={() => {
                    setIsSignUp(true);
                    setError("");
                  }}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>

          {/* SUCCESS MESSAGE */}
          {isSuccess && (
            <div className="absolute inset-0 z-[200] bg-white/95 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${BRAND.SUCCESS}20` }}>
                  <CheckCircle className="w-8 h-8" style={{ color: BRAND.SUCCESS }} strokeWidth={2} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: BRAND.PRIMARY }}>Success!</h2>
                <p className="text-gray-600 text-sm">Redirecting to dashboard...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LoginPage;