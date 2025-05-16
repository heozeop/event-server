import {
  LogContextInterceptor,
  LogContextStore,
  PinoLoggerService,
  PinoLogLevelManager,
  SensitiveDataFilter,
} from '@libs/logger';
import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
      },
    }),
  ],
  providers: [
    LogContextStore,
    LogContextInterceptor,
    {
      provide: PinoLoggerService,
      useFactory: () => {
        return new PinoLoggerService({
          serviceName: 'gateway-service',
          prettyPrint: process.env.NODE_ENV !== 'production',
          logLevel: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        });
      },
    },
    {
      provide: SensitiveDataFilter,
      useFactory: () => {
        return new SensitiveDataFilter({
          maskValue: '***MASKED***',
          objectPaths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.token',
            'req.body.secret',
          ],
        });
      },
    },
    PinoLogLevelManager,
  ],
  exports: [
    ClsModule,
    LogContextStore,
    LogContextInterceptor,
    PinoLoggerService,
    PinoLogLevelManager,
    SensitiveDataFilter,
  ],
})
export class LoggingModule {}
