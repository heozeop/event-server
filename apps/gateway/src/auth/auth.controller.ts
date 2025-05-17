import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AUTH_CMP } from '@libs/cmd';
import {
  CreateUserDto,
  LoginDto,
  LoginResponseDto,
  UpdateRolesDto,
} from '@libs/dtos';
import { Role } from '@libs/enums';
import { LogExecution, PinoLoggerService } from '@libs/logger';
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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
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
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'User login attempt',
    exitMessage: 'User login successful',
  })
  async login(@Body() loginDto: LoginDto) {
    return await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.LOGIN }, loginDto),
    );
  }

  @Post('users')
  @Public()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 409, description: 'Conflict - user already exists' })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Creating user',
    exitMessage: 'User created',
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.CREATE_USER }, createUserDto),
    );
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
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
  async getUserById(@Param('id') id: string) {
    console.log('getUserById', id);
    return await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.GET_USER_BY_ID }, { id }),
    );
  }

  @Get('users/email/:email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user by email' })
  @ApiParam({ name: 'email', description: 'User email' })
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
  async getUserByEmail(@Param('email') email: string) {
    return await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.GET_USER_BY_EMAIL }, { email }),
    );
  }

  @Put('users/:id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user roles' })
  @ApiParam({ name: 'id', description: 'User ID' })
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
  ) {
    return await lastValueFrom(
      this.authClient.send(
        { cmd: AUTH_CMP.UPDATE_USER_ROLES },
        { id, updateRolesDto },
      ),
    );
  }

  @Get('test')
  @Public()
  @ApiOperation({ summary: 'Test endpoint' })
  @ApiResponse({ status: 200, description: 'Service is working properly' })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Testing endpoint',
    exitMessage: 'Endpoint tested',
  })
  async test() {
    return { status: 'ok', service: 'auth' };
  }
}
