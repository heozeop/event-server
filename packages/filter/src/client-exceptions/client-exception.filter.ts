import { ExceptionDto } from '@libs/dtos';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP exception filter that catches all exceptions
 * and returns a standardized error response
 */
@Catch()
export class ClientServiceExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ClientServiceExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if(typeof exception === 'object' && Object.hasOwn(exception as object, 'error')) {
      const error = (exception as { error: ExceptionDto }).error;
      const status = error.statusCode;
      const message = error.message;
      const timestamp = error.timestamp;

      return response.status(status).json({ message, timestamp, path: request.url });
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
          : 'Internal server error';

    // Log the error with stack trace for non-HTTP exceptions
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const responseBody = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(responseBody);
  }
} 
