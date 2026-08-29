export interface CreatePaymentRequestDto {
  amount: number;
  currencyToken: string;
  requestedChain: string;
  requestedToken: string;
  customId?: string;
  note?: string;
}
