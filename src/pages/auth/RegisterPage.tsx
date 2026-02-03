import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, Phone, Mail, Lock, Loader2, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accountType: "tenant", // Changed from 'role' to 'accountType' for clarity
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      accountType: value,
    }));
    if (errors.accountType) {
      setErrors((prev) => ({
        ...prev,
        accountType: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.accountType) {
      newErrors.accountType = "Please select an account type";
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
    try {
      console.log("📝 Attempting registration for:", formData.email, "Account Type:", formData.accountType);
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.fullName.trim().split(" ")[0],
            last_name: formData.fullName.trim().split(" ").slice(1).join(" "),
            phone: formData.phone,
            account_type: formData.accountType, // Store account type, not role
            // NOTE: role will be assigned by super admin after approval
          },
        },
      });

      if (signupError) throw signupError;

      if (data.user) {
        console.log("✅ Auth user created successfully:", data.user.id);

        // Wait a moment for any auth trigger to create the profile
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Fetch or create the profile (fallback if trigger failed)
        console.log("🔍 Fetching created profile...");
        let { data: profileData, error: profileFetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileFetchError || !profileData) {
          console.warn("⚠️ Profile missing, creating fallback profile...");

          const [firstName, ...rest] = formData.fullName.trim().split(" ");
          const lastName = rest.join(" ");

          const { data: createdProfile, error: createProfileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              email: formData.email.trim().toLowerCase(),
              first_name: firstName || "",
              last_name: lastName || "",
              phone: formData.phone,
              role: null,
              status: "pending",
              user_type: formData.accountType,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (createProfileError || !createdProfile) {
            console.error("❌ Profile create error:", createProfileError);
            throw new Error("Profile could not be created. Please contact support.");
          }

          profileData = createdProfile;
        }

        const profileId = profileData.id;
        console.log("✅ Profile confirmed:", profileId);

        // Mark user as pending approval by super admin
        console.log("🔄 Marking user as pending approval...");
        
        // Create a single pending approval record
        const { error: approvalError } = await supabase
          .from("profiles")
          .update({
            status: "pending",
            user_type: formData.accountType, // Store what they registered as
            // role remains NULL until super admin assigns
          })
          .eq("id", profileId);

        if (approvalError) {
          console.warn("⚠️ Profile update warning:", approvalError.message);
        } else {
          console.log("✅ User marked as pending approval");
        }

        // Notify super admins about new registration
        try {
          console.log("🔔 Fetching super admins for notification");
          const { data: superAdmins, error: adminError } = await supabase
            .from("profiles")
            .select("id")
            .eq("role", "super_admin")
            .eq("status", "active");

          if (!adminError && superAdmins && superAdmins.length > 0) {
            for (const admin of superAdmins) {
              await supabase
                .from("notifications")
                .insert({
                  recipient_id: admin.id,
                  sender_id: data.user.id,
                  type: "new_user_registration",
                  related_entity_type: "user",
                  related_entity_id: data.user.id,
                  title: `New ${formData.accountType === 'tenant' ? 'Tenant' : 'Property Manager'} Registration`,
                  message: `${formData.fullName} has registered as a ${formData.accountType === 'tenant' ? 'tenant' : 'property manager'}. Review and assign in User Management.`,
                });
            }
            console.log("✅ Notifications sent to super admins");
          }
        } catch (error) {
          console.warn("⚠️ Notification error:", error);
        }

        toast.success("✅ Registration successful!");
        toast.info("📧 Awaiting administrator approval. You'll be assigned and activated soon.", { duration: 5000 });
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      const errorMessage = error.message || "Registration failed";
      const errorCode = error.code || "UNKNOWN";
      
      // Provide helpful error messages
      if (errorMessage.includes("already exists")) {
        toast.error("An account with this email already exists. Please sign in instead.");
      } else if (errorMessage.includes("invalid email")) {
        toast.error("Please enter a valid email address.");
      } else if (errorMessage.includes("password")) {
        toast.error("Password requirements: At least 6 characters recommended.");
      } else if (errorCode === "422" || errorMessage.includes("Unprocessable Entity")) {
        toast.error("Registration data invalid. Please check all fields and try again.");
      } else if (errorCode === "429" || errorMessage.includes("Too many")) {
        toast.error("Too many registration attempts. Please try again in a few minutes.");
      } else if (errorCode === "500" || errorMessage.includes("Internal Server") || errorMessage.includes("Database error")) {
        console.error("🔥 CRITICAL REGISTRATION ERROR: The database trigger likely failed or RLS policies are blocking creation.");
        toast.error("Database error. PLEASE RUN '20260204_emergency_fix_rls_recursion.sql' in your Supabase SQL Editor.", { duration: 15000 });
      } else {
        toast.error(errorMessage || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8" style={{ fontFamily: "'Montserrat', sans-serif", backgroundColor: "#1a232e" }}>
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-none shadow-xl shadow-slate-200/50 border border-slate-200"
        >
          {/* Header - Matching HowItWorks style */}
          <div className="bg-[#154279] px-8 py-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-none backdrop-blur-sm border border-white/10">
                  <img src="/realtor.jpg" alt="REALTORS" className="w-6 h-6 object-cover rounded-sm" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#D35400] uppercase bg-[#D35400]/10 px-2 py-0.5 rounded-none border border-[#D35400]/20 inline-block mb-2">
                    Create Account
                  </span>
                  <h2 className="text-2xl font-bold text-white leading-none">Join REALTORS</h2>
                  <p className="text-sm text-slate-300 mt-2 font-medium">Complete registration to access all features.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="p-8 md:p-10 relative z-0 overflow-visible">
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-[#D35400] w-4 h-4 transition-colors" />
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="John Kamau"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`pl-10 bg-slate-50 border rounded-none h-10 focus:ring-[#D35400] focus:border-[#D35400] transition-all text-sm ${errors.fullName ? 'border-red-500' : 'border-slate-200'}`}
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-red-500 font-bold">{errors.fullName}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Phone Number</Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-[#D35400] w-4 h-4 transition-colors" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+254 712 345 678"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`pl-10 bg-slate-50 border rounded-none h-10 focus:ring-[#D35400] focus:border-[#D35400] transition-all text-sm ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 font-bold">{errors.phone}</p>}
                </div>
              </div>

              {/* Full Width Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-[#D35400] w-4 h-4 transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`pl-10 bg-slate-50 border rounded-none h-10 focus:ring-[#D35400] focus:border-[#D35400] transition-all text-sm ${errors.email ? 'border-red-500' : 'border-slate-200'}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 font-bold">{errors.email}</p>}
              </div>

              {/* Two Column: Role & Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Account Type Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="accountType" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Account Type</Label>
                  <div className="bg-white border-2 border-slate-200 rounded-none p-3 relative z-50">
                    <Select 
                      value={formData.accountType} 
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger className={`h-10 bg-white dark:bg-white border-0 rounded-none focus:border-0 focus:ring-0 text-sm relative z-50 text-slate-800 dark:text-slate-800 ${errors.accountType ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select your account type" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-white dark:bg-white text-slate-800 dark:text-slate-800 border border-slate-200 shadow-lg">
                        <SelectItem value="tenant">👤 Tenant / Renter</SelectItem>
                        <SelectItem value="property_manager">🏢 Property Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.accountType && <p className="text-xs text-red-500 font-bold">{errors.accountType}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-[#D35400] w-4 h-4 transition-colors" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className={`pl-10 bg-slate-50 border rounded-none h-10 focus:ring-[#D35400] focus:border-[#D35400] transition-all text-sm ${errors.password ? 'border-red-500' : 'border-slate-200'}`}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-red-500 font-bold">{errors.password}</p>}
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-[#D35400] w-4 h-4 transition-colors" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`pl-10 bg-slate-50 border rounded-none h-10 focus:ring-[#D35400] focus:border-[#D35400] transition-all text-sm ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'}`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 font-bold">{errors.confirmPassword}</p>}
              </div>

              {/* Info Box for signup message */}
              <div className="p-4 border rounded-none bg-blue-50 border-blue-200">
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  💡 Sign up with your basic information. A super admin will review your registration, assign roles and properties, then activate your account.
                </p>
              </div>

              {/* Show Passwords Toggle */}
              <div className="flex items-center gap-3 py-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-slate-900 transition-colors font-bold">
                  <input 
                    type="checkbox" 
                    checked={showPassword}
                    onChange={() => {
                      setShowPassword(!showPassword);
                      setShowConfirm(!showPassword);
                    }}
                    className="w-4 h-4 rounded-none accent-[#D35400] cursor-pointer"
                  />
                  Show passwords
                </label>
              </div>

              {/* Submit Button - Matching HowItWorks style */}
              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#D35400] hover:bg-[#A04000] text-white font-bold rounded-none mt-6 shadow-md uppercase tracking-widest text-xs transition-all active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Already have account */}
              <div className="flex items-start gap-2.5 p-3 rounded-none bg-blue-50 border border-blue-100 text-slate-600 text-xs font-bold mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-[#D35400] hover:underline font-bold">
                  Sign In
                </Link>
              </div>

              {/* Terms */}
              <p className="text-center text-[10px] text-slate-500 leading-relaxed">
                By creating an account, you agree to our{" "}
                <Link to="/terms" className="text-slate-700 hover:underline font-bold">
                  Terms of Service
                </Link>
                {" "}and{" "}
                <Link to="/privacy" className="text-slate-700 hover:underline font-bold">
                  Privacy Policy
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
