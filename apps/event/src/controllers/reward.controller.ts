import { RewardService } from '@/services';
import { EVENT_CMP } from '@libs/cmd';
import { QueryByIdDto, RewardResponseDto } from '@libs/dtos';
import { CreateRewardDto } from '@libs/dtos/dist/event/request';
import { RewardType } from '@libs/enums';
import { LogExecution, PinoLoggerService } from '@libs/logger';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('reward')
export class RewardController {
  constructor(
    private readonly rewardService: RewardService,
    private readonly logger: PinoLoggerService,
  ) {}

  @EventPattern({ cmd: EVENT_CMP.CREATE_REWARD })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Creating reward',
    exitMessage: 'Reward created',
  })
  async createReward(
    @Payload()
    { type, rewardData }: { type: RewardType; rewardData: CreateRewardDto },
  ): Promise<RewardResponseDto> {
    const reward = await this.rewardService.createReward({ type, rewardData });

    return RewardResponseDto.fromEntity(reward);
  }

  @EventPattern({ cmd: EVENT_CMP.GET_REWARDS })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting rewards',
    exitMessage: 'Rewards retrieved',
  })
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
  ): Promise<RewardResponseDto[]> {
    const rewards = await this.rewardService.getRewards({
      type,
      name,
      limit,
      offset,
    });

    return rewards.rewards.map(RewardResponseDto.fromEntity);
  }

  @EventPattern({ cmd: EVENT_CMP.GET_REWARD_BY_ID })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting reward by ID',
    exitMessage: 'Reward retrieved',
  })
  async getRewardById(
    @Payload() { id }: { id: string },
  ): Promise<RewardResponseDto> {
    const reward = await this.rewardService.getRewardById({ id });

    return RewardResponseDto.fromEntity(reward);
  }

  @EventPattern({ cmd: EVENT_CMP.ADD_REWARD_TO_EVENT })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Adding reward to event',
    exitMessage: 'Reward added to event',
  })
  async addRewardToEvent(
    @Payload() { eventId, rewardId }: { eventId: string; rewardId: string },
  ): Promise<void> {
    await this.rewardService.addRewardToEvent({ eventId, rewardId });
  }

  @EventPattern({ cmd: EVENT_CMP.REMOVE_REWARD_FROM_EVENT })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Removing reward from event',
    exitMessage: 'Reward removed from event',
  })
  async removeRewardFromEvent(
    @Payload() { eventId, rewardId }: { eventId: string; rewardId: string },
  ): Promise<void> {
    await this.rewardService.removeRewardFromEvent({ eventId, rewardId });
  }

  @EventPattern({ cmd: EVENT_CMP.GET_REWARDS_BY_EVENT_ID })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting rewards by event ID',
    exitMessage: 'Rewards retrieved by event ID',
  })
  async getRewardsByEventId(
    @Payload() { id }: QueryByIdDto,
  ): Promise<RewardResponseDto[]> {
    const rewards = await this.rewardService.getRewardsByEventId({ id });

    return rewards.map(RewardResponseDto.fromEntity);
  }
}
