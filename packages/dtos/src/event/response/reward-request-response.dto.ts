import { RewardRequestStatus } from "@libs/enums";
import { RewardRequestEntity } from "@libs/types";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Transform, Type } from "class-transformer";
import { EventRewardResponseDto } from "./event-reward-response.dto";

/**
 * DTO for reward request responses
 */
@Exclude()
export class RewardRequestResponseDto {
  @ApiProperty({
    description: "The unique identifier of the reward request",
    example: "507f1f77bcf86cd799439011",
  })
  @Expose()
  @Transform(({ value }) => value.toString())
  id!: string;

  @ApiProperty({
    description: "The user ID who requested the reward",
    example: "507f1f77bcf86cd799439012",
  })
  @Expose()
  @Transform(({ value }) => value.toString())
  userId!: string;

  @ApiProperty({
    description: "The event reward associated with the reward request",
    type: EventRewardResponseDto,
  })
  @Expose()
  @Type(() => EventRewardResponseDto)
  eventReward!: EventRewardResponseDto;

  @ApiProperty({
    description: "The status of the reward request",
    enum: RewardRequestStatus,
    example: RewardRequestStatus.PENDING,
  })
  @Expose()
  status!: RewardRequestStatus;

  @ApiProperty({
    description: "The date when the reward request was created",
    example: "2023-01-01T00:00:00.000Z",
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: "The date when the reward request was updated",
    example: "2023-01-01T00:00:00.000Z",
  })
  @Expose()
  updatedAt!: Date;

  /**
   * Static method to convert a RewardRequest entity to RewardRequestResponseDto
   */
  static fromEntity(
    rewardRequest: RewardRequestEntity,
  ): RewardRequestResponseDto {
    const dto = new RewardRequestResponseDto();
    Object.assign(dto, {
      id: rewardRequest._id.toString(),
      userId: rewardRequest.userId.toString(),
      eventReward: EventRewardResponseDto.fromEntity(rewardRequest.eventReward),
      status: rewardRequest.status,
      createdAt: rewardRequest.createdAt,
      updatedAt: rewardRequest.updatedAt,
    });
    return dto;
  }
}
