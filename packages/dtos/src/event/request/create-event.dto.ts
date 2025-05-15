import { EventStatus } from '@libs/enums';
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
  @IsDateString()
  @IsNotEmpty()
  start!: string;

  @IsDateString()
  @IsNotEmpty()
  end!: string;
}

/**
 * DTO for creating a new event
 */
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  condition!: Record<string, any>;

  @ValidateNested()
  @Type(() => EventPeriodDto)
  period!: EventPeriodDto;

  @IsEnum(EventStatus)
  status!: EventStatus;
} 
