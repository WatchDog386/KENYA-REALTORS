import { supabase } from "@/integrations/supabase/client";
import {
  createDefaultTenantLeaseAgreementForm,
  TENANT_LEASE_AGREEMENT_VERSION,
  TenantLeaseAgreementForm,
} from "@/constants/tenantLeaseAgreement";

const TENANT_LEASE_METADATA_KEY = "tenantLeaseAgreement";

export interface TenantLeaseAgreementRecord {
  version: string;
  completed: boolean;
  signedAt: string;
  form: TenantLeaseAgreementForm;
}

export interface TenantLeaseAgreementState {
  isSigned: boolean;
  form: TenantLeaseAgreementForm;
  record: TenantLeaseAgreementRecord | null;
}

const normalizeMetadata = (rawMetadata: any): Record<string, any> => {
  if (!rawMetadata) return {};

  if (typeof rawMetadata === "string") {
    try {
      const parsed = JSON.parse(rawMetadata);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  if (typeof rawMetadata === "object" && !Array.isArray(rawMetadata)) {
    return rawMetadata;
  }

  return {};
};

const extractLeaseRecord = (metadata: Record<string, any>): TenantLeaseAgreementRecord | null => {
  const maybeRecord = metadata?.[TENANT_LEASE_METADATA_KEY];

  if (!maybeRecord || typeof maybeRecord !== "object") {
    return null;
  }

  if (!maybeRecord.form || typeof maybeRecord.form !== "object") {
    return null;
  }

  return {
    version: String(maybeRecord.version || TENANT_LEASE_AGREEMENT_VERSION),
    completed: Boolean(maybeRecord.completed),
    signedAt: String(maybeRecord.signedAt || ""),
    form: createDefaultTenantLeaseAgreementForm(maybeRecord.form as Partial<TenantLeaseAgreementForm>),
  };
};

const resolveActiveTenantHouseNumber = async (userId: string): Promise<string> => {
  try {
    const { data: tenantRow } = await supabase
      .from("tenants")
      .select("unit_id, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tenantRow?.unit_id) return "";

    const { data: unitRow } = await supabase
      .from("units")
      .select("unit_number")
      .eq("id", tenantRow.unit_id)
      .maybeSingle();

    return String(unitRow?.unit_number || "");
  } catch {
    return "";
  }
};

export const getTenantLeaseAgreementState = async (
  userId: string
): Promise<TenantLeaseAgreementState> => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  const sourceMetadata = normalizeMetadata((profile as any)?.metadata ?? (profile as any)?.data);
  const existingRecord = extractLeaseRecord(sourceMetadata);

  const fullName = [profile?.first_name, profile?.last_name]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ");

  const resolvedHouseNumber = await resolveActiveTenantHouseNumber(userId);

  const baseForm = createDefaultTenantLeaseAgreementForm({
    lesseeName: fullName,
    phone: String(profile?.phone || ""),
    email: String(profile?.email || ""),
    houseNumber: resolvedHouseNumber,
    tenantSignatureName: fullName,
  });

  const form = existingRecord
    ? createDefaultTenantLeaseAgreementForm({ ...baseForm, ...existingRecord.form })
    : baseForm;

  const isSigned = Boolean(existingRecord?.completed && existingRecord?.signedAt);

  return {
    isSigned,
    form,
    record: existingRecord,
  };
};

export const saveTenantLeaseAgreement = async (
  userId: string,
  form: TenantLeaseAgreementForm
): Promise<TenantLeaseAgreementRecord> => {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw profileError;
  }

  const sourceMetadata = normalizeMetadata((profile as any)?.metadata ?? (profile as any)?.data);
  const nowIso = new Date().toISOString();
  const sanitizedForm = createDefaultTenantLeaseAgreementForm(form);

  const agreementRecord: TenantLeaseAgreementRecord = {
    version: TENANT_LEASE_AGREEMENT_VERSION,
    completed: true,
    signedAt: nowIso,
    form: sanitizedForm,
  };

  const updatedMetadata = {
    ...sourceMetadata,
    [TENANT_LEASE_METADATA_KEY]: agreementRecord,
  };

  const updatePayload: Record<string, any> = {
    updated_at: nowIso,
  };

  if (Object.prototype.hasOwnProperty.call(profile, "metadata")) {
    updatePayload.metadata = updatedMetadata;
  } else if (Object.prototype.hasOwnProperty.call(profile, "data")) {
    updatePayload.data = updatedMetadata;
  } else {
    // Last-resort fallback to preserve data if the profile schema is legacy.
    updatePayload.approval_notes = JSON.stringify(updatedMetadata);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId);

  if (updateError) {
    throw updateError;
  }

  return agreementRecord;
};
