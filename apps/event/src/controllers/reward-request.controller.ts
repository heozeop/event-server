import { RewardRequestService } from '@/services';
import { EVENT_CMP } from '@libs/cmd';
import { QueryByIdDto } from '@libs/dtos';
import {
  CreateRewardRequestDto,
  QueryRewardRequestDto,
  UpdateRewardRequestStatusDto,
} from '@libs/dtos/dist/event/request';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('reward-request')
export class RewardRequestController {
  constructor(private readonly rewardRequestService: RewardRequestService) {}

  @EventPattern({ cmd: EVENT_CMP.CREATE_REWARD_REQUEST })
  async createRewardRequest(
    @Payload() createRewardRequestDto: CreateRewardRequestDto,
  ) {
    return this.rewardRequestService.createRewardRequest(
      createRewardRequestDto,
    );
  }

  @EventPattern({ cmd: EVENT_CMP.GET_REWARD_REQUEST_BY_ID })
  async getRewardRequestById(@Payload() getRewardRequestByIdDto: QueryByIdDto) {
    return this.rewardRequestService.getRewardRequestById(
      getRewardRequestByIdDto,
    );
  }

  @EventPattern({ cmd: EVENT_CMP.GET_REWARD_REQUESTS })
  async getRewardRequests(
    @Payload() getRewardRequestsDto: QueryRewardRequestDto,
  ) {
    return this.rewardRequestService.getRewardRequests(getRewardRequestsDto);
  }

  @EventPattern({ cmd: EVENT_CMP.UPDATE_REWARD_REQUEST_STATUS })
  async updateRewardRequestStatus(
    @Payload() updateRewardRequestStatusDto: UpdateRewardRequestStatusDto,
  ) {
    return this.rewardRequestService.updateRewardRequestStatus(
      updateRewardRequestStatusDto,
    );
  }
}
