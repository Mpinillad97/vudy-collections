import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Required env vars are missing. Never includes values, only var names.
 */
export class VudyConfigurationError extends HttpException {
  constructor(missingVars: string[]) {
    super(
      {
        code: 'VUDY_NOT_CONFIGURED',
        message: `Vudy integration is not configured. Missing environment variables: ${missingVars.join(', ')}`,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Vudy responded (any status) but the request could not be fulfilled:
 * either a non-2xx HTTP status or a `{ success: false }` envelope.
 * Reported as 502 since the failure originates from the upstream provider.
 */
export class VudyUpstreamError extends HttpException {
  constructor(vudyStatus: number, code: string, message: string) {
    super(
      {
        code,
        message,
        vudyStatus,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

export class VudyTimeoutError extends HttpException {
  constructor() {
    super(
      {
        code: 'VUDY_TIMEOUT',
        message: 'Timed out waiting for the Vudy API to respond.',
      },
      HttpStatus.GATEWAY_TIMEOUT,
    );
  }
}

export class VudyNetworkError extends HttpException {
  constructor(message: string) {
    super(
      {
        code: 'VUDY_NETWORK_ERROR',
        message,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

export class VudyMalformedResponseError extends HttpException {
  constructor() {
    super(
      {
        code: 'VUDY_MALFORMED_RESPONSE',
        message: 'Vudy API returned a response that did not match the documented envelope.',
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}
