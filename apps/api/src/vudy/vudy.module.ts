import { Module } from '@nestjs/common';
import { VudyController } from './vudy.controller';
import { VudyService } from './vudy.service';

@Module({
  controllers: [VudyController],
  providers: [VudyService],
  exports: [VudyService],
})
export class VudyModule {}
