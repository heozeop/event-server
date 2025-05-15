import { EVENT_CMP } from '@libs/cmd';
import {
  CreateRewardRequestDto,
  QueryByIdDto,
  QueryRewardRequestDto,
  UpdateRewardRequestStatusDto,
} from '@libs/dtos';
import { EventStatus, RewardRequestStatus } from '@libs/enums';
import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RewardRequest } from '../entities/reward-request.entity';
import { EventService } from './event.service';

@Injectable()
export class RewardRequestService {
  constructor(
    @InjectRepository(RewardRequest)
    private readonly rewardRequestRepository: EntityRepository<RewardRequest>,
    private readonly eventService: EventService,
  ) {}

  /**
   * Create a new reward request
   */
  @MessagePattern({ cmd: EVENT_CMP.CREATE_REWARD_REQUEST })
  async createRewardRequest({
    userId,
    eventId,
  }: CreateRewardRequestDto): Promise<RewardRequest> {
    // First verify the event exists
    const event = await this.eventService.getEventById({ id: eventId });

    // Check event is active
    const now = new Date();
    if (
      event.status !== EventStatus.ACTIVE ||
      now < event.period.start ||
      now > event.period.end
    ) {
      throw new BadRequestException('Event is not active');
    }

    // Check if request already exists
    const existingRequest = await this.rewardRequestRepository.findOne({
      userId: new ObjectId(userId),
      event: { _id: new ObjectId(eventId) },
    });

    if (existingRequest) {
      throw new ConflictException(
        'Reward request already exists for this user and event',
      );
    }

    // Create the request
    const rewardRequest = this.rewardRequestRepository.create({
      userId: new ObjectId(userId),
      event,
      status: RewardRequestStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.rewardRequestRepository.create(rewardRequest);
    await this.rewardRequestRepository.getEntityManager().flush();

    return rewardRequest;
  }

  /**
   * Get a reward request by ID
   */
  @MessagePattern({ cmd: EVENT_CMP.GET_REWARD_REQUEST_BY_ID })
  async getRewardRequestById({ id }: QueryByIdDto): Promise<RewardRequest> {
    try {
      const rewardRequest = await this.rewardRequestRepository.findOne(
        { _id: new ObjectId(id) },
        { populate: ['event'] },
      );

      if (!rewardRequest) {
        throw new NotFoundException(`Reward request with ID ${id} not found`);
      }

      return rewardRequest;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Reward request with ID ${id} not found`);
    }
  }

  /**
   * Get reward requests with optional filtering
   */
  @MessagePattern({ cmd: EVENT_CMP.GET_REWARD_REQUESTS })
  async getRewardRequests({
    userId,
    eventId,
    status,
    limit = 10,
    offset = 0,
  }: QueryRewardRequestDto): Promise<{
    requests: RewardRequest[];
    total: number;
  }> {
    const query: FilterQuery<RewardRequest> = {};

    if (userId) {
      query.userId = new ObjectId(userId);
    }

    if (eventId) {
      query.event = { _id: new ObjectId(eventId) };
    }

    if (status) {
      query.status = status;
    }

    const [requests, total] = await this.rewardRequestRepository.findAndCount(
      query,
      {
        populate: ['event'],
        limit,
        offset,
      },
    );

    return { requests, total };
  }

  /**
   * Update a reward request status
   */
  @MessagePattern({ cmd: EVENT_CMP.UPDATE_REWARD_REQUEST_STATUS })
  async updateRewardRequestStatus({
    rewardRequestid,
    status,
  }: UpdateRewardRequestStatusDto): Promise<RewardRequest> {
    const rewardRequest = await this.getRewardRequestById({
      id: rewardRequestid,
    });

    // If already approved/rejected, don't allow status change
    if (rewardRequest.status !== RewardRequestStatus.PENDING) {
      throw new BadRequestException(
        `Reward request has already been ${rewardRequest.status.toLowerCase()}`,
      );
    }

    rewardRequest.status = status;
    await this.rewardRequestRepository.getEntityManager().flush();

    return rewardRequest;
  }
}
