// src/pages/portal/tenant/Property.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Home, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  FileText,
  User,
  Shield,
  CheckCircle,
  Building,
  DollarSign,
  Download,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  unit_number?: string;
  floor_number?: number; // Added
  unit_type_name?: string; // Added representing bedrooms/type
  description?: string; // Added from unit
  amenities?: string; // Added from property
  image_url?: string; // Property Image
  unit_image_url?: string; // Unit Image
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
}

interface Lease {
  id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  status: string;
}

const PropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchPropertyData();
    }
  }, [user?.id]);

  // Fetch property and lease data
  const fetchPropertyData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      let tenantData: any = null;
      let leaseRecord: any = null;

      // 1. Fetch Active Lease First (Single Source of Truth)
      const { data: activeLease, error: leaseError } = await supabase
        .from("tenant_leases")
        .select(`
            *,
            units:unit_id (
              id,
              property_id,
              unit_number,
              floor_number,
              description,
              image_url,
              property_unit_types (
                 name,
                 price_per_unit
              )
            )
        `)
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (activeLease && activeLease.units) {
         leaseRecord = activeLease;
         tenantData = {
           property_id: activeLease.units.property_id,
           unit_id: activeLease.unit_id
         };
         console.log("Found Active Lease:", activeLease);
      } else {
         // Fallback to Tenants table only if no lease found (for newly assigned tenants without lease)
         const { data: directTenant } = await supabase
            .from("tenants")
            .select("property_id, unit_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();
            
         if (directTenant) {
             tenantData = directTenant;
             // Fetch unit details manually since we didn't get them through lease
             const { data: unitDetails } = await supabase
                .from("units")
                .select(`
                    id, 
                    unit_number, 
                    floor_number, 
                    description, 
                    image_url,
                    property_unit_types(name, price_per_unit)
                `)
                .eq("id", directTenant.unit_id)
                .single();
             
             if (unitDetails) {
                 // @ts-ignore
                 leaseRecord = { units: unitDetails }; // Mock structure to share logic
             }
         }
      }

      if (!tenantData) {
        setLoading(false);
        return;
      }

      // Get property data
      if (tenantData.property_id) {
        const { data: propertyData, error: propertyError } = await supabase
          .from("properties")
          .select("*")
          .eq("id", tenantData.property_id)
          .single();

        if (!propertyError && propertyData) {
            
          // Extract Unit Details (from lease join or manual fetch)
          const unitObj = leaseRecord?.units || {};
          // @ts-ignore
          const unitTypeObj = unitObj.property_unit_types || {};
          
          const unitNumber = unitObj.unit_number;
          const floorNumber = unitObj.floor_number;
          // @ts-ignore
          const unitTypeName = unitTypeObj.name || "Standard Unit";
          // @ts-ignore
          const unitPrice = unitTypeObj.price_per_unit || 0;
          const unitDescription = unitObj.description || "";
          const unitImageUrl = unitObj.image_url;

          // Fetch Property Manager Details
          let managerDetails = {
             name: "Property Management",
             phone: "",
             email: ""
          };

          const { data: managerAssignment } = await supabase
            .from("property_manager_assignments")
            .select("property_manager_id")
            .eq("property_id", tenantData.property_id)
            .eq("status", "active")
            .maybeSingle();

          if (managerAssignment?.property_manager_id) {
             const { data: managerProfile } = await supabase
                .from("profiles")
                .select("first_name, last_name, phone, email") 
                .eq("id", managerAssignment.property_manager_id)
                .maybeSingle();
             
             if (managerProfile) {
                managerDetails.name = `${managerProfile.first_name || ''} ${managerProfile.last_name || ''}`.trim() || "Property Manager";
                managerDetails.phone = managerProfile.phone || "";
                managerDetails.email = managerProfile.email || "";
             }
          }

          setProperty({
            id: propertyData.id,
            name: propertyData.name,
            address: propertyData.address || propertyData.location,
            city: propertyData.city || propertyData.location?.split(',')[1]?.trim() || "",
            state: propertyData.state || "",
            zip_code: propertyData.zip_code || "",
            amenities: propertyData.amenities,
            image_url: propertyData.image_url,
            unit_number: unitNumber,
            floor_number: floorNumber,
            unit_type_name: unitTypeName,
            description: unitDescription || propertyData.description,
            unit_image_url: unitImageUrl,
            manager_name: managerDetails.name,
            manager_phone: managerDetails.phone,
            manager_email: managerDetails.email
          });

          // Set Lease / Financials
          const rentAmount = leaseRecord?.rent_amount || unitPrice || 0;
          
          setLease({
            id: leaseRecord?.id || "pending",
            start_date: leaseRecord?.start_date || new Date().toISOString(),
            end_date: leaseRecord?.end_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            monthly_rent: rentAmount,
            // RULE: Deposit is same as rent fee
            security_deposit: rentAmount, 
            status: leaseRecord?.status || "active"
         });
        }
      }
    } catch (err) {
      console.error("Error fetching property data:", err);
      toast.error("Failed to load property information");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
         <img
          src="/lovable-uploads/27116824-00d0-4ce0-8d5f-30a840902c33.png"
          alt="Loading..."
          className="w-16 h-16 animate-spin opacity-20"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-nunito min-h-screen bg-slate-50/50">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/portal/tenant")}
          className="hover:bg-slate-100 -ml-2"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#154279] to-[#F96302]">
            Property & Lease
          </h1>
          <p className="text-sm text-gray-500">
            View details about your home and lease agreement
          </p>
        </div>
      </motion.div>

      {property ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content - Property & Lease */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
            >
              <Card className="border-none shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="h-48 bg-gray-100 relative">
                  {property.image_url ? (
                    <img 
                      src={property.image_url} 
                      alt={property.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[#154279] to-[#2c5282] flex items-center justify-center">
                       <Building className="text-white opacity-20 w-16 h-16" />
                    </div>
                  )}
                   <div className="absolute -bottom-10 left-8 p-4 bg-white rounded-xl shadow-md border border-gray-100">
                      {property.unit_image_url ? (
                         <img src={property.unit_image_url} alt="Unit" className="w-8 h-8 object-cover rounded" />
                      ) : (
                         <Home size={32} className="text-[#F96302]" />
                      )}
                   </div>
                </div>
                <CardContent className="pt-14 pb-8 px-8">
                   <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-bold text-gray-900">{property.name}</h2>
                           {property.unit_number && (
                             <Badge variant="secondary" className="text-[#154279] bg-blue-50 hover:bg-blue-100 border-blue-100">
                               Unit {property.unit_number}
                             </Badge>
                           )}
                        </div>
                        <div className="flex items-center text-gray-500 mt-2 mb-4">
                          <MapPin size={18} className="mr-2 text-gray-400" />
                          <span>{property.address}, {property.city}, {property.state} {property.zip_code}</span>
                        </div>
                        
                        {(property.unit_type_name || property.floor_number !== undefined) && (
                           <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 inline-flex mb-4">
                              {property.unit_type_name && (
                                <span className="font-semibold text-[#154279]">{property.unit_type_name}</span>
                              )}
                              {property.floor_number !== undefined && (
                                <>
                                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                  <span>{property.floor_number === 0 ? "Ground Floor" : (property.floor_number + (property.floor_number === 1 ? "st" : property.floor_number === 2 ? "nd" : property.floor_number === 3 ? "rd" : "th") + " Floor")}</span>
                                </>
                              )}
                           </div>
                        )}

                        {property.description && (
                            <div className="text-gray-600 text-sm leading-relaxed max-w-2xl bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <p>{property.description}</p>
                            </div>
                        )}

                        {property.amenities && (
                            <div className="mt-6">
                                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                                    <CheckCircle size={16} className="mr-2 text-emerald-500" />
                                    Amenities & Features
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {property.amenities.split(',').map((amenity, i) => (
                                        <Badge key={i} variant="outline" className="bg-white text-gray-600 hover:bg-gray-50 font-normal">
                                            {amenity.trim()}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                     </div>
                   </div>
                </CardContent>
              </Card>
            </motion.div>

            {lease && (
              <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
              >
                <Card className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-xl text-[#154279] flex items-center">
                        <FileText className="mr-2 h-5 w-5" /> 
                        Lease Details
                      </CardTitle>
                      <CardDescription>Current lease agreement terms</CardDescription>
                    </div>
                    <Badge 
                      className={cn("uppercase", lease.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-700")}
                    >
                      {lease.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 mt-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-100 transition-colors">
                            <div className="flex items-center space-x-3 mb-2">
                            <div className="bg-white p-2 rounded-md shadow-sm text-[#F96302]">
                                <Calendar size={18} />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Duration</span>
                            </div>
                            <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Start Date:</span>
                                <span className="font-semibold">{formatDate(lease.start_date)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">End Date:</span>
                                <span className="font-semibold">{formatDate(lease.end_date)}</span>
                            </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-100 transition-colors">
                            <div className="flex items-center space-x-3 mb-2">
                            <div className="bg-white p-2 rounded-md shadow-sm text-green-600">
                                <DollarSign size={18} />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Rent</span>
                            </div>
                            <div className="flex flex-col justify-center h-full pb-4">
                                <span className="text-xs text-gray-400">Monthly Payment</span>
                                <span className="text-2xl font-bold text-[#154279]">{formatCurrency(lease.monthly_rent)}</span>
                            </div>
                        </div>
                      </div>

                      <div className="p-5 bg-blue-50/30 rounded-lg border border-blue-100">
                        <div className="flex items-center space-x-2 mb-3">
                           <Info size={16} className="text-blue-600" />
                           <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Move-in Cost Breakdown</span>
                        </div>
                        <div className="space-y-3 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
                          <div className="flex justify-between text-sm items-center">
                            <div className="flex items-center">
                                <span className="w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
                                <span className="text-gray-600">First Month Rent</span>
                            </div>
                            <span className="font-medium text-gray-900">{formatCurrency(lease.monthly_rent)}</span>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <div className="flex items-center">
                                <span className="w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
                                <span className="text-gray-600">Security Deposit (100% of Rent)</span>
                            </div>
                            <span className="font-medium text-gray-900">{formatCurrency(lease.security_deposit)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-base">
                            <span className="font-bold text-gray-800">Total Required to Move In</span>
                            <span className="font-bold text-green-600">{formatCurrency(lease.monthly_rent + lease.security_deposit)}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button variant="outline" className="text-[#154279] border-[#154279]/20 hover:bg-[#154279]/5">
                        <Download className="mr-2 h-4 w-4" /> Download Lease PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Manager & Support */}
          <div className="space-y-8">
            <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.3 }}
            >
              <Card className="border-none shadow-sm bg-white h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F96302]/10 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />
                
                <CardHeader>
                  <CardTitle className="text-lg text-[#154279] flex items-center">
                    <User className="mr-2 h-5 w-5" /> Property Manager
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <div className="h-20 w-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-3">
                        <User className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900">{property.manager_name || "Property Management"}</h3>
                      <p className="text-xs text-gray-500">Your primary contact</p>
                   </div>
                   
                   <div className="space-y-3">
                      {property.manager_phone && (
                        <div className="w-full p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center shadow-sm">
                          <a href={`tel:${property.manager_phone}`} className="flex items-center w-full">
                            <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center mr-3 shrink-0">
                               <Phone className="h-5 w-5 text-[#F96302]" />
                            </div>
                            <div className="flex flex-col items-start overflow-hidden">
                              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</span>
                              <span className="text-sm font-bold text-[#154279] truncate">{property.manager_phone}</span>
                            </div>
                          </a>
                        </div>
                      )}
                      
                      {property.manager_email && (
                        <div className="w-full p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center shadow-sm">
                           <a href={`mailto:${property.manager_email}`} className="flex items-center w-full">
                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mr-3 shrink-0">
                               <Mail className="h-5 w-5 text-[#154279]" />
                            </div>
                            <div className="flex flex-col items-start overflow-hidden">
                              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</span>
                              <span className="text-sm font-bold text-[#154279] truncate max-w-[180px]">{property.manager_email}</span>
                            </div>
                          </a>
                        </div>
                      )}
                   </div>
                </CardContent>
              </Card>
            </motion.div>

             <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.4 }}
            >
              <Card className="border-none shadow-sm bg-blue-50/50">
                <CardContent className="p-6">
                   <div className="flex items-start gap-4">
                      <div className="bg-[#154279]/10 p-2.5 rounded-lg text-[#154279]">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#154279] mb-1">Renters Insurance</h3>
                        <p className="text-xs text-gray-600 mb-3">
                          Protect your personal property. We recommend all tenants maintain active insurance.
                        </p>
                        <Button size="sm" variant="link" className="px-0 text-[#F96302] h-auto text-xs">
                          Upload Proof of Insurance &rarr;
                        </Button>
                      </div>
                   </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      ) : (
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center py-16">
              <div className="bg-gray-100 p-6 rounded-full inline-flex mb-4">
                 <Building size={48} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No property linked</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn't find a property associated with your account. If you just moved in, please contact your property manager.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Icon components helper for reused icons
// import { DollarSign, Download } from "lucide-react"; // Moved to top imports

export default PropertyPage;
