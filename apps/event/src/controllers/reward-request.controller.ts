import { RewardRequestService } from '@/services';
import { EVENT_CMP } from '@libs/cmd';
import { QueryByIdDto, RewardRequestResponseDto } from '@libs/dtos';
import {
  CreateRewardRequestDto,
  QueryRewardRequestDto,
  UpdateRewardRequestStatusDto,
} from '@libs/dtos/dist/event/request';
import { LogExecution, PinoLoggerService } from '@libs/logger';
import { PaginationResponseDto } from '@libs/pagination';
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
  ): Promise<RewardRequestResponseDto> {
    const rewardRequest = await this.rewardRequestService.createRewardRequest(
      createRewardRequestDto,
    );

    return RewardRequestResponseDto.fromEntity(rewardRequest);
  }

  @EventPattern({ cmd: EVENT_CMP.GET_REWARD_REQUEST_BY_ID })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting reward request by ID',
    exitMessage: 'Reward request retrieved',
  })
  async getRewardRequestById(
    @Payload() getRewardRequestByIdDto: QueryByIdDto,
  ): Promise<RewardRequestResponseDto> {
    const rewardRequest = await this.rewardRequestService.getRewardRequestById(
      getRewardRequestByIdDto,
    );

    return RewardRequestResponseDto.fromEntity(rewardRequest);
  }

  @EventPattern({ cmd: EVENT_CMP.GET_REWARD_REQUESTS })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting reward requests',
    exitMessage: 'Reward requests retrieved',
  })
  async getRewardRequests(
    @Payload()
    { page = 1, limit = 10, ...getRewardRequestsDto }: QueryRewardRequestDto,
  ): Promise<PaginationResponseDto<RewardRequestResponseDto>> {
    const rewardRequests = await this.rewardRequestService.getRewardRequests({
      ...getRewardRequestsDto,
      page,
      limit,
    });

    return PaginationResponseDto.create(
      rewardRequests.requests.map(RewardRequestResponseDto.fromEntity),
      rewardRequests.total,
      page,
      limit,
    );
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
  ): Promise<RewardRequestResponseDto> {
    const rewardRequest =
      await this.rewardRequestService.updateRewardRequestStatus(
        updateRewardRequestStatusDto,
      );

    return RewardRequestResponseDto.fromEntity(rewardRequest);
  }
}
