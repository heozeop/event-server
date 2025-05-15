import { LoginDto, LoginResponseDto } from '@libs/dtos';
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const { accessToken, user } = await this.authService.login(loginDto);

    return LoginResponseDto.fromEntity(accessToken, user);
  }
}
