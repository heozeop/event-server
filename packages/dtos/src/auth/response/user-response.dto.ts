import { Role } from "@libs/enums";
import { UserEntity } from "@libs/types";
import { Exclude, Expose } from "class-transformer";
import { IsArray, IsDate, IsEnum, IsNotEmpty, IsString } from "class-validator";

@Exclude()
export class UserResponseDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id!: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  email!: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  @Expose()
  roles!: Role[];

  @IsDate()
  @IsNotEmpty()
  @Expose()
  createdAt!: Date;

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
