import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('LoggingInterceptor');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, path, ip, body, query, params } = request;

    // Limit large request bodies for logging
    const sanitizedBody = this.truncateLargeObject(body);

    // Log request
    this.logger.info(
      {
        type: 'request',
        method,
        path,
        ip,
        query,
        params,
        body: sanitizedBody,
      },
      'HTTP Request',
    );

    return next.handle().pipe(
      tap({
        next: (response) => {
          const responseTime = Date.now() - startTime;

          // Log successful response
          this.logger.info(
            {
              type: 'response',
              method,
              path,
              statusCode: context.switchToHttp().getResponse().statusCode,
              responseTime: `${responseTime}ms`,
              responseSize: this.calculateResponseSize(response),
            },
            'HTTP Response',
          );
        },
        error: () => {
          const responseTime = Date.now() - startTime;

          // Error logging is handled by the exception filter
          this.logger.info(
            {
              type: 'response_error',
              method,
              path,
              responseTime: `${responseTime}ms`,
            },
            'HTTP Response (Error)',
          );
        },
      }),
    );
  }

  private truncateLargeObject(obj: any): any {
    if (!obj) return obj;

    const MAX_OBJECT_SIZE = 5000; // characters
    const jsonString = JSON.stringify(obj);

    if (jsonString.length <= MAX_OBJECT_SIZE) {
      return obj;
    }

    return {
      __truncated: true,
      size: jsonString.length,
      preview: jsonString.substring(0, 500) + '...',
    };
  }

  private calculateResponseSize(response: any): string {
    if (!response) return '0B';

    try {
      const size = JSON.stringify(response).length;

      if (size < 1024) {
        return `${size}B`;
      } else if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(2)}KB`;
      } else {
        return `${(size / (1024 * 1024)).toFixed(2)}MB`;
      }
    } catch (e) {
      return 'unknown';
    }
  }
}
