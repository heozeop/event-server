import { Role } from "@libs/enums";
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
}
