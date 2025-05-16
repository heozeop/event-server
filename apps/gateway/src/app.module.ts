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
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        serviceName: 'gateway',
        logLevel: configService.get('LOG_LEVEL'),
        prettyPrint: configService.get('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule,
    EventModule,
    ClientServiceExceptionModule,
  ],
})
export class AppModule {}
