import { AuthService } from '@/services/auth.service';
import { AUTH_CMP } from '@libs/cmd';
import { LoginDto, LoginResponseDto } from '@libs/dtos';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: AUTH_CMP.LOGIN })
  async login(@Payload() loginDto: LoginDto): Promise<LoginResponseDto> {
    const { accessToken, user } = await this.authService.login(loginDto);

    return LoginResponseDto.fromEntity(accessToken, user);
  }
}
