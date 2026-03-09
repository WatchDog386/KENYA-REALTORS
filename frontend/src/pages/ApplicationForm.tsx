// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  CheckCircle,
  Home,
  MapPin,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { FaSignInAlt } from "react-icons/fa"; // Imported Login Icon
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- GLOBAL STYLES FOR CONSISTENT THEME ---
const GlobalStyles = () => (
  <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      .font-inter { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      
      .brand-gradient {
        background: linear-gradient(135deg, rgba(21, 66, 121, 0.05) 0%, rgba(249, 99, 2, 0.05) 100%);
      }
  `}</style>
);

const THEME = {
  primary: "#154279",
  secondary: "#F96302", // Orange
  secondaryHover: "#E85D02",
};

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"post" | "looking">("post");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionType, setSubmissionType] = useState<"post" | "looking" | null>(null);

  // Handle query parameter for tab selection
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "looking") {
      setActiveTab("looking");
    } else if (type === "post") {
      setActiveTab("post");
    }
  }, [searchParams]);

  // Post Rental Form State
  const [postRentalForm, setPostRentalForm] = useState({
    property_title: "",
    property_type: "",
    property_location: "",
    property_description: "",
    monthly_rent: "",
    bedrooms: "",
    bathrooms: "",
    amenities: [] as string[],
    contact_name: "",
    contact_phone: "",
    contact_email: "",
  });

  // Looking for Rental Form State
  const [lookingForRentalForm, setLookingForRentalForm] = useState({
    preferred_unit_type: "",
    budget_min: "",
    budget_max: "",
    preferred_locations: [] as string[],
    occupancy_date: "",
  });

  const amenitiesList = [
    "WiFi",
    "Parking",
    "Pool",
    "Gym",
    "Security",
    "Laundry",
    "AC",
    "Furnished",
    "Pet Friendly",
    "Balcony",
    "Garden",
    "Elevator",
  ];

  const unitTypes = ["Studio", "Bed-sitter", "1 Bedroom", "2 Bedroom", "3 Bedroom", "4+ Bedroom"];
  const locations = [
    "Westlands",
    "Kilimani",
    "Lavington",
    "Karen",
    "CBD",
    "Roysambu",
    "Ayden Home Towers, Wing A",
    "Ayden Home Towers, Wing B",
    "Ayden Home Towers, Wing C",
  ];

  // Handle Post Rental Form Changes
  const handlePostRentalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPostRentalForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePostRentalSelectChange = (name: string, value: string) => {
    setPostRentalForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setPostRentalForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  // Handle Looking for Rental Form Changes
  const handleLookingForRentalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLookingForRentalForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLookingForRentalSelectChange = (name: string, value: string) => {
    setLookingForRentalForm(prev => ({ ...prev, [name]: value }));
  };

  const togglePreferredLocation = (location: string) => {
    setLookingForRentalForm(prev => ({
      ...prev,
      preferred_locations: prev.preferred_locations.includes(location)
        ? prev.preferred_locations.filter(l => l !== location)
        : [...prev.preferred_locations, location],
    }));
  };

  // Submit Post Rental Application
  const handleSubmitPostRental = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in first");
      navigate("/login");
      return;
    }

    // Validate required fields
    if (
      !postRentalForm.property_title ||
      !postRentalForm.property_type ||
      !postRentalForm.property_location ||
      !postRentalForm.monthly_rent ||
      !postRentalForm.contact_name ||
      !postRentalForm.contact_phone ||
      !postRentalForm.contact_email
    ) {
      toast.error("Please fill in all required fields (*)");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("rental_applications").insert([
        {
          user_id: user.id,
          application_type: "post_rental",
          property_title: postRentalForm.property_title,
          property_type: postRentalForm.property_type,
          property_location: postRentalForm.property_location,
          property_description: postRentalForm.property_description,
          monthly_rent: parseFloat(postRentalForm.monthly_rent),
          bedrooms: postRentalForm.bedrooms ? parseInt(postRentalForm.bedrooms) : null,
          bathrooms: postRentalForm.bathrooms ? parseInt(postRentalForm.bathrooms) : null,
          amenities: postRentalForm.amenities,
          contact_name: postRentalForm.contact_name,
          contact_phone: postRentalForm.contact_phone,
          contact_email: postRentalForm.contact_email,
          status: "pending",
        },
      ]);

      if (error) {
        console.error("Error submitting application:", error);
        toast.error("Failed to submit application. Please try again.");
        return;
      }

      setSubmissionSuccess(true);
      setSubmissionType("post");
      setPostRentalForm({
        property_title: "",
        property_type: "",
        property_location: "",
        property_description: "",
        monthly_rent: "",
        bedrooms: "",
        bathrooms: "",
        amenities: [],
        contact_name: "",
        contact_phone: "",
        contact_email: "",
      });

      toast.success("Application submitted successfully! Our team will review it shortly.");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("An error occurred while submitting your application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Looking for Rental Application
  const handleSubmitLookingForRental = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !lookingForRentalForm.preferred_unit_type ||
      !lookingForRentalForm.budget_min ||
      !lookingForRentalForm.budget_max ||
      lookingForRentalForm.preferred_locations.length === 0 ||
      !lookingForRentalForm.occupancy_date
    ) {
      toast.error("Please fill in all required fields (*)");
      return;
    }

    setIsSubmitting(true);
    try {
      // If user is logged in, save application to database
      if (user) {
        const { error } = await supabase.from("rental_applications").insert([
          {
            user_id: user.id,
            application_type: "looking_for_rental",
            preferred_unit_type: lookingForRentalForm.preferred_unit_type,
            budget_min: parseFloat(lookingForRentalForm.budget_min),
            budget_max: parseFloat(lookingForRentalForm.budget_max),
            preferred_locations: lookingForRentalForm.preferred_locations,
            occupancy_date: lookingForRentalForm.occupancy_date,
            status: "pending",
          },
        ]);

        if (error) {
          console.error("Error submitting application:", error);
          toast.error("Failed to submit application. Please try again.");
          return;
        }
      }

      setSubmissionSuccess(true);
      setSubmissionType("looking");
      setLookingForRentalForm({
        preferred_unit_type: "",
        budget_min: "",
        budget_max: "",
        preferred_locations: [],
        occupancy_date: "",
      });

      toast.success("Thank you! Your rental request has been submitted. Redirecting to sign up...");

      // Redirect to register page after a delay
      setTimeout(() => {
        navigate("/register");
      }, 2000);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("An error occurred while submitting your request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Message Component
  if (submissionSuccess && submissionType === "post") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter"
      >
        <GlobalStyles />
        <Card className="w-full max-w-md border border-gray-100 shadow-2xl bg-white backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="flex justify-center mb-4"
            >
              <CheckCircle className="w-20 h-20 text-[#F96302]" />
            </motion.div>
            <CardTitle className="text-3xl text-[#154279] font-bold">Success!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-gray-800">
                Your rental property has been submitted
              </p>
              <p className="text-gray-600">
                Thank you for listing your property! Our team will review your application and
                get back to you within 48 hours.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-[#154279]">
                <strong>Next Steps:</strong> You'll receive an email confirmation shortly. Check
                your inbox for updates on your application status.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-[#154279] text-[#154279] hover:bg-blue-50"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
              <Button
                className="flex-1 bg-[#F96302] hover:bg-[#E85D02] text-white"
                onClick={() => {
                  setSubmissionSuccess(false);
                  setSubmissionType(null);
                  setActiveTab("post");
                }}
              >
                Submit Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-inter">
      <GlobalStyles />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            className="mb-6 text-[#154279] hover:text-[#F96302] hover:bg-transparent pl-0"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#F96302]/10 p-3 rounded-xl">
              <FaSignInAlt className="w-8 h-8 text-[#F96302]" />
            </div>
            <div>
               <h1 className="text-4xl font-bold text-[#154279]">Rental Applications</h1>
               <p className="text-lg text-gray-600 mt-1">
                Post your property or find your ideal rental home
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Change Handler */}
        {/* Tabs */}
        <Card className="shadow-xl border border-gray-200 bg-white overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-100 pb-0 pt-6 px-6">
            <Tabs value={activeTab} onValueChange={(val: string) => { if (val === "post" || val === "looking") setActiveTab(val); }} className="w-full">
              <TabsList className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-xl mb-6">
                <TabsTrigger
                  value="post"
                  className="rounded-lg data-[state=active]:bg-[#154279] data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 font-medium transition-all"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Post a Rental
                </TabsTrigger>
                <TabsTrigger
                  value="looking"
                  className="rounded-lg data-[state=active]:bg-[#154279] data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 font-medium transition-all"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Looking for Rental
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            {/* POST RENTAL TAB */}
            {activeTab === "post" && (
              <TabsContent value="post" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-[#154279]">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#F96302]" />
                  <p className="text-sm">
                    Fill in your property details below. All fields marked with * are required.
                  </p>
                </div>

                <form onSubmit={handleSubmitPostRental} className="space-y-8">
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                       <Home className="w-5 h-5 text-[#154279]" /> 
                       <h3 className="text-xl font-bold text-[#154279]">Property Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="property_title" className="text-gray-700 font-medium">Property Title *</Label>
                        <Input
                          id="property_title"
                          name="property_title"
                          value={postRentalForm.property_title}
                          onChange={handlePostRentalChange}
                          placeholder="e.g., Modern 2-Bedroom in Westlands"
                          required
                          className="bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="property_type" className="text-gray-700 font-medium">Property Type *</Label>
                        <Select
                          value={postRentalForm.property_type}
                          onValueChange={(value) =>
                            handlePostRentalSelectChange("property_type", value)
                          }
                        >
                          <SelectTrigger className="bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900">
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="Studio">Studio</SelectItem>
                            <SelectItem value="Bedsitter">Bed-sitter</SelectItem>
                            <SelectItem value="1 Bedroom">1 Bedroom</SelectItem>
                            <SelectItem value="2 Bedroom">2 Bedroom</SelectItem>
                            <SelectItem value="3 Bedroom">3 Bedroom</SelectItem>
                            <SelectItem value="House">House</SelectItem>
                            <SelectItem value="Apartment">Apartment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="property_location" className="text-gray-700 font-medium">Location *</Label>
                      <Input
                        id="property_location"
                        name="property_location"
                        value={postRentalForm.property_location}
                        onChange={handlePostRentalChange}
                        placeholder="e.g., Westlands, Nairobi"
                        required
                        className="bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="property_description" className="text-gray-700 font-medium">Property Description</Label>
                      <Textarea
                        id="property_description"
                        name="property_description"
                        value={postRentalForm.property_description}
                        onChange={handlePostRentalChange}
                        placeholder="Describe your property: condition, features, utilities included, etc."
                        rows={4}
                        className="bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900 resize-none"
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                       <CheckCircle className="w-5 h-5 text-[#154279]" /> 
                       <h3 className="text-xl font-bold text-[#154279]">Property Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="monthly_rent" className="text-gray-700 font-medium">Monthly Rent (KES) *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">KES</span>
                          <Input
                            id="monthly_rent"
                            name="monthly_rent"
                            type="number"
                            value={postRentalForm.monthly_rent}
                            onChange={handlePostRentalChange}
                            className="pl-12 bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900"
                            placeholder="45000"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms" className="text-gray-700 font-medium">Bedrooms</Label>
                        <Select
                          value={postRentalForm.bedrooms}
                          onValueChange={(value) =>
                            handlePostRentalSelectChange("bedrooms", value)
                          }
                        >
                          <SelectTrigger className="bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900">
                            <SelectValue placeholder="Number of bedrooms" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num === 0 ? "Studio" : num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bathrooms" className="text-gray-700 font-medium">Bathrooms</Label>
                        <Select
                          value={postRentalForm.bathrooms}
                          onValueChange={(value) =>
                            handlePostRentalSelectChange("bathrooms", value)
                          }
                        >
                          <SelectTrigger className="bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900">
                            <SelectValue placeholder="Number of bathrooms" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-gray-700 font-medium block mb-2">Amenities</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {amenitiesList.map((amenity) => (
                          <div key={amenity} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-100 hover:border-gray-300 transition-colors">
                            <Checkbox
                              id={`amenity-${amenity}`}
                              checked={postRentalForm.amenities.includes(amenity)}
                              onCheckedChange={() => toggleAmenity(amenity)}
                              className="data-[state=checked]:bg-[#F96302] data-[state=checked]:border-[#F96302]"
                            />
                            <Label
                              htmlFor={`amenity-${amenity}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {amenity}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                       <CheckCircle className="w-5 h-5 text-[#154279]" /> 
                       <h3 className="text-xl font-bold text-[#154279]">Contact Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="contact_name" className="text-gray-700 font-medium">Contact Name *</Label>
                        <Input
                          id="contact_name"
                          name="contact_name"
                          value={postRentalForm.contact_name}
                          onChange={handlePostRentalChange}
                          placeholder="John Doe"
                          required
                          className="bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_phone" className="text-gray-700 font-medium">Contact Phone *</Label>
                        <Input
                          id="contact_phone"
                          name="contact_phone"
                          value={postRentalForm.contact_phone}
                          onChange={handlePostRentalChange}
                          placeholder="+254 711 000 000"
                          required
                          className="bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_email" className="text-gray-700 font-medium">Contact Email *</Label>
                      <Input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        value={postRentalForm.contact_email}
                        onChange={handlePostRentalChange}
                        placeholder="john@example.com"
                        required
                        className="bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900"
                      />
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        This contact information will be visible to potential tenants.
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#F96302] hover:bg-[#E85D02] text-white h-12 text-lg font-semibold shadow-lg shadow-orange-500/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Post Property Listing"
                    )}
                  </Button>
                </form>
              </TabsContent>
            )}

            {/* LOOKING FOR RENTAL TAB */}
            {activeTab === "looking" && (
              <TabsContent value="looking" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-[#154279]">
                  <AlertCircle className="w-5 h-5 text-[#F96302] flex-shrink-0 mt-0.5" />
                  <p className="text-sm">
                    Tell us what you're looking for. After submission, you'll be redirected to
                    create an account. All fields marked with * are required.
                  </p>
                </div>

                <form onSubmit={handleSubmitLookingForRental} className="space-y-8">
                  {/* Unit Type & Budget */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                       <MapPin className="w-5 h-5 text-[#154279]" /> 
                       <h3 className="text-xl font-bold text-[#154279]">Rental Preferences</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="preferred_unit_type" className="text-gray-700 font-medium">Unit Type *</Label>
                        <Select
                          value={lookingForRentalForm.preferred_unit_type}
                          onValueChange={(value) =>
                            handleLookingForRentalSelectChange("preferred_unit_type", value)
                          }
                        >
                          <SelectTrigger className="bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900">
                            <SelectValue placeholder="Select unit type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            {unitTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="occupancy_date" className="text-gray-700 font-medium">Occupancy Date *</Label>
                        <Input
                          id="occupancy_date"
                          name="occupancy_date"
                          type="date"
                          value={lookingForRentalForm.occupancy_date}
                          onChange={handleLookingForRentalChange}
                          required
                          className="bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Budget Range */}
                    <div className="space-y-3">
                      <Label className="text-gray-700 font-medium">Budget Range (KES) *</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="budget_min" className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                            Minimum
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">KES</span>
                            <Input
                              id="budget_min"
                              name="budget_min"
                              type="number"
                              value={lookingForRentalForm.budget_min}
                              onChange={handleLookingForRentalChange}
                              className="pl-12 bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900"
                              placeholder="15000"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="budget_max" className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                            Maximum
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">KES</span>
                            <Input
                              id="budget_max"
                              name="budget_max"
                              type="number"
                              value={lookingForRentalForm.budget_max}
                              onChange={handleLookingForRentalChange}
                              className="pl-12 bg-white border-gray-200 focus:border-[#F96302] focus:ring-[#F96302]/20 text-gray-900"
                              placeholder="80000"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preferred Locations */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                       <h3 className="text-xl font-bold text-[#154279]">Preferred Locations *</h3>
                       <span className="text-sm text-gray-600">Select at least one</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {locations.map((location) => (
                        <div key={location} className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 hover:border-gray-300 transition-colors">
                          <Checkbox
                            id={`location-${location}`}
                            checked={lookingForRentalForm.preferred_locations.includes(location)}
                            onCheckedChange={() => togglePreferredLocation(location)}
                            className="data-[state=checked]:bg-[#154279] data-[state=checked]:border-[#154279]"
                          />
                          <Label
                            htmlFor={`location-${location}`}
                            className="text-sm font-normal cursor-pointer flex-1 text-gray-700"
                          >
                            {location}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#154279] hover:bg-[#0f3260] text-white h-12 text-lg font-semibold shadow-lg shadow-blue-900/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit & Continue to Sign Up"
                    )}
                  </Button>
                </form>
              </TabsContent>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationForm;
