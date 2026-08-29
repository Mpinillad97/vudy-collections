import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VudyModule } from '../vudy/vudy.module';
import { PaymentRequestsController } from './payment-requests.controller';
import { PaymentRequestsService } from './payment-requests.service';

@Module({
  imports: [VudyModule, PrismaModule],
  controllers: [PaymentRequestsController],
  providers: [PaymentRequestsService],
})
export class PaymentRequestsModule {}
