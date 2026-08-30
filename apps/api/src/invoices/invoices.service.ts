import { Injectable } from '@nestjs/common';
import type { Invoice, PaymentRequest } from '@prisma/client';
import { PaymentRequestPersistenceError } from '../payment-requests/payment-requests.exceptions';
import { PrismaService } from '../prisma/prisma.service';
import { VudyConfigurationError } from '../vudy/vudy.exceptions';
import { VudyService } from '../vudy/vudy.service';
import type { CreateInvoicePaymentRequestDto } from './dto/create-invoice-payment-request.dto';
import type { CreateInvoiceDto } from './dto/create-invoice.dto';
import {
  InvoiceCustomerNotFoundError,
  InvoiceNotFoundError,
  InvoicePaymentRequestAlreadyExistsError,
  InvoicePersistenceError,
  InvoiceQueryError,
} from './invoices.exceptions';

type InvoiceWithPaymentRequest = Invoice & { paymentRequest: PaymentRequest | null };

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vudyService: VudyService,
  ) {}

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    let customer: { id: string } | null;
    try {
      customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
        select: { id: true },
      });
    } catch {
      throw new InvoiceQueryError();
    }

    if (!customer) {
      throw new InvoiceCustomerNotFoundError(dto.customerId);
    }

    try {
      return await this.prisma.invoice.create({
        data: {
          customerId: dto.customerId,
          number: dto.number,
          amount: dto.amount,
          currency: dto.currency,
          dueDate: new Date(dto.dueDate),
        },
      });
    } catch {
      throw new InvoicePersistenceError();
    }
  }

  /**
   * Includes the associated PaymentRequest (if any) so a caller can verify
   * the Customer -> Invoice -> PaymentRequest -> Vudy flow end to end.
   */
  async findById(id: string): Promise<InvoiceWithPaymentRequest> {
    let record: InvoiceWithPaymentRequest | null;
    try {
      record = await this.prisma.invoice.findUnique({
        where: { id },
        include: { paymentRequest: true },
      });
    } catch {
      throw new InvoiceQueryError();
    }

    if (!record) {
      throw new InvoiceNotFoundError(id);
    }

    return record;
  }

  /**
   * Fixed, deterministic order (most recent first) — same rationale as
   * PaymentRequestsService/CustomersService.findAll: not user-configurable
   * sorting, just a sane default so row order is stable across calls.
   */
  async findAll(): Promise<Invoice[]> {
    try {
      return await this.prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });
    } catch {
      throw new InvoiceQueryError();
    }
  }

  /**
   * Creates a Vudy Payment Request for this Invoice, using Invoice.amount
   * and Invoice.currency as the sole source of the monetary data — no
   * second amount is ever accepted from the caller. This is a LOCAL
   * duplication guard only (a DB-level unique constraint on
   * PaymentRequest.invoiceId plus a pre-check here), not distributed
   * idempotency: it only stops this endpoint from creating a second local
   * PaymentRequest for an Invoice that already has one.
   */
  async createPaymentRequest(
    invoiceId: string,
    dto: CreateInvoicePaymentRequestDto,
  ): Promise<PaymentRequest> {
    let invoice: InvoiceWithPaymentRequest | null;
    try {
      invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { paymentRequest: true },
      });
    } catch {
      throw new InvoiceQueryError();
    }

    if (!invoice) {
      throw new InvoiceNotFoundError(invoiceId);
    }

    if (invoice.paymentRequest) {
      throw new InvoicePaymentRequestAlreadyExistsError(invoiceId, invoice.paymentRequest.id);
    }

    const targetAddress = process.env.VUDY_TARGET_ADDRESS;
    if (!targetAddress) {
      throw new VudyConfigurationError(['VUDY_TARGET_ADDRESS']);
    }

    const vudyData = await this.vudyService.createPaymentRequest({
      targetAddress,
      amount: invoice.amount.toNumber(),
      channelParams: {
        currencyToken: invoice.currency,
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
          amount: invoice.amount,
          currencyToken: invoice.currency,
          requestedChain: dto.requestedChain,
          requestedToken: dto.requestedToken,
          invoiceId: invoice.id,
        },
      });
    } catch {
      throw new PaymentRequestPersistenceError(vudyData.id);
    }
  }
}
