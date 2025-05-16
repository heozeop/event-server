import { UserService } from '@/services/user.service';
import { AUTH_CMP } from '@libs/cmd';
import {
  CreateUserDto,
  QueryByIdDto,
  QueryUserByEmailDto,
  UpdateRolesDto,
  UserResponseDto,
} from '@libs/dtos';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: AUTH_CMP.CREATE_USER })
  async createUser(
    @Payload() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.createUser(createUserDto);

    return UserResponseDto.fromEntity(user);
  }

  @MessagePattern({ cmd: AUTH_CMP.GET_USER_BY_ID })
  async getUserById(
    @Payload() queryById: QueryByIdDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.getUserById(queryById);

    return UserResponseDto.fromEntity(user);
  }

  @MessagePattern({ cmd: AUTH_CMP.GET_USER_BY_EMAIL })
  async getUserByEmail(
    @Payload() queryByEmail: QueryUserByEmailDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.getUserByEmail(queryByEmail);

    return UserResponseDto.fromEntity(user);
  }

  @MessagePattern({ cmd: AUTH_CMP.UPDATE_USER_ROLES })
  async updateUserRoles(
    @Payload()
    { id, updateRolesDto }: { id: string; updateRolesDto: UpdateRolesDto },
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateRoles({
      id,
      updateRolesDto,
    });

    return UserResponseDto.fromEntity(user);
  }
}
