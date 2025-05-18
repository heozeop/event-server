import {
  CreateEventDto,
  QueryByIdDto,
  QueryEventDto,
  UpdateEventDto,
} from '@libs/dtos';
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
  ) {}

  /**
   * Create a new event
   */
  async createEvent({name, condition, periodStart, periodEnd, status}: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      name,
      condition,
      periodStart,
      periodEnd: periodEnd ?? null,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.eventRepository.getEntityManager().persistAndFlush(event);

    return event;
  }

  /**
   * Get a single event by ID
   */
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
  async getEvents({
    status,
    inPeriod,
    name,
    limit = 10,
    offset = 0,
  }: QueryEventDto): Promise<{ events: Event[]; total: number }> {
    const query: FilterQuery<Event> = {};

    if (status) {
      query.status = status;
    }

    if (inPeriod) {
      const now = new Date();
      query.$and = [
        { periodStart: { $lte: now } },
        {
          $or: [
            { periodEnd: { $gte: now } },
            { periodEnd: { $exists: false } },
          ],
        },
      ];
    }

    if (name) {
      query.name = new RegExp(name, 'i');
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
  async updateEvent({
    id,
    name,
    condition,
    periodStart,
    periodEnd,
    status,
  }: UpdateEventDto): Promise<Event> {
    const event = await this.getEventById({ id });

    if (name) {
      event.name = name;
    }

    if (condition) {
      event.condition = condition;
    }

    if (periodStart) {
      event.periodStart = new Date(periodStart);
    }

    if (periodEnd) {
      event.periodEnd = new Date(periodEnd);
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
  async deleteEvent({ id }: QueryByIdDto): Promise<void> {
    const event = await this.getEventById({ id });
    await this.eventRepository.getEntityManager().removeAndFlush(event);
  }
}
