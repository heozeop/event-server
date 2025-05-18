import { EventStatus } from "@libs/enums";
import { EventEntity } from "@libs/types";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString
} from "class-validator";

/**
 * DTO for creating a new event
 */
export class CreateEventDto
  implements Omit<EventEntity, "_id" | "periodEnd" | "createdAt" | "updatedAt">
{
  @ApiProperty({
    example: "Summer Promotion",
    description: "The name of the event",
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: { minPurchase: 1000, maxRewards: 1 },
    description: "The conditions for the event",
  })
  @IsObject()
  condition!: Record<string, any>;

  @ApiProperty({
    description: "The period of the event",
  })
  @IsDate()
  @IsNotEmpty()
  periodStart!: Date;

  @ApiProperty({
    example: "2023-10-31T23:59:59Z",
    description: "The end date of the event period",
  })
  @IsDate()
  @IsOptional()
  periodEnd?: Date;

  @ApiProperty({
    enum: EventStatus,
    example: EventStatus.ACTIVE,
    description: "The status of the event",
  })
  @IsEnum(EventStatus)
  status!: EventStatus;
}
