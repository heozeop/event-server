import { ClientServiceExceptionModule } from '@libs/filter';
import { LoggerModule } from '@libs/logger';
import { MetricsModule } from '@libs/metrics';
import { PipeModule } from '@libs/pipe';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
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
    PipeModule,
    AuthModule,
    EventModule,
    MetricsModule.forRoot({
      serviceName: 'gateway',
      serviceVersion: '1.0.0',
    }),
    ClientServiceExceptionModule,
  ],
})
export class AppModule {}
