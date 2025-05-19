import { PinoLoggerService } from '@libs/logger';
import {
  MockLoggerModule,
  MockPinoLoggerService,
  MongoMemoryOrmModule,
} from '@libs/test';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import Redis from 'ioredis-mock';
import { REDIS_CLIENT } from '../src/database/database.module';
import { UserToken } from '../src/entities/user-token.entity';
import { User } from '../src/entities/user.entity';
import { AuthService } from '../src/services/auth.service';
import { UserService } from '../src/services/user.service';

@Module({})
export class TestAppModule {
  static async forTest(
    mongoMemoryOrmModule: MongoMemoryOrmModule,
  ): Promise<DynamicModule> {
    return {
      module: TestAppModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        mongoMemoryOrmModule.getMikroOrmModule([User, UserToken]),
        mongoMemoryOrmModule.getMikroOrmFeatureModule([User, UserToken]),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            privateKey: configService.get<string>('JWT_PRIVATE_KEY', 'test'),
            publicKey: configService.get<string>('JWT_PUBLIC_KEY', 'test'),
            signOptions: {
              expiresIn: '1h',
              algorithm: 'RS256',
            },
          }),
        }),
        MockLoggerModule.forRoot(),
      ],
      providers: [
        {
          provide: PinoLoggerService,
          useValue: new MockPinoLoggerService(),
        },
        {
          provide: REDIS_CLIENT,
          useFactory: () => {
            return new Redis();
          },
        },
        UserService,
        AuthService,
      ],
    };
  }
}
