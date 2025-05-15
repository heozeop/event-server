import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AUTH_CMP } from '@libs/cmd';
import { CreateUserDto, LoginDto, UpdateRolesDto } from '@libs/dtos';
import { Role } from '@libs/enums';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.LOGIN }, loginDto),
    );
  }

  @Post('users')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.CREATE_USER }, createUserDto),
    );
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  async getUserById(@Param('id') id: string) {
    return await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.GET_USER_BY_ID }, { id }),
    );
  }

  @Get('users/email/:email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getUserByEmail(@Param('email') email: string) {
    return await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.GET_USER_BY_EMAIL }, { email }),
    );
  }

  @Put('users/:id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateUserRoles(
    @Param('id') id: string,
    @Body() updateRolesDto: UpdateRolesDto,
  ) {
    return await lastValueFrom(
      this.authClient.send(
        { cmd: AUTH_CMP.UPDATE_USER_ROLES },
        { id, updateRolesDto },
      ),
    );
  }
}
