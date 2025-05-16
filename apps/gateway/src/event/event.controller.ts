import { RewardValidationPipe } from '@/common/pipe/reward-validation.pipe';
import { EVENT_CMP } from '@libs/cmd';
import { CurrentUser } from '@libs/decorator';
import {
  CreateEventDto,
  CreateRewardDto,
  CreateRewardRequestDto,
  QueryEventDto,
  QueryRewardRequestDto,
} from '@libs/dtos';
import { RewardType, Role } from '@libs/enums';
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
import { LogPerformance } from '../common/logging/decorators/log-performance.decorator';

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
  @LogPerformance('event-create')
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
  @LogPerformance('event')
  async getEvents(@Query() query: QueryEventDto) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.GET_EVENTS }, query),
    );
  }

  @Post('rewards/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new reward' })
  @ApiParam({
    name: 'type',
    enum: RewardType,
    description: 'Type of reward',
  })
  @ApiResponse({ status: 201, description: 'Reward successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @UsePipes(RewardValidationPipe)
  @LogPerformance('reward-create')
  async createReward(
    @Param('type') type: string,
    @Body() rewardData: CreateRewardDto,
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
  @LogPerformance('reward-list')
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
  @LogPerformance('reward-request')
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
  @LogPerformance('reward-request-list')
  async getRewardRequests(@Query() query: QueryRewardRequestDto) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.GET_REWARD_REQUESTS }, query),
    );
  }

  @Get('events/:eventId/rewards')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all rewards for an event' })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiResponse({ status: 200, description: 'Rewards retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @LogPerformance('event-rewards')
  async getRewardsForEvent(@Param('eventId') eventId: string) {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.GET_REWARDS_BY_EVENT_ID },
        { id: eventId },
      ),
    );
  }

  @Post('events/:eventId/rewards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Add a reward to an event' })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiParam({ name: 'rewardId', description: 'ID of the reward' })
  @ApiResponse({
    status: 200,
    description: 'Reward added to event successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @LogPerformance('event-add-reward')
  async addRewardToEvent(
    @Param('eventId') eventId: string,
    @Body('rewardId') rewardId: string,
  ) {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.ADD_REWARD_TO_EVENT },
        { eventId, rewardId },
      ),
    );
  }
}
