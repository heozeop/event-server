import { BadgeRewardEntity, CouponRewardEntity, ItemRewardEntity, PointRewardEntity } from '@libs/types';
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
export class CreatePointRewardDto implements Omit<PointRewardEntity, '_id' | 'type'> {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @IsPositive()
  points!: number;
}

/**
 * DTO for creating item rewards
 */
export class CreateItemRewardDto implements Omit<ItemRewardEntity, '_id' | 'type'> {
  @IsString()
  @IsNotEmpty()
  name!: string;

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
export class CreateCouponRewardDto implements Omit<CouponRewardEntity, '_id' | 'type'> {
  @IsString()
  @IsNotEmpty()
  name!: string;

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
export class CreateBadgeRewardDto implements Omit<BadgeRewardEntity, '_id' | 'type'> {
  @IsString()
  @IsNotEmpty()
  name!: string;

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
