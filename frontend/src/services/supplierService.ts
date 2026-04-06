import { supabase } from '@/integrations/supabase/client';

export interface SupplierProcurementRow {
  id: string;
  maintenance_request_id: string;
  property_id: string;
  lpo_number?: string | null;
  invoice_number?: string | null;
  supplier_name?: string | null;
  supplier_email?: string | null;
  supplier_phone?: string | null;
  supplier_invoice_number?: string | null;
  supplier_invoice_amount?: number | null;
  supplier_invoice_notes?: string | null;
  supplier_invoice_image_url?: string | null;
  supplier_submitted_at?: string | null;
  cost_estimate?: number | null;
  actual_cost?: number | null;
  paid_amount?: number | null;
  paid_at?: string | null;
  status: string;
  submitted_at?: string | null;
  maintenance_request?: {
    title?: string | null;
  } | null;
  property?: {
    name?: string | null;
    location?: string | null;
  } | null;
}

interface SupplierIdentity {
  email?: string | null;
  fullName?: string | null;
}

interface SubmitSupplierInvoiceInput {
  reportId: string;
  supplierInvoiceNumber: string;
  supplierInvoiceAmount: number;
  supplierInvoiceNotes?: string;
  supplierInvoiceImageUrl?: string | null;
}

const PROCUREMENT_SELECT = `
  id,
  maintenance_request_id,
  property_id,
  lpo_number,
  invoice_number,
  supplier_name,
  supplier_email,
  supplier_phone,
  supplier_invoice_number,
  supplier_invoice_amount,
  supplier_invoice_notes,
  supplier_invoice_image_url,
  supplier_submitted_at,
  cost_estimate,
  actual_cost,
  paid_amount,
  paid_at,
  status,
  submitted_at,
  maintenance_request:maintenance_requests(title),
  property:properties(name, location)
`;

export const supplierService = {
  async getSupplierProcurements(identity: SupplierIdentity): Promise<SupplierProcurementRow[]> {
    const normalizedEmail = String(identity.email || '').trim();
    const normalizedName = String(identity.fullName || '').trim();

    let emailQuery = supabase
      .from('maintenance_completion_reports')
      .select(PROCUREMENT_SELECT)
      .not('lpo_number', 'is', null)
      .order('submitted_at', { ascending: false });

    if (normalizedEmail) {
      emailQuery = emailQuery.ilike('supplier_email', normalizedEmail);
    }

    const { data: emailRows, error: emailError } = await emailQuery;

    if (emailError) {
      throw emailError;
    }

    const rowsFromEmail = (emailRows || []) as SupplierProcurementRow[];

    if (rowsFromEmail.length > 0 || !normalizedName) {
      return rowsFromEmail;
    }

    const { data: nameRows, error: nameError } = await supabase
      .from('maintenance_completion_reports')
      .select(PROCUREMENT_SELECT)
      .not('lpo_number', 'is', null)
      .ilike('supplier_name', `%${normalizedName}%`)
      .order('submitted_at', { ascending: false });

    if (nameError) {
      throw nameError;
    }

    return (nameRows || []) as SupplierProcurementRow[];
  },

  async submitSupplierInvoice(input: SubmitSupplierInvoiceInput): Promise<void> {
    const nowIso = new Date().toISOString();

    const { data: report, error: reportError } = await supabase
      .from('maintenance_completion_reports')
      .update({
        supplier_invoice_number: input.supplierInvoiceNumber,
        supplier_invoice_amount: input.supplierInvoiceAmount,
        supplier_invoice_notes: input.supplierInvoiceNotes || null,
        supplier_invoice_image_url: input.supplierInvoiceImageUrl || null,
        supplier_submitted_at: nowIso,
        status: 'supplier_submitted',
        actual_cost: input.supplierInvoiceAmount,
      })
      .eq('id', input.reportId)
      .select('invoice_number, property_id, maintenance_request_id')
      .single();

    if (reportError) {
      throw reportError;
    }

    if (report?.invoice_number) {
      const mergedNotes = [
        `SUPPLIER_INVOICE_NUMBER:${input.supplierInvoiceNumber}`,
        `SUPPLIER_SUBMITTED_AT:${nowIso}`,
        input.supplierInvoiceNotes ? `SUPPLIER_NOTE:${input.supplierInvoiceNotes}` : null,
      ]
        .filter(Boolean)
        .join(';');

      await supabase
        .from('invoices')
        .update({
          amount: input.supplierInvoiceAmount,
          status: 'unpaid',
          notes: mergedNotes,
          updated_at: nowIso,
        })
        .eq('reference_number', report.invoice_number);
    }

    const recipientIds = new Set<string>();

    const { data: accountants } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'accountant');

    (accountants || []).forEach((row: any) => row.id && recipientIds.add(row.id));

    if (report?.property_id) {
      const { data: managers } = await supabase
        .from('property_manager_assignments')
        .select('property_manager_id')
        .eq('property_id', report.property_id)
        .eq('status', 'active');

      (managers || []).forEach((row: any) => row.property_manager_id && recipientIds.add(row.property_manager_id));

      const { data: proprietors } = await supabase
        .from('proprietor_properties')
        .select('proprietor_id')
        .eq('property_id', report.property_id)
        .eq('is_active', true);

      (proprietors || []).forEach((row: any) => row.proprietor_id && recipientIds.add(row.proprietor_id));
    }

    const { data: superAdmins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'super_admin');

    (superAdmins || []).forEach((row: any) => row.id && recipientIds.add(row.id));

    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (currentUserId) {
      recipientIds.delete(currentUserId);
    }

    if (recipientIds.size > 0 && currentUserId) {
      const notifications = Array.from(recipientIds).map((recipientId) => ({
        recipient_id: recipientId,
        sender_id: currentUserId,
        type: 'payment',
        title: 'Supplier Invoice Submitted',
        message: `Supplier submitted invoice ${input.supplierInvoiceNumber} for LPO processing.`,
        related_entity_type: 'maintenance_request',
        related_entity_id: report?.maintenance_request_id || null,
        read: false,
      }));

      await supabase.from('notifications').insert(notifications);
    }
  },
};
