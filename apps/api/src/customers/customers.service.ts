import { Injectable } from '@nestjs/common';
import type { Customer } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCustomerDto } from './dto/create-customer.dto';
import {
  CustomerNotFoundError,
  CustomerPersistenceError,
  CustomerQueryError,
} from './customers.exceptions';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    try {
      return await this.prisma.customer.create({
        data: {
          name: dto.name,
          email: dto.email,
        },
      });
    } catch {
      throw new CustomerPersistenceError();
    }
  }

  async findById(id: string): Promise<Customer> {
    let record: Customer | null;
    try {
      record = await this.prisma.customer.findUnique({ where: { id } });
    } catch {
      throw new CustomerQueryError();
    }

    if (!record) {
      throw new CustomerNotFoundError(id);
    }

    return record;
  }

  /**
   * Fixed, deterministic order (most recent first) — same rationale as
   * PaymentRequestsService.findAll: not user-configurable sorting, just a
   * sane default so row order is stable across calls.
   */
  async findAll(): Promise<Customer[]> {
    try {
      return await this.prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
    } catch {
      throw new CustomerQueryError();
    }
  }
}
