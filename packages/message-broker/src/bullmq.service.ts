import { PinoLoggerService } from "@libs/logger";
import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { Job, Queue, QueueOptions, Worker, WorkerOptions } from "bullmq";
import Redis from "ioredis";
import { BULLMQ_MODULE_OPTIONS } from "./constants";
import { BullMQOptions, MessagePayload, QueueConfig } from "./interfaces";

@Injectable()
export class BullMQService implements OnModuleDestroy {
  private readonly connection: Redis;
  private readonly queues: Map<string, Queue> = new Map();
  private readonly workers: Map<string, Worker> = new Map();

  constructor(
    @Inject(BULLMQ_MODULE_OPTIONS)
    private readonly options: BullMQOptions,
    private readonly logger: PinoLoggerService,
  ) {
    this.connection = new Redis(options.connection);
  }

  /**
   * Create a queue
   * @param config Queue configuration
   * @returns Queue instance
   */
  createQueue(config: QueueConfig): Queue {
    if (this.queues.has(config.name)) {
      return this.queues.get(config.name) as Queue<any, any, string>;
    }

    const queueOptions: QueueOptions = {
      connection: this.connection,
      ...this.options.defaultQueueOptions,
      ...config.options,
    };

    const queue = new Queue(config.name, queueOptions);
    this.queues.set(config.name, queue);

    this.logger.log(`Queue created: ${config.name}`);
    return queue;
  }

  /**
   * Add a job to a queue
   * @param queueName Queue name
   * @param jobName Job name
   * @param data Job data
   * @param opts Job options
   * @returns Job instance
   */
  async addJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    opts?: {
      delay?: number;
      attempts?: number;
      backoff?: number | { type: string; delay: number };
      removeOnComplete?: boolean | number;
      removeOnFail?: boolean | number;
      jobId?: string;
    },
  ): Promise<Job<MessagePayload<T>>> {
    let queue = this.queues.get(queueName);

    if (!queue) {
      queue = this.createQueue({ name: queueName });
    }

    const payload: MessagePayload<T> = {
      data,
      timestamp: new Date().toISOString(),
      correlationId: opts?.jobId || crypto.randomUUID(),
    };

    const job = await queue.add(jobName, payload, {
      attempts: opts?.attempts ?? 3,
      backoff: opts?.backoff ?? {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: opts?.removeOnComplete ?? true,
      removeOnFail: opts?.removeOnFail ?? false,
      delay: opts?.delay,
      jobId: opts?.jobId,
    });

    this.logger.debug(
      `Job added: ${jobName} to queue ${queueName} with ID ${job.id}`,
    );
    return job;
  }

  /**
   * Process jobs from a queue
   * @param queueName Queue name
   * @param jobName Job name to process (optional)
   * @param handler Job handler
   * @param options Worker options
   */
  processJobs<T = any>(
    queueName: string,
    jobName: string | undefined,
    handler: (job: Job<MessagePayload<T>>) => Promise<any>,
    options?: WorkerOptions,
  ): Worker {
    const workerOptions: WorkerOptions = {
      connection: this.connection,
      ...this.options.defaultWorkerOptions,
      ...options,
    };

    const workerId = `${queueName}:${jobName || "*"}`;

    // Don't create duplicate workers
    if (this.workers.has(workerId)) {
      return this.workers.get(workerId) as Worker<any, any, string>;
    }

    const worker = new Worker(
      queueName,
      async (job) => {
        if (jobName && job.name !== jobName) {
          return;
        }

        try {
          this.logger.debug(
            `Processing job ${job.id} of type ${job.name} from queue ${queueName}`,
          );
          return await handler(job);
        } catch (error) {
          this.logger.error(
            `Error processing job ${job.id} of type ${job.name} from queue ${queueName}: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
          throw error;
        }
      },
      workerOptions,
    );

    worker.on("completed", (job) => {
      this.logger.debug(`Job ${job.id} of type ${job.name} completed`);
    });

    worker.on("failed", (job, error) => {
      this.logger.error(
        `Job ${job?.id} of type ${job?.name} failed: ${error.message}`,
        error.stack,
      );
    });

    this.workers.set(workerId, worker);
    this.logger.log(
      `Worker created for queue: ${queueName}, job: ${jobName || "*"}`,
    );

    return worker;
  }

  /**
   * Close all connections and workers when the module is destroyed
   */
  async onModuleDestroy() {
    for (const [name, worker] of this.workers.entries()) {
      this.logger.log(`Closing worker for ${name}`);
      await worker.close();
    }

    for (const [name, queue] of this.queues.entries()) {
      this.logger.log(`Closing queue ${name}`);
      await queue.close();
    }

    this.logger.log("Closing Redis connection");
    await this.connection.quit();
  }
}
