import { CreateEventDto } from '@libs/dtos';
import { EventStatus } from '@libs/enums';
import { MongoMemoryOrmModule } from '@libs/test';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Event } from '../../src/entities/event.entity';
import { EventService } from '../../src/services/event.service';
import { TestAppModule } from '../test.app.module';

// Increase timeout for slow tests
jest.setTimeout(30000);

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
        condition: { type: 'login' },
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 86400000).toISOString(),
        },
        status: EventStatus.ACTIVE,
      };

      // Act
      const result = await service.createEvent(createEventDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(createEventDto.name);
      expect(result.condition).toEqual(createEventDto.condition);
      expect(result.status).toBe(createEventDto.status);
    });
  });

  describe('getEventById', () => {
    it('should return an event by id', async () => {
      // Arrange
      const eventRepository = orm.em.getRepository(Event);
      const event = eventRepository.create({
        name: 'Test Event',
        condition: { type: 'login' },
        period: {
          start: new Date(),
          end: new Date(Date.now() + 86400000),
        },
        status: EventStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await eventRepository.create(event);
      await eventRepository.getEntityManager().flush();

      // Act
      const result = await service.getEventById(event._id.toString());

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(event.name);
    });

    it('should throw NotFoundException if event not found', async () => {
      // Arrange
      const id = new ObjectId().toString();

      // Act & Assert
      await expect(service.getEventById(id)).rejects.toThrow(NotFoundException);
    });
  });
});
