import {
  CreateBadgeRewardDto,
  CreateCouponRewardDto,
  CreateEventRewardDto,
  CreateItemRewardDto,
  CreatePointRewardDto,
  CreateRewardDto,
  QueryByIdDto,
  QueryRewardDto,
  RemoveRewardDto,
} from '@libs/dtos';
import { RewardType } from '@libs/enums';
import { PinoLoggerService } from '@libs/logger';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventReward } from '../entities/event-reward.entity';
import {
  BadgeReward,
  CouponReward,
  ItemReward,
  PointReward,
  RewardBase,
} from '../entities/reward.entity';
import { EventService } from './event.service';
@Injectable()
export class RewardService {
  constructor(
    @InjectRepository(PointReward)
    private readonly pointRewardRepository: EntityRepository<PointReward>,
    @InjectRepository(ItemReward)
    private readonly itemRewardRepository: EntityRepository<ItemReward>,
    @InjectRepository(CouponReward)
    private readonly couponRewardRepository: EntityRepository<CouponReward>,
    @InjectRepository(BadgeReward)
    private readonly badgeRewardRepository: EntityRepository<BadgeReward>,
    @InjectRepository(EventReward)
    private readonly eventRewardRepository: EntityRepository<EventReward>,
    private readonly em: EntityManager,
    private readonly eventService: EventService,
    private readonly logger: PinoLoggerService,
  ) {}

  /**
   * Create a point reward
   */
  async createPointReward(dto: CreatePointRewardDto): Promise<PointReward> {
    const reward = new PointReward(dto.name, dto.points);
    await this.pointRewardRepository.getEntityManager().persistAndFlush(reward);
    return reward;
  }

  /**
   * Create an item reward
   */
  async createItemReward(dto: CreateItemRewardDto): Promise<ItemReward> {
    const reward = new ItemReward(dto.name, dto.itemId, dto.quantity);
    await this.itemRewardRepository.getEntityManager().persistAndFlush(reward);
    return reward;
  }

  /**
   * Create a coupon reward
   */
  async createCouponReward(dto: CreateCouponRewardDto): Promise<CouponReward> {
    const reward = new CouponReward(dto.name, dto.couponCode, dto.expiry);
    await this.couponRewardRepository
      .getEntityManager()
      .persistAndFlush(reward);
    return reward;
  }

  /**
   * Create a badge reward
   */
  async createBadgeReward(dto: CreateBadgeRewardDto): Promise<BadgeReward> {
    const reward = new BadgeReward(dto.name, dto.badgeId);
    await this.badgeRewardRepository.getEntityManager().persistAndFlush(reward);
    return reward;
  }

  /**
   * Create a reward of specific type
   */
  async createReward({
    type,
    rewardData,
  }: {
    type: RewardType;
    rewardData: CreateRewardDto;
  }): Promise<RewardBase> {
    switch (type) {
      case RewardType.POINT:
        return this.createPointReward(rewardData as CreatePointRewardDto);
      case RewardType.ITEM:
        return this.createItemReward(rewardData as CreateItemRewardDto);
      case RewardType.COUPON:
        return this.createCouponReward(rewardData as CreateCouponRewardDto);
      case RewardType.BADGE:
        return this.createBadgeReward(rewardData as CreateBadgeRewardDto);
      default:
        throw new BadRequestException(`Invalid reward type: ${type}`);
    }
  }

  /**
   * Get rewards with optional filtering
   */
  async getRewards({
    type,
    name,
    limit = 10,
    offset = 0,
  }: QueryRewardDto): Promise<{ rewards: RewardBase[]; total: number }> {
    const query: FilterQuery<RewardBase> = {};

    if (type) {
      query.type = type;
    }

    if (name) {
      query.name = new RegExp(name, 'i');
    }

    const rewards = await this.em.find(RewardBase, query, {
      limit,
      offset,
    });

    return { rewards, total: rewards.length };
  }

  /**
   * Get a reward by ID
   */
  async getRewardById({ id }: QueryByIdDto): Promise<RewardBase> {
    const reward = await this.em.findOne(RewardBase, {
      _id: new ObjectId(id),
    });

    if (!reward) {
      throw new NotFoundException(`Reward with ID ${id} not found`);
    }

    return reward;
  }

  /**
   * Add a reward to an event
   */
  async addRewardToEvent({
    eventId,
    rewardId,
  }: CreateEventRewardDto): Promise<EventReward> {
    const event = await this.eventService.getEventById({ id: eventId });
    const reward = await this.getRewardById({ id: rewardId });

    // Check if this reward is already assigned to this event
    const existing = await this.eventRewardRepository.findOne({
      event: { _id: new ObjectId(eventId) },
      reward: { _id: new ObjectId(rewardId) },
    });

    if (existing) {
      throw new ConflictException(
        `Reward with ID ${rewardId} already assigned to event with ID ${eventId}`,
      );
    }

    const eventReward = this.eventRewardRepository.create({
      event,
      reward,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.eventRewardRepository
      .getEntityManager()
      .persistAndFlush(eventReward);
    return eventReward;
  }

  /**
   * Get rewards for an event
   */
  async getRewardsByEventId({ id }: QueryByIdDto): Promise<RewardBase[]> {
    const isEventExist = await this.eventService.isEventExist({ id });
    if (!isEventExist) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const eventRewards = await this.eventRewardRepository.find(
      { event: { _id: new ObjectId(id) } },
      { populate: ['reward'], fields: ['reward'] },
    );

    if (eventRewards.length < 1) {
      return [];
    }

    return eventRewards.map((er) => er.reward);
  }

  /**
   * Remove a reward from an event
   */
  async removeRewardFromEvent({
    eventId,
    rewardId,
  }: RemoveRewardDto): Promise<void> {
    const eventReward = await this.eventRewardRepository.findOne({
      event: { _id: new ObjectId(eventId) },
      reward: { _id: new ObjectId(rewardId) },
    });

    if (!eventReward) {
      throw new NotFoundException(
        `Reward with ID ${rewardId} not found for event with ID ${eventId}`,
      );
    }

    await this.eventRewardRepository
      .getEntityManager()
      .removeAndFlush(eventReward);
  }
}
