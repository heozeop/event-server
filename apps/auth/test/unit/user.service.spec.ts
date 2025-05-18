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

describe('사용자 서비스 (UserService)', () => {
  let service: UserService;
  let app: INestApplication;
  let orm: MikroORM;
  let mongoMemoryOrmModule: MongoMemoryOrmModule;

  // 테스트 데이터
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
      console.error('앱 초기화 오류:', error);
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

  describe('사용자 생성 (createUser)', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      password: 'password123',
    };

    const koreanUserDto: CreateUserDto = {
      email: koreanTestEmail,
      password: koreanTestPassword,
    };

    it('새 사용자를 성공적으로 생성해야 함', async () => {
      // 실행
      const result = await service.createUser(createUserDto);

      // 검증
      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(result.roles).toContain(Role.USER);

      // 데이터베이스에 사용자가 존재하는지 확인
      const userRepository = orm.em.getRepository(User);
      const savedUser = await userRepository.findOne({
        email: createUserDto.email,
      });
      expect(savedUser).toBeDefined();
      expect(savedUser?.email).toBe(createUserDto.email);
    });

    it('한글 정보로 사용자를 생성할 수 있어야 함', async () => {
      // 실행
      const result = await service.createUser(koreanUserDto);

      // 검증
      expect(result).toBeDefined();
      expect(result.email).toBe(koreanUserDto.email);

      // 데이터베이스에 한글 사용자가 존재하는지 확인
      const userRepository = orm.em.getRepository(User);
      const savedUser = await userRepository.findOne({
        email: koreanUserDto.email,
      });
      expect(savedUser).toBeDefined();
      expect(savedUser?.email).toBe(koreanUserDto.email);
    });

    it('이미 존재하는 사용자일 경우 ConflictException을 발생시켜야 함', async () => {
      // 준비
      await service.createUser(createUserDto);

      // 실행 및 검증
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('ID로 사용자 조회 (getUserById)', () => {
    let userId: string;
    let koreanUserId: string;

    beforeEach(async () => {
      // 테스트 사용자 생성 및 ID 가져오기
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

    it('ID로 사용자를 조회해야 함', async () => {
      // 실행
      const result = await service.getUserById({ id: userId });

      // 검증
      expect(result).toBeDefined();
      expect(result.email).toBe(testEmail);
    });

    it('한글 이메일을 가진 사용자를 ID로 조회할 수 있어야 함', async () => {
      // 실행
      const result = await service.getUserById({ id: koreanUserId });

      // 검증
      expect(result).toBeDefined();
      expect(result.email).toBe(koreanTestEmail);
    });

    it('사용자가 존재하지 않을 경우 NotFoundException을 발생시켜야 함', async () => {
      // 준비
      const nonExistentId = new ObjectId().toString();

      // 실행 및 검증
      await expect(service.getUserById({ id: nonExistentId })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('이메일로 사용자 조회 (getUserByEmail)', () => {
    beforeEach(async () => {
      // 테스트 사용자 생성
      await service.createUser({
        email: testEmail,
        password: testPassword,
      });

      await service.createUser({
        email: koreanTestEmail,
        password: koreanTestPassword,
      });
    });

    it('이메일로 사용자를 조회해야 함', async () => {
      // 실행
      const result = await service.getUserByEmail({
        email: testEmail,
      });

      // 검증
      expect(result).toBeDefined();
      expect(result?.email).toBe(testEmail);
    });

    it('한글 이메일로 사용자를 조회할 수 있어야 함', async () => {
      // 실행
      const result = await service.getUserByEmail({
        email: koreanTestEmail,
      });

      // 검증
      expect(result).toBeDefined();
      expect(result?.email).toBe(koreanTestEmail);
    });

    it('사용자가 존재하지 않을 경우 NotFoundException을 발생시켜야 함', async () => {
      // 실행 및 검증
      await expect(
        service.getUserByEmail({
          email: 'nonexistent@example.com',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('역할 업데이트 (updateRoles)', () => {
    let userId: string;
    let koreanUserId: string;

    beforeEach(async () => {
      // 고유 이메일로 테스트 사용자 생성 및 ID 가져오기
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

    it('사용자 역할을 성공적으로 업데이트해야 함', async () => {
      // 준비
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.ADMIN, Role.USER],
      };

      // 실행
      const result = await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // 검증
      expect(result).toBeDefined();
      expect(result.roles).toEqual(
        expect.arrayContaining(updateRolesDto.roles),
      );

      // 데이터베이스에서 역할이 업데이트되었는지 확인
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles).toEqual(
        expect.arrayContaining(updateRolesDto.roles),
      );
    });

    it('한글 이메일을 가진 사용자의 역할을 업데이트할 수 있어야 함', async () => {
      // 준비
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.ADMIN],
      };

      // 실행
      const result = await service.updateRoles({
        id: koreanUserId,
        updateRolesDto,
      });

      // 검증
      expect(result).toBeDefined();
      expect(result.roles).toEqual(
        expect.arrayContaining(updateRolesDto.roles),
      );

      // 데이터베이스에서 역할이 업데이트되었는지 확인
      const updatedUser = await service.getUserById({ id: koreanUserId });
      expect(updatedUser.roles).toEqual(
        expect.arrayContaining(updateRolesDto.roles),
      );
    });

    it('존재하지 않는 사용자의 역할을 업데이트할 경우 NotFoundException을 발생시켜야 함', async () => {
      // 준비
      const nonExistentId = new ObjectId().toString();
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.ADMIN],
      };

      // 실행 및 검증
      await expect(
        service.updateRoles({
          id: nonExistentId,
          updateRolesDto,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('OPERATOR 역할로 성공적으로 업데이트해야 함', async () => {
      // 준비
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.OPERATOR],
      };

      // 실행
      const result = await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // 검증
      expect(result).toBeDefined();
      expect(result.roles).toEqual([Role.OPERATOR]);

      // 데이터베이스에서 역할이 업데이트되었는지 확인
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles).toEqual([Role.OPERATOR]);
    });

    it('AUDITOR 역할로 성공적으로 업데이트해야 함', async () => {
      // 준비
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.AUDITOR],
      };

      // 실행
      const result = await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // 검증
      expect(result).toBeDefined();
      expect(result.roles).toEqual([Role.AUDITOR]);

      // 데이터베이스에서 역할이 업데이트되었는지 확인
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles).toEqual([Role.AUDITOR]);
    });

    it('여러 역할을 동시에 할당해야 함', async () => {
      // 준비
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.USER, Role.ADMIN, Role.OPERATOR],
      };

      // 실행
      const result = await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // 검증
      expect(result).toBeDefined();
      expect(result.roles.sort()).toEqual(updateRolesDto.roles.sort());

      // 데이터베이스에서 역할이 업데이트되었는지 확인
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles.sort()).toEqual(updateRolesDto.roles.sort());
    });
  });

  describe('사용자 검증 (validateUser)', () => {
    beforeEach(async () => {
      // 테스트 사용자 생성
      await service.createUser({
        email: testEmail,
        password: testPassword,
      });

      await service.createUser({
        email: koreanTestEmail,
        password: koreanTestPassword,
      });
    });

    it('사용자 인증 정보를 성공적으로 검증해야 함', async () => {
      // 실행
      const result = await service.validateUser({
        email: testEmail,
        password: testPassword,
      });

      // 검증
      expect(result).toBeDefined();
      expect(result.email).toBe(testEmail);
    });

    it('한글 이메일과 비밀번호로 사용자를 인증할 수 있어야 함', async () => {
      // 실행
      const result = await service.validateUser({
        email: koreanTestEmail,
        password: koreanTestPassword,
      });

      // 검증
      expect(result).toBeDefined();
      expect(result.email).toBe(koreanTestEmail);
    });

    it('사용자가 존재하지 않을 경우 NotFoundException을 발생시켜야 함', async () => {
      // 실행 및 검증
      await expect(
        service.validateUser({
          email: 'nonexistent@example.com',
          password: testPassword,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('비밀번호가 올바르지 않을 경우 UnauthorizedException을 발생시켜야 함', async () => {
      // 실행 및 검증
      await expect(
        service.validateUser({
          email: testEmail,
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('역할별 기능', () => {
    let userId: string;

    beforeEach(async () => {
      // 테스트 사용자 생성
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

    it('기본적으로 USER 역할로 사용자를 생성해야 함', async () => {
      // 준비
      const newUserDto: CreateUserDto = {
        email: `default-role-${Date.now()}@example.com`,
        password: testPassword,
      };

      // 실행
      const result = await service.createUser(newUserDto);

      // 검증
      expect(result.roles).toEqual([Role.USER]);
    });

    it('ADMIN 역할로 업데이트하고 올바르게 조회해야 함', async () => {
      // 준비
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.ADMIN],
      };

      // 실행
      await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // 검증
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles).toEqual([Role.ADMIN]);
    });

    it('한글 문자가 포함된 사용자를 생성하고 여러 역할로 업데이트해야 함', async () => {
      // 준비
      const koreanEmail = `한글사용자-${Date.now()}@example.com`;
      const koreanUser = await service.createUser({
        email: koreanEmail,
        password: '한글비밀번호123',
      });

      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.USER, Role.OPERATOR, Role.AUDITOR],
      };

      // 실행
      await service.updateRoles({
        id: koreanUser.id,
        updateRolesDto,
      });

      // 검증
      const updatedUser = await service.getUserById({ id: koreanUser.id });
      expect(updatedUser.roles.sort()).toEqual(updateRolesDto.roles.sort());
      expect(updatedUser.email).toBe(koreanEmail);
    });
  });

  describe('중복 데이터 처리', () => {
    const testEmail = `duplicate-test-${Date.now()}@example.com`;
    const testPassword = 'password123';

    beforeEach(async () => {
      // 초기 테스트 사용자 생성
      await service.createUser({
        email: testEmail,
        password: testPassword,
      });
    });

    it('동일한 이메일로 사용자를 생성할 경우 ConflictException을 발생시켜야 함', async () => {
      // 준비
      const duplicateUserDto: CreateUserDto = {
        email: testEmail,
        password: 'differentPassword',
      };

      // 실행 및 검증
      await expect(service.createUser(duplicateUserDto)).rejects.toThrow(
        ConflictException,
      );

      // 오류 메시지 검증
      await expect(service.createUser(duplicateUserDto)).rejects.toThrow(
        'User already exists',
      );
    });

    it('다른 대소문자의 이메일을 새로운 사용자로 허용해야 함 (대소문자 구분)', async () => {
      // 준비
      const uppercaseEmail = testEmail.toUpperCase();
      const caseVariantUserDto: CreateUserDto = {
        email: uppercaseEmail,
        password: 'differentPassword',
      };

      // 실행 및 검증 - 대소문자를 구분하여 다른 사용자로 취급
      const newUser = await service.createUser(caseVariantUserDto);

      // 대문자 이메일이 보존되었는지 검증
      expect(newUser).toBeDefined();
      expect(newUser.email).toBe(uppercaseEmail);

      // 각각의 이메일로 두 사용자를 모두 찾을 수 있는지 검증
      const originalUser = await service.getUserByEmail({ email: testEmail });
      const uppercaseUser = await service.getUserByEmail({
        email: uppercaseEmail,
      });

      expect(originalUser.id).not.toBe(uppercaseUser.id);
      expect(originalUser.email).toBe(testEmail);
      expect(uppercaseUser.email).toBe(uppercaseEmail);
    });

    it('앞뒤 공백이 있는 이메일만으로는 ConflictException을 발생시켜야 함', async () => {
      // 준비
      const emailWithSpaces = ` ${testEmail} `;
      const duplicateUserDto: CreateUserDto = {
        email: emailWithSpaces,
        password: 'differentPassword',
      };

      // 실행 및 검증 - 서비스가 공백 제거를 처리하는지 확인
      await expect(service.createUser(duplicateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('새 사용자를 생성할 때 공백을 제거하되 대소문자는 유지해야 함', async () => {
      // 공백이 있는 새로운 고유 이메일 준비
      const newEmailWithSpaces = ` NEW-USER-${Date.now()}@EXAMPLE.COM `;
      const newUserDto: CreateUserDto = {
        email: newEmailWithSpaces,
        password: 'newPassword123',
      };

      // 실행
      const createdUser = await service.createUser(newUserDto);

      // 이메일이 공백이 제거되고 대소문자는 유지되는지 검증
      const trimmedEmail = newEmailWithSpaces.trim();
      expect(createdUser.email).toBe(trimmedEmail);

      // 공백이 제거되지 않은 이메일로 조회할 수 있는지 검증
      await expect(
        service.getUserByEmail({
          email: newEmailWithSpaces,
        }),
      ).resolves.toBeDefined();

      // 다른 대소문자로 조회할 수 없는지 검증
      await expect(
        service.getUserByEmail({
          email: trimmedEmail.toLowerCase(),
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('사용자 역할 기능 테스트', () => {
    let userId: string;

    beforeEach(async () => {
      // 테스트 사용자 생성
      const userDto = {
        email: `role-test-${Date.now()}@example.com`,
        password: testPassword,
      };

      const user = await service.createUser(userDto);
      userId = user.id;
    });

    it('일반 사용자(USER)는 기본 역할로 생성되어야 함', async () => {
      // 실행 및 검증
      const user = await service.getUserById({ id: userId });
      expect(user.roles).toEqual([Role.USER]);
    });

    it('사용자 역할 배열은 빈 배열이 되면 안 됨', async () => {
      // 준비
      const updateRolesDto: UpdateRolesDto = {
        roles: [],
      };

      // 실행 및 검증
      await expect(
        service.updateRoles({
          id: userId,
          updateRolesDto,
        }),
      ).rejects.toThrow();
    });

    it('관리자(ADMIN) 역할로 업데이트하고 올바르게 권한이 부여되어야 함', async () => {
      // 준비
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.ADMIN],
      };

      // 실행
      await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // 검증
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles).toEqual([Role.ADMIN]);
    });

    it('운영자(OPERATOR) 역할로 업데이트하고 올바르게 권한이 부여되어야 함', async () => {
      // 준비
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.OPERATOR],
      };

      // 실행
      await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // 검증
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles).toEqual([Role.OPERATOR]);
    });

    it('감사자(AUDITOR) 역할로 업데이트하고 올바르게 권한이 부여되어야 함', async () => {
      // 준비
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.AUDITOR],
      };

      // 실행
      await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // 검증
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles).toEqual([Role.AUDITOR]);
    });

    it('여러 역할을 동시에 가질 수 있어야 함', async () => {
      // 준비
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.USER, Role.OPERATOR, Role.AUDITOR],
      };

      // 실행
      await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // 검증
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles.sort()).toEqual(updateRolesDto.roles.sort());
    });

    it('모든 역할을 동시에 가질 수 있어야 함', async () => {
      // 준비
      const updateRolesDto: UpdateRolesDto = {
        roles: [Role.USER, Role.ADMIN, Role.OPERATOR, Role.AUDITOR],
      };

      // 실행
      await service.updateRoles({
        id: userId,
        updateRolesDto,
      });

      // 검증
      const updatedUser = await service.getUserById({ id: userId });
      expect(updatedUser.roles.sort()).toEqual(updateRolesDto.roles.sort());
    });
  });

  describe('관리자(ADMIN) 특정 기능 테스트', () => {
    let adminId: string;
    let regularUserId: string;

    beforeEach(async () => {
      // 관리자 사용자 생성
      const adminUser = await service.createUser({
        email: `admin-${Date.now()}@example.com`,
        password: testPassword,
      });

      await service.updateRoles({
        id: adminUser.id,
        updateRolesDto: { roles: [Role.ADMIN] },
      });

      adminId = adminUser.id;

      // 일반 사용자 생성
      const regularUser = await service.createUser({
        email: `user-${Date.now()}@example.com`,
        password: testPassword,
      });

      regularUserId = regularUser.id;
    });

    it('관리자는 정상적으로 로그인할 수 있어야 함', async () => {
      // 관리자로 검색
      const admin = await service.getUserById({ id: adminId });

      // 실행
      const result = await service.validateUser({
        email: admin.email,
        password: testPassword,
      });

      // 검증
      expect(result).toBeDefined();
      expect(result.email).toBe(admin.email);
      expect(result.roles).toEqual([Role.ADMIN]);
    });

    it('관리자 계정 ID로 사용자를 정확히 조회할 수 있어야 함', async () => {
      // 실행
      const result = await service.getUserById({ id: adminId });

      // 검증
      expect(result).toBeDefined();
      expect(result.roles).toEqual([Role.ADMIN]);
    });
  });

  describe('운영자(OPERATOR) 특정 기능 테스트', () => {
    let operatorId: string;

    beforeEach(async () => {
      // 운영자 사용자 생성
      const operatorUser = await service.createUser({
        email: `operator-${Date.now()}@example.com`,
        password: testPassword,
      });

      await service.updateRoles({
        id: operatorUser.id,
        updateRolesDto: { roles: [Role.OPERATOR] },
      });

      operatorId = operatorUser.id;
    });

    it('운영자는 정상적으로 로그인할 수 있어야 함', async () => {
      // 운영자로 검색
      const operator = await service.getUserById({ id: operatorId });

      // 실행
      const result = await service.validateUser({
        email: operator.email,
        password: testPassword,
      });

      // 검증
      expect(result).toBeDefined();
      expect(result.email).toBe(operator.email);
      expect(result.roles).toEqual([Role.OPERATOR]);
    });

    it('운영자 계정으로 이메일 검색이 가능해야 함', async () => {
      // 운영자로 검색
      const operator = await service.getUserById({ id: operatorId });

      // 실행
      const result = await service.getUserByEmail({ email: operator.email });

      // 검증
      expect(result).toBeDefined();
      expect(result.email).toBe(operator.email);
      expect(result.roles).toEqual([Role.OPERATOR]);
    });
  });

  describe('감사자(AUDITOR) 특정 기능 테스트', () => {
    let auditorId: string;

    beforeEach(async () => {
      // 감사자 사용자 생성
      const auditorUser = await service.createUser({
        email: `auditor-${Date.now()}@example.com`,
        password: testPassword,
      });

      await service.updateRoles({
        id: auditorUser.id,
        updateRolesDto: { roles: [Role.AUDITOR] },
      });

      auditorId = auditorUser.id;
    });

    it('감사자는 정상적으로 로그인할 수 있어야 함', async () => {
      // 감사자로 검색
      const auditor = await service.getUserById({ id: auditorId });

      // 실행
      const result = await service.validateUser({
        email: auditor.email,
        password: testPassword,
      });

      // 검증
      expect(result).toBeDefined();
      expect(result.email).toBe(auditor.email);
      expect(result.roles).toEqual([Role.AUDITOR]);
    });

    it('감사자 계정으로 이메일 검색이 가능해야 함', async () => {
      // 감사자로 검색
      const auditor = await service.getUserById({ id: auditorId });

      // 실행
      const result = await service.getUserByEmail({ email: auditor.email });

      // 검증
      expect(result).toBeDefined();
      expect(result.email).toBe(auditor.email);
      expect(result.roles).toEqual([Role.AUDITOR]);
    });
  });

  describe('일반 사용자(USER) 특정 기능 테스트', () => {
    let userId: string;
    let userEmail: string;

    beforeEach(async () => {
      // 일반 사용자 생성
      userEmail = `user-${Date.now()}@example.com`;
      const regularUser = await service.createUser({
        email: userEmail,
        password: testPassword,
      });

      userId = regularUser.id;
    });

    it('일반 사용자는 정상적으로 로그인할 수 있어야 함', async () => {
      // 실행
      const result = await service.validateUser({
        email: userEmail,
        password: testPassword,
      });

      // 검증
      expect(result).toBeDefined();
      expect(result.email).toBe(userEmail);
      expect(result.roles).toEqual([Role.USER]);
    });

    it('일반 사용자는 한글 이메일 주소를 사용할 수 있어야 함', async () => {
      // 준비
      const koreanEmail = `한글사용자-${Date.now()}@example.com`;

      // 실행
      const user = await service.createUser({
        email: koreanEmail,
        password: '한글비밀번호123',
      });

      // 검증
      expect(user).toBeDefined();
      expect(user.email).toBe(koreanEmail);
      expect(user.roles).toEqual([Role.USER]);
    });

    it('일반 사용자 계정으로 이메일 검색이 가능해야 함', async () => {
      // 실행
      const result = await service.getUserByEmail({ email: userEmail });

      // 검증
      expect(result).toBeDefined();
      expect(result.email).toBe(userEmail);
      expect(result.roles).toEqual([Role.USER]);
    });
  });
});
