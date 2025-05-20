import { PinoLoggerService } from "@libs/logger";
import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { CACHE_MODULE_OPTIONS } from "./constants";
import { CacheModuleOptions } from "./interfaces";

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(
    @Inject(CACHE_MODULE_OPTIONS)
    private readonly options: CacheModuleOptions,
    private readonly logger: PinoLoggerService,
  ) {
    this.client = new Redis(options.redis);
  }

  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await this.client.get(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return null;
    } catch (error) {
      // Log error and fail gracefully
      if (this.options.enableLogging && error instanceof Error) {
        this.logger.error(`Cache get error: ${error.message}`, error.stack);
      }
      return null;
    }
  }

  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttl TTL in seconds (default: 3600)
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttl);
    } catch (error) {
      // Log error and fail gracefully
      if (this.options.enableLogging && error instanceof Error) {
        this.logger.error(`Cache set error: ${error.message}`, error.stack);
      }
    }
  }

  /**
   * Delete a value from cache
   * @param key The cache key to delete
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      if (this.options.enableLogging && error instanceof Error) {
        this.logger.error(`Cache delete error: ${error.message}`, error.stack);
      }
    }
  }

  /**
   * Delete multiple values by pattern
   * @param pattern The pattern to match keys
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      // SCAN implementation for large datasets
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;

        if (keys.length) {
          await this.client.del(...keys);
        }
      } while (cursor !== "0");
    } catch (error) {
      if (this.options.enableLogging && error instanceof Error) {
        this.logger.error(
          `Cache delete by pattern error: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key The cache key to check
   * @returns True if the key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      return (await this.client.exists(key)) === 1;
    } catch (error) {
      if (this.options.enableLogging && error instanceof Error) {
        this.logger.error(`Cache exists error: ${error.message}`, error.stack);
      }
      return false;
    }
  }

  /**
   * Close the Redis connection when the module is destroyed
   */
  onModuleDestroy() {
    this.client.disconnect();
  }
}
