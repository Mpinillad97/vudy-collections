import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { CreateInvoicePaymentRequestDto } from './dto/create-invoice-payment-request.dto';
import type { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoicesService } from './invoices.service';

/**
 * Second piece of the commercial domain (Customer -> Invoice -> Payment
 * Request). Read/write against PostgreSQL via InvoicesService. Only the
 * :id/payment-request route talks to Vudy (via VudyService, reused as-is
 * from M1.1/M1.2) and touches PaymentRequest — create/findAll/findOne
 * never do.
 */
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async create(@Body() body: CreateInvoiceDto) {
    this.validate(body);
    const record = await this.invoicesService.create({
      customerId: body.customerId,
      number: body.number,
      amount: body.amount,
      currency: body.currency,
      dueDate: body.dueDate,
    });
    return { success: true, data: record };
  }

  @Get()
  async findAll() {
    const records = await this.invoicesService.findAll();
    return { success: true, data: records };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const record = await this.invoicesService.findById(id);
    return { success: true, data: record };
  }

  @Post(':id/payment-request')
  async createPaymentRequest(
    @Param('id') id: string,
    @Body() body: CreateInvoicePaymentRequestDto,
  ) {
    this.validatePaymentRequestBody(body);
    const record = await this.invoicesService.createPaymentRequest(id, {
      requestedChain: body.requestedChain,
      requestedToken: body.requestedToken,
    });
    return { success: true, data: record };
  }

  @Post(':id/payment-request/status')
  async checkPaymentRequestStatus(@Param('id') id: string) {
    const record = await this.invoicesService.checkPaymentRequestStatus(id);
    return { success: true, data: record };
  }

  private validatePaymentRequestBody(body: CreateInvoicePaymentRequestDto): void {
    if (typeof body?.requestedChain !== 'string' || body.requestedChain.trim() === '') {
      throw new BadRequestException('"requestedChain" is required and must be a non-empty string.');
    }

    if (typeof body?.requestedToken !== 'string' || body.requestedToken.trim() === '') {
      throw new BadRequestException('"requestedToken" is required and must be a non-empty string.');
    }
  }

  private validate(body: CreateInvoiceDto): void {
    if (typeof body?.customerId !== 'string' || body.customerId.trim() === '') {
      throw new BadRequestException('"customerId" is required and must be a non-empty string.');
    }

    if (typeof body?.number !== 'string' || body.number.trim() === '') {
      throw new BadRequestException('"number" is required and must be a non-empty string.');
    }

    if (
      typeof body?.amount !== 'number' ||
      !Number.isFinite(body.amount) ||
      body.amount <= 0
    ) {
      throw new BadRequestException('"amount" must be a positive number.');
    }

    if (typeof body?.currency !== 'string' || body.currency.trim() === '') {
      throw new BadRequestException('"currency" is required and must be a non-empty string.');
    }

    if (typeof body?.dueDate !== 'string' || Number.isNaN(new Date(body.dueDate).getTime())) {
      throw new BadRequestException('"dueDate" is required and must be a valid date.');
    }
  }
}
