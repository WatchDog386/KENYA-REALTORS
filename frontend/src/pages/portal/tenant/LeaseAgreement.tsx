import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Download, FileCheck2, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  buildAydenPlazaLeaseAgreementText,
  createDefaultTenantLeaseAgreementForm,
  TenantLeaseAgreementForm,
} from "@/constants/tenantLeaseAgreement";
import {
  getTenantLeaseAgreementState,
  saveTenantLeaseAgreement,
  TenantLeaseAgreementRecord,
} from "@/services/tenantLeaseAgreementService";
import { downloadTenantLeaseAgreementPdf } from "@/utils/leaseAgreementPdf";

const LeaseAgreementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TenantLeaseAgreementForm>(createDefaultTenantLeaseAgreementForm());
  const [record, setRecord] = useState<TenantLeaseAgreementRecord | null>(null);
  const [accepted, setAccepted] = useState(false);

  const agreementPreview = useMemo(() => buildAydenPlazaLeaseAgreementText(form), [form]);

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

  const updateForm = (field: keyof TenantLeaseAgreementForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
    } catch (error) {
      console.error("Failed to save signed lease agreement:", error);
      toast.error("Failed to save lease agreement");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    downloadTenantLeaseAgreementPdf(form);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#154279]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/portal/tenant")}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Back to tenant dashboard"
          >
            <ArrowLeft size={18} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#154279] tracking-tight">Lease Agreement</h1>
            <p className="text-sm text-slate-600">AYDEN PLAZA agreement must be completed before full tenant dashboard access.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download size={16} />
            Download PDF
          </Button>
          <Button onClick={handleSaveLeaseAgreement} disabled={saving} className="gap-2 bg-[#154279] hover:bg-[#0f325e]">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Sign & Save
          </Button>
        </div>
      </div>

      {record?.completed && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Lease agreement already signed</p>
                <p className="text-xs text-emerald-700">
                  Signed on {new Date(record.signedAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/portal/tenant")}>Open Dashboard</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#154279] flex items-center gap-2">
              <FileCheck2 size={18} />
              Tenant Details
            </CardTitle>
            <CardDescription>Fill your details exactly as they should appear in the signed lease document.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="lesseeName">Lessee Name</Label>
                <Input
                  id="lesseeName"
                  value={form.lesseeName}
                  onChange={(event) => {
                    const nextName = event.target.value;
                    const shouldSyncSignature =
                      !form.tenantSignatureName ||
                      form.tenantSignatureName.trim().toLowerCase() === form.lesseeName.trim().toLowerCase();

                    setForm((prev) => ({
                      ...prev,
                      lesseeName: nextName,
                      tenantSignatureName: shouldSyncSignature ? nextName : prev.tenantSignatureName,
                    }));
                  }}
                  placeholder="Full legal name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="poBox">P. O. Box</Label>
                <Input
                  id="poBox"
                  value={form.poBox}
                  onChange={(event) => updateForm("poBox", event.target.value)}
                  placeholder="e.g. 12345-00100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={form.idNumber}
                  onChange={(event) => updateForm("idNumber", event.target.value)}
                  placeholder="National ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (+254)</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value.replace(/^\+?254\s*/, ""))}
                  placeholder="712345678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="houseNumber">House Number</Label>
                <Input
                  id="houseNumber"
                  value={form.houseNumber}
                  onChange={(event) => updateForm("houseNumber", event.target.value)}
                  placeholder="Unit / House Number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={form.effectiveDate}
                  onChange={(event) => updateForm("effectiveDate", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => updateForm("endDate", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantSignatureName">Tenant Signature Name</Label>
                <Input
                  id="tenantSignatureName"
                  value={form.tenantSignatureName}
                  onChange={(event) => updateForm("tenantSignatureName", event.target.value)}
                  placeholder="Type your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantSignatureDate">Signature Date</Label>
                <Input
                  id="tenantSignatureDate"
                  type="date"
                  value={form.tenantSignatureDate}
                  onChange={(event) => updateForm("tenantSignatureDate", event.target.value)}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="leaseAccept"
                  checked={accepted}
                  onCheckedChange={(checked) => setAccepted(checked === true)}
                />
                <label htmlFor="leaseAccept" className="text-sm text-slate-700 leading-5 cursor-pointer">
                  I have read and understood this lease agreement and I accept all terms and conditions stated in this document.
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#154279]">Agreement Preview</CardTitle>
            <CardDescription>This live preview is what will be generated in your downloadable PDF copy.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-xl p-4 max-h-[70vh] overflow-y-auto bg-white text-sm text-slate-700 leading-6 whitespace-pre-wrap">
              {agreementPreview}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaseAgreementPage;
