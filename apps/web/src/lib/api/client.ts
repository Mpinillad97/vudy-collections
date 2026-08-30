const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * The backend returns two different error shapes depending on where the
 * error originates:
 *  - NestJS validation: { statusCode, message, error }
 *  - domain errors:     { code, message, ...extra }
 * ApiError normalizes both. `status` always comes from the real HTTP
 * response, never from the body, so it's reliable even when `statusCode`
 * is absent from the payload.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly payload: unknown;

  constructor(status: number, message: string, code: string | undefined, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      'VITE_API_URL is not configured. Copy apps/web/.env.example to apps/web/.env and set it.',
    );
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const message = typeof payload.message === 'string' ? payload.message : response.statusText;
    const code = typeof payload.code === 'string' ? payload.code : undefined;
    throw new ApiError(response.status, message, code, body);
  }

  return body as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
};
