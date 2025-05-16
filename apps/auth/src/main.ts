import { LogContextInterceptor, PinoLoggerService } from '@libs/logger';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import 'reflect-metadata'; // Required for decorators
import { AppModule } from './app.module';
import { RequestContextInterceptor } from './interceptors/request-context.interceptor';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.AUTH_HOST ?? 'auth',
      port: parseInt(process.env.AUTH_PORT ?? '3001', 10),
    },
    bufferLogs: true,
  });

  const logger = app.get(PinoLoggerService);
  app.useLogger(logger);

  const loggerIntercepter = app.get(LogContextInterceptor);
  const requestContextInterceptor = app.get(RequestContextInterceptor);

  app.useGlobalInterceptors(loggerIntercepter, requestContextInterceptor);

  await app.listen();
  logger.log('Auth microservice is listening');
}

bootstrap();
