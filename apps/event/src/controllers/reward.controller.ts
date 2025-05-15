import {
  CreateBadgeRewardDto,
  CreateCouponRewardDto,
  CreateEventRewardDto,
  CreateItemRewardDto,
  CreatePointRewardDto,
  RewardResponseDto,
} from '@libs/dtos';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RewardService } from '../services/reward.service';

@Controller('events/:eventId/rewards')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Post('point')
  async createPointReward(
    @Param('eventId') eventId: string,
    @Body() createPointRewardDto: CreatePointRewardDto,
  ): Promise<RewardResponseDto> {
    // First create the reward
    const reward =
      await this.rewardService.createPointReward(createPointRewardDto);

    // Then associate it with the event
    await this.rewardService.addRewardToEvent({
      eventId,
      rewardId: reward._id.toString(),
    });

    return RewardResponseDto.fromEntity(reward);
  }

  @Post('item')
  async createItemReward(
    @Param('eventId') eventId: string,
    @Body() createItemRewardDto: CreateItemRewardDto,
  ): Promise<RewardResponseDto> {
    // First create the reward
    const reward =
      await this.rewardService.createItemReward(createItemRewardDto);

    // Then associate it with the event
    await this.rewardService.addRewardToEvent({
      eventId,
      rewardId: reward._id.toString(),
    });

    return RewardResponseDto.fromEntity(reward);
  }

  @Post('coupon')
  async createCouponReward(
    @Param('eventId') eventId: string,
    @Body() createCouponRewardDto: CreateCouponRewardDto,
  ): Promise<RewardResponseDto> {
    // First create the reward
    const reward = await this.rewardService.createCouponReward(
      createCouponRewardDto,
    );

    // Then associate it with the event
    await this.rewardService.addRewardToEvent({
      eventId,
      rewardId: reward._id.toString(),
    });

    return RewardResponseDto.fromEntity(reward);
  }

  @Post('badge')
  async createBadgeReward(
    @Param('eventId') eventId: string,
    @Body() createBadgeRewardDto: CreateBadgeRewardDto,
  ): Promise<RewardResponseDto> {
    // First create the reward
    const reward =
      await this.rewardService.createBadgeReward(createBadgeRewardDto);

    // Then associate it with the event
    await this.rewardService.addRewardToEvent({
      eventId,
      rewardId: reward._id.toString(),
    });

    return RewardResponseDto.fromEntity(reward);
  }

  @Post()
  async addRewardToEvent(
    @Param('eventId') eventId: string,
    @Body() createEventRewardDto: CreateEventRewardDto,
  ): Promise<{ success: boolean }> {
    // Overwrite the eventId from the path parameter
    createEventRewardDto.eventId = eventId;

    await this.rewardService.addRewardToEvent(createEventRewardDto);
    return { success: true };
  }

  @Get()
  async getRewards(
    @Param('eventId') eventId: string,
  ): Promise<RewardResponseDto[]> {
    const rewards = await this.rewardService.getRewardsByEventId(eventId);

    return rewards.map((reward) => RewardResponseDto.fromEntity(reward));
  }

  @Delete(':rewardId')
  async removeRewardFromEvent(
    @Param('eventId') eventId: string,
    @Param('rewardId') rewardId: string,
  ): Promise<{ success: boolean }> {
    await this.rewardService.removeRewardFromEvent(eventId, rewardId);

    return { success: true };
  }
}
