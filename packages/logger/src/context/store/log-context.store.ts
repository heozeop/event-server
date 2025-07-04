import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";
import { LogContext } from "../..";

/**
 * Store for managing log context across async operations using AsyncLocalStorage
 */
@Injectable()
export class LogContextStore {
  private static instance: LogContextStore;
  private readonly storage: AsyncLocalStorage<Record<string, any>>;

  constructor() {
    this.storage = new AsyncLocalStorage<Record<string, any>>();
  }

  /**
   * Gets the singleton instance of LogContextStore
   */
  static getInstance(): LogContextStore {
    if (!LogContextStore.instance) {
      LogContextStore.instance = new LogContextStore();
    }
    return LogContextStore.instance;
  }

  /**
   * Runs callback with provided context
   * @param context Log context
   * @param callback Function to run with context
   */
  run<T>(context: LogContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  /**
   * Gets current log context or empty object if none exists
   */
  getContext(): LogContext {
    return this.storage.getStore() || {};
  }

  /**
   * Updates current context with new values
   * @param contextUpdate Partial context updates
   */
  updateContext(contextUpdate: Partial<LogContext>): void {
    const currentStore = this.storage.getStore();
    if (!currentStore) {
      // If no store exists yet, create one
      this.storage.enterWith({ ...contextUpdate });
    } else {
      // Update existing store
      Object.assign(currentStore, contextUpdate);
    }
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
