import { Public } from '@/common/decorators/public.decorator';
import { RewardValidationPipe } from '@/common/pipe/reward-validation.pipe';
import { EVENT_CMP } from '@libs/cmd';
import { CurrentUser } from '@libs/decorator';
import {
  CreateBadgeRewardDto,
  CreateCouponRewardDto,
  CreateEventDto,
  CreateItemRewardDto,
  CreatePointRewardDto,
  CreateRewardRequestDto,
  QueryEventDto,
  QueryRewardRequestDto,
} from '@libs/dtos';
import { Role } from '@libs/enums';
import { CurrentUserData } from '@libs/types';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
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
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Events')
@ApiBearerAuth()
@Controller()
export class EventController {
  constructor(
    @Inject('EVENT_SERVICE') private readonly eventClient: ClientProxy,
  ) {}

  @Post('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async createEvent(@Body() createEventDto: CreateEventDto) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.CREATE_EVENT }, createEventDto),
    );
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEvents(@Query() query: QueryEventDto) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.GET_EVENTS }, query),
    );
  }

  @Post('rewards/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UsePipes(RewardValidationPipe)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new reward' })
  @ApiParam({
    name: 'type',
    enum: ['point', 'item', 'coupon', 'badge'],
    description: 'Type of reward',
  })
  @ApiResponse({ status: 201, description: 'Reward successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async createReward(
    @Param('type') type: string,
    @Body()
    rewardData:
      | CreatePointRewardDto
      | CreateItemRewardDto
      | CreateCouponRewardDto
      | CreateBadgeRewardDto,
  ) {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.CREATE_REWARD },
        {
          type,
          rewardData,
        },
      ),
    );
  }

  @Get('rewards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Get all rewards' })
  @ApiResponse({ status: 200, description: 'Rewards retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getRewards(@Query() query: QueryRewardRequestDto) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.GET_REWARDS }, query),
    );
  }

  @Post('events/:eventId/request')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Request a reward for an event' })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiResponse({
    status: 201,
    description: 'Reward request successfully created',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async requestReward(
    @Param('eventId') eventId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const createRewardRequestDto: CreateRewardRequestDto = {
      eventId,
      userId: user.id,
    };

    return await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.CREATE_REWARD_REQUEST },
        createRewardRequestDto,
      ),
    );
  }

  @Get('events/requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.AUDITOR, Role.ADMIN)
  @ApiOperation({ summary: 'Get all reward requests' })
  @ApiResponse({
    status: 200,
    description: 'Reward requests retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getRewardRequests(@Query() query: QueryRewardRequestDto) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.GET_REWARD_REQUESTS }, query),
    );
  }

  @Get('test')
  @Public()
  @ApiOperation({ summary: 'Test endpoint' })
  @ApiResponse({ status: 200, description: 'Service is working properly' })
  async test() {
    return { status: 'ok', service: 'event' };
  }
}
