import { RewardRequestStatus } from '@libs/enums';
import { RewardRequestEntity } from '@libs/types';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { EventResponseDto } from './event-response.dto';

/**
 * DTO for reward request responses
 */
@Exclude()
export class RewardRequestResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the reward request',
    example: '507f1f77bcf86cd799439011',
  })
  @Expose()
  @Transform(({ value }) => value.toString())
  id!: string;

  @ApiProperty({
    description: 'The user ID who requested the reward',
    example: '507f1f77bcf86cd799439012',
  })
  @Expose()
  @Transform(({ value }) => value.toString())
  userId!: string;

  @ApiProperty({
    description: 'The event associated with the reward request',
    type: EventResponseDto,
  })
  @Expose()
  @Type(() => EventResponseDto)
  event!: EventResponseDto;

  @ApiProperty({
    description: 'The status of the reward request',
    enum: RewardRequestStatus,
    example: RewardRequestStatus.PENDING,
  })
  @Expose()
  status!: RewardRequestStatus;

  @ApiProperty({
    description: 'The date when the reward request was created',
    example: '2023-01-01T00:00:00.000Z',
  })
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
