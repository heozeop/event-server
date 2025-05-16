import { User } from '@/entities/user.entity';
import { MongoDriver } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
    MikroOrmModule.forFeature([User]),
  ],
})
export class DatabaseModule {}
