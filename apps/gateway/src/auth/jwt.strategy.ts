import { AUTH_CMP } from '@libs/cmd';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_PUBLIC_KEY', ''),
    });
  }

  async validate(payload: any) {
    try {
      const user = await lastValueFrom(
        this.authClient.send(
          { cmd: AUTH_CMP.GET_USER_BY_ID },
          { id: payload.sub },
        ),
      );

      if (!user) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
