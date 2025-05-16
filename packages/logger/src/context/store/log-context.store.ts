import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { LogContext } from '../..';

/**
 * Store for managing log context across async operations using NestJS CLS
 */
@Injectable()
export class LogContextStore {
  private static instance: LogContextStore;

  constructor(private readonly cls: ClsService) {}

  /**
   * Gets the singleton instance of LogContextStore
   * @param cls ClsService instance
   */
  static getInstance(cls?: ClsService): LogContextStore {
    if (!LogContextStore.instance) {
      if (!cls) {
        throw new Error('ClsService must be provided when initializing LogContextStore');
      }
      LogContextStore.instance = new LogContextStore(cls);
    }
    return LogContextStore.instance;
  }

  /**
   * Runs callback with provided context
   * @param context Log context
   * @param callback Function to run with context
   */
  run<T>(context: LogContext, callback: () => T): T {
    return this.cls.run(() => {
      this.updateContext(context);
      return callback();
    });
  }

  /**
   * Gets current log context or empty object if none exists
   */
  getContext(): LogContext {
    return this.cls.get('logContext') || {};
  }

  /**
   * Updates current context with new values
   * @param contextUpdate Partial context updates
   */
  updateContext(contextUpdate: Partial<LogContext>): void {
    const currentContext = this.getContext();
    this.cls.set('logContext', {
      ...currentContext,
      ...contextUpdate,
    });
  }

  /**
   * Sets requestId in current context
   * @param requestId Request ID
   */
  setRequestId(requestId: string): void {
    this.updateContext({ requestId });
  }

  /**
   * Gets requestId from current context
   */
  getRequestId(): string | undefined {
    return this.getContext().requestId;
  }

  /**
   * Sets userId in current context
   * @param userId User ID
   */
  setUserId(userId: string): void {
    this.updateContext({ userId });
  }

  /**
   * Gets userId from current context
   */
  getUserId(): string | undefined {
    return this.getContext().userId;
  }
} 
