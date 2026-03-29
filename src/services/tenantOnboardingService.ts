import { supabase } from "@/integrations/supabase/client";

interface LeaseApplicationOnboardingData {
  id: string;
  applicant_id: string;
  property_id: string;
  unit_id: string;
  applicant_name?: string | null;
  applicant_email?: string | null;
  telephone_numbers?: string | null;
  unit_number?: string | null;
  unit_type_id?: string | null;
  unit_type_name?: string | null;
  property_name?: string | null;
}

interface InvoiceLike {
  id: string;
  amount: number;
  property_id: string;
  tenant_id: string;
  notes?: string | null;
  items?: any;
}

interface InvoiceMetadata {
  BILLING_EVENT?: string;
  UNIT_ID?: string;
  PROPERTY_ID?: string;
  APPLICANT_ID?: string;
  APPLICANT_NAME?: string;
  APPLICANT_EMAIL?: string;
  LEASE_APPLICATION_ID?: string;
  LEASE_ID?: string;
  UNIT_NUMBER?: string;
  UNIT_TYPE_ID?: string;
  UNIT_TYPE_NAME?: string;
  PROPERTY_NAME?: string;
}

interface AssignmentMetadataInput {
  unitId: string;
  propertyId: string;
  applicantId: string;
  applicationId?: string;
  unitNumber?: string | null;
  unitTypeId?: string | null;
  unitTypeName?: string | null;
  propertyName?: string | null;
  applicantName?: string | null;
  applicantEmail?: string | null;
}

interface TenantIdentityRow {
  id: string;
  user_id: string;
  property_id?: string | null;
  unit_id?: string | null;
  status?: string | null;
}

export interface PendingInitialInvoice {
  id: string;
  amount: number;
  due_date: string;
  status: "unpaid" | "overdue";
  reference_number?: string | null;
  property_id?: string | null;
  unit_id?: string | null;
  items?: any;
  notes?: string | null;
}

export interface TenantPortalAccessState {
  hasActiveAssignment: boolean;
  hasPendingApplication: boolean;
  hasPaidOnboardingInvoice: boolean;
  isLocked: boolean;
  pendingInitialInvoices: PendingInitialInvoice[];
  initialInvoiceTotal: number;
  activeTenantRow: {
    id: string;
    property_id: string | null;
    unit_id: string | null;
  } | null;
  activeLeaseRow: {
    id: string;
    unit_id: string | null;
    status: string | null;
  } | null;
}

const ACTIVE_LEASE_STATUSES = ["active", "approved", "manager_approved", "pending"];
const ACTIVE_OR_PENDING_APPLICATION_STATUSES = ["pending", "under_review", "approved"];
const LEGACY_APPLICATION_STATUSES = ["invoice_sent", "manager_approved"];
const APPLICATION_STATUS_LOOKUP = [
  ...ACTIVE_OR_PENDING_APPLICATION_STATUSES,
  ...LEGACY_APPLICATION_STATUSES,
];
const INITIAL_MOVE_IN_INVOICE_NOTES_FILTER =
  "notes.ilike.%BILLING_EVENT:unit_allocation%,notes.ilike.%BILLING_EVENT:first_payment%";
const ENABLE_CLIENT_FINALIZATION_FALLBACK = false;

export const applyOnboardingInvoiceFilter = <T>(query: T, tenantIdentifiers: string[] = []) => {
  const filters = [INITIAL_MOVE_IN_INVOICE_NOTES_FILTER];

  const scopedTenantIds = (tenantIdentifiers || []).filter(Boolean);
  if (scopedTenantIds.length > 0) {
    // Quote UUIDs to avoid parsing issues in PostgREST filter expansion.
    const quotedIds = scopedTenantIds.map((id) => `"${id}"`).join(",");
    filters.push(`tenant_id.in.(${quotedIds})`);
  }

  return (query as any).or(filters.join(","));
};

const isSuperAdminFirstPaymentInvoice = (notes?: string | null): boolean =>
  /BILLING_EVENT:first_payment/i.test(String(notes || ""));

const prioritizeSuperAdminOnboardingInvoices = <T extends { notes?: string | null }>(rows: T[]): T[] => {
  const source = rows || [];
  if (source.length === 0) return [];

  const firstPaymentRows = source.filter((row) => isSuperAdminFirstPaymentInvoice(row.notes));
  return firstPaymentRows.length > 0 ? firstPaymentRows : source;
};

const isInvoiceRelevantToCurrentOnboarding = (
  row: { notes?: string | null; property_id?: string | null; tenant_id?: string | null; created_at?: string | null },
  tenantProfileId: string,
  applicationRow: any,
  scopedOnboardingPropertyId?: string | null
) => {
  const metadata = parseInvoiceMetadata(row?.notes);
  const appId = String(applicationRow?.id || "");
  const appUnitId = String(applicationRow?.unit_id || "");
  const appPropertyId = String(applicationRow?.property_id || scopedOnboardingPropertyId || "");

  // If metadata explicitly names another applicant, this invoice is not for this tenant.
  if (metadata.APPLICANT_ID && metadata.APPLICANT_ID !== tenantProfileId) {
    return false;
  }

  // Prefer application/unit/property-congruent invoices when metadata is present.
  if (appId && metadata.LEASE_APPLICATION_ID && metadata.LEASE_APPLICATION_ID !== appId) {
    return false;
  }

  if (appUnitId && metadata.UNIT_ID && metadata.UNIT_ID !== appUnitId) {
    return false;
  }

  if (appPropertyId) {
    if (metadata.PROPERTY_ID && metadata.PROPERTY_ID !== appPropertyId) {
      return false;
    }
    if (!metadata.PROPERTY_ID && row?.property_id && String(row.property_id) !== appPropertyId) {
      return false;
    }
  }

  return true;
};

