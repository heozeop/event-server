import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.EVENT_SERVICE_HOST ?? '0.0.0.0',
      port: process.env.EVENT_SERVICE_PORT ?? 3002,
    },
  });

  await app.listen();
  console.log(
    `Event service is running on port ${process.env.EVENT_SERVICE_PORT ?? 3002}`,
  );
}

bootstrap();
