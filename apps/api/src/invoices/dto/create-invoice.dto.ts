export interface CreateInvoiceDto {
  customerId: string;
  number: string;
  amount: number;
  currency: string;
  dueDate: string;
}
