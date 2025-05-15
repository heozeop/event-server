import { RewardRequestStatus } from '@libs/enums';
import { IsEnum, IsMongoId } from 'class-validator';

/**
 * DTO for creating a reward request
 */
export class CreateRewardRequestDto {
  @IsMongoId()
  eventId!: string;
}

/**
 * DTO for updating a reward request status
 */
export class UpdateRewardRequestStatusDto {
  @IsEnum(RewardRequestStatus)
  status!: RewardRequestStatus;
} 
