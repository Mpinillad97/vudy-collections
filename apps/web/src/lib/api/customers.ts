import type { ApiSuccessEnvelope } from '../../types/api';
import type { Customer } from '../../types/customer';
import { apiClient } from './client';

export async function getCustomers(): Promise<Customer[]> {
  const response = await apiClient.get<ApiSuccessEnvelope<Customer[]>>('/customers');
  return response.data;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const response = await apiClient.post<ApiSuccessEnvelope<Customer>>('/customers', input);
  return response.data;
}
