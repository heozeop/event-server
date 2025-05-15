import { RewardType } from '@libs/enums';
import {
  BadgeRewardEntity,
  CouponRewardEntity,
  ItemRewardEntity,
  PointRewardEntity,
  RewardBaseEntity,
} from '@libs/types';
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

@Entity({
  collection: 'rewards',
  discriminatorColumn: 'type',
  discriminatorMap: {
    [RewardType.POINT]: 'PointReward',
    [RewardType.ITEM]: 'ItemReward',
    [RewardType.COUPON]: 'CouponReward',
    [RewardType.BADGE]: 'BadgeReward',
  },
  abstract: true,
})
export abstract class RewardBase implements RewardBaseEntity {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  type!: RewardType;

  @Property()
  name!: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

@Entity({ discriminatorValue: RewardType.POINT })
export class PointReward extends RewardBase implements PointRewardEntity {
  @Property()
  points!: number;

  override type: RewardType.POINT = RewardType.POINT;

  constructor(name: string, points: number) {
    super();
    this.name = name;
    this.type = RewardType.POINT;
    this.points = points;
  }
}

@Entity({ discriminatorValue: RewardType.ITEM })
export class ItemReward extends RewardBase implements ItemRewardEntity {
  @Property()
  itemId!: string;

  @Property()
  quantity!: number;

  constructor(name: string, itemId: string, quantity: number) {
    super();
    this.name = name;
    this.itemId = itemId;
    this.quantity = quantity;
  }

  override type: RewardType.ITEM = RewardType.ITEM;
}

@Entity({ discriminatorValue: RewardType.COUPON })
export class CouponReward extends RewardBase implements CouponRewardEntity {
  @Property()
  couponCode!: string;

  @Property()
  expiry!: Date;

  constructor(name: string, couponCode: string, expiry: Date) {
    super();
    this.name = name;
    this.couponCode = couponCode;
    this.expiry = expiry;
  }

  override type: RewardType.COUPON = RewardType.COUPON;
}

@Entity({ discriminatorValue: RewardType.BADGE })
export class BadgeReward extends RewardBase implements BadgeRewardEntity {
  @Property()
  badgeId!: string;

  constructor(name: string, badgeId: string) {
    super();
    this.name = name;
    this.badgeId = badgeId;
  }

  override type: RewardType.BADGE = RewardType.BADGE;
}
