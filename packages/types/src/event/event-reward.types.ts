import { ObjectId } from "@mikro-orm/mongodb";
import { EventEntity } from "./event.types";
import { RewardBaseEntity } from "./reward.types";

/**
 * Interface representing the EventReward entity
 */
export interface EventRewardEntity {
  _id: ObjectId;
  event: EventEntity;
  reward: RewardBaseEntity;
}
