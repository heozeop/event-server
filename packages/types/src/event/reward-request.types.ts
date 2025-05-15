import { RewardRequestStatus } from "@libs/enums";
import { ObjectId } from "@mikro-orm/mongodb";
import { EventEntity } from "./event.types";

/**
 * Interface representing the RewardRequest entity
 */
export interface RewardRequestEntity {
  _id: ObjectId;
  userId: ObjectId;
  event: EventEntity;
  status: RewardRequestStatus;
  createdAt: Date;
} 
