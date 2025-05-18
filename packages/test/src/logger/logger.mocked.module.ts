import { DynamicModule, Module } from '@nestjs/common';
import { LogLevel } from '../../../../packages/logger/src/core/log-level-manager';
import { LogContext, LoggerModuleAsyncOptions, LoggerModuleOptions } from '../../../../packages/logger/src/interfaces';

// Mock for the LogContextStore
export class MockLogContextStore {
  private data: Map<string, any> = new Map();

  set(key: string, value: any): void {
    this.data.set(key, value);
  }

  get(key: string): any {
    return this.data.get(key);
  }

  getContext(): LogContext {
    return { serviceId: 'test-service' };
  }

  clear(): void {
    this.data.clear();
  }
}

// Mock for the PinoLogLevelManager
export class MockPinoLogLevelManager {
  private logLevel: string = 'info';

  constructor(defaultLevel?: LogLevel) {
    if (defaultLevel) {
      this.logLevel = defaultLevel;
    }
  }

  setLogLevel(level: string): void {
    this.logLevel = level;
  }

  getLogLevel(): string {
    return this.logLevel;
  }

  setModuleLogLevel(module: string, level: string): void {
    // Mock implementation
  }

  getModuleLogLevel(module: string): string {
    return this.logLevel;
  }
}

// Mock for the LogContextInterceptor
export class MockLogContextInterceptor {
  intercept(context: any, next: any): any {
    return next.handle();
  }
}

// Mock for the SensitiveDataFilter
export class MockSensitiveDataFilter {
  constructor(private options?: any) {}

  mask(data: any): any {
    return data;
  }

  filter(data: any): any {
    return data;
  }
}

// Mock for the PinoLoggerService
export class MockPinoLoggerService {
  private readonly serviceName: string;
  private logLevelManager: MockPinoLogLevelManager;
  private baseContext: LogContext = {};
  private sensitiveDataFilter: MockSensitiveDataFilter | null = null;
  private contextStore?: MockLogContextStore;

  constructor(
    private options: LoggerModuleOptions = { serviceName: 'test-service' },
    contextStore?: MockLogContextStore,
  ) {
    this.serviceName = options.serviceName;
    this.logLevelManager = new MockPinoLogLevelManager(options.logLevel as LogLevel);
    this.contextStore = contextStore;

    if (options.sensitiveDataOptions?.enabled !== false) {
      this.sensitiveDataFilter = new MockSensitiveDataFilter(options.sensitiveDataOptions);
    }
  }

  private formatContext(context?: LogContext): LogContext {
    // Start with the base context
    const mergedContext = {
      ...this.baseContext,
      serviceId: this.serviceName,
    };

    // Try to get request context if contextStore is available
    if (this.contextStore) {
      try {
        const requestContext = this.contextStore.getContext();
        Object.assign(mergedContext, requestContext);
      } catch (error) {
        // Silently handle any errors getting context
      }
    }

    // Add explicit context (highest priority)
    if (context) {
      Object.assign(mergedContext, context);
    }

    // Apply sensitive data masking if enabled
    if (this.sensitiveDataFilter) {
      return this.sensitiveDataFilter.mask(mergedContext);
    }

    return mergedContext;
  }

  private maskMessage(message: string): string {
    if (this.sensitiveDataFilter && typeof message === 'string') {
      return this.sensitiveDataFilter.mask(message);
    }
    return message;
  }

  setContext(context: LogContext): MockPinoLoggerService {
    this.baseContext = { ...this.baseContext, ...context };
    return this;
  }

  log(message: string, context?: LogContext): void {
  }

  error(message: string, trace?: string, context?: LogContext): void {
    const errorContext = this.formatContext(context);

    if (trace) {
      errorContext.stack = this.sensitiveDataFilter ? this.sensitiveDataFilter.mask(trace) : trace;
    }
  }

  warn(message: string, context?: LogContext): void {
  }

  debug(message: string, context?: LogContext): void {
  }

  verbose(message: string, context?: LogContext): void {
  }

  setLogLevel(level: LogLevel): void {
    this.logLevelManager.setLogLevel(level);
  }

  getLogLevelManager(): MockPinoLogLevelManager {
    return this.logLevelManager;
  }

  child(context: any): MockPinoLoggerService {
    const childLogger = new MockPinoLoggerService(this.options, this.contextStore);
    childLogger.setContext(context);
    return childLogger;
  }
}

// Mock Symbol for LOGGER_MODULE_OPTIONS
export const MOCK_LOGGER_MODULE_OPTIONS = Symbol('MOCK_LOGGER_MODULE_OPTIONS');

// Default options
const defaultOptions: LoggerModuleOptions = {
  serviceName: 'test-service',
  prettyPrint: false,
  logLevel: 'info',
  sensitiveDataOptions: {
    enabled: false,
    maskValue: '***',
  },
  alloyConfig: {
    enabled: false,
  },
};

@Module({
  providers: [],
})
export class MockLoggerModule {
  static forRootAsync(options: LoggerModuleAsyncOptions): DynamicModule {
    return {
      global: options.global,
      module: MockLoggerModule,
      imports: options.imports || [],
      providers: [
        {
          provide: MockLogContextStore,
          useClass: MockLogContextStore,
        },
        {
          provide: MockPinoLogLevelManager,
          useClass: MockPinoLogLevelManager,
        },
        {
          provide: MockLogContextInterceptor,
          useClass: MockLogContextInterceptor,
        },
        {
          provide: MockSensitiveDataFilter,
          useClass: MockSensitiveDataFilter,
        },
        {
          provide: MOCK_LOGGER_MODULE_OPTIONS,
          useFactory: options.useFactory || (() => defaultOptions),
          inject: options.inject || [],
        },
        {
          provide: MockPinoLoggerService,
          useFactory: (options: LoggerModuleOptions, contextStore: MockLogContextStore) => {
            return new MockPinoLoggerService(options, contextStore);
          },
          inject: [MOCK_LOGGER_MODULE_OPTIONS, MockLogContextStore],
        },
      ],
      exports: [
        MOCK_LOGGER_MODULE_OPTIONS,
        MockPinoLoggerService,
        MockSensitiveDataFilter,
        MockLogContextStore,
        MockPinoLogLevelManager,
        MockLogContextInterceptor,
      ],
    };
  }

  static forRoot(options: Partial<LoggerModuleOptions> = {}): DynamicModule {
    const mergedOptions: LoggerModuleOptions = {
      ...defaultOptions,
      ...options,
    };

    return {
      global: mergedOptions.global || false,
      module: MockLoggerModule,
      providers: [
        {
          provide: MockLogContextStore,
          useClass: MockLogContextStore,
        },
        {
          provide: MockPinoLogLevelManager,
          useClass: MockPinoLogLevelManager,
        },
        {
          provide: MockLogContextInterceptor,
          useClass: MockLogContextInterceptor,
        },
        {
          provide: MockSensitiveDataFilter,
          useClass: MockSensitiveDataFilter,
        },
        {
          provide: MOCK_LOGGER_MODULE_OPTIONS,
          useValue: mergedOptions,
        },
        {
          provide: MockPinoLoggerService,
          useFactory: (contextStore: MockLogContextStore) => {
            return new MockPinoLoggerService(mergedOptions, contextStore);
          },
          inject: [MockLogContextStore],
        },
      ],
      exports: [
        MOCK_LOGGER_MODULE_OPTIONS,
        MockPinoLoggerService,
        MockSensitiveDataFilter,
        MockLogContextStore,
        MockPinoLogLevelManager,
        MockLogContextInterceptor,
      ],
    };
  }
} 
