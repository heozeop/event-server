import { RewardRequestStatus } from '@libs/enums';
import { RewardRequestEntity } from '@libs/types';
import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Event } from './event.entity';

@Entity()
@Unique({ properties: ['userId', 'event'] })
export class RewardRequest implements RewardRequestEntity {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  userId!: ObjectId;

  @ManyToOne(() => Event)
  event!: Event;

  @Property()
  status!: RewardRequestStatus;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
