import { EventStatus } from "@libs/enums";
import { EventEntity } from "@libs/types";
import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Transform } from "class-transformer";

/**
 * DTO for event responses
 */
@Exclude()
export class EventResponseDto {
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
    description: "The conditions for the event",
    example: { minPurchase: 1000, maxRewards: 1 },
  })
  @Expose()
  condition!: Record<string, any>;

  @ApiProperty({
    description: "The period of the event",
    example: {
      start: "2023-10-01T00:00:00Z",
      end: "2023-10-31T23:59:59Z",
    },
  })
  @Expose()
  period!: {
    start: Date;
    end: Date;
  };

  @ApiProperty({
    description: "The status of the event",
    enum: EventStatus,
    example: EventStatus.ACTIVE,
  })
  @Expose()
  status!: EventStatus;

  /**
   * Static method to convert an Event entity to EventResponseDto
   */
  static fromEntity(event: EventEntity): EventResponseDto {
    const dto = new EventResponseDto();

    Object.assign(dto, {
      id: event._id.toString(),
      name: event.name,
      condition: event.condition,
      period: event.period,
      status: event.status,
    });

    return dto;
  }
}
