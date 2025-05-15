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

  beforeEach(async () => {
    await orm.getSchemaGenerator().clearDatabase();

    await userService.createUser({
      email: mockUser.email,
      password: 'password123',
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
  });
});
