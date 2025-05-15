import { RewardType } from '@libs/enums';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString
} from 'class-validator';

/**
 * DTO for creating point rewards
 */
export class CreatePointRewardDto {
  type = RewardType.POINT;

  @IsNumber()
  @IsPositive()
  points!: number;
}

/**
 * DTO for creating item rewards
 */
export class CreateItemRewardDto {
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
export class CreateCouponRewardDto {
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
export class CreateBadgeRewardDto {
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
