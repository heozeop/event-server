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
        period: {
          start: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
          end: tomorrow.toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      const userId = new ObjectId().toString();
      const dto: CreateRewardRequestDto = {
        eventId: event._id.toString(),
      };

      // Act
      const result = await service.createRewardRequest(userId, dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId.toString()).toBe(userId);
      expect(result.event._id.toString()).toBe(event._id.toString());
      expect(result.status).toBe(RewardRequestStatus.PENDING);

      // Verify in database
      const repository = orm.em.getRepository(RewardRequest);
      const savedRequest = await repository.findOne(
        { userId: new ObjectId(userId), event: { _id: event._id } },
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
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.INACTIVE,
      });

      const userId = new ObjectId().toString();
      const dto: CreateRewardRequestDto = {
        eventId: event._id.toString(),
      };

      // Act & Assert
      await expect(service.createRewardRequest(userId, dto)).rejects.toThrow(
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
        period: {
          start: tomorrow.toISOString(),
          end: dayAfterTomorrow.toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      const userId = new ObjectId().toString();
      const dto: CreateRewardRequestDto = {
        eventId: event._id.toString(),
      };

      // Act & Assert
      await expect(service.createRewardRequest(userId, dto)).rejects.toThrow(
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
        period: {
          start: twoDaysAgo.toISOString(),
          end: yesterday.toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      const userId = new ObjectId().toString();
      const dto: CreateRewardRequestDto = {
        eventId: event._id.toString(),
      };

      // Act & Assert
      await expect(service.createRewardRequest(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if request already exists', async () => {
      // Arrange
      const event = await eventService.createEvent({
        name: 'Active Event',
        condition: { type: 'login' },
        period: {
          start: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      const userId = new ObjectId().toString();
      const dto: CreateRewardRequestDto = {
        eventId: event._id.toString(),
      };

      // Create initial request
      await service.createRewardRequest(userId, dto);

      // Act & Assert - Try to create duplicate request
      await expect(service.createRewardRequest(userId, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if event not found', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      const dto: CreateRewardRequestDto = {
        eventId: new ObjectId().toString(),
      };

      // Act & Assert
      await expect(service.createRewardRequest(userId, dto)).rejects.toThrow(
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
        period: {
          start: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      // 2. Create a reward request
      const userId = new ObjectId().toString();
      const rewardRequest = await service.createRewardRequest(userId, {
        eventId: event._id.toString(),
      });

      // Act
      const result = await service.getRewardRequestById(
        rewardRequest._id.toString(),
      );

      // Assert
      expect(result).toBeDefined();
      expect(result._id.toString()).toBe(rewardRequest._id.toString());
      expect(result.userId.toString()).toBe(userId);
      expect(result.event._id.toString()).toBe(event._id.toString());
      expect(result.status).toBe(RewardRequestStatus.PENDING);
    });

    it('should throw NotFoundException if reward request not found', async () => {
      // Arrange
      const id = new ObjectId().toString();

      // Act & Assert
      await expect(service.getRewardRequestById(id)).rejects.toThrow(
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
        period: {
          start: new Date(Date.now() - 3600000).toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      const activeEvent2 = await eventService.createEvent({
        name: 'Active Event 2',
        condition: { type: 'purchase' },
        period: {
          start: new Date(Date.now() - 3600000).toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      // 2. Create users
      const userId1 = new ObjectId().toString();
      const userId2 = new ObjectId().toString();

      // 3. Create reward requests
      await service.createRewardRequest(userId1, {
        eventId: activeEvent._id.toString(),
      });

      const request2 = await service.createRewardRequest(userId2, {
        eventId: activeEvent._id.toString(),
      });

      await service.createRewardRequest(userId1, {
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
        period: {
          start: new Date(Date.now() - 3600000).toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      // 2. Create multiple reward requests
      const requests: RewardRequest[] = [];
      for (let i = 0; i < 15; i++) {
        const userId = new ObjectId().toString();
        const request = await service.createRewardRequest(userId, {
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
        period: {
          start: new Date(Date.now() - 3600000).toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      // 2. Create requests with different statuses
      const userId1 = new ObjectId().toString();
      const userId2 = new ObjectId().toString();
      const userId3 = new ObjectId().toString();

      // Pending request
      await service.createRewardRequest(userId1, {
        eventId: activeEvent._id.toString(),
      });

      // Approved request
      const approvedRequest = await service.createRewardRequest(userId2, {
        eventId: activeEvent._id.toString(),
      });
      await service.updateRewardRequestStatus(approvedRequest._id.toString(), {
        status: RewardRequestStatus.APPROVED,
      });

      // Rejected request
      const rejectedRequest = await service.createRewardRequest(userId3, {
        eventId: activeEvent._id.toString(),
      });
      await service.updateRewardRequestStatus(rejectedRequest._id.toString(), {
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
        period: {
          start: new Date(Date.now() - 3600000).toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      // 2. Create a reward request
      const userId = new ObjectId().toString();
      const rewardRequest = await service.createRewardRequest(userId, {
        eventId: event._id.toString(),
      });

      // 3. Prepare update DTO
      const updateDto: UpdateRewardRequestStatusDto = {
        status: RewardRequestStatus.APPROVED,
      };

      // Act
      const result = await service.updateRewardRequestStatus(
        rewardRequest._id.toString(),
        updateDto,
      );

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
        period: {
          start: new Date(Date.now() - 3600000).toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      });

      // 2. Create a reward request
      const userId = new ObjectId().toString();
      const rewardRequest = await service.createRewardRequest(userId, {
        eventId: event._id.toString(),
      });

      // 3. Update to APPROVED
      await service.updateRewardRequestStatus(rewardRequest._id.toString(), {
        status: RewardRequestStatus.APPROVED,
      });

      // 4. Try to update again
      const updateDto: UpdateRewardRequestStatusDto = {
        status: RewardRequestStatus.REJECTED,
      };

      // Act & Assert
      await expect(
        service.updateRewardRequestStatus(
          rewardRequest._id.toString(),
          updateDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if reward request not found', async () => {
      // Arrange
      const updateDto: UpdateRewardRequestStatusDto = {
        status: RewardRequestStatus.APPROVED,
      };

      // Act & Assert
      await expect(
        service.updateRewardRequestStatus(new ObjectId().toString(), updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
