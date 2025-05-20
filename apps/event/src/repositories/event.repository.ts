import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Event } from '../entities/event.entity';

@Injectable()
export class EventRepository extends EntityRepository<Event> {
  constructor(em: EntityManager) {
    super(em, Event);
  }

  async findByIdOrFail(id: ObjectId): Promise<Event> {
    const event = await this.findOne({ _id: id });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async isEventExist(id: ObjectId): Promise<boolean> {
    const event = await this.findOne({ _id: id }, { fields: ['_id'] });

    return !!event;
  }
}
