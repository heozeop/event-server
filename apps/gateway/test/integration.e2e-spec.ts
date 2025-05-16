import { AUTH_CMP, EVENT_CMP } from '@libs/cmd';
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

describe('Gateway Integration (e2e)', () => {
  let app: INestApplication;
  let authClientMock: Partial<ClientProxy>;
  let eventClientMock: Partial<ClientProxy>;

  beforeEach(async () => {
    // Create mock for the auth client microservice
    authClientMock = {
      send: jest.fn().mockImplementation((pattern, payload) => {
        // Login response
        if (pattern.cmd === AUTH_CMP.LOGIN) {
          console.log('Mocking LOGIN response for:', payload);
          return of({
            accessToken: 'test-token',
            user: {
              id: '1',
              email: payload.email,
              roles: ['USER'],
            },
          });
        }
        return of({});
      }),
    };

    // Create mock for the event client microservice
    eventClientMock = {
      send: jest.fn().mockImplementation((pattern, payload) => {
        // Create event response
        if (pattern.cmd === EVENT_CMP.CREATE_EVENT) {
          console.log('Mocking CREATE_EVENT response for:', payload);
          return of({
            id: '1',
            name: payload.name,
            status: 'ACTIVE',
          });
        }

        // Request reward response
        if (pattern.cmd === EVENT_CMP.CREATE_REWARD_REQUEST) {
          console.log('Mocking CREATE_REWARD_REQUEST response for:', payload);
          return of({
            id: '1',
            userId: payload.userId,
            eventId: payload.eventId,
            status: 'PENDING',
          });
        }

        return of({});
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('AUTH_SERVICE')
      .useValue(authClientMock)
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

  // Test an end to end flow: login, create event, request reward
  it('should support login flow, creating event, and requesting reward', async () => {
    // Step 1: Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
      })
      .expect(201);

    expect(loginResponse.body).toHaveProperty('accessToken');
    expect(loginResponse.body).toHaveProperty('user');
    expect(loginResponse.body.user).toHaveProperty('email', 'user@example.com');

    // Step 2: Create Event
    const eventResponse = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .send({
        name: 'Test Event',
        condition: {},
        period: {
          start: new Date(),
          end: new Date(Date.now() + 86400000),
        },
        status: 'ACTIVE',
      })
      .expect(201);

    expect(eventResponse.body).toHaveProperty('id');
    expect(eventResponse.body).toHaveProperty('name', 'Test Event');

    // Step 3: Request Reward
    const requestResponse = await request(app.getHttpServer())
      .post(`/events/${eventResponse.body.id}/request`)
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(201);

    expect(requestResponse.body).toHaveProperty('id');
    expect(requestResponse.body).toHaveProperty(
      'eventId',
      eventResponse.body.id,
    );
    expect(requestResponse.body).toHaveProperty('status', 'PENDING');
  });
});
