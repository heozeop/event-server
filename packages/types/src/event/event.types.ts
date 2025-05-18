import { EventStatus } from "@libs/enums";
import { CustomBaseEntity } from "../base.types";

/**
 * Interface representing the Event entity
 */
export interface EventEntity extends CustomBaseEntity {
  name: string;
  condition: Record<string, any>;
  period: {
    start: Date;
    end: Date;
  };
  status: EventStatus;
}
