import {
  CreateBadgeRewardDto,
  CreateCouponRewardDto,
  CreateEventRewardDto,
  CreateItemRewardDto,
  CreatePointRewardDto,
} from '@libs/dtos';
import { EventStatus, RewardType } from '@libs/enums';
import { MongoMemoryOrmModule } from '@libs/test';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventReward } from '../../src/entities/event-reward.entity';
import {
  BadgeReward,
  CouponReward,
  ItemReward,
  PointReward,
  RewardBase,
} from '../../src/entities/reward.entity';
import { EventService } from '../../src/services/event.service';
import { RewardService } from '../../src/services/reward.service';
import { TestAppModule } from '../test.app.module';

// Increase timeout for slow tests
jest.setTimeout(30000);

describe('RewardService', () => {
  let service: RewardService;
  let eventService: EventService;
  let orm: MikroORM;
  let mongoMemoryOrmModule: MongoMemoryOrmModule;

  beforeAll(async () => {
    try {
      mongoMemoryOrmModule = new MongoMemoryOrmModule();
      await mongoMemoryOrmModule.init('reward-test-db');

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestAppModule.forTest(mongoMemoryOrmModule)],
      }).compile();

      orm = moduleFixture.get<MikroORM>(MikroORM);
      service = moduleFixture.get<RewardService>(RewardService);
      eventService = moduleFixture.get<EventService>(EventService);

      await orm.getSchemaGenerator().createSchema();
    } catch (error) {
      console.error('Error initializing test module:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    await orm.getSchemaGenerator().clearDatabase();
  });

  afterAll(async () => {
    if (orm) {
      await orm.close();
    }

    await mongoMemoryOrmModule.stop();
  });

  describe('createPointReward', () => {
    it('should create a point reward', async () => {
      // Arrange
      const dto: CreatePointRewardDto = {
        name: 'Test Point Reward',
        points: 100,
      };

      // Act
      const result = await service.createPointReward(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.type).toBe(RewardType.POINT);
      expect(result.points).toBe(dto.points);

      // Verify the reward exists in the database
      const rewardRepository = orm.em.getRepository(RewardBase);
      const savedReward = await rewardRepository.findOne({ _id: result._id });
      expect(savedReward).toBeDefined();
      expect(savedReward?.type).toBe(RewardType.POINT);
      expect((savedReward as PointReward).points).toBe(dto.points);
    });
  });

  describe('createItemReward', () => {
    it('should create an item reward', async () => {
      // Arrange
      const dto: CreateItemRewardDto = {
        name: 'Test Item Reward',
        itemId: 'item-123',
        quantity: 5,
      };

      // Act
      const result = await service.createItemReward(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.type).toBe(RewardType.ITEM);
      expect(result.itemId).toBe(dto.itemId);
      expect(result.quantity).toBe(dto.quantity);
    });
  });

  describe('createCouponReward', () => {
    it('should create a coupon reward', async () => {
      // Arrange
      const expiry = new Date(Date.now() + 86400000); // tomorrow
      const dto: CreateCouponRewardDto = {
        name: 'Test Coupon Reward',
        couponCode: 'DISCOUNT50',
        expiry,
      };

      // Act
      const result = await service.createCouponReward(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.type).toBe(RewardType.COUPON);
      expect(result.couponCode).toBe(dto.couponCode);
      expect(result.expiry.getTime()).toBe(expiry.getTime());
    });
  });

  describe('createBadgeReward', () => {
    it('should create a badge reward', async () => {
      // Arrange
      const dto: CreateBadgeRewardDto = {
        name: 'Test Badge Reward',
        badgeId: 'badge-456',
      };

      // Act
      const result = await service.createBadgeReward(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.type).toBe(RewardType.BADGE);
      expect(result.badgeId).toBe(dto.badgeId);
    });
  });

  describe('createReward', () => {
    it('should create a reward of the specified type', async () => {
      // Arrange
      const pointsDto: CreatePointRewardDto = {
        name: 'Test Point Reward',
        points: 200,
      };
      const itemDto: CreateItemRewardDto = {
        name: 'Test Item Reward',
        itemId: 'item-789',
        quantity: 3,
      };
      const couponDto: CreateCouponRewardDto = {
        name: 'Test Coupon Reward',
        couponCode: 'SUMMER25',
        expiry: new Date(Date.now() + 86400000),
      };
      const badgeDto: CreateBadgeRewardDto = {
        name: 'Test Badge Reward',
        badgeId: 'badge-111',
      };

      // Act & Assert - Point Reward
      const pointReward = await service.createReward({
        type: RewardType.POINT,
        rewardData: pointsDto,
      });
      expect(pointReward).toBeDefined();
      expect(pointReward.type).toBe(RewardType.POINT);
      expect((pointReward as PointReward).points).toBe(pointsDto.points);

      // Act & Assert - Item Reward
      const itemReward = await service.createReward({
        type: RewardType.ITEM,
        rewardData: itemDto,
      });
      expect(itemReward).toBeDefined();
      expect(itemReward.type).toBe(RewardType.ITEM);
      expect((itemReward as ItemReward).itemId).toBe(itemDto.itemId);

      // Act & Assert - Coupon Reward
      const couponReward = await service.createReward({
        type: RewardType.COUPON,
        rewardData: couponDto,
      });
      expect(couponReward).toBeDefined();
      expect(couponReward.type).toBe(RewardType.COUPON);
      expect((couponReward as CouponReward).couponCode).toBe(
        couponDto.couponCode,
      );

      // Act & Assert - Badge Reward
      const badgeReward = await service.createReward({
        type: RewardType.BADGE,
        rewardData: badgeDto,
      });
      expect(badgeReward).toBeDefined();
      expect(badgeReward.type).toBe(RewardType.BADGE);
      expect((badgeReward as BadgeReward).badgeId).toBe(badgeDto.badgeId);
    });

    it('should throw BadRequestException for invalid reward type', async () => {
      // Arrange
      const invalidType = 'INVALID' as RewardType;
      const dto: CreatePointRewardDto = {
        name: 'Test Point Reward',
        points: 100,
      };

      // Act & Assert
      await expect(
        service.createReward({
          type: invalidType,
          rewardData: dto,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRewardById', () => {
    it('should return a reward by id', async () => {
      // Arrange
      const pointReward = new PointReward('Test Point Reward', 150);
      const rewardRepository = orm.em.getRepository(RewardBase);
      await rewardRepository.create(pointReward);
      await rewardRepository.getEntityManager().flush();

      // Act
      const result = await service.getRewardById({
        id: pointReward._id.toString(),
      });

      // Assert
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(pointReward._id.toString());
      expect(result.type).toBe(RewardType.POINT);
      expect((result as PointReward).points).toBe(150);
    });

    it('should throw NotFoundException if reward not found', async () => {
      // Arrange
      const id = new ObjectId().toString();

      // Act & Assert
      await expect(service.getRewardById({ id })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addRewardToEvent', () => {
    it('should add a reward to an event', async () => {
      // Arrange
      // 1. Create an event
      const event = await eventService.createEvent({
        name: 'Test Event',
        condition: { type: 'login' },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      // 2. Create a reward
      const reward = await service.createPointReward({
        name: 'Test Point Reward',
        points: 200,
      });

      // 3. Prepare the DTO
      const dto: CreateEventRewardDto = {
        eventId: event._id.toString(),
        rewardId: reward._id.toString(),
      };

      // Act
      const result = await service.addRewardToEvent(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.event._id.toString()).toBe(event._id.toString());
      expect(result.reward._id.toString()).toBe(reward._id.toString());

      // Check in the database
      const eventRewardRepository = orm.em.getRepository(EventReward);
      const savedEventReward = await eventRewardRepository.findOne(
        { event: { _id: event._id }, reward: { _id: reward._id } },
        { populate: ['event', 'reward'] },
      );
      expect(savedEventReward).toBeDefined();
      expect(savedEventReward?.event._id.toString()).toBe(event._id.toString());
      expect(savedEventReward?.reward._id.toString()).toBe(
        reward._id.toString(),
      );
    });

    it('should return existing EventReward if it already exists', async () => {
      // Arrange
      // 1. Create an event
      const event = await eventService.createEvent({
        name: 'Test Event',
        condition: { type: 'login' },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      // 2. Create a reward
      const reward = await service.createPointReward({
        name: 'Test Point Reward',
        points: 200,
      });

      // 3. Add reward to event
      const dto: CreateEventRewardDto = {
        eventId: event._id.toString(),
        rewardId: reward._id.toString(),
      };
      const initialEventReward = await service.addRewardToEvent(dto);

      // Act - try to add the same reward again
      const result = await service.addRewardToEvent(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(initialEventReward._id.toString());
    });

    it('should throw NotFoundException if event not found', async () => {
      // Arrange
      const reward = await service.createPointReward({
        name: 'Test Point Reward',
        points: 200,
      });
      const dto: CreateEventRewardDto = {
        eventId: new ObjectId().toString(),
        rewardId: reward._id.toString(),
      };

      // Act & Assert
      await expect(service.addRewardToEvent(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if reward not found', async () => {
      // Arrange
      const event = await eventService.createEvent({
        name: 'Test Event',
        condition: { type: 'login' },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });
      const dto: CreateEventRewardDto = {
        eventId: event._id.toString(),
        rewardId: new ObjectId().toString(),
      };

      // Act & Assert
      await expect(service.addRewardToEvent(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getRewardsByEventId', () => {
    it('should return rewards for an event', async () => {
      // Arrange
      // 1. Create an event
      const event = await eventService.createEvent({
        name: 'Test Event',
        condition: { type: 'login' },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      // 2. Create multiple rewards
      const pointReward = await service.createPointReward({
        name: 'Test Point Reward',
        points: 100,
      });
      const itemReward = await service.createItemReward({
        name: 'Test Item Reward',
        itemId: 'item-abc',
        quantity: 2,
      });
      const badgeReward = await service.createBadgeReward({
        name: 'Test Badge Reward',
        badgeId: 'badge-xyz',
      });

      // 3. Add rewards to event
      await service.addRewardToEvent({
        eventId: event._id.toString(),
        rewardId: pointReward._id.toString(),
      });
      await service.addRewardToEvent({
        eventId: event._id.toString(),
        rewardId: itemReward._id.toString(),
      });
      await service.addRewardToEvent({
        eventId: event._id.toString(),
        rewardId: badgeReward._id.toString(),
      });

      // Act
      const rewards = await service.getRewardsByEventId({
        id: event._id.toString(),
      });

      // Assert
      expect(rewards).toBeDefined();
      expect(rewards.length).toBe(3);

      // Check that each reward is in the result
      const rewardIds = rewards.map((r) => r._id.toString());
      expect(rewardIds).toContain(pointReward._id.toString());
      expect(rewardIds).toContain(itemReward._id.toString());
      expect(rewardIds).toContain(badgeReward._id.toString());
    });

    it('should return empty array if no rewards for event', async () => {
      // Arrange
      const event = await eventService.createEvent({
        name: 'Test Event',
        condition: { type: 'login' },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      // Act
      const rewards = await service.getRewardsByEventId({
        id: event._id.toString(),
      });

      // Assert
      expect(rewards).toBeDefined();
      expect(rewards.length).toBe(0);
    });

    it('should throw NotFoundException if event not found', async () => {
      // Act & Assert
      await expect(
        service.getRewardsByEventId({ id: new ObjectId().toString() }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeRewardFromEvent', () => {
    it('should remove a reward from an event', async () => {
      // Arrange
      // 1. Create an event
      const event = await eventService.createEvent({
        name: 'Test Event',
        condition: { type: 'login' },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      // 2. Create a reward
      const reward = await service.createPointReward({
        name: 'Test Point Reward',
        points: 200,
      });

      // 3. Add reward to event
      await service.addRewardToEvent({
        eventId: event._id.toString(),
        rewardId: reward._id.toString(),
      });

      // Act
      await service.removeRewardFromEvent({
        eventId: event._id.toString(),
        rewardId: reward._id.toString(),
      });

      // Assert
      const eventRewardRepository = orm.em.getRepository(EventReward);
      const eventReward = await eventRewardRepository.findOne({
        event: { _id: event._id },
        reward: { _id: reward._id },
      });
      expect(eventReward).toBeNull();
    });

    it('should throw NotFoundException if event-reward relation not found', async () => {
      // Arrange
      const event = await eventService.createEvent({
        name: 'Test Event',
        condition: { type: 'login' },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });
      const reward = await service.createPointReward({
        name: 'Test Point Reward',
        points: 200,
      });

      // Act & Assert
      await expect(
        service.removeRewardFromEvent({
          eventId: event._id.toString(),
          rewardId: reward._id.toString(),
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
