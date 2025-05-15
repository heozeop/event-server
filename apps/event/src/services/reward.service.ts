import {
  CreateBadgeRewardDto,
  CreateCouponRewardDto,
  CreateEventRewardDto,
  CreateItemRewardDto,
  CreatePointRewardDto,
} from '@libs/dtos';
import { RewardType } from '@libs/enums';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
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
  ) {}

  /**
   * Create a point reward
   */
  async createPointReward(dto: CreatePointRewardDto): Promise<PointReward> {
    const reward = new PointReward(dto.points);
    await this.pointRewardRepository.create(reward);
    await this.pointRewardRepository.getEntityManager().flush();
    return reward;
  }

  /**
   * Create an item reward
   */
  async createItemReward(dto: CreateItemRewardDto): Promise<ItemReward> {
    const reward = new ItemReward(dto.itemId, dto.quantity);
    await this.itemRewardRepository.create(reward);
    await this.itemRewardRepository.getEntityManager().flush();
    return reward;
  }

  /**
   * Create a coupon reward
   */
  async createCouponReward(dto: CreateCouponRewardDto): Promise<CouponReward> {
    const reward = new CouponReward(dto.couponCode, dto.expiry);
    await this.couponRewardRepository.create(reward);
    await this.couponRewardRepository.getEntityManager().flush();
    return reward;
  }

  /**
   * Create a badge reward
   */
  async createBadgeReward(dto: CreateBadgeRewardDto): Promise<BadgeReward> {
    const reward = new BadgeReward(dto.badgeId);
    await this.badgeRewardRepository.create(reward);
    await this.badgeRewardRepository.getEntityManager().flush();
    return reward;
  }

  /**
   * Create a reward of specific type
   */
  async createReward(
    type: RewardType,
    rewardData:
      | CreatePointRewardDto
      | CreateItemRewardDto
      | CreateCouponRewardDto
      | CreateBadgeRewardDto,
  ): Promise<RewardBase> {
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
   * Get a reward by ID
   */
  async getRewardById(id: string): Promise<RewardBase> {
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
  async addRewardToEvent(dto: CreateEventRewardDto): Promise<EventReward> {
    const event = await this.eventService.getEventById(dto.eventId);
    const reward = await this.getRewardById(dto.rewardId);

    // Check if this reward is already assigned to this event
    const existing = await this.eventRewardRepository.findOne({
      event: { _id: new ObjectId(dto.eventId) },
      reward: { _id: new ObjectId(dto.rewardId) },
    });

    if (existing) {
      return existing;
    }

    const eventReward = this.eventRewardRepository.create({
      event,
      reward,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.eventRewardRepository.create(eventReward);
    await this.eventRewardRepository.getEntityManager().flush();
    return eventReward;
  }

  /**
   * Get rewards for an event
   */
  async getRewardsByEventId(eventId: string): Promise<RewardBase[]> {
    // First verify the event exists
    await this.eventService.getEventById(eventId);

    const eventRewards = await this.eventRewardRepository.find(
      { event: { _id: new ObjectId(eventId) } },
      { populate: ['reward'] },
    );

    return eventRewards.map((er) => er.reward);
  }

  /**
   * Remove a reward from an event
   */
  async removeRewardFromEvent(
    eventId: string,
    rewardId: string,
  ): Promise<void> {
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
