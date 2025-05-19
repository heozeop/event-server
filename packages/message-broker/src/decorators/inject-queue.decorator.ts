import { Inject } from '@nestjs/common';
import { QUEUE_DECORATOR } from '../constants';

/**
 * Decorator to inject a BullMQ queue
 * @param queueName Queue name
 */
export const InjectQueue = (queueName: string) => Inject(`${QUEUE_DECORATOR}:${queueName}`); 
