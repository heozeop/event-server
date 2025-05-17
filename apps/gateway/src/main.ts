import { LogContextInterceptor, PinoLoggerService } from '@libs/logger';
import { ValidationPipe } from '@libs/pipe';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create hybrid application (HTTP + Microservice)
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until logger is ready
  });

  // Get the logger service
  const loggerMiddleware = app.get(LogContextInterceptor);
  app.useGlobalInterceptors(loggerMiddleware);

  const logger = app.get(PinoLoggerService);
  logger.log('Starting gateway service...');

  // Log some additional context information for Alloy testing
  logger.log('Logger configured for Alloy integration', {
    serviceId: 'gateway',
    requestId: 'test-request-id',
    userId: 'test-user-id',
    path: '/test-path',
    method: 'GET',
    clientIp: '127.0.0.1',
    userAgent: 'test-user-agent',
  });

  // Configure microservice
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: process.env.GATEWAY_HOST ?? 'localhost',
      port: parseInt(process.env.GATEWAY_PORT ?? '3000', 10),
    },
  });

  // Use the validation pipe from the pipe package
  app.useGlobalPipes(app.get(ValidationPipe));

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
