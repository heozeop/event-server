import { EventService } from '@/services/event.service';
import { EVENT_CMP } from '@libs/cmd';
import { QueryByIdDto } from '@libs/dtos';
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
  async createEvent(@Payload() createEventDto: CreateEventDto) {
    return this.eventService.createEvent(createEventDto);
  }

  @EventPattern({ cmd: EVENT_CMP.GET_EVENT_BY_ID })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting event by ID',
    exitMessage: 'Event retrieved',
  })
  async getEventById(@Payload() getEventByIdDto: QueryByIdDto) {
    return this.eventService.getEventById(getEventByIdDto);
  }

  @EventPattern({ cmd: EVENT_CMP.GET_EVENTS })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting events',
    exitMessage: 'Events retrieved',
  })
  async getEvents(@Payload() getEventsDto: QueryEventDto) {
    return this.eventService.getEvents(getEventsDto);
  }

  @EventPattern({ cmd: EVENT_CMP.UPDATE_EVENT })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Updating event',
    exitMessage: 'Event updated',
  })
  async updateEvent(@Payload() updateEventDto: UpdateEventDto) {
    return this.eventService.updateEvent(updateEventDto);
  }

  @EventPattern({ cmd: EVENT_CMP.REMOVE_EVENT })
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Removing event',
    exitMessage: 'Event removed',
  })
  async removeEvent(@Payload() removeEventDto: QueryByIdDto) {
    return this.eventService.deleteEvent(removeEventDto);
  }
}
