import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

/**
 * Decorator that logs performance metrics for methods
 * @param category Optional category name for grouping logs
 */
export function LogPerformance(category: string = 'default') {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // Store the original method
    const originalMethod = descriptor.value;

    // Inject the logger
    const logger = Inject(PinoLogger)(target, 'logger');

    // Replace the method with a wrapped version
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        // Execute the original method
        const result = await originalMethod.apply(this, args);

        // Calculate execution time
        const executionTime = Date.now() - startTime;

        // Log performance metrics
        (this as any).logger.info(
          {
            type: 'performance',
            category,
            method: propertyKey,
            executionTime: `${executionTime}ms`,
            status: 'success',
          },
          `Performance: ${category}.${propertyKey}`,
        );

        return result;
      } catch (error: unknown) {
        // Calculate execution time in case of error
        const executionTime = Date.now() - startTime;

        // Log performance metrics with error
        (this as any).logger.warn(
          {
            type: 'performance',
            category,
            method: propertyKey,
            executionTime: `${executionTime}ms`,
            status: 'error',
            errorName: error instanceof Error ? error.name : 'Unknown Error',
            errorMessage:
              error instanceof Error ? error.message : String(error),
          },
          `Performance: ${category}.${propertyKey} (error)`,
        );

        // Re-throw the error
        throw error;
      }
    };

    return descriptor;
  };
}
