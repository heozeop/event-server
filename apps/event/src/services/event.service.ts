import { EventReward } from '@/entities';
import { CachedEntity, CacheService } from '@libs/cache';
import {
  CreateEventDto,
  QueryByIdDto,
  QueryEventDto,
  UpdateEventDto,
} from '@libs/dtos';
import { EventRewardEntity } from '@libs/types';
import { cachedToEntity, toObjectId } from '@libs/utils';
import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Event } from '../entities/event.entity';
import { EventRepository } from '../repositories';
@Injectable()
export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    @InjectRepository(EventReward)
    private readonly eventRewardRepository: EntityRepository<EventReward>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create a new event
   */
  async createEvent({
    name,
    periodStart,
    periodEnd,
    status,
    rewardCondition,
  }: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      name,
      periodStart,
      periodEnd: periodEnd ?? null,
      status,
      rewardCondition,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.eventRepository.getEntityManager().persistAndFlush(event);

    // Invalidate cache for events list
    await this.cacheService.delByPattern('events:list:*');

    return event;
  }

  /**
   * Get a single event by ID
   */
  async getEventById({ id }: QueryByIdDto): Promise<{
    event: Event;
    eventRewards: EventRewardEntity[];
  }> {
    // Try to get from cache first
    const cacheKey = `events:${id}`;
    const cachedEvent = await this.cacheService.get<{
      event: CachedEntity<Event>;
      eventRewards: CachedEntity<EventRewardEntity>[];
    }>(cacheKey);

    if (cachedEvent) {
      return {
        event: cachedToEntity(Event, cachedEvent.event),
        eventRewards: cachedEvent.eventRewards.map((eventReward) =>
          cachedToEntity(EventReward, eventReward),
        ),
      };
    }

    const event = await this.eventRepository.findOne({
      _id: toObjectId(id),
    });
    const eventRewards = await this.eventRewardRepository.find(
      {
        event: event,
      },
      { populate: ['reward'] },
    );

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const result = {
      event,
      eventRewards,
    };

    // Cache the event for 5 minutes
    await this.cacheService.set(cacheKey, result, 300);

    return result;
  }

  async isEventExist({ id }: QueryByIdDto): Promise<boolean> {
    // Check cache first
    const cacheKey = `events:${id}`;
    const cachedEvent =
      await this.cacheService.get<CachedEntity<Event>>(cacheKey);

    if (cachedEvent) {
      return true;
    }

    const event = await this.eventRepository.findOne(
      {
        _id: toObjectId(id),
      },
      {
        fields: ['_id'],
      },
    );

    return event !== null;
  }

  /**
   * Get events with optional filtering and cursor-based pagination
   */
  async getEvents({
    status,
    inPeriod,
    name,
    limit = 10,
    cursor,
  }: QueryEventDto & { cursor?: string }): Promise<{
    events: Event[];
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  }> {
    // Create a cache key based on the query parameters
    const cacheKey = `events:list:${status || ''}:${inPeriod || ''}:${name || ''}:${limit}:${cursor || ''}`;

    // Try to get from cache first
    const cachedResult = await this.cacheService.get<{
      events: CachedEntity<Event>[];
      total: number;
      hasMore: boolean;
      nextCursor?: string;
    }>(cacheKey);

    if (cachedResult) {
      return {
        events: cachedResult.events.map((event) =>
          cachedToEntity(Event, event),
        ),
        total: cachedResult.total,
        hasMore: cachedResult.hasMore,
        nextCursor: cachedResult.nextCursor,
      };
    }

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

    const total = await this.eventRepository.count(query);

    // Implement cursor-based pagination
    if (cursor) {
      try {
        const decodedCursor = JSON.parse(
          Buffer.from(cursor, 'base64').toString(),
        );
        if (decodedCursor.id) {
          query._id = { $gt: toObjectId(decodedCursor.id) };
        }
      } catch (error) {
        // Invalid cursor, ignore it
      }
    }

    // Fetch one more item than requested to determine if there are more items
    const events = await this.eventRepository.find(query, {
      limit: limit + 1,
      orderBy: { _id: 'asc' },
    });

    const hasMore = events.length > limit;
    // Remove the extra item if there are more items
    const resultEvents = hasMore ? events.slice(0, limit) : events;

    let nextCursor;
    if (hasMore && resultEvents.length > 0) {
      const lastEvent = resultEvents[resultEvents.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ id: lastEvent._id.toString() }),
      ).toString('base64');
    }

    const result = {
      events: resultEvents,
      total,
      hasMore,
      nextCursor,
    };

    // Cache the result for 1 minutes
    await this.cacheService.set(cacheKey, result, 10);

    return result;
  }

  /**
   * Update an event
   */
  async updateEvent({
    id,
    name,
    periodStart,
    periodEnd,
    status,
  }: UpdateEventDto): Promise<Event> {
    const event = await this.eventRepository.findByIdOrFail(toObjectId(id));

    if (name) {
      event.name = name;
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

    // Update cache and invalidate related caches
    await this.cacheService.set(`events:${id}`, event, 300);
    await this.cacheService.delByPattern('events:list:*');

    return event;
  }

  /**
   * Delete an event
   */
  async deleteEvent({ id }: QueryByIdDto): Promise<void> {
    const event = await this.eventRepository.findByIdOrFail(toObjectId(id));
    await this.eventRepository.getEntityManager().removeAndFlush(event);

    // Invalidate caches
    await this.cacheService.del(`events:${id}`);
    await this.cacheService.delByPattern('events:list:*');
  }
}
