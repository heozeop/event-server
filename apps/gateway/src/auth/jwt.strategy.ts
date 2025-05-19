import { PinoLoggerService } from '@libs/logger';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CurrentUserData } from '../../../../packages/types/dist/auth/user.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_PUBLIC_KEY', ''),
    });
  }

  async validate(payload: any) {
    try {
      if (
        !payload.sub ||
        !Array.isArray(payload.roles) ||
        payload.roles.length === 0
      ) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return {
        id: payload.sub,
        roles: payload.roles,
      } satisfies CurrentUserData;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
