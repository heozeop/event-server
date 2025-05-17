import { ClientServiceExceptionModule } from '@libs/filter';
import { LoggerModule } from '@libs/logger';
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
        fileTransport: {
          enabled: true,
          destination: '/logs/gateway/gateway.log',
          mkdir: true,
        },
      }),
    }),
    AuthModule,
    EventModule,
    ClientServiceExceptionModule,
  ],
})
export class AppModule {}
