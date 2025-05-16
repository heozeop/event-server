import { Module } from '@nestjs/common';
import { MicroServiceGlobalExceptionFilterProvider } from './global-exception-filter.provider';
import { MicroServiceExceptionFilter } from './micro-service-exception.filter';

/**
 * Module for HTTP exception handling
 * Import this module in your application module to apply the HttpExceptionFilter globally
 */
@Module({
  providers: [
    MicroServiceExceptionFilter,
    MicroServiceGlobalExceptionFilterProvider,
  ],
  exports: [MicroServiceExceptionFilter],
})
export class MicroServiceExceptionModule {}
