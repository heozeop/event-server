import { EventStatus } from '@libs/enums';
import { EventEntity } from '@libs/types';
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

@Entity()
export class Event implements EventEntity {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;

  @Property()
  condition!: Record<string, any>;

  @Property()
  period!: {
    start: Date;
    end: Date;
  };

  @Property()
  status!: EventStatus;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
