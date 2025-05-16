import { ClientServiceExceptionModule } from '@libs/filter';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { LoggingModule } from './common/logging';
import { EventModule } from './event/event.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggingModule,
    AuthModule,
    EventModule,
    ClientServiceExceptionModule,
  ],
})
export class AppModule {}
