import { LoggerModule } from '@libs/logger';
import { BullModule } from '@nestjs/bull';
import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { DiscoveryModule, MetadataScanner, Reflector } from '@nestjs/core';
import { BullMQService } from './bullmq.service';
import { BULLMQ_MODULE_OPTIONS } from './constants';
import {
  BullMQModuleAsyncOptions,
  BullMQOptions,
  BullMQOptionsFactory,
} from './interfaces';

@Module({
  imports: [LoggerModule, DiscoveryModule],
  providers: [
    BullMQService,
    MetadataScanner,
    Reflector,
  ],
  exports: [BullMQService],
})
export class BullMQModule {
  static register(options: BullMQOptions): DynamicModule {
    return {
      module: BullMQModule,
      imports: [
        BullModule.forRoot({
          redis: options.connection,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        }),
      ],
      providers: [
        {
          provide: BULLMQ_MODULE_OPTIONS,
          useValue: options,
        },
      ],
      global: options.isGlobal,
    };
  }

  static registerAsync(options: BullMQModuleAsyncOptions): DynamicModule {
    return {
      module: BullMQModule,
      imports: [
        ...(options.imports || []),
        BullModule.forRootAsync({
          imports: options.imports || [],
          inject: options.inject || [],
          useFactory: async (...args) => {
            const config = options.useFactory
              ? await options.useFactory(...args)
              : await (await this.getOptionsFactoryProvider(options)).createBullMQOptions();

            return {
              redis: config.connection,
              defaultJobOptions: {
                attempts: 3,
                backoff: {
                  type: 'exponential',
                  delay: 1000,
                },
                removeOnComplete: true,
                removeOnFail: false,
              },
            };
          },
        }),
      ],
      providers: [this.createAsyncOptionsProvider(options)],
      global: true,
    };
  }

  private static createAsyncOptionsProvider(
    options: BullMQModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: BULLMQ_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: BULLMQ_MODULE_OPTIONS,
      useFactory: async (optionsFactory: BullMQOptionsFactory) =>
        await optionsFactory.createBullMQOptions(),
      inject: [options.useClass as Type<BullMQOptionsFactory> || options.useExisting as Type<BullMQOptionsFactory>],
    };
  }

  private static async getOptionsFactoryProvider(
    options: BullMQModuleAsyncOptions,
  ): Promise<BullMQOptionsFactory> {
    if (options.useExisting || options.useClass) {
      const injector: Type<BullMQOptionsFactory> = (options.useExisting || options.useClass)!;

      return new injector();
    }

    throw new Error('No options factory provided');
  }
} 
