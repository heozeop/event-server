import { EventRewardEntity } from '@libs/types';
import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Event } from './event.entity';
import { RewardBase } from './reward.entity';

@Entity()
@Unique({ properties: ['event', 'reward'] })
export class EventReward implements EventRewardEntity {
  @PrimaryKey()
  _id!: ObjectId;

  @ManyToOne(() => Event)
  event!: Event;

  @ManyToOne(() => RewardBase)
  reward!: RewardBase;

  @Property()
  condition!: Record<string, any>;

  @Property()
  autoResolve!: boolean;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