const sortOnboardingInvoicesByRelevance = (
  rows: any[],
  tenantProfileId: string,
  applicationRow: any
) => {
  const appId = String(applicationRow?.id || "");
  const appUnitId = String(applicationRow?.unit_id || "");

  return [...(rows || [])].sort((a, b) => {
    const ma = parseInvoiceMetadata(a?.notes);
    const mb = parseInvoiceMetadata(b?.notes);

    const score = (m: InvoiceMetadata) => {
      let value = 0;
      if (m.APPLICANT_ID === tenantProfileId) value += 8;
      if (appId && m.LEASE_APPLICATION_ID === appId) value += 10;
      if (appUnitId && m.UNIT_ID === appUnitId) value += 6;
      if (String(m.BILLING_EVENT || "").toLowerCase() === "first_payment") value += 4;
      return value;
    };

    const diff = score(mb) - score(ma);
    if (diff !== 0) return diff;

    const aTime = new Date(a?.updated_at || a?.created_at || 0).getTime();
    const bTime = new Date(b?.updated_at || b?.created_at || 0).getTime();
    return bTime - aTime;
  });
};

const resolveLatestRelevantApplication = async (tenantProfileId: string) => {
  if (!tenantProfileId) return null;

  const { data, error } = await supabase
    .from("lease_applications")
    .select("id, property_id, unit_id, status, created_at")
    .eq("applicant_id", tenantProfileId)
    .in("status", APPLICATION_STATUS_LOOKUP)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return (data || [])[0] || null;
};

const resolveTenantRowsByUser = async (tenantProfileId: string): Promise<TenantIdentityRow[]> => {
  if (!tenantProfileId) return [];

  const { data, error } = await supabase
    .from("tenants")
    .select("id, user_id, property_id, unit_id, status")
    .eq("user_id", tenantProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST116" || error.code === "42501") {
      return [];
    }
    throw error;
  }

  return (data || []) as TenantIdentityRow[];
};

const buildTenantIdentifierSet = (tenantProfileId: string, tenantRows: TenantIdentityRow[]) => {
  const identifiers = [tenantProfileId, ...(tenantRows || []).map((row) => row.id)].filter(Boolean);
  return Array.from(new Set(identifiers));
};

const normalizeTenantProfileId = async (candidateId?: string | null): Promise<string | null> => {
  if (!candidateId) return null;

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", candidateId)
    .maybeSingle();

  if (!profileError && profileRow?.id) {
    return profileRow.id;
  }

  const { data: tenantRow, error: tenantError } = await supabase
    .from("tenants")
    .select("user_id")
    .eq("id", candidateId)
    .maybeSingle();

  if (!tenantError && tenantRow?.user_id) {
    return tenantRow.user_id;
  }

  return candidateId;
};

const sanitizeMetadataValue = (value: unknown): string | null => {
  const raw = String(value || "")
    .replace(/[;\r\n]/g, " ")
    .trim();

  return raw || null;
};

