import {
  CreateBadgeRewardDto,
  CreateCouponRewardDto,
  CreateItemRewardDto,
  CreatePointRewardDto,
} from '@libs/dtos';
import { RewardType } from '@libs/enums';
import {
  ArgumentMetadata,
  BadRequestException,
  Inject,
  Injectable,
  PipeTransform,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class RewardValidationPipe implements PipeTransform {
  constructor(@Inject(REQUEST) private readonly req: Request) {}

  async transform(value: unknown, { type }: ArgumentMetadata) {
    if (type === 'param') {
      return value;
    }

    let dtoClass: ClassConstructor<
      | CreatePointRewardDto
      | CreateItemRewardDto
      | CreateCouponRewardDto
      | CreateBadgeRewardDto
    >;

    const rewardType = this.req.params['type'];

    switch (rewardType) {
      case RewardType.POINT:
        dtoClass = CreatePointRewardDto;
        break;
      case RewardType.ITEM:
        dtoClass = CreateItemRewardDto;
        break;
      case RewardType.COUPON:
        dtoClass = CreateCouponRewardDto;
        break;
      case RewardType.BADGE:
        dtoClass = CreateBadgeRewardDto;
        break;
      default:
        throw new BadRequestException('Invalid reward type');
    }

    const dto = plainToInstance(dtoClass, value);
    const errors = validateSync(dto);

    if (errors.length > 0) {
      throw new RpcException(
        errors
          .map((error) => JSON.stringify(error.constraints, null, 2))
          .join(', '),
      );
    }

    return dto;
  }
}
