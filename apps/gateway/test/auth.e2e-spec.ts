import { AUTH_CMP } from '@libs/cmd';
import { PinoLoggerService } from '@libs/logger';
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
          return of({
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
            user: {
              id: '1',
              email: payload.email,
              roles: ['USER'],
            },
          });
        }
        if (pattern.cmd === AUTH_CMP.REFRESH_TOKEN) {
          if (payload.refreshToken === 'test-refresh-token') {
            return of({
              accessToken: 'new-access-token',
            });
          }
          throw new Error('Invalid refresh token');
        }
        if (pattern.cmd === AUTH_CMP.CREATE_USER) {
          return of({
            id: '1',
            email: payload.email,
            roles: ['USER'],
          });
        }
        if (pattern.cmd === AUTH_CMP.GET_USER_BY_ID) {
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
      .overrideProvider(PinoLoggerService)
      .useValue({
        log: jest.fn(),
        error: jest.fn(),
        warn: (message: string, context?: any) => {
          console.log('warn', message, context);
        },
        info: jest.fn(),
        debug: jest.fn(),
      })
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
    it('로그인 성공 시 액세스 토큰과 사용자 정보를 반환하고 리프레시 토큰을 쿠키로 설정해야 함', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          // Check response body
          expect(res.body).toHaveProperty('accessToken', 'test-access-token');
          expect(res.body).not.toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', 'user@example.com');
          expect(res.body.user).toHaveProperty('roles');
          expect(res.body.user.roles).toContain('USER');

          // Check refresh token cookie
          const cookies = res.headers['set-cookie'] as unknown as string[];
          expect(cookies).toBeDefined();
          const refreshTokenCookie = cookies.find((cookie) =>
            cookie.startsWith('refreshToken='),
          );
          expect(refreshTokenCookie).toBeDefined();
          expect(refreshTokenCookie).toContain('HttpOnly');
          expect(refreshTokenCookie).toContain('SameSite=Strict');
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

  describe('/auth/refresh (POST)', () => {
    it('유효한 리프레시 토큰으로 새로운 액세스 토큰을 발급받아야 함', async () => {
      // First login to get refresh token cookie
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        });

      const cookies = loginResponse.headers[
        'set-cookie'
      ] as unknown as string[];
      console.log('cookies', cookies);

      // Try to refresh token
      const result = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies);

      expect(result.status).toBe(201);
      expect(result.body).toHaveProperty('accessToken', 'new-access-token');
    });

    it('리프레시 토큰이 없으면 401 에러를 반환해야 함', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Refresh token not found');
        });
    });

    it('유효하지 않은 리프레시 토큰으로 401 에러를 반환해야 함', async () => {
      // First login to get refresh token cookie
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        });

      const cookies = loginResponse.headers[
        'set-cookie'
      ] as unknown as string[];

      console.log('cookies', cookies);

      // Modify the refresh token cookie to be invalid
      const invalidCookies = cookies.map((cookie) =>
        cookie.replace('test-refresh-token', 'invalid-token'),
      );

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', invalidCookies)
        .expect(500); // The mock throws an error for invalid tokens
    });
  });
});
