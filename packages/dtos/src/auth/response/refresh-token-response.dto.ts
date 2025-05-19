import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenResponseDto {
  @IsNotEmpty()
  @IsString()
  accessToken!: string;

  static fromEntity(accessToken: string): RefreshTokenResponseDto {
    const dto = new RefreshTokenResponseDto();
    dto.accessToken = accessToken;
    return dto;
  }
}
