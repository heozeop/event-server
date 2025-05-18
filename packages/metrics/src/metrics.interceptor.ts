import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { MetricsService } from "./metrics.service";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    // Record request size (approximate calculation)
    const contentLength = request.headers["content-length"]
      ? parseInt(request.headers["content-length"], 10)
      : 0;

    if (contentLength > 0) {
      this.metricsService.httpRequestSize.observe(
        { method, route: this.normalizeRoute(url) },
        contentLength,
      );
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode.toString();
          const route = this.normalizeRoute(url);
          const duration = (Date.now() - startTime) / 1000; // seconds

          // Record basic request metrics
          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
          });
          this.metricsService.httpRequestDuration.observe(
            { method, route, status_code: statusCode },
            duration,
          );

          // Calculate response size (approximate)
          const responseSize = JSON.stringify(data)?.length || 0;
          if (responseSize > 0) {
            this.metricsService.httpResponseSize.observe(
              { method, route },
              responseSize,
            );
          }

          // Count error metrics
          if (statusCode.startsWith("5")) {
            this.metricsService.httpServerErrors.inc({
              method,
              route,
              status_code: statusCode,
            });
          } else if (statusCode.startsWith("4")) {
            this.metricsService.httpClientErrors.inc({
              method,
              route,
              status_code: statusCode,
            });
          }
        },
        error: (error) => {
          const statusCode = error.status || "500";
          const route = this.normalizeRoute(url);
          const duration = (Date.now() - startTime) / 1000; // seconds

          // Record error case
          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
          });
          this.metricsService.httpRequestDuration.observe(
            { method, route, status_code: statusCode },
            duration,
          );

          if (statusCode.startsWith("5")) {
            this.metricsService.httpServerErrors.inc({
              method,
              route,
              status_code: statusCode,
            });
          } else if (statusCode.startsWith("4")) {
            this.metricsService.httpClientErrors.inc({
              method,
              route,
              status_code: statusCode,
            });
          }
        },
      }),
    );
  }

  // Normalize route (for dynamic parameters)
  private normalizeRoute(url: string): string {
    return url
      .split("/")
      .map((part) => {
        // Detect UUID or numeric ID patterns (simple heuristic)
        if (
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            part,
          ) ||
          /^\d+$/.test(part)
        ) {
          return ":id";
        }
        return part;
      })
      .join("/");
  }
}
