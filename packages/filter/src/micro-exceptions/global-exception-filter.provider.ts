import { APP_FILTER } from '@nestjs/core';
import { MicroServiceExceptionFilter } from './micro-service-exception.filter';

/**
 * Provider for globally applying the HttpExceptionFilter across your application
 * Add this to your module's providers array to apply the filter globally
 */
export const MicroServiceGlobalExceptionFilterProvider = {
  provide: APP_FILTER,
  useClass: MicroServiceExceptionFilter,
}; 
