import { LoggerService as NestLoggerService } from '@nestjs/common';
import { LogContext } from '../interfaces';
import { PinoLoggerService } from '../services/pino-logger.service';

export class NestLoggerAdapter implements NestLoggerService {
  private readonly pinoLogger: PinoLoggerService;
  private context?: string;

  constructor(pinoLogger: PinoLoggerService) {
    this.pinoLogger = pinoLogger;
  }

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  log(message: any, context?: string): void {
    const ctx = context || this.context;
    const logContext: LogContext = ctx ? { context: ctx } : {};
    
    if (typeof message === 'object') {
      this.pinoLogger.log(JSON.stringify(message), logContext);
    } else {
      this.pinoLogger.log(message, logContext);
    }
  }

  error(message: any, trace?: string, context?: string): void {
    const ctx = context || this.context;
    const logContext: LogContext = ctx ? { context: ctx } : {};
    
    if (typeof message === 'object') {
      this.pinoLogger.error(
        message instanceof Error ? message.message : JSON.stringify(message),
        trace || (message instanceof Error ? message.stack : undefined),
        logContext
      );
    } else {
      this.pinoLogger.error(message, trace, logContext);
    }
  }

  warn(message: any, context?: string): void {
    const ctx = context || this.context;
    const logContext: LogContext = ctx ? { context: ctx } : {};
    
    if (typeof message === 'object') {
      this.pinoLogger.warn(JSON.stringify(message), logContext);
    } else {
      this.pinoLogger.warn(message, logContext);
    }
  }

  debug(message: any, context?: string): void {
    const ctx = context || this.context;
    const logContext: LogContext = ctx ? { context: ctx } : {};
    
    if (typeof message === 'object') {
      this.pinoLogger.debug(JSON.stringify(message), logContext);
    } else {
      this.pinoLogger.debug(message, logContext);
    }
  }

  verbose(message: any, context?: string): void {
    const ctx = context || this.context;
    const logContext: LogContext = ctx ? { context: ctx } : {};
    
    if (typeof message === 'object') {
      this.pinoLogger.verbose(JSON.stringify(message), logContext);
    } else {
      this.pinoLogger.verbose(message, logContext);
    }
  }
} 
