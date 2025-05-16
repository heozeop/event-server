import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create hybrid application (HTTP + Microservice)
  const app = await NestFactory.create(AppModule);

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

  // Start HTTP server
  await app.listen(process.env.HTTP_PORT ?? 3333);

  console.log(
    `Gateway service is running:
    - Microservice on port ${process.env.GATEWAY_PORT ?? 3000}
    - HTTP on port ${process.env.HTTP_PORT ?? 3333}
    - Swagger available at http://localhost:${process.env.HTTP_PORT ?? 3333}/docs`,
  );
}
bootstrap();
