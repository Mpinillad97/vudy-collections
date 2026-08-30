import { Injectable } from '@nestjs/common';
import type { PaymentRequest } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VudyConfigurationError } from '../vudy/vudy.exceptions';
import { VudyService } from '../vudy/vudy.service';
import type { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import {
  PaymentRequestNotFoundError,
  PaymentRequestPersistenceError,
  PaymentRequestQueryError,
} from './payment-requests.exceptions';

@Injectable()
export class PaymentRequestsService {
  constructor(
    private readonly vudyService: VudyService,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreatePaymentRequestDto): Promise<PaymentRequest> {
    const targetAddress = process.env.VUDY_TARGET_ADDRESS;
    if (!targetAddress) {
      throw new VudyConfigurationError(['VUDY_TARGET_ADDRESS']);
    }

    const vudyData = await this.vudyService.createPaymentRequest({
      targetAddress,
      amount: dto.amount,
      channelParams: {
        customId: dto.customId,
        note: dto.note,
        currencyToken: dto.currencyToken,
        requestedChain: dto.requestedChain,
        requestedToken: dto.requestedToken,
      },
    });

    try {
      return await this.prisma.paymentRequest.create({
        data: {
          vudyRequestId: vudyData.id,
          vudyUrl: vudyData.url,
          vudyEmbedUrl: vudyData.embedUrl,
          targetAddress,
          amount: dto.amount,
          currencyToken: dto.currencyToken,
          requestedChain: dto.requestedChain,
          requestedToken: dto.requestedToken,
          customId: dto.customId,
          note: dto.note,
        },
      });
    } catch {
      throw new PaymentRequestPersistenceError(vudyData.id);
    }
  }

  /**
   * Reads only — never talks to Vudy. PostgreSQL is the source of truth
   * for what our backend already created and persisted.
   */
  async findById(id: string): Promise<PaymentRequest> {
    let record: PaymentRequest | null;
    try {
      record = await this.prisma.paymentRequest.findUnique({ where: { id } });
    } catch {
      throw new PaymentRequestQueryError();
    }

    if (!record) {
      throw new PaymentRequestNotFoundError(id);
    }

    return record;
  }

  /**
   * Fixed, deterministic order (most recent first) — without it, Postgres
   * gives no guarantee of a stable row order across calls. Not
   * user-configurable sorting, just a sane default for a simple list.
   */
  async findAll(): Promise<PaymentRequest[]> {
    try {
      return await this.prisma.paymentRequest.findMany({ orderBy: { createdAt: 'desc' } });
    } catch {
      throw new PaymentRequestQueryError();
    }
  }
}
