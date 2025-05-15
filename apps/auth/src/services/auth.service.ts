import { User } from '@/entities/user.entity';
import { LoginDto } from '@libs/dtos';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: User }> {
    const { email, password } = loginDto;
    const user = await this.userService.validateUser(email, password);

    const payload = {
      sub: user._id.toString(),
      roles: user.roles,
      iat: new Date().getTime(),
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
