import { LoginDto, LoginResponseDto } from '@libs/dtos';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;
    const user = await this.userService.validateUser(email, password);

    const payload = {
      sub: user.id.toString(),
      roles: user.roles,
      iat: new Date().getTime(),
    };

    return plainToInstance(
      LoginResponseDto,
      {
        accessToken: this.jwtService.sign(payload),
        user,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
