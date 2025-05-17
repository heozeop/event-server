import { DynamicModule, Module } from '@nestjs/common';
import { LogContextInterceptor } from './context/interceptors/log-context.interceptor';
import { LogContextStore } from './context/store/log-context.store';
import { PinoLogLevelManager } from './core/log-level-manager';
import { SensitiveDataFilter } from './filters';
import { LoggerModuleAsyncOptions, LoggerModuleOptions } from './interfaces';
import { PinoLoggerService } from './services/pino-logger.service';

export const defaultLoggerModuleOptions: LoggerModuleOptions = {
  global: true,
  serviceName: 'default',
  prettyPrint: true,
  logLevel: 'error',
  sensitiveDataOptions: {
    enabled: true,
    maskValue: '***MASKED***',
    objectPaths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.accessToken',
      'req.body.refreshToken',
    ],
  } 
};

const LOGGER_MODULE_OPTIONS = Symbol('LOGGER_MODULE_OPTIONS');

@Module({
  providers: [],
})
export class LoggerModule {

  static forRoot(options: LoggerModuleOptions): DynamicModule {
    const mergedOptions = { ...defaultLoggerModuleOptions, ...options };

    return {
      module: LoggerModule,
      global: mergedOptions.global,
      providers: [
        {
          provide: PinoLoggerService,
          useFactory: () => {
            return LoggerModule.getPinoLoggerService(mergedOptions);
          }
        },
        {
          provide: SensitiveDataFilter,
          useFactory: () => {
            return LoggerModule.getSensitiveDataFilter(mergedOptions);
          }
        },
        LogContextStore,
        LogContextInterceptor,
        PinoLogLevelManager
      ],
      exports: [
        PinoLoggerService,
        SensitiveDataFilter,
        LogContextStore,
        LogContextInterceptor,
        PinoLogLevelManager
      ]
    };
  }

  static forRootAsync(options:LoggerModuleAsyncOptions): DynamicModule {
    return {
      global: options.global,
      module: LoggerModule,
      imports: options.imports,
      providers: [
        {
          provide: LOGGER_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        {
          provide: PinoLoggerService,
          useFactory: (options: LoggerModuleOptions) => {
            return LoggerModule.getPinoLoggerService(options);
          },
          inject: [LOGGER_MODULE_OPTIONS],
        },
        {
          provide: SensitiveDataFilter,
          useFactory: (options: LoggerModuleOptions) => {
            return LoggerModule.getSensitiveDataFilter(options);
          },
          inject: [LOGGER_MODULE_OPTIONS],
        },

        LogContextStore,
        LogContextInterceptor,
        PinoLogLevelManager
      ],
      exports: [
        LOGGER_MODULE_OPTIONS,
        PinoLoggerService,
        SensitiveDataFilter,
        LogContextStore,
        LogContextInterceptor,
        PinoLogLevelManager
      ]
    };
  }

  private static getPinoLoggerService(options: LoggerModuleOptions): PinoLoggerService { 
    return new PinoLoggerService({
      serviceName: options.serviceName,
      prettyPrint: options.prettyPrint,
      logLevel: options.logLevel as any,
      sensitiveDataOptions: options.sensitiveDataOptions
    });
  }

  private static getSensitiveDataFilter(options: LoggerModuleOptions): SensitiveDataFilter | null {
    if(options.sensitiveDataOptions?.enabled === false) {
      return null;
    }

    return new SensitiveDataFilter(options.sensitiveDataOptions);
  }
} 
