import { LoginDto } from '@libs/dtos';
import { Role } from '@libs/enums';
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
});
