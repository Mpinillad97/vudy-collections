export interface VudyChannelParams {
  customId?: string;
  note?: string;
  currencyToken: string;
  requestedChain: string;
  requestedToken: string;
}

export interface CreatePaymentRequestInput {
  targetAddress: string;
  amount: number;
  channelParams: VudyChannelParams;
}

export interface VudyPaymentRequestData {
  id: string;
  url: string;
  embedUrl: string;
}

export interface VudySuccessResponse {
  success: true;
  data: VudyPaymentRequestData;
}

export interface VudyErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface VudyErrorResponse {
  success: false;
  error: VudyErrorPayload;
}

export type VudyResponse = VudySuccessResponse | VudyErrorResponse;

export function isVudyResponse(value: unknown): value is VudyResponse {
  if (typeof value !== 'object' || value === null || !('success' in value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.success === true) {
    return isVudyPaymentRequestData(candidate.data);
  }
  if (candidate.success === false) {
    return isVudyErrorPayload(candidate.error);
  }
  return false;
}

function isVudyPaymentRequestData(value: unknown): value is VudyPaymentRequestData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const data = value as Record<string, unknown>;
  return (
    typeof data.id === 'string' &&
    typeof data.url === 'string' &&
    typeof data.embedUrl === 'string'
  );
}

function isVudyErrorPayload(value: unknown): value is VudyErrorPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const error = value as Record<string, unknown>;
  return typeof error.code === 'string' && typeof error.message === 'string';
}
