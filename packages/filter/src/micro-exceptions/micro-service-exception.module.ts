import { LoggerModule } from "@libs/logger";
import { Module } from "@nestjs/common";
import { MicroServiceExceptionFilter } from "./micro-service-exception.filter";

/**
 * Module for microservice exception handling
 * Import this module in your application module to apply the MicroserviceExceptionFilter globally
 */
@Module({
  imports: [LoggerModule],
  providers: [
    MicroServiceExceptionFilter,
  ],
  exports: [MicroServiceExceptionFilter],
})
export class MicroServiceExceptionModule {}