const readUnitAssignmentDetails = async (unitId: string) => {
  if (!unitId) {
    return {
      unitNumber: null as string | null,
      unitTypeId: null as string | null,
      unitTypeName: null as string | null,
      propertyName: null as string | null,
      propertyId: null as string | null,
    };
  }

  const { data, error } = await supabase
    .from("units")
    .select(
      "id, unit_number, property_id, unit_type_id, properties:property_id(name), property_unit_types:unit_type_id(name, unit_type_name)"
    )
    .eq("id", unitId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  const unitTypeRow = Array.isArray((data as any)?.property_unit_types)
    ? (data as any).property_unit_types[0]
    : (data as any)?.property_unit_types;
  const propertyRow = Array.isArray((data as any)?.properties)
    ? (data as any).properties[0]
    : (data as any)?.properties;

  return {
    unitNumber: (data as any)?.unit_number || null,
    unitTypeId: (data as any)?.unit_type_id || null,
    unitTypeName: unitTypeRow?.name || unitTypeRow?.unit_type_name || null,
    propertyName: propertyRow?.name || null,
    propertyId: (data as any)?.property_id || null,
  };
};

const buildAssignmentMetadataTags = (params: AssignmentMetadataInput): string[] => {
  const tags: string[] = [
    `UNIT_ID:${params.unitId}`,
    `PROPERTY_ID:${params.propertyId}`,
    `APPLICANT_ID:${params.applicantId}`,
  ];

  if (params.applicationId) {
    tags.push(`LEASE_APPLICATION_ID:${params.applicationId}`);
  }

  const optionalTags: Array<[string, unknown]> = [
    ["UNIT_NUMBER", params.unitNumber],
    ["UNIT_TYPE_ID", params.unitTypeId],
    ["UNIT_TYPE_NAME", params.unitTypeName],
    ["PROPERTY_NAME", params.propertyName],
    ["APPLICANT_NAME", params.applicantName],
    ["APPLICANT_EMAIL", params.applicantEmail],
  ];

  optionalTags.forEach(([key, value]) => {
    const safeValue = sanitizeMetadataValue(value);
    if (safeValue) {
      tags.push(`${key}:${safeValue}`);
    }
  });

  return tags;
};

const parseInvoiceMetadata = (notes?: string | null): InvoiceMetadata => {
  if (!notes) return {};

  const normalizedNotes = String(notes).replace(/[\r\n]+/g, ";");
  const map: InvoiceMetadata = {};

  normalizedNotes.split(";").forEach((entry) => {
    const [rawKey, ...rest] = entry.split(":");
    if (!rawKey || rest.length === 0) return;
    const key = rawKey.trim();
    const value = rest.join(":").trim();

    if (!value) return;
    if (key === "BILLING_EVENT") map.BILLING_EVENT = value;
    if (key === "UNIT_ID") map.UNIT_ID = value;
    if (key === "PROPERTY_ID") map.PROPERTY_ID = value;
    if (key === "APPLICANT_ID") map.APPLICANT_ID = value;
    if (key === "APPLICANT_NAME") map.APPLICANT_NAME = value;
    if (key === "APPLICANT_EMAIL") map.APPLICANT_EMAIL = value;
    if (key === "LEASE_APPLICATION_ID") map.LEASE_APPLICATION_ID = value;
    if (key === "LEASE_ID") map.LEASE_ID = value;
    if (key === "UNIT_NUMBER") map.UNIT_NUMBER = value;
    if (key === "UNIT_TYPE_ID") map.UNIT_TYPE_ID = value;
    if (key === "UNIT_TYPE_NAME") map.UNIT_TYPE_NAME = value;
    if (key === "PROPERTY_NAME") map.PROPERTY_NAME = value;
  });

  return map;
};

const buildOnboardingNotes = (params: {
  unitId: string;
  propertyId: string;
  applicantId: string;
  applicationId: string;
  unitNumber?: string | null;
  unitTypeId?: string | null;
  unitTypeName?: string | null;
  propertyName?: string | null;
  applicantName?: string | null;
  applicantEmail?: string | null;
}) => {
  const tags = [
    "BILLING_EVENT:unit_allocation",
    ...buildAssignmentMetadataTags({
      unitId: params.unitId,
      propertyId: params.propertyId,
      applicantId: params.applicantId,
      applicationId: params.applicationId,
      unitNumber: params.unitNumber,
      unitTypeId: params.unitTypeId,
      unitTypeName: params.unitTypeName,
      propertyName: params.propertyName,
      applicantName: params.applicantName,
      applicantEmail: params.applicantEmail,
    }),
  ];

  return `${tags.join(";")}\nAuto-generated for pay-first unit allocation`;
};

const readUnitRent = async (unitId: string): Promise<number> => {
  const { data: unitData, error: unitError } = await supabase
    .from("units")
    .select("price, unit_type_id")
    .eq("id", unitId)
    .maybeSingle();

  if (unitError) throw unitError;

  const unitPrice = Number((unitData as any)?.price || 0);
  if (unitPrice > 0) return unitPrice;

  const unitTypeId = (unitData as any)?.unit_type_id;
  if (!unitTypeId) return 0;

  const { data: typeData, error: typeError } = await supabase
    .from("property_unit_types")
    .select("price_per_unit")
    .eq("id", unitTypeId)
    .maybeSingle();

  if (typeError) throw typeError;
  return Number((typeData as any)?.price_per_unit || 0);
};

const readInitialChargeTemplates = async (propertyId: string) => {
  const { data: propertyData, error: propertyError } = await supabase
    .from("properties")
    .select("initial_charge_templates")
    .eq("id", propertyId)
    .maybeSingle();

  if (propertyError) throw propertyError;

  const templatesRaw = (propertyData as any)?.initial_charge_templates;
  if (!Array.isArray(templatesRaw)) return [] as any[];

  return templatesRaw
    .map((item: any) => ({
      id: String(item?.id || `tpl-${Date.now()}`),
      name: String(item?.name || "").trim(),
      charge_type: item?.charge_type === "fee" ? "fee" : "deposit",
      amount: Number(item?.amount || 0),
    }))
    .filter((item: any) => item.name && item.amount >= 0);
};

const appendInvoiceNote = async (invoiceId: string, extraLine: string) => {
  const { data: existing, error: readError } = await supabase
    .from("invoices")
    .select("notes")
    .eq("id", invoiceId)
    .maybeSingle();

  if (readError) return;

  const existingNotes = String((existing as any)?.notes || "");
  if (existingNotes.includes(extraLine)) return;

  const merged = existingNotes ? `${existingNotes}\n${extraLine}` : extraLine;
  await supabase.from("invoices").update({ notes: merged }).eq("id", invoiceId);
};

const finalizeTenantAssignmentViaRpc = async (
  invoiceId: string,
  transactionReference?: string
): Promise<{ unitId: string; propertyId: string; tenantProfileId: string; applicationId?: string } | null> => {
  const { data, error } = await supabase.rpc("finalize_tenant_onboarding_invoice", {
    p_invoice_id: invoiceId,
    p_payment_reference: transactionReference || null,
  });

  if (error) {
    const message = String(error.message || "").toLowerCase();
    const rpcMissing =
      error.code === "PGRST202" ||
      message.includes("could not find the function") ||
      message.includes("finalize_tenant_onboarding_invoice");

    if (rpcMissing) return null;
    throw error;
  }

  const payload = (data || {}) as any;
  if (!payload?.success) {
    throw new Error(payload?.message || "Failed to finalize tenant onboarding assignment.");
  }

  return {
    unitId: String(payload.unit_id || ""),
    propertyId: String(payload.property_id || ""),
    tenantProfileId: String(payload.tenant_profile_id || ""),
    applicationId: payload.lease_application_id ? String(payload.lease_application_id) : undefined,
  };
};

const computeTenantPortalAccessState = async (
  tenantProfileId: string,
  allowAutoFinalize: boolean
): Promise<TenantPortalAccessState> => {
  const defaultState: TenantPortalAccessState = {
    hasActiveAssignment: false,
    hasPendingApplication: false,
    hasPaidOnboardingInvoice: false,
    isLocked: false,
    pendingInitialInvoices: [],
    initialInvoiceTotal: 0,
    activeTenantRow: null,
    activeLeaseRow: null,
  };

  if (!tenantProfileId) return defaultState;

  const tenantRows = await resolveTenantRowsByUser(tenantProfileId);
  const tenantIdentifiers = buildTenantIdentifierSet(tenantProfileId, tenantRows);

  const applicationRow = await resolveLatestRelevantApplication(tenantProfileId);
  const hasPendingApplication = Boolean((applicationRow as any)?.id);
  const onboardingApplicationCreatedAt = (applicationRow as any)?.created_at || null;
  const activeTenantCandidate =
    tenantRows.find((row) => row.status === "active") ||
    tenantRows.find((row) => Boolean(row.property_id && row.unit_id)) ||
    null;

  const scopedOnboardingPropertyId =
    activeTenantCandidate?.property_id ||
    (applicationRow as any)?.property_id ||
    null;

  let unpaidInvoiceQuery = supabase
    .from("invoices")
    .select("id, amount, due_date, status, reference_number, property_id, notes, items")
    .in("status", ["unpaid", "overdue", "pending"]);

  unpaidInvoiceQuery = applyOnboardingInvoiceFilter(unpaidInvoiceQuery, tenantIdentifiers);

  if (scopedOnboardingPropertyId) {
    unpaidInvoiceQuery = unpaidInvoiceQuery.eq("property_id", scopedOnboardingPropertyId);
  }

  let paidInvoiceQuery = supabase
    .from("invoices")
    .select("id, amount, due_date, status, reference_number, property_id, notes, items, tenant_id")
    .eq("status", "paid");

  paidInvoiceQuery = applyOnboardingInvoiceFilter(paidInvoiceQuery, tenantIdentifiers);

  if (scopedOnboardingPropertyId) {
    paidInvoiceQuery = paidInvoiceQuery.eq("property_id", scopedOnboardingPropertyId);
  }

  const [leaseResp, unpaidInvoiceResp, paidInvoiceResp] = await Promise.all([
    supabase
      .from("tenant_leases")
      .select("id, unit_id, status")
      .in("tenant_id", tenantIdentifiers)
      .in("status", ACTIVE_LEASE_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1),
    unpaidInvoiceQuery.order("due_date", { ascending: true }),
    paidInvoiceQuery.order("updated_at", { ascending: false }),
  ]);

  if (leaseResp.error) {
    throw leaseResp.error;
  }
  if (unpaidInvoiceResp.error) {
    throw unpaidInvoiceResp.error;
  }
  if (paidInvoiceResp.error) {
    throw paidInvoiceResp.error;
  }

  const activeTenantRow = activeTenantCandidate
    ? {
        id: activeTenantCandidate.id,
        property_id: activeTenantCandidate.property_id || null,
        unit_id: activeTenantCandidate.unit_id || null,
      }
    : null;

  const activeLeaseRow =
    ((leaseResp.data || [])[0] as { id: string; unit_id: string | null; status: string | null } | undefined) || null;

  const hasActiveAssignment =
    Boolean(activeTenantRow?.property_id && activeTenantRow?.unit_id) ||
    Boolean(activeLeaseRow?.unit_id);

  const runFallbackInvoiceLookup = async (
    status: "paid" | "unpaid_overdue",
    applyPropertyScope: boolean,
    applyTenantIdentifierFilter: boolean
  ) => {
    let fallbackQuery = supabase
      .from("invoices")
      .select("id, amount, due_date, status, reference_number, property_id, notes, items, tenant_id");

    // Force fallback to only hit first_payment or unit_allocation invoices and keep notes-based ownership.
    fallbackQuery = applyOnboardingInvoiceFilter(
      fallbackQuery,
      applyTenantIdentifierFilter ? tenantIdentifiers : []
    );

    if (status === "paid") {
      fallbackQuery = fallbackQuery.eq("status", "paid");
    } else {
      fallbackQuery = fallbackQuery.in("status", ["unpaid", "overdue"]);
    }

    if (applyPropertyScope && scopedOnboardingPropertyId) {
      fallbackQuery = fallbackQuery.eq("property_id", scopedOnboardingPropertyId);
    }

    if (onboardingApplicationCreatedAt) {
      fallbackQuery = fallbackQuery.gte("created_at", onboardingApplicationCreatedAt);
    }

    return status === "paid"
      ? fallbackQuery.order("updated_at", { ascending: false })
      : fallbackQuery.order("due_date", { ascending: true });
  };

  let onboardingUnpaidRows = (unpaidInvoiceResp.data || []) as any[];
  let onboardingPaidRows = (paidInvoiceResp.data || []) as any[];

  if (!hasActiveAssignment && hasPendingApplication) {
    if (onboardingUnpaidRows.length === 0) {
      let fallbackUnpaidResp = await runFallbackInvoiceLookup("unpaid_overdue", true, true);
      if (fallbackUnpaidResp.error) {
        throw fallbackUnpaidResp.error;
      }

      onboardingUnpaidRows = (fallbackUnpaidResp.data || []) as any[];

      if (onboardingUnpaidRows.length === 0 && scopedOnboardingPropertyId) {
        fallbackUnpaidResp = await runFallbackInvoiceLookup("unpaid_overdue", false, true);
        if (fallbackUnpaidResp.error) {
          throw fallbackUnpaidResp.error;
        }
        onboardingUnpaidRows = (fallbackUnpaidResp.data || []) as any[];
      }

      if (onboardingUnpaidRows.length === 0) {
        fallbackUnpaidResp = await runFallbackInvoiceLookup("unpaid_overdue", true, false);
        if (fallbackUnpaidResp.error) {
          throw fallbackUnpaidResp.error;
        }
        onboardingUnpaidRows = (fallbackUnpaidResp.data || []) as any[];
      }

      if (onboardingUnpaidRows.length === 0 && scopedOnboardingPropertyId) {
        fallbackUnpaidResp = await runFallbackInvoiceLookup("unpaid_overdue", false, false);
        if (fallbackUnpaidResp.error) {
          throw fallbackUnpaidResp.error;
        }
        onboardingUnpaidRows = (fallbackUnpaidResp.data || []) as any[];
      }
    }

    if (onboardingPaidRows.length === 0) {
      let fallbackPaidResp = await runFallbackInvoiceLookup("paid", true, true);
      if (fallbackPaidResp.error) {
        throw fallbackPaidResp.error;
      }

      onboardingPaidRows = (fallbackPaidResp.data || []) as any[];

      if (onboardingPaidRows.length === 0 && scopedOnboardingPropertyId) {
        fallbackPaidResp = await runFallbackInvoiceLookup("paid", false, true);
        if (fallbackPaidResp.error) {
          throw fallbackPaidResp.error;
        }
        onboardingPaidRows = (fallbackPaidResp.data || []) as any[];
      }

      if (onboardingPaidRows.length === 0) {
        fallbackPaidResp = await runFallbackInvoiceLookup("paid", true, false);
        if (fallbackPaidResp.error) {
          throw fallbackPaidResp.error;
        }
        onboardingPaidRows = (fallbackPaidResp.data || []) as any[];
      }

      if (onboardingPaidRows.length === 0 && scopedOnboardingPropertyId) {
        fallbackPaidResp = await runFallbackInvoiceLookup("paid", false, false);
        if (fallbackPaidResp.error) {
          throw fallbackPaidResp.error;
        }
        onboardingPaidRows = (fallbackPaidResp.data || []) as any[];
      }
    }

    if (onboardingUnpaidRows.length === 0) {
      // Metadata-only fallback: find first-payment/unit-allocation invoices visible under RLS
      // even when tenant_id linkage is legacy/mixed.
      let metadataQuery = supabase
        .from("invoices")
        .select("id, amount, due_date, status, reference_number, property_id, notes, items, tenant_id, created_at, updated_at")
        .in("status", ["unpaid", "overdue", "pending"]);

      metadataQuery = applyOnboardingInvoiceFilter(metadataQuery, tenantIdentifiers);

      if (scopedOnboardingPropertyId) {
        metadataQuery = metadataQuery.eq("property_id", scopedOnboardingPropertyId);
      }

      if (onboardingApplicationCreatedAt) {
        metadataQuery = metadataQuery.gte("created_at", onboardingApplicationCreatedAt);
      }

      const metadataResp = await metadataQuery.order("created_at", { ascending: false });
      if (metadataResp.error) {
        throw metadataResp.error;
      }

      onboardingUnpaidRows = (metadataResp.data || []) as any[];
    }
  }

  const relevantUnpaidRows = (onboardingUnpaidRows || []).filter((row) =>
    isInvoiceRelevantToCurrentOnboarding(row, tenantProfileId, applicationRow, scopedOnboardingPropertyId)
  );

  const preferredUnpaidInvoices = prioritizeSuperAdminOnboardingInvoices(
    sortOnboardingInvoicesByRelevance(relevantUnpaidRows, tenantProfileId, applicationRow)
  );

  const pendingInitialInvoices: PendingInitialInvoice[] = preferredUnpaidInvoices.map((row: any) => {
    const metadata = parseInvoiceMetadata(row.notes);
    return {
      id: row.id,
      amount: Number(row.amount || 0),
      due_date: row.due_date,
      status: row.status,
      reference_number: row.reference_number,
      property_id: row.property_id,
      unit_id: metadata.UNIT_ID || null,
      items: row.items || null,
      notes: row.notes,
    };
  });

  const relevantPaidRows = (onboardingPaidRows || []).filter((row) =>
    isInvoiceRelevantToCurrentOnboarding(row, tenantProfileId, applicationRow, scopedOnboardingPropertyId)
  );

  const preferredPaidInvoices = prioritizeSuperAdminOnboardingInvoices(
    sortOnboardingInvoicesByRelevance(relevantPaidRows, tenantProfileId, applicationRow)
  );

  const paidOnboardingInvoices: InvoiceLike[] = preferredPaidInvoices.map((row: any) => ({
    id: row.id,
    amount: Number(row.amount || 0),
    property_id: row.property_id,
    tenant_id: row.tenant_id,
    notes: row.notes,
    items: row.items,
  }));

  if (allowAutoFinalize && !hasActiveAssignment && paidOnboardingInvoices.length > 0) {
    let finalizationAttempted = false;

    for (const paidInvoice of paidOnboardingInvoices) {
      try {
        await finalizeTenantAssignmentFromInvoice(paidInvoice);
        finalizationAttempted = true;
      } catch (error) {
        const message = String((error as any)?.message || "");
        console.warn("Auto-finalization attempt failed", {
          invoiceId: paidInvoice.id,
          message,
        });

        if (message.includes("Onboarding finalization RPC is unavailable")) {
          break;
        }
      }
    }

    if (finalizationAttempted) {
      return computeTenantPortalAccessState(tenantProfileId, false);
    }
  }

  const hasPaidOnboardingInvoice = paidOnboardingInvoices.length > 0;
  const hasOutstandingOnboardingInvoices = pendingInitialInvoices.length > 0;

  // Keep the portal locked only while money is still due, or while approval exists with no paid onboarding invoice.
  // If onboarding is already paid, do not trap the tenant in a permanent lock while assignment sync catches up.
  const isLocked =
    hasOutstandingOnboardingInvoices ||
    (!hasActiveAssignment && hasPendingApplication && !hasPaidOnboardingInvoice);

  const initialInvoiceTotal = pendingInitialInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount || 0),
    0
  );

  return {
    hasActiveAssignment,
    hasPendingApplication,
    hasPaidOnboardingInvoice,
    isLocked,
    pendingInitialInvoices,
    initialInvoiceTotal,
    activeTenantRow,
    activeLeaseRow,
  };
};

