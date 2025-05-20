import { CacheModule } from '@libs/cache';
import { MicroServiceExceptionModule } from '@libs/filter';
import { LoggerModule } from '@libs/logger';
import { MetricsModule } from '@libs/metrics';
import { PipeModule } from '@libs/pipe';
import { MikroORM } from '@mikro-orm/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  EventController,
  RewardController,
  RewardRequestController,
} from './controllers';
import { DatabaseModule } from './database/database.module';
import { RequestContextInterceptor } from './interceptors/request-context.interceptor';
import { EventService, RewardRequestService, RewardService } from './services';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    MicroServiceExceptionModule,
    LoggerModule.forRootAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        serviceName: 'event-service',
        prettyPrint: configService.get('NODE_ENV') !== 'production',
        logLevel: configService.get('LOG_LEVEL') || 'info',
        sensitiveDataOptions: {
          enabled: true,
          maskValue: '***MASKED***',
          objectPaths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'token',
            'password',
          ],
        },
        alloyConfig: {
          enabled: true,
          messageKey: 'msg',
          levelKey: 'level',
        },
      }),
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'redis-data'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD', undefined),
          db: configService.get('REDIS_DB', 0),
        },
        enableLogging: configService.get('NODE_ENV') !== 'production',
      }),
    }),
    PipeModule,
    MetricsModule.forRoot({
      serviceName: 'event-service',
      serviceVersion: '1.0.0',
    }),
  ],
  providers: [
    EventService,
    RewardRequestService,
    RewardService,
    {
      provide: RequestContextInterceptor,
      useFactory: (orm: MikroORM) => {
        return new RequestContextInterceptor(orm);
      },
      inject: [MikroORM],
    },
  ],
  controllers: [EventController, RewardRequestController, RewardController],
})
export class AppModule {}
