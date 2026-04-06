export const TENANT_LEASE_AGREEMENT_VERSION = "ayden-plaza-v1";

export interface TenantLeaseAgreementForm {
  lesseeName: string;
  poBox: string;
  idNumber: string;
  phone: string;
  email: string;
  houseNumber: string;
  effectiveDate: string;
  endDate: string;
  tenantSignatureName: string;
  tenantSignatureDate: string;
}

export const AYDEN_PLAZA_LEASE_CLAUSES = `
DEFAULT:
Rent is due by the 5th of every month without fail. Late payments incur Kshs. 1,500 for delays up to the 10th.
From the 11th day, unpaid rent attracts 2% daily interest or a maximum of 25% per month, whichever applies.

A. THE TENANT AGREES WITH THE LANDLORD AS FOLLOWS
(i) To pay rent on the agreed dates and to settle water, electricity, garbage collection, and all other applicable bills.
(ii) At termination, to return the premises, fixtures, fittings, locks, keys, and fastenings in proper condition per the lease covenants.
(iii) Not to make alterations, additions, fixtures, or structural changes without prior written consent.
(iv) To permit reasonable entry by the landlord or agents for structural, electrical, plumbing, drainage, and other repairs.
(v) Deposits are held as security, refundable without interest after proper handover and verification, subject to lease terms.
(vi) To use the premises for private residential use only.
(vii) Not to sub-let without written consent.
(viii) To keep fixtures and fittings clean and in good condition, fair wear and tear excepted.
(ix) To repair or replace damaged or lost fixtures, fittings, keys, or locks caused during tenancy.
(x) To be responsible for damage from negligence or willful acts by the tenant or occupants.
(xi) To handle normal running repairs for internal fixtures and fittings.
(xii) Not to invalidate building insurance or increase premiums through prohibited actions.
(xiii) Where damage by fire is caused by tenant default, to contribute fairly to reinstatement costs as determined in law.
(xiv) Not to cause nuisance, annoyance, or reputational harm to the premises.
(xv) No pets are allowed.
(xvi) To keep peace and avoid disturbance to other occupants.
(xvii) Laundry to be dried only in allocated areas.
(xviii) To take precaution against pests and promptly notify the landlord of infestations.
(xix) Preparation costs of this agreement are for the tenant account.
(xx) Either party may terminate by giving at least one (1) month written notice.
(xxi) Joint inspection may be requested at least fourteen (14) days before termination to assess damages and repairs.
(xxii) If rent remains unpaid by the 15th while tenant is away, landlord's agent may re-enter, remove belongings at tenant cost, and re-let.
(xxiii) Decorations: Kshs. 18,000 may be deducted from deposits upon vacating for repainting on key handover.
(xxiv) Parking areas shall not be used for immobile vehicles, repair yards, matatus, public vehicles, or lorries.

B. THE LANDLORD AGREES WITH THE TENANT AS FOLLOWS
(i) To pay land rent, rates, taxes, and statutory outgoings attributable to the demised premises after tenancy commencement.
(ii) To maintain structure, roof, and exterior in good condition and repaint where necessary.
(iii) To allow quiet enjoyment of the premises while tenant performs agreed obligations.
(iv) To maintain carriageways, parking areas, paths, and perimeter structures (except tenant-caused damage).

C. IT IS AGREED BETWEEN LANDLORD AND TENANT AS FOLLOWS
(i) The landlord or authorized agents may enter for inspection at reasonable times with permission not unreasonably withheld.
(ii) If rent exceeds seven (7) days in arrears, or covenants are breached, landlord may terminate and recover possession and arrears.
(iii) Tenant should insure personal household belongings and indemnify landlord against related loss or injury claims.
(iv) Renewal may be granted at landlord discretion if requested in writing at least two (2) months before expiry and no breach exists.
(v) Notices are valid when served in writing to management offices with acknowledgement.
(vi) No cheque payments allowed.
(vii) Delay by lessor in exercising rights does not waive such rights.
(viii) Rent may be reviewed after every one (1) year.
`;

const formatDisplayDate = (isoDate: string): string => {
  if (!isoDate) return "";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const buildAydenPlazaLeaseAgreementText = (form: TenantLeaseAgreementForm): string => {
  return `AYDEN PLAZA\nP. O. Box 68510-00622 Nairobi\n\nLEASE AGREEMENT\n\nLESSOR: AYDEN PLAZA\nLESSEE: ${form.lesseeName || ""}\nP. O. BOX: ${form.poBox || ""}\nID NO: ${form.idNumber || ""}\nTEL: +254 ${form.phone || ""}\nEMAIL: ${form.email || ""}\nPROPERTY: AYDEN PLAZA  HOUSE NUMBER ${form.houseNumber || ""}\nTERM: ONE (1) YEAR\nEFFECTIVE: ${formatDisplayDate(form.effectiveDate)}\nEND BY: ${formatDisplayDate(form.endDate)}\n\nPAYMENT:\nRent is payable monthly in advance and strictly on or before every 5th of each succeeding month.\n\nLIPA NA MPESA\nBusiness no.: 247247\nA/c no.: 052312#houseno\n\nRENT: KSHS. 56,000.00\nRENT DEPOSIT: KSHS. 56,000.00\nWATER DEPOSIT: KSHS. 3,000.00\nLEASE CHARGE: KSHS. 2,000.00\nTOTAL: KSHS. 117,000.00\n\nNOTE:\n- Water bills are charged at Kshs. 200 per unit consumed and are payable with rent.\n- Garbage collection is payable monthly to a different account issued separately.\n\n${AYDEN_PLAZA_LEASE_CLAUSES}\n\nI have read and understood this letter and accept the offer contained in it.\n\nTENANT\nName: ${form.tenantSignatureName || form.lesseeName || ""}\nSignature: ${form.tenantSignatureName || ""}\nDate: ${formatDisplayDate(form.tenantSignatureDate)}\n\nLANDLORD\nName: AYDEN PLAZA MANAGEMENT\nSignature: ______________________________\nDate: ______________________________\n\nWe wish you a happy tenancy.`;
};

const plusOneYearIso = (fromDate: Date): string => {
  const cloned = new Date(fromDate);
  cloned.setFullYear(cloned.getFullYear() + 1);
  return cloned.toISOString().split("T")[0];
};

export const createDefaultTenantLeaseAgreementForm = (
  seed?: Partial<TenantLeaseAgreementForm>
): TenantLeaseAgreementForm => {
  const todayIso = new Date().toISOString().split("T")[0];

  return {
    lesseeName: seed?.lesseeName || "",
    poBox: seed?.poBox || "",
    idNumber: seed?.idNumber || "",
    phone: seed?.phone || "",
    email: seed?.email || "",
    houseNumber: seed?.houseNumber || "",
    effectiveDate: seed?.effectiveDate || todayIso,
    endDate: seed?.endDate || plusOneYearIso(new Date()),
    tenantSignatureName: seed?.tenantSignatureName || seed?.lesseeName || "",
    tenantSignatureDate: seed?.tenantSignatureDate || todayIso,
  };
};
