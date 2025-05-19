import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  /**
   * Override the canActivate method to check for skip throttling metadata
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip throttling in test environment
    if (this.shouldSkipThrottling()) {
      return true;
    }

    // Normal throttling for other environments
    return super.canActivate(context);
  }

  /**
   * Check if throttling should be skipped based on environment
   */
  protected shouldSkipThrottling(): boolean {
    const nodeEnv = this.configService.get('NODE_ENV');
    return nodeEnv === 'test';
  }

  /**
   * Returns a unique tracker identifier for rate limiting
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use both IP and user ID (if available) to track rate limiting
    const userId = req.user?.id || 'anonymous';
    return `${req.ip}-${userId}`;
  }
}
