import {
  CreateBadgeRewardDto,
  CreateCouponRewardDto,
  CreateEventDto,
  CreateItemRewardDto,
  CreatePointRewardDto,
} from '@libs/dtos';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Role } from 'enums/auth/role.enum';
import { lastValueFrom } from 'rxjs';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller()
export class EventController {
  constructor(
    @Inject('EVENT_SERVICE') private readonly eventClient: ClientProxy,
  ) {}

  @Post('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  async createEvent(@Body() createEventDto: CreateEventDto) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: 'create_event' }, createEventDto),
    );
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  async getEvents(@Query() query: any) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: 'get_events' }, query),
    );
  }

  @Post('events/:eventId/rewards/coupon')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  async createReward(
    @Param('eventId') eventId: string,
    @Body() createRewardDto: CreateCouponRewardDto,
  ) {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: `create_reward_coupon` },
        { eventId, ...createRewardDto },
      ),
    );
  }

  @Post('events/:eventId/rewards/item')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  async createItemReward(
    @Param('eventId') eventId: string,
    @Body() createRewardDto: CreateItemRewardDto,
  ) {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: `create_reward_item` },
        { eventId, ...createRewardDto },
      ),
    );
  }

  @Post('events/:eventId/rewards/point')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  async createPointReward(
    @Param('eventId') eventId: string,
    @Body() createRewardDto: CreatePointRewardDto,
  ) {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: `create_reward_point` },
        { eventId, ...createRewardDto },
      ),
    );
  }

  @Post('events/:eventId/rewards/badge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  async createBadgeReward(
    @Param('eventId') eventId: string,
    @Body() createRewardDto: CreateBadgeRewardDto,
  ) {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: `create_reward_badge` },
        { eventId, ...createRewardDto },
      ),
    );
  }

  @Get('events/:eventId/rewards')
  @UseGuards(JwtAuthGuard)
  async getRewards(@Param('eventId') eventId: string) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: 'get_rewards' }, { eventId }),
    );
  }

  @Post('events/:eventId/request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  async requestReward(@Param('eventId') eventId: string) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: 'request_reward' }, { eventId }),
    );
  }

  @Get('events/requests')
  @UseGuards(JwtAuthGuard)
  async getRewardRequests(@Query() query: any) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: 'get_reward_requests' }, query),
    );
  }
}
