import { LoggerModule } from "@libs/logger";
import { Module } from "@nestjs/common";
import { ClientServiceExceptionFilter } from "./client-exception.filter";
import { GlobalExceptionFilterProvider } from "./global-exception-filter.provider";

/**
 * Module for HTTP exception handling
 * Import this module in your application module to apply the HttpExceptionFilter globally
 */
@Module({
  imports: [LoggerModule],
  providers: [ClientServiceExceptionFilter, GlobalExceptionFilterProvider],
  exports: [ClientServiceExceptionFilter],
})
export class ClientServiceExceptionModule {}
