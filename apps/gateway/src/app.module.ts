import { ClientServiceExceptionModule } from '@libs/filter';
import { LoggerModule } from '@libs/logger';
import { MetricsModule } from '@libs/metrics';
import { PipeModule } from '@libs/pipe';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { CustomThrottlerGuard } from './common';
import { EventModule } from './event/event.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRootAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        serviceName: 'gateway',
        logLevel: configService.get('LOG_LEVEL') || 'info',
        prettyPrint: configService.get('NODE_ENV') !== 'production',
        alloyConfig: {
          enabled: true,
          messageKey: 'msg',
          levelKey: 'level',
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('NODE_ENV');

        if (nodeEnv === 'test') {
          return {
            throttlers: [
              {
                ttl: 1,
                limit: 10000,
              },
            ],
          };
        }

        return {
          throttlers: [
            {
              ttl: configService.get('THROTTLE_TTL') || 60,
              limit: configService.get('THROTTLE_LIMIT') || 100,
            },
          ],
        };
      },
    }),
    PipeModule,
    AuthModule,
    EventModule,
    MetricsModule.forRoot({
      serviceName: 'gateway',
      serviceVersion: '1.0.0',
    }),
    ClientServiceExceptionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
