import { LoggerModule } from '@libs/logger';
import { MongoMemoryOrmModule } from '@libs/test';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventReward } from '../src/entities/event-reward.entity';
import { Event } from '../src/entities/event.entity';
import { RewardRequest } from '../src/entities/reward-request.entity';
import {
  BadgeReward,
  CouponReward,
  ItemReward,
  PointReward,
} from '../src/entities/reward.entity';
import { EventService } from '../src/services/event.service';
import { RewardRequestService } from '../src/services/reward-request.service';
import { RewardService } from '../src/services/reward.service';

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
      ],
      providers: [EventService, RewardRequestService, RewardService],
    };
  }
}
