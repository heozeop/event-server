import { EVENT_CMP } from '@libs/cmd';
import {
  CreateBadgeRewardDto,
  CreateCouponRewardDto,
  CreateEventRewardDto,
  CreateItemRewardDto,
  CreatePointRewardDto,
  QueryByIdDto,
  QueryRewardDto,
  RemoveRewardDto,
} from '@libs/dtos';
import { RewardType } from '@libs/enums';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
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
  @MessagePattern({ cmd: EVENT_CMP.CREATE_REWARD_POINT })
  async createPointReward(dto: CreatePointRewardDto): Promise<PointReward> {
    const reward = new PointReward(dto.name, dto.points);
    await this.pointRewardRepository.create(reward);
    await this.pointRewardRepository.getEntityManager().flush();
    return reward;
  }

  /**
   * Create an item reward
   */
  @MessagePattern({ cmd: EVENT_CMP.CREATE_REWARD_ITEM })
  async createItemReward(dto: CreateItemRewardDto): Promise<ItemReward> {
    const reward = new ItemReward(dto.name, dto.itemId, dto.quantity);
    await this.itemRewardRepository.create(reward);
    await this.itemRewardRepository.getEntityManager().flush();
    return reward;
  }

  /**
   * Create a coupon reward
   */
  @MessagePattern({ cmd: EVENT_CMP.CREATE_REWARD_COUPON })
  async createCouponReward(dto: CreateCouponRewardDto): Promise<CouponReward> {
    const reward = new CouponReward(dto.name, dto.couponCode, dto.expiry);
    await this.couponRewardRepository.create(reward);
    await this.couponRewardRepository.getEntityManager().flush();
    return reward;
  }

  /**
   * Create a badge reward
   */
  @MessagePattern({ cmd: EVENT_CMP.CREATE_REWARD_BADGE })
  async createBadgeReward(dto: CreateBadgeRewardDto): Promise<BadgeReward> {
    const reward = new BadgeReward(dto.name, dto.badgeId);
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
   * Get rewards with optional filtering
   */
  @MessagePattern({ cmd: EVENT_CMP.GET_REWARDS })
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
      query.name = { $ilike: name };
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
  @MessagePattern({ cmd: EVENT_CMP.GET_REWARD_BY_ID })
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
  @MessagePattern({ cmd: EVENT_CMP.ADD_REWARD_TO_EVENT })
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
  @MessagePattern({ cmd: EVENT_CMP.GET_REWARDS_BY_EVENT_ID })
  async getRewardsByEventId({ id }: QueryByIdDto): Promise<RewardBase[]> {
    // First verify the event exists
    await this.eventService.getEventById({ id });

    const eventRewards = await this.eventRewardRepository.find(
      { event: { _id: new ObjectId(id) } },
      { populate: ['reward'] },
    );

    return eventRewards.map((er) => er.reward);
  }

  /**
   * Remove a reward from an event
   */
  @MessagePattern({ cmd: EVENT_CMP.REMOVE_REWARD_FROM_EVENT })
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
