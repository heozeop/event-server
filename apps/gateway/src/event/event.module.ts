import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from '../auth/auth.module';
import { EventController } from './event.controller';

@Module({
  imports: [
    AuthModule, // auth guard에서 참조 필요
    ClientsModule.registerAsync([
      {
        name: 'EVENT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('EVENT_SERVICE_HOST', 'event'),
            port: configService.get<number>('EVENT_SERVICE_PORT', 3002),
          },
        }),
      },
    ]),
  ],
  controllers: [EventController],
  exports: [ClientsModule],
})
export class EventModule {}
