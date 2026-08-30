import type { ApiSuccessEnvelope } from '../../types/api';
import type { Invoice, InvoiceWithPaymentRequest } from '../../types/invoice';
import type { PaymentRequest } from '../../types/payment-request';
import { apiClient } from './client';

export async function getInvoices(): Promise<Invoice[]> {
  const response = await apiClient.get<ApiSuccessEnvelope<Invoice[]>>('/invoices');
  return response.data;
}

export async function getInvoice(id: string): Promise<InvoiceWithPaymentRequest> {
  const response = await apiClient.get<ApiSuccessEnvelope<InvoiceWithPaymentRequest>>(
    `/invoices/${encodeURIComponent(id)}`,
  );
  return response.data;
}

export interface CreateInvoiceInput {
  customerId: string;
  number: string;
  amount: number;
  currency: string;
  dueDate: string;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const response = await apiClient.post<ApiSuccessEnvelope<Invoice>>('/invoices', input);
  return response.data;
}

/**
 * requestedChain/requestedToken are the only fields the backend's real DTO
 * accepts here — amount/currency/targetAddress are deliberately not part
 * of this contract, since the backend derives them from the Invoice and
 * from VUDY_TARGET_ADDRESS. See apps/api/src/invoices/dto/create-invoice-payment-request.dto.ts.
 */
export interface CreateInvoicePaymentRequestInput {
  requestedChain: string;
  requestedToken: string;
}

export async function createInvoicePaymentRequest(
  invoiceId: string,
  input: CreateInvoicePaymentRequestInput,
): Promise<PaymentRequest> {
  const response = await apiClient.post<ApiSuccessEnvelope<PaymentRequest>>(
    `/invoices/${encodeURIComponent(invoiceId)}/payment-request`,
    input,
  );
  return response.data;
}
