export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Formats a numeric amount only — never appends a currency symbol or code.
 * `currency` on Invoice/PaymentRequest is a free-form string (not a
 * validated ISO code), so no currency-specific formatting is assumed here.
 */
export function formatAmount(amount: string): string {
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) {
    return amount;
  }
  return numeric.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
