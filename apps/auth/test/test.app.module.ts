import { HttpExceptionsModule } from '@libs/filter';
import { MongoMemoryOrmModule } from '@libs/test';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '../src/controllers/auth.controller';
import { UserController } from '../src/controllers/user.controller';
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
        HttpExceptionsModule,
        mongoMemoryOrmModule.getMikroOrmModule([User]),
        mongoMemoryOrmModule.getMikroOrmFeatureModule([User]),
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
      ],
      controllers: [UserController, AuthController],
      providers: [UserService, AuthService],
    };
  }
}
