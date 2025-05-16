import { MikroORM } from '@mikro-orm/core';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { RequestContextInterceptor } from './interceptors/request-context.interceptor';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.AUTH_HOST ?? 'auth',
      port: parseInt(process.env.AUTH_PORT ?? '3001', 10),
    },
  });

  const orm = app.get(MikroORM);

  app.useGlobalInterceptors(new RequestContextInterceptor(orm));

  await app.listen();
}

bootstrap();
