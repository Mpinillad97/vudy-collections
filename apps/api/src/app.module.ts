import { Module } from '@nestjs/common';
import { CustomersModule } from './customers/customers.module';
import { HealthController } from './health/health.controller';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentRequestsModule } from './payment-requests/payment-requests.module';
import { VudyModule } from './vudy/vudy.module';

@Module({
  imports: [VudyModule, PaymentRequestsModule, CustomersModule, InvoicesModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
