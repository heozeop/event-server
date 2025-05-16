import { EVENT_CMP } from '@libs/cmd';
import { INestApplication } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { MockJwtAuthGuard, MockRolesGuard, setupTestApp } from './test-utils';

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test';

describe('EventController (e2e)', () => {
  let app: INestApplication;
  let eventClientMock: Partial<ClientProxy>;

  beforeEach(async () => {
    // Create mock for the event client microservice
    eventClientMock = {
      send: jest.fn().mockImplementation((pattern, payload) => {
        // Mock responses based on pattern
        if (pattern.cmd === EVENT_CMP.CREATE_EVENT) {
          console.log('Mocking CREATE_EVENT response for:', payload);
          return of({
            id: '1',
            name: payload.name,
            condition: payload.condition,
            period: payload.period,
            status: payload.status,
          });
        }

        if (pattern.cmd === EVENT_CMP.GET_EVENTS) {
          console.log('Mocking GET_EVENTS response');
          return of([
            {
              id: '1',
              name: 'Test Event',
              condition: {},
              period: {
                start: new Date(),
                end: new Date(Date.now() + 86400000),
              },
              status: 'ACTIVE',
            },
          ]);
        }

        if (pattern.cmd === EVENT_CMP.CREATE_REWARD) {
          console.log('Mocking CREATE_REWARD response for:', payload);
          return of({
            id: '1',
            type: payload.type,
            ...payload.rewardData,
          });
        }

        if (pattern.cmd === EVENT_CMP.CREATE_REWARD_REQUEST) {
          console.log('Mocking CREATE_REWARD_REQUEST response for:', payload);
          return of({
            id: '1',
            userId: payload.userId,
            eventId: payload.eventId,
            status: 'PENDING',
            createdAt: new Date(),
          });
        }

        if (pattern.cmd === EVENT_CMP.GET_REWARD_REQUESTS) {
          console.log('Mocking GET_REWARD_REQUESTS response');
          return of([
            {
              id: '1',
              userId: '1',
              eventId: '1',
              status: 'PENDING',
              createdAt: new Date(),
            },
          ]);
        }

        return of({});
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('EVENT_SERVICE')
      .useValue(eventClientMock)
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    setupTestApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // Smoke test
  describe('/event/test (GET)', () => {
    it('should return OK from the test endpoint', () => {
      return request(app.getHttpServer())
        .get('/test')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('service', 'event');
        });
    });
  });

  describe('/events (POST)', () => {
    it('should create a new event', () => {
      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'Test Event',
          condition: {},
          period: {
            start: new Date(),
            end: new Date(Date.now() + 86400000),
          },
          status: 'ACTIVE',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'Test Event');
          expect(res.body).toHaveProperty('status', 'ACTIVE');
        });
    });
  });

  describe('/events (GET)', () => {
    it('should return a list of events', () => {
      return request(app.getHttpServer())
        .get('/events')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('status');
        });
    });
  });

  describe('/rewards/:type (POST)', () => {
    it('should create a new point reward', () => {
      return request(app.getHttpServer())
        .post('/rewards/point')
        .set('Authorization', 'Bearer test-token')
        .send({
          points: 100,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('type', 'point');
          expect(res.body).toHaveProperty('points', 100);
        });
    });
  });

  describe('/events/:eventId/request (POST)', () => {
    it('should create a reward request', () => {
      return request(app.getHttpServer())
        .post('/events/1/request')
        .set('Authorization', 'Bearer test-token')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('userId');
          expect(res.body).toHaveProperty('eventId', '1');
          expect(res.body).toHaveProperty('status', 'PENDING');
        });
    });
  });

  describe('/events/requests (GET)', () => {
    it('should return a list of reward requests', () => {
      return request(app.getHttpServer())
        .get('/events/requests')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('userId');
          expect(res.body[0]).toHaveProperty('eventId');
          expect(res.body[0]).toHaveProperty('status');
        });
    });
  });
});
