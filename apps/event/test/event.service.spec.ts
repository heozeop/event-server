import { CreateEventDto } from '@libs/dtos';
import { EventStatus } from '@libs/enums';
import { MongoMemoryOrmModule } from '@libs/test';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Event } from '../src/entities/event.entity';
import { EventService } from '../src/services/event.service';
import { TestAppModule } from './modules/test.app.module';
describe('EventService', () => {
  let service: EventService;
  let orm: MikroORM;
  let mongoMemoryOrmModule: MongoMemoryOrmModule;

  beforeAll(async () => {
    try {
      mongoMemoryOrmModule = new MongoMemoryOrmModule();
      await mongoMemoryOrmModule.init('event-test-db');

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestAppModule.forTest(mongoMemoryOrmModule)],
      }).compile();

      orm = moduleFixture.get<MikroORM>(MikroORM);
      service = moduleFixture.get<EventService>(EventService);

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

  describe('createEvent', () => {
    it('should create a new event', async () => {
      // Arrange
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
        rewardCondition: { type: 'login' },
      };

      // Act
      const result = await service.createEvent(createEventDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(createEventDto.name);
      expect(result.status).toBe(createEventDto.status);
    });
  });

  describe('getEventById', () => {
    it('should return an event by id', async () => {
      // Arrange
      const eventRepository = orm.em.getRepository(Event);
      const event = eventRepository.create({
        name: 'Test Event',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        rewardCondition: { type: 'login' },
      });

      await eventRepository.getEntityManager().persistAndFlush(event);

      // Act
      const result = await service.getEventById({ id: event._id.toString() });

      // Assert
      expect(result).toBeDefined();
      expect(result.event).toBeDefined();
      expect(result.event.name).toBe(event.name);
      expect(result.eventRewards).toBeDefined();
    });

    it('should throw NotFoundException if event not found', async () => {
      // Arrange
      const id = new ObjectId().toString();

      // Act & Assert
      await expect(service.getEventById({ id })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('isEventExist', () => {
    it('should return true if event exists', async () => {
      // Arrange
      const eventRepository = orm.em.getRepository(Event);
      const event = eventRepository.create({
        name: 'Test Event',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        rewardCondition: { type: 'login' },
      });

      await eventRepository.getEntityManager().persistAndFlush(event);

      // Act
      const result = await service.isEventExist({ id: event._id.toString() });

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if event does not exist', async () => {
      // Arrange
      const id = new ObjectId().toString();

      // Act
      const result = await service.isEventExist({ id });

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getEvents', () => {
    // 기본 이벤트 목록 조회 테스트
    it('이벤트 목록을 기본 설정으로 조회할 수 있어야 함', async () => {
      // Arrange
      const eventRepository = orm.em.getRepository(Event);
      const events = [
        eventRepository.create({
          name: '이벤트 1',
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 86400000),
          status: EventStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          rewardCondition: { type: 'login' },
        }),
        eventRepository.create({
          name: '이벤트 2',
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 86400000),
          status: EventStatus.INACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          rewardCondition: { type: 'signup' },
        }),
      ];

      await eventRepository.getEntityManager().persistAndFlush(events);

      // Act
      const result = await service.getEvents({});

      // Assert
      expect(result.events).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    // 상태별 이벤트 조회 테스트
    it('특정 상태의 이벤트만 조회할 수 있어야 함', async () => {
      // Arrange
      const eventRepository = orm.em.getRepository(Event);
      const events = [
        eventRepository.create({
          name: '활성 이벤트',
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 86400000),
          status: EventStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          rewardCondition: { type: 'login' },
        }),
        eventRepository.create({
          name: '비활성 이벤트',
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 86400000),
          status: EventStatus.INACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          rewardCondition: { type: 'signup' },
        }),
      ];

      await eventRepository.getEntityManager().persistAndFlush(events);

      // Act
      const result = await service.getEvents({ status: EventStatus.ACTIVE });

      // Assert
      expect(result.events).toHaveLength(1);
      expect(result.events[0].name).toBe('활성 이벤트');
      expect(result.total).toBe(1);
    });

    // 현재 진행 중인 이벤트 조회 테스트
    it('현재 기간 내에 있는 이벤트만 조회할 수 있어야 함', async () => {
      // Arrange
      const eventRepository = orm.em.getRepository(Event);
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const tomorrow = new Date(now.getTime() + 86400000);
      const nextWeek = new Date(now.getTime() + 7 * 86400000);
      const lastWeek = new Date(now.getTime() - 7 * 86400000);

      const events = [
        // 현재 진행 중인 이벤트
        eventRepository.create({
          name: '진행 중 이벤트',
          periodStart: yesterday,
          periodEnd: tomorrow,
          status: EventStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          rewardCondition: { type: 'login' },
        }),
        // 미래 이벤트
        eventRepository.create({
          name: '미래 이벤트',
          periodStart: tomorrow,
          periodEnd: nextWeek,
          status: EventStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          rewardCondition: { type: 'signup' },
        }),
        // 지난 이벤트
        eventRepository.create({
          name: '지난 이벤트',
          periodStart: lastWeek,
          periodEnd: yesterday,
          status: EventStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          rewardCondition: { type: 'signup' },
        }),
      ];

      await eventRepository.getEntityManager().persistAndFlush(events);

      // Act
      const result = await service.getEvents({ inPeriod: true });

      // Assert
      expect(result.events).toHaveLength(1);
      expect(result.events[0].name).toBe('진행 중 이벤트');
      expect(result.total).toBe(1);
    });

    // 이름으로 이벤트 검색 테스트
    it('이벤트 이름으로 검색할 수 있어야 함', async () => {
      // Arrange
      const eventRepository = orm.em.getRepository(Event);
      const events = [
        eventRepository.create({
          name: '여름 방학 특별 이벤트',
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 86400000),
          status: EventStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          rewardCondition: { type: 'login' },
        }),
        eventRepository.create({
          name: '겨울 방학 특별 이벤트',
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 86400000),
          status: EventStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          rewardCondition: { type: 'signup' },
        }),
        eventRepository.create({
          name: '신규 가입 이벤트',
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 86400000),
          status: EventStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          rewardCondition: { type: 'signup' },
        }),
      ];

      await eventRepository.getEntityManager().persistAndFlush(events);

      // Act
      const result = await service.getEvents({ name: '방학' });

      // Assert
      expect(result.events).toHaveLength(2);
      expect(
        result.events.some((e) => e.name === '여름 방학 특별 이벤트'),
      ).toBeTruthy();
      expect(
        result.events.some((e) => e.name === '겨울 방학 특별 이벤트'),
      ).toBeTruthy();
      expect(result.total).toBe(2);
    });

    // 페이지네이션 테스트
    it('페이지네이션이 올바르게 작동해야 함', async () => {
      // Arrange
      const eventRepository = orm.em.getRepository(Event);
      const events = Array.from({ length: 15 }, (_, i) =>
        eventRepository.create({
          name: `이벤트 ${i + 1}`,
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 86400000),
          status: EventStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          rewardCondition: { type: 'login' },
        }),
      );

      await eventRepository.getEntityManager().persistAndFlush(events);

      // Act - 첫 번째 페이지 (5개)
      const firstPage = await service.getEvents({ limit: 5 });
      // Act - 두 번째 페이지 (5개)
      const secondPage = await service.getEvents({
        limit: 5,
        cursor: firstPage.nextCursor,
      });

      // Assert
      expect(firstPage.events).toHaveLength(5);
      expect(secondPage.events).toHaveLength(5);
      expect(firstPage.total).toBe(15);
      expect(secondPage.total).toBe(15);

      // 첫 번째와 두 번째 페이지의 이벤트가 중복되지 않는지 확인
      const firstPageIds = firstPage.events.map((e) => e._id?.toString() || '');

      // Safely extract IDs from the second page
      const secondPageIds: string[] = [];
      if (secondPage && secondPage.events) {
        for (const event of secondPage.events) {
          if (event && event._id) {
            secondPageIds.push(event._id.toString());
          }
        }
      }

      const intersection = firstPageIds.filter(
        (id) => id && secondPageIds.includes(id),
      );
      expect(intersection).toHaveLength(0);
    });
  });

  describe('updateEvent', () => {
    // 이벤트 이름 업데이트 테스트
    it('이벤트 이름을 성공적으로 업데이트할 수 있어야 함', async () => {
      // Arrange
      const eventRepository = orm.em.getRepository(Event);
      const event = eventRepository.create({
        name: '원래 이벤트 이름',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        rewardCondition: { type: 'login' },
      });

      await eventRepository.getEntityManager().persistAndFlush(event);

      // Act
      const updatedEvent = await service.updateEvent({
        id: event._id.toString(),
        name: '변경된 이벤트 이름',
      });

      // Assert
      expect(updatedEvent.name).toBe('변경된 이벤트 이름');
    });

    // 이벤트 상태 업데이트 테스트
    it('이벤트 상태를 성공적으로 업데이트할 수 있어야 함', async () => {
      // Arrange
      const eventRepository = orm.em.getRepository(Event);
      const event = eventRepository.create({
        name: '테스트 이벤트',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        rewardCondition: { type: 'login' },
      });

      await eventRepository.getEntityManager().persistAndFlush(event);

      // Act
      const updatedEvent = await service.updateEvent({
        id: event._id.toString(),
        status: EventStatus.INACTIVE,
      });

      // Assert
      expect(updatedEvent.status).toBe(EventStatus.INACTIVE);
    });

    // 이벤트 기간 업데이트 테스트
    it('이벤트 기간을 성공적으로 업데이트할 수 있어야 함', async () => {
      // Arrange
      const eventRepository = orm.em.getRepository(Event);
      const event = eventRepository.create({
        name: '테스트 이벤트',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        rewardCondition: { type: 'login' },
      });

      await eventRepository.getEntityManager().persistAndFlush(event);

      // 새 기간 설정
      const newStart = new Date(Date.now() + 2 * 86400000);
      const newEnd = new Date(Date.now() + 10 * 86400000);

      // Act
      const updatedEvent = await service.updateEvent({
        id: event._id.toString(),
        periodStart: newStart,
        periodEnd: newEnd,
      });

      // Assert
      expect(updatedEvent.periodStart.toISOString()).toBe(
        newStart.toISOString(),
      );
      expect(updatedEvent.periodEnd?.toISOString()).toBe(newEnd.toISOString());
    });

    // 존재하지 않는 이벤트 업데이트 시도 테스트
    it('존재하지 않는 이벤트를 업데이트할 때 NotFoundException을 발생시켜야 함', async () => {
      // Arrange
      const nonExistentId = new ObjectId().toString();

      // Act & Assert
      await expect(
        service.updateEvent({
          id: nonExistentId,
          name: '새 이름',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEvent', () => {
    // 이벤트 삭제 테스트
    it('이벤트를 성공적으로 삭제할 수 있어야 함', async () => {
      // Arrange
      const eventRepository = orm.em.getRepository(Event);
      const event = eventRepository.create({
        name: '삭제할 이벤트',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 86400000),
        status: EventStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        rewardCondition: { type: 'login' },
      });

      await eventRepository.getEntityManager().persistAndFlush(event);
      const eventId = event._id.toString();

      // Act
      await service.deleteEvent({ id: eventId });

      // Assert
      const deletedEvent = await eventRepository.findOne({
        _id: new ObjectId(eventId),
      });
      expect(deletedEvent).toBeNull();
    });

    // 존재하지 않는 이벤트 삭제 시도 테스트
    it('존재하지 않는 이벤트를 삭제할 때 NotFoundException을 발생시켜야 함', async () => {
      // Arrange
      const nonExistentId = new ObjectId().toString();

      // Act & Assert
      await expect(service.deleteEvent({ id: nonExistentId })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
