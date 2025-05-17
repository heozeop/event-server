import { Injectable, Scope } from '@nestjs/common';
import * as pino from 'pino';
import { LogContextStore } from '../context/store/log-context.store';
import { LogLevel, PinoLogLevelManager } from '../core/log-level-manager';
import { SensitiveDataFilter } from '../filters';
import { LogContext, LoggerService } from '../interfaces';

export interface PinoLoggerOptions {
  serviceName: string;
  prettyPrint?: boolean;
  logLevel?: LogLevel;
  customTransports?: pino.TransportSingleOptions[];
  sensitiveDataOptions?: {
    maskValue?: string;
    sensitiveKeys?: string[];
    sensitivePatterns?: RegExp[];
    objectPaths?: string[];
    enabled?: boolean;
  };
}

@Injectable({ scope: Scope.DEFAULT })
export class PinoLoggerService implements LoggerService {
  private readonly logger: pino.Logger;
  private readonly serviceName: string;
  private logLevelManager: PinoLogLevelManager;
  private baseContext: LogContext = {};
  private sensitiveDataFilter: SensitiveDataFilter | null = null;
  private contextStore?: LogContextStore;

  constructor(options: PinoLoggerOptions, contextStore?: LogContextStore) {
    this.serviceName = options.serviceName;
    this.logLevelManager = new PinoLogLevelManager(options.logLevel);
    this.contextStore = contextStore;

    // Initialize sensitive data filter if enabled
    if (options.sensitiveDataOptions?.enabled !== false) {
      this.sensitiveDataFilter = new SensitiveDataFilter(options.sensitiveDataOptions);
    }

    // Base config without formatters (for use with transports)
    const baseConfig = {
      level: this.logLevelManager.getLogLevel(),
      base: {
        serviceId: this.serviceName
      },
      timestamp: pino.stdTimeFunctions.isoTime
    };

    // Full config with formatters (for direct use without transports)
    const fullConfig: pino.LoggerOptions = {
      ...baseConfig,
      formatters: {
        level: (label) => {
          return { level: label };
        }
      }
    };

    // Configure transports based on options
    if (options.prettyPrint) {
      // Pretty print console output for development
      this.logger = pino.pino({
        ...baseConfig,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          }
        }
      });
    } else if (options.customTransports && options.customTransports.length > 0) {
      // Custom transports specified
      this.logger = pino.pino({
        ...baseConfig,
        transport: {
          targets: options.customTransports
        }
      });
    } else {
      // Default JSON logger for production (captured by Grafana Alloy)
      this.logger = pino.pino(fullConfig);
    }
  }

  private formatContext(context?: LogContext): LogContext {
    // Start with the base context
    const mergedContext = {
      ...this.baseContext,
      serviceId: this.serviceName
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

  setContext(context: LogContext): LoggerService {
    this.baseContext = { ...this.baseContext, ...context };
    return this;
  }

  log(message: string, context?: LogContext): void {
    this.logger.info(this.formatContext(context), this.maskMessage(message));
  }

  error(message: string, trace?: string, context?: LogContext): void {
    const errorContext = this.formatContext(context);
    
    if (trace) {
      errorContext.stack = this.sensitiveDataFilter ? 
        this.sensitiveDataFilter.mask(trace) : trace;
    }
    
    this.logger.error(errorContext, this.maskMessage(message));
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(this.formatContext(context), this.maskMessage(message));
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(this.formatContext(context), this.maskMessage(message));
  }

  verbose(message: string, context?: LogContext): void {
    this.logger.trace(this.formatContext(context), this.maskMessage(message));
  }

  setLogLevel(level: LogLevel): void {
    this.logLevelManager.setLogLevel(level);
    this.logger.level = level;
  }

  getLogLevelManager(): PinoLogLevelManager {
    return this.logLevelManager;
  }
}
