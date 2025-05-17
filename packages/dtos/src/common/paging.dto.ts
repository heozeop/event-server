import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class PagingDto {
  @ApiProperty({
    description: 'Number of items to return per page',
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Number of items to skip',
    example: 0,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  offset?: number;
}

