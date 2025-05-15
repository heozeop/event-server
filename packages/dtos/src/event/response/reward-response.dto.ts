import { RewardType } from '@libs/enums';
import { BadgeRewardEntity, CouponRewardEntity, ItemRewardEntity, PointRewardEntity, RewardBaseEntity } from '@libs/types';
import { Exclude, Expose, Transform } from 'class-transformer';

/**
 * Base DTO for reward responses
 */
@Exclude()
export class RewardResponseDto {
  @Expose()
  @Transform(({ value }) => value.toString())
  id!: string;

  @Expose()
  type!: RewardType;

  /**
   * Static method to convert a RewardBase entity to RewardResponseDto
   */
  static fromEntity(reward: RewardBaseEntity): RewardResponseDto {
    switch (reward.type) {
      case RewardType.POINT:
        return PointRewardResponseDto.fromEntity(reward as PointRewardEntity);
      case RewardType.ITEM:
        return ItemRewardResponseDto.fromEntity(reward as ItemRewardEntity);
      case RewardType.COUPON:
        return CouponRewardResponseDto.fromEntity(reward as CouponRewardEntity);
      case RewardType.BADGE:
        return BadgeRewardResponseDto.fromEntity(reward as BadgeRewardEntity);
      default:
        const dto = new RewardResponseDto();
        Object.assign(dto, {
          id: reward._id.toString(),
          type: reward.type,
        });
        return dto;
    }
  }
}

/**
 * DTO for point reward responses
 */
@Exclude()
export class PointRewardResponseDto extends RewardResponseDto {
  @Expose()
  points!: number;

  /**
   * Static method to convert a PointReward entity to PointRewardResponseDto
   */
  static fromEntity(reward: PointRewardEntity): PointRewardResponseDto {
    const dto = new PointRewardResponseDto();
    Object.assign(dto, {
      id: reward._id.toString(),
      type: reward.type,
      points: reward.points,
    });
    return dto;
  }
}

/**
 * DTO for item reward responses
 */
@Exclude()
export class ItemRewardResponseDto extends RewardResponseDto {
  @Expose()
  itemId!: string;

  @Expose()
  quantity!: number;

  /**
   * Static method to convert an ItemReward entity to ItemRewardResponseDto
   */
  static fromEntity(reward: ItemRewardEntity): ItemRewardResponseDto {
    const dto = new ItemRewardResponseDto();
    Object.assign(dto, {
      id: reward._id.toString(),
      type: reward.type,
      itemId: reward.itemId,
      quantity: reward.quantity,
    });
    return dto;
  }
}

/**
 * DTO for coupon reward responses
 */
@Exclude()
export class CouponRewardResponseDto extends RewardResponseDto {
  @Expose()
  couponCode!: string;

  @Expose()
  expiry!: Date;

  /**
   * Static method to convert a CouponReward entity to CouponRewardResponseDto
   */
  static fromEntity(reward: CouponRewardEntity): CouponRewardResponseDto {
    const dto = new CouponRewardResponseDto();
    Object.assign(dto, {
      id: reward._id.toString(),
      type: reward.type,
      couponCode: reward.couponCode,
      expiry: reward.expiry,
    });
    return dto;
  }
}

/**
 * DTO for badge reward responses
 */
@Exclude()
export class BadgeRewardResponseDto extends RewardResponseDto {
  @Expose()
  badgeId!: string;

  /**
   * Static method to convert a BadgeReward entity to BadgeRewardResponseDto
   */
  static fromEntity(reward: BadgeRewardEntity): BadgeRewardResponseDto {
    const dto = new BadgeRewardResponseDto();
    Object.assign(dto, {
      id: reward._id.toString(),
      type: reward.type,
      badgeId: reward.badgeId,
    });
    return dto;
  }
} 
