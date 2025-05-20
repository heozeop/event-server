import { MicroServiceExceptionModule } from '@libs/filter';
import { LoggerModule } from '@libs/logger';
import { MetricsModule } from '@libs/metrics';
import { PipeModule } from '@libs/pipe';
import { MikroORM } from '@mikro-orm/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { DatabaseModule } from './database/database.module';
import { RequestContextInterceptor } from './interceptors/request-context.interceptor';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        privateKey: configService.get<string>('JWT_PRIVATE_KEY'),
        publicKey: configService.get<string>('JWT_PUBLIC_KEY'),
        signOptions: {
          expiresIn: configService.get<number>('JWT_EXPIRES_IN_SECONDS', 600),
          algorithm: 'RS256',
        },
      }),
    }),
    DatabaseModule,
    PipeModule,
    MicroServiceExceptionModule,
    MetricsModule.forRoot({
      serviceName: 'auth-service',
      serviceVersion: '1.0.0',
    }),
  ],
  controllers: [UserController, AuthController],
  providers: [
    UserService,
    AuthService,
    {
      provide: RequestContextInterceptor,
      useFactory: (orm: MikroORM) => {
        return new RequestContextInterceptor(orm);
      },
      inject: [MikroORM],
    },
  ],
})
export class AppModule {}
