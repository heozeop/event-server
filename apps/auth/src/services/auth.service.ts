import { User } from '@/entities/user.entity';
import { LoginDto } from '@libs/dtos';
import { LogExecution, PinoLoggerService } from '@libs/logger';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLoggerService,
  ) {}

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: User }> {
    // Add client IP to context if available

    // Authenticate user
    const user = await this.userService.validateUser(loginDto);

    // Generate token
    const payload = {
      sub: user._id.toString(),
      roles: user.roles,
      iat: new Date().getTime(),
    };

    const accessToken = this.jwtService.sign(payload);

    // Log additional information about successful login
    this.logger.log('Login details', {
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
      tokenExpiration: new Date(
        payload.iat +
          (Number(process.env.JWT_EXPIRES_IN_SECONDS) || 3600) * 1000,
      ),
    });

    return {
      accessToken,
      user,
    };
  }

  @LogExecution({
    entryLevel: 'debug',
    exitLevel: 'debug',
    entryMessage: 'Token verification attempt',
    exitMessage: 'Token verified successfully',
    logResult: false,
  })
  async verifyToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);

      // Add user details to log
      this.logger.debug('Token verification details', {
        tokenId: payload.sub,
        roles: payload.roles,
      });

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
