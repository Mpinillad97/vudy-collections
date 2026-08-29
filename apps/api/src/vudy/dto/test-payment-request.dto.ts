/**
 * Body for the integration test endpoint. `targetAddress` is deliberately
 * not accepted here — it always comes from VUDY_TARGET_ADDRESS so the test
 * endpoint can never be pointed at an arbitrary address. `amount` has no
 * default: this triggers a REAL payment request against whatever
 * VUDY_API_URL points to, so the caller must state it explicitly.
 */
export interface TestPaymentRequestDto {
  amount: number;
  currencyToken: string;
  requestedChain: string;
  requestedToken: string;
  customId?: string;
  note?: string;
}