export const getTenantPortalAccessState = async (
  tenantProfileId: string
): Promise<TenantPortalAccessState> => {
  return computeTenantPortalAccessState(tenantProfileId, true);
};

export const createOrEnsureMoveInInvoiceForApplication = async (
  application: LeaseApplicationOnboardingData
): Promise<{ linkedInvoiceId: string | null; source: "billing_invoice" | "awaiting_super_admin" }> => {
  if (!application.applicant_id) {
    throw new Error("Application has no registered applicant account.");
  }

  const appIdTag = `LEASE_APPLICATION_ID:${application.id}`;
  const applicantTenantRows = await resolveTenantRowsByUser(application.applicant_id);
  const applicantIdentifiers = buildTenantIdentifierSet(application.applicant_id, applicantTenantRows);
  const unitDetails = await readUnitAssignmentDetails(application.unit_id);

  const moveInNotesFilter = `${INITIAL_MOVE_IN_INVOICE_NOTES_FILTER},notes.ilike.%${appIdTag}%`;

  const { data: existingInvoices, error: invoiceLookupError } = await supabase
    .from("invoices")
    .select("id, notes, created_at")
    .in("tenant_id", applicantIdentifiers)
    .eq("property_id", application.property_id)
    .in("status", ["unpaid", "overdue"])
    .or(moveInNotesFilter)
    .order("created_at", { ascending: false })
    .limit(25);

  if (invoiceLookupError && invoiceLookupError.code !== "PGRST116") {
    throw invoiceLookupError;
  }

  const metadataTags = buildAssignmentMetadataTags({
    unitId: application.unit_id,
    propertyId: application.property_id,
    applicantId: application.applicant_id,
    applicationId: application.id,
    unitNumber: application.unit_number || unitDetails.unitNumber,
    unitTypeId: application.unit_type_id || unitDetails.unitTypeId,
    unitTypeName: application.unit_type_name || unitDetails.unitTypeName,
    propertyName: application.property_name || unitDetails.propertyName,
    applicantName: application.applicant_name,
    applicantEmail: application.applicant_email,
  });

  const preferredExistingInvoice = prioritizeSuperAdminOnboardingInvoices((existingInvoices || []) as any[])[0] ||
    (existingInvoices || [])[0] ||
    null;

  let linkedInvoiceId = preferredExistingInvoice?.id || null;

  if (linkedInvoiceId) {
    const normalizedNotes = String((preferredExistingInvoice as any)?.notes || "");

    // Ensure onboarding marker exists so tenant payment reconciliation can detect this invoice.
    if (!/BILLING_EVENT:(first_payment|unit_allocation)/i.test(normalizedNotes)) {
      await appendInvoiceNote(linkedInvoiceId, "BILLING_EVENT:first_payment");
    }

    for (const tag of metadataTags) {
      await appendInvoiceNote(linkedInvoiceId, tag);
    }
  }

  await supabase
    .from("units")
    .update({ status: "booked" })
    .eq("id", application.unit_id)
    .in("status", ["vacant", "available", "booked"]);

  await supabase
    .from("lease_applications")
    .update({ status: "under_review" })
    .eq("id", application.id);

  return {
    linkedInvoiceId,
    source: linkedInvoiceId ? "billing_invoice" : "awaiting_super_admin",
  };
};

