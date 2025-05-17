import { WithLogger } from '../interfaces';

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



    // Replace the method with a wrapped version
    descriptor.value = async function (this: WithLogger, ...args: any[]) {
      const startTime = Date.now();
      this.logger.log('LogPerformance', args);

      try {
        // Execute the original method
        const result = await originalMethod.apply(this, args);

        // Calculate execution time
        const executionTime = Date.now() - startTime;

        // Log performance metrics
        this.logger.log(`Performance: ${category}.${propertyKey}`, {
          type: 'performance',
          category,
          method: propertyKey,
          executionTime: `${executionTime}ms`,
          status: 'success',
        });

        return result;
      } catch (error: unknown) {
        // Calculate execution time in case of error
        const executionTime = Date.now() - startTime;

        // Log performance metrics with error
        this.logger.warn(
          `Performance: ${category}.${propertyKey} (error)`,
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
        );

        // Re-throw the error
        throw error;
      }
    };

    return descriptor;
  };
}
