import { UserService } from '@/services/user.service';
import { AUTH_CMP } from '@libs/cmd';
import {
  CreateUserDto,
  QueryByIdDto,
  QueryUserByEmailDto,
  UpdateRolesDto,
  UserResponseDto,
} from '@libs/dtos';
import { LogExecution, PinoLoggerService } from '@libs/logger';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: PinoLoggerService,
  ) {}

  @MessagePattern({ cmd: AUTH_CMP.CREATE_USER })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Creating user',
    exitMessage: 'User created',
  })
  async createUser(
    @Payload() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.createUser(createUserDto);

    return UserResponseDto.fromEntity(user);
  }

  @MessagePattern({ cmd: AUTH_CMP.GET_USER_BY_ID })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting user by ID',
    exitMessage: 'User retrieved',
  })
  async getUserById(
    @Payload() queryById: QueryByIdDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.getUserById(queryById);

    return UserResponseDto.fromEntity(user);
  }

  @MessagePattern({ cmd: AUTH_CMP.GET_USER_BY_EMAIL })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting user by email',
    exitMessage: 'User retrieved',
  })
  async getUserByEmail(
    @Payload() queryByEmail: QueryUserByEmailDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.getUserByEmail(queryByEmail);

    return UserResponseDto.fromEntity(user);
  }

  @MessagePattern({ cmd: AUTH_CMP.UPDATE_USER_ROLES })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Updating user roles',
    exitMessage: 'User roles updated',
  })
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
