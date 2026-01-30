import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, MapPin, Phone, Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        // Use mock data
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
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
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
        <Loader2 className="w-8 h-8 animate-spin text-[#00356B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/portal/tenant")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight">
            Property Details
          </h1>
          <p className="text-sm text-gray-600">Information about your rental unit</p>
        </div>
      </div>

      {property ? (
        <div className="space-y-4">
          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home size={20} />
                Your Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {property.name}
                </h3>
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin size={18} className="mt-1" />
                  <div>
                    <p>{property.address}</p>
                    <p>
                      {property.city}, {property.state} {property.zip_code}
                    </p>
                  </div>
                </div>
              </div>
              {property.unit_number && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Unit Number:</span> {property.unit_number}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lease Information */}
          {lease && (
            <Card>
              <CardHeader>
                <CardTitle>Lease Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Lease Start</p>
                    <p className="text-lg font-semibold">
                      {formatDate(lease.start_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Lease End</p>
                    <p className="text-lg font-semibold">
                      {formatDate(lease.end_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Monthly Rent</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(lease.monthly_rent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Security Deposit</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(lease.security_deposit)}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    lease.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Property Manager Contact */}
          {property.manager_name && (
            <Card>
              <CardHeader>
                <CardTitle>Property Manager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{property.manager_name}</p>
                </div>
                {property.manager_phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-600" />
                    <a
                      href={`tel:${property.manager_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {property.manager_phone}
                    </a>
                  </div>
                )}
                {property.manager_email && (
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-600" />
                    <a
                      href={`mailto:${property.manager_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {property.manager_email}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Home size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No property information available</p>
              <p className="text-sm text-gray-400 mt-1">
                Please contact support if you believe this is an error
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyPage;
