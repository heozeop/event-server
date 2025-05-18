import { CreateUserDto, UpdateRolesDto } from '@libs/dtos';
import { Role } from '@libs/enums';
import { MongoMemoryOrmModule } from '@libs/test';
import { MikroORM, ObjectId } from '@mikro-orm/mongodb';
import {
  ConflictException,
  INestApplication,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../../src/entities/user.entity';
import { UserService } from '../../src/services/user.service';
import { TestAppModule } from '../test.app.module';

describe('User Service (UserService)', () => {
  let service: UserService;
  let app: INestApplication;
  let orm: MikroORM;
  let mongoMemoryOrmModule: MongoMemoryOrmModule;

  // Test data
  const testEmail = 'test@example.com';
  const testPassword = 'testPassword123';
  const koreanTestEmail = 'korean사용자@example.com';
  const koreanTestPassword = '한글비밀번호123';

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
      console.error('App initialization error:', error);
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

  describe('Create User (createUser)', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      password: 'password123',
    };

    const koreanUserDto: CreateUserDto = {
      email: koreanTestEmail,
      password: koreanTestPassword,
    };

    it('should successfully create a new user', async () => {
      // Execute
      const result = await service.createUser(createUserDto);

      // Verify
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

    it('should be able to create a user with Korean information', async () => {
      // Execute
      const result = await service.createUser(koreanUserDto);

      // Verify
      expect(result).toBeDefined();
      expect(result.email).toBe(koreanUserDto.email);

      // Verify Korean user exists in database
      const userRepository = orm.em.getRepository(User);
      const savedUser = await userRepository.findOne({
        email: koreanUserDto.email,
      });
      expect(savedUser).toBeDefined();
      expect(savedUser?.email).toBe(koreanUserDto.email);
    });

    it('should throw ConflictException when user already exists', async () => {
      // Prepare
      await service.createUser(createUserDto);

      // Execute and verify
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('Get User by ID (getUserById)', () => {
    let userId: string;
    let koreanUserId: string;

    beforeEach(async () => {
      // Create test user and get ID
      await service.createUser({
        email: testEmail,
        password: testPassword,
      });

      await service.createUser({
        email: koreanTestEmail,
        password: koreanTestPassword,
      });

      const foundUser = await service.getUserByEmail({
        email: testEmail,
      });
      userId = foundUser?.id || '';

      const foundKoreanUser = await service.getUserByEmail({
        email: koreanTestEmail,
      });
      koreanUserId = foundKoreanUser?.id || '';
    });

    it('should return user by ID', async () => {
      // Execute
      const result = await service.getUserById({ id: userId });

      // Verify
      expect(result).toBeDefined();
      expect(result.email).toBe(testEmail);
    });

    it('should be able to retrieve a user with Korean email by ID', async () => {
      // Execute
      const result = await service.getUserById({ id: koreanUserId });

      // Verify
      expect(result).toBeDefined();
      expect(result.email).toBe(koreanTestEmail);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Prepare
      const nonExistentId = new ObjectId().toString();

      // Execute and verify
      await expect(service.getUserById({ id: nonExistentId })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Get User by Email (getUserByEmail)', () => {
    beforeEach(async () => {
      // Create test users
      await service.createUser({
        email: testEmail,
        password: testPassword,
      });

      await service.createUser({
        email: koreanTestEmail,
        password: koreanTestPassword,
      });
    });

    it('should return user by email', async () => {
      // Execute
      const result = await service.getUserByEmail({
        email: testEmail,
      });

      // Verify
      expect(result).toBeDefined();
      expect(result?.email).toBe(testEmail);
    });

    it('should be able to retrieve a user with Korean email', async () => {
      // Execute
      const result = await service.getUserByEmail({
        email: koreanTestEmail,
      });

      // Verify
      expect(result).toBeDefined();
      expect(result?.email).toBe(koreanTestEmail);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Execute and verify
      await expect(
        service.getUserByEmail({
          email: 'nonexistent@example.com',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Update Roles (updateRoles)', () => {
    let userId: string;
    let koreanUserId: string;

    beforeEach(async () => {
      // Create test users with unique emails and get IDs
      const uniqueEmail = `role-test-${Date.now()}@example.com`;
      await service.createUser({
        email: uniqueEmail,
        password: testPassword,
      });

      const koreanUniqueEmail = `korean-test-${Date.now()}@example.com`;
      await service.createUser({
        email: koreanUniqueEmail,
        password: koreanTestPassword,
      });

      const foundUser = await service.getUserByEmail({
        email: uniqueEmail,
      });
      userId = foundUser?.id || '';

      const foundKoreanUser = await service.getUserByEmail({
        email: koreanUniqueEmail,
      });
      koreanUserId = foundKoreanUser?.id || '';
    });

    it('should successfully update user roles', async () => {
      // Prepare
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.ADMIN, Role.USER],
      };

      // Execute
      const result = await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // Verify
      expect(result).toBeDefined();
      expect(result.roles).toEqual(
        expect.arrayContaining(updateRolesDto.roles),
      );

      // Verify roles updated in database
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles).toEqual(
        expect.arrayContaining(updateRolesDto.roles),
      );
    });

    it('should be able to update roles for a user with Korean email', async () => {
      // Prepare
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.ADMIN],
      };

      // Execute
      const result = await service.updateRoles({
        id: koreanUserId,
        updateRolesDto,
      });

      // Verify
      expect(result).toBeDefined();
      expect(result.roles).toEqual(
        expect.arrayContaining(updateRolesDto.roles),
      );

      // Verify roles updated in database
      const updatedUser = await service.getUserById({ id: koreanUserId });
      expect(updatedUser.roles).toEqual(
        expect.arrayContaining(updateRolesDto.roles),
      );
    });

    it('should throw NotFoundException when updating roles for non-existent user', async () => {
      // Prepare
      const nonExistentId = new ObjectId().toString();
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.ADMIN],
      };

      // Execute and verify
      await expect(
        service.updateRoles({
          id: nonExistentId,
          updateRolesDto,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update to OPERATOR role successfully', async () => {
      // Prepare
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.OPERATOR],
      };

      // Execute
      const result = await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // Verify
      expect(result).toBeDefined();
      expect(result.roles).toEqual([Role.OPERATOR]);

      // Verify roles updated in database
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles).toEqual([Role.OPERATOR]);
    });

    it('should update to AUDITOR role successfully', async () => {
      // Prepare
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.AUDITOR],
      };

      // Execute
      const result = await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // Verify
      expect(result).toBeDefined();
      expect(result.roles).toEqual([Role.AUDITOR]);

      // Verify roles updated in database
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles).toEqual([Role.AUDITOR]);
    });

    it('should assign multiple roles simultaneously', async () => {
      // Prepare
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.USER, Role.ADMIN, Role.OPERATOR],
      };

      // Execute
      const result = await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // Verify
      expect(result).toBeDefined();
      expect(result.roles.sort()).toEqual(updateRolesDto.roles.sort());

      // Verify roles updated in database
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles.sort()).toEqual(updateRolesDto.roles.sort());
    });
  });

  describe('User Validation (validateUser)', () => {
    beforeEach(async () => {
      // Create test users
      await service.createUser({
        email: testEmail,
        password: testPassword,
      });

      await service.createUser({
        email: koreanTestEmail,
        password: koreanTestPassword,
      });
    });

    it('should successfully validate user credentials', async () => {
      // Execute
      const result = await service.validateUser({
        email: testEmail,
        password: testPassword,
      });

      // Verify
      expect(result).toBeDefined();
      expect(result.email).toBe(testEmail);
    });

    it('should be able to authenticate a user with Korean email and password', async () => {
      // Execute
      const result = await service.validateUser({
        email: koreanTestEmail,
        password: koreanTestPassword,
      });

      // Verify
      expect(result).toBeDefined();
      expect(result.email).toBe(koreanTestEmail);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Execute and verify
      await expect(
        service.validateUser({
          email: 'nonexistent@example.com',
          password: testPassword,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      // Execute and verify
      await expect(
        service.validateUser({
          email: testEmail,
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Role-specific functionality', () => {
    let userId: string;

    beforeEach(async () => {
      // Create test user
      const userDto = {
        email: `role-test-${Date.now()}@example.com`,
        password: testPassword,
      };

      await service.createUser(userDto);

      const foundUser = await service.getUserByEmail({
        email: userDto.email,
      });
      userId = foundUser?.id || '';
    });

    it('should create a user with default USER role', async () => {
      // Prepare
      const newUserDto: CreateUserDto = {
        email: `default-role-${Date.now()}@example.com`,
        password: testPassword,
      };

      // Execute
      const result = await service.createUser(newUserDto);

      // Verify
      expect(result.roles).toEqual([Role.USER]);
    });

    it('should update to ADMIN role and retrieve correctly', async () => {
      // Prepare
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.ADMIN],
      };

      // Execute
      await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // Verify
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles).toEqual([Role.ADMIN]);
    });

    it('should create user with Korean characters and update to multiple roles', async () => {
      // Prepare
      const koreanEmail = `한글사용자-${Date.now()}@example.com`;
      const koreanUser = await service.createUser({
        email: koreanEmail,
        password: '한글비밀번호123',
      });

      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.USER, Role.OPERATOR, Role.AUDITOR],
      };

      // Execute
      await service.updateRoles({
        id: koreanUser.id,
        updateRolesDto,
      });

      // Verify
      const updatedUser = await service.getUserById({ id: koreanUser.id });
      expect(updatedUser.roles.sort()).toEqual(updateRolesDto.roles.sort());
      expect(updatedUser.email).toBe(koreanEmail);
    });
  });

  describe('Duplicate Data Handling', () => {
    const testEmail = `duplicate-test-${Date.now()}@example.com`;
    const testPassword = 'password123';

    beforeEach(async () => {
      // Create initial test user
      await service.createUser({
        email: testEmail,
        password: testPassword,
      });
    });

    it('should throw ConflictException when creating user with identical email', async () => {
      // Prepare
      const duplicateUserDto: CreateUserDto = {
        email: testEmail,
        password: 'differentPassword',
      };

      // Execute and verify
      await expect(service.createUser(duplicateUserDto)).rejects.toThrow(
        ConflictException,
      );

      // Verify error message
      await expect(service.createUser(duplicateUserDto)).rejects.toThrow(
        'User already exists',
      );
    });

    it('should allow different case email as a new user (case sensitive)', async () => {
      // Prepare
      const uppercaseEmail = testEmail.toUpperCase();
      const caseVariantUserDto: CreateUserDto = {
        email: uppercaseEmail,
        password: 'differentPassword',
      };

      // Execute and verify that case-sensitive emails are treated as different users
      const newUser = await service.createUser(caseVariantUserDto);

      // Verify the user was created with uppercase email preserved
      expect(newUser).toBeDefined();
      expect(newUser.email).toBe(uppercaseEmail);

      // Verify we can find both users with their respective emails
      const originalUser = await service.getUserByEmail({ email: testEmail });
      const uppercaseUser = await service.getUserByEmail({
        email: uppercaseEmail,
      });

      expect(originalUser.id).not.toBe(uppercaseUser.id);
      expect(originalUser.email).toBe(testEmail);
      expect(uppercaseUser.email).toBe(uppercaseEmail);
    });

    it('should throw ConflictException for emails with only trailing/leading spaces', async () => {
      // Prepare
      const emailWithSpaces = ` ${testEmail} `;
      const duplicateUserDto: CreateUserDto = {
        email: emailWithSpaces,
        password: 'differentPassword',
      };

      // Execute and verify that the service handles trimming
      await expect(service.createUser(duplicateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should trim spaces when creating a new user but preserve case', async () => {
      // Prepare a new unique email with spaces
      const newEmailWithSpaces = ` NEW-USER-${Date.now()}@EXAMPLE.COM `;
      const newUserDto: CreateUserDto = {
        email: newEmailWithSpaces,
        password: 'newPassword123',
      };

      // Execute
      const createdUser = await service.createUser(newUserDto);

      // Verify email is trimmed but case is preserved
      const trimmedEmail = newEmailWithSpaces.trim();
      expect(createdUser.email).toBe(trimmedEmail);

      // Verify we cannot retrieve with untrimmed email
      await expect(
        service.getUserByEmail({
          email: newEmailWithSpaces,
        }),
      ).resolves.toBeDefined();

      // Verify we cannot retrieve with different case
      await expect(
        service.getUserByEmail({
          email: trimmedEmail.toLowerCase(),
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
