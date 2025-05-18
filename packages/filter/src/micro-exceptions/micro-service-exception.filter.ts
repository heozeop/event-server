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
    this.logger.warn('exception', exception as any);

    // Handle validation errors with enhanced details
    if (
      exception instanceof HttpException
    ) {
      const exceptionResponse = exception.getResponse();

      // Check if this has the enhanced validation errors format
      if (
        exception.getStatus() === HttpStatus.BAD_REQUEST &&
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
      } else {

        const message = exception.message
        const status = exception.getStatus()

        throw new RpcException({
          statusCode: status,
          message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const exceptionResponse = Object.hasOwn(exception as object, 'response') ? (exception as {response: any}).response : null;

    const status = exceptionResponse?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exceptionResponse?.message ?? "Internal server error";
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
