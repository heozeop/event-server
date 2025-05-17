import { User } from '@/entities/user.entity';
import {
  CreateUserDto,
  QueryByIdDto,
  QueryUserByEmailDto,
  UpdateRolesDto,
} from '@libs/dtos';
import { Role } from '@libs/enums';
import { PinoLoggerService } from '@libs/logger';
import { EntityRepository, ObjectId } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly logger: PinoLoggerService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, password } = createUserDto;

    // Check if user exists
    const existingUser = await this.userRepository.findOne(
      { email },
      { fields: ['_id'] },
    );
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user entity
    const user = this.userRepository.create({
      email,
      passwordHash,
      roles: [Role.USER],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.userRepository.getEntityManager().flush();

    return user;
  }

  async getUserById({ id }: QueryByIdDto): Promise<User> {
    const user = await this.userRepository.findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserByEmail({ email }: QueryUserByEmailDto): Promise<User> {
    const user = await this.userRepository.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateRoles({
    id,
    updateRolesDto,
  }: {
    id: string;
    updateRolesDto: UpdateRolesDto;
  }): Promise<User> {
    const user = await this.userRepository.findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      this.logger.warn('Role update attempted for non-existent user', {
        userId: id,
        requestedRoles: updateRolesDto.roles,
      });

      throw new NotFoundException('User not found');
    }

    const previousRoles = [...user.roles];
    user.roles = updateRolesDto.roles;

    await this.userRepository.getEntityManager().flush();

    // Log the additional role change details
    this.logger.log('Role update details', {
      userId: id,
      email: user.email,
      previousRoles,
      newRoles: user.roles,
      updatedBy: 'system',
    });

    return user;
  }

  async validateUser({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<User> {
    // Check if user exists
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      this.logger.warn('Authentication attempt with non-existent user', {
        email,
      });
      throw new NotFoundException('User not found');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn('Authentication failed - invalid password', {
        userId: user._id.toString(),
        email,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
