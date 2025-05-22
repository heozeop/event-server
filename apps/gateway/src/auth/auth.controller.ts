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
  RefreshTokenDto,
  RefreshTokenResponseDto,
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
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UnauthorizedException,
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
import { Request, Response } from 'express';
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
    description: 'User login with refresh token in HTTP-only cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
  @HttpCode(200)
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'User login attempt',
    exitMessage: 'User login successful',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<LoginResponseDto, 'refreshToken'>> {
    const response = await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.LOGIN }, loginDto),
    );

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', response.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Return response without refresh token
    const { refreshToken, ...responseWithoutRefreshToken } = response;
    return responseWithoutRefreshToken;
  }

  @Post('refresh')
  @Public()
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Refresh access token using refresh token from HTTP-only cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refresh successful',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Token refresh attempt',
    exitMessage: 'Token refresh successful',
  })
  async refreshToken(@Req() req: Request): Promise<RefreshTokenResponseDto> {
    const refreshToken =
      req.cookies?.refreshToken ??
      req.headers?.cookie
        ?.split(';')
        .find((c) => c.trim().startsWith('refreshToken='))
        ?.split('=')[1];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    return await lastValueFrom(
      this.authClient.send({ cmd: AUTH_CMP.REFRESH_TOKEN }, {
        refreshToken,
      } satisfies RefreshTokenDto),
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
    try {
      return await lastValueFrom(
        this.authClient.send({ cmd: AUTH_CMP.GET_USER_BY_ID }, { id }),
      );
    } catch (error) {
      this.logger.log('error', error as any);
      throw error;
    }
  }

  @Patch('users/:id/roles')
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

  // Adding PUT method to support the tests that use PUT
  @Put('users/:id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user roles (alternative PUT method)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateRolesDto })
  @ApiResponse({ status: 200, description: 'Roles updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
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
