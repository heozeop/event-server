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
- info (default)
- debug
- trace
- silent 
