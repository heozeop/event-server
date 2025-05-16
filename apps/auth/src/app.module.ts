import { MicroServiceExceptionModule } from '@libs/filter';
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        privateKey: configService.get<string>('JWT_PRIVATE_KEY'),
        publicKey: configService.get<string>('JWT_PUBLIC_KEY'),
        signOptions: {
          expiresIn: configService.get<number>('JWT_EXPIRES_IN_SECONDS', 3600),
          algorithm: 'RS256',
        },
      }),
    }),
    DatabaseModule,
    MicroServiceExceptionModule,
  ],
  controllers: [UserController, AuthController],
  providers: [UserService, AuthService, RequestContextInterceptor],
})
export class AppModule {}
