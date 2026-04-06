// src/pages/auth/LoginPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle, Eye, EyeOff, Loader2, X } from "lucide-react";

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

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      setIsSuccess(true);
    } catch (loginError: any) {
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

      <div className="relative min-h-screen overflow-hidden bg-[#d7dce1] font-auth subpixel-antialiased text-[#243041]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-12 top-16 h-52 w-52 rotate-45 rounded-[36px] bg-white/25 shadow-[0_12px_24px_rgba(94,105,122,0.15)]" />
          <div className="absolute left-1/4 top-6 h-36 w-36 rotate-12 rounded-[30px] bg-[#d9eef7]/45" />
          <div className="absolute right-8 top-20 h-60 w-60 -rotate-12 rounded-[46px] bg-[#d8e7ef]/55" />
          <div className="absolute bottom-16 left-16 h-44 w-44 rotate-[28deg] rounded-[32px] bg-white/20" />
          <div className="absolute bottom-20 right-20 h-52 w-52 rotate-[38deg] rounded-[36px] bg-white/25" />
          <div className="absolute right-1/3 top-1/3 h-6 w-6 rounded-full bg-[#c7d1dc]/70" />
          <div className="absolute left-1/3 bottom-1/3 h-8 w-8 rounded-full bg-[#c5cfdb]/60" />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
          <div
            className={`w-full max-w-[860px] overflow-hidden border border-[#b7bcc3] bg-[#c8cbd1] shadow-[0_18px_55px_rgba(71,80,94,0.24)] transition-opacity duration-500 ${
              isSuccess ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#bfc4cb] px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-white p-1 shadow-inner">
                  <img
                    src="/realtor.jpg"
                    alt="REALTORS"
                    className="h-full w-full rounded-sm object-cover"
                  />
                </div>
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
                      "Enter Workspace"
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
                  <span>{error || "Sign in to your workspace."}</span>
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
          </div>
        </div>

        {isSuccess && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white font-nunito">
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping rounded-full bg-green-100 opacity-40" />
                <div className="relative rounded-full bg-green-50 p-4">
                  <CheckCircle size={44} className="text-[#22c55e]" strokeWidth={2.4} />
                </div>
              </div>

              <h2 className="mb-2 text-2xl font-extrabold text-slate-800">
                Login Successful
              </h2>
              <p className="mb-10 text-sm font-semibold text-slate-500">
                Preparing your dashboard...
              </p>

              <div className="h-1 w-32 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full w-1/2 animate-[loading_1.5s_ease-in-out_infinite] bg-[#1a3252]"
                  style={{ animationName: "loading" }}
                />
              </div>

              <style>{`
                @keyframes loading {
                  0% { transform: translateX(-150%); }
                  100% { transform: translateX(250%); }
                }
              `}</style>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LoginPage;