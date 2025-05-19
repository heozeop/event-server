import { PinoLoggerService } from '@libs/logger';
import { BullMQService } from '@libs/message-broker';
import {
  BULLMQ_MODULE_OPTIONS,
  QueueNames,
} from '@libs/message-broker/dist/constants';
import { MockPinoLoggerService } from '@libs/test';
import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import RedisMock from 'ioredis-mock';

// Create mock queue factory function
function createMockQueue(name: string, logger: PinoLoggerService): Queue {
  return {
    name,
    add: jest.fn().mockImplementation((jobName, data) => {
      logger.debug(`Mock job added to queue ${name}: ${jobName}`);
      return Promise.resolve({
        id: `mock-job-${Date.now()}`,
        name: jobName,
        data,
      });
    }),
    close: jest.fn().mockResolvedValue(undefined),
  } as unknown as Queue;
}

// Mock BullMQModule for testing
@Module({
  providers: [
    {
      provide: BULLMQ_MODULE_OPTIONS,
      useValue: {
        connection: {
          host: 'localhost',
          port: 6379,
        },
        isGlobal: true,
      },
    },
    {
      provide: PinoLoggerService,
      useValue: new MockPinoLoggerService(),
    },
    {
      provide: BullMQService,
      useFactory: (logger: PinoLoggerService) => {
        // Create a Redis mock client for BullMQ
        const redisMock = new RedisMock();

        // Return a mock implementation of BullMQService using Redis mock
        return {
          createQueue: jest.fn().mockImplementation((config) => {
            logger.debug(`Mock queue created: ${config.name}`);
            return createMockQueue(config.name, logger);
          }),
          onModuleDestroy: () => {
            redisMock.disconnect();
          },
        };
      },
      inject: [PinoLoggerService],
    },
    // Provide EVENT queue - using the @nestjs/bull token format
    {
      provide: `BullQueue_${QueueNames.EVENT}`,
      useFactory: (logger: PinoLoggerService) => {
        return createMockQueue(QueueNames.EVENT, logger);
      },
      inject: [PinoLoggerService],
    },
    // Provide REWARD queue - using the @nestjs/bull token format
    {
      provide: `BullQueue_${QueueNames.REWARD}`,
      useFactory: (logger: PinoLoggerService) => {
        return createMockQueue(QueueNames.REWARD, logger);
      },
      inject: [PinoLoggerService],
    },
    // Provide NOTIFICATION queue - using the @nestjs/bull token format
    {
      provide: `BullQueue_${QueueNames.NOTIFICATION}`,
      useFactory: (logger: PinoLoggerService) => {
        return createMockQueue(QueueNames.NOTIFICATION, logger);
      },
      inject: [PinoLoggerService],
    },
  ],
  exports: [
    BullMQService,
    `BullQueue_${QueueNames.EVENT}`,
    `BullQueue_${QueueNames.REWARD}`,
    `BullQueue_${QueueNames.NOTIFICATION}`,
  ],
})
export class MockBullMQModule {
  static register() {
    return {
      module: MockBullMQModule,
      global: true,
    };
  }
}
