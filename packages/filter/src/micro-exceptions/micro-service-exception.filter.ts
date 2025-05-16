import { ExceptionDto } from '@libs/dtos';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Request } from 'express';

/**
 * Global HTTP exception filter that catches all exceptions
 * and returns a standardized error response
 */
@Catch()
export class MicroServiceExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MicroServiceExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

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
