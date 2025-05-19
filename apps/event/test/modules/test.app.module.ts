import { PinoLoggerService } from '@libs/logger';
import { QueueNames } from '@libs/message-broker';
import {
  MockLoggerModule,
  MockPinoLoggerService,
  MongoMemoryOrmModule,
} from '@libs/test';
import { BullModule } from '@nestjs/bull';
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
import { EventPublisherService } from '../../src/events/event-publisher.service';
import { EventProcessor } from '../../src/processors/event.processor';
import { RewardProcessor } from '../../src/processors/reward.processor';
import { EventService } from '../../src/services/event.service';
import { RewardRequestService } from '../../src/services/reward-request.service';
import { RewardService } from '../../src/services/reward.service';
import { MockBullMQModule } from './test.bullmq.module';
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
        MockBullMQModule.register(),
        MockCacheModule.register(),
        // Register BullModule and queues for tests
        BullModule.forRoot({
          redis: {
            host: 'localhost',
            port: 6379,
          },
        }),
        BullModule.registerQueue(
          { name: QueueNames.EVENT },
          { name: QueueNames.REWARD },
          { name: QueueNames.NOTIFICATION },
        ),
      ],
      providers: [
        {
          provide: PinoLoggerService,
          useValue: new MockPinoLoggerService(),
        },
        EventService,
        RewardRequestService,
        RewardService,
        EventProcessor,
        RewardProcessor,
        EventPublisherService,
      ],
    };
  }
}
