import { Role } from "@libs/enums";
import { UserEntity } from "@libs/types";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsArray, IsDate, IsEnum, IsNotEmpty, IsString } from "class-validator";

@Exclude()
export class UserResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  email!: string;

  @ApiProperty({
    description: 'The roles assigned to the user',
    example: [Role.USER],
    enum: Role,
    isArray: true,
  })
  @IsArray()
  @IsEnum(Role, { each: true })
  @Expose()
  roles!: Role[];

  @ApiProperty({
    description: 'The date when the user was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsDate()
  @IsNotEmpty()
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'The date when the user was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsDate()
  @IsNotEmpty()
  @Expose()
  updatedAt!: Date;

  static fromEntity(user: UserEntity): UserResponseDto {
    const instance = new UserResponseDto();

    instance.id = user._id.toString();
    instance.email = user.email;
    instance.roles = user.roles;
    instance.createdAt = user.createdAt;
    instance.updatedAt = user.updatedAt;

    return instance;
  }
}
