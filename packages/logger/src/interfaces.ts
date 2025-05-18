import { ModuleMetadata } from "@nestjs/common";
import { PinoLoggerService } from "./services/pino-logger.service";

export interface LogContext {
  serviceId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  path?: string;
  method?: string;
  clientIp?: string;
  userAgent?: string;
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

export interface LoggerModuleOptions {
  global?: boolean;
  serviceName: string;
  prettyPrint?: boolean;
  logLevel?: string;
  sensitiveDataOptions?: {
    maskValue?: string;
    sensitiveKeys?: string[];
    sensitivePatterns?: RegExp[];
    objectPaths?: string[];
    enabled?: boolean;
  };
  alloyConfig?: {
    enabled?: boolean;
    messageKey?: string;
    levelKey?: string;
  };
}

export interface LoggerModuleAsyncOptions
  extends Pick<ModuleMetadata, "imports"> {
  global?: boolean;
  imports: any[];
  inject: any[];
  useFactory: (
    ...args: any[]
  ) => Promise<LoggerModuleOptions> | LoggerModuleOptions;
}

export interface LogOptions {
  entryLevel?: "debug" | "log" | "warn" | "error" | "verbose";
  exitLevel?: "debug" | "log" | "warn" | "error" | "verbose";
  errorLevel?: "error" | "warn";
  logParams?: boolean;
  logResult?: boolean;
  logExecutionTime?: boolean;
  entryMessage?: string;
  exitMessage?: string;
}

export interface WithLogger {
  logger: PinoLoggerService;
}
