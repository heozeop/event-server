import { MicroServiceExceptionFilter } from '@libs/filter';
import { LogContextInterceptor, PinoLoggerService } from '@libs/logger';
import { MetricsInterceptor } from '@libs/metrics';
import { ValidationPipe } from '@libs/pipe';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { RequestContextInterceptor } from './interceptors/request-context.interceptor';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.EVENT_SERVICE_HOST ?? '0.0.0.0',
      port: process.env.EVENT_SERVICE_PORT ?? 3002,
    },
    bufferLogs: true,
  });

  const logger = app.get(PinoLoggerService);

  app.useGlobalInterceptors(
    app.get(RequestContextInterceptor),
    app.get(LogContextInterceptor),
    app.get(MetricsInterceptor),
  );

  app.useGlobalPipes(app.get(ValidationPipe));

  app.useGlobalFilters(app.get(MicroServiceExceptionFilter));

  // Apply compression for all responses
  app.use(
    compression({
      filter: () => true, // Apply compression to all responses
      threshold: 0, // Compress all responses regardless of size
    }),
  );

  await app.listen();
  logger.log('Event microservice is listening', {
    host: process.env.EVENT_SERVICE_HOST ?? '0.0.0.0',
    port: process.env.EVENT_SERVICE_PORT ?? 3002,
  });
}

bootstrap();
