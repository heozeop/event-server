import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('HttpExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Add stack trace in development environment
    const isDev = process.env.NODE_ENV !== 'production';
    const logContext: Record<string, any> = {
      ...errorResponse,
      error: exception instanceof Error ? exception.name : 'UnknownError',
      message:
        exception instanceof Error
          ? exception.message
          : 'Internal Server Error',
    };

    if (isDev && exception instanceof Error && exception.stack) {
      logContext.stack = this.formatStack(exception.stack);
    }

    // Log error with appropriate level based on status code
    if (status >= 500) {
      this.logger.error(logContext, 'Server Error');
    } else if (status >= 400) {
      this.logger.warn(logContext, 'Client Error');
    } else {
      this.logger.info(logContext, 'HTTP Exception');
    }

    // Send response to client
    response.status(status).json({
      statusCode: status,
      message:
        exception instanceof Error
          ? exception.message
          : 'Internal Server Error',
      timestamp: errorResponse.timestamp,
      path: errorResponse.path,
    });
  }

  private formatStack(stack: string): string[] {
    return stack
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
}
