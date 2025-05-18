import { RewardType } from "@libs/enums";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PagingDto } from "../../common";

export class QueryRewardDto extends PagingDto {
  @ApiProperty({
    enum: RewardType,
    description: "Filter rewards by type",
    required: false,
    example: RewardType.COUPON,
  })
  @IsEnum(RewardType)
  @IsOptional()
  type?: RewardType;

  @ApiProperty({
    description: "Filter rewards by name",
    required: false,
    example: "Discount Coupon",
  })
  @IsString()
  @IsOptional()
  name?: string;
}
