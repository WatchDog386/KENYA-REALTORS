// src/pages/portal/tenant/Property.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const PANEL_HEADER_CLASS =
  "border-b border-[#bcc3cd] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#5d6c7c]";

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
      <div className="flex min-h-[55vh] items-center justify-center bg-[#d7dce1]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#154279]" />
          <p className="text-[13px] font-medium text-[#5f6b7c]">Loading property data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 md:p-6 font-['Poppins','Segoe_UI',sans-serif] text-[#243041]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mx-auto max-w-[1500px] space-y-3">
        <section className="border border-[#bcc3cd] bg-[#eef1f4]">
          <div className={PANEL_HEADER_CLASS}>My Property</div>
          <div className="p-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4cad3] pb-3">
              <div>
                <h1 className="text-[34px] font-bold leading-none text-[#1f2937]">Property & Lease</h1>
                <p className="mt-2 text-[13px] font-medium text-[#5f6b7c]">View details about your unit, manager and lease terms.</p>
              </div>

              <Button
                onClick={() => navigate("/portal/tenant")}
                className="h-10 rounded-none border border-[#b6bec8] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]"
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        </section>

        {property ? (
          <>
            <section className="border border-[#bcc3cd] bg-[#eef1f4]">
              <div className={PANEL_HEADER_CLASS}>Property Overview</div>
              <div className="grid grid-cols-1 gap-4 p-3 xl:grid-cols-12">
                <div className="space-y-4 xl:col-span-8">
                  <div className="border border-[#c7cdd6] bg-white p-3">
                    <div className="h-[260px] w-full border border-[#d8dde3] bg-[#e3e7ec] overflow-hidden">
                      {property.image_url ? (
                        <img src={property.image_url} alt={property.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Building className="h-16 w-16 text-[#9aa4ae]" />
                        </div>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                      <div className="border-l-2 border-l-[#b7c0cb] px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Property</p>
                        <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{property.name}</p>
                      </div>
                      <div className="border-l-2 border-l-[#b7c0cb] px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Unit</p>
                        <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{property.unit_number ? `Unit ${property.unit_number}` : "Not set"}</p>
                      </div>
                      <div className="border-l-2 border-l-[#b7c0cb] px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Type</p>
                        <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{property.unit_type_name || "Standard Unit"}</p>
                      </div>
                      <div className="border-l-2 border-l-[#b7c0cb] px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Floor</p>
                        <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">
                          {property.floor_number === undefined
                            ? "Not set"
                            : property.floor_number === 0
                              ? "Ground Floor"
                              : `${property.floor_number}${
                                  property.floor_number === 1
                                    ? "st"
                                    : property.floor_number === 2
                                      ? "nd"
                                      : property.floor_number === 3
                                        ? "rd"
                                        : "th"
                                } Floor`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 border border-[#d8dde3] bg-[#f7f9fb] px-3 py-2 text-[13px] text-[#334155]">
                      <div className="flex items-center gap-2 font-medium text-[#1f2937]">
                        <MapPin className="h-4 w-4 text-[#154279]" />
                        <span>{property.address}, {property.city}, {property.state} {property.zip_code}</span>
                      </div>
                    </div>

                    {property.description && (
                      <div className="mt-3 border border-[#d8dde3] bg-white px-3 py-3 text-[13px] text-[#334155] leading-6">
                        {property.description}
                      </div>
                    )}

                    {property.amenities && (
                      <div className="mt-3 border border-[#d8dde3] bg-white px-3 py-3">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#5d6c7c]">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          Amenities
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.split(",").map((amenity, index) => (
                            <span key={`${amenity}-${index}`} className="border border-[#c7cdd6] bg-[#f7f9fb] px-2 py-1 text-[12px] font-medium text-[#334155]">
                              {amenity.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 xl:col-span-4">
                  <div className="border border-[#c7cdd6] bg-white p-3">
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Manager Contact</div>
                    <div className="space-y-3">
                      <div className="border-l-2 border-l-[#b7c0cb] px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Name</p>
                        <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{property.manager_name || "Property Management"}</p>
                      </div>
                      <div className="border-l-2 border-l-[#b7c0cb] px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Phone</p>
                        {property.manager_phone ? (
                          <a href={`tel:${property.manager_phone}`} className="mt-1 inline-flex items-center text-[13px] font-semibold text-[#154279] hover:text-[#F96302]">
                            <Phone className="mr-2 h-4 w-4" />
                            {property.manager_phone}
                          </a>
                        ) : (
                          <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">Not set</p>
                        )}
                      </div>
                      <div className="border-l-2 border-l-[#b7c0cb] px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Email</p>
                        {property.manager_email ? (
                          <a href={`mailto:${property.manager_email}`} className="mt-1 inline-flex items-center text-[13px] font-semibold text-[#154279] hover:text-[#F96302] break-all">
                            <Mail className="mr-2 h-4 w-4" />
                            {property.manager_email}
                          </a>
                        ) : (
                          <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">Not set</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border border-[#c7cdd6] bg-[#f7f9fb] p-3">
                    <div className="flex items-start gap-3">
                      <div className="border border-[#c7cdd6] bg-white p-2 text-[#154279]">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-semibold text-[#1f2937]">Renters Insurance</h3>
                        <p className="mt-1 text-[12px] text-[#5f6b7c]">We recommend an active insurance cover for your personal items.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {lease && (
              <section className="border border-[#bcc3cd] bg-[#eef1f4]">
                <div className={PANEL_HEADER_CLASS}>Lease & Charges</div>
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                    <div className="border-l-2 border-l-[#b7c0cb] bg-white px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Status</p>
                      <p className="mt-1 text-[13px] font-semibold text-[#1f2937] uppercase">{lease.status}</p>
                    </div>
                    <div className="border-l-2 border-l-[#b7c0cb] bg-white px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Start Date</p>
                      <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{formatDate(lease.start_date)}</p>
                    </div>
                    <div className="border-l-2 border-l-[#b7c0cb] bg-white px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">End Date</p>
                      <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{formatDate(lease.end_date)}</p>
                    </div>
                    <div className="border-l-2 border-l-[#b7c0cb] bg-white px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Monthly Rent</p>
                      <p className="mt-1 text-[13px] font-semibold text-[#154279]">{formatCurrency(lease.monthly_rent)}</p>
                    </div>
                  </div>

                  <div className="border border-[#c7cdd6] bg-white p-3">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#5d6c7c]">
                      <Info className="h-4 w-4 text-[#154279]" />
                      Move-In Cost Breakdown
                    </div>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex items-center justify-between border-b border-[#e2e7ec] pb-2">
                        <span className="text-[#475569]">First Month Rent</span>
                        <span className="font-semibold text-[#1f2937]">{formatCurrency(lease.monthly_rent)}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#e2e7ec] pb-2">
                        <span className="text-[#475569]">Security Deposit (100% of Rent)</span>
                        <span className="font-semibold text-[#1f2937]">{formatCurrency(lease.security_deposit)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[14px]">
                        <span className="font-bold text-[#1f2937]">Total Required to Move In</span>
                        <span className="font-bold text-emerald-700">{formatCurrency(lease.monthly_rent + lease.security_deposit)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" className="h-10 rounded-none border border-[#b6bec8] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]">
                      <Download className="mr-2 h-4 w-4" />
                      Download Lease PDF
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          <section className="border border-[#bcc3cd] bg-[#eef1f4]">
            <div className={PANEL_HEADER_CLASS}>Property Overview</div>
            <div className="p-3">
              <div className="border border-[#c7cdd6] bg-white py-14 text-center">
                <Building size={48} className="mx-auto mb-3 text-[#9aa4ae]" />
                <h3 className="text-[18px] font-semibold text-[#1f2937]">No property linked</h3>
                <p className="mx-auto mt-2 max-w-xl text-[13px] text-[#5f6b7c]">
                  We couldn't find a property associated with your account. If you just moved in, please contact your property manager.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// Icon components helper for reused icons
// import { DollarSign, Download } from "lucide-react"; // Moved to top imports

export default PropertyPage;
