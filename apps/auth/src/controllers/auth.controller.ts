import { AuthService } from '@/services/auth.service';
import { AUTH_CMP } from '@libs/cmd';
import { LoginDto, LoginResponseDto } from '@libs/dtos';
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
    const { accessToken, user } = await this.authService.login(loginDto);

    return LoginResponseDto.fromEntity(accessToken, user);
  }
}
