import { UserToken } from '@/entities/user-token.entity';
import { User } from '@/entities/user.entity';
import { MongoDriver } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        driver: MongoDriver,
        clientUrl: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('MONGODB_DB_NAME', 'user-db'),
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
    MikroOrmModule.forFeature([User, UserToken]),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<string>(
          'REDIS_HOST',
          'redis-secure',
        );
        const redisPort = configService.get<number>('REDIS_PORT', 6379);

        return new Redis({
          host: redisHost,
          port: redisPort,
          lazyConnect: true,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [MikroOrmModule, REDIS_CLIENT],
})
export class DatabaseModule {}
