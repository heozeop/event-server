export const BULLMQ_MODULE_OPTIONS = "BULLMQ_MODULE_OPTIONS";
export const QUEUE_DECORATOR = "BULLMQ_QUEUE_DECORATOR";
export const PROCESSOR_DECORATOR = "BULLMQ_PROCESSOR_DECORATOR";

export enum QueueNames {
  EVENT = "event",
  REWARD = "reward",
  NOTIFICATION = "notification",
}

export enum JobNames {
  EVENT_CREATED = "event.created",
  EVENT_UPDATED = "event.updated",
  EVENT_DELETED = "event.deleted",
  REWARD_REQUESTED = "reward.requested",
  REWARD_PROCESSED = "reward.processed",
}
