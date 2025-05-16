import { CreateUserDto, UpdateRolesDto } from '@libs/dtos';
import { Role } from '@libs/enums';
import { MongoMemoryOrmModule } from '@libs/test';
import { MikroORM, ObjectId } from '@mikro-orm/mongodb';
import {
  INestApplication,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../../src/entities/user.entity';
import { UserService } from '../../src/services/user.service';
import { TestAppModule } from '../test.app.module';

describe('UserService', () => {
  let service: UserService;
  let app: INestApplication;
  let orm: MikroORM;
  let mongoMemoryOrmModule: MongoMemoryOrmModule;

  // Test data
  const testEmail = 'test@example.com';
  const testPassword = 'testPassword123';

  beforeAll(async () => {
    try {
      mongoMemoryOrmModule = new MongoMemoryOrmModule();
      await mongoMemoryOrmModule.init('user-db');

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestAppModule.forTest(mongoMemoryOrmModule)],
      }).compile();

      orm = moduleFixture.get<MikroORM>(MikroORM);
      app = moduleFixture.createNestApplication();
      service = moduleFixture.get<UserService>(UserService);

      await orm.getSchemaGenerator().createSchema();
      await app.init();
    } catch (error) {
      console.error('Error initializing app:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await orm.getSchemaGenerator().clearDatabase();
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

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      password: 'password123',
    };

    it('should create a new user successfully', async () => {
      // Act
      const result = await service.createUser(createUserDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(result.roles).toContain(Role.USER);

      // Verify user exists in database
      const userRepository = orm.em.getRepository(User);
      const savedUser = await userRepository.findOne({
        email: createUserDto.email,
      });
      expect(savedUser).toBeDefined();
      expect(savedUser?.email).toBe(createUserDto.email);
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      await service.createUser(createUserDto);

      // Act & Assert
      await expect(service.createUser(createUserDto)).rejects.toThrow();
    });
  });

  describe('getUserById', () => {
    let userId: string;

    beforeEach(async () => {
      // Create a test user and get its ID
      const user = await service.createUser({
        email: testEmail,
        password: testPassword,
      });

      const foundUser = await service.getUserByEmail({
        email: testEmail,
      });
      userId = foundUser?._id.toString() || '';
    });

    it('should return a user by id', async () => {
      // Act
      const result = await service.getUserById({ id: userId });

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(testEmail);
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      const nonExistentId = new ObjectId().toString();

      // Act & Assert
      await expect(service.getUserById({ id: nonExistentId })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserByEmail', () => {
    beforeEach(async () => {
      // Create a test user
      await service.createUser({
        email: testEmail,
        password: testPassword,
      });
    });

    it('should return a user by email', async () => {
      // Act
      const result = await service.getUserByEmail({
        email: testEmail,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe(testEmail);
    });

    it('should return null if user not found', async () => {
      // Act
      const result = await service.getUserByEmail({
        email: 'nonexistent@example.com',
      });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateRoles', () => {
    let userId: string;

    beforeEach(async () => {
      // Create a test user with unique email and get its ID
      const uniqueEmail = `role-test-${Date.now()}@example.com`;
      await service.createUser({
        email: uniqueEmail,
        password: testPassword,
      });

      const foundUser = await service.getUserByEmail({
        email: uniqueEmail,
      });
      userId = foundUser?._id.toString() || '';
    });

    it('should update user roles successfully', async () => {
      // Arrange
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.ADMIN, Role.USER],
      };

      // Act
      const result = await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.roles).toEqual(
        expect.arrayContaining(updateRolesDto.roles),
      );

      // Verify roles were updated in database
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles).toEqual(
        expect.arrayContaining(updateRolesDto.roles),
      );
    });
  });

  describe('validateUser', () => {
    beforeEach(async () => {
      // Create a test user
      await service.createUser({
        email: testEmail,
        password: testPassword,
      });
    });

    it('should validate user credentials successfully', async () => {
      // Act
      const result = await service.validateUser(testEmail, testPassword);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(testEmail);
    });

    it('should throw NotFoundException if user not found', async () => {
      // Act & Assert
      await expect(
        service.validateUser('nonexistent@example.com', testPassword),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Act & Assert
      await expect(
        service.validateUser(testEmail, 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
