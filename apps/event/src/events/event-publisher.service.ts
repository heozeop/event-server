import { PinoLoggerService } from '@libs/logger';
import { JobNames, QueueNames } from '@libs/message-broker';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class EventPublisherService {
  constructor(
    @InjectQueue(QueueNames.EVENT) private readonly eventQueue: Queue,
    @InjectQueue(QueueNames.REWARD) private readonly rewardQueue: Queue,
    private readonly logger: PinoLoggerService,
  ) {}

  /**
   * Publish an event created message
   * @param eventData Event data
   */
  async publishEventCreated(eventData: {
    id: string;
    name: string;
  }): Promise<void> {
    try {
      await this.eventQueue.add(JobNames.EVENT_CREATED, {
        ...eventData,
        timestamp: new Date().toISOString(),
      });
      this.logger.debug(`Published event created: ${eventData.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish event created: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Publish an event updated message
   * @param eventData Event data
   */
  async publishEventUpdated(eventData: {
    id: string;
    name: string;
    status: string;
  }): Promise<void> {
    try {
      await this.eventQueue.add(JobNames.EVENT_UPDATED, {
        ...eventData,
        timestamp: new Date().toISOString(),
      });
      this.logger.debug(`Published event updated: ${eventData.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish event updated: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Publish an event deleted message
   * @param eventId Event ID
   */
  async publishEventDeleted(eventId: string): Promise<void> {
    try {
      await this.eventQueue.add(JobNames.EVENT_DELETED, {
        id: eventId,
        timestamp: new Date().toISOString(),
      });
      this.logger.debug(`Published event deleted: ${eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish event deleted: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Publish a reward request message
   * @param requestData Reward request data
   */
  async publishRewardRequested(requestData: {
    requestId: string;
    userId: string;
    eventId: string;
  }): Promise<void> {
    try {
      await this.rewardQueue.add(JobNames.REWARD_REQUESTED, {
        ...requestData,
        timestamp: new Date().toISOString(),
      });
      this.logger.debug(`Published reward requested: ${requestData.requestId}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish reward requested: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
