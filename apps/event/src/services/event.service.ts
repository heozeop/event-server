import {
  CreateEventDto,
  QueryByIdDto,
  QueryEventDto,
  UpdateEventDto,
} from '@libs/dtos';
import { LogExecution, PinoLoggerService } from '@libs/logger';
import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Event } from '../entities/event.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: EntityRepository<Event>,
    private readonly logger: PinoLoggerService,
  ) {}

  /**
   * Create a new event
   */
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Creating event',
    exitMessage: 'Event created',
  })
  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      name: createEventDto.name,
      condition: createEventDto.condition,
      period: {
        start: new Date(createEventDto.period.start),
        end: new Date(createEventDto.period.end),
      },
      status: createEventDto.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.eventRepository.create(event);
    await this.eventRepository.getEntityManager().flush();

    return event;
  }

  /**
   * Get a single event by ID
   */
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting event by ID',
    exitMessage: 'Event retrieved',
  })
  async getEventById({ id }: QueryByIdDto): Promise<Event> {
    const event = await this.eventRepository.findOne({
      _id: new ObjectId(id),
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  /**
   * Get events with optional filtering
   */
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Getting events',
    exitMessage: 'Events retrieved',
  })
  async getEvents({
    status,
    active,
    name,
    limit = 10,
    offset = 0,
  }: QueryEventDto): Promise<{ events: Event[]; total: number }> {
    const query: FilterQuery<Event> = {};

    if (status) {
      query.status = status;
    }

    if (active) {
      const now = new Date();
      query.period = {
        start: { $lte: now },
        end: { $gte: now },
      };
    }

    if (name) {
      query.name = { $ilike: name };
    }

    const [events, total] = await this.eventRepository.findAndCount(query, {
      limit,
      offset,
    });

    return { events, total };
  }

  /**
   * Update an event
   */
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Updating event',
    exitMessage: 'Event updated',
  })
  async updateEvent({
    id,
    name,
    condition,
    period,
    status,
  }: UpdateEventDto): Promise<Event> {
    const event = await this.getEventById({ id });

    if (name) {
      event.name = name;
    }

    if (condition) {
      event.condition = condition;
    }

    if (period) {
      event.period = {
        start: new Date(period.start),
        end: new Date(period.end),
      };
    }

    if (status) {
      event.status = status;
    }

    await this.eventRepository.getEntityManager().flush();
    return event;
  }

  /**
   * Delete an event
   */
  @LogExecution({
    entryLevel: 'log',
    exitLevel: 'log',
    entryMessage: 'Deleting event',
    exitMessage: 'Event deleted',
  })
  async deleteEvent({ id }: QueryByIdDto): Promise<void> {
    const event = await this.getEventById({ id });
    await this.eventRepository.getEntityManager().removeAndFlush(event);
  }
}
