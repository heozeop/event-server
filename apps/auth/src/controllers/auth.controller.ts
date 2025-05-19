import { AuthService } from '@/services/auth.service';
import { AUTH_CMP } from '@libs/cmd';
import {
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  ValidateTokenDto,
} from '@libs/dtos';
import { LogExecution, PinoLoggerService } from '@libs/logger';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: PinoLoggerService,
  ) {}

  @MessagePattern({ cmd: AUTH_CMP.LOGIN })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'User login attempt',
    exitMessage: 'User login successful',
  })
  async login(@Payload() loginDto: LoginDto): Promise<LoginResponseDto> {
    const { accessToken, refreshToken, user } =
      await this.authService.login(loginDto);

    return LoginResponseDto.fromEntity(accessToken, refreshToken, user);
  }

  @MessagePattern({ cmd: AUTH_CMP.REFRESH_TOKEN })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Token refresh attempt',
    exitMessage: 'Token refresh successful',
  })
  async refreshToken(
    @Payload() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    const { accessToken } = await this.authService.refreshAccessToken(
      refreshTokenDto.refreshToken,
    );

    return RefreshTokenResponseDto.fromEntity(accessToken);
  }

  @MessagePattern({ cmd: AUTH_CMP.VALIDATE_TOKEN })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Token validation attempt',
    exitMessage: 'Token validation completed',
  })
  async validateToken(
    @Payload() validateTokenDto: ValidateTokenDto,
  ): Promise<boolean> {
    return await this.authService.validateAccessToken(
      validateTokenDto.userId,
      validateTokenDto.accessToken,
    );
  }
}
