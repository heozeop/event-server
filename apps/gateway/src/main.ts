import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create hybrid application (HTTP + Microservice)
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until logger is ready
  });

  // Get the logger service
  const logger = app.get(Logger);
  app.useLogger(logger);

  logger.log('Starting gateway service...');

  // Configure microservice
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: process.env.GATEWAY_HOST ?? 'localhost',
      port: parseInt(process.env.GATEWAY_PORT ?? '3000', 10),
    },
  });

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
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
