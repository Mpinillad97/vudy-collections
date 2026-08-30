import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VudyModule } from '../vudy/vudy.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [PrismaModule, VudyModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
