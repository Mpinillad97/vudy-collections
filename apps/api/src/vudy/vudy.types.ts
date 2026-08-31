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

/**
 * Shape of GET /channel/vudy/request/{id} — verified via a real read-only
 * call against production Vudy. Distinct from VudyPaymentRequestData (the
 * creation response): the status lives at data.detail.status, not at the
 * top level, so isVudyPaymentRequestData cannot be reused here.
 */
export interface VudyPaymentRequestStatus {
  status: string;
  txHash: string | null;
}

export interface VudyStatusSuccessResponse {
  success: true;
  data: {
    detail: VudyPaymentRequestStatus;
  };
}

export type VudyStatusResponse = VudyStatusSuccessResponse | VudyErrorResponse;

export function isVudyStatusResponse(value: unknown): value is VudyStatusResponse {
  if (typeof value !== 'object' || value === null || !('success' in value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.success === true) {
    return isVudyStatusData(candidate.data);
  }
  if (candidate.success === false) {
    return isVudyErrorPayload(candidate.error);
  }
  return false;
}

function isVudyStatusData(value: unknown): value is { detail: VudyPaymentRequestStatus } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const data = value as Record<string, unknown>;
  if (typeof data.detail !== 'object' || data.detail === null) {
    return false;
  }
  const detail = data.detail as Record<string, unknown>;
  return typeof detail.status === 'string' && (detail.txHash === null || typeof detail.txHash === 'string');
}
