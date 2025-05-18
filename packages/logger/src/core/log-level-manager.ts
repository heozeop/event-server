import { LogLevelManager } from "../interfaces";

export type LogLevel =
  | "fatal"
  | "error"
  | "warn"
  | "info"
  | "debug"
  | "trace"
  | "silent";

export const LOG_LEVELS: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
  silent: 0,
};

export class PinoLogLevelManager implements LogLevelManager {
  private defaultLogLevel: LogLevel = "info";
  private moduleLogLevels: Map<string, LogLevel> = new Map();

  constructor(initialLogLevel?: LogLevel) {
    if (initialLogLevel && initialLogLevel in LOG_LEVELS) {
      this.defaultLogLevel = initialLogLevel;
    } else if (process.env.LOG_LEVEL && process.env.LOG_LEVEL in LOG_LEVELS) {
      this.defaultLogLevel = process.env.LOG_LEVEL as LogLevel;
    }
  }

  setLogLevel(level: string): void {
    if (level in LOG_LEVELS) {
      this.defaultLogLevel = level as LogLevel;
    } else {
      throw new Error(
        `Invalid log level: ${level}. Valid levels are: ${Object.keys(LOG_LEVELS).join(", ")}`,
      );
    }
  }

  getLogLevel(): string {
    return this.defaultLogLevel;
  }

  setModuleLogLevel(module: string, level: string): void {
    if (level in LOG_LEVELS) {
      this.moduleLogLevels.set(module, level as LogLevel);
    } else {
      throw new Error(
        `Invalid log level: ${level}. Valid levels are: ${Object.keys(LOG_LEVELS).join(", ")}`,
      );
    }
  }

  getModuleLogLevel(module: string): string {
    return this.moduleLogLevels.get(module) || this.defaultLogLevel;
  }

  getNumericLevel(module?: string): number {
    const level = module
      ? this.moduleLogLevels.get(module) || this.defaultLogLevel
      : this.defaultLogLevel;

    return LOG_LEVELS[level];
  }
}
