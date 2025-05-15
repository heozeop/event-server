import { Module } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { GlobalExceptionFilterProvider } from './providers/global-exception-filter.provider';

/**
 * Module for HTTP exception handling
 * Import this module in your application module to apply the HttpExceptionFilter globally
 */
@Module({
  providers: [HttpExceptionFilter, GlobalExceptionFilterProvider],
  exports: [HttpExceptionFilter],
})
export class HttpExceptionsModule {} 
