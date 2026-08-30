import type { ApiSuccessEnvelope } from '../../types/api';
import type { PaymentRequest } from '../../types/payment-request';
import { apiClient } from './client';

export async function getPaymentRequests(): Promise<PaymentRequest[]> {
  const response = await apiClient.get<ApiSuccessEnvelope<PaymentRequest[]>>('/payment-requests');
  return response.data;
}
