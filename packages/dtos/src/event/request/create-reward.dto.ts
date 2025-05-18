import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from "class-validator";

export class CreateRewardDto {
  @ApiProperty({
    description: "The name of the reward",
    example: "Gold Badge",
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

/**
 * DTO for creating point rewards
 */
export class CreatePointRewardDto extends CreateRewardDto {
  @ApiProperty({
    description: "The number of points for the reward",
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  points!: number;
}

/**
 * DTO for creating item rewards
 */
export class CreateItemRewardDto extends CreateRewardDto {
  @ApiProperty({
    description: "The ID of the item to reward",
    example: "item123",
  })
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @ApiProperty({
    description: "The quantity of items to reward",
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  quantity!: number;
}

/**
 * DTO for creating coupon rewards
 */
export class CreateCouponRewardDto extends CreateRewardDto {
  @ApiProperty({
    description: "The coupon code for the reward",
    example: "SUMMER2023",
  })
  @IsString()
  @IsNotEmpty()
  couponCode!: string;

  @ApiProperty({
    description: "The expiry date of the coupon",
    example: "2023-12-31T23:59:59Z",
  })
  @IsDate()
  @Type(() => Date)
  expiry!: Date;
}

/**
 * DTO for creating badge rewards
 */
export class CreateBadgeRewardDto extends CreateRewardDto {
  @ApiProperty({
    description: "The ID of the badge to reward",
    example: "badge123",
  })
  @IsString()
  @IsNotEmpty()
  badgeId!: string;
}

/**
 * DTO for creating event rewards
 */
export class CreateEventRewardDto {
  @ApiProperty({
    description: "The ID of the event for the reward",
    example: "507f1f77bcf86cd799439011",
  })
  @IsMongoId()
  eventId!: string;

  @ApiProperty({
    description: "The ID of the reward to add to the event",
    example: "507f1f77bcf86cd799439012",
  })
  @IsMongoId()
  rewardId!: string;
}
