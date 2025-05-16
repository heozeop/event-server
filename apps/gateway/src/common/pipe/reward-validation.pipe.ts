import {
  ArgumentMetadata,
  BadRequestException,
  Inject,
  Injectable,
  PipeTransform,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class RewardValidationPipe implements PipeTransform {
  constructor(@Inject(REQUEST) private readonly req: Request) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    this.validateRewardByType(value);

    return value;
  }

  private validateRewardByType(value: any): void {
    // Check if it's a point reward
    if (this.isPointReward(value)) {
      return;
    }

    // Check if it's an item reward
    if (this.isItemReward(value)) {
      return;
    }

    // Check if it's a coupon reward
    if (this.isCouponReward(value)) {
      return;
    }

    // Check if it's a badge reward
    if (this.isBadgeReward(value)) {
      return;
    }

    throw new BadRequestException('Invalid reward data format');
  }

  private isPointReward(value: any): boolean {
    return value.points !== undefined && typeof value.points === 'number';
  }

  private isItemReward(value: any): boolean {
    return (
      value.itemId !== undefined &&
      typeof value.itemId === 'string' &&
      value.quantity !== undefined &&
      typeof value.quantity === 'number'
    );
  }

  private isCouponReward(value: any): boolean {
    return (
      value.couponCode !== undefined &&
      typeof value.couponCode === 'string' &&
      value.expiry !== undefined
    );
  }

  private isBadgeReward(value: any): boolean {
    return value.badgeId !== undefined && typeof value.badgeId === 'string';
  }
}
