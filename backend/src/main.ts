import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { REQUEST_ID_HEADER } from './common/logging/logger.config.js';
import type { EnvironmentVariables } from './config/env.validation.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const config = app.get(ConfigService<EnvironmentVariables, true>);

  app.use(helmet());
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }).split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', REQUEST_ID_HEADER],
    exposedHeaders: [REQUEST_ID_HEADER],
  });
  app.enableShutdownHooks();

  await app.listen(config.get('PORT', { infer: true }));
}

await bootstrap();
