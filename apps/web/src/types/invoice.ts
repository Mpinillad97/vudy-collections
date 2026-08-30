import type { PaymentRequest } from './payment-request';

/**
 * Mirrors apps/api/prisma Invoice. `amount` is a string because the
 * backend serializes Prisma.Decimal fields as strings in JSON.
 */
export interface Invoice {
  id: string;
  customerId: string;
  number: string;
  amount: string;
  currency: string;
  dueDate: string;
  createdAt: string;
}

/** Shape returned by GET /invoices/:id only — GET /invoices (list) omits paymentRequest. */
export interface InvoiceWithPaymentRequest extends Invoice {
  paymentRequest: PaymentRequest | null;
}
