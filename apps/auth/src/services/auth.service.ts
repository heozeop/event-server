import { AUTH_CMP } from '@libs/cmd';
import { LoginDto, UserResponseDto } from '@libs/dtos';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagePattern } from '@nestjs/microservices';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @MessagePattern({ cmd: AUTH_CMP.LOGIN })
  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: UserResponseDto }> {
    const { email, password } = loginDto;
    const user = await this.userService.validateUser(email, password);

    const payload = {
      sub: user.id,
      roles: user.roles,
      iat: new Date().getTime(),
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
