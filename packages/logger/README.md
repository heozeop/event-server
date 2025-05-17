# @libs/logger

A logging utility package for microservices based on Pino and integrated with NestJS.

## Features

- Common logging interface for all microservices
- Integration with Pino and NestJS Logger
- Standardized log format (time, service name, request ID, level, message, metadata)
- Log level management utilities
- Context-based logging
- Request context management with AsyncLocalStorage
- Automatic context propagation between services

## Installation

This package is included in the monorepo and can be added to your service using:

```bash
pnpm add @libs/logger
```

## Usage

### Basic Usage

```typescript
import { LoggerFactory } from '@libs/logger';

// Create a Pino logger instance
const logger = LoggerFactory.createLogger({
  serviceName: 'my-service'
});

// Log messages with different levels
logger.log('This is an info message');
logger.error('This is an error message');
logger.warn('This is a warning message');
logger.debug('This is a debug message');
logger.verbose('This is a verbose message');

// Log with context
logger.log('User logged in', { userId: '123', traceId: 'abc-123' });
```

### NestJS Integration

```typescript
import { LoggerFactory } from '@libs/logger';
import { Module } from '@nestjs/common';

const nestLogger = LoggerFactory.createNestLogger('my-service');

@Module({
  providers: [
    {
      provide: 'LOGGER',
      useValue: nestLogger,
    },
  ],
  exports: ['LOGGER'],
})
export class LoggerModule {}
```

In your `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerFactory } from '@libs/logger';

async function bootstrap() {
  const nestLogger = LoggerFactory.createNestLogger('my-service');
  
  const app = await NestFactory.create(AppModule, {
    logger: nestLogger,
  });
  
  await app.listen(3000);
}
bootstrap();
```

### Setting Log Level

```typescript
import { LoggerFactory } from '@libs/logger';

// Set log level through environment variable
// LOG_LEVEL=debug node app.js

// Or set it programmatically
const logger = LoggerFactory.createLogger({
  serviceName: 'my-service',
  logLevel: 'debug'
});

// Change log level at runtime
logger.setLogLevel('trace');
```

### Adding Context to All Logs

```typescript
import { LoggerFactory } from '@libs/logger';

const logger = LoggerFactory.createLogger({
  serviceName: 'my-service'
});

// Set context for all subsequent logs
logger.setContext({ 
  traceId: 'abc-123',
  requestId: 'req-456' 
});

// This log will include the context
logger.log('Processing request');
```

## Request Context Management

The logger package includes a powerful context management system that automatically tracks request information across asynchronous operations and service boundaries.

### Using the Log Context Interceptor

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LogContextInterceptor } from '@libs/logger';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LogContextInterceptor
    }
  ]
})
export class AppModule {}
```

This interceptor automatically:

- Generates unique request IDs for each request if not already present
- Extracts client IP, user agent, path, and method
- Preserves context across async operations
- Makes context available to all loggers within the request lifecycle

### Accessing Context in Services

```typescript
import { Injectable } from '@nestjs/common';
import { LogContextStore } from '@libs/logger';

@Injectable()
export class UserService {
  doSomething() {
    // Get the current request context
    const contextStore = LogContextStore.getInstance();
    const requestId = contextStore.getRequestId();
    const userId = contextStore.getUserId();
    
    // Context is available in all async operations 
    setTimeout(() => {
      // Still has access to the same context
      const sameRequestId = contextStore.getRequestId();
    }, 100);
  }
}
```

### Propagating Context Between Services

```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { RequestIdUtil, LogContextStore } from '@libs/logger';

@Injectable()
export class ApiService {
  constructor(private readonly httpService: HttpService) {}
  
  async callAnotherService() {
    const contextStore = LogContextStore.getInstance();
    const requestId = contextStore.getRequestId();
    
    // Add request ID to outgoing HTTP request
    const headers = RequestIdUtil.injectToHttpHeaders({}, requestId);
    
    // Make HTTP request with propagated context
    return this.httpService.get('https://another-service/api', { headers });
  }
}
```

## Available Log Levels

- fatal
- error
- warn
- info
- debug
- trace

## Sensitive Data Filtering

The logger provides built-in functionality to automatically mask sensitive information in logs, helping you comply with privacy regulations and prevent accidental exposure of sensitive data.

### Basic Usage with Filtering

```typescript
import { LoggerFactory } from '@libs/logger';

// Create a logger with sensitive data filtering enabled
const logger = LoggerFactory.createLogger({
  serviceName: 'my-service',
  sensitiveDataOptions: {
    enabled: true, // Enable filtering (enabled by default)
    maskValue: '[REDACTED]' // Optional custom mask value
  }
});

// Logs with sensitive data will be automatically masked
logger.log('User info', { 
  name: 'John Doe',
  email: 'john.doe@example.com', // Will be masked
  password: 'secret123'  // Will be masked
});

// Sensitive patterns in messages are also masked
logger.log('Processing payment with card 4111-1111-1111-1111'); // Card number will be masked
```

### Customizing Filtering Rules

```typescript
import { LoggerFactory } from '@libs/logger';

