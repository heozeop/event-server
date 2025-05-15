import { RewardRequestStatus } from '@libs/enums';
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';

/**
 * DTO for creating a reward request
 */
export class CreateRewardRequestDto {
  @IsMongoId()
  @IsNotEmpty()
  userId!: string;

  @IsMongoId()
  @IsNotEmpty()
  eventId!: string;
}

/**
 * DTO for updating a reward request status
 */
export class UpdateRewardRequestStatusDto {
  @IsMongoId()
  @IsNotEmpty()
  rewardRequestid!: string;

  @IsEnum(RewardRequestStatus)
  status!: RewardRequestStatus;
} 
