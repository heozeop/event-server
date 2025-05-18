import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import { MetricsModuleOptions } from './metrics.module';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;
  private readonly prefix: string;
  
  // Basic metrics
  public httpRequestsTotal: Counter;
  public httpRequestDuration: Histogram;
  public httpRequestSize: Histogram;
  public httpResponseSize: Histogram;
  public httpServerErrors: Counter;
  public httpClientErrors: Counter;
  public serviceInfo: Gauge;

  constructor(@Inject('METRICS_OPTIONS') private options: MetricsModuleOptions) {
    this.prefix = this.sanitizeMetricName(options.serviceName);
    this.registry = new Registry();
    
    // Register default Node.js metrics
    collectDefaultMetrics({ register: this.registry, prefix: `${this.prefix}_` });
    
    // HTTP request counter
    this.httpRequestsTotal = new Counter({
      name: `${this.prefix}_http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });
    
    // HTTP request duration
    this.httpRequestDuration = new Histogram({
      name: `${this.prefix}_http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });
    
    // HTTP request size
    this.httpRequestSize = new Histogram({
      name: `${this.prefix}_http_request_size_bytes`,
      help: 'HTTP request size in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 1000, 5000, 10000, 50000, 100000],
      registers: [this.registry],
    });
    
    // HTTP response size
    this.httpResponseSize = new Histogram({
      name: `${this.prefix}_http_response_size_bytes`,
      help: 'HTTP response size in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 1000, 5000, 10000, 50000, 100000],
      registers: [this.registry],
    });
    
    // HTTP server errors (5xx)
    this.httpServerErrors = new Counter({
      name: `${this.prefix}_http_server_errors_total`,
      help: 'Total number of HTTP server errors',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });
    
    // HTTP client errors (4xx)
    this.httpClientErrors = new Counter({
      name: `${this.prefix}_http_client_errors_total`,
      help: 'Total number of HTTP client errors',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });
    
    // Service information
    this.serviceInfo = new Gauge({
      name: `${this.prefix}_info`,
      help: 'Service information',
      labelNames: ['version'],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    // Set service info metric
    this.serviceInfo.labels(this.options.serviceVersion || 'unknown').set(1);
  }

  // Collect metrics
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  // Get content type
  getContentType(): string {
    return this.registry.contentType;
  }
  
  /**
   * Sanitizes a string to be used as a Prometheus metric name.
   * Metric names can only contain letters, numbers, and underscores,
   * and must start with a letter.
   */
  private sanitizeMetricName(name: string): string {
    // Replace any non-alphanumeric character with underscore
    let sanitized = name.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Ensure the name starts with a letter (if it starts with a number, prepend 'n_')
    if (/^[0-9]/.test(sanitized)) {
      sanitized = `n_${sanitized}`;
    }
    
    // Ensure we don't have consecutive underscores
    sanitized = sanitized.replace(/_+/g, '_');
    
    return sanitized;
  }
} 
