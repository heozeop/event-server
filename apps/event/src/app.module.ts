import { MicroServiceExceptionModule } from '@libs/filter';
import { LoggerModule } from '@libs/logger';
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
import { PipeModule } from '@libs/pipe';
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
    PipeModule
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
