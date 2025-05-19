import { PinoLoggerService } from '@libs/logger';
import { JobNames, ProcessJob, QueueNames } from '@libs/message-broker';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { RewardRequestService } from '../services/reward-request.service';
import { RewardService } from '../services/reward.service';

@Injectable()
export class RewardProcessor {
  constructor(
    private readonly rewardService: RewardService,
    private readonly rewardRequestService: RewardRequestService,
    private readonly logger: PinoLoggerService,
    @InjectQueue(QueueNames.REWARD)
    private rewardQueue: Queue<any, any, string>,
  ) {}

  @ProcessJob({
    queueName: QueueNames.REWARD,
    jobName: JobNames.REWARD_REQUESTED,
    concurrency: 5,
  })
  async handleRewardRequested(job: Job): Promise<void> {
    const { data } = job.data;
    this.logger.log(`Processing reward request: ${data.requestId}`);

    try {
      // Asynchronously process the reward request
      // This could involve validating the request, checking eligibility,
      // and provisioning the reward to the user

      // After processing, you could add a job to notify the user
      await this.rewardQueue.add(
        JobNames.REWARD_PROCESSED,
        {
          requestId: data.requestId,
          userId: data.userId,
          eventId: data.eventId,
          status: 'processed',
          timestamp: new Date().toISOString(),
        },
        {
          removeOnComplete: true,
        },
      );

      this.logger.log(`Reward request processed: ${data.requestId}`);
    } catch (error) {
      this.logger.error(
        `Error processing reward request: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @ProcessJob({
    queueName: QueueNames.REWARD,
    jobName: JobNames.REWARD_PROCESSED,
  })
  async handleRewardProcessed(job: Job): Promise<void> {
    const { data } = job.data;
    this.logger.log(
      `Processing reward processed notification: ${data.requestId}`,
    );

    try {
      // Handle post-processing tasks
      // For example, you might want to send a notification to the user
      // or update some analytics data

      this.logger.log(`Reward processed notification sent: ${data.requestId}`);
    } catch (error) {
      this.logger.error(
        `Error processing reward notification: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
