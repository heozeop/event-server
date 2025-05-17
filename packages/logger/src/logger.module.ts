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
  },
  // Default Alloy config that matches the Alloy river configuration
  alloyConfig: {
    enabled: true,
    messageKey: 'msg',
    levelKey: 'level'
  } 
};

const LOGGER_MODULE_OPTIONS = Symbol('LOGGER_MODULE_OPTIONS');

@Module({
  providers: [],
})
export class LoggerModule {
  static forRootAsync(options:LoggerModuleAsyncOptions): DynamicModule {
    return {
      global: options.global,
      module: LoggerModule,
      imports: options.imports,
      providers: [
        LogContextStore,
        PinoLogLevelManager,
        LogContextInterceptor,
        SensitiveDataFilter,
        {
          provide: LOGGER_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        {
          provide: PinoLoggerService,
          useFactory: (options: LoggerModuleOptions, contextStore: LogContextStore) => {
            return LoggerModule.getPinoLoggerService(options, contextStore);
          },
          inject: [LOGGER_MODULE_OPTIONS, LogContextStore],
        },
      ],
      exports: [
        LOGGER_MODULE_OPTIONS,
        PinoLoggerService,
        SensitiveDataFilter,
        LogContextStore,
        PinoLogLevelManager,
        LogContextInterceptor
      ]
    };
  }

  private static getPinoLoggerService(options: LoggerModuleOptions, contextStore: LogContextStore): PinoLoggerService { 
    return new PinoLoggerService({
      serviceName: options.serviceName,
      prettyPrint: options.prettyPrint,
      logLevel: options.logLevel as any,
      sensitiveDataOptions: options.sensitiveDataOptions,
      alloyConfig: options.alloyConfig
    }, contextStore);
  }
} 
