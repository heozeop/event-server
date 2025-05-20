import { SetMetadata } from "@nestjs/common";
import { PROCESSOR_DECORATOR } from "../constants";

export interface ProcessorOptions {
  queueName: string;
  jobName?: string;
  concurrency?: number;
}

/**
 * Decorator to process jobs from a BullMQ queue
 * @param options Processor options
 */
export const ProcessJob = (options: ProcessorOptions) =>
  SetMetadata(PROCESSOR_DECORATOR, options);
