import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { VudyModule } from './vudy/vudy.module';

@Module({
  imports: [VudyModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
