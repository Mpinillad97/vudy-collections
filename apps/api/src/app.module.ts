import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { PaymentRequestsModule } from './payment-requests/payment-requests.module';
import { VudyModule } from './vudy/vudy.module';

@Module({
  imports: [VudyModule, PaymentRequestsModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
