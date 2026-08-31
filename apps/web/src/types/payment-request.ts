/**
 * Mirrors apps/api/prisma PaymentRequest. `amount` is a string because the
 * backend serializes Prisma.Decimal fields as strings in JSON.
 */
export interface PaymentRequest {
  id: string;
  vudyRequestId: string;
  vudyUrl: string;
  vudyEmbedUrl: string;
  targetAddress: string;
  amount: string;
  currencyToken: string;
  requestedChain: string;
  requestedToken: string;
  /** Last known Vudy lifecycle status ("pending"/"completed", verbatim). Null means never checked yet. */
  status: string | null;
  customId: string | null;
  note: string | null;
  createdAt: string;
  invoiceId: string | null;
}
