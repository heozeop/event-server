import { EventService } from '@/services/event.service';
import { EVENT_CMP } from '@libs/cmd';
import { EventResponseDto, QueryByIdDto } from '@libs/dtos';
import {
  CreateEventDto,
  QueryEventDto,
  UpdateEventDto,
} from '@libs/dtos/dist/event/request';
import { LogExecution, PinoLoggerService } from '@libs/logger';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
@Controller('event')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly logger: PinoLoggerService,
  ) {}

  @EventPattern({ cmd: EVENT_CMP.CREATE_EVENT })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Creating event',
    exitMessage: 'Event created',
  })
  async createEvent(
    @Payload() createEventDto: CreateEventDto,
  ): Promise<EventResponseDto> {
    const event = await this.eventService.createEvent(createEventDto);

    return EventResponseDto.fromEntity(event);
  }

  @EventPattern({ cmd: EVENT_CMP.GET_EVENT_BY_ID })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting event by ID',
    exitMessage: 'Event retrieved',
  })
  async getEventById(
    @Payload() getEventByIdDto: QueryByIdDto,
  ): Promise<EventResponseDto> {
    const event = await this.eventService.getEventById(getEventByIdDto);

    return EventResponseDto.fromEntity(event);
  }

  @EventPattern({ cmd: EVENT_CMP.GET_EVENTS })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting events',
    exitMessage: 'Events retrieved',
  })
  async getEvents(
    @Payload() getEventsDto: QueryEventDto,
  ): Promise<EventResponseDto[]> {
    const events = await this.eventService.getEvents(getEventsDto);

    return events.events.map(EventResponseDto.fromEntity);
  }

  @EventPattern({ cmd: EVENT_CMP.UPDATE_EVENT })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Updating event',
    exitMessage: 'Event updated',
  })
  async updateEvent(
    @Payload() updateEventDto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    const event = await this.eventService.updateEvent(updateEventDto);

    return EventResponseDto.fromEntity(event);
  }

  @EventPattern({ cmd: EVENT_CMP.REMOVE_EVENT })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Removing event',
    exitMessage: 'Event removed',
  })
  async removeEvent(@Payload() removeEventDto: QueryByIdDto): Promise<void> {
    await this.eventService.deleteEvent(removeEventDto);
  }
}
