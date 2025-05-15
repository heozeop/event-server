import { RewardRequestStatus } from "@libs/enums";
import { ObjectId } from "@mikro-orm/mongodb";
import { EventEntity } from "./event.types";
import { CustomBaseEntity } from "../base.types";

/**
 * Interface representing the RewardRequest entity
 */
export interface RewardRequestEntity extends CustomBaseEntity {
  userId: ObjectId;
  event: EventEntity;
  status: RewardRequestStatus;
} 
