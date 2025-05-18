import { LoggerModule } from "@libs/logger";
import { Module } from "@nestjs/common";
import { ClientServiceExceptionFilter } from "./client-exception.filter";

/**
 * Module for HTTP exception handling
 * Import this module in your application module to apply the HttpExceptionFilter globally
 */
@Module({
  imports: [LoggerModule],
  providers: [ClientServiceExceptionFilter],
  exports: [ClientServiceExceptionFilter],
})
export class ClientServiceExceptionModule {}
