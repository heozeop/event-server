import { RewardRequestStatus } from "@libs/enums";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsMongoId, IsOptional, IsString } from "class-validator";
import { PagingDto } from "../../common";

export class QueryRewardRequestDto extends PagingDto {
  @ApiProperty({
    description: "Filter reward requests by user ID",
    required: false,
    example: "user123",
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: "Filter reward requests by event ID",
    required: false,
    example: "507f1f77bcf86cd799439011",
  })
  @IsMongoId()
  @IsOptional()
  eventId?: string;

  @ApiProperty({
    enum: RewardRequestStatus,
    description: "Filter reward requests by status",
    required: false,
    example: RewardRequestStatus.PENDING,
  })
  @IsEnum(RewardRequestStatus)
  @IsOptional()
  status?: RewardRequestStatus;
}
