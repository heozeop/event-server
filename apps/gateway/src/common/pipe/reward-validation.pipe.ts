import {
  CreateBadgeRewardDto,
  CreateCouponRewardDto,
  CreateItemRewardDto,
  CreatePointRewardDto,
  CreateRewardDto,
} from '@libs/dtos';
import {
  BadRequestException,
  Inject,
  Injectable,
  PipeTransform,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class RewardValidationPipe implements PipeTransform {
  constructor(@Inject(REQUEST) private readonly req: Request) {}

  async transform(value: unknown) {
    let dtoClass: ClassConstructor<CreateRewardDto>;

    const type = this.req.params['type'];

    switch (type) {
      case 'point':
        dtoClass = CreatePointRewardDto;
        break;
      case 'item':
        dtoClass = CreateItemRewardDto;
        break;
      case 'coupon':
        dtoClass = CreateCouponRewardDto;
        break;
      case 'badge':
        dtoClass = CreateBadgeRewardDto;
        break;
      default:
        throw new BadRequestException('Invalid reward type');
    }

    const dto = plainToInstance(dtoClass, value);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException(
        errors
          .map((error) => JSON.stringify(error.constraints, null, 2))
          .join(', '),
      );
    }

    return dto;
  }
}
