import { RewardRequestStatus } from '@libs/enums';
import { RewardRequestEntity } from '@libs/types';
import {
  Entity,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Event } from './event.entity';

@Entity()
@Unique({ properties: ['userId', 'event'] })
@Index({ properties: ['userId'] })
@Index({ properties: ['status'] })
@Index({ properties: ['createdAt'] })
export class RewardRequest implements RewardRequestEntity {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  @Index()
  userId!: ObjectId;

  @ManyToOne(() => Event)
  @Index()
  event!: Event;

  @Property()
  @Index()
  status!: RewardRequestStatus;

  @Property()
  condition!: Record<string, any>;

  @Property()
  @Index()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
