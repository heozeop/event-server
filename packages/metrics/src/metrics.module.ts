import { DynamicModule, Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';

export interface MetricsModuleOptions {
  serviceName: string;
  serviceVersion?: string;
  enabled?: boolean;
}

@Module({})
export class MetricsModule {
  static forRoot(options: MetricsModuleOptions): DynamicModule {
    return {
      module: MetricsModule,
      controllers: [MetricsController],
      providers: [
        {
          provide: 'METRICS_OPTIONS',
          useValue: {
            enabled: true,
            ...options,
          },
        },
        MetricsService,
        MetricsInterceptor,
      ],
      exports: [MetricsService],
    };
  }
} 
