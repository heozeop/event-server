import { LoginDto } from '@libs/dtos';
import { Role } from '@libs/enums';
import { MongoMemoryOrmModule } from '@libs/test';
import { MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/services/auth.service';
import { UserService } from '../../src/services/user.service';
import { TestAppModule } from '../test.app.module';

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
      console.error('Error initializing app:', error);
      throw error;
    }
  });

  const mockUserId = new ObjectId();
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    roles: [Role.USER],
  };

  const mockAdminUser = {
    id: new ObjectId(),
    email: 'admin@example.com',
    roles: [Role.ADMIN],
  };

  const mockOperatorUser = {
    id: new ObjectId(),
    email: 'operator@example.com',
    roles: [Role.OPERATOR],
  };

  const mockAuditorUser = {
    id: new ObjectId(),
    email: 'auditor@example.com',
    roles: [Role.AUDITOR],
  };

  beforeEach(async () => {
    await orm.getSchemaGenerator().clearDatabase();

    // Create regular user (has USER role by default)
    await userService.createUser({
      email: mockUser.email,
      password: 'password123',
    });

    // Create admin user
    const adminUser = await userService.createUser({
      email: mockAdminUser.email,
      password: 'password123',
    });
    await userService.updateRoles({
      id: adminUser.id,
      updateRolesDto: { roles: [Role.ADMIN] },
    });

    // Create operator user
    const operatorUser = await userService.createUser({
      email: mockOperatorUser.email,
      password: 'password123',
    });
    await userService.updateRoles({
      id: operatorUser.id,
      updateRolesDto: { roles: [Role.OPERATOR] },
    });

    // Create auditor user
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

    it('should login successfully and return access token', async () => {
      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.roles).toEqual(mockUser.roles);
    });

    it('should pass through exceptions from user validation', async () => {
      // Arrange
      const validationError = new UnauthorizedException('Invalid credentials');

      // Act & Assert
      await expect(
        service.login({
          email: loginDto.email,
          password: 'invalid',
        }),
      ).rejects.toThrow(validationError);
    });

    it('일반 사용자가 로그인 성공 시 USER 역할이 포함된 토큰을 반환해야 함', async () => {
      // Arrange
      const userLoginDto: LoginDto = {
        email: mockUser.email,
        password: 'password123',
      };

      // Act
      const result = await service.login(userLoginDto);

      // Assert
      expect(result.accessToken).toBeDefined();
      expect(result.user.roles).toContain(Role.USER);

      // Verify token contains proper role
      const payload = jwtService.decode(result.accessToken);
      expect(payload.roles).toContain(Role.USER);
    });

    it('관리자가 로그인 성공 시 ADMIN 역할이 포함된 토큰을 반환해야 함', async () => {
      // Arrange
      const adminLoginDto: LoginDto = {
        email: mockAdminUser.email,
        password: 'password123',
      };

      // Act
      const result = await service.login(adminLoginDto);

      // Assert
      expect(result.accessToken).toBeDefined();
      expect(result.user.roles).toContain(Role.ADMIN);

      // Verify token contains proper role
      const payload = jwtService.decode(result.accessToken);
      expect(payload.roles).toContain(Role.ADMIN);
    });

    it('운영자가 로그인 성공 시 OPERATOR 역할이 포함된 토큰을 반환해야 함', async () => {
      // Arrange
      const operatorLoginDto: LoginDto = {
        email: mockOperatorUser.email,
        password: 'password123',
      };

      // Act
      const result = await service.login(operatorLoginDto);

      // Assert
      expect(result.accessToken).toBeDefined();
      expect(result.user.roles).toContain(Role.OPERATOR);

      // Verify token contains proper role
      const payload = jwtService.decode(result.accessToken);
      expect(payload.roles).toContain(Role.OPERATOR);
    });

    it('감사자가 로그인 성공 시 AUDITOR 역할이 포함된 토큰을 반환해야 함', async () => {
      // Arrange
      const auditorLoginDto: LoginDto = {
        email: mockAuditorUser.email,
        password: 'password123',
      };

      // Act
      const result = await service.login(auditorLoginDto);

      // Assert
      expect(result.accessToken).toBeDefined();
      expect(result.user.roles).toContain(Role.AUDITOR);

      // Verify token contains proper role
      const payload = jwtService.decode(result.accessToken);
      expect(payload.roles).toContain(Role.AUDITOR);
    });

    it('로그인 성공 시 토큰에 사용자 ID가 포함되어야 함', async () => {
      // Act
      const result = await service.login(loginDto);

      // Assert
      const payload = jwtService.decode(result.accessToken);
      expect(payload.sub).toBeDefined();
      expect(typeof payload.sub).toBe('string');
    });
  });

  describe('verifyToken', () => {
    it('유효한 토큰이 주어졌을 때 페이로드를 반환해야 함', async () => {
      // Arrange
      const payload = {
        sub: mockUserId.toString(),
        roles: [Role.USER],
        iat: new Date().getTime(),
      };
      const token = jwtService.sign(payload);

      // Act
      const result = await service.verifyToken(token);

      // Assert
      expect(result).toBeDefined();
      expect(result.sub).toBe(payload.sub);
      expect(result.roles).toEqual(payload.roles);
    });

    it('유효하지 않은 토큰이 주어졌을 때 UnauthorizedException을 발생시켜야 함', async () => {
      // Arrange
      const invalidToken = 'invalid.token.format';

      // Act & Assert
      await expect(service.verifyToken(invalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('만료된 토큰이 주어졌을 때 UnauthorizedException을 발생시켜야 함', async () => {
      // Arrange
      const expiredPayload = {
        sub: mockUserId.toString(),
        roles: [Role.USER],
        iat: new Date().getTime() - 3600000,
        exp: Math.floor(Date.now() / 1000) - 60, // 1 minute ago
      };

      // Create a token with the JWT_SECRET directly to bypass NestJS's validation
      const expiredToken = jwtService.sign(expiredPayload, { expiresIn: -10 });

      // Act & Assert
      await expect(service.verifyToken(expiredToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('관리자 역할을 가진 토큰을 검증할 수 있어야 함', async () => {
      // Arrange
      const adminPayload = {
        sub: mockAdminUser.id.toString(),
        roles: [Role.ADMIN],
        iat: new Date().getTime(),
      };
      const adminToken = jwtService.sign(adminPayload);

      // Act
      const result = await service.verifyToken(adminToken);

      // Assert
      expect(result).toBeDefined();
      expect(result.roles).toContain(Role.ADMIN);
    });

    it('운영자 역할을 가진 토큰을 검증할 수 있어야 함', async () => {
      // Arrange
      const operatorPayload = {
        sub: mockOperatorUser.id.toString(),
        roles: [Role.OPERATOR],
        iat: new Date().getTime(),
      };
      const operatorToken = jwtService.sign(operatorPayload);

      // Act
      const result = await service.verifyToken(operatorToken);

      // Assert
      expect(result).toBeDefined();
      expect(result.roles).toContain(Role.OPERATOR);
    });

    it('감사자 역할을 가진 토큰을 검증할 수 있어야 함', async () => {
      // Arrange
      const auditorPayload = {
        sub: mockAuditorUser.id.toString(),
        roles: [Role.AUDITOR],
        iat: new Date().getTime(),
      };
      const auditorToken = jwtService.sign(auditorPayload);

      // Act
      const result = await service.verifyToken(auditorToken);

      // Assert
      expect(result).toBeDefined();
      expect(result.roles).toContain(Role.AUDITOR);
    });

    it('복수의 역할을 가진 토큰을 올바르게 검증해야 함', async () => {
      // Arrange
      const multiRolePayload = {
        sub: mockUserId.toString(),
        roles: [Role.USER, Role.OPERATOR],
        iat: new Date().getTime(),
      };
      const multiRoleToken = jwtService.sign(multiRolePayload);

      // Act
      const result = await service.verifyToken(multiRoleToken);

      // Assert
      expect(result).toBeDefined();
      expect(result.roles).toContain(Role.USER);
      expect(result.roles).toContain(Role.OPERATOR);
      expect(result.roles.length).toBe(2);
    });
  });
});
