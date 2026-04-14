import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Search, AlertCircle, Percent, LayoutGrid, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const INPUT_CLASS_NAME =
  "h-10 rounded-none border border-[#b6bec8] bg-white px-3 text-[13px] text-[#1f2937] shadow-none placeholder:text-[#778396] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#F96302]";

const ProprietorProperties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadProperties();
  }, [user?.id]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError("User not authenticated");
        return;
      }

      const { data: proprietorRow, error: proprietorError } = await supabase
        .from("proprietors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (proprietorError && proprietorError.code !== "PGRST116") {
        throw proprietorError;
      }

      const proprietorIdCandidates = Array.from(new Set([proprietorRow?.id, user.id].filter(Boolean))) as string[];

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

      const { data: assignments, error: assignError } = await assignmentsQuery;

      if (assignError) {
        setError("Failed to load assigned properties");
        toast.error("Failed to load properties");
        return;
      }

      setProperties(assignments || []);
    } catch (err: any) {
      setError(err.message || "Failed to load properties");
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(
    (p) =>
      p.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.property?.location?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalProperties = properties.length;
  const activeProperties = properties.filter((p) => {
    const status = String(p.property?.status || "").toLowerCase();
    return status === "active" || status === "occupied";
  }).length;
  const avgOwnership =
    totalProperties > 0
      ? Math.round(properties.reduce((sum, p) => sum + (Number(p.ownership_percentage) || 0), 0) / totalProperties)
      : 0;

  if (error) {
    return (
      <div className="min-h-screen bg-[#d7dce1] p-4 md:p-6 font-['Poppins','Segoe_UI',sans-serif] text-[#243041]">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>
        <div className="mx-auto max-w-[1600px]">
          <div className="flex items-center gap-3 border border-[#dc3545] bg-[#f7d7db] px-4 py-4 text-[#8f3333]">
            <AlertCircle className="h-5 w-5" />
            <div>
              <h3 className="text-[15px] font-semibold">Error Loading Properties</h3>
              <p className="text-[13px]">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 md:p-6 font-['Poppins','Segoe_UI',sans-serif] text-[#243041]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="border border-[#bcc3cd] bg-[#eef1f4] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[#6a7788]">Portfolio Overview</p>
              <h1 className="mt-1 text-[42px] font-bold leading-none text-[#1f2937]">My Properties</h1>
              <p className="mt-2 text-[13px] font-medium text-[#5f6b7c]">
                Review ownership allocations and assignment status for your managed portfolio.
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="relative min-w-[260px] flex-1 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8595]" />
                <Input
                  placeholder="Search by name or location..."
                  className={cn(INPUT_CLASS_NAME, "pl-9")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={() => void loadProperties()}
                className="inline-flex h-10 items-center gap-2 rounded-none border border-[#2f3d51] bg-[#2f3d51] px-3 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#243041]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="overflow-hidden border border-[#adb5bf]">
            <div className="bg-[#2aa8bf] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Total Properties</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-white">{totalProperties}</p>
            </div>
            <div className="bg-[#1f93a8] px-3 py-1.5 text-[14px] font-medium text-white">All assignments</div>
          </div>

          <div className="overflow-hidden border border-[#adb5bf]">
            <div className="bg-[#2daf4a] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Active Properties</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-white">{activeProperties}</p>
            </div>
            <div className="bg-[#24933d] px-3 py-1.5 text-[14px] font-medium text-white">Operational</div>
          </div>

          <div className="overflow-hidden border border-[#adb5bf]">
            <div className="bg-[#f3bd11] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1f2937]/80">Average Ownership</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-[#1f2937]">{avgOwnership}%</p>
            </div>
            <div className="bg-[#d6a409] px-3 py-1.5 text-[14px] font-medium text-[#1f2937]">Portfolio share</div>
          </div>

          <div className="overflow-hidden border border-[#adb5bf]">
            <div className="bg-[#dc3545] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Search Results</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-white">{filteredProperties.length}</p>
            </div>
            <div className="bg-[#c12c3a] px-3 py-1.5 text-[14px] font-medium text-white">Filtered view</div>
          </div>
        </div>

        <section className="border border-[#bcc3cd] bg-[#eef1f4] p-4">
          <div className="mb-3 border-b border-[#c8cfd8] pb-2">
            <h2 className="text-[32px] font-bold leading-none text-[#263143]">Assigned Properties</h2>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-11 animate-pulse border border-[#c7ced7] bg-white" />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="border border-dashed border-[#b8c0cb] bg-white px-4 py-12 text-center">
              <Building2 className="mx-auto mb-3 h-7 w-7 text-[#9aa4b1]" />
              <p className="text-[14px] font-semibold text-[#334155]">No properties found</p>
              <p className="mt-1 text-[12px] text-[#5f6b7c]">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "You do not have any assigned properties yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#d7dee6] text-[11px] uppercase tracking-wide text-[#5f6b7c]">
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Property</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Location</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Type</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Ownership</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Status</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((prop) => {
                    const property = prop.property;
                    const status = String(property?.status || "active").toLowerCase();
                    const isActive = status === "active" || status === "occupied";

                    return (
                      <tr key={prop.id} className="hover:bg-[#e8edf3]">
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] font-semibold text-[#2d3748]">
                          <div className="flex items-center gap-2">
                            <LayoutGrid className="h-3.5 w-3.5 text-[#154279]" />
                            {property?.name || "Unnamed Property"}
                          </div>
                        </td>
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] text-[#334155]">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 text-[#f05f01]" />
                            {property?.location || "No location"}
                          </div>
                        </td>
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] text-[#334155] capitalize">
                          {property?.type || "Property"}
                        </td>
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[11px] font-bold text-[#1f2937]">
                          <span className="inline-flex items-center gap-1">
                            <Percent className="h-3.5 w-3.5 text-[#154279]" />
                            {Number(prop.ownership_percentage || 0)}%
                          </span>
                        </td>
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[11px] font-bold">
                          <Badge
                            className={cn(
                              "rounded-none border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                              isActive ? "border-[#2daf4a] bg-[#2daf4a] text-white" : "border-[#9aa4b1] bg-[#9aa4b1] text-white",
                            )}
                          >
                            {property?.status || "Unknown"}
                          </Badge>
                        </td>
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] text-[#334155]">
                          {new Date(prop.assigned_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProprietorProperties;
