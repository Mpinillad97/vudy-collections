import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomersService } from './customers.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * First piece of the commercial domain (Customer -> Invoice -> Payment
 * Request). Read/write only against PostgreSQL via CustomersService —
 * never talks to Vudy.
 */
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  async create(@Body() body: CreateCustomerDto) {
    this.validate(body);
    const record = await this.customersService.create({
      name: body.name,
      email: body.email,
    });
    return { success: true, data: record };
  }

  @Get()
  async findAll() {
    const records = await this.customersService.findAll();
    return { success: true, data: records };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const record = await this.customersService.findById(id);
    return { success: true, data: record };
  }

  private validate(body: CreateCustomerDto): void {
    if (typeof body?.name !== 'string' || body.name.trim() === '') {
      throw new BadRequestException('"name" is required and must be a non-empty string.');
    }

    if (typeof body?.email !== 'string' || !EMAIL_PATTERN.test(body.email)) {
      throw new BadRequestException('"email" is required and must be a valid email address.');
    }
  }
}
