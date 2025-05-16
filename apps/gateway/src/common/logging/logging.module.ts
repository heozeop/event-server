import { Module } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'http';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'gateway-service',
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
        customProps: () => ({
          context: 'HTTP',
        }),
        customLogLevel: function (
          req: IncomingMessage,
          res: ServerResponse,
          err: Error | undefined,
        ) {
          if (res.statusCode >= 400 && res.statusCode < 500) {
            return 'warn';
          } else if (res.statusCode >= 500 || err) {
            return 'error';
          }
          return 'info';
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.token',
            'req.body.secret',
          ],
          censor: '***MASKED***',
        },
      },
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
