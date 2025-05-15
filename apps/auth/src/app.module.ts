import { HttpExceptionsModule } from '@libs/filter';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { User } from './entities/user.entity';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpExceptionsModule,
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mongo',
        clientUrl: configService.get<string>(
          'MONGO_URI',
          'mongodb://mongo-user:27017/user-db',
        ),
        entities: [User],
        autoLoadEntities: true,
        debug: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    MikroOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        privateKey: configService.get<string>('JWT_PRIVATE_KEY'),
        publicKey: configService.get<string>('JWT_PUBLIC_KEY'),
        signOptions: {
          expiresIn: '1h',
          algorithm: 'RS256',
        },
      }),
    }),
  ],
  controllers: [UserController, AuthController],
  providers: [UserService, AuthService],
})
export class AppModule {}
