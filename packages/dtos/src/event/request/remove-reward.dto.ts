import { IsMongoId, IsNotEmpty } from 'class-validator';

export class RemoveRewardDto {
  @IsMongoId()
  @IsNotEmpty()
  eventId!: string;

  @IsMongoId()
  @IsNotEmpty()
  rewardId!: string;
}
