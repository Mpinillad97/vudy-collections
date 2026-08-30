import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoicesService } from './invoices.service';

/**
 * Second piece of the commercial domain (Customer -> Invoice -> Payment
 * Request). Read/write only against PostgreSQL via InvoicesService —
 * never talks to Vudy, never touches PaymentRequest.
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
