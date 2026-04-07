import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Download, Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  createDefaultTenantLeaseAgreementForm,
  TenantLeaseAgreementForm,
} from "@/constants/tenantLeaseAgreement";
import {
  getTenantLeaseAgreementState,
  saveTenantLeaseAgreement,
  TenantLeaseAgreementRecord,
} from "@/services/tenantLeaseAgreementService";
const AGREEMENT_DOCUMENT_DOWNLOAD_PATH = "/agreement.doc";
const AGREEMENT_DOCUMENT_TEXT_PATH = "/agreement.txt";

interface LeaseAgreementProps {
  applicationId?: string;
  onCompleted?: () => void;
}

export const LeaseAgreement: React.FC<LeaseAgreementProps> = ({
  applicationId,
  onCompleted,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TenantLeaseAgreementForm>(createDefaultTenantLeaseAgreementForm());
  const [record, setRecord] = useState<TenantLeaseAgreementRecord | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [agreementText, setAgreementText] = useState("");
  const [agreementTextLoading, setAgreementTextLoading] = useState(true);
  const [agreementTextError, setAgreementTextError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const state = await getTenantLeaseAgreementState(user.id);
        setForm(state.form);
        setRecord(state.record);
        setAccepted(state.isSigned);
      } catch (error) {
        console.error("Failed to load lease agreement state:", error);
        toast.error("Failed to load lease agreement details");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    const loadAgreementText = async () => {
      try {
        setAgreementTextLoading(true);
        setAgreementTextError(null);

        const response = await fetch(AGREEMENT_DOCUMENT_TEXT_PATH, { cache: "no-cache" });
        if (!response.ok) {
          throw new Error(`Failed to load agreement text (${response.status})`);
        }

        const text = await response.text();
        if (!cancelled) {
          setAgreementText(text || "");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load agreement text:", error);
          setAgreementTextError("Unable to display agreement content. Use Download to open the original document.");
        }
      } finally {
        if (!cancelled) {
          setAgreementTextLoading(false);
        }
      }
    };

    loadAgreementText();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateForm = (field: keyof TenantLeaseAgreementForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const agreementLines = useMemo(() => {
    return agreementText
      .replace(/\r/g, "")
      .split("\n")
      .map((rawLine) => rawLine.replace(/\t/g, " ").replace(/\s{2,}/g, " ").trim());
  }, [agreementText]);

  const validateBeforeSave = (): boolean => {
    const mandatoryFields: Array<[keyof TenantLeaseAgreementForm, string]> = [
      ["lesseeName", "Lessee name"],
      ["idNumber", "ID number"],
      ["phone", "Phone number"],
      ["email", "Email address"],
      ["houseNumber", "House number"],
      ["effectiveDate", "Effective date"],
      ["endDate", "End date"],
      ["tenantSignatureName", "Tenant signature name"],
      ["tenantSignatureDate", "Tenant signature date"],
    ];

    for (const [field, label] of mandatoryFields) {
      const value = String(form[field] || "").trim();
      if (!value) {
        toast.error(`${label} is required`);
        return false;
      }
    }

    if (!accepted) {
      toast.error("Please confirm you have read and accepted the lease agreement");
      return false;
    }

    return true;
  };

  const handleSaveLeaseAgreement = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    if (!validateBeforeSave()) {
      return;
    }

    try {
      setSaving(true);
      const savedRecord = await saveTenantLeaseAgreement(user.id, form);
      setRecord(savedRecord);
      toast.success("Lease agreement signed and saved to your profile");
      
      if (onCompleted) {
        setTimeout(() => {
          onCompleted();
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to save signed lease agreement:", error);
      toast.error("Failed to save lease agreement");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = AGREEMENT_DOCUMENT_DOWNLOAD_PATH;
    link.download = "agreement.doc";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#154279]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 md:p-6 font-['Poppins','Segoe_UI',sans-serif] text-[#243041]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mx-auto max-w-[1500px] space-y-3">
        <section className="border border-[#bcc3cd] bg-[#eef1f4]">
          <div className="border-b border-[#bcc3cd] px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {!applicationId && (
                  <button
                    onClick={() => navigate("/portal/tenant")}
                    className="h-9 w-9 flex items-center justify-center border border-[#b6bec8] bg-white text-[#465870] hover:bg-[#f5f7fa]"
                    aria-label="Back"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <h1 className="text-[30px] font-bold leading-none text-[#1f2937]">Lease Agreement</h1>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownload}
                  className="h-10 rounded-none border border-[#b6bec8] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]"
                >
                  <Download size={14} className="mr-2" />
                  PDF
                </Button>
                <Button
                  onClick={handleSaveLeaseAgreement}
                  disabled={saving}
                  className="h-10 rounded-none border border-[#d96d26] bg-[#F96302] px-4 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#e15802]"
                >
                  {saving ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Save size={14} className="mr-2" />}
                  Sign & Save
                </Button>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {record?.completed && (
              <div className="border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Lease agreement signed successfully</p>
                    <p className="text-xs text-emerald-700">Signed on {new Date(record.signedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border border-[#bcc3cd] bg-[#eef1f4] p-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={form.lesseeName} onChange={(e) => updateForm("lesseeName", e.target.value)} placeholder="Full name" className="h-10 rounded-none border border-[#b6bec8] bg-white text-[13px] text-[#1f2937]" />
                </div>
                <div className="space-y-2">
                  <Label>ID *</Label>
                  <Input value={form.idNumber} onChange={(e) => updateForm("idNumber", e.target.value)} placeholder="ID" className="h-10 rounded-none border border-[#b6bec8] bg-white text-[13px] text-[#1f2937]" />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} placeholder="Phone" className="h-10 rounded-none border border-[#b6bec8] bg-white text-[13px] text-[#1f2937]" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="Email" className="h-10 rounded-none border border-[#b6bec8] bg-white text-[13px] text-[#1f2937]" />
                </div>
                <div className="space-y-2">
                  <Label>House *</Label>
                  <Input value={form.houseNumber} onChange={(e) => updateForm("houseNumber", e.target.value)} placeholder="Unit" className="h-10 rounded-none border border-[#b6bec8] bg-white text-[13px] text-[#1f2937]" />
                </div>
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input type="date" value={form.effectiveDate} onChange={(e) => updateForm("effectiveDate", e.target.value)} className="h-10 rounded-none border border-[#b6bec8] bg-white text-[13px] text-[#1f2937]" />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} className="h-10 rounded-none border border-[#b6bec8] bg-white text-[13px] text-[#1f2937]" />
                </div>
                <div className="space-y-2">
                  <Label>Sign As *</Label>
                  <Input value={form.tenantSignatureName} onChange={(e) => updateForm("tenantSignatureName", e.target.value)} placeholder="Name" className="h-10 rounded-none border border-[#b6bec8] bg-white text-[13px] text-[#1f2937]" />
                </div>
                <div className="space-y-2">
                  <Label>Sign Date *</Label>
                  <Input type="date" value={form.tenantSignatureDate} onChange={(e) => updateForm("tenantSignatureDate", e.target.value)} className="h-10 rounded-none border border-[#b6bec8] bg-white text-[13px] text-[#1f2937]" />
                </div>
              </div>

              <div className="mt-3 border-t border-[#c4cad3] pt-3 flex items-start gap-2">
                <Checkbox id="agree" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
                <label htmlFor="agree" className="text-xs leading-tight cursor-pointer">I accept the terms</label>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-[#bcc3cd] bg-[#eef1f4] p-3">
          <div className="w-full overflow-auto border border-[#c7cdd6] bg-[#e3e7ec] p-2">
            <div className="mx-auto w-full max-w-5xl min-h-[calc(100vh-20rem)] border border-[#c7cdd6] bg-white p-4 sm:p-8 lg:p-10 font-['Poppins','Segoe_UI',sans-serif]">
              {agreementTextLoading ? (
                <div className="flex min-h-[560px] items-center justify-center text-sm font-medium text-[#5f6b7c]">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading agreement...
                </div>
              ) : agreementTextError ? (
                <div className="min-h-[560px] p-4 text-sm text-amber-700 bg-amber-50 border border-amber-200">
                  {agreementTextError}
                </div>
              ) : (
                <div className="min-h-[560px] mx-auto max-w-4xl text-[14px] sm:text-[15px] leading-7 text-[#2a3340]">
                  {agreementLines.map((line, index) => {
                    if (!line) {
                      return <div key={`space-${index}`} className="h-3" />;
                    }

                    if (index === 0 || /^[A-Z][A-Z\s&\-]{6,}$/.test(line)) {
                      return (
                        <h2 key={`heading-${index}`} className="text-[18px] sm:text-[20px] font-bold uppercase tracking-wide text-[#1f2937] mt-2">
                          {line}
                        </h2>
                      );
                    }

                    if (/^(confirmation\s*&\s*payment:?|signed by:)/i.test(line)) {
                      return (
                        <h3 key={`section-${index}`} className="text-[16px] font-semibold text-[#1f2937] mt-5 border-t border-[#d8dde3] pt-4">
                          {line}
                        </h3>
                      );
                    }

                    if (/^\d+\./.test(line)) {
                      return (
                        <p key={`clause-${index}`} className="mt-3 font-semibold text-[#273444]">
                          {line}
                        </p>
                      );
                    }

                    if (/^[a-z]\)/i.test(line)) {
                      return (
                        <p key={`subitem-${index}`} className="pl-4 text-[#334155]">
                          {line}
                        </p>
                      );
                    }

                    if (/^(name:|p\.o\. box:|tel:|re:|tenant name:|id no:|signature:|date)/i.test(line)) {
                      return (
                        <p key={`label-${index}`} className="font-medium text-[#273444]">
                          {line}
                        </p>
                      );
                    }

                    return (
                      <p key={`line-${index}`} className="text-[#334155]">
                        {line}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const LeaseAgreementPage: React.FC = () => {
  return <LeaseAgreement />;
};

export default LeaseAgreementPage;
