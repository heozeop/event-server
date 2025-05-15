import { RewardRequestStatus } from '@libs/enums';
import { RewardRequestEntity } from '@libs/types';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { EventResponseDto } from './event-response.dto';

/**
 * DTO for reward request responses
 */
@Exclude()
export class RewardRequestResponseDto {
  @Expose()
  @Transform(({ value }) => value.toString())
  id!: string;

  @Expose()
  @Transform(({ value }) => value.toString())
  userId!: string;

  @Expose()
  @Type(() => EventResponseDto)
  event!: EventResponseDto;

  @Expose()
  status!: RewardRequestStatus;

  @Expose()
  createdAt!: Date;

  /**
   * Static method to convert a RewardRequest entity to RewardRequestResponseDto
   */
  static fromEntity(rewardRequest: RewardRequestEntity): RewardRequestResponseDto {
    const dto = new RewardRequestResponseDto();
    Object.assign(dto, {
      id: rewardRequest._id.toString(),
      userId: rewardRequest.userId.toString(),
      event: EventResponseDto.fromEntity(rewardRequest.event),
      status: rewardRequest.status,
      createdAt: rewardRequest.createdAt,
    });
    return dto;
  }
} 
