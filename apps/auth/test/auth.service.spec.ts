import { LoginDto } from '@libs/dtos';
import { Role, TokenStatus } from '@libs/enums';
import { MongoMemoryOrmModule } from '@libs/test';
import { MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/services/auth.service';
import { UserService } from '../src/services/user.service';
import { TestAppModule } from './test.app.module';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let redis: any; // Using any to avoid type errors with Redis

  let app: INestApplication;
  let orm: MikroORM;
  let mongoMemoryOrmModule: MongoMemoryOrmModule;

  beforeAll(async () => {
    try {
      mongoMemoryOrmModule = new MongoMemoryOrmModule();
      await mongoMemoryOrmModule.init('user-db');

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestAppModule.forTest(mongoMemoryOrmModule)],
      }).compile();

      orm = moduleFixture.get<MikroORM>(MikroORM);
      app = moduleFixture.createNestApplication();
      service = moduleFixture.get<AuthService>(AuthService);
      userService = moduleFixture.get<UserService>(UserService);
      jwtService = moduleFixture.get<JwtService>(JwtService);
      redis = moduleFixture.get('REDIS_CLIENT');

      await orm.getSchemaGenerator().createSchema();
      await app.init();
    } catch (error) {
      console.error('앱 초기화 오류:', error);
      throw error;
    }
  });

  const mockUserId = new ObjectId();
  const mockUser = {
    _id: mockUserId,
    email: 'test@example.com',
    roles: [Role.USER],
    get id() {
      return this._id.toString();
    },
  };

  const mockAdminUserId = new ObjectId();
  const mockAdminUser = {
    _id: mockAdminUserId,
    email: 'admin@example.com',
    roles: [Role.ADMIN],
    get id() {
      return this._id.toString();
    },
  };

  const mockOperatorUserId = new ObjectId();
  const mockOperatorUser = {
    _id: mockOperatorUserId,
    email: 'operator@example.com',
    roles: [Role.OPERATOR],
    get id() {
      return this._id.toString();
    },
  };

  const mockAuditorUserId = new ObjectId();
  const mockAuditorUser = {
    _id: mockAuditorUserId,
    email: 'auditor@example.com',
    roles: [Role.AUDITOR],
    get id() {
      return this._id.toString();
    },
  };

  beforeEach(async () => {
    await orm.getSchemaGenerator().clearDatabase();

    // 일반 사용자 생성 (기본적으로 USER 역할을 가짐)
    await userService.createUser({
      email: mockUser.email,
      password: 'password123',
    });

    // 관리자 사용자 생성
    const adminUser = await userService.createUser({
      email: mockAdminUser.email,
      password: 'password123',
    });
    await userService.updateRoles({
      id: adminUser.id,
      updateRolesDto: { roles: [Role.ADMIN] },
    });

    // 운영자 사용자 생성
    const operatorUser = await userService.createUser({
      email: mockOperatorUser.email,
      password: 'password123',
    });
    await userService.updateRoles({
      id: operatorUser.id,
      updateRolesDto: { roles: [Role.OPERATOR] },
    });

    // 감사자 사용자 생성
    const auditorUser = await userService.createUser({
      email: mockAuditorUser.email,
      password: 'password123',
    });
    await userService.updateRoles({
      id: auditorUser.id,
      updateRolesDto: { roles: [Role.AUDITOR] },
    });

    // Redis 데이터 초기화
    await redis.flushall();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (orm) {
      await orm.close();
    }

    await mongoMemoryOrmModule.stop();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('로그인에 성공하고 액세스 토큰을 반환해야 함', async () => {
      // 행동
      const result = await service.login(loginDto);

      // 검증
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.roles).toEqual(mockUser.roles);
    });

    it('사용자 유효성 검사의 예외를 전달해야 함', async () => {
      // 준비
      const validationError = new UnauthorizedException('Invalid credentials');

      // 행동 및 검증
      await expect(
        service.login({
          email: loginDto.email,
          password: 'invalid',
        }),
      ).rejects.toThrow(validationError);
    });

    it('일반 사용자가 로그인 성공 시 USER 역할이 포함된 토큰을 반환해야 함', async () => {
      // 준비
      const userLoginDto: LoginDto = {
        email: mockUser.email,
        password: 'password123',
      };

      // 행동
      const result = await service.login(userLoginDto);

      // 검증
      expect(result.accessToken).toBeDefined();
      expect(result.user.roles).toContain(Role.USER);

      // 토큰에 적절한 역할이 포함되어 있는지 확인
      const payload = jwtService.decode(result.accessToken);
      expect(payload.roles).toContain(Role.USER);
    });

    it('관리자가 로그인 성공 시 ADMIN 역할이 포함된 토큰을 반환해야 함', async () => {
      // 준비
      const adminLoginDto: LoginDto = {
        email: mockAdminUser.email,
        password: 'password123',
      };

      // 행동
      const result = await service.login(adminLoginDto);

      // 검증
      expect(result.accessToken).toBeDefined();
      expect(result.user.roles).toContain(Role.ADMIN);

      // 토큰에 적절한 역할이 포함되어 있는지 확인
      const payload = jwtService.decode(result.accessToken);
      expect(payload.roles).toContain(Role.ADMIN);
    });

    it('운영자가 로그인 성공 시 OPERATOR 역할이 포함된 토큰을 반환해야 함', async () => {
      // 준비
      const operatorLoginDto: LoginDto = {
        email: mockOperatorUser.email,
        password: 'password123',
      };

      // 행동
      const result = await service.login(operatorLoginDto);

      // 검증
      expect(result.accessToken).toBeDefined();
      expect(result.user.roles).toContain(Role.OPERATOR);

      // 토큰에 적절한 역할이 포함되어 있는지 확인
      const payload = jwtService.decode(result.accessToken);
      expect(payload.roles).toContain(Role.OPERATOR);
    });

    it('감사자가 로그인 성공 시 AUDITOR 역할이 포함된 토큰을 반환해야 함', async () => {
      // 준비
      const auditorLoginDto: LoginDto = {
        email: mockAuditorUser.email,
        password: 'password123',
      };

      // 행동
      const result = await service.login(auditorLoginDto);

      // 검증
      expect(result.accessToken).toBeDefined();
      expect(result.user.roles).toContain(Role.AUDITOR);

      // 토큰에 적절한 역할이 포함되어 있는지 확인
      const payload = jwtService.decode(result.accessToken);
      expect(payload.roles).toContain(Role.AUDITOR);
    });

    it('로그인 성공 시 토큰에 사용자 ID가 포함되어야 함', async () => {
      // 행동
      const result = await service.login(loginDto);

      // 검증
      const payload = jwtService.decode(result.accessToken);
      expect(payload.sub).toBeDefined();
      expect(typeof payload.sub).toBe('string');
    });

    it('로그인 후 리프레시 토큰이 생성되고 저장되어야 함', async () => {
      // 행동
      const result = await service.login(loginDto);

      // 검증
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // 사용자의 토큰이 데이터베이스에 저장되었는지 확인
      const userToken = await orm.em.findOne('UserToken', {
        userId: result.user.id,
      });

      expect(userToken).toBeDefined();
      expect(userToken.refreshToken).toBe(result.refreshToken);
      expect(userToken.status).toBe(TokenStatus.ACTIVE);
      expect(userToken.revokedAt).toBeNull();
    });
  });

  describe('verifyToken', () => {
    it('유효한 토큰이 주어졌을 때 페이로드를 반환해야 함', async () => {
      // 준비
      const payload = {
        sub: mockUserId.toString(),
        roles: [Role.USER],
        iat: new Date().getTime(),
      };
      const token = jwtService.sign(payload);

      // 행동
      const result = await service.verifyToken(token);

      // 검증
      expect(result).toBeDefined();
      expect(result.sub).toBe(payload.sub);
      expect(result.roles).toEqual(payload.roles);
    });

    it('유효하지 않은 토큰이 주어졌을 때 UnauthorizedException을 발생시켜야 함', async () => {
      // 준비
      const invalidToken = 'invalid.token.format';

      // 행동 및 검증
      await expect(service.verifyToken(invalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('만료된 토큰이 주어졌을 때 UnauthorizedException을 발생시켜야 함', async () => {
      // 준비
      const payload = {
        sub: mockUserId.toString(),
        roles: [Role.USER],
        iat: Math.floor(Date.now() / 1000) - 3600, // 1시간 전 발급
      };

      // 토큰을 1초 만료 시간으로 설정하여 확실히 만료되도록 함
      const expiredToken = jwtService.sign(payload, { expiresIn: '1ms' });

      // 토큰이 확실히 만료되도록 짧은 대기 시간 추가
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 행동 및 검증
      await expect(service.verifyToken(expiredToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('관리자 역할을 가진 토큰을 검증할 수 있어야 함', async () => {
      // 준비
      const adminPayload = {
        sub: mockAdminUserId.toString(),
        roles: [Role.ADMIN],
        iat: new Date().getTime(),
      };
      const adminToken = jwtService.sign(adminPayload);

      // 행동
      const result = await service.verifyToken(adminToken);

      // 검증
      expect(result).toBeDefined();
      expect(result.roles).toContain(Role.ADMIN);
    });

    it('운영자 역할을 가진 토큰을 검증할 수 있어야 함', async () => {
      // 준비
      const operatorPayload = {
        sub: mockOperatorUserId.toString(),
        roles: [Role.OPERATOR],
        iat: new Date().getTime(),
      };
      const operatorToken = jwtService.sign(operatorPayload);

      // 행동
      const result = await service.verifyToken(operatorToken);

      // 검증
      expect(result).toBeDefined();
      expect(result.roles).toContain(Role.OPERATOR);
    });

    it('감사자 역할을 가진 토큰을 검증할 수 있어야 함', async () => {
      // 준비
      const auditorPayload = {
        sub: mockAuditorUserId.toString(),
        roles: [Role.AUDITOR],
        iat: new Date().getTime(),
      };
      const auditorToken = jwtService.sign(auditorPayload);

      // 행동
      const result = await service.verifyToken(auditorToken);

      // 검증
      expect(result).toBeDefined();
      expect(result.roles).toContain(Role.AUDITOR);
    });

    it('복수의 역할을 가진 토큰을 올바르게 검증해야 함', async () => {
      // 준비
      const multiRolePayload = {
        sub: mockUserId.toString(),
        roles: [Role.USER, Role.OPERATOR],
        iat: new Date().getTime(),
      };
      const multiRoleToken = jwtService.sign(multiRolePayload);

      // 행동
      const result = await service.verifyToken(multiRoleToken);

      // 검증
      expect(result).toBeDefined();
      expect(result.roles).toContain(Role.USER);
      expect(result.roles).toContain(Role.OPERATOR);
      expect(result.roles.length).toBe(2);
    });
  });

  describe('refreshToken', () => {
    it('유효한 리프레시 토큰이 주어졌을 때 새로운 액세스 토큰을 반환해야 함', async () => {
      // 준비 - 로그인으로 유효한 리프레시 토큰 얻기
      const loginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      const refreshToken = loginResult.refreshToken;

      // 행동
      const result = await service.refreshToken(refreshToken);

      // 검증
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();

      // 새 액세스 토큰에 올바른 페이로드가 포함되어 있는지 검증
      const payload = jwtService.decode(result.accessToken);
      expect(payload.sub).toBe(loginResult.user.id);
      expect(payload.roles).toEqual(loginResult.user.roles);
    });

    it('유효하지 않은 리프레시 토큰이 주어졌을 때 UnauthorizedException을 발생시켜야 함', async () => {
      // 준비
      const invalidRefreshToken = 'invalid-refresh-token';

      // 행동 및 검증
      await expect(service.refreshToken(invalidRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('만료된 리프레시 토큰이 주어졌을 때 UnauthorizedException을 발생시켜야 함', async () => {
      // 준비 - 짧은 만료 시간의 토큰 생성
      // 이 부분은 실제 구현에 따라 다를 수 있음 - AuthService에 해당 기능이 있다고 가정
      const loginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      // 토큰 만료 시뮬레이션 (실제 구현에 따라 다름)
      const userToken = await orm.em.findOne('UserToken', {
        userId: loginResult.user.id,
      });

      if (userToken) {
        userToken.expiresAt = new Date(Date.now() - 1000); // 1초 전 만료
        await orm.em.flush();
      }

      // 행동 및 검증
      await expect(
        service.refreshToken(loginResult.refreshToken),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('취소된 리프레시 토큰으로 액세스 토큰을 갱신할 수 없어야 함', async () => {
      // 준비 - 로그인 및 토큰 취득
      const loginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      const refreshToken = loginResult.refreshToken;

      // 토큰 취소
      await service.revokeToken(loginResult.user.id);

      // 행동 및 검증 - 취소된 토큰으로 갱신 시도
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('로그아웃 후 리프레시 토큰을 사용할 수 없어야 함', async () => {
      // 준비 - 로그인
      const loginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      const refreshToken = loginResult.refreshToken;

      // 로그아웃 수행
      await service.logout(loginResult.user.id);

      // 행동 및 검증
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('tokenManagement', () => {
    it('리프레시 토큰 취소 시 상태가 변경되고 취소 시간이 기록되어야 함', async () => {
      // 준비 - 로그인
      const loginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      const beforeTime = new Date();

      // 행동 - 토큰 취소
      await service.revokeToken(loginResult.user.id);

      const afterTime = new Date();

      // 검증
      const userToken = await orm.em.findOne('UserToken', {
        userId: loginResult.user.id,
      });

      expect(userToken).toBeDefined();
      expect(userToken.status).toBe(TokenStatus.REVOKED);
      expect(userToken.revokedAt).toBeInstanceOf(Date);

      // 취소 시간이 적절한 범위 내에 있는지 확인
      const revokedAt = userToken.revokedAt;
      expect(revokedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(revokedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('새로운 리프레시 토큰 발급 시 기존 토큰이 취소되어야 함', async () => {
      // 준비 - 로그인
      const loginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      const firstToken = loginResult.refreshToken;

      // 새 토큰 발급 (로그인)
      const secondLoginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      const secondToken = secondLoginResult.refreshToken;

      // 검증
      expect(firstToken).not.toBe(secondToken);

      // 첫 번째 토큰이 취소되었는지 확인
      await expect(service.refreshToken(firstToken)).rejects.toThrow(
        UnauthorizedException,
      );

      // 두 번째 토큰은 유효해야 함
      const refreshResult = await service.refreshToken(secondToken);
      expect(refreshResult).toBeDefined();
      expect(refreshResult.accessToken).toBeDefined();
    });

    it('Redis에 액세스 토큰이 저장되어야 함', async () => {
      // 준비 - 로그인
      const loginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      // 검증
      const key = `access_token:${loginResult.user.id}`;
      const tokenData = await redis.get(key);

      expect(tokenData).toBeDefined();
      const parsedTokenData = JSON.parse(tokenData);
      expect(parsedTokenData.token).toBe(loginResult.accessToken);
    });

    it('액세스 토큰 유효성 검사가 올바르게 작동해야 함', async () => {
      // 준비 - 로그인
      const loginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      // 행동
      const isValid = await service.validateAccessToken(
        loginResult.user.id,
        loginResult.accessToken,
      );

      // 검증
      expect(isValid).toBe(true);
    });

    it('유효하지 않은 액세스 토큰은 검증에 실패해야 함', async () => {
      // 준비 - 로그인
      const loginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });
      const invalidToken = 'invalid-access-token';

      // 행동
      const isValid = await service.validateAccessToken(
        loginResult.user.id,
        invalidToken,
      );

      // 검증
      expect(isValid).toBe(false);
    });

    it('로그아웃 후 액세스 토큰이 무효화되어야 함', async () => {
      // 준비 - 로그인
      const loginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      // 로그아웃 수행
      await service.logout(loginResult.user.id);

      // 행동
      const isValid = await service.validateAccessToken(
        loginResult.user.id,
        loginResult.accessToken,
      );

      // 검증
      expect(isValid).toBe(false);
    });

    it('새 토큰 발급 시 이전 토큰이 무효화되어야 함', async () => {
      // 준비 - 첫번째 로그인
      const firstLoginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      // 두 번째 로그인
      const secondLoginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      // 행동
      const isFirstTokenValid = await service.validateAccessToken(
        firstLoginResult.user.id,
        firstLoginResult.accessToken,
      );

      const isSecondTokenValid = await service.validateAccessToken(
        secondLoginResult.user.id,
        secondLoginResult.accessToken,
      );

      // 검증
      expect(isFirstTokenValid).toBe(false); // 첫 번째 토큰은 무효화됨
      expect(isSecondTokenValid).toBe(true); // 두 번째 토큰은 유효함
    });
  });

  describe('logout', () => {
    it('로그아웃 시 Redis에서 액세스 토큰이 삭제되어야 함', async () => {
      // 준비 - 로그인
      const loginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      const key = `access_token:${loginResult.user.id}`;

      // 로그아웃 전에 토큰이 있는지 확인
      let tokenData = await redis.get(key);
      expect(tokenData).toBeDefined();

      // 행동
      await service.logout(loginResult.user.id);

      // 검증
      tokenData = await redis.get(key);
      expect(tokenData).toBeNull();
    });

    it('로그아웃 시 리프레시 토큰이 취소되어야 함', async () => {
      // 준비 - 로그인
      const loginResult = await service.login({
        email: mockUser.email,
        password: 'password123',
      });

      // 행동 - 로그아웃
      await service.logout(loginResult.user.id);

      // 검증
      const userToken = await orm.em.findOne('UserToken', {
        userId: loginResult.user.id,
      });

      expect(userToken).toBeDefined();
      expect(userToken.status).toBe(TokenStatus.REVOKED);
      expect(userToken.revokedAt).toBeDefined();
    });
  });
});
