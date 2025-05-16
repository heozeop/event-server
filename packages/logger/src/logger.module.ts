import { DynamicModule, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';
import { LogContextInterceptor } from './context/interceptors/log-context.interceptor';
import { LogContextStore } from './context/store/log-context.store';
import { PinoLogLevelManager } from './core/log-level-manager';
import { SensitiveDataFilter } from './filters';
import { LoggerModuleAsyncOptions, LoggerModuleOptions } from './interfaces';
import { PinoLoggerService } from './services/pino-logger.service';

export const defaultLoggerModuleOptions: LoggerModuleOptions = {
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

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: uuidv4
      }
    })
  ],
  providers: [
    LogContextStore,
    LogContextInterceptor,
    PinoLoggerService,
    PinoLogLevelManager
  ],
  exports: [
    ClsModule,
    LogContextStore,
    LogContextInterceptor,
    PinoLoggerService,
    PinoLogLevelManager
  ]
})
export class LoggerModule {
  static forRoot(options: LoggerModuleOptions): DynamicModule {
    const mergedOptions = { ...defaultLoggerModuleOptions, ...options };

    return {
      module: LoggerModule,
      providers: [
        {
          provide: PinoLoggerService,
          useFactory: () => {
            return new PinoLoggerService({
              serviceName: mergedOptions.serviceName,
              prettyPrint: mergedOptions.prettyPrint,
              logLevel: mergedOptions.logLevel as any,
              sensitiveDataOptions: mergedOptions.sensitiveDataOptions
            });
          }
        },
        {
          provide: SensitiveDataFilter,
          useFactory: () => {
            return mergedOptions.sensitiveDataOptions?.enabled !== false ? 
              new SensitiveDataFilter(mergedOptions.sensitiveDataOptions) : 
              null;
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
        PinoLogLevelManager,
        ClsModule
      ]
    };
  }

  static forRootAsync(options:LoggerModuleAsyncOptions) {
    return {
      module: LoggerModule,
      imports: options.imports,
      inject: options.inject,
      useFactory: options.useFactory,
    };
  }
} 
