import { RewardService } from '@/services';
import { EVENT_CMP } from '@libs/cmd';
import {
  EventRewardResponseDto,
  QueryByIdDto,
  RewardResponseDto,
} from '@libs/dtos';
import {
  CreateEventRewardDto,
  CreateRewardDto,
  QueryRewardDto,
  UpdateEventRewardDto,
} from '@libs/dtos/dist/event/request';
import { RewardType } from '@libs/enums';
import { LogExecution, PinoLoggerService } from '@libs/logger';
import { PaginationResponseDto } from '@libs/pagination';
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
    { type, name, limit = 10, page = 1 }: QueryRewardDto,
  ): Promise<PaginationResponseDto<RewardResponseDto>> {
    const rewards = await this.rewardService.getRewards({
      type,
      name,
      limit,
      page,
    });

    return PaginationResponseDto.create(
      rewards.rewards.map(RewardResponseDto.fromEntity),
      rewards.total,
      page,
      limit,
    );
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
    @Payload() data: CreateEventRewardDto,
  ): Promise<boolean> {
    await this.rewardService.addRewardToEvent(data);

    return true;
  }

  @EventPattern({ cmd: EVENT_CMP.UPDATE_REWARD_FROM_EVENT })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Updating reward from event',
    exitMessage: 'Reward updated from event',
  })
  async updateRewardFromEvent(
    @Payload() data: UpdateEventRewardDto,
  ): Promise<EventRewardResponseDto> {
    const reward = await this.rewardService.updateEventReward(data);

    return EventRewardResponseDto.fromEntity(reward);
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
  ): Promise<boolean> {
    await this.rewardService.removeRewardFromEvent({ eventId, rewardId });

    return true;
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
  ): Promise<EventRewardResponseDto[]> {
    const rewards = await this.rewardService.getRewardsByEventId({ id });

    return rewards.map(EventRewardResponseDto.fromEntity);
  }
}
