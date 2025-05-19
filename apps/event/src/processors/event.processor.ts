import { PinoLoggerService } from '@libs/logger';
import { JobNames, ProcessJob, QueueNames } from '@libs/message-broker';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { EventService } from '../services/event.service';

@Injectable()
export class EventProcessor {
  constructor(
    private readonly eventService: EventService,
    private readonly logger: PinoLoggerService,
    @InjectQueue(QueueNames.EVENT)
    private readonly eventQueue: Queue,
  ) {}

  @ProcessJob({
    queueName: QueueNames.EVENT,
    jobName: JobNames.EVENT_CREATED,
  })
  async handleEventCreated(job: Job): Promise<void> {
    const { data } = job.data;
    this.logger.log(`Processing event created: ${data.id}`);

    try {
      // Notify other services or perform additional processing
      // For example, you might want to send notifications or update analytics

      this.logger.log(`Event created processed: ${data.id}`);
    } catch (error) {
      this.logger.error(
        `Error processing event created: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @ProcessJob({
    queueName: QueueNames.EVENT,
    jobName: JobNames.EVENT_UPDATED,
  })
  async handleEventUpdated(job: Job): Promise<void> {
    const { data } = job.data;
    this.logger.log(`Processing event updated: ${data.id}`);

    try {
      // Handle event update processing

      this.logger.log(`Event updated processed: ${data.id}`);
    } catch (error) {
      this.logger.error(
        `Error processing event updated: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @ProcessJob({
    queueName: QueueNames.EVENT,
    jobName: JobNames.EVENT_DELETED,
  })
  async handleEventDeleted(job: Job): Promise<void> {
    const { data } = job.data;
    this.logger.log(`Processing event deleted: ${data.id}`);

    try {
      // Handle event deletion processing

      this.logger.log(`Event deleted processed: ${data.id}`);
    } catch (error) {
      this.logger.error(
        `Error processing event deleted: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
