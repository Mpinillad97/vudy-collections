/** Envelope used by every successful response from the Collections API. */
export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
}
