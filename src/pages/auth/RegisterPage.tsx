import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, Phone, Mail, Lock, Loader2, ArrowLeft, Building2, Home } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address?: string;
}

interface Unit {
  id: string;
  unit_number: string;
  unit_type: string;
  floor_number: number;
  price_monthly: number;
  property_id: string;
  status: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "tenant",
    // Tenant specific fields
    propertyId: "",
    unitId: "",
    // Property manager specific fields
    managedPropertyIds: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Fetch properties for dropdowns
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        console.log("🏢 Fetching properties...");
        const { data, error } = await supabase
          .from("properties")
          .select("id, name, address")
          .eq("status", "active")
          .order("name");

        console.log("📊 Properties query - Error:", error, "Data:", data);
        if (error) {
          console.error("❌ Error fetching properties:", error);
          throw error;
        }
        console.log("✅ Successfully fetched properties:", data);
        setProperties(data || []);
      } catch (error) {
        console.error("❌ Error fetching properties:", error);
        // Use mock properties as fallback
        const mockProps = [
          { id: 'prop-1', name: 'Westside Apartments', address: '123 Main Street' },
          { id: 'prop-2', name: 'Downtown Plaza', address: '456 Business Avenue' },
          { id: 'prop-3', name: 'Suburban Villas', address: '789 Residential Park' },
        ];
        setProperties(mockProps);
      }
    };

    fetchProperties();
  }, []);

  // Fetch available units when property is selected
  const handlePropertySelect = async (propertyId: string) => {
    setFormData((prev) => ({
      ...prev,
      propertyId,
      unitId: "", // Clear unit selection when property changes
    }));

    if (!propertyId) {
      setAvailableUnits([]);
      return;
    }
    const buildMockUnits = () => {
      const pid = propertyId || "mock-property";
      return [
        { id: `${pid}-mock-1`, unit_number: "101", unit_type: "1BR", floor_number: 1, price_monthly: 950, property_id: pid, status: "vacant" },
        { id: `${pid}-mock-2`, unit_number: "201", unit_type: "2BR", floor_number: 2, price_monthly: 1250, property_id: pid, status: "vacant" },
        { id: `${pid}-mock-3`, unit_number: "PH-1", unit_type: "Penthouse", floor_number: 5, price_monthly: 2100, property_id: pid, status: "vacant" },
      ];
    };

    setLoadingUnits(true);
    try {
      console.log("🔍 Fetching units for property:", propertyId);
      
      const { data, error } = await supabase
        .from("units_detailed")
        .select("id, unit_number, unit_type, floor_number, price_monthly, property_id, status")
        .eq("property_id", propertyId)
        .eq("status", "vacant")
        .order("unit_number");

      console.log("📊 Query response - Error:", error, "Data:", data);

      if (error) {
        console.error("❌ Database error fetching units:", error);
        // Use mock units as fallback
        console.log("⚠️ Using mock units due to error");
        toast.error("Error loading units. Using sample units so you can continue.");
        setAvailableUnits(buildMockUnits());
        setLoadingUnits(false);
        return;
      }
      
      if (!data || data.length === 0) {
        console.warn("⚠️ No vacant units found for property:", propertyId);
        toast.info("ℹ️ No vacant units available right now. Showing sample units for demo.", { duration: 4000 });
        setAvailableUnits(buildMockUnits());
        setLoadingUnits(false);
        return;
      }
      
      console.log("✅ Successfully fetched units:", data);
      setAvailableUnits(data);
      setLoadingUnits(false);
    } catch (error) {
      console.error("❌ Error fetching units:", error);
      toast.error("Unable to load units. Showing sample data.");
      setAvailableUnits(buildMockUnits());
      setLoadingUnits(false);
    }
  };

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
      role: value,
      propertyId: "",
      unitId: "",
      managedPropertyIds: [],
    }));
    if (errors.role) {
      setErrors((prev) => ({
        ...prev,
        role: "",
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

    if (!formData.role) {
      newErrors.role = "Please select an account type";
    }

    // Role-specific validation
    if (formData.role === "tenant") {
      if (!formData.propertyId.trim()) {
        newErrors.propertyId = "Property is required for tenants";
      }
      if (!formData.unitId.trim()) {
        newErrors.unitId = "Please select a unit/house number";
      }
    } else if (formData.role === "property_manager") {
      if (formData.managedPropertyIds.length === 0) {
        newErrors.managedPropertyIds = "Select at least one property to manage";
      }
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
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: formData.role,
          },
        },
      });

      if (signupError) throw signupError;

      if (data.user) {
        // Create profile with role-specific fields
        // The trigger handle_new_user() automatically creates a basic profile
        // Now we update it with additional data
        console.log("🔐 Creating/updating profile for user:", data.user.id);
        
        const profileData: any = {
          id: data.user.id,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          status: formData.role === "property_manager" ? "pending" : "active",
        };

        // Add tenant-specific fields - get unit info
        if (formData.role === "tenant") {
          const selectedUnit = availableUnits.find(u => u.id === formData.unitId);
          if (selectedUnit) {
            profileData.unit_id = formData.unitId;
            profileData.property_id = formData.propertyId;
          }
        }

        // Update the profile (the trigger should have already created it)
        console.log("📝 Updating profile with additional data:", profileData);
        const { error: updateError } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("id", data.user.id);
        
        if (updateError) {
          console.error("⚠️ Profile update warning (non-critical):", updateError.message);
          // Don't throw - profile may already be created by trigger
        } else {
          console.log("✅ Profile updated successfully");
        }

        // Update unit status to reserved for tenant
        if (formData.role === "tenant") {
          console.log("📌 Marking unit as reserved for tenant:", formData.unitId);
          const { error: unitError } = await supabase
            .from("units_detailed")
            .update({
              status: "reserved",
              occupant_id: data.user.id,
            })
            .eq("id", formData.unitId);

          if (unitError) {
            console.warn("⚠️ Unit status update warning:", unitError.message);
          }

          // Create approval request for tenant verification
          console.log("📋 Creating tenant verification approval request");
          const { error: verifyError } = await supabase
            .from("approval_requests")
            .insert({
              submitted_by: data.user.id,
              type: "tenant_verification",
              title: `Tenant Verification: ${formData.fullName}`,
              description: `New tenant registration for Unit ${availableUnits.find(u => u.id === formData.unitId)?.unit_number}`,
              property_id: formData.propertyId,
              unit_id: formData.unitId,
              status: "pending",
            });

          if (verifyError) {
            console.warn("⚠️ Verification request warning:", verifyError.message);
          }

          // Notify property manager
          try {
            const { data: property, error: propError } = await supabase
              .from("properties")
              .select("property_manager_id, name")
              .eq("id", formData.propertyId)
              .single();

            if (propError) {
              console.warn("⚠️ Property fetch warning:", propError.message);
            } else if (property?.property_manager_id) {
              const unit = availableUnits.find(u => u.id === formData.unitId);
              console.log("📧 Sending notification to property manager:", property.property_manager_id);
              const { error: notifError } = await supabase
                .from("notifications")
                .insert({
                  recipient_id: property.property_manager_id,
                  sender_id: data.user.id,
                  type: "tenant_verification",
                  related_entity_type: "tenant",
                  related_entity_id: data.user.id,
                  title: "New Tenant Registration",
                  message: `${formData.fullName} has registered for Unit ${unit?.unit_number} at ${property.name}. Please verify their information in your dashboard.`,
                });
              if (notifError) {
                console.warn("⚠️ Notification warning:", notifError.message);
              }
            }
          } catch (error) {
            console.warn("⚠️ Property manager notification warning:", error);
          }

          toast.success("✅ Registration successful! Awaiting property manager verification.");
          toast.info("📧 You'll be able to login once the property manager approves your application.", { duration: 5000 });
          setTimeout(() => navigate("/login"), 3000);
        } else if (formData.role === "property_manager") {
          // Create approval request for manager registration
          const managedPropertyNames = properties
            .filter(p => formData.managedPropertyIds.includes(p.id))
            .map(p => p.name);
          
          console.log("📋 Creating manager approval request for:", data.user.id);
          
          const { error: approvalError } = await supabase
            .from("approval_requests")
            .insert({
              submitted_by: data.user.id,
              type: "manager_assignment",
              title: `Property Manager Registration: ${formData.fullName}`,
              description: `New property manager registration for: ${managedPropertyNames.join(", ")}`,
              status: "pending",
            });

          if (approvalError) {
            console.warn("⚠️ Manager approval creation warning:", approvalError.message);
          } else {
            console.log("✅ Manager approval request created");
          }

          // Notify super admin
          try {
            console.log("🔔 Fetching super admins for notification");
            const { data: superAdmins, error: adminError } = await supabase
              .from("profiles")
              .select("id")
              .eq("role", "super_admin");

            if (adminError) {
              console.warn("⚠️ Super admin fetch warning:", adminError.message);
            } else if (superAdmins && superAdmins.length > 0) {
              console.log("📧 Found", superAdmins.length, "super admins to notify");
              for (const admin of superAdmins) {
                const { error: notifError } = await supabase
                  .from("notifications")
                  .insert({
                    recipient_id: admin.id,
                    sender_id: data.user.id,
                    type: "manager_approval",
                    related_entity_type: "manager",
                    related_entity_id: data.user.id,
                    title: "New Property Manager Registration",
                    message: `${formData.fullName} has registered as a property manager for ${managedPropertyNames.join(", ")}. Please review and approve in your dashboard.`,
                  });
                if (notifError) {
                  console.warn("⚠️ Notification warning:", notifError.message);
                }
              }
            } else {
              console.warn("⚠️ No super admins found to notify");
            }
          } catch (notificationError) {
            console.warn("⚠️ Notification error:", notificationError);
          }

          toast.success("✅ Registration successful! Awaiting admin approval.");
          toast.info("📧 You'll be able to login once the administrator approves your registration.", { duration: 5000 });
          setTimeout(() => navigate("/login"), 3000);
        } else {
          toast.success("✅ Account created! Please check your email to confirm your account.");
          toast.info("📧 You will be redirected to login shortly.", { duration: 3000 });
          setTimeout(() => navigate("/login"), 3000);
        }
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
      } else if (errorCode === "500" || errorMessage.includes("Internal Server")) {
        toast.error("Server error during registration. Please try again in a moment.");
      } else {
        toast.error(errorMessage || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4 md:p-8" style={{ fontFamily: "'Montserrat', sans-serif" }}>
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
                {/* Role - Card Container */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Account Type</Label>
                  <div className="bg-white border-2 border-slate-200 rounded-none p-3 relative z-50">
                    <Select 
                      value={formData.role} 
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger className={`h-10 bg-white dark:bg-white border-0 rounded-none focus:border-0 focus:ring-0 text-sm relative z-50 text-slate-800 dark:text-slate-800 ${errors.role ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-white dark:bg-white text-slate-800 dark:text-slate-800 border border-slate-200 shadow-lg">
                        <SelectItem value="tenant">Tenant / Looking to Rent</SelectItem>
                        <SelectItem value="property_manager">Property Manager</SelectItem>
                        <SelectItem value="property_owner">Property Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.role && <p className="text-xs text-red-500 font-bold">{errors.role}</p>}
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

              {/* TENANT-SPECIFIC FIELDS */}
              {formData.role === "tenant" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-blue-50 border border-blue-200 rounded-none"
                >
                  {/* Property Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="propertyId" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Select Property</Label>
                    <div className="bg-white border-2 border-slate-200 rounded-none p-3 relative z-40">
                      <Select 
                        value={formData.propertyId} 
                        onValueChange={(value) => {
                          handlePropertySelect(value);
                          if (errors.propertyId) {
                            setErrors((prev) => ({ ...prev, propertyId: "" }));
                          }
                        }}
                      >
                        <SelectTrigger className={`h-10 bg-white dark:bg-white border-0 rounded-none focus:border-0 focus:ring-0 text-sm text-slate-800 dark:text-slate-800 ${errors.propertyId ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Choose your property" />
                        </SelectTrigger>
                        <SelectContent className="z-[9998] bg-white dark:bg-white text-slate-800 dark:text-slate-800 border border-slate-200 shadow-lg">
                          {properties.map((prop) => (
                            <SelectItem key={prop.id} value={prop.id}>
                              {prop.name} {prop.address ? `- ${prop.address}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.propertyId && <p className="text-xs text-red-500 font-bold">{errors.propertyId}</p>}
                  </div>

                  {/* Unit Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="unitId" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Select Unit</Label>
                    <div className="bg-white border-2 border-slate-200 rounded-none p-3 relative z-40">
                      {loadingUnits ? (
                        <div className="h-10 flex items-center justify-center">
                          <p className="text-xs text-slate-500">Loading available units...</p>
                        </div>
                      ) : (
                        <Select 
                          value={formData.unitId} 
                          onValueChange={(value) => {
                            setFormData((prev) => ({ ...prev, unitId: value }));
                            if (errors.unitId) {
                              setErrors((prev) => ({ ...prev, unitId: "" }));
                            }
                          }}
                        >
                          <SelectTrigger className={`h-10 bg-white dark:bg-white border-0 rounded-none focus:border-0 focus:ring-0 text-sm text-slate-800 dark:text-slate-800 ${errors.unitId ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder={availableUnits.length === 0 ? "No units available" : "Choose your unit"} />
                          </SelectTrigger>
                          <SelectContent className="z-[9998] bg-white dark:bg-white text-slate-800 dark:text-slate-800 border border-slate-200 shadow-lg">
                            {availableUnits.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                Unit {unit.unit_number} - {unit.unit_type} (${unit.price_monthly}/mo)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    {errors.unitId && <p className="text-xs text-red-500 font-bold">{errors.unitId}</p>}
                    {!loadingUnits && availableUnits.length === 0 && formData.propertyId && (
                      <p className="text-xs text-orange-600 font-medium mt-1">
                        ⚠️ No vacant units available. Please contact the property manager or select another property.
                      </p>
                    )}
                    {formData.unitId && (
                      <div className="text-xs text-slate-600 mt-1 p-2 bg-white border border-slate-100 rounded">
                        <strong>Unit Details:</strong> {availableUnits.find(u => u.id === formData.unitId)?.unit_type} • Floor {availableUnits.find(u => u.id === formData.unitId)?.floor_number}
                      </div>
                    )}
                  </div>

                  <p className="col-span-full text-xs text-slate-600 font-medium">
                    ℹ️ Your information will be sent to the property manager for verification before you can access your tenant portal.
                  </p>
                </motion.div>
              )}

              {/* PROPERTY MANAGER-SPECIFIC FIELDS */}
              {formData.role === "property_manager" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-purple-50 border border-purple-200 rounded-none space-y-3"
                >
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Managed Properties</Label>
                    <p className="text-xs text-slate-600 font-medium mb-2">Select the properties you manage:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {properties.map((prop) => (
                        <label key={prop.id} className="flex items-center gap-2 p-2 rounded-none bg-white border border-slate-200 hover:border-purple-300 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.managedPropertyIds.includes(prop.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  managedPropertyIds: [...prev.managedPropertyIds, prop.id],
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  managedPropertyIds: prev.managedPropertyIds.filter(id => id !== prop.id),
                                }));
                              }
                              if (errors.managedPropertyIds) {
                                setErrors((prev) => ({ ...prev, managedPropertyIds: "" }));
                              }
                            }}
                            className="w-4 h-4 rounded-none accent-purple-600 cursor-pointer"
                          />
                          <span className="text-sm text-slate-700 font-medium">
                            {prop.name} {prop.address ? `- ${prop.address}` : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                    {errors.managedPropertyIds && <p className="text-xs text-red-500 font-bold">{errors.managedPropertyIds}</p>}
                  </div>

                  <p className="text-xs text-slate-600 font-medium bg-white p-2 rounded-none border border-purple-200">
                    ℹ️ Your registration will be sent to the administrator for approval. Once approved, you can manage your properties and tenants.
                  </p>
                </motion.div>
              )}

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
