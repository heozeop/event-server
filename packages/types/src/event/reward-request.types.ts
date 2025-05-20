import { RewardRequestStatus } from "@libs/enums";
import { ObjectId } from "@mikro-orm/mongodb";
import { CustomBaseEntity } from "../base.types";
import { EventEntity } from "./event.types";

/**
 * Interface representing the RewardRequest entity
 */
export interface RewardRequestEntity extends CustomBaseEntity {
  userId: ObjectId;
  event: EventEntity;
  status: RewardRequestStatus;
  condition: Record<string, any>;
}
