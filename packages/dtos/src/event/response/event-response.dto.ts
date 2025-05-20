import { EventStatus } from "@libs/enums";
import { EventEntity, EventRewardEntity } from "@libs/types";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Transform } from "class-transformer";
import { EventRewardResponseDto } from "./event-reward-response.dto";

export class EventRewardBaseDto {
  @ApiProperty({
    description: "The unique identifier of the event",
    example: "507f1f77bcf86cd799439011",
  })
  @Expose()
  @Transform(({ value }) => value.toString())
  id!: string;

  @ApiProperty({
    description: "The name of the event",
    example: "Summer Promotion",
  })
  @Expose()
  name!: string;

  @ApiProperty({
    description: "The period of the event",
    example: {
      start: "2023-10-01T00:00:00Z",
      end: "2023-10-31T23:59:59Z",
    },
  })
  @Expose()
  periodStart!: Date;

  @ApiProperty({
    description: "The end date of the event period",
    example: "2023-10-31T23:59:59Z",
  })
  @Expose()
  periodEnd?: Date;

  @ApiProperty({
    description: "The status of the event",
    enum: EventStatus,
    example: EventStatus.ACTIVE,
  })
  @Expose()
  status!: EventStatus;

}
/**
 * DTO for event responses
 */
@Exclude()
export class EventResponseDto extends EventRewardBaseDto {
    /**
   * Static method to convert an Event entity to EventResponseDto
   */
  static fromEntity(event: EventEntity): EventResponseDto {
    const dto = new EventResponseDto();

    Object.assign(dto, {
      id: event._id.toString(),
      name: event.name,
      periodStart: event.periodStart,
      periodEnd: event.periodEnd ?? undefined,
      status: event.status,
    });

    return dto;
  }
}

@Exclude()
export class EventWithRewardsResponseDto extends EventRewardBaseDto {
  @ApiProperty({
    type: [EventRewardResponseDto],
  })
  @Expose()
  eventRewards!: EventRewardResponseDto[];

  static fromEntity(
    event: EventEntity,
    eventRewards: EventRewardEntity[],
  ): EventWithRewardsResponseDto {
    const dto = new EventWithRewardsResponseDto();

    Object.assign(dto, {
      id: event._id.toString(),
      name: event.name,
      periodStart: event.periodStart,
      periodEnd: event.periodEnd ?? undefined,
      status: event.status,
      eventRewards: eventRewards.map((eventReward) =>
        EventRewardResponseDto.fromEntity(eventReward),
      ),
    });

    return dto;
  }
}
