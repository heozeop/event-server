import { EventStatus } from '@libs/enums';
import { EventEntity } from '@libs/types';
import { Exclude, Expose, Transform } from 'class-transformer';

/**
 * DTO for event responses
 */
@Exclude()
export class EventResponseDto {
  @Expose()
  @Transform(({ value }) => value.toString())
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  condition!: Record<string, any>;

  @Expose()
  period!: {
    start: Date;
    end: Date;
  };

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