const logger = LoggerFactory.createLogger({
  serviceName: 'my-service',
  sensitiveDataOptions: {
    // Custom mask value
    maskValue: '***',
    
    // Override default sensitive keys
    sensitiveKeys: [
      'password', 'token', 'apiKey',
      'myCustomSecret', 'internalCode'
    ],
    
    // Add custom regex patterns to mask
    sensitivePatterns: [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email
      /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,                     // Credit card
      /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,                     // SSN
      /myapp-[a-z0-9]{8}-[a-z0-9]{4}/g                    // Custom app tokens
    ],
    
    // Mask specific object paths
    objectPaths: [
      'req.body.password',
      'req.headers.authorization',
      'user.credentials.token',
      'data.personalInfo.socialSecurityNumber'
    ]
  }
});
```

### NestJS Module Configuration

For NestJS applications, you can configure sensitive data filtering through the module:

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule } from '@libs/logger';

@Module({
  imports: [
    LoggerModule.forRoot({
      serviceName: 'my-service',
      prettyPrint: process.env.NODE_ENV !== 'production',
      logLevel: process.env.LOG_LEVEL || 'info',
      sensitiveDataOptions: {
        enabled: true,
        maskValue: '[REDACTED]',
        sensitiveKeys: ['password', 'secret', 'token', 'apiKey'],
        objectPaths: [
          'req.body.password',
          'req.headers.authorization'
        ]
      }
    })
  ]
})
export class AppModule {}
```

## Logger Package with Fluentd Integration

This package provides a unified logging solution for microservices with Fluentd integration for centralized log collection.

### Features

- NestJS integration with ready-to-use module
- Pino-based logging with customizable log formats
- Context-aware logging with request tracking
- Sensitive data masking
- File transport for Fluentd integration
- Sidecar pattern for log collection

### Installation

```bash
pnpm install @libs/logger
```

### Basic Usage

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule } from '@libs/logger';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      global: true,
      imports: [],
      inject: [],
      useFactory: async () => ({
        serviceName: 'my-service',
        prettyPrint: process.env.NODE_ENV !== 'production',
        logLevel: process.env.LOG_LEVEL || 'info',
        fileTransport: {
          enabled: true,
          destination: `/logs/${process.env.SERVICE_NAME}/${process.env.SERVICE_NAME}.log`,
          mkdir: true
        },
        sensitiveDataOptions: {
          enabled: true,
          maskValue: '***MASKED***',
          objectPaths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
          ],
        },
      }),
    }),
  ],
})
export class AppModule {}
```

### Fluentd Integration

This logger package has been configured to work with Fluentd for centralized log collection. The system uses a sidecar pattern where each service has its own Fluentd container that collects and processes logs.

Key features of the Fluentd integration:
- Application logs are written to files in the `/logs` directory
- Fluentd collects logs from these files and Docker container logs
- Logs are stored in a structured format for easy querying and analysis

For detailed information on the Fluentd integration, see the [Fluentd Guide](../../config/fluentd/FLUENTD_GUIDE.md).

#### Sidecar Architecture

The logger uses a sidecar pattern where:
1. Your service writes logs to a local file using Pino
2. A Fluentd container (sidecar) monitors these log files
3. Fluentd processes and forwards logs to the configured destination

#### Directory Structure

The logs are stored in the following structure:
```
/logs/{service-name}/{YYYY-MM-DD}/
```

#### Setup Fluentd Sidecar

Add the following to your docker-compose.yml:

```yaml
services:
  my-service:
    # Your service configuration
    volumes:
      - ./logs:/logs

  fluentd-sidecar:
    build:
      context: ./path/to/logger/fluentd
      dockerfile: Dockerfile
    volumes:
      - ./logs:/logs
    ports:
      - "24220:24220"  # For monitoring
```

#### Configuration

The Fluentd container is configured with:
- Log directory monitoring
- JSON parsing
- Daily log rotation
- Monitoring endpoint at port 24220

#### Customization

To customize the Fluentd configuration, modify the `fluent.conf` file and rebuild the container.

### Advanced Options

#### Custom Log Formatters

You can customize the log format by configuring the `PinoLoggerService`:

```typescript
const logger = new PinoLoggerService({
  serviceName: 'my-service',
  prettyPrint: true,
  logLevel: 'debug',
  fileTransport: {
    enabled: true,
    destination: '/logs/my-service/my-service.log',
    mkdir: true
  },
  sensitiveDataOptions: {
    enabled: true,
    maskValue: '***MASKED***',
    objectPaths: ['password', 'token'],
  },
});
```

#### Context-Aware Logging

The logger supports context-aware logging through the NestJS request context:

```typescript
@Injectable()
export class MyService {
  constructor(private readonly logger: PinoLoggerService) {}

  someMethod() {
    // The logger automatically includes request context (requestId, etc.)
    this.logger.info('This log includes request context');
  }
}
``` 
