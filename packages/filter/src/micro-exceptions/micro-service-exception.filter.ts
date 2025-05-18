import { ExceptionDto, ValidationErrorItem } from "@libs/dtos";
import { PinoLoggerService } from "@libs/logger";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { Request } from "express";

/**
 * Global HTTP exception filter that catches all exceptions
 * and returns a standardized error response
 */
@Catch()
export class MicroServiceExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(PinoLoggerService) private readonly logger: PinoLoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    // Handle validation errors with enhanced details
    if (
      exception instanceof HttpException &&
      exception.getStatus() === HttpStatus.BAD_REQUEST
    ) {
      const exceptionResponse = exception.getResponse();

      // Check if this has the enhanced validation errors format
      if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null &&
        "errors" in exceptionResponse
      ) {
        // Create a detailed exception response for the microservice
        const exceptionDto = new ExceptionDto();
        exceptionDto.statusCode = HttpStatus.BAD_REQUEST;
        exceptionDto.message = "Validation Failed";
        exceptionDto.timestamp = new Date().toISOString();
        exceptionDto.errors = exceptionResponse.errors as ValidationErrorItem[];

        throw new RpcException(exceptionDto);
      }
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : exception instanceof Error
          ? exception.message
          : "Internal server error";

    // Log the error with stack trace for non-HTTP exceptions
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const exceptionDto = new ExceptionDto();
    exceptionDto.statusCode = status;
    exceptionDto.message = message;
    exceptionDto.timestamp = new Date().toISOString();

    throw new RpcException(exceptionDto);
  }
}
