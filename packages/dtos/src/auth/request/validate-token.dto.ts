import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ValidateTokenDto {
  @ApiProperty({
    description: "The ID of the user whose token is being validated",
    example: "507f1f77bcf86cd799439011",
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: "The access token to validate",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}
