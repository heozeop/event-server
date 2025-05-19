import { SetMetadata } from '@nestjs/common';

export const SUBSCRIBER_KEY = 'SUBSCRIBER_METADATA';

export interface SubscriberMetadata {
  pattern: string;
}

/**
 * Decorator to subscribe to a RabbitMQ message pattern
 * @param pattern Message pattern to subscribe to
 */
export const SubscribeTo = (pattern: string) =>
  SetMetadata<string, SubscriberMetadata>(SUBSCRIBER_KEY, { pattern }); 
