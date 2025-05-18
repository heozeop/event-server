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

  // 추가 테스트 케이스 - 운영자 시나리오 기반
  describe('운영자 리워드 관리 테스트', () => {
    // 포인트 리워드 생성 테스트
    it('포인트 리워드를 생성하고 값이 정확히 저장되어야 함', async () => {
      // Arrange
      const pointsDto: CreatePointRewardDto = {
        name: '회원가입 축하 포인트',
        points: 1000,
      };

      // Act
      const result = await service.createPointReward(pointsDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(pointsDto.name);
      expect(result.points).toBe(pointsDto.points);
      expect(result.type).toBe(RewardType.POINT);
    });

    // 쿠폰 리워드 생성 테스트 (한국어 이름과 유효 기간)
    it('유효 기간이 있는 쿠폰 리워드를 생성할 수 있어야 함', async () => {
      // Arrange
      const expiry = new Date(Date.now() + 30 * 86400000); // 30일 후
      const couponDto: CreateCouponRewardDto = {
        name: '여름 방학 특별 할인 쿠폰',
        couponCode: 'SUMMER2023',
        expiry,
      };

      // Act
      const result = await service.createCouponReward(couponDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(couponDto.name);
      expect(result.couponCode).toBe(couponDto.couponCode);
      expect(result.expiry.getTime()).toBe(expiry.getTime());
      expect(result.type).toBe(RewardType.COUPON);
    });

    // 배지 리워드 생성 테스트 (한국어 이름)
    it('배지 리워드를 생성하고 정확히 저장되어야 함', async () => {
      // Arrange
      const badgeDto: CreateBadgeRewardDto = {
        name: '첫 구매 완료 배지',
        badgeId: 'first-purchase-badge',
      };

      // Act
      const result = await service.createBadgeReward(badgeDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(badgeDto.name);
      expect(result.badgeId).toBe(badgeDto.badgeId);
      expect(result.type).toBe(RewardType.BADGE);
    });

    // 아이템 리워드 생성 테스트 (한국어 이름과 수량)
    it('수량이 있는 아이템 리워드를 생성할 수 있어야 함', async () => {
      // Arrange
      const itemDto: CreateItemRewardDto = {
        name: '특별 아이템 선물',
        itemId: 'special-item-123',
        quantity: 5,
      };

      // Act
      const result = await service.createItemReward(itemDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(itemDto.name);
      expect(result.itemId).toBe(itemDto.itemId);
      expect(result.quantity).toBe(itemDto.quantity);
      expect(result.type).toBe(RewardType.ITEM);
    });

    // 리워드 목록 조회 및 필터링 테스트
    it('리워드 타입별로 필터링하여 조회할 수 있어야 함', async () => {
      // Arrange
      await service.createPointReward({
        name: '포인트 리워드 1',
        points: 100,
      });
      await service.createPointReward({
        name: '포인트 리워드 2',
        points: 200,
      });
      await service.createItemReward({
        name: '아이템 리워드',
        itemId: 'item-123',
        quantity: 1,
      });

      // Act
      const pointRewards = await service.getRewards({
        type: RewardType.POINT,
      });

      // Assert
      expect(pointRewards.rewards).toBeDefined();
      expect(pointRewards.rewards.length).toBe(2);
      expect(pointRewards.rewards[0].type).toBe(RewardType.POINT);
      expect(pointRewards.rewards[1].type).toBe(RewardType.POINT);
    });

    // 이름으로 리워드 검색 테스트
    it('이름으로 리워드를 검색할 수 있어야 함', async () => {
      // Arrange
      await service.createPointReward({
        name: '여름 특별 포인트',
        points: 300,
      });
      await service.createPointReward({
        name: '겨울 특별 포인트',
        points: 500,
      });
      await service.createPointReward({
        name: '신규 가입 포인트',
        points: 1000,
      });

      // Act
      const results = await service.getRewards({
        name: '특별',
      });

      // Assert
      expect(results.rewards).toBeDefined();
      expect(results.rewards.length).toBe(2);
      // 이름에 '특별'이 포함된 리워드만 반환되는지 확인
      expect(
        results.rewards.every((r) => r.name.includes('특별')),
      ).toBeTruthy();
    });
  });

  // 추가 테스트 케이스 - 이벤트와 리워드 연결 관련 시나리오 기반
  describe('이벤트-리워드 연결 관리 테스트', () => {
    // 다양한 유형의 리워드를 단일 이벤트에 추가 테스트
    it('한 이벤트에 다양한 유형의 리워드를 추가할 수 있어야 함', async () => {
      // Arrange
      const event = await eventService.createEvent({
        name: '신규 사용자 가입 이벤트',
        condition: { newUser: true },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 30 * 86400000).toISOString(), // 30일 후
        },
        status: EventStatus.ACTIVE,
      });

      // 여러 타입의 리워드 생성
      const pointReward = await service.createPointReward({
        name: '가입 축하 포인트',
        points: 1000,
      });

      const couponReward = await service.createCouponReward({
        name: '신규 가입자 할인 쿠폰',
        couponCode: 'NEWUSER2023',
        expiry: new Date(Date.now() + 60 * 86400000), // 60일 후
      });

      const badgeReward = await service.createBadgeReward({
        name: '신규 회원 배지',
        badgeId: 'new-member-badge',
      });

      // Act - 모든 리워드를 이벤트에 추가
      await service.addRewardToEvent({
        eventId: event._id.toString(),
        rewardId: pointReward._id.toString(),
      });

      await service.addRewardToEvent({
        eventId: event._id.toString(),
        rewardId: couponReward._id.toString(),
      });

      await service.addRewardToEvent({
        eventId: event._id.toString(),
        rewardId: badgeReward._id.toString(),
      });

      // 이벤트의 리워드 조회
      const eventRewards = await service.getRewardsByEventId({
        id: event._id.toString(),
      });

      // Assert
      expect(eventRewards).toBeDefined();
      expect(eventRewards.length).toBe(3);

      // 각 타입의 리워드가 존재하는지 확인
      const rewardTypes = eventRewards.map((r) => r.type);
      expect(rewardTypes).toContain(RewardType.POINT);
      expect(rewardTypes).toContain(RewardType.COUPON);
      expect(rewardTypes).toContain(RewardType.BADGE);
    });

    // 여러 이벤트에 동일한 리워드 추가 테스트
    it('동일한 리워드를 여러 이벤트에 추가할 수 있어야 함', async () => {
      // Arrange
      const reward = await service.createPointReward({
        name: '공통 포인트 리워드',
        points: 500,
      });

      // 여러 이벤트 생성
      const event1 = await eventService.createEvent({
        name: '여름 방학 이벤트',
        condition: { type: 'season', season: 'summer' },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      const event2 = await eventService.createEvent({
        name: '가을 시즌 이벤트',
        condition: { type: 'season', season: 'autumn' },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 60 * 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      // Act - 동일한 리워드를 두 이벤트에 추가
      await service.addRewardToEvent({
        eventId: event1._id.toString(),
        rewardId: reward._id.toString(),
      });

      await service.addRewardToEvent({
        eventId: event2._id.toString(),
        rewardId: reward._id.toString(),
      });

      // 각 이벤트의 리워드 조회
      const event1Rewards = await service.getRewardsByEventId({
        id: event1._id.toString(),
      });

      const event2Rewards = await service.getRewardsByEventId({
        id: event2._id.toString(),
      });

      // Assert
      expect(event1Rewards).toBeDefined();
      expect(event1Rewards.length).toBe(1);
      expect(event1Rewards[0]._id.toString()).toBe(reward._id.toString());

      expect(event2Rewards).toBeDefined();
      expect(event2Rewards.length).toBe(1);
      expect(event2Rewards[0]._id.toString()).toBe(reward._id.toString());
    });

    // 이벤트에서 리워드 제거 후 다시 추가 테스트
    it('이벤트에서 리워드를 제거한 후 다시 추가할 수 있어야 함', async () => {
      // Arrange
      const event = await eventService.createEvent({
        name: '테스트 이벤트',
        condition: { type: 'test' },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      const reward = await service.createPointReward({
        name: '테스트 포인트',
        points: 300,
      });

      // 리워드를 이벤트에 추가
      await service.addRewardToEvent({
        eventId: event._id.toString(),
        rewardId: reward._id.toString(),
      });

      // Act 1 - 리워드를 이벤트에서 제거
      await service.removeRewardFromEvent({
        eventId: event._id.toString(),
        rewardId: reward._id.toString(),
      });

      // 이벤트의 리워드 확인 - 제거 후
      const rewardsAfterRemove = await service.getRewardsByEventId({
        id: event._id.toString(),
      });

      // Act 2 - 리워드를 이벤트에 다시 추가
      await service.addRewardToEvent({
        eventId: event._id.toString(),
        rewardId: reward._id.toString(),
      });

      // 이벤트의 리워드 확인 - 다시 추가 후
      const rewardsAfterReAdd = await service.getRewardsByEventId({
        id: event._id.toString(),
      });

      // Assert
      expect(rewardsAfterRemove).toBeDefined();
      expect(rewardsAfterRemove.length).toBe(0);

      expect(rewardsAfterReAdd).toBeDefined();
      expect(rewardsAfterReAdd.length).toBe(1);
      expect(rewardsAfterReAdd[0]._id.toString()).toBe(reward._id.toString());
    });
  });

  // 추가 테스트 케이스 - 엣지 케이스 및 오류 시나리오
  describe('리워드 관리 엣지 케이스 테스트', () => {
    // 음수 포인트 처리 테스트
    it('음수 포인트를 가진.포인트 리워드를 생성해도 유효하게 처리되어야 함', async () => {
      // Arrange
      const negativePointsDto: CreatePointRewardDto = {
        name: '포인트 차감 패널티',
        points: -100,
      };

      // Act
      const result = await service.createPointReward(negativePointsDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.points).toBe(negativePointsDto.points);
      expect(result.points).toBeLessThan(0);
    });

    // 같은 이름의 여러 리워드 생성 테스트
    it('동일한 이름을 가진 여러 리워드를 생성할 수 있어야 함', async () => {
      // Arrange
      const name = '중복 이름 리워드';

      // Act
      const reward1 = await service.createPointReward({
        name,
        points: 100,
      });

      const reward2 = await service.createPointReward({
        name,
        points: 200,
      });

      // Assert
      expect(reward1).toBeDefined();
      expect(reward2).toBeDefined();
      expect(reward1.name).toBe(name);
      expect(reward2.name).toBe(name);
      expect(reward1._id.toString()).not.toBe(reward2._id.toString());
    });

    // 이벤트에 동일한 리워드 중복 추가 테스트
    it('이벤트에 이미 추가된 리워드를 다시 추가해도 오류가 발생하지 않아야 함', async () => {
      // Arrange
      const event = await eventService.createEvent({
        name: '중복 리워드 테스트 이벤트',
        condition: { type: 'test' },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      const reward = await service.createPointReward({
        name: '중복 추가 포인트',
        points: 300,
      });

      // 첫 번째 추가
      const firstAdd = await service.addRewardToEvent({
        eventId: event._id.toString(),
        rewardId: reward._id.toString(),
      });

      // Act - 두 번째 중복 추가
      const secondAdd = await service.addRewardToEvent({
        eventId: event._id.toString(),
        rewardId: reward._id.toString(),
      });

      // Assert
      expect(firstAdd).toBeDefined();
      expect(secondAdd).toBeDefined();
      expect(firstAdd._id.toString()).toBe(secondAdd._id.toString());

      // 중복 추가 후 이벤트의 리워드 개수 확인
      const eventRewards = await service.getRewardsByEventId({
        id: event._id.toString(),
      });
      expect(eventRewards.length).toBe(1);
    });

    // 존재하지 않는 이벤트-리워드 관계 제거 시도 테스트
    it('존재하지 않는 이벤트-리워드 관계 제거 시 NotFoundException 발생해야 함', async () => {
      // Arrange
      const event = await eventService.createEvent({
        name: '테스트 이벤트',
        condition: { type: 'test' },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      const reward = await service.createPointReward({
        name: '테스트 포인트',
        points: 300,
      });

      // Act & Assert - 연결되지 않은 이벤트-리워드 관계 제거 시도
      await expect(
        service.removeRewardFromEvent({
          eventId: event._id.toString(),
          rewardId: reward._id.toString(),
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
