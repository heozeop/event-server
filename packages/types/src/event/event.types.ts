import { EventStatus } from '@libs/enums';
import { ObjectId } from "@mikro-orm/mongodb";

/**
 * Interface representing the Event entity
 */
export interface EventEntity {
  _id: ObjectId;
  name: string;
  condition: Record<string, any>;
  period: {
    start: Date;
    end: Date;
  };
  status: EventStatus;
}
