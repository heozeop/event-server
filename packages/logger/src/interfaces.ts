export interface LogContext {
  serviceId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  [key: string]: any;
}

export interface LogLevelManager {
  setLogLevel(level: string): void;
  getLogLevel(): string;
  setModuleLogLevel(module: string, level: string): void;
  getModuleLogLevel(module: string): string;
}

export interface LoggerService {
  log(message: string, context?: LogContext): void;
  error(message: string, trace?: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  verbose(message: string, context?: LogContext): void;
  setContext(context: LogContext): LoggerService;
} 
