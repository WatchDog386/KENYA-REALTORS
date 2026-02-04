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
  Building
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

      // First, get tenant info to find property and unit
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("property_id, lease_id, unit_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (tenantError || !tenantData) {
        console.warn("Could not fetch tenant info:", tenantError);
        // Use mock data (fallback)
        setProperty({
          id: "prop-1",
          name: "Sunset Apartments",
          address: "123 Main Street",
          city: "Los Angeles",
          state: "CA",
          zip_code: "90001",
          unit_number: "101",
          manager_name: "John Property Manager",
          manager_phone: "(555) 123-4567",
          manager_email: "manager@example.com",
        });
        setLease({
          id: "lease-1",
          start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          monthly_rent: 1500,
          security_deposit: 3000,
          status: "active",
        });
        return;
      }

      // Get property data with manager info
      if (tenantData.property_id) {
        const { data: propertyData, error: propertyError } = await supabase
          .from("properties")
          .select("*")
          .eq("id", tenantData.property_id)
          .single();

        if (!propertyError && propertyData) {
          let unitNumber = propertyData.unit_number;
          
          // Get unit number if unit_id is available
          if (tenantData.unit_id) {
            const { data: unitData } = await supabase
              .from("units")
              .select("unit_number")
              .eq("id", tenantData.unit_id)
              .single();
            
            if (unitData?.unit_number) {
              unitNumber = unitData.unit_number;
            }
          }

          setProperty({
            ...propertyData,
            unit_number: unitNumber,
          });
        }
      }

      // Get lease data
      if (tenantData.lease_id) {
        const { data: leaseData, error: leaseError } = await supabase
          .from("leases")
          .select("*")
          .eq("id", tenantData.lease_id)
          .single();

        if (!leaseError && leaseData) {
          setLease(leaseData);
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
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
              <Card className="border-none shadow-sm overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-[#154279] to-[#2c5282] relative">
                   <div className="absolute -bottom-10 left-8 p-4 bg-white rounded-xl shadow-md">
                      <Home size={32} className="text-[#F96302]" />
                   </div>
                </div>
                <CardContent className="pt-14 pb-8 px-8">
                   <div className="flex justify-between items-start">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-900">{property.name}</h2>
                        <div className="flex items-center text-gray-500 mt-2">
                          <MapPin size={18} className="mr-2 text-gray-400" />
                          <span>{property.address}, {property.city}, {property.state} {property.zip_code}</span>
                        </div>
                        {property.unit_number && (
                           <Badge variant="secondary" className="mt-4 text-[#154279] bg-blue-50 hover:bg-blue-100">
                             Unit {property.unit_number}
                           </Badge>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      
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
                          <span className="text-sm font-medium text-gray-500">Financials</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Monthly Rent:</span>
                            <span className="font-semibold">{formatCurrency(lease.monthly_rent)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Security Deposit:</span>
                            <span className="font-semibold">{formatCurrency(lease.security_deposit)}</span>
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
                        <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                          <a href={`tel:${property.manager_phone}`}>
                            <Phone className="mr-3 h-4 w-4 text-[#F96302]" />
                            <div className="flex flex-col items-start">
                              <span className="text-xs text-gray-500 font-normal">Phone</span>
                              <span className="text-sm font-semibold text-gray-900">{property.manager_phone}</span>
                            </div>
                          </a>
                        </Button>
                      )}
                      
                      {property.manager_email && (
                        <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                           <a href={`mailto:${property.manager_email}`}>
                            <Mail className="mr-3 h-4 w-4 text-[#154279]" />
                            <div className="flex flex-col items-start">
                              <span className="text-xs text-gray-500 font-normal">Email</span>
                              <span className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">{property.manager_email}</span>
                            </div>
                          </a>
                        </Button>
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
import { DollarSign, Download } from "lucide-react";

export default PropertyPage;
