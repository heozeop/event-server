import { RewardRequestStatus } from '@libs/enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';

/**
 * DTO for creating a reward request
 */
export class CreateRewardRequestDto {
  @ApiProperty({
    description: 'The ID of the user requesting the reward',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'The ID of the event for which the reward is requested',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  @IsNotEmpty()
  eventId!: string;
}

/**
 * DTO for updating a reward request status
 */
export class UpdateRewardRequestStatusDto {
  @ApiProperty({
    description: 'The ID of the reward request to update',
    example: '507f1f77bcf86cd799439013',
  })
  @IsMongoId()
  @IsNotEmpty()
  rewardRequestid!: string;

  @ApiProperty({
    enum: RewardRequestStatus,
    description: 'The new status of the reward request',
    example: RewardRequestStatus.APPROVED,
  })
  @IsEnum(RewardRequestStatus)
  status!: RewardRequestStatus;
} 
