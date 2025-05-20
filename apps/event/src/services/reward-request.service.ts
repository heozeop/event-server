import { toObjectId } from '@/common/to-object-id';
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
import { Event } from '../entities/event.entity';
import { RewardRequest } from '../entities/reward-request.entity';
@Injectable()
export class RewardRequestService {
  constructor(
    @InjectRepository(RewardRequest)
    private readonly rewardRequestRepository: EntityRepository<RewardRequest>,
    @InjectRepository(Event)
    private readonly eventRepository: EntityRepository<Event>,
  ) {}

  /**
   * Create a new reward request
   */
  async createRewardRequest({
    userId,
    eventId,
  }: CreateRewardRequestDto): Promise<RewardRequest> {
    // First verify the event exists
    const event = await this.getEventById({ id: eventId });

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
        event: toObjectId(eventId),
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
      event: toObjectId(eventId),
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
      query.event = toObjectId(eventId);
    }

    if (status) {
      query.status = status;
    }

    const [requests, total] = await this.rewardRequestRepository.findAndCount(
      query,
      {
        populate: ['event'],
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

  private async getEventById({ id }: QueryByIdDto): Promise<Event> {
    const event = await this.eventRepository.findOne({
      _id: toObjectId(id),
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }
}
