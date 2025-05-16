import * as pino from 'pino';
import { LogLevel, PinoLogLevelManager } from '../core/log-level-manager';
import { LogContext, LoggerService } from '../interfaces';

export interface PinoLoggerOptions {
  serviceName: string;
  prettyPrint?: boolean;
  logLevel?: LogLevel;
  customTransports?: pino.TransportSingleOptions[];
}

export class PinoLoggerService implements LoggerService {
  private readonly logger: pino.Logger;
  private readonly serviceName: string;
  private logLevelManager: PinoLogLevelManager;
  private baseContext: LogContext = {};

  constructor(options: PinoLoggerOptions) {
    this.serviceName = options.serviceName;
    this.logLevelManager = new PinoLogLevelManager(options.logLevel);

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
    return {
      ...this.baseContext,
      ...context,
      serviceId: this.serviceName
    };
  }

  setContext(context: LogContext): LoggerService {
    this.baseContext = { ...this.baseContext, ...context };
    return this;
  }

  log(message: string, context?: LogContext): void {
    this.logger.info(this.formatContext(context), message);
  }

  error(message: string, trace?: string, context?: LogContext): void {
    const errorContext = this.formatContext(context);
    
    if (trace) {
      errorContext.stack = trace;
    }
    
    this.logger.error(errorContext, message);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(this.formatContext(context), message);
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(this.formatContext(context), message);
  }

  verbose(message: string, context?: LogContext): void {
    this.logger.trace(this.formatContext(context), message);
  }

  setLogLevel(level: LogLevel): void {
    this.logLevelManager.setLogLevel(level);
    this.logger.level = level;
  }

  getLogLevelManager(): PinoLogLevelManager {
    return this.logLevelManager;
  }
} 
