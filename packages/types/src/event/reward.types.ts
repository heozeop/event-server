import { RewardType } from "@libs/enums";
import { CustomBaseEntity } from "../base.types";

/**
 * Base interface for all reward types
 */
export interface RewardBaseEntity extends CustomBaseEntity {
  type: RewardType;
  name: string;
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
