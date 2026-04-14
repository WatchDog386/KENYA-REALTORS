import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { proprietorService } from "@/services/proprietorService";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ProprietorReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadReports();
  }, [user?.id]);

  const loadReports = async () => {
    try {
      if (!user?.id) return;
      const prop = await proprietorService.getProprietorByUserId(user.id);
      if (prop?.id) {
        const data = await proprietorService.getProprietorReports(prop.id);
        setReports(data || []);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const reportStats = useMemo(() => {
    const totals = {
      total: reports.length,
      sent: 0,
      draft: 0,
      pending: 0,
    };

    reports.forEach((report) => {
      const status = String(report?.status || "pending").toLowerCase();
      if (status === "sent") totals.sent += 1;
      else if (status === "draft") totals.draft += 1;
      else totals.pending += 1;
    });

    return totals;
  }, [reports]);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center bg-[#d7dce1]">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-[#154279]" />
          <p className="text-[13px] font-medium text-[#5f6b7c]">Loading reports...</p>
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
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[#6a7788]">Reporting Workspace</p>
              <h1 className="mt-1 text-[42px] font-bold leading-none text-[#1f2937]">Reports</h1>
              <p className="mt-2 text-[13px] font-medium text-[#5f6b7c]">
                Monitor financial and property performance updates from your management team.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="inline-flex h-10 items-center gap-2 rounded-none border border-[#9aa4b1] bg-white px-3 text-[11px] font-semibold uppercase tracking-wide text-[#334155] hover:bg-[#f5f7fa]"
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
              </Button>
              <Button
                type="button"
                onClick={() => void loadReports()}
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
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Total Reports</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-white">{reportStats.total}</p>
            </div>
            <div className="bg-[#1f93a8] px-3 py-1.5 text-[14px] font-medium text-white">All records</div>
          </div>

          <div className="overflow-hidden border border-[#adb5bf]">
            <div className="bg-[#2daf4a] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Sent</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-white">{reportStats.sent}</p>
            </div>
            <div className="bg-[#24933d] px-3 py-1.5 text-[14px] font-medium text-white">Delivered</div>
          </div>

          <div className="overflow-hidden border border-[#adb5bf]">
            <div className="bg-[#f3bd11] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1f2937]/80">Draft</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-[#1f2937]">{reportStats.draft}</p>
            </div>
            <div className="bg-[#d6a409] px-3 py-1.5 text-[14px] font-medium text-[#1f2937]">In progress</div>
          </div>

          <div className="overflow-hidden border border-[#adb5bf]">
            <div className="bg-[#dc3545] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Pending</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-white">{reportStats.pending}</p>
            </div>
            <div className="bg-[#c12c3a] px-3 py-1.5 text-[14px] font-medium text-white">Needs action</div>
          </div>
        </div>

        <section className="border border-[#bcc3cd] bg-[#eef1f4] p-4">
          <div className="mb-3 border-b border-[#c8cfd8] pb-2">
            <h2 className="text-[32px] font-bold leading-none text-[#263143]">Report Records</h2>
          </div>

          {reports.length === 0 ? (
            <div className="border border-dashed border-[#b8c0cb] bg-white px-4 py-12 text-center">
              <FileText className="mx-auto mb-3 h-7 w-7 text-[#9aa4b1]" />
              <p className="text-[14px] font-semibold text-[#334155]">No reports available</p>
              <p className="mt-1 text-[12px] text-[#5f6b7c]">Check back later for monthly updates.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#d7dee6] text-[11px] uppercase tracking-wide text-[#5f6b7c]">
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Title</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Type</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Description</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Date</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Status</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => {
                    const status = String(report.status || "pending").toLowerCase();

                    return (
                      <tr key={report.id} className="hover:bg-[#e8edf3]">
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] font-semibold text-[#2d3748]">
                          {report.title || "Untitled Report"}
                        </td>
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[11px] font-semibold uppercase text-[#334155]">
                          {String(report.report_type || "general").replace(/_/g, " ")}
                        </td>
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] text-[#334155]">
                          <span className="line-clamp-1">{report.description || "No description"}</span>
                        </td>
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] text-[#334155]">
                          {new Date(report.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[11px] font-bold">
                          <Badge
                            className={cn(
                              "rounded-none border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                              status === "sent"
                                ? "border-[#2daf4a] bg-[#2daf4a] text-white"
                                : status === "draft"
                                  ? "border-[#f3bd11] bg-[#f3bd11] text-[#1f2937]"
                                  : "border-[#9aa4b1] bg-[#9aa4b1] text-white",
                            )}
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="border-b border-[#cfd6df] px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="inline-flex h-8 items-center gap-1 rounded-none border border-[#9aa4b1] bg-white px-2 text-[10px] font-semibold uppercase tracking-wide text-[#334155] hover:bg-[#f5f7fa]"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </Button>
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

export default ProprietorReports;
