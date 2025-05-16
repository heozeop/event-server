import { MikroORM } from '@mikro-orm/core';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { RequestContextInterceptor } from './interceptors/request-context.interceptor';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.EVENT_SERVICE_HOST ?? '0.0.0.0',
      port: process.env.EVENT_SERVICE_PORT ?? 3002,
    },
  });

  const orm = app.get(MikroORM);

  app.useGlobalInterceptors(new RequestContextInterceptor(orm));

  await app.listen();
}

bootstrap();
