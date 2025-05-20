import { ModuleMetadata, Type } from "@nestjs/common";
import { RedisOptions } from "ioredis";

export interface CacheModuleOptions {
  redis: RedisOptions;
  enableLogging?: boolean;
}

export interface CacheModuleAsyncOptions
  extends Pick<ModuleMetadata, "imports"> {
  useFactory?: (
    ...args: any[]
  ) => Promise<CacheModuleOptions> | CacheModuleOptions;
  inject?: any[];
  useClass?: Type<CacheOptionsFactory>;
  useExisting?: Type<CacheOptionsFactory>;
}

export interface CacheOptionsFactory {
  createCacheOptions(): Promise<CacheModuleOptions> | CacheModuleOptions;
}

export type CachedEntity<T> = Omit<T, "_id"> & { _id?: string; id?: string };
