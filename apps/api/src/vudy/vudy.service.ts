import { Injectable } from '@nestjs/common';
import {
  VudyConfigurationError,
  VudyMalformedResponseError,
  VudyNetworkError,
  VudyTimeoutError,
  VudyUpstreamError,
} from './vudy.exceptions';
import type { CreatePaymentRequestInput, VudyPaymentRequestData } from './vudy.types';
import { isVudyResponse } from './vudy.types';

const REQUEST_TIMEOUT_MS = 15_000;

interface VudyConfig {
  apiUrl: string;
  apiKey: string;
  profileId: string;
  teamId: string;
}

@Injectable()
export class VudyService {
  private readConfig(): VudyConfig {
    const env = {
      VUDY_API_URL: process.env.VUDY_API_URL,
      VUDY_API_KEY: process.env.VUDY_API_KEY,
      VUDY_PROFILE_ID: process.env.VUDY_PROFILE_ID,
      VUDY_TEAM_ID: process.env.VUDY_TEAM_ID,
    };

    const missing = Object.entries(env)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new VudyConfigurationError(missing);
    }

    return {
      apiUrl: env.VUDY_API_URL as string,
      apiKey: env.VUDY_API_KEY as string,
      profileId: env.VUDY_PROFILE_ID as string,
      teamId: env.VUDY_TEAM_ID as string,
    };
  }

  async createPaymentRequest(
    input: CreatePaymentRequestInput,
  ): Promise<VudyPaymentRequestData> {
    const config = this.readConfig();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${config.apiUrl}/channel/vudy/request/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'x-profile-id': config.profileId,
          'x-team-id': config.teamId,
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new VudyTimeoutError();
      }
      throw new VudyNetworkError(
        err instanceof Error ? err.message : 'Unknown network error while contacting Vudy.',
      );
    } finally {
      clearTimeout(timeout);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new VudyMalformedResponseError();
    }

    if (!isVudyResponse(body)) {
      throw new VudyMalformedResponseError();
    }

    if (!body.success) {
      throw new VudyUpstreamError(response.status, body.error.code, body.error.message);
    }

    if (!response.ok) {
      // Defensive: an HTTP error status with a success:true envelope would
      // itself be a malformed/unexpected response from Vudy.
      throw new VudyUpstreamError(
        response.status,
        'VUDY_HTTP_ERROR',
        `Vudy responded with HTTP ${response.status}.`,
      );
    }

    return body.data;
  }
}
