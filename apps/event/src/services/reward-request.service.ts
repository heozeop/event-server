import { EventReward } from '@/entities';
import {
  CreateRewardRequestDto,
  QueryByIdDto,
  QueryRewardRequestDto,
  UpdateRewardRequestStatusDto,
} from '@libs/dtos';
import { EventStatus, RewardRequestStatus } from '@libs/enums';
import { toObjectId } from '@libs/utils';
import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RewardRequest } from '../entities/reward-request.entity';
@Injectable()
export class RewardRequestService {
  constructor(
    @InjectRepository(RewardRequest)
    private readonly rewardRequestRepository: EntityRepository<RewardRequest>,
    @InjectRepository(EventReward)
    private readonly eventRewardRepository: EntityRepository<EventReward>,
  ) {}

  /**
   * Create a new reward request
   */
  async createRewardRequest({
    userId,
    eventId,
    rewardId,
  }: CreateRewardRequestDto): Promise<RewardRequest> {
    // First verify the event exists
    const eventReward = await this.eventRewardRepository.findOne(
      {
        event: { _id: toObjectId(eventId) },
        reward: { _id: toObjectId(rewardId) },
      },
      {
        populate: ['event', 'reward'],
      },
    );

    if (!eventReward) {
      throw new NotFoundException(
        `Reward with ID ${rewardId} not found for event with ID ${eventId}`,
      );
    }

    const event = eventReward.event;

    // Check event is active
    const now = new Date();
    if (
      event.status !== EventStatus.ACTIVE ||
      now < event.periodStart ||
      (event.periodEnd && now > event.periodEnd)
    ) {
      throw new BadRequestException('Event is not active');
    }

    // Check if request already exists
    const existingRequest = await this.rewardRequestRepository.findOne(
      {
        userId: toObjectId(userId),
        eventReward: eventReward,
      },
      {
        fields: ['_id'],
      },
    );

    if (existingRequest) {
      throw new ConflictException(
        'Reward request already exists for this user and event',
      );
    }

    // Create the request
    const rewardRequest = this.rewardRequestRepository.create({
      userId: toObjectId(userId),
      eventReward,
      status: RewardRequestStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.rewardRequestRepository
      .getEntityManager()
      .persistAndFlush(rewardRequest);

    return rewardRequest;
  }

  /**
   * Get a reward request by ID
   */
  async getRewardRequestById({ id }: QueryByIdDto): Promise<RewardRequest> {
    try {
      const rewardRequest = await this.rewardRequestRepository.findOne(
        { _id: new ObjectId(id) },
        {
          populate: ['eventReward', 'eventReward.reward', 'eventReward.event'],
        },
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
  async getRewardRequests({
    userId,
    eventId,
    status,
    limit = 10,
    page = 1,
  }: QueryRewardRequestDto): Promise<{
    requests: RewardRequest[];
    total: number;
  }> {
    const query: FilterQuery<RewardRequest> = {};

    if (userId) {
      query.userId = toObjectId(userId);
    }

    if (eventId) {
      query.eventReward = {
        event: { _id: toObjectId(eventId) },
      };
    }

    if (status) {
      query.status = status;
    }

    const [requests, total] = await this.rewardRequestRepository.findAndCount(
      query,
      {
        populate: ['eventReward', 'eventReward.reward', 'eventReward.event'],
        limit,
        offset: (page - 1) * limit,
      },
    );

    return { requests, total };
  }

  /**
   * Update a reward request status
   */
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
