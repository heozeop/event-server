import { CreateEventDto, EventResponseDto } from '@libs/dtos';
import { EventStatus } from '@libs/enums';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { EventService } from '../services/event.service';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  async createEvent(
    @Body() createEventDto: CreateEventDto,
  ): Promise<EventResponseDto> {
    const event = await this.eventService.createEvent(createEventDto);

    return EventResponseDto.fromEntity(event);
  }

  @Get(':id')
  async getEvent(@Param('id') id: string): Promise<EventResponseDto> {
    const event = await this.eventService.getEventById(id);

    return EventResponseDto.fromEntity(event);
  }

  @Get()
  async getEvents(
    @Query('status') status?: EventStatus,
    @Query('active', new DefaultValuePipe(false), ParseBoolPipe)
    active?: boolean,
    @Query('name') name?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ): Promise<{ events: EventResponseDto[]; total: number }> {
    const { events, total } = await this.eventService.getEvents({
      status,
      active,
      name,
      limit,
      offset,
    });

    return {
      events: events.map((event) => EventResponseDto.fromEntity(event)),
      total,
    };
  }

  @Put(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: Partial<CreateEventDto>,
  ): Promise<EventResponseDto> {
    const event = await this.eventService.updateEvent(id, updateEventDto);

    return EventResponseDto.fromEntity(event);
  }

  @Delete(':id')
  async deleteEvent(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.eventService.deleteEvent(id);

    return { success: true };
  }
}
