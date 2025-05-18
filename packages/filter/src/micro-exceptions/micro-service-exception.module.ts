import { LoggerModule } from "@libs/logger";
import { Module } from "@nestjs/common";
import { MicroServiceGlobalExceptionFilterProvider } from "./global-exception-filter.provider";
import { MicroServiceExceptionFilter } from "./micro-service-exception.filter";

/**
 * Module for microservice exception handling
 * Import this module in your application module to apply the MicroserviceExceptionFilter globally
 */
@Module({
  imports: [LoggerModule],
  providers: [
    MicroServiceExceptionFilter,
    MicroServiceGlobalExceptionFilterProvider,
  ],
  exports: [MicroServiceExceptionFilter],
})
export class MicroServiceExceptionModule {}
