import { CacheService } from '@libs/cache';
import { CACHE_MODULE_OPTIONS } from '@libs/cache/dist/constants';
import { PinoLoggerService } from '@libs/logger';
import { MockPinoLoggerService } from '@libs/test';
import { Module } from '@nestjs/common';
import RedisMock from 'ioredis-mock';

// Mock CacheModule for testing
@Module({
  providers: [
    {
      provide: CACHE_MODULE_OPTIONS,
      useValue: {
        redis: {
          host: 'localhost',
          port: 6379,
        },
        enableLogging: false,
      },
    },
    {
      provide: PinoLoggerService,
      useValue: new MockPinoLoggerService(),
    },
    {
      provide: CacheService,
      useFactory: (logger: PinoLoggerService) => {
        // Create a Redis mock client
        const redisMock = new RedisMock();
        // Keep a local cache for pattern matching
        const cacheStore = new Map<string, string>();

        return {
          get: async (key: string) => {
            try {
              const value = await redisMock.get(key);
              return value ? JSON.parse(value) : null;
            } catch (error) {
              logger.error(`Mock cache get error: ${error.message}`);
              return null;
            }
          },
          set: async (key: string, value: any, ttl: number = 3600) => {
            try {
              const stringValue = JSON.stringify(value);
              await redisMock.set(key, stringValue, 'EX', ttl);
              // Store in local cache for pattern matching
              cacheStore.set(key, stringValue);
            } catch (error) {
              logger.error(`Mock cache set error: ${error.message}`);
            }
          },
          del: async (key: string) => {
            try {
              await redisMock.del(key);
              // Remove from local cache
              cacheStore.delete(key);
            } catch (error) {
              logger.error(`Mock cache del error: ${error.message}`);
            }
          },
          // Add pattern matching delete functionality
          delByPattern: async (pattern: string) => {
            try {
              logger.debug(`Deleting cache keys by pattern: ${pattern}`);
              // Convert Redis glob pattern to JavaScript RegExp
              const regexPattern = new RegExp(
                `^${pattern.replace(/\*/g, '.*')}$`,
              );

              // Find matching keys in our local store
              const keysToDelete: string[] = [];
              for (const key of cacheStore.keys()) {
                if (regexPattern.test(key)) {
                  keysToDelete.push(key);
                }
              }

              // Delete the keys
              for (const key of keysToDelete) {
                await redisMock.del(key);
                cacheStore.delete(key);
              }

              logger.debug(`Deleted ${keysToDelete.length} cache keys`);
            } catch (error) {
              logger.error(`Mock cache delByPattern error: ${error.message}`);
            }
          },
          exists: async (key: string) => {
            try {
              return (await redisMock.exists(key)) === 1;
            } catch (error) {
              logger.error(`Mock cache exists error: ${error.message}`);
              return false;
            }
          },
          onModuleDestroy: () => {
            redisMock.disconnect();
          },
        };
      },
      inject: [PinoLoggerService],
    },
  ],
  exports: [CacheService],
})
export class MockCacheModule {
  static register() {
    return {
      module: MockCacheModule,
      global: true,
    };
  }
}
