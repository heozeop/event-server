import { UserEntity } from "@libs/types";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsObject, IsString } from "class-validator";
import { UserResponseDto } from "./user-response.dto";

@Exclude()
export class LoginResponseDto {
  @ApiProperty({
    description: "The JWT access token for authentication",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  accessToken!: string;

  @ApiProperty({
    description: "The JWT refresh token for authentication",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  refreshToken!: string;

  @ApiProperty({
    description: "The user information",
    type: UserResponseDto,
  })
  @IsObject()
  @IsNotEmpty()
  @Expose()
  user!: UserResponseDto;

  static fromEntity(accessToken: string, refreshToken: string, user: UserEntity): LoginResponseDto {
    const instance = new LoginResponseDto();

    instance.accessToken = accessToken;
    instance.refreshToken = refreshToken;
    instance.user = UserResponseDto.fromEntity(user);

    return instance;
  }
}
