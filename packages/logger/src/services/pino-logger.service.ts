import * as pino from 'pino';
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

export class PinoLoggerService implements LoggerService {
  private readonly logger: pino.Logger;
  private readonly serviceName: string;
  private logLevelManager: PinoLogLevelManager;
  private baseContext: LogContext = {};
  private sensitiveDataFilter: SensitiveDataFilter | null = null;

  constructor(options: PinoLoggerOptions) {
    this.serviceName = options.serviceName;
    this.logLevelManager = new PinoLogLevelManager(options.logLevel);

    // Initialize sensitive data filter if enabled
    if (options.sensitiveDataOptions?.enabled !== false) {
      this.sensitiveDataFilter = new SensitiveDataFilter(options.sensitiveDataOptions);
    }

    const pinoConfig: pino.LoggerOptions = {
      level: this.logLevelManager.getLogLevel(),
      base: {
        serviceId: this.serviceName
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => {
          return { level: label };
        }
      }
    };

    if (options.prettyPrint) {
      this.logger = pino.pino({
        ...pinoConfig,
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
      this.logger = pino.pino({
        ...pinoConfig,
        transport: {
          targets: options.customTransports
        }
      });
    } else {
      this.logger = pino.pino(pinoConfig);
    }
  }

  private formatContext(context?: LogContext): LogContext {
    const mergedContext = {
      ...this.baseContext,
      ...context,
      serviceId: this.serviceName
    };

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
