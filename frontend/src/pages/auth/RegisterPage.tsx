import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, X } from "lucide-react";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
    .font-auth { font-family: 'Poppins', 'Segoe UI', sans-serif; }
  `}</style>
);

type RegisterFormState = {
  fullName: string;
  email: string;
  password: string;
  acceptPolicy: boolean;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<RegisterFormState>({
    fullName: "",
    email: "",
    password: "",
    acceptPolicy: false,
  });

  useEffect(() => {
    const mode = new URLSearchParams(location.search).get("mode");
    if (mode === "signin") {
      navigate("/login", { replace: true });
    }
  }, [location.search, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (serverError) {
      setServerError("");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!formData.acceptPolicy) {
      newErrors.acceptPolicy = "You must agree to continue.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      const redirectTo =
        ((import.meta as any).env.VITE_AUTH_REDIRECT_URL as string) ||
        ((import.meta as any).env.VITE_APP_URL as string);

      const [firstName, ...lastNameParts] = formData.fullName.trim().split(/\s+/);
      const lastName = lastNameParts.join(" ");

      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            first_name: firstName || "User",
            last_name: lastName,
            role: "tenant",
            phone: "",
          },
        },
      });

      if (signupError) {
        throw signupError;
      }

      if (data.user) {
        if (!data.session) {
          toast.info("Check your email to confirm your account.", { duration: 5000 });
          setTimeout(() => navigate("/login"), 1600);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1200));

        const { data: profileData, error: profileFetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!profileData || profileFetchError) {
          throw new Error("Profile creation failed. Please contact support.");
        }

        try {
          const { data: superAdmins } = await supabase
            .from("profiles")
            .select("id")
            .eq("role", "super_admin")
            .eq("status", "active");

          if (superAdmins && superAdmins.length > 0) {
            for (const admin of superAdmins) {
              await supabase.from("notifications").insert({
                recipient_id: admin.id,
                sender_id: data.user.id,
                type: "new_user_registration",
                related_entity_type: "user",
                related_entity_id: data.user.id,
                title: "New Tenant Registration",
                message: `${formData.fullName} has created a new account.`,
              });
            }
          }
        } catch (notifyError) {
          console.warn("Notification warning:", notifyError);
        }

        toast.success("Registration successful!");
        toast.info("Your account is active. Continue to sign in.", { duration: 3500 });
        setTimeout(() => navigate("/login"), 1600);
      }
    } catch (registerError: any) {
      const errorMessage = registerError.message || "Registration failed";
      const errorCode = registerError.code || "UNKNOWN";

      setServerError(errorMessage);

      if (errorMessage.includes("already exists")) {
        toast.error("An account with this email already exists.");
      } else if (errorMessage.includes("invalid email")) {
        toast.error("Please enter a valid email address.");
      } else if (errorMessage.includes("password")) {
        toast.error("Password must be at least 6 characters.");
      } else if (
        errorCode === "500" ||
        errorMessage.includes("Internal Server") ||
        errorMessage.includes("Database error")
      ) {
        toast.error(
          "Database error. Please run URGENT_FIX_REGISTRATION_v2.sql in Supabase SQL editor.",
          { duration: 12000 },
        );
      } else {
        toast.error(errorMessage || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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
          <div className="w-full max-w-[860px] overflow-hidden border border-[#b7bcc3] bg-[#c8cbd1] shadow-[0_18px_55px_rgba(71,80,94,0.24)]">
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
                  Sign Up
                  <span className="block text-[15px] font-normal text-[#4b5563] sm:ml-2 sm:inline sm:text-[20px]">
                    create your account
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="h-8 min-w-[92px] rounded-xl bg-white px-5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#4b5563] shadow-sm transition-colors hover:text-[#24b86e]"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="h-8 min-w-[92px] rounded-xl bg-[#7a3ef2] px-5 text-[11px] font-bold uppercase tracking-[0.04em] text-white shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            </div>

            <form onSubmit={handleRegister} className="px-4 py-9 sm:px-10 md:px-14">
              <div className="mx-auto w-full max-w-[680px] space-y-5">
                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[130px_1fr] sm:gap-5">
                  <label
                    htmlFor="signup-name"
                    className="text-[20px] font-semibold text-[#243041]"
                  >
                    Full Name:
                  </label>
                  <input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="h-11 w-full border border-[#b2b9c2] bg-[#eef1f4] px-4 text-[16px] text-[#1f2937] outline-none transition-colors focus:border-[#8e98a5]"
                    autoComplete="name"
                    required
                  />
                </div>

                {errors.fullName && (
                  <p className="-mt-1 text-right text-[13px] font-semibold text-red-600">
                    {errors.fullName}
                  </p>
                )}

                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[130px_1fr] sm:gap-5">
                  <label
                    htmlFor="signup-email"
                    className="text-[20px] font-semibold text-[#243041]"
                  >
                    Email:
                  </label>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-11 w-full border border-[#b2b9c2] bg-[#eef1f4] px-4 text-[16px] text-[#1f2937] outline-none transition-colors focus:border-[#8e98a5]"
                    autoComplete="email"
                    required
                  />
                </div>

                {errors.email && (
                  <p className="-mt-1 text-right text-[13px] font-semibold text-red-600">
                    {errors.email}
                  </p>
                )}

                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[130px_1fr] sm:gap-5">
                  <label
                    htmlFor="signup-password"
                    className="text-[20px] font-semibold text-[#243041]"
                  >
                    Password:
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      className="h-11 w-full border border-[#b2b9c2] bg-[#eef1f4] px-4 pr-11 text-[16px] text-[#1f2937] outline-none transition-colors focus:border-[#8e98a5]"
                      autoComplete="new-password"
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

                {errors.password && (
                  <p className="-mt-1 text-right text-[13px] font-semibold text-red-600">
                    {errors.password}
                  </p>
                )}

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

                <div className="mt-2 border border-[#c2c8d0] bg-[#edf1f5] px-3 py-2 text-[14px] text-[#3b4c62]">
                  <label className="inline-flex items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      name="acceptPolicy"
                      checked={formData.acceptPolicy}
                      onChange={handleChange}
                      className="h-4 w-4 accent-[#7a3ef2]"
                    />
                    I agree to the access policy and delivery terms.
                  </label>
                </div>

                {errors.acceptPolicy && (
                  <p className="-mt-1 text-right text-[13px] font-semibold text-red-600">
                    {errors.acceptPolicy}
                  </p>
                )}

                <div className="pt-3 text-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="mx-auto inline-flex h-11 min-w-[190px] items-center justify-center bg-[#7a3ef2] px-8 text-[16px] font-semibold leading-none text-white transition-colors hover:bg-[#6630d9] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
                  </button>
                </div>

                <div
                  className={`mt-4 flex items-center justify-center gap-2 border px-4 py-2 text-center text-[18px] ${
                    serverError
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-[#c2c8d0] bg-[#edf1f5] text-[#4b5f79]"
                  }`}
                >
                  <span>{serverError || "Create your account to continue."}</span>
                  {!serverError && <X className="h-3 w-3 text-[#6f8096]" />}
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
      </div>
    </>
  );
}
