import { AUTH_CMP } from '@libs/cmd';
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

describe('인증 컨트롤러 (e2e)', () => {
  let app: INestApplication;
  let authClientMock: Partial<ClientProxy>;

  beforeEach(async () => {
    // Create mock for the auth client microservice
    authClientMock = {
      send: jest.fn().mockImplementation((pattern, payload) => {
        // Mock responses based on pattern
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
        if (pattern.cmd === AUTH_CMP.CREATE_USER) {
          console.log('Mocking CREATE_USER response for:', payload);
          return of({
            id: '1',
            email: payload.email,
            roles: ['USER'],
          });
        }
        if (pattern.cmd === AUTH_CMP.GET_USER_BY_ID) {
          console.log('Mocking GET_USER_BY_ID response for:', payload);
          return of({
            id: payload.id,
            email: 'user@example.com',
            roles: ['USER'],
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
  describe('/auth/test (GET)', () => {
    it('테스트 엔드포인트에서 OK를 반환해야 함', () => {
      return request(app.getHttpServer())
        .get('/auth/test')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('service', 'auth');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    it('로그인 성공 시 액세스 토큰과 사용자 정보를 반환해야 함', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', 'user@example.com');
          expect(res.body.user).toHaveProperty('roles');
          expect(res.body.user.roles).toContain('USER');
        });
    });

    it('로그인 입력을 검증해야 함', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'pass',
        })
        .expect(400);
    });
  });

  describe('/auth/users (POST)', () => {
    it('새 사용자를 생성해야 함', () => {
      return request(app.getHttpServer())
        .post('/auth/users')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', 'newuser@example.com');
          expect(res.body).toHaveProperty('roles');
        });
    });
  });

  describe('/auth/users/:id (GET)', () => {
    it('사용자 데이터를 반환해야 함', () => {
      return request(app.getHttpServer())
        .get('/auth/users/1')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', '1');
          expect(res.body).toHaveProperty('email', 'user@example.com');
        });
    });
  });
});
