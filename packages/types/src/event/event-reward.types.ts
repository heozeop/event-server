import { CustomBaseEntity } from "../base.types";
import { EventEntity } from "./event.types";
import { RewardBaseEntity } from "./reward.types";

/**
 * Interface representing the EventReward entity
 */
export interface EventRewardEntity extends CustomBaseEntity {
  event: EventEntity;
  reward: RewardBaseEntity;
  condition: Record<string, any>;
  autoResolve: boolean;
}
