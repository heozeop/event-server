import { HttpException } from '@nestjs/common';
import { LogOptions, WithLogger } from '../interfaces';

const defaultOptions: LogOptions = {
  entryLevel: 'debug',
  exitLevel: 'debug',
  errorLevel: 'error',
  logParams: true,
  logResult: true,
  logExecutionTime: true,
};

/**
 * Decorator to log method execution
 * @param options Options for customizing logging behavior
 */
export function LogExecution(options: LogOptions = {}) {
  const mergedOptions = { ...defaultOptions, ...options };

  return function (
    target: Object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: WithLogger, ...args: any[]) {
      if (!this.logger) {
        console.warn(`Logger not found in ${target.constructor.name}`);
        return originalMethod.apply(this, args);
      }

      const className = target.constructor.name;
      const methodName = propertyKey;
      const startTime = Date.now();

      // Create entry log message
      const entryMessage =
        mergedOptions.entryMessage || `${className}.${methodName} called`;

      // Create entry context (must be an object or undefined)
      const entryContext =
        mergedOptions.logParams && args.length ? { params: args } : undefined;

      // Log method entry using the appropriate level
      switch (mergedOptions.entryLevel) {
        case 'log':
          this.logger.log(entryMessage, entryContext);
          break;
        case 'warn':
          this.logger.warn(entryMessage, entryContext);
          break;
        case 'error':
          this.logger.error(entryMessage, undefined, entryContext);
          break;
        case 'verbose':
          this.logger.verbose(entryMessage, entryContext);
          break;
        case 'debug':
        default:
          this.logger.debug(entryMessage, entryContext);
          break;
      }

      try {
        // Execute the original method
        const result = await originalMethod.apply(this, args);
        const executionTime = Date.now() - startTime;

        // Create exit log message and context
        const exitMessage =
          mergedOptions.exitMessage || `${className}.${methodName} completed`;
        const exitContext: Record<string, any> = {};

        if (mergedOptions.logExecutionTime) {
          exitContext.executionTime = `${executionTime}ms`;
        }

        if (mergedOptions.logResult && result !== undefined) {
          exitContext.result = result;
        }

        // Log method exit
        switch (mergedOptions.exitLevel) {
          case 'log':
            this.logger.log(exitMessage, exitContext);
            break;
          case 'warn':
            this.logger.warn(exitMessage, exitContext);
            break;
          case 'error':
            this.logger.error(exitMessage, undefined, exitContext);
            break;
          case 'verbose':
            this.logger.verbose(exitMessage, exitContext);
            break;
          case 'debug':
          default:
            this.logger.debug(exitMessage, exitContext);
            break;
        }

        return result;
      } catch (error: unknown) {
        const executionTime = Date.now() - startTime;

        // Create error context
        const errorContext: Record<string, any> = {
          executionTime: `${executionTime}ms`,
        };

        let errorMessage = `${className}.${methodName} failed`;
        let errorStack: string | undefined;

        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
          errorStack = error.stack;
          errorContext.errorType = error.constructor.name;

          // Add additional context for HTTP exceptions
          if (error instanceof HttpException) {
            errorContext.statusCode = error.getStatus();
            errorContext.response = error.getResponse();
          }
        } else {
          errorContext.error = String(error);
        }

        // Log error with appropriate level
        if (mergedOptions.errorLevel === 'warn') {
          this.logger.warn(errorMessage, errorContext);
        } else {
          this.logger.error(errorMessage, errorStack, errorContext);
        }

        // Re-throw the error
        throw error;
      }
    };

    return descriptor;
  };
}
