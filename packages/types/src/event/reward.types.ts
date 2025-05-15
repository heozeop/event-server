import { RewardType } from "@libs/enums";
import { ObjectId } from "@mikro-orm/mongodb";

/**
 * Base interface for all reward types
 */
export interface RewardBaseEntity {
  _id: ObjectId;
  type: RewardType;
}

/**
 * Interface for Point Rewards
 */
export interface PointRewardEntity extends RewardBaseEntity {
  type: RewardType.POINT;
  points: number;
}

/**
 * Interface for Item Rewards
 */
export interface ItemRewardEntity extends RewardBaseEntity {
  type: RewardType.ITEM;
  itemId: string;
  quantity: number;
}

/**
 * Interface for Coupon Rewards
 */
export interface CouponRewardEntity extends RewardBaseEntity {
  type: RewardType.COUPON;
  couponCode: string;
  expiry: Date;
}

/**
 * Interface for Badge Rewards
 */
export interface BadgeRewardEntity extends RewardBaseEntity {
  type: RewardType.BADGE;
  badgeId: string;
}
