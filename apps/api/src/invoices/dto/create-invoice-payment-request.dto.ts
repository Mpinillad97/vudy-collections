/**
 * Body for POST /invoices/:id/payment-request. Deliberately does NOT
 * accept `amount` (Invoice.amount is the source of truth) or
 * `targetAddress` (sourced from VUDY_TARGET_ADDRESS, never the client).
 * `requestedChain`/`requestedToken` have no natural source on Invoice, so
 * the caller must state them explicitly, same as the existing
 * POST /payment-requests endpoint.
 */
export interface CreateInvoicePaymentRequestDto {
  requestedChain: string;
  requestedToken: string;
}
