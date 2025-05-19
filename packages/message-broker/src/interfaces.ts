import { ModuleMetadata, Type } from '@nestjs/common';
import { QueueOptions, WorkerOptions } from 'bullmq';
import { RedisOptions } from 'ioredis';

export interface BullMQOptions {
  connection: RedisOptions;
  defaultQueueOptions?: QueueOptions;
  defaultWorkerOptions?: WorkerOptions;
  isGlobal?: boolean;
}

export interface BullMQModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => Promise<BullMQOptions> | BullMQOptions;
  inject?: any[];
  useClass?: Type<BullMQOptionsFactory>;
  useExisting?: Type<BullMQOptionsFactory>;
}

export interface BullMQOptionsFactory {
  createBullMQOptions(): Promise<BullMQOptions> | BullMQOptions;
}

export interface MessagePayload<T = any> {
  data: T;
  timestamp: string;
  correlationId?: string;
  retryCount?: number;
}

export interface QueueConfig {
  name: string;
  options?: QueueOptions;
  workerOptions?: WorkerOptions;
} 
