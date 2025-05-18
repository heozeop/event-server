import { LoggerModule } from '@libs/logger';
import { MongoMemoryOrmModule } from '@libs/test';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
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
        LoggerModule.forRootAsync({
          global: true,
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            serviceName: 'auth-service',
            prettyPrint: configService.get('NODE_ENV') !== 'production',
            logLevel: configService.get('LOG_LEVEL') || 'info',
            sensitiveDataOptions: {
              enabled: true,
              maskValue: '***MASKED***',
              objectPaths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.accessToken',
                'req.body.refreshToken',
                'password',
                'token',
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
      providers: [UserService, AuthService],
    };
  }
}
