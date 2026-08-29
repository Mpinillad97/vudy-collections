import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import type { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { PaymentRequestsService } from './payment-requests.service';

const REQUIRED_STRING_FIELDS = ['currencyToken', 'requestedChain', 'requestedToken'] as const;

/**
 * Product-facing Payment Request creation. Distinct from the experimental
 * /vudy/payment-requests/test endpoint, which stays integration-test-only.
 */
@Controller('payment-requests')
export class PaymentRequestsController {
  constructor(private readonly paymentRequestsService: PaymentRequestsService) {}

  @Post()
  async create(@Body() body: CreatePaymentRequestDto) {
    this.validate(body);
    const record = await this.paymentRequestsService.create(body);
    return { success: true, data: record };
  }

  private validate(body: CreatePaymentRequestDto): void {
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
