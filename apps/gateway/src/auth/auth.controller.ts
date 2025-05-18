import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AUTH_CMP } from '@libs/cmd';
import { CurrentUser } from '@libs/decorator';
import {
  CreateUserDto,
  LoginDto,
  LoginResponseDto,
  QueryUserByEmailDto,
  UpdateRolesDto,
  UserResponseDto,
} from '@libs/dtos';
import { Role } from '@libs/enums';
import { LogExecution, PinoLoggerService } from '@libs/logger';
import { CurrentUserData } from '@libs/types';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { lastValueFrom } from 'rxjs';

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private readonly logger: PinoLoggerService,
  ) {}

  @Post('login')
  @Public()
  @ApiOperation({
    summary: 'User login',
    description: 'User login',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'User login attempt',
    exitMessage: 'User login successful',
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.LOGIN }, loginDto),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting current user',
    exitMessage: 'User found',
  })
  async getMe(@CurrentUser() user: CurrentUserData): Promise<UserResponseDto> {
    return await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.GET_USER_BY_ID }, { id: user.id }),
    );
  }

  @Post('users')
  @Public()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 409, description: 'Conflict - user already exists' })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Creating user',
    exitMessage: 'User created',
  })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.CREATE_USER }, createUserDto),
    );
  }

  @Get('users/email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user by email' })
  @ApiQuery({ type: QueryUserByEmailDto })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting user by email',
    exitMessage: 'User found',
  })
  async getUserByEmail(
    @Query() queryUserByEmailDto: QueryUserByEmailDto,
  ): Promise<UserResponseDto> {
    console.log('queryUserByEmailDto', queryUserByEmailDto);
    return await lastValueFrom(
      this.authClient.send(
        { cmd: AUTH_CMP.GET_USER_BY_EMAIL },
        queryUserByEmailDto,
      ),
    );
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting user by ID',
    exitMessage: 'User found',
  })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    return await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.GET_USER_BY_ID }, { id }),
    );
  }

  @Put('users/:id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user roles' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateRolesDto })
  @ApiResponse({ status: 200, description: 'Roles updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Updating user roles',
    exitMessage: 'User roles updated',
  })
  async updateUserRoles(
    @Param('id') id: string,
    @Body() updateRolesDto: UpdateRolesDto,
  ): Promise<UserResponseDto> {
    return await lastValueFrom(
      this.authClient.send(
        { cmd: AUTH_CMP.UPDATE_USER_ROLES },
        { id, updateRolesDto },
      ),
    );
  }
}