export const finalizeTenantAssignmentFromInvoice = async (
  invoice: InvoiceLike,
  transactionReference?: string
) => {
  let recoverableRpcMetadataFailure = false;
  try {
    const rpcResult = await finalizeTenantAssignmentViaRpc(invoice.id, transactionReference);
    if (rpcResult?.unitId && rpcResult?.propertyId && rpcResult?.tenantProfileId) {
      return rpcResult;
    }
  } catch (rpcError: any) {
    const rpcMessage = String(rpcError?.message || "").toLowerCase();
    recoverableRpcMetadataFailure =
      rpcMessage.includes("missing unit metadata") ||
      rpcMessage.includes("missing property metadata") ||
      rpcMessage.includes("missing tenant profile metadata");

    if (!recoverableRpcMetadataFailure) {
      throw rpcError;
    }
  }

  if (!ENABLE_CLIENT_FINALIZATION_FALLBACK && !recoverableRpcMetadataFailure) {
    throw new Error(
      "Onboarding finalization RPC is unavailable. Apply migration 20260328_finalize_tenant_onboarding_invoice_rpc.sql."
    );
  }

  const metadata = parseInvoiceMetadata(invoice.notes);
  let tenantProfileId = metadata.APPLICANT_ID || invoice.tenant_id;
  let unitId = metadata.UNIT_ID;
  let propertyId = metadata.PROPERTY_ID || invoice.property_id;

  if (metadata.LEASE_ID && (!unitId || !tenantProfileId || !propertyId)) {
    const { data: leaseRow, error: leaseError } = await supabase
      .from("tenant_leases")
      .select("id, tenant_id, unit_id")
      .eq("id", metadata.LEASE_ID)
      .maybeSingle();

    if (leaseError && leaseError.code !== "PGRST116") {
      throw leaseError;
    }

    if (leaseRow) {
      tenantProfileId = tenantProfileId || leaseRow.tenant_id;
      unitId = unitId || leaseRow.unit_id;
    }
  }

  if (metadata.LEASE_APPLICATION_ID && (!unitId || !tenantProfileId || !propertyId)) {
    const { data: appRow, error: appError } = await supabase
      .from("lease_applications")
      .select("id, applicant_id, unit_id, property_id")
      .eq("id", metadata.LEASE_APPLICATION_ID)
      .maybeSingle();

    if (appError && appError.code !== "PGRST116") {
      throw appError;
    }

    if (appRow) {
      tenantProfileId = tenantProfileId || appRow.applicant_id;
      unitId = unitId || appRow.unit_id;
      propertyId = propertyId || appRow.property_id;
    }
  }

  if (!unitId && tenantProfileId) {
    let appLookup = supabase
      .from("lease_applications")
      .select("id, applicant_id, unit_id, property_id")
      .eq("applicant_id", tenantProfileId)
      .in("status", APPLICATION_STATUS_LOOKUP)
      .order("created_at", { ascending: false })
      .limit(1);

    if (propertyId) {
      appLookup = appLookup.eq("property_id", propertyId);
    }

    const { data: appRow, error: appError } = await appLookup.maybeSingle();

    if (appError && appError.code !== "PGRST116") {
      throw appError;
    }

    if (appRow) {
      unitId = unitId || appRow.unit_id;
      propertyId = propertyId || appRow.property_id;
    }
  }

  tenantProfileId = await normalizeTenantProfileId(tenantProfileId);

  if (!propertyId && unitId) {
    const { data: unitRow, error: unitError } = await supabase
      .from("units")
      .select("property_id")
      .eq("id", unitId)
      .maybeSingle();

    if (unitError && unitError.code !== "PGRST116") {
      throw unitError;
    }

    propertyId = (unitRow as any)?.property_id || null;
  }

  if (!propertyId && metadata.PROPERTY_NAME) {
    const { data: propertyRow, error: propertyError } = await supabase
      .from("properties")
      .select("id")
      .ilike("name", metadata.PROPERTY_NAME)
      .limit(1)
      .maybeSingle();

    if (propertyError && propertyError.code !== "PGRST116") {
      throw propertyError;
    }

    propertyId = (propertyRow as any)?.id || null;
  }

  if (!unitId && metadata.UNIT_NUMBER) {
    let unitLookup = supabase
      .from("units")
      .select("id, property_id")
      .eq("unit_number", metadata.UNIT_NUMBER)
      .limit(1);

    if (propertyId) {
      unitLookup = unitLookup.eq("property_id", propertyId);
    }

    const { data: unitByNumber, error: unitByNumberError } = await unitLookup.maybeSingle();

    if (unitByNumberError && unitByNumberError.code !== "PGRST116") {
      throw unitByNumberError;
    }

    if (unitByNumber) {
      unitId = (unitByNumber as any).id || unitId;
      propertyId = propertyId || (unitByNumber as any).property_id || null;
    }
  }

  if (!tenantProfileId) throw new Error("Cannot finalize assignment: missing tenant id.");
  if (!unitId) throw new Error("Cannot finalize assignment: missing unit id in invoice metadata.");
  if (!propertyId) throw new Error("Cannot finalize assignment: missing property id.");

  const tenantRows = await resolveTenantRowsByUser(tenantProfileId);
  const tenantIdentifiers = buildTenantIdentifierSet(tenantProfileId, tenantRows);

  const { data: activeUnitLease, error: activeUnitLeaseError } = await supabase
    .from("tenant_leases")
    .select("id, tenant_id, status")
    .eq("unit_id", unitId)
    .in("status", ACTIVE_LEASE_STATUSES)
    .limit(1)
    .maybeSingle();

  if (activeUnitLeaseError && activeUnitLeaseError.code !== "PGRST116") {
    throw activeUnitLeaseError;
  }

  if (activeUnitLease && !tenantIdentifiers.includes(activeUnitLease.tenant_id)) {
    throw new Error("Unit is already assigned to another tenant.");
  }

  const { data: conflictingTenantLease, error: conflictingTenantLeaseError } = await supabase
    .from("tenant_leases")
    .select("id, unit_id")
    .in("tenant_id", tenantIdentifiers)
    .in("status", ACTIVE_LEASE_STATUSES)
    .neq("unit_id", unitId)
    .limit(1)
    .maybeSingle();

  if (conflictingTenantLeaseError && conflictingTenantLeaseError.code !== "PGRST116") {
    throw conflictingTenantLeaseError;
  }

  if (conflictingTenantLease) {
    throw new Error("Tenant already has an active unit assignment.");
  }

  const nowIso = new Date().toISOString();

  const { data: existingTenantRow, error: existingTenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", tenantProfileId)
    .maybeSingle();

  if (existingTenantError && existingTenantError.code !== "PGRST116") {
    throw existingTenantError;
  }

  if (existingTenantRow?.id) {
    const { error: updateTenantError } = await supabase
      .from("tenants")
      .update({
        property_id: propertyId,
        unit_id: unitId,
        status: "active",
        move_in_date: nowIso,
      })
      .eq("id", existingTenantRow.id);

    if (updateTenantError) throw updateTenantError;
  } else {
    const { error: createTenantError } = await supabase.from("tenants").insert({
      user_id: tenantProfileId,
      property_id: propertyId,
      unit_id: unitId,
      status: "active",
      move_in_date: nowIso,
    });

    if (createTenantError) throw createTenantError;
  }

  if (activeUnitLease?.id) {
    const { error: reuseLeaseError } = await supabase
      .from("tenant_leases")
      .update({ tenant_id: tenantProfileId, status: "active", start_date: nowIso })
      .eq("id", activeUnitLease.id);

    if (reuseLeaseError) throw reuseLeaseError;
  } else {
    const parsedRent = Number((invoice.items as any)?.monthly_rent || 0);
    const rentAmount = parsedRent > 0 ? parsedRent : await readUnitRent(unitId);

    const { error: createLeaseError } = await supabase.from("tenant_leases").insert({
      tenant_id: tenantProfileId,
      unit_id: unitId,
      status: "active",
      start_date: nowIso,
      rent_amount: rentAmount,
    });

    if (createLeaseError) throw createLeaseError;
  }

  await supabase
    .from("units")
    .update({ status: "occupied" })
    .eq("id", unitId);

  await supabase
    .from("profiles")
    .update({
      role: "tenant",
      user_type: "tenant",
      status: "active",
      is_active: true,
      assigned_property_id: propertyId,
      updated_at: nowIso,
    })
    .eq("id", tenantProfileId);

  if (metadata.LEASE_APPLICATION_ID) {
    await supabase
      .from("lease_applications")
      .update({ status: "approved" })
      .eq("id", metadata.LEASE_APPLICATION_ID);
  } else {
    await supabase
      .from("lease_applications")
      .update({ status: "approved" })
      .eq("applicant_id", tenantProfileId)
      .eq("unit_id", unitId)
      .in("status", APPLICATION_STATUS_LOOKUP);
  }

  await appendInvoiceNote(invoice.id, `TENANT_ASSIGNED_AT:${new Date().toISOString()}`);
  if (transactionReference) {
    await appendInvoiceNote(invoice.id, `PAYMENT_REFERENCE:${transactionReference}`);
  }

  return {
    unitId,
    propertyId,
    tenantProfileId,
    applicationId: metadata.LEASE_APPLICATION_ID,
  };
};

export const reconcileInitialAllocationInvoicesForTenant = async (
  tenantProfileId: string,
  paymentAmount: number,
  transactionReference?: string
) => {
  if (!tenantProfileId || paymentAmount <= 0) {
    return {
      appliedAmount: 0,
      paidInvoices: [] as Array<{
        id: string;
        amount: number;
        propertyId?: string;
        unitId?: string;
      }>,
      paidInvoiceIds: [] as string[],
      finalized: [] as Array<{ unitId: string; propertyId: string; tenantProfileId: string; applicationId?: string }>,
    };
  }

  const tenantRows = await resolveTenantRowsByUser(tenantProfileId);
  const tenantIdentifiers = buildTenantIdentifierSet(tenantProfileId, tenantRows);
  const activeTenantCandidate =
    tenantRows.find((row) => row.status === "active") ||
    tenantRows.find((row) => Boolean(row.property_id && row.unit_id)) ||
    null;
  const applicationRow = await resolveLatestRelevantApplication(tenantProfileId);
  const scopedOnboardingPropertyId =
    activeTenantCandidate?.property_id ||
    (applicationRow as any)?.property_id ||
    null;

  let invoicesQuery = supabase
    .from("invoices")
    .select("id, amount, property_id, tenant_id, status, notes, items")
    .in("status", ["unpaid", "overdue", "pending"]);

  invoicesQuery = applyOnboardingInvoiceFilter(invoicesQuery, tenantIdentifiers);

  if (scopedOnboardingPropertyId) {
    invoicesQuery = invoicesQuery.eq("property_id", scopedOnboardingPropertyId);
  }

  const { data: invoices, error: invoicesError } = await invoicesQuery.order("due_date", { ascending: true });

  if (invoicesError) throw invoicesError;

  let onboardingCandidateRows = (invoices || []) as any[];
  const onboardingApplicationCreatedAt = (applicationRow as any)?.created_at || null;
  const hasPendingApplication = Boolean((applicationRow as any)?.id);
  const hasActiveAssignment = Boolean(activeTenantCandidate?.property_id && activeTenantCandidate?.unit_id);

  if (onboardingCandidateRows.length === 0 && hasPendingApplication && !hasActiveAssignment) {
    const runFallbackLookup = async (applyPropertyScope: boolean, applyTenantIdentifierFilter: boolean) => {
      let fallbackQuery = supabase
        .from("invoices")
        .select("id, amount, property_id, tenant_id, status, notes, items")
        .in("status", ["unpaid", "overdue", "pending"]);

      fallbackQuery = applyOnboardingInvoiceFilter(
        fallbackQuery,
        applyTenantIdentifierFilter ? tenantIdentifiers : []
      );

      if (applyPropertyScope && scopedOnboardingPropertyId) {
        fallbackQuery = fallbackQuery.eq("property_id", scopedOnboardingPropertyId);
      }

      if (onboardingApplicationCreatedAt) {
        fallbackQuery = fallbackQuery.gte("created_at", onboardingApplicationCreatedAt);
      }

      return fallbackQuery.order("due_date", { ascending: true });
    };

    let fallbackResp = await runFallbackLookup(true, true);
    if (fallbackResp.error) throw fallbackResp.error;
    onboardingCandidateRows = (fallbackResp.data || []) as any[];

    if (onboardingCandidateRows.length === 0 && scopedOnboardingPropertyId) {
      fallbackResp = await runFallbackLookup(false, true);
      if (fallbackResp.error) throw fallbackResp.error;
      onboardingCandidateRows = (fallbackResp.data || []) as any[];
    }

    if (onboardingCandidateRows.length === 0) {
      fallbackResp = await runFallbackLookup(true, false);
      if (fallbackResp.error) throw fallbackResp.error;
      onboardingCandidateRows = (fallbackResp.data || []) as any[];
    }

    if (onboardingCandidateRows.length === 0 && scopedOnboardingPropertyId) {
      fallbackResp = await runFallbackLookup(false, false);
      if (fallbackResp.error) throw fallbackResp.error;
      onboardingCandidateRows = (fallbackResp.data || []) as any[];
    }
  }

  let remaining = paymentAmount;
  const paidInvoices: InvoiceLike[] = [];

  const prioritizedInvoices = prioritizeSuperAdminOnboardingInvoices(onboardingCandidateRows);

  for (const invoice of prioritizedInvoices) {
    const invoiceAmount = Number((invoice as any).amount || 0);
    if (invoiceAmount <= 0) continue;
    if (remaining + 0.001 < invoiceAmount) continue;

    const { error: markPaidError } = await supabase
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", (invoice as any).id);

    if (markPaidError) throw markPaidError;

    paidInvoices.push(invoice as any);
    remaining -= invoiceAmount;

    await appendInvoiceNote((invoice as any).id, `PAID_AT:${new Date().toISOString()}`);
    if (transactionReference) {
      await appendInvoiceNote((invoice as any).id, `PAYMENT_REFERENCE:${transactionReference}`);
    }
  }

  const finalized: Array<{ unitId: string; propertyId: string; tenantProfileId: string; applicationId?: string }> = [];

  for (const invoice of paidInvoices) {
    try {
      const assignment = await finalizeTenantAssignmentFromInvoice(invoice, transactionReference);
      finalized.push(assignment);
    } catch (error) {
      const message = (error as any)?.message || "Assignment finalization pending";
      console.warn("Assignment finalization pending for paid invoice", {
        invoiceId: invoice.id,
        message,
      });
      await appendInvoiceNote(invoice.id, `ASSIGNMENT_FINALIZATION_PENDING:${new Date().toISOString()}`);
    }
  }

  const appliedAmount = paidInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount || 0),
    0
  );

  return {
    appliedAmount,
    paidInvoices: paidInvoices.map((invoice) => ({
      id: invoice.id,
      amount: Number(invoice.amount || 0),
      propertyId: parseInvoiceMetadata(invoice.notes).PROPERTY_ID || invoice.property_id,
      unitId: parseInvoiceMetadata(invoice.notes).UNIT_ID,
    })),
    paidInvoiceIds: paidInvoices.map((invoice) => invoice.id),
    finalized,
  };
};
