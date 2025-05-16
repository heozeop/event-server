import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';
import { LogContextInterceptor } from './context/interceptors/log-context.interceptor';
import { LogContextStore } from './context/store/log-context.store';
import { PinoLogLevelManager } from './core/log-level-manager';
import { PinoLoggerService } from './services/pino-logger.service';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: uuidv4
      }
    })
  ],
  providers: [
    LogContextStore,
    LogContextInterceptor,
    PinoLoggerService,
    PinoLogLevelManager
  ],
  exports: [
    ClsModule,
    LogContextStore,
    LogContextInterceptor,
    PinoLoggerService,
    PinoLogLevelManager
  ]
})
export class LoggerModule {} 
