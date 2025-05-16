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

  @Post('rewards/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UsePipes(RewardValidationPipe)
  @Roles(Role.OPERATOR, Role.ADMIN)
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
  async getRewards(@Query() query: QueryRewardRequestDto) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.GET_REWARDS }, query),
    );
  }

  @Post('events/:eventId/request')
  @UseGuards(JwtAuthGuard)
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
  async getRewardRequests(@Query() query: QueryRewardRequestDto) {
    return await lastValueFrom(
      this.eventClient.send({ cmd: EVENT_CMP.GET_REWARD_REQUESTS }, query),
    );
  }
}
