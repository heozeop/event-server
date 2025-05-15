import { CreateUserDto, UpdateRolesDto, UserResponseDto } from '@libs/dtos';
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { UserService } from '../services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return await this.userService.createUser(createUserDto);
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserResponseDto> {
    return await this.userService.getUserById(id);
  }

  @Put(':id/roles')
  async updateRoles(
    @Param('id') id: string,
    @Body() updateRolesDto: UpdateRolesDto,
  ): Promise<UserResponseDto> {
    return await this.userService.updateRoles(id, updateRolesDto);
  }
}
