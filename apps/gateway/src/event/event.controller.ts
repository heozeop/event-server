import { RewardValidationPipe } from '@/common/pipe/reward-validation.pipe';
import { EVENT_CMP } from '@libs/cmd';
import { CurrentUser } from '@libs/decorator';
import {
  CreateEventDto,
  CreateRewardDto,
  CreateRewardRequestDto,
  EventResponseDto,
  QueryByIdDto,
  QueryEventDto,
  QueryRewardRequestDto,
  RewardRequestResponseDto,
  RewardResponseDto,
  UpdateEventDto,
  UpdateRewardRequestStatusDto,
} from '@libs/dtos';
import { RewardRequestStatus, RewardType, Role } from '@libs/enums';
import { LogExecution, PinoLoggerService } from '@libs/logger';
import {
  CursorPaginationResponseDto,
  PaginationResponseDto,
} from '@libs/pagination';
import { CurrentUserData } from '@libs/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
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
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Events')
@ApiBearerAuth()
@Controller()
export class EventController {
  constructor(
    @Inject('EVENT_SERVICE') private readonly eventClient: ClientProxy,
    private readonly logger: PinoLoggerService,
  ) {}

  @Post('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ status: 201, description: 'Event successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Creating event',
    exitMessage: 'Event created',
  })
  async createEvent(
    @Body() createEventDto: CreateEventDto,
  ): Promise<EventResponseDto> {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.CREATE_EVENT }, createEventDto),
    );
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all events' })
  @ApiQuery({ type: QueryEventDto })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting events',
    exitMessage: 'Events retrieved',
  })
  async getEvents(
    @Query() query: QueryEventDto,
  ): Promise<CursorPaginationResponseDto<EventResponseDto>> {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.GET_EVENTS }, query),
    );
  }

  @Get('events/requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.AUDITOR, Role.ADMIN)
  @ApiOperation({ summary: 'Get all reward requests' })
  @ApiQuery({ type: QueryRewardRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Reward requests retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting reward requests',
    exitMessage: 'Reward requests retrieved',
  })
  async getRewardRequests(
    @Query() query: QueryRewardRequestDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<PaginationResponseDto<RewardRequestResponseDto>> {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.GET_REWARD_REQUESTS },
        {
          ...query,
          userId: user.id,
        },
      ),
    );
  }

  @Post('events/:eventId/requests')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Request a reward for an event' })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiResponse({
    status: 201,
    description: 'Reward request successfully created',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Requesting reward',
    exitMessage: 'Reward requested',
  })
  async requestReward(
    @Param('eventId') eventId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<RewardRequestResponseDto> {
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

  @Get('events/:eventId/rewards')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all rewards for an event' })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiResponse({ status: 200, description: 'Rewards retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting rewards for event',
    exitMessage: 'Rewards retrieved',
  })
  async getRewardsForEvent(
    @Param('eventId') eventId: string,
  ): Promise<RewardResponseDto[]> {
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
  @ApiOperation({
    summary: 'Add a reward to an event',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { rewardId: { type: 'string' } },
          },
        },
      },
    },
  })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiResponse({
    status: 204,
    description: 'Reward added to event successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Adding reward to event',
    exitMessage: 'Reward added to event',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async addRewardToEvent(
    @Param('eventId') eventId: string,
    @Body('rewardId') rewardId: string,
  ): Promise<void> {
    await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.ADD_REWARD_TO_EVENT },
        { eventId, rewardId },
      ),
    );
  }

  @Delete('events/:eventId/rewards/:rewardId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Remove a reward from an event' })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiParam({ name: 'rewardId', description: 'ID of the reward' })
  @ApiResponse({
    status: 204,
    description: 'Reward removed from event successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Removing reward from event',
    exitMessage: 'Reward removed from event',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRewardFromEvent(
    @Param('eventId') eventId: string,
    @Param('rewardId') rewardId: string,
  ): Promise<void> {
    await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.REMOVE_REWARD_FROM_EVENT },
        { eventId, rewardId },
      ),
    );
  }

  @Get('events/:eventId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get an event by ID' })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting event by ID',
    exitMessage: 'Event retrieved',
  })
  async getEventById(
    @Param('eventId') eventId: string,
  ): Promise<EventResponseDto> {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.GET_EVENT_BY_ID },
        { id: eventId },
      ),
    );
  }

  @Patch('events/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Updating event',
    exitMessage: 'Event updated',
  })
  async updateEvent(
    @Param('eventId') eventId: string,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.UPDATE_EVENT },
        {
          id: eventId,
          ...Object.fromEntries(
            Object.entries(updateEventDto).filter(([key]) => key !== 'id'),
          ),
        },
      ),
    );
  }

  @Delete('events/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'eventId', description: 'ID of the event' })
  @ApiResponse({ status: 204, description: 'Event deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Deleting event',
    exitMessage: 'Event deleted',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvent(@Param('eventId') eventId: string): Promise<void> {
    await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.REMOVE_EVENT }, {
        id: eventId,
      } satisfies QueryByIdDto),
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
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Creating reward',
    exitMessage: 'Reward created',
  })
  async createReward(
    @Param('type') type: string,
    @Body() rewardData: CreateRewardDto,
  ): Promise<RewardResponseDto> {
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
  @ApiQuery({ type: QueryRewardRequestDto })
  @ApiResponse({ status: 200, description: 'Rewards retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting rewards',
    exitMessage: 'Rewards retrieved',
  })
  async getRewards(
    @Query() query: QueryRewardRequestDto,
  ): Promise<PaginationResponseDto<RewardResponseDto>> {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.GET_REWARDS }, query),
    );
  }

  @Patch('events/requests/:requestId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Update the status of a reward request' })
  @ApiParam({ name: 'requestId', description: 'ID of the reward request' })
  @ApiResponse({
    status: 200,
    description: 'Reward request status updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Updating reward request status',
    exitMessage: 'Reward request status updated',
  })
  async updateRewardRequestStatus(
    @Param('requestId') requestId: string,
    @Body('status') status: string,
  ): Promise<RewardRequestResponseDto> {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.UPDATE_REWARD_REQUEST_STATUS }, {
        rewardRequestid: requestId,
        status: status as RewardRequestStatus,
      } satisfies UpdateRewardRequestStatusDto),
    );
  }
}
