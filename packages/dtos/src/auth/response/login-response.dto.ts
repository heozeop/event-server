import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsObject, IsString } from "class-validator";
import { UserResponseDto } from "./user-response.dto";

@Exclude()
export class LoginResponseDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  accessToken!: string;

  @IsObject()
  @IsNotEmpty()
  @Expose()
  user!: UserResponseDto;
}
