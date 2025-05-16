import { User } from '@/entities/user.entity';
import { AUTH_CMP } from '@libs/cmd';
import { CreateUserDto, QueryByIdDto, UpdateRolesDto } from '@libs/dtos';
import { Role } from '@libs/enums';
import { EntityRepository, ObjectId } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  @MessagePattern({ cmd: AUTH_CMP.CREATE_USER })
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

  @MessagePattern({ cmd: AUTH_CMP.GET_USER_BY_ID })
  async getUserById({ id }: QueryByIdDto): Promise<User> {
    const user = await this.userRepository.findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ email });
  }

  @MessagePattern({ cmd: AUTH_CMP.UPDATE_USER_ROLES })
  async updateRoles({
    id,
    updateRolesDto,
  }: {
    id: string;
    updateRolesDto: UpdateRolesDto;
  }): Promise<User> {
    const user = await this.getUserById({ id });
    user.roles = updateRolesDto.roles;

    await this.userRepository.getEntityManager().flush();

    return user;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
