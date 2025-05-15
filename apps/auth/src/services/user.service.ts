import { User } from '@/entities/user.entity';
import { CreateUserDto, UpdateRolesDto, UserResponseDto } from '@libs/dtos';
import { Role } from '@libs/enums';
import { EntityRepository, ObjectId } from '@mikro-orm/mongodb';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: EntityRepository<User>) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password } = createUserDto;

    // Check if user exists
    const existingUser = await this.userRepository.findOne({ email });
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

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      id: new ObjectId(id),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ email });
  }

  async updateRoles(
    id: string,
    updateRolesDto: UpdateRolesDto,
  ): Promise<UserResponseDto> {
    const user = await this.getUserById(id);
    user.roles = updateRolesDto.roles;

    await this.userRepository.getEntityManager().flush();

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
