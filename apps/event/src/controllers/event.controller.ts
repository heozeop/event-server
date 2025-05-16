import { EventService } from '@/services/event.service';
import { EVENT_CMP } from '@libs/cmd';
import { QueryByIdDto } from '@libs/dtos';
import {
  CreateEventDto,
  QueryEventDto,
  UpdateEventDto,
} from '@libs/dtos/dist/event/request';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @EventPattern({ cmd: EVENT_CMP.CREATE_EVENT })
  async createEvent(@Payload() createEventDto: CreateEventDto) {
    return this.eventService.createEvent(createEventDto);
  }

  @EventPattern({ cmd: EVENT_CMP.GET_EVENT_BY_ID })
  async getEventById(@Payload() getEventByIdDto: QueryByIdDto) {
    return this.eventService.getEventById(getEventByIdDto);
  }

  @EventPattern({ cmd: EVENT_CMP.GET_EVENTS })
  async getEvents(@Payload() getEventsDto: QueryEventDto) {
    return this.eventService.getEvents(getEventsDto);
  }

  @EventPattern({ cmd: EVENT_CMP.UPDATE_EVENT })
  async updateEvent(@Payload() updateEventDto: UpdateEventDto) {
    return this.eventService.updateEvent(updateEventDto);
  }

  @EventPattern({ cmd: EVENT_CMP.REMOVE_EVENT })
  async removeEvent(@Payload() removeEventDto: QueryByIdDto) {
    return this.eventService.deleteEvent(removeEventDto);
  }
}
