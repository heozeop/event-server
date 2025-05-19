import { REDIS_CLIENT } from '@/database/database.module';
import { User } from '@/entities/user.entity';
import { LoginDto } from '@libs/dtos';
import { TokenStatus } from '@libs/enums';
import { LogExecution, PinoLoggerService } from '@libs/logger';
import { MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { UserToken } from '../entities/user-token.entity';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLoggerService,
    private readonly orm: MikroORM,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    // Add client IP to context if available

    // Authenticate user
    const user = await this.userService.validateUser(loginDto);

    // Generate token
    const payload = {
      sub: user.id.toString(),
      roles: user.roles,
      iat: new Date().getTime(),
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = uuidv4();

    // Store refresh token in database
    await this.storeRefreshToken(user.id, refreshToken);

    // Store access token in Redis
    await this.storeAccessToken(user.id, accessToken);

    // Log additional information about successful login
    this.logger.log('Login details', {
      userId: user.id.toString(),
      email: user.email,
      roles: user.roles,
      tokenExpiration: new Date(
        payload.iat +
          (Number(process.env.JWT_EXPIRES_IN_SECONDS) || 3600) * 1000,
      ),
    });

    return {
      accessToken,
      refreshToken,
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

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const em = this.orm.em.fork();

    // Revoke any existing tokens for this user
    await this.revokeToken(userId);

    // Create a new token
    const userToken = em.create(UserToken, {
      userId: new ObjectId(userId),
      refreshToken,
      status: TokenStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date(),
      revokedAt: null,
    });

    await em.persistAndFlush(userToken);
  }

  private async storeAccessToken(
    userId: string,
    accessToken: string,
  ): Promise<void> {
    const key = `access_token:${userId}`;
    const tokenData = JSON.stringify({
      token: accessToken,
      createdAt: Date.now(),
    });

    await this.redis.set(key, tokenData);
    await this.redis.expire(
      key,
      Number(process.env.JWT_EXPIRES_IN_SECONDS) || 3600,
    );
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const em = this.orm.em.fork();

    // Find the token in database
    const userToken = await em.findOne(UserToken, {
      refreshToken,
      status: TokenStatus.ACTIVE,
    });

    if (!userToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (userToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Find the user
    const userId = userToken.userId.toString();
    const user = await this.userService.getUserById({ id: userId });

    // Generate new access token
    const payload = {
      sub: user.id.toString(),
      roles: user.roles,
      iat: new Date().getTime(),
    };

    const accessToken = this.jwtService.sign(payload);

    // Store new access token
    await this.storeAccessToken(user.id, accessToken);

    return {
      accessToken,
    };
  }

  async revokeToken(userId: string): Promise<void> {
    const em = this.orm.em.fork();

    // Find active tokens for the user
    const userTokens = await em.find(UserToken, {
      userId: new ObjectId(userId),
      status: TokenStatus.ACTIVE,
    });

    for (const token of userTokens) {
      token.status = TokenStatus.REVOKED;
      token.revokedAt = new Date();
    }

    await em.flush();
  }

  async logout(userId: string): Promise<void> {
    // Revoke refresh token
    await this.revokeToken(userId);

    // Remove access token from Redis
    const key = `access_token:${userId}`;
    await this.redis.del(key);
  }

  async validateAccessToken(
    userId: string,
    accessToken: string,
  ): Promise<boolean> {
    try {
      // Check if token is in Redis
      const key = `access_token:${userId}`;
      const tokenData = await this.redis.get(key);

      if (!tokenData) {
        return false;
      }

      const { token } = JSON.parse(tokenData);

      // Check if token matches
      if (token !== accessToken) {
        return false;
      }

      // Verify token
      this.jwtService.verify(accessToken);

      return true;
    } catch (error) {
      return false;
    }
  }
}
