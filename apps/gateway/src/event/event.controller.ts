import { EVENT_CMP } from '@libs/cmd';
import {
  CreateBadgeRewardDto,
  CreateCouponRewardDto,
  CreateEventDto,
  CreateItemRewardDto,
  CreatePointRewardDto,
  QueryEventDto,
  QueryRewardRequestDto,
} from '@libs/dtos';
import { Role } from '@libs/enums';
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
      this.eventClient.send({ cmd: EVENT_CMP.CREATE_EVENT }, createEventDto),
    );
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  async getEvents(@Query() query: QueryEventDto) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.GET_EVENTS }, query),
    );
  }

  @Post('rewards/coupon')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  async createReward(
    @Body() createRewardDto: CreateCouponRewardDto,
  ) {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.CREATE_REWARD_COUPON },
        createRewardDto,
      ),
    );
  }

  @Post('rewards/item')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  async createItemReward(
    @Body() createRewardDto: CreateItemRewardDto,
  ) {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.CREATE_REWARD_ITEM },
        createRewardDto,
      ),
    );
  }

  @Post('rewards/point')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  async createPointReward(
    @Body() createRewardDto: CreatePointRewardDto,
  ) {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.CREATE_REWARD_POINT },
        createRewardDto,
      ),
    );
  }

  @Post('rewards/badge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  async createBadgeReward(
    @Body() createRewardDto: CreateBadgeRewardDto,
  ) {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.CREATE_REWARD_BADGE },
        createRewardDto,
      ),
    );
  }

  @Get('rewards')
  @UseGuards(JwtAuthGuard)
  async getRewards(@Query() query: QueryRewardRequestDto) {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.GET_REWARDS },
        query,
      ),
    );
  }

  @Post('events/:eventId/request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  async requestReward(@Param('eventId') eventId: string) {
    return await lastValueFrom(
      this.eventClient.send(
        { cmd: EVENT_CMP.CREATE_REWARD_REQUEST },
        { eventId },
      ),
    );
  }

  @Get('events/requests')
  @UseGuards(JwtAuthGuard)
  async getRewardRequests(@Query() query: any) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.GET_REWARD_REQUESTS }, query),
    );
  }
}
