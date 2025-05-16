import { DynamicModule, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';
import { LogContextInterceptor } from './context/interceptors/log-context.interceptor';
import { LogContextStore } from './context/store/log-context.store';
import { PinoLogLevelManager } from './core/log-level-manager';
import { SensitiveDataFilter } from './filters';
import { PinoLoggerService } from './services/pino-logger.service';

export interface LoggerModuleOptions {
  serviceName: string;
  prettyPrint?: boolean;
  logLevel?: string;
  sensitiveDataOptions?: {
    enabled?: boolean;
    maskValue?: string;
    sensitiveKeys?: string[];
    sensitivePatterns?: RegExp[];
    objectPaths?: string[];
  };
}

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
    return {
      module: LoggerModule,
      providers: [
        {
          provide: PinoLoggerService,
          useFactory: () => {
            return new PinoLoggerService({
              serviceName: options.serviceName,
              prettyPrint: options.prettyPrint,
              logLevel: options.logLevel as any,
              sensitiveDataOptions: options.sensitiveDataOptions
            });
          }
        },
        {
          provide: SensitiveDataFilter,
          useFactory: () => {
            return options.sensitiveDataOptions?.enabled !== false ? 
              new SensitiveDataFilter(options.sensitiveDataOptions) : 
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
} 
