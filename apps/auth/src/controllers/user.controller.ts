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
    const user = await this.userService.createUser(createUserDto);

    return UserResponseDto.fromEntity(user);
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.getUserById(id);

    return UserResponseDto.fromEntity(user);
  }

  @Put(':id/roles')
  async updateRoles(
    @Param('id') id: string,
    @Body() updateRolesDto: UpdateRolesDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateRoles(id, updateRolesDto);

    return UserResponseDto.fromEntity(user);
  }
}
