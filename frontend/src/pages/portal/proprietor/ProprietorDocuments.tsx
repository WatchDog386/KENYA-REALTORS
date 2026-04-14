import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Download, Search, Filter, Upload, RefreshCw } from "lucide-react";

const INPUT_CLASS_NAME =
  "h-10 rounded-none border border-[#b6bec8] bg-white px-3 text-[13px] text-[#1f2937] shadow-none placeholder:text-[#778396] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#F96302]";

const ProprietorDocuments = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const documents = [
    { id: 1, name: "Management Agreement 2024", type: "Contract", date: "2024-01-15", size: "2.4 MB" },
    { id: 2, name: "February 2024 Financial Report", type: "Financial", date: "2024-02-01", size: "1.1 MB" },
    { id: 3, name: "Property Insurance Policy", type: "Insurance", date: "2023-11-20", size: "4.5 MB" },
    { id: 4, name: "Tax Documents 2023", type: "Tax", date: "2024-01-10", size: "3.2 MB" },
  ];

  const filteredDocuments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return documents;

    return documents.filter(
      (document) =>
        document.name.toLowerCase().includes(term) ||
        document.type.toLowerCase().includes(term) ||
        document.date.toLowerCase().includes(term),
    );
  }, [documents, searchTerm]);

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 md:p-6 font-['Poppins','Segoe_UI',sans-serif] text-[#243041]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="border border-[#bcc3cd] bg-[#eef1f4] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[#6a7788]">Document Repository</p>
              <h1 className="mt-1 text-[42px] font-bold leading-none text-[#1f2937]">Documents</h1>
              <p className="mt-2 text-[13px] font-medium text-[#5f6b7c]">
                Access contracts, reports, policies, and compliance files for your portfolio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="inline-flex h-10 items-center gap-2 rounded-none border border-[#9aa4b1] bg-white px-3 text-[11px] font-semibold uppercase tracking-wide text-[#334155] hover:bg-[#f5f7fa]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Sync
              </Button>
              <Button className="inline-flex h-10 items-center gap-2 rounded-none border border-[#2f3d51] bg-[#2f3d51] px-3 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#243041]">
                <Upload className="h-3.5 w-3.5" />
                Upload
              </Button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="overflow-hidden border border-[#adb5bf]">
            <div className="bg-[#2aa8bf] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Total Files</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-white">{documents.length}</p>
            </div>
            <div className="bg-[#1f93a8] px-3 py-1.5 text-[14px] font-medium text-white">Available</div>
          </div>

          <div className="overflow-hidden border border-[#adb5bf]">
            <div className="bg-[#2daf4a] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/90">Matched</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-white">{filteredDocuments.length}</p>
            </div>
            <div className="bg-[#24933d] px-3 py-1.5 text-[14px] font-medium text-white">Search results</div>
          </div>

          <div className="overflow-hidden border border-[#adb5bf]">
            <div className="bg-[#f3bd11] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1f2937]/80">Categories</p>
              <p className="mt-1 text-[40px] font-bold leading-none text-[#1f2937]">
                {new Set(documents.map((doc) => doc.type)).size}
              </p>
            </div>
            <div className="bg-[#d6a409] px-3 py-1.5 text-[14px] font-medium text-[#1f2937]">Document types</div>
          </div>
        </div>

        <section className="border border-[#bcc3cd] bg-[#eef1f4] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#c8cfd8] pb-2">
            <h2 className="text-[32px] font-bold leading-none text-[#263143]">File Repository</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8595]" />
                <Input
                  placeholder="Search documents..."
                  className={`${INPUT_CLASS_NAME} pl-9`}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="inline-flex h-10 items-center gap-2 rounded-none border border-[#9aa4b1] bg-white px-3 text-[11px] font-semibold uppercase tracking-wide text-[#334155] hover:bg-[#f5f7fa]"
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
              </Button>
            </div>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="border border-dashed border-[#b8c0cb] bg-white px-4 py-12 text-center">
              <FileText className="mx-auto mb-3 h-7 w-7 text-[#9aa4b1]" />
              <p className="text-[14px] font-semibold text-[#334155]">No documents found</p>
              <p className="mt-1 text-[12px] text-[#5f6b7c]">Try a different search term.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#d7dee6] text-[11px] uppercase tracking-wide text-[#5f6b7c]">
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Name</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Type</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Date</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Size</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((document) => (
                    <tr key={document.id} className="hover:bg-[#e8edf3]">
                      <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] font-semibold text-[#2d3748]">
                        <span className="inline-flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#154279]" />
                          {document.name}
                        </span>
                      </td>
                      <td className="border-b border-[#cfd6df] px-4 py-3 text-[11px] font-semibold uppercase text-[#334155]">
                        {document.type}
                      </td>
                      <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] text-[#334155]">{document.date}</td>
                      <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] text-[#334155]">{document.size}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProprietorDocuments;
