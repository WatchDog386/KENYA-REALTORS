import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../integrations/supabase/client";
import {
  Briefcase,
  Loader2,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Home,
  Users,
  DollarSign,
  Building2,
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";

interface ProprietorProfile {
  id: string;
  user_id: string;
  business_name?: string;
  status: string;
  properties_count?: number;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  };
}

interface OwnedProperty {
  id: string;
  proprietor_id: string;
  property_id: string;
  ownership_percentage: number;
  assigned_at: string;
  property?: {
    id: string;
    name: string;
    location: string;
    status: string;
    total_monthly_rental_expected?: number;
    image_url?: string;
    monthly_rent: number;
    occupied_units: number;
    total_units: number;
    type?: string;
  };
}

export const ProprietorDashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const [proprietor, setProprietor] = useState<ProprietorProfile | null>(null);
  const [properties, setProperties] = useState<OwnedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    if (authUser?.id) {
      void loadProprietorData();
    }
  }, [authUser?.id]);

  const loadProprietorData = async () => {
    try {
      setLoading(true);

      if (!authUser?.id) {
        setProprietor(null);
        setProperties([]);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, phone, avatar_url, assigned_property_id")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        console.warn("Unable to load proprietor profile details:", profileError);
      }

      const { data: propData, error: propError } = await supabase
        .from("proprietors")
        .select(`
          id,
          user_id,
          business_name,
          status
        `)
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (propError && propError.code !== "PGRST116") throw propError;

      const mappedProp: ProprietorProfile = propData
        ? {
            ...(propData as any),
            profile: (profileData as any) || undefined,
          }
        : {
            id: authUser.id,
            user_id: authUser.id,
            business_name: undefined,
            status: "active",
            properties_count: 0,
            profile: (profileData as any) || undefined,
          };

      setProprietor(mappedProp);

      const proprietorIdCandidates = Array.from(
        new Set([propData?.id, authUser.id].filter(Boolean)),
      ) as string[];

      if (proprietorIdCandidates.length === 0) {
        setProperties([]);
        return;
      }

      let assignmentsQuery = supabase
        .from("proprietor_properties")
        .select(`
          id,
          proprietor_id,
          property_id,
          ownership_percentage,
          is_active,
          assigned_at,
          property:properties(
            id,
            name,
            location,
            type,
            status,
            image_url
          )
        `)
        .in("proprietor_id", proprietorIdCandidates)
        .order("assigned_at", { ascending: false });

      assignmentsQuery = assignmentsQuery.or("is_active.is.null,is_active.eq.true");

      let { data: propsData, error: propsError } = await assignmentsQuery;

      if (propsError) {
        console.warn("Unable to load proprietor_properties rows for dashboard, using fallbacks:", propsError);
        propsData = [];
      }

      if ((propsData || []).length === 0) {
        const { data: relaxedData, error: relaxedError } = await supabase
          .from("proprietor_properties")
          .select(`
            id,
            proprietor_id,
            property_id,
            ownership_percentage,
            is_active,
            assigned_at,
            property:properties(
              id,
              name,
              location,
              type,
              status,
              image_url
            )
          `)
          .in("proprietor_id", proprietorIdCandidates)
          .order("assigned_at", { ascending: false });

        if (relaxedError) {
          console.warn("Relaxed proprietor_properties query failed, using fallbacks:", relaxedError);
        }

        if (!relaxedError && (relaxedData || []).length > 0) {
          propsData = relaxedData;
        }
      }

      const profileAssignedPropertyId = (profileData as any)?.assigned_property_id as string | undefined;
      if ((propsData || []).length === 0 && profileAssignedPropertyId) {
        propsData = [
          {
            id: `profile-assignment-${profileAssignedPropertyId}`,
            proprietor_id: propData?.id || authUser.id,
            property_id: profileAssignedPropertyId,
            ownership_percentage: 100,
            assigned_at: new Date().toISOString(),
            property: null,
          },
        ] as any[];
      }

      if ((propsData || []).length === 0) {
        const { data: visibleProperties, error: visiblePropertiesError } = await supabase
          .from("properties")
          .select("id, name, location, type, description, status, total_monthly_rental_expected, image_url, number_of_floors")
          .order("created_at", { ascending: false });

        if (visiblePropertiesError) {
          console.warn("Direct properties fallback failed:", visiblePropertiesError);
        } else if ((visibleProperties || []).length > 0) {
          propsData = (visibleProperties || []).map((property: any, index: number) => ({
            id: `visible-property-${property.id}-${index}`,
            proprietor_id: propData?.id || authUser.id,
            property_id: property.id,
            ownership_percentage: 100,
            assigned_at: new Date().toISOString(),
            property,
          }));
        }
      }

      const propertyIds = (propsData || [])
        .map((item: any) => {
          const property = Array.isArray(item.property) ? item.property[0] : item.property;
          return item.property_id || property?.id || null;
        })
        .filter(Boolean);

      const uniquePropertyIds = Array.from(new Set(propertyIds as string[]));

      let propertyById = new Map<string, any>();
      if (uniquePropertyIds.length > 0) {
        const { data: propertyRows, error: propertyRowsError } = await supabase
          .from("properties")
          .select("id, name, location, type, description, status, total_monthly_rental_expected, image_url, number_of_floors")
          .in("id", uniquePropertyIds);

        if (!propertyRowsError) {
          propertyById = new Map((propertyRows || []).map((row: any) => [row.id, row]));
        }
      }

      const unitStatsByProperty = new Map<string, { total: number; occupied: number; estimatedMonthlyRent: number }>();
      if (uniquePropertyIds.length > 0) {
        const { data: unitsData, error: unitsError } = await supabase
          .from("units")
          .select("property_id, status, price")
          .in("property_id", uniquePropertyIds);

        if (unitsError) {
          console.warn("Unable to load unit occupancy stats for proprietor dashboard:", unitsError);
        } else {
          (unitsData || []).forEach((unit: any) => {
            const propertyId = unit.property_id;
            if (!propertyId) return;

            const current = unitStatsByProperty.get(propertyId) || { total: 0, occupied: 0, estimatedMonthlyRent: 0 };
            current.total += 1;
            if (unit.status === "occupied") {
              current.occupied += 1;
            }
            current.estimatedMonthlyRent += Number(unit.price || 0);
            unitStatsByProperty.set(propertyId, current);
          });
        }
      }

      const mappedProps = (propsData || []).map((p: any) => {
        const relationProperty = Array.isArray(p.property) ? p.property[0] : p.property;
        const property = relationProperty || propertyById.get(p.property_id) || null;
        const stats = property?.id ? unitStatsByProperty.get(property.id) : undefined;
        const total_units = stats?.total || 0;
        const occupied_units = stats?.occupied || 0;
        const monthly_rent = Number(property?.total_monthly_rental_expected || stats?.estimatedMonthlyRent || 0);

        return {
          ...p,
          property: {
            ...property,
            total_units,
            occupied_units,
            monthly_rent,
          },
        };
      });

      setProperties(mappedProps);
    } catch (error: any) {
      console.error("Error loading proprietor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadProprietorData();
  };

  const getProprietorName = () => {
    if (!proprietor) return "Proprietor";
    const { first_name, last_name } = proprietor.profile || {};
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    }
    return proprietor.business_name || "Proprietor";
  };

  const totalMonthlyRent = properties.reduce(
    (sum, p) => sum + ((p.property?.monthly_rent || 0) * (p.ownership_percentage / 100)),
    0,
  );

  const totalUnits = properties.reduce((sum, p) => sum + (p.property?.total_units || 0), 0);

  const occupiedUnits = properties.reduce((sum, p) => sum + (p.property?.occupied_units || 0), 0);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#2f3d51]" />
          <p className="text-[13px] font-medium text-[#5f6b7c]">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  const averageOwnership =
    properties.length > 0
      ? Math.round(
          properties.reduce((sum, property) => sum + Number(property.ownership_percentage || 0), 0) /
            properties.length,
        )
      : 0;

  const topMetrics = [
    {
      title: "Properties",
      value: properties.length.toLocaleString(),
      subTitle: "Assigned portfolio",
      bg: "bg-[#2aa8bf]",
      footer: "bg-[#1f93a8]",
    },
    {
      title: "Total Units",
      value: totalUnits.toLocaleString(),
      subTitle: "All mapped units",
      bg: "bg-[#2daf4a]",
      footer: "bg-[#24933d]",
    },
    {
      title: "Occupancy",
      value: `${occupancyRate}%`,
      subTitle: `${occupiedUnits}/${totalUnits} occupied`,
      bg: "bg-[#f3bd11]",
      footer: "bg-[#d6a409]",
    },
    {
      title: "Monthly Income",
      value: `KES ${totalMonthlyRent.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      subTitle: "Estimated revenue share",
      bg: "bg-[#dc3545]",
      footer: "bg-[#c12c3a]",
    },
  ];

  const latestAssignments = properties.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 md:p-6 font-['Poppins','Segoe_UI',sans-serif] text-[#243041]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="border border-[#bcc3cd] bg-[#eef1f4] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[#6a7788]">Proprietor Workspace</p>
              <h1 className="mt-1 text-[42px] font-bold leading-none text-[#1f2937]">
                {greeting}, {getProprietorName()}
              </h1>
              <p className="mt-2 text-[13px] font-medium text-[#5f6b7c]">
                Portfolio summary with occupancy, revenue and property allocations.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-10 items-center gap-2 border border-[#2f3d51] bg-[#2f3d51] px-4 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#243041]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {topMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="border border-[#adb5bf] shadow-sm"
            >
              <div className={`${metric.bg} h-[132px] w-full px-4 py-3`}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#111827]/80">{metric.title}</p>
                <p className="mt-4 text-[34px] font-bold leading-none text-[#111827]">{metric.value}</p>
              </div>
              <div className={`${metric.footer} px-4 py-2 text-[12px] font-semibold text-[#111827]`}>
                {metric.subTitle}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-4">
            <div className="border border-[#bcc3cd] bg-[#eef1f4] p-4">
              <div className="mb-3 border-b border-[#c8cfd8] pb-2">
                <h2 className="text-[28px] font-bold leading-none text-[#263143]">Profile</h2>
              </div>

              {proprietor ? (
                <div className="space-y-4">
                  <div className="border border-[#c7ced7] bg-white px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6a7788]">Business Name</p>
                    <p className="mt-1 text-[15px] font-semibold text-[#1f2937]">
                      {proprietor.business_name || getProprietorName()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {proprietor.profile?.email && (
                      <div className="flex items-center gap-2 border border-[#c7ced7] bg-white px-3 py-2 text-[13px] font-medium text-[#334155]">
                        <Mail className="h-4 w-4 text-[#154279]" />
                        {proprietor.profile.email}
                      </div>
                    )}
                    {proprietor.profile?.phone && (
                      <div className="flex items-center gap-2 border border-[#c7ced7] bg-white px-3 py-2 text-[13px] font-medium text-[#334155]">
                        <Phone className="h-4 w-4 text-[#154279]" />
                        {proprietor.profile.phone}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge
                      className={cn(
                        "rounded-none border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                        proprietor.status === "active"
                          ? "border-[#2daf4a] bg-[#2daf4a] text-white"
                          : "border-[#9aa4b1] bg-[#9aa4b1] text-white",
                      )}
                    >
                      {proprietor.status}
                    </Badge>
                    <Badge className="rounded-none border border-[#2f3d51] bg-[#2f3d51] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Avg Ownership {averageOwnership}%
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] font-medium text-[#5f6b7c]">No profile data available.</p>
              )}
            </div>

            <div className="border border-[#bcc3cd] bg-[#eef1f4] p-4">
              <div className="mb-3 border-b border-[#c8cfd8] pb-2">
                <h3 className="text-[24px] font-bold leading-none text-[#263143]">Quick Snapshot</h3>
              </div>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-center justify-between border border-[#c7ced7] bg-white px-3 py-2">
                  <div className="flex items-center gap-2 text-[#334155]">
                    <Building2 className="h-4 w-4 text-[#154279]" />
                    Assigned Properties
                  </div>
                  <span className="font-semibold text-[#1f2937]">{properties.length}</span>
                </div>
                <div className="flex items-center justify-between border border-[#c7ced7] bg-white px-3 py-2">
                  <div className="flex items-center gap-2 text-[#334155]">
                    <Home className="h-4 w-4 text-[#154279]" />
                    Occupied Units
                  </div>
                  <span className="font-semibold text-[#1f2937]">{occupiedUnits}</span>
                </div>
                <div className="flex items-center justify-between border border-[#c7ced7] bg-white px-3 py-2">
                  <div className="flex items-center gap-2 text-[#334155]">
                    <Users className="h-4 w-4 text-[#154279]" />
                    Total Units
                  </div>
                  <span className="font-semibold text-[#1f2937]">{totalUnits}</span>
                </div>
                <div className="flex items-center justify-between border border-[#c7ced7] bg-white px-3 py-2">
                  <div className="flex items-center gap-2 text-[#334155]">
                    <DollarSign className="h-4 w-4 text-[#154279]" />
                    Monthly Estimate
                  </div>
                  <span className="font-semibold text-[#1f2937]">
                    KES {totalMonthlyRent.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-8">
            <div className="border border-[#bcc3cd] bg-[#eef1f4] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#c8cfd8] pb-2">
                <h2 className="text-[32px] font-bold leading-none text-[#263143]">Property Assignments</h2>
                <Badge className="rounded-none border border-[#2f3d51] bg-[#2f3d51] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {latestAssignments.length} Showing
                </Badge>
              </div>

              {latestAssignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] border-collapse text-left">
                    <thead>
                      <tr className="bg-[#d7dee6] text-[11px] uppercase tracking-wide text-[#5f6b7c]">
                        <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Property</th>
                        <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Location</th>
                        <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Ownership</th>
                        <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Status</th>
                        <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Units</th>
                        <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestAssignments.map((ownership) => {
                        const property = ownership.property;
                        const propertyStatus = String(property?.status || "active").toLowerCase();
                        const isActive = propertyStatus === "active" || propertyStatus === "occupied";

                        return (
                          <tr key={ownership.id} className="hover:bg-[#e8edf3]">
                            <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] font-semibold text-[#2d3748]">
                              {property?.name || "Unnamed Property"}
                            </td>
                            <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] text-[#334155]">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="mt-0.5 h-3.5 w-3.5 text-[#f05f01]" />
                                <span>{property?.location || "No location set"}</span>
                              </div>
                            </td>
                            <td className="border-b border-[#cfd6df] px-4 py-3 text-[11px] font-bold text-[#1f2937]">
                              {Number(ownership.ownership_percentage || 0)}%
                            </td>
                            <td className="border-b border-[#cfd6df] px-4 py-3 text-[11px] font-bold">
                              <span
                                className={cn(
                                  "inline-flex px-2 py-1",
                                  isActive ? "bg-[#2daf4a] text-white" : "bg-[#9aa4b1] text-white",
                                )}
                              >
                                {property?.status || "Unknown"}
                              </span>
                            </td>
                            <td className="border-b border-[#cfd6df] px-4 py-3 text-[11px] font-semibold text-[#334155]">
                              {property?.occupied_units || 0}/{property?.total_units || 0}
                            </td>
                            <td className="border-b border-[#cfd6df] px-4 py-3 text-[11px] font-semibold text-[#1f2937]">
                              KES{" "}
                              {(
                                ((property?.monthly_rent || 0) * Number(ownership.ownership_percentage || 0)) /
                                100
                              ).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-dashed border-[#b8c0cb] bg-white px-4 py-12 text-center">
                  <Briefcase className="mx-auto mb-3 h-7 w-7 text-[#9aa4b1]" />
                  <p className="text-[14px] font-semibold text-[#334155]">No Properties Assigned</p>
                  <p className="mt-1 text-[12px] text-[#5f6b7c]">
                    Ask your administrator to assign properties to your proprietor profile.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProprietorDashboard;
