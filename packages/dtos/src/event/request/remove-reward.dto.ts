import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class RemoveRewardDto {
  @ApiProperty({
    description: 'The ID of the event containing the reward',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({
    description: 'The ID of the reward to remove',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  @IsNotEmpty()
  rewardId!: string;
}
