export interface InvoiceLineItem {
  label: string;
  amount: number;
}

const prettifyKey = (key: string) =>
  String(key || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const resolveLineAmount = (entry: any): number | null => {
  const amountKeys = ["amount", "total", "value", "price", "cost", "fee", "charge"];
  for (const key of amountKeys) {
    const parsed = asNumber(entry?.[key]);
    if (parsed !== null) return parsed;
  }
  return null;
};

const resolveLineLabel = (entry: any, fallback: string) => {
  const labelCandidate =
    entry?.label ||
    entry?.name ||
    entry?.description ||
    entry?.title ||
    entry?.type ||
    fallback;

  return prettifyKey(String(labelCandidate || fallback || "Invoice Charge"));
};

export const extractInvoiceLineItems = (rawItems: unknown): InvoiceLineItem[] => {
  const lines: InvoiceLineItem[] = [];
  const seen = new Set<string>();

  const pushLine = (label: string, amount: number) => {
    if (!Number.isFinite(amount) || Math.abs(amount) < 0.001) return;
    const normalizedLabel = prettifyKey(label || "Invoice Charge");
    const signature = `${normalizedLabel.toLowerCase()}::${amount.toFixed(2)}`;
    if (seen.has(signature)) return;
    seen.add(signature);
    lines.push({ label: normalizedLabel, amount });
  };

  const walk = (value: unknown, contextLabel = "Invoice Charge") => {
    const numericValue = asNumber(value);
    if (numericValue !== null) {
      pushLine(contextLabel, numericValue);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        if (entry && typeof entry === "object") {
          const amount = resolveLineAmount(entry);
          if (amount !== null) {
            pushLine(resolveLineLabel(entry, `${contextLabel} ${index + 1}`), amount);
            return;
          }
        }
        walk(entry, `${contextLabel} ${index + 1}`);
      });
      return;
    }

    if (value && typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
        const nestedLabel = prettifyKey(key);

        const nestedNumber = asNumber(nestedValue);
        if (nestedNumber !== null) {
          pushLine(nestedLabel, nestedNumber);
          return;
        }

        if (nestedValue && typeof nestedValue === "object" && !Array.isArray(nestedValue)) {
          const nestedAmount = resolveLineAmount(nestedValue);
          if (nestedAmount !== null) {
            pushLine(resolveLineLabel(nestedValue, nestedLabel), nestedAmount);
            return;
          }
        }

        walk(nestedValue, nestedLabel);
      });
    }
  };

  walk(rawItems);
  return lines;
};
