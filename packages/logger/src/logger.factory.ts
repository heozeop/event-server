import { LogLevel } from './log-level-manager';
import { NestLoggerAdapter } from './nest-logger.adapter';
import { PinoLoggerOptions, PinoLoggerService } from './pino-logger.service';

export class LoggerFactory {
  private static defaultOptions: Partial<PinoLoggerOptions> = {
    prettyPrint: process.env.NODE_ENV !== 'production'
  };

  static createLogger(options: Omit<PinoLoggerOptions, 'serviceName'> & { serviceName: string }): PinoLoggerService {
    const loggerOptions: PinoLoggerOptions = {
      ...LoggerFactory.defaultOptions,
      ...options
    };

    return new PinoLoggerService(loggerOptions);
  }

  static createNestLogger(
    serviceName: string,
    options?: Omit<PinoLoggerOptions, 'serviceName'>
  ): NestLoggerAdapter {
    const pinoLogger = LoggerFactory.createLogger({
      serviceName,
      ...(options || {})
    });

    return new NestLoggerAdapter(pinoLogger);
  }

  static setDefaultOptions(options: Partial<PinoLoggerOptions>): void {
    LoggerFactory.defaultOptions = {
      ...LoggerFactory.defaultOptions,
      ...options
    };
  }

  static getDefaultLogLevel(): LogLevel {
    return (process.env.LOG_LEVEL as LogLevel) || 'info';
  }
} 
