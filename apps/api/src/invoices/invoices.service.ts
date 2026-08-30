import { Injectable } from '@nestjs/common';
import type { Invoice } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateInvoiceDto } from './dto/create-invoice.dto';
import {
  InvoiceCustomerNotFoundError,
  InvoiceNotFoundError,
  InvoicePersistenceError,
  InvoiceQueryError,
} from './invoices.exceptions';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findById(id: string): Promise<Invoice> {
    let record: Invoice | null;
    try {
      record = await this.prisma.invoice.findUnique({ where: { id } });
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
}
