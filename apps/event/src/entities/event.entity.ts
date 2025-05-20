import { EventStatus } from '@libs/enums';
import { EventEntity } from '@libs/types';
import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

@Entity()
@Index({ properties: ['status'] })
@Index({ properties: ['name'] })
@Index({ properties: ['periodStart', 'periodEnd'] })
@Index({ properties: ['createdAt'] })
export class Event implements EventEntity {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  @Index()
  name!: string;

  @Property()
  rewardCondition!: Record<string, any>;

  @Property()
  @Index()
  periodStart!: Date;

  @Property()
  @Index()
  periodEnd: Date | null = null;

  @Property()
  @Index()
  status!: EventStatus;

  @Property()
  @Index()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
