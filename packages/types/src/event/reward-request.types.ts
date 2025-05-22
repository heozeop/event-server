import { RewardRequestStatus } from "@libs/enums";
import { ObjectId } from "@mikro-orm/mongodb";
import { CustomBaseEntity } from "../base.types";
import { EventRewardEntity } from "./event-reward.types";

/**
 * Interface representing the RewardRequest entity
 */
export interface RewardRequestEntity extends CustomBaseEntity {
  userId: ObjectId;
  eventReward: EventRewardEntity;
  status: RewardRequestStatus;
}
