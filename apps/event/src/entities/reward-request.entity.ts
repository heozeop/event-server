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
import { EventReward } from './event-reward.entity';

@Entity()
@Unique({ properties: ['userId', 'eventReward'] })
export class RewardRequest implements RewardRequestEntity {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  @Index()
  userId!: ObjectId;

  @ManyToOne(() => EventReward)
  eventReward!: EventReward;

  @Property()
  @Index()
  status!: RewardRequestStatus;

  @Property()
  @Index()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
