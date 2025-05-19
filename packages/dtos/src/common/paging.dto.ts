import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class PagingDto {
  @ApiProperty({
    description: "Number of items to return per page",
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: "Page number",
    example: 1,
    required: false,
  })
  @IsPositive()
  @IsOptional()
  page?: number;
}
