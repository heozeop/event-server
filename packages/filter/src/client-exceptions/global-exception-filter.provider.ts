import { APP_FILTER } from '@nestjs/core';
import { ClientServiceExceptionFilter } from './client-exception.filter';

/**
 * Provider for globally applying the HttpExceptionFilter across your application
 * Add this to your module's providers array to apply the filter globally
 */
export const GlobalExceptionFilterProvider = {
  provide: APP_FILTER,
  useClass: ClientServiceExceptionFilter,
}; 
