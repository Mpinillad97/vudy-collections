import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { VudyConfigurationError } from './vudy.exceptions';
import { VudyService } from './vudy.service';
import type { TestPaymentRequestDto } from './dto/test-payment-request.dto';

const REQUIRED_STRING_FIELDS = ['currencyToken', 'requestedChain', 'requestedToken'] as const;

/**
 * Integration test/demo endpoint only.
 *
 * Triggers a REAL Payment Request against whatever Vudy environment
 * VUDY_API_URL points to. There is no mock mode. Not part of the product
 * domain — no Customer/Invoice/persistence involved.
 */
@Controller('vudy/payment-requests')
export class VudyController {
  constructor(private readonly vudyService: VudyService) {}

  @Post('test')
  async test(@Body() body: TestPaymentRequestDto) {
    this.validate(body);

    const targetAddress = process.env.VUDY_TARGET_ADDRESS;
    if (!targetAddress) {
      throw new VudyConfigurationError(['VUDY_TARGET_ADDRESS']);
    }

    const data = await this.vudyService.createPaymentRequest({
      targetAddress,
      amount: body.amount,
      channelParams: {
        customId: body.customId,
        note: body.note ?? 'Vudy Collections integration test',
        currencyToken: body.currencyToken,
        requestedChain: body.requestedChain,
        requestedToken: body.requestedToken,
      },
    });

    return { success: true, data };
  }

  private validate(body: TestPaymentRequestDto): void {
    if (
      typeof body?.amount !== 'number' ||
      !Number.isFinite(body.amount) ||
      body.amount <= 0
    ) {
      throw new BadRequestException('"amount" must be a positive number.');
    }

    for (const field of REQUIRED_STRING_FIELDS) {
      const value = body?.[field];
      if (typeof value !== 'string' || value.trim() === '') {
        throw new BadRequestException(`"${field}" is required and must be a non-empty string.`);
      }
    }
  }
}
