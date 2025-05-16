import { MicroServiceExceptionModule } from '@libs/filter';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
  ],
  providers: [
    EventService,
    RewardRequestService,
    RewardService,
    RequestContextInterceptor,
  ],
  controllers: [EventController, RewardRequestController, RewardController],
})
export class AppModule {}
