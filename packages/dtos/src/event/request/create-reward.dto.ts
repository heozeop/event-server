import { Type } from 'class-transformer';
import {
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString
} from 'class-validator';

export class CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

/**
 * DTO for creating point rewards
 */
export class CreatePointRewardDto extends CreateRewardDto {
  @IsNumber()
  @IsPositive()
  points!: number;
}

/**
 * DTO for creating item rewards
 */
export class CreateItemRewardDto extends CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;
}

/**
 * DTO for creating coupon rewards
 */
export class CreateCouponRewardDto extends CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  couponCode!: string;

  @IsDate()
  @Type(() => Date)
  expiry!: Date;
}

/**
 * DTO for creating badge rewards
 */
export class CreateBadgeRewardDto extends CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  badgeId!: string;
}

/**
 * DTO for creating event rewards
 */
export class CreateEventRewardDto {
  @IsMongoId()
  eventId!: string;

  @IsMongoId()
  rewardId!: string;
} 
