import type { ApiSuccessEnvelope } from '../../types/api';
import type { Invoice, InvoiceWithPaymentRequest } from '../../types/invoice';
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
