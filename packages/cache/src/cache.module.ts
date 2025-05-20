import {
  DynamicModule,
  InjectionToken,
  Module,
  Provider,
  Type,
} from "@nestjs/common";
import { CacheService } from "./cache.service";
import { CACHE_MODULE_OPTIONS } from "./constants";
import {
  CacheModuleAsyncOptions,
  CacheModuleOptions,
  CacheOptionsFactory,
} from "./interfaces";

@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {
  static register(options: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        {
          provide: CACHE_MODULE_OPTIONS,
          useValue: options,
        },
      ],
    };
  }

  static registerAsync(options: CacheModuleAsyncOptions): DynamicModule {
    return {
      module: CacheModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(
    options: CacheModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass as InjectionToken,
        useClass: options.useClass as Type<CacheOptionsFactory>,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: CacheModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: CACHE_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: CACHE_MODULE_OPTIONS,
      useFactory: async (optionsFactory: CacheOptionsFactory) =>
        await optionsFactory.createCacheOptions(),
      inject: [
        (options.useClass as InjectionToken) ||
          (options.useExisting as InjectionToken),
      ],
    };
  }
}
