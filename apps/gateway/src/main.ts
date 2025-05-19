import { ClientServiceExceptionFilter } from '@libs/filter';
import { LogContextInterceptor, PinoLoggerService } from '@libs/logger';
import { MetricsInterceptor } from '@libs/metrics';
import { ValidationPipe } from '@libs/pipe';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create hybrid application (HTTP + Microservice)
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until logger is ready
  });

  // Get the logger service
  const logger = app.get(PinoLoggerService);
  logger.log('Starting gateway service...');

  // Configure microservice
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: process.env.GATEWAY_HOST ?? 'localhost',
      port: parseInt(process.env.GATEWAY_PORT ?? '3000', 10),
    },
  });

  // Enable cookie parsing
  app.use(cookieParser());

  // Apply Helmet middleware for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: 'same-origin' },
    }),
  );

  app.useGlobalInterceptors(
    app.get(LogContextInterceptor),
    app.get(MetricsInterceptor),
  );

  // Apply strict validation pipe globally
  app.useGlobalPipes(app.get(ValidationPipe));

  // Apply rate limiting globally using the CustomThrottlerGuard from module
  app.useGlobalFilters(app.get(ClientServiceExceptionFilter));

  // Apply compression for all responses
  app.use(
    compression({
      filter: () => true, // Apply compression to all responses
      threshold: 0, // Compress all responses regardless of size
    }),
  );

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Event Rewards API')
    .setDescription('API documentation for the Event Rewards platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Start microservices
  await app.startAllMicroservices();
  logger.log('Microservice transport initialized');

  // Start HTTP server
  const httpPort = process.env.HTTP_PORT ?? 3333;
  await app.listen(httpPort);

  logger.log(`Gateway service is running`, {
    microservicePort: process.env.GATEWAY_PORT ?? 3000,
    httpPort: httpPort,
    swaggerUrl: `http://localhost:${httpPort}/docs`,
    environment: process.env.NODE_ENV || 'development',
  });
}
bootstrap();
