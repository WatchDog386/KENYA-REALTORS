import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Info, User, Briefcase, Users, MapPin, Building } from "lucide-react";

interface SelectedUnitDetails {
  id: string;
  propertyId: string | null;
  propertyName: string;
  propertyLocation: string;
  unitNumber: string;
  unitTypeId: string;
  unitTypeName: string;
  status: string;
  floorNumber: string;
  rentAmount: number;
  description: string;
  features: string[];
}

export const UnitApplicationForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const propertyId = searchParams.get("propertyId") || "";
  const unitId = searchParams.get("unitId") || "";
  const propertyName = searchParams.get("propertyName") || "";
  const unitNumber = searchParams.get("unitNumber") || "";
  const locationParam = searchParams.get("location") || "";
  const unitTypeIdParam = searchParams.get("unitTypeId") || "";
  const unitTypeNameParam = searchParams.get("unitTypeName") || "";
  const rentParam = searchParams.get("rent") || "";
  const statusParam = searchParams.get("status") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unitDetailsLoading, setUnitDetailsLoading] = useState(false);
  const [unitDetails, setUnitDetails] = useState<SelectedUnitDetails | null>(null);

  const [form, setForm] = useState({
    property_to_let: propertyName && unitNumber ? `${propertyName} - Unit ${unitNumber}` : "",
    applicant_name: "",
    physical_address: "",
    po_box: "",
    applicant_email: "",
    employer_details: "",
    telephone_numbers: "",
    marital_status: "",
    children_count: "",
    age_bracket: "",
    occupants_count: "",
    next_of_kin: "",
    next_of_kin_email: "",
    nationality: "",
    house_staff: false,
    home_address: "",
    location: locationParam,
    sub_location: "",
    password: "",
  });

  useEffect(() => {
    const loadUnitDetails = async () => {
      if (!unitId) return;

      try {
        setUnitDetailsLoading(true);
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 10000);

        const { data, error } = await supabase
          .from("units")
          .select(
            `
            id,
            property_id,
            unit_number,
            unit_type_id,
            status,
            floor_number,
            price,
            description,
            features,
            properties:property_id(name, location),
            property_unit_types:unit_type_id(id, unit_type_name, name, price_per_unit)
          `
          )
          .eq("id", unitId)
          .abortSignal(controller.signal)
          .maybeSingle();

        window.clearTimeout(timeoutId);

        if (error) throw error;

        const propertyRow = Array.isArray((data as any)?.properties)
          ? (data as any).properties[0]
          : (data as any)?.properties;
        const unitTypeRow = Array.isArray((data as any)?.property_unit_types)
          ? (data as any).property_unit_types[0]
          : (data as any)?.property_unit_types;

        const parsePositiveNumber = (...values: any[]) => {
          for (const value of values) {
            if (value === null || value === undefined || value === "") continue;
            const parsed = Number(value);
            if (Number.isFinite(parsed) && parsed > 0) {
              return parsed;
            }
          }
          return 0;
        };

        const parseFeatures = (value: any): string[] => {
          if (!value) return [];
          if (Array.isArray(value)) {
            return value.filter(Boolean).map((feature: any) => String(feature));
          }
          if (typeof value === "string") {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                return parsed.filter(Boolean).map((feature: any) => String(feature));
              }
            } catch {
              return value
                .split(",")
                .map((feature) => feature.trim())
                .filter(Boolean);
            }
          }
          return [];
        };

        const resolvedPropertyName = propertyRow?.name || propertyName || "Unknown Property";
        const resolvedUnitNumber = (data as any)?.unit_number || unitNumber || "N/A";
        const resolvedUnitTypeName =
          unitTypeRow?.name || unitTypeRow?.unit_type_name || unitTypeNameParam || "Not specified";
        const resolvedRent = parsePositiveNumber((data as any)?.price, unitTypeRow?.price_per_unit, rentParam);
        const rawFloorNumber = (data as any)?.floor_number;
        const resolvedFloorNumber =
          rawFloorNumber === null || rawFloorNumber === undefined || String(rawFloorNumber).trim() === ""
            ? "N/A"
            : String(rawFloorNumber);

        setUnitDetails({
          id: String((data as any)?.id || unitId),
          propertyId: (data as any)?.property_id || propertyId || null,
          propertyName: resolvedPropertyName,
          propertyLocation: propertyRow?.location || locationParam || "",
          unitNumber: resolvedUnitNumber,
          unitTypeId: String((data as any)?.unit_type_id || unitTypeRow?.id || unitTypeIdParam || ""),
          unitTypeName: resolvedUnitTypeName,
          status: String((data as any)?.status || statusParam || "unknown"),
          floorNumber: resolvedFloorNumber,
          rentAmount: resolvedRent,
          description: String((data as any)?.description || ""),
          features: parseFeatures((data as any)?.features),
        });

        setForm((prev) => ({
          ...prev,
          property_to_let: `${resolvedPropertyName} - Unit ${resolvedUnitNumber}`,
        }));
      } catch (error) {
        const errorMessage = String((error as any)?.message || "").toLowerCase();
        if (errorMessage.includes("abort")) {
          console.warn("Unit details request timed out; using URL fallback details.");
        } else {
          console.error("Failed to load full unit details:", error);
        }

        const fallbackRent = Number(rentParam || 0);
        setUnitDetails({
          id: unitId || "N/A",
          propertyId: propertyId || null,
          propertyName: propertyName || "Unknown Property",
          propertyLocation: locationParam || "",
          unitNumber: unitNumber || "N/A",
          unitTypeId: unitTypeIdParam || "N/A",
          unitTypeName: unitTypeNameParam || "Not specified",
          status: statusParam || "unknown",
          floorNumber: "N/A",
          rentAmount: Number.isFinite(fallbackRent) ? fallbackRent : 0,
          description: "",
          features: [],
        });
      } finally {
        setUnitDetailsLoading(false);
      }
    };

    loadUnitDetails();
  }, [
    locationParam,
    propertyId,
    propertyName,
    rentParam,
    statusParam,
    unitId,
    unitNumber,
    unitTypeIdParam,
    unitTypeNameParam,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.applicant_name || !form.applicant_email || !form.telephone_numbers) {
      toast.error("Please fill in the required fields: Name, Email, and Phone.");
      return;
    }

    if (!user?.id && !form.password) {
      toast.error("Please provide a password to complete registration.");
      return;
    }

    if (!user?.id && form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (!propertyId || !unitId) {
      toast.error("Unable to find property or unit information. Please go back and select a unit again.");
      return;
    }

    setIsSubmitting(true);
    try {
      let applicantId = user?.id || null;
      let accountAction: "existing" | "created" = "existing";
      const applicantEmail = form.applicant_email.trim().toLowerCase();

      if (!applicantId) {
        const [firstName, ...lastNameParts] = form.applicant_name.trim().split(/\s+/);
        const lastName = lastNameParts.join(" ").trim();
        let existingAccountByEmail: boolean | null = null;

        // If policy allows, this avoids auth probe errors by selecting the correct path first.
        const { data: profileByEmail, error: profileLookupError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", applicantEmail)
          .maybeSingle();

        if (!profileLookupError) {
          existingAccountByEmail = !!profileByEmail;
        }

        if (existingAccountByEmail === true) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: applicantEmail,
            password: form.password,
          });

          if (signInError || !signInData.user?.id) {
            throw new Error("This email is already registered, but the password is incorrect. Use the correct password or reset it, then apply again.");
          }

          applicantId = signInData.user.id;
        } else {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: applicantEmail,
            password: form.password,
            options: {
              data: {
                first_name: firstName || form.applicant_name,
                last_name: lastName || "Tenant",
                phone: form.telephone_numbers,
                role: "tenant",
                status: "active",
              },
            },
          });

          if (authError) {
            const authMessage = String(authError.message || "").toLowerCase();
            if (authMessage.includes("already registered") || authMessage.includes("user already registered")) {
              // If profile lookup is unavailable/blocked by RLS and user exists, recover with sign-in.
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: applicantEmail,
                password: form.password,
              });

              if (signInError || !signInData.user?.id) {
                throw new Error("This email is already registered, but the password is incorrect. Use the correct password or reset it, then apply again.");
              }

              applicantId = signInData.user.id;
              accountAction = "existing";
            } else {
              throw new Error(authError.message || "Could not register applicant account.");
            }
          }

          if (!applicantId) {
            applicantId = authData.user?.id || null;
            if (!applicantId) {
              throw new Error("Registration succeeded, but no user ID was returned. Please verify your email, sign in, and apply again.");
            }
            accountAction = "created";
          }
        }
      }

      const selectedUnitSummary = unitDetails
        ? `${unitDetails.propertyName} - Unit ${unitDetails.unitNumber} (PROPERTY_ID:${unitDetails.propertyId || propertyId};UNIT_ID:${unitDetails.id};UNIT_TYPE_ID:${unitDetails.unitTypeId || unitTypeIdParam};UNIT_TYPE:${unitDetails.unitTypeName || 'N/A'})`
        : `${propertyName || 'Unknown Property'} - Unit ${unitNumber || 'N/A'} (PROPERTY_ID:${propertyId};UNIT_ID:${unitId};UNIT_TYPE_ID:${unitTypeIdParam || 'N/A'};UNIT_TYPE:${unitTypeNameParam || 'N/A'})`;

      const applicationData = {
        applicant_id: applicantId,
        property_id: propertyId,
        unit_id: unitId,
        status: "pending",
        property_to_let: selectedUnitSummary,
        applicant_name: form.applicant_name,
        physical_address: form.physical_address,
        po_box: form.po_box,
        applicant_email: applicantEmail,
        employer_details: form.employer_details,
        telephone_numbers: form.telephone_numbers,
        marital_status: form.marital_status,
        children_count: form.children_count ? parseInt(form.children_count) : 0,
        age_bracket: form.age_bracket,
        occupants_count: form.occupants_count ? parseInt(form.occupants_count) : 1,
        next_of_kin: form.next_of_kin,
        next_of_kin_email: form.next_of_kin_email,
        nationality: form.nationality,
        house_staff: form.house_staff,
        home_address: form.home_address,
        location: form.location,
        sub_location: form.sub_location,
      };

      let { error } = await supabase
        .from("lease_applications")
        .insert([applicationData]);

      // Backward compatibility for deployments missing optional columns.
      if (error) {
        const errorText = String(error.message || '').toLowerCase();
        const fallbackData = { ...(applicationData as any) };
        let shouldRetry = false;

        if (errorText.includes('next_of_kin_email')) {
          delete fallbackData.next_of_kin_email;
          shouldRetry = true;
        }

        if (errorText.includes('property_to_let')) {
          delete fallbackData.property_to_let;
          shouldRetry = true;
        }

        if (shouldRetry) {
          ({ error } = await supabase
            .from("lease_applications")
            .insert([fallbackData]));
        }
      }

      if (error) {
        console.error("Supabase Error:", error);
        
        // Provide more helpful error messages
        if (error.code === "42P01") {
          toast.error("Database table not found. Please contact support.");
        } else if (error.code === "42703") {
          toast.error("One or more database columns are missing. Please contact support.");
        } else if (error.message?.includes("permission")) {
          toast.error("You don't have permission to submit applications. Please try logging in.");
        } else if (error.message?.includes("duplicate")) {
          toast.error("This application already exists.");
        } else {
          toast.error(`Submission failed: ${error.message}`);
        }
        return;
      }
      
      toast.success(
        user?.id || accountAction === "existing"
          ? "Application submitted successfully! We'll review it shortly."
          : "Application submitted and account created successfully. You'll use this email/password to sign in."
      );
      setForm({
        property_to_let: "",
        applicant_name: "",
        physical_address: "",
        po_box: "",
        applicant_email: "",
        employer_details: "",
        telephone_numbers: "",
        marital_status: "",
        children_count: "",
        age_bracket: "",
        occupants_count: "",
        next_of_kin: "",
        next_of_kin_email: "",
        nationality: "",
        house_staff: false,
        home_address: "",
        location: locationParam,
        sub_location: "",
        password: "",
      });
      onSuccess();

    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast.error(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "bg-white border border-gray-200 text-gray-900 focus:border-[#F96302] focus:ring-2 focus:ring-[#F96302]/20 transition-all rounded-lg h-11";
  const textareaClass = "bg-white border border-gray-200 text-gray-900 focus:border-[#F96302] focus:ring-2 focus:ring-[#F96302]/20 transition-all rounded-lg min-h-[100px] p-3 resize-y";
  const labelClass = "text-sm font-medium text-slate-700 mb-1.5 block";
  const sectionTitleClass = "text-lg font-semibold text-[#154279] flex items-center gap-2 pb-3 mb-2 border-b border-gray-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-blue-50/70 p-5 rounded-xl border border-blue-100 flex gap-4 text-[#154279] shadow-sm">
        <Info className="w-6 h-6 flex-shrink-0 mt-0.5 text-[#F96302]" />
        <div>
          <p className="text-lg font-semibold">Tenant's Particulars</p>
          <p className="text-sm opacity-80 mt-1">Please provide accurate and clear information to help us process your background check seamlessly.</p>
        </div>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <h3 className={sectionTitleClass}>
          <Building className="w-5 h-5 text-[#F96302]" />
          Unit Selected
        </h3>
        <div>
          <Label className={labelClass}>Property / Unit To Let</Label>
          <Input 
            name="property_to_let" 
            value={form.property_to_let} 
            readOnly 
            className="bg-slate-50 border-gray-300 text-slate-500 font-medium cursor-not-allowed h-12 shadow-inner" 
          />
        </div>

        {unitDetailsLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading full unit details...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500 mb-1">Property Name</p>
              <p className="text-sm font-semibold text-slate-800">{unitDetails?.propertyName || propertyName || "N/A"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500 mb-1">Unit Number</p>
              <p className="text-sm font-semibold text-slate-800">{unitDetails?.unitNumber || unitNumber || "N/A"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500 mb-1">Unit Type ID</p>
              <p className="text-sm font-semibold text-slate-800 break-all">{unitDetails?.unitTypeId || "N/A"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500 mb-1">Unit Type Name</p>
              <p className="text-sm font-semibold text-slate-800">{unitDetails?.unitTypeName || "N/A"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500 mb-1">Rent</p>
              <p className="text-sm font-semibold text-slate-800">
                {unitDetails?.rentAmount ? `KES ${unitDetails.rentAmount.toLocaleString()}` : "N/A"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <p className="text-sm font-semibold text-slate-800 capitalize">{unitDetails?.status || "N/A"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500 mb-1">Floor</p>
              <p className="text-sm font-semibold text-slate-800">{unitDetails?.floorNumber || "N/A"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
              <p className="text-xs text-slate-500 mb-1">Location</p>
              <p className="text-sm font-semibold text-slate-800">{unitDetails?.propertyLocation || locationParam || "N/A"}</p>
            </div>
            {unitDetails?.description && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                <p className="text-xs text-slate-500 mb-1">Unit Description</p>
                <p className="text-sm text-slate-700">{unitDetails.description}</p>
              </div>
            )}
            {unitDetails?.features && unitDetails.features.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                <p className="text-xs text-slate-500 mb-2">Features</p>
                <div className="flex flex-wrap gap-2">
                  {unitDetails.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-5 bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <h3 className={sectionTitleClass}>
          <User className="w-5 h-5 text-[#F96302]" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className={labelClass}>Full Name <span className="text-red-500">*</span></Label>
            <Input name="applicant_name" value={form.applicant_name} onChange={handleChange} required placeholder="John Doe" className={inputClass} />
          </div>
          <div>
             <Label className={labelClass}>Email Address <span className="text-red-500">*</span></Label>
             <Input type="email" name="applicant_email" value={form.applicant_email} onChange={handleChange} required placeholder="john.doe@example.com" className={inputClass} />
          </div>
          {!user?.id && (
            <div>
              <Label className={labelClass}>Password for Registration <span className="text-red-500">*</span></Label>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="At least 6 characters"
                className={inputClass}
              />
            </div>
          )}
          <div>
            <Label className={labelClass}>Telephone Number(s) <span className="text-red-500">*</span></Label>
            <Input name="telephone_numbers" value={form.telephone_numbers} onChange={handleChange} required placeholder="e.g. +254 712 345 678" className={inputClass} />
          </div>
          <div>
             <Label className={labelClass}>Nationality</Label>
             <Input name="nationality" value={form.nationality} onChange={handleChange} placeholder="e.g., Kenyan" className={inputClass} />
          </div>
          <div>
             <Label className={labelClass}>Marital Status</Label>
             <Select value={form.marital_status} onValueChange={(val) => setForm(prev => ({...prev, marital_status: val}))}>
                <SelectTrigger className={inputClass}><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent className="bg-white border-gray-100 shadow-xl">
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                </SelectContent>
             </Select>
          </div>
          <div>
             <Label className={labelClass}>Age Bracket</Label>
             <Select value={form.age_bracket} onValueChange={(val) => setForm(prev => ({...prev, age_bracket: val}))}>
                <SelectTrigger className={inputClass}><SelectValue placeholder="Select Bracket" /></SelectTrigger>
                <SelectContent className="bg-white border-gray-100 shadow-xl">
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="46-55">46-55</SelectItem>
                  <SelectItem value="55+">55+</SelectItem>
                </SelectContent>
             </Select>
          </div>
        </div>
      </div>

      <div className="space-y-5 bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <h3 className={sectionTitleClass}>
          <Briefcase className="w-5 h-5 text-[#F96302]" />
          Employment & Contact Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className={labelClass}>Current Physical Address</Label>
            <Input name="physical_address" value={form.physical_address} onChange={handleChange} placeholder="Apartment/House, Street, Area" className={inputClass} />
          </div>
          <div>
            <Label className={labelClass}>P.O. Box</Label>
            <Input name="po_box" value={form.po_box} onChange={handleChange} placeholder="P.O. Box 12345-00100" className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <Label className={labelClass}>Employer's Name & Address (If self-employed, indicate business)</Label>
            <Textarea name="employer_details" value={form.employer_details} onChange={handleChange} placeholder="Company Name, Office Building, Department..." className={textareaClass} />
          </div>
          <div className="md:col-span-2">
             <Label className={labelClass}>Name & Contact of Next of Kin</Label>
             <Input name="next_of_kin" value={form.next_of_kin} onChange={handleChange} placeholder="Jane Doe - +254 756 789 012 (Sister)" className={inputClass} />
          </div>
           <div>
             <Label className={labelClass}>Next of Kin Email</Label>
             <Input type="email" name="next_of_kin_email" value={form.next_of_kin_email} onChange={handleChange} placeholder="kin@example.com" className={inputClass} />
           </div>
        </div>
      </div>

      <div className="space-y-5 bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <h3 className={sectionTitleClass}>
          <Users className="w-5 h-5 text-[#F96302]" />
          Occupancy Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <Label className={labelClass}>Total persons to live in residence</Label>
             <Input type="number" min="1" name="occupants_count" value={form.occupants_count} onChange={handleChange} placeholder="e.g. 2" className={inputClass} />
          </div>
          <div>
            <Label className={labelClass}>No. of Children</Label>
            <Input type="number" min="0" name="children_count" value={form.children_count} onChange={handleChange} placeholder="e.g. 0" className={inputClass} />
          </div>
          <div className="md:col-span-2 mt-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
             <div className="flex items-center space-x-3">
               <Checkbox 
                 id="house_staff" 
                 checked={form.house_staff} 
                 onCheckedChange={(c) => setForm(prev => ({...prev, house_staff: !!c}))} 
                 className="data-[state=checked]:bg-[#F96302] border-gray-300 w-5 h-5 shadow-sm"
               />
               <Label htmlFor="house_staff" className="text-gray-700 cursor-pointer font-medium text-base">
                 Will you have live-in house staff? (Check if Yes)
               </Label>
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <h3 className={sectionTitleClass}>
          <MapPin className="w-5 h-5 text-[#F96302]" />
          Local Residence Details <span className="text-sm font-normal text-slate-500 ml-2">(If applicable)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
             <Label className={labelClass}>Home Address</Label>
             <Input name="home_address" value={form.home_address} onChange={handleChange} placeholder="Village / Estate" className={inputClass} />
          </div>
          <div>
             <Label className={labelClass}>Location (County/City)</Label>
             <Input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Nairobi" className={inputClass} />
          </div>
          <div>
             <Label className={labelClass}>Sub-Location (Ward/Area)</Label>
             <Input name="sub_location" value={form.sub_location} onChange={handleChange} placeholder="e.g. Westlands" className={inputClass} />
          </div>
        </div>
      </div>

      <div className="pt-4 pb-2">
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full bg-gradient-to-r from-[#154279] to-[#0f3260] hover:from-[#10305a] hover:to-[#0b2446] text-white h-14 text-lg font-bold shadow-lg shadow-blue-900/20 transition-all rounded-xl"
        >
          {isSubmitting ? (
            <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Submitting Application...</>
          ) : (
            "Complete & Submit Application"
          )}
        </Button>
        <p className="text-center text-sm text-gray-500 mt-4">
          By submitting, you agree to our verification and screening process. All information is securely stored.
        </p>
      </div>
    </form>
  );
};
