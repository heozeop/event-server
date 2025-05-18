import {
  CreateRewardRequestDto,
  UpdateRewardRequestStatusDto,
} from '@libs/dtos';
import { EventStatus, RewardRequestStatus } from '@libs/enums';
import { MongoMemoryOrmModule } from '@libs/test';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RewardRequest } from '../../src/entities/reward-request.entity';
import { EventService } from '../../src/services/event.service';
import { RewardRequestService } from '../../src/services/reward-request.service';
import { TestAppModule } from '../test.app.module';

// Increase timeout for slow tests
jest.setTimeout(30000);

describe('RewardRequestService', () => {
  let service: RewardRequestService;
  let eventService: EventService;
  let orm: MikroORM;
  let mongoMemoryOrmModule: MongoMemoryOrmModule;

  beforeAll(async () => {
    try {
      mongoMemoryOrmModule = new MongoMemoryOrmModule();
      await mongoMemoryOrmModule.init('reward-request-test-db');

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestAppModule.forTest(mongoMemoryOrmModule)],
      }).compile();

      orm = moduleFixture.get<MikroORM>(MikroORM);
      service = moduleFixture.get<RewardRequestService>(RewardRequestService);
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

  describe('createRewardRequest', () => {
    it('should create a reward request for an active event', async () => {
      // Arrange
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 86400000);

      // Create an active event
      const event = await eventService.createEvent({
        name: 'Active Event',
        condition: { type: 'login' },
        periodStart: new Date(now.getTime() - 3600000), // 1 hour ago
        periodEnd: tomorrow,
        status: EventStatus.ACTIVE,
      });

      const dto: CreateRewardRequestDto = {
        userId: new ObjectId().toString(),
        eventId: event._id.toString(),
      };

      // Act
      const result = await service.createRewardRequest(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(dto.userId);
      expect(result.event._id.toString()).toBe(event._id.toString());
      expect(result.status).toBe(RewardRequestStatus.PENDING);

      // Verify in database
      const repository = orm.em.getRepository(RewardRequest);
      const savedRequest = await repository.findOne(
        { userId: new ObjectId(dto.userId), event: { _id: event._id } },
        { populate: ['event'] },
      );
      expect(savedRequest).toBeDefined();
      expect(savedRequest?.status).toBe(RewardRequestStatus.PENDING);
    });

    it('should throw BadRequestException if event is not active', async () => {
      // Arrange
      const event = await eventService.createEvent({
        name: 'Inactive Event',
        condition: { type: 'login' },
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.INACTIVE,
      });

      const dto: CreateRewardRequestDto = {
        userId: new ObjectId().toString(),
        eventId: event._id.toString(),
      };

      // Act & Assert
      await expect(service.createRewardRequest(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if event period has not started', async () => {
      // Arrange
      const tomorrow = new Date(Date.now() + 86400000);
      const dayAfterTomorrow = new Date(Date.now() + 172800000);

      // Event that starts tomorrow
      const event = await eventService.createEvent({
        name: 'Future Event',
        condition: { type: 'login' },
        periodStart: tomorrow,
        periodEnd: dayAfterTomorrow,
        status: EventStatus.ACTIVE,
      });

      const dto: CreateRewardRequestDto = {
        userId: new ObjectId().toString(),
        eventId: event._id.toString(),
      };

      // Act & Assert
      await expect(service.createRewardRequest(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if event period has ended', async () => {
      // Arrange
      const yesterday = new Date(Date.now() - 86400000);
      const twoDaysAgo = new Date(Date.now() - 172800000);

      // Event that ended yesterday
      const event = await eventService.createEvent({
        name: 'Past Event',
        condition: { type: 'login' },
        periodStart: twoDaysAgo,
        periodEnd: yesterday,
        status: EventStatus.ACTIVE,
      });

      const dto: CreateRewardRequestDto = {
        userId: new ObjectId().toString(),
        eventId: event._id.toString(),
      };

      // Act & Assert
      await expect(service.createRewardRequest(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if request already exists', async () => {
      // Arrange
      const event = await eventService.createEvent({
        name: 'Active Event',
        condition: { type: 'login' },
        periodStart: new Date(Date.now() - 3600000), // 1 hour ago
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      const dto: CreateRewardRequestDto = {
        userId: new ObjectId().toString(),
        eventId: event._id.toString(),
      };

      // Create initial request
      await service.createRewardRequest(dto);

      // Act & Assert - Try to create duplicate request
      await expect(service.createRewardRequest(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if event not found', async () => {
      // Arrange
      const dto: CreateRewardRequestDto = {
        userId: new ObjectId().toString(),
        eventId: new ObjectId().toString(),
      };

      // Act & Assert
      await expect(service.createRewardRequest(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getRewardRequestById', () => {
    it('should return a reward request by id', async () => {
      // Arrange
      // 1. Create an active event
      const event = await eventService.createEvent({
        name: 'Active Event',
        condition: { type: 'login' },
        periodStart: new Date(Date.now() - 3600000), // 1 hour ago
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      // 2. Create a reward request
      const dto: CreateRewardRequestDto = {
        userId: new ObjectId().toString(),
        eventId: event._id.toString(),
      };

      const rewardRequest = await service.createRewardRequest(dto);

      // Act
      const result = await service.getRewardRequestById({
        id: rewardRequest._id.toString(),
      });

      // Assert
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(rewardRequest._id.toString());
      expect(result.userId.toString()).toBe(dto.userId);
      expect(result.event._id.toString()).toBe(event._id.toString());
      expect(result.status).toBe(RewardRequestStatus.PENDING);
    });

    it('should throw NotFoundException if reward request not found', async () => {
      // Arrange
      const id = new ObjectId().toString();

      // Act & Assert
      await expect(service.getRewardRequestById({ id })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getRewardRequests', () => {
    it('should return filtered reward requests', async () => {
      // Arrange
      // 1. Create events
      const activeEvent = await eventService.createEvent({
        name: 'Active Event',
        condition: { type: 'login' },
        periodStart: new Date(Date.now() - 3600000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      const activeEvent2 = await eventService.createEvent({
        name: 'Active Event 2',
        condition: { type: 'purchase' },
        periodStart: new Date(Date.now() - 3600000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      // 2. Create users
      const userId1 = new ObjectId().toString();
      const userId2 = new ObjectId().toString();

      // 3. Create reward requests
      await service.createRewardRequest({
        userId: userId1,
        eventId: activeEvent._id.toString(),
      });

      const request2 = await service.createRewardRequest({
        userId: userId2,
        eventId: activeEvent._id.toString(),
      });

      await service.createRewardRequest({
        userId: userId1,
        eventId: activeEvent2._id.toString(),
      });

      // Act - Filter by userId
      const userResult = await service.getRewardRequests({ userId: userId1 });

      // Assert - User filter
      expect(userResult.requests.length).toBe(2);
      expect(userResult.total).toBe(2);

      // Act - Filter by eventId
      const eventResult = await service.getRewardRequests({
        eventId: activeEvent._id.toString(),
      });

      // Assert - Event filter
      expect(eventResult.requests.length).toBe(2);
      expect(eventResult.total).toBe(2);

      // Act - Filter by userId and eventId
      const combinedResult = await service.getRewardRequests({
        userId: userId2,
        eventId: activeEvent._id.toString(),
      });

      // Assert - Combined filter
      expect(combinedResult.requests.length).toBe(1);
      expect(combinedResult.total).toBe(1);
      expect(combinedResult.requests[0]._id.toString()).toBe(
        request2._id.toString(),
      );
    });

    it('should handle pagination with limit and offset', async () => {
      // Arrange
      // 1. Create an event
      const activeEvent = await eventService.createEvent({
        name: 'Active Event',
        condition: { type: 'login' },
        periodStart: new Date(Date.now() - 3600000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      // 2. Create multiple reward requests
      const requests: RewardRequest[] = [];
      for (let i = 0; i < 15; i++) {
        const userId = new ObjectId().toString();
        const request = await service.createRewardRequest({
          userId,
          eventId: activeEvent._id.toString(),
        });
        requests.push(request);
      }

      // Act - First page (limit 10, offset 0)
      const page1 = await service.getRewardRequests({
        limit: 10,
        offset: 0,
      });

      // Assert - First page
      expect(page1.requests.length).toBe(10);
      expect(page1.total).toBe(15);

      // Act - Second page (limit 10, offset 10)
      const page2 = await service.getRewardRequests({
        limit: 10,
        offset: 10,
      });

      // Assert - Second page
      expect(page2.requests.length).toBe(5);
      expect(page2.total).toBe(15);
    });

    it('should filter by status', async () => {
      // Arrange
      // 1. Create an event
      const activeEvent = await eventService.createEvent({
        name: 'Active Event',
        condition: { type: 'login' },
        periodStart: new Date(Date.now() - 3600000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      // 2. Create requests with different statuses
      const userId1 = new ObjectId().toString();
      const userId2 = new ObjectId().toString();
      const userId3 = new ObjectId().toString();

      // Pending request
      await service.createRewardRequest({
        userId: userId1,
        eventId: activeEvent._id.toString(),
      });

      // Approved request
      const approvedRequest = await service.createRewardRequest({
        userId: userId2,
        eventId: activeEvent._id.toString(),
      });
      await service.updateRewardRequestStatus({
        rewardRequestid: approvedRequest._id.toString(),
        status: RewardRequestStatus.APPROVED,
      });

      // Rejected request
      const rejectedRequest = await service.createRewardRequest({
        userId: userId3,
        eventId: activeEvent._id.toString(),
      });
      await service.updateRewardRequestStatus({
        rewardRequestid: rejectedRequest._id.toString(),
        status: RewardRequestStatus.REJECTED,
      });

      // Act - Filter by PENDING status
      const pendingResults = await service.getRewardRequests({
        status: RewardRequestStatus.PENDING,
      });

      // Assert - PENDING filter
      expect(pendingResults.requests.length).toBe(1);
      expect(pendingResults.requests[0].status).toBe(
        RewardRequestStatus.PENDING,
      );

      // Act - Filter by APPROVED status
      const approvedResults = await service.getRewardRequests({
        status: RewardRequestStatus.APPROVED,
      });

      // Assert - APPROVED filter
      expect(approvedResults.requests.length).toBe(1);
      expect(approvedResults.requests[0].status).toBe(
        RewardRequestStatus.APPROVED,
      );

      // Act - Filter by REJECTED status
      const rejectedResults = await service.getRewardRequests({
        status: RewardRequestStatus.REJECTED,
      });

      // Assert - REJECTED filter
      expect(rejectedResults.requests.length).toBe(1);
      expect(rejectedResults.requests[0].status).toBe(
        RewardRequestStatus.REJECTED,
      );
    });
  });

  describe('updateRewardRequestStatus', () => {
    it('should update a reward request status', async () => {
      // Arrange
      // 1. Create an event
      const event = await eventService.createEvent({
        name: 'Active Event',
        condition: { type: 'login' },
        periodStart: new Date(Date.now() - 3600000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      // 2. Create a reward request
      const userId = new ObjectId().toString();
      const rewardRequest = await service.createRewardRequest({
        userId,
        eventId: event._id.toString(),
      });

      // 3. Prepare update DTO
      const updateDto: UpdateRewardRequestStatusDto = {
        rewardRequestid: rewardRequest._id.toString(),
        status: RewardRequestStatus.APPROVED,
      };

      // Act
      const result = await service.updateRewardRequestStatus(updateDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe(RewardRequestStatus.APPROVED);

      // Verify in database
      const repository = orm.em.getRepository(RewardRequest);
      const updatedRequest = await repository.findOne({
        _id: rewardRequest._id,
      });
      expect(updatedRequest).toBeDefined();
      expect(updatedRequest?.status).toBe(RewardRequestStatus.APPROVED);
    });

    it('should throw BadRequestException if trying to update non-pending request', async () => {
      // Arrange
      // 1. Create an event
      const event = await eventService.createEvent({
        name: 'Active Event',
        condition: { type: 'login' },
        periodStart: new Date(Date.now() - 3600000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      // 2. Create a reward request
      const userId = new ObjectId().toString();
      const rewardRequest = await service.createRewardRequest({
        userId,
        eventId: event._id.toString(),
      });

      // 3. Update to APPROVED
      await service.updateRewardRequestStatus({
        rewardRequestid: rewardRequest._id.toString(),
        status: RewardRequestStatus.APPROVED,
      });

      // 4. Try to update again
      const updateDto: UpdateRewardRequestStatusDto = {
        rewardRequestid: rewardRequest._id.toString(),
        status: RewardRequestStatus.REJECTED,
      };

      // Act & Assert
      await expect(
        service.updateRewardRequestStatus(updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if reward request not found', async () => {
      // Arrange
      const updateDto: UpdateRewardRequestStatusDto = {
        rewardRequestid: new ObjectId().toString(),
        status: RewardRequestStatus.APPROVED,
      };

      // Act & Assert
      await expect(
        service.updateRewardRequestStatus(updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // 추가 테스트 케이스 - 사용자 시나리오 기반 (USER.md)
  describe('사용자 리워드 요청 테스트', () => {
    // 이벤트 리워드 요청 테스트
    it('사용자가 활성 이벤트에 대한 리워드 요청을 성공적으로 생성할 수 있어야 함', async () => {
      // Arrange
      const 사용자ID = new ObjectId().toString();
      const 현재시간 = new Date();
      const 이벤트종료일 = new Date(현재시간.getTime() + 7 * 86400000); // 7일 후

      // 활성 이벤트 생성
      const 이벤트 = await eventService.createEvent({
        name: '신규 사용자 가입 이벤트',
        condition: { newUser: true },
        periodStart: new Date(현재시간.getTime() - 86400000), // 1일 전 시작
        periodEnd: 이벤트종료일,
        status: EventStatus.ACTIVE,
      });

      // Act
      const 결과 = await service.createRewardRequest({
        userId: 사용자ID,
        eventId: 이벤트._id.toString(),
      });

      // Assert
      expect(결과).toBeDefined();
      expect(결과.userId.toString()).toBe(사용자ID);
      expect(결과.event._id.toString()).toBe(이벤트._id.toString());
      expect(결과.status).toBe(RewardRequestStatus.PENDING);
    });

    // 사용자의 리워드 요청 목록 조회 테스트
    it('사용자가 자신의 리워드 요청 목록을 조회할 수 있어야 함', async () => {
      // Arrange
      const 사용자ID = new ObjectId().toString();
      const 다른사용자ID = new ObjectId().toString();

      // 이벤트 생성
      const 이벤트1 = await eventService.createEvent({
        name: '여름 이벤트',
        condition: { season: 'summer' },
        periodStart: new Date(Date.now() - 86400000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      const 이벤트2 = await eventService.createEvent({
        name: '가을 이벤트',
        condition: { season: 'autumn' },
        periodStart: new Date(Date.now() - 86400000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      // 사용자의 리워드 요청 생성
      await service.createRewardRequest({
        userId: 사용자ID,
        eventId: 이벤트1._id.toString(),
      });

      await service.createRewardRequest({
        userId: 사용자ID,
        eventId: 이벤트2._id.toString(),
      });

      // 다른 사용자의 리워드 요청 생성
      await service.createRewardRequest({
        userId: 다른사용자ID,
        eventId: 이벤트1._id.toString(),
      });

      // Act
      const 결과 = await service.getRewardRequests({ userId: 사용자ID });

      // Assert
      expect(결과.requests).toBeDefined();
      expect(결과.requests.length).toBe(2);
      expect(결과.total).toBe(2);
      // 모든 요청이 해당 사용자의 것인지 확인
      결과.requests.forEach((요청) => {
        expect(요청.userId.toString()).toBe(사용자ID);
      });
    });

    // 이벤트 기간 제한 테스트
    it('이벤트 기간이 종료된 후에는 리워드 요청이 거부되어야 함', async () => {
      // Arrange
      const 사용자ID = new ObjectId().toString();
      const 현재시간 = new Date();
      const 이벤트시작일 = new Date(현재시간.getTime() - 14 * 86400000); // 14일 전
      const 이벤트종료일 = new Date(현재시간.getTime() - 7 * 86400000); // 7일 전 종료

      // 이미 종료된 이벤트 생성
      const 이벤트 = await eventService.createEvent({
        name: '종료된 이벤트',
        condition: { type: 'any' },
        periodStart: 이벤트시작일,
        periodEnd: 이벤트종료일,
        status: EventStatus.ACTIVE,
      });

      // Act & Assert
      await expect(
        service.createRewardRequest({
          userId: 사용자ID,
          eventId: 이벤트._id.toString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    // 중복 요청 방지 테스트
    it('사용자가 동일한 이벤트에 중복 리워드 요청시 ConflictException이 발생해야 함', async () => {
      // Arrange
      const 사용자ID = new ObjectId().toString();

      // 이벤트 생성
      const 이벤트 = await eventService.createEvent({
        name: '중복 요청 테스트 이벤트',
        condition: { type: 'any' },
        periodStart: new Date(Date.now() - 86400000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      // 첫 번째 요청 생성
      await service.createRewardRequest({
        userId: 사용자ID,
        eventId: 이벤트._id.toString(),
      });

      // Act & Assert
      await expect(
        service.createRewardRequest({
          userId: 사용자ID,
          eventId: 이벤트._id.toString(),
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // 추가 테스트 케이스 - 관리자/감사자 시나리오 기반 (ADMIN.md & AUDITOR.md)
  describe('관리자 및 감사자 리워드 요청 관리 테스트', () => {
    // 상태별 리워드 요청 조회 테스트
    it('관리자가 상태별로 리워드 요청을 필터링하여 조회할 수 있어야 함', async () => {
      // Arrange
      // 활성 이벤트 생성
      const 이벤트 = await eventService.createEvent({
        name: '상태 필터 테스트 이벤트',
        condition: { type: 'any' },
        periodStart: new Date(Date.now() - 86400000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      // 다양한 상태의 리워드 요청 생성
      const 대기요청 = await service.createRewardRequest({
        userId: new ObjectId().toString(),
        eventId: 이벤트._id.toString(),
      });

      const 승인요청 = await service.createRewardRequest({
        userId: new ObjectId().toString(),
        eventId: 이벤트._id.toString(),
      });
      await service.updateRewardRequestStatus({
        rewardRequestid: 승인요청._id.toString(),
        status: RewardRequestStatus.APPROVED,
      });

      const 거절요청 = await service.createRewardRequest({
        userId: new ObjectId().toString(),
        eventId: 이벤트._id.toString(),
      });
      await service.updateRewardRequestStatus({
        rewardRequestid: 거절요청._id.toString(),
        status: RewardRequestStatus.REJECTED,
      });

      // Act - 대기중 요청 조회
      const 대기중결과 = await service.getRewardRequests({
        status: RewardRequestStatus.PENDING,
      });

      // Act - 승인된 요청 조회
      const 승인결과 = await service.getRewardRequests({
        status: RewardRequestStatus.APPROVED,
      });

      // Act - 거절된 요청 조회
      const 거절결과 = await service.getRewardRequests({
        status: RewardRequestStatus.REJECTED,
      });

      // Assert
      expect(대기중결과.requests.length).toBe(1);
      expect(대기중결과.requests[0]._id.toString()).toBe(
        대기요청._id.toString(),
      );

      expect(승인결과.requests.length).toBe(1);
      expect(승인결과.requests[0]._id.toString()).toBe(승인요청._id.toString());

      expect(거절결과.requests.length).toBe(1);
      expect(거절결과.requests[0]._id.toString()).toBe(거절요청._id.toString());
    });

    // 특정 이벤트의 리워드 요청 조회 테스트
    it('특정 이벤트에 대한 모든 리워드 요청을 조회할 수 있어야 함', async () => {
      // Arrange
      // 여러 이벤트 생성
      const 이벤트1 = await eventService.createEvent({
        name: '이벤트 필터 테스트 1',
        condition: { type: 'any' },
        periodStart: new Date(Date.now() - 86400000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      const 이벤트2 = await eventService.createEvent({
        name: '이벤트 필터 테스트 2',
        condition: { type: 'any' },
        periodStart: new Date(Date.now() - 86400000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      // 여러 사용자의 리워드 요청 생성
      await service.createRewardRequest({
        userId: new ObjectId().toString(),
        eventId: 이벤트1._id.toString(),
      });

      await service.createRewardRequest({
        userId: new ObjectId().toString(),
        eventId: 이벤트1._id.toString(),
      });

      await service.createRewardRequest({
        userId: new ObjectId().toString(),
        eventId: 이벤트1._id.toString(),
      });

      await service.createRewardRequest({
        userId: new ObjectId().toString(),
        eventId: 이벤트2._id.toString(),
      });

      // Act
      const 결과 = await service.getRewardRequests({
        eventId: 이벤트1._id.toString(),
      });

      // Assert
      expect(결과.requests.length).toBe(3);
      expect(결과.total).toBe(3);
      // 모든 요청이 해당 이벤트에 대한 것인지 확인
      결과.requests.forEach((요청) => {
        expect(요청.event._id.toString()).toBe(이벤트1._id.toString());
      });
    });
  });

  // 추가 테스트 케이스 - 운영자 시나리오 기반 (OPERATOR.md)
  describe('운영자 리워드 요청 처리 테스트', () => {
    // 리워드 요청 승인 테스트
    it('운영자가 대기 중인 리워드 요청을 승인할 수 있어야 함', async () => {
      // Arrange
      // 활성 이벤트 생성
      const 이벤트 = await eventService.createEvent({
        name: '승인 테스트 이벤트',
        condition: { type: 'any' },
        periodStart: new Date(Date.now() - 86400000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      // 리워드 요청 생성
      const 요청 = await service.createRewardRequest({
        userId: new ObjectId().toString(),
        eventId: 이벤트._id.toString(),
      });

      // Act
      const 결과 = await service.updateRewardRequestStatus({
        rewardRequestid: 요청._id.toString(),
        status: RewardRequestStatus.APPROVED,
      });

      // Assert
      expect(결과).toBeDefined();
      expect(결과.status).toBe(RewardRequestStatus.APPROVED);

      // 데이터베이스에 반영되었는지 확인
      const repository = orm.em.getRepository(RewardRequest);
      const 업데이트된요청 = await repository.findOne({ _id: 요청._id });
      expect(업데이트된요청).toBeDefined();
      expect(업데이트된요청?.status).toBe(RewardRequestStatus.APPROVED);
    });

    // 리워드 요청 거절 테스트
    it('운영자가 대기 중인 리워드 요청을 거절할 수 있어야 함', async () => {
      // Arrange
      // 활성 이벤트 생성
      const 이벤트 = await eventService.createEvent({
        name: '거절 테스트 이벤트',
        condition: { type: 'any' },
        periodStart: new Date(Date.now() - 86400000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      // 리워드 요청 생성
      const 요청 = await service.createRewardRequest({
        userId: new ObjectId().toString(),
        eventId: 이벤트._id.toString(),
      });

      // Act
      const 결과 = await service.updateRewardRequestStatus({
        rewardRequestid: 요청._id.toString(),
        status: RewardRequestStatus.REJECTED,
      });

      // Assert
      expect(결과).toBeDefined();
      expect(결과.status).toBe(RewardRequestStatus.REJECTED);

      // 데이터베이스에 반영되었는지 확인
      const repository = orm.em.getRepository(RewardRequest);
      const 업데이트된요청 = await repository.findOne({ _id: 요청._id });
      expect(업데이트된요청).toBeDefined();
      expect(업데이트된요청?.status).toBe(RewardRequestStatus.REJECTED);
    });

    // 이미 처리된 요청 재처리 방지 테스트
    it('이미 처리된 리워드 요청의 상태를 변경할 수 없어야 함', async () => {
      // Arrange
      // 활성 이벤트 생성
      const 이벤트 = await eventService.createEvent({
        name: '중복 처리 방지 테스트 이벤트',
        condition: { type: 'any' },
        periodStart: new Date(Date.now() - 86400000),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
      });

      // 리워드 요청 생성 및 승인
      const 요청 = await service.createRewardRequest({
        userId: new ObjectId().toString(),
        eventId: 이벤트._id.toString(),
      });

      await service.updateRewardRequestStatus({
        rewardRequestid: 요청._id.toString(),
        status: RewardRequestStatus.APPROVED,
      });

      // Act & Assert
      await expect(
        service.updateRewardRequestStatus({
          rewardRequestid: 요청._id.toString(),
          status: RewardRequestStatus.REJECTED,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
