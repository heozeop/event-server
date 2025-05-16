import { EventStatus } from '@libs/enums';
import { EventEntity } from '@libs/types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsObject,
    IsString,
    ValidateNested,
} from 'class-validator';

/**
 * DTO to represent the event period
 */
export class EventPeriodDto {
  @ApiProperty({
    example: '2023-10-01T00:00:00Z',
    description: 'The start date of the event period',
  })
  @IsDateString()
  @IsNotEmpty()
  start!: string;

  @ApiProperty({
    example: '2023-10-31T23:59:59Z',
    description: 'The end date of the event period',
  })
  @IsDateString()
  @IsNotEmpty()
  end!: string;
}

/**
 * DTO for creating a new event
 */
export class CreateEventDto implements Omit<EventEntity, '_id' | 'period' | 'createdAt' | 'updatedAt'> {
  @ApiProperty({
    example: 'Summer Promotion',
    description: 'The name of the event',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: { minPurchase: 1000, maxRewards: 1 },
    description: 'The conditions for the event',
  })
  @IsObject()
  condition!: Record<string, any>;

  @ApiProperty({
    type: EventPeriodDto,
    description: 'The period of the event',
  })
  @ValidateNested()
  @Type(() => EventPeriodDto)
  period!: EventPeriodDto;

  @ApiProperty({
    enum: EventStatus,
    example: EventStatus.ACTIVE,
    description: 'The status of the event',
  })
  @IsEnum(EventStatus)
  status!: EventStatus;
} 
