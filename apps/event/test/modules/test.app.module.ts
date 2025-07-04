import { PinoLoggerService } from '@libs/logger';
import {
  MockLoggerModule,
  MockPinoLoggerService,
  MongoMemoryOrmModule,
} from '@libs/test';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventReward } from '../../src/entities/event-reward.entity';
import { Event } from '../../src/entities/event.entity';
import { RewardRequest } from '../../src/entities/reward-request.entity';
import {
  BadgeReward,
  CouponReward,
  ItemReward,
  PointReward,
} from '../../src/entities/reward.entity';
import { EventRepository } from '../../src/repositories';
import { EventService } from '../../src/services/event.service';
import { RewardRequestService } from '../../src/services/reward-request.service';
import { RewardService } from '../../src/services/reward.service';
import { MockCacheModule } from './test.cache.module';
@Module({})
export class TestAppModule {
  static async forTest(
    mongoMemoryOrmModule: MongoMemoryOrmModule,
  ): Promise<DynamicModule> {
    const entities = [
      Event,
      RewardRequest,
      EventReward,
      PointReward,
      ItemReward,
      CouponReward,
      BadgeReward,
    ];

    return {
      module: TestAppModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        mongoMemoryOrmModule.getMikroOrmModule(entities),
        mongoMemoryOrmModule.getMikroOrmFeatureModule(entities),
        MockLoggerModule.forRoot(),
        MockCacheModule.register(),
      ],
      providers: [
        {
          provide: PinoLoggerService,
          useValue: new MockPinoLoggerService(),
        },
        EventService,
        RewardRequestService,
        RewardService,
        EventRepository,
      ],
    };
  }
}
