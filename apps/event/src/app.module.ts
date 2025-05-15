import { HttpExceptionsModule } from '@libs/filter';
import { MongoDriver } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BadgeReward, CouponReward, ItemReward, PointReward } from './entities';
import { EventReward } from './entities/event-reward.entity';
import { Event } from './entities/event.entity';
import { RewardRequest } from './entities/reward-request.entity';
import { EventService, RewardRequestService, RewardService } from './services';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        driver: MongoDriver,
        clientUrl: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('MONGODB_DB_NAME', 'event-db'),
        debug: configService.get<string>('NODE_ENV') !== 'production',
        autoLoadEntities: true,
        ensureIndexes: true,
        schemaGenerator: {
          disableForeignKeys: true,
          createForeignKeyConstraints: false,
        },
        discovery: {
          warnWhenNoEntities: true,
          requireEntitiesArray: false,
          alwaysAnalyseProperties: true,
          disableDynamicFileAccess: false,
        },
      }),
    }),
    MikroOrmModule.forFeature({
      entities: [
        Event,
        RewardRequest,
        EventReward,
        PointReward,
        ItemReward,
        CouponReward,
        BadgeReward,
      ],
    }),
    HttpExceptionsModule,
  ],
  providers: [EventService, RewardRequestService, RewardService],
})
export class AppModule {}
