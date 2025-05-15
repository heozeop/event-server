import { LoginDto, LoginResponseDto } from '@libs/dtos';
import { Injectable, UnauthorizedException } from '@nestjs/common';
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

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id.toString(),
      email: user.email,
      roles: user.roles,
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
