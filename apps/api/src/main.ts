import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// apps/api/src (dev, via ts-node) and apps/api/dist (prod) sit at the same
// depth below the repo root, so this resolves to the root .env either way.
loadEnv({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}

bootstrap();
