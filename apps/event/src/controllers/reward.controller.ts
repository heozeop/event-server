import { RewardService } from '@/services';
import { EVENT_CMP } from '@libs/cmd';
import { QueryByIdDto } from '@libs/dtos';
import { CreateRewardDto } from '@libs/dtos/dist/event/request';
import { RewardType } from '@libs/enums';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('reward')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @EventPattern({ cmd: EVENT_CMP.CREATE_REWARD })
  async createReward(
    @Payload()
    { type, rewardData }: { type: RewardType; rewardData: CreateRewardDto },
  ) {
    return this.rewardService.createReward({ type, rewardData });
  }

  @EventPattern({ cmd: EVENT_CMP.GET_REWARDS })
  async getRewards(
    @Payload()
    {
      type,
      name,
      limit,
      offset,
    }: {
      type: RewardType;
      name: string;
      limit: number;
      offset: number;
    },
  ) {
    return this.rewardService.getRewards({ type, name, limit, offset });
  }

  @EventPattern({ cmd: EVENT_CMP.GET_REWARD_BY_ID })
  async getRewardById(@Payload() { id }: { id: string }) {
    return this.rewardService.getRewardById({ id });
  }

  @EventPattern({ cmd: EVENT_CMP.ADD_REWARD_TO_EVENT })
  async addRewardToEvent(
    @Payload() { eventId, rewardId }: { eventId: string; rewardId: string },
  ) {
    return this.rewardService.addRewardToEvent({ eventId, rewardId });
  }

  @EventPattern({ cmd: EVENT_CMP.REMOVE_REWARD_FROM_EVENT })
  async removeRewardFromEvent(
    @Payload() { eventId, rewardId }: { eventId: string; rewardId: string },
  ) {
    return this.rewardService.removeRewardFromEvent({ eventId, rewardId });
  }

  @EventPattern({ cmd: EVENT_CMP.GET_REWARDS_BY_EVENT_ID })
  async getRewardsByEventId(@Payload() { id }: QueryByIdDto) {
    return this.rewardService.getRewardsByEventId({ id });
  }
}
