import { RewardRequestService } from '@/services';
import { EVENT_CMP } from '@libs/cmd';
import { QueryByIdDto } from '@libs/dtos';
import {
  CreateRewardRequestDto,
  QueryRewardRequestDto,
  UpdateRewardRequestStatusDto,
} from '@libs/dtos/dist/event/request';
import { LogExecution, PinoLoggerService } from '@libs/logger';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('reward-request')
export class RewardRequestController {
  constructor(
    private readonly rewardRequestService: RewardRequestService,
    private readonly logger: PinoLoggerService,
  ) {}

  @EventPattern({ cmd: EVENT_CMP.CREATE_REWARD_REQUEST })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Creating reward request',
    exitMessage: 'Reward request created',
  })
  async createRewardRequest(
    @Payload() createRewardRequestDto: CreateRewardRequestDto,
  ) {
    return this.rewardRequestService.createRewardRequest(
      createRewardRequestDto,
    );
  }

  @EventPattern({ cmd: EVENT_CMP.GET_REWARD_REQUEST_BY_ID })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting reward request by ID',
    exitMessage: 'Reward request retrieved',
  })
  async getRewardRequestById(@Payload() getRewardRequestByIdDto: QueryByIdDto) {
    return this.rewardRequestService.getRewardRequestById(
      getRewardRequestByIdDto,
    );
  }

  @EventPattern({ cmd: EVENT_CMP.GET_REWARD_REQUESTS })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting reward requests',
    exitMessage: 'Reward requests retrieved',
  })
  async getRewardRequests(
    @Payload() getRewardRequestsDto: QueryRewardRequestDto,
  ) {
    return this.rewardRequestService.getRewardRequests(getRewardRequestsDto);
  }

  @EventPattern({ cmd: EVENT_CMP.UPDATE_REWARD_REQUEST_STATUS })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Updating reward request status',
    exitMessage: 'Reward request status updated',
  })
  async updateRewardRequestStatus(
    @Payload() updateRewardRequestStatusDto: UpdateRewardRequestStatusDto,
  ) {
    return this.rewardRequestService.updateRewardRequestStatus(
      updateRewardRequestStatusDto,
    );
  }
}
