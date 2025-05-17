import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LogContext, RequestIdUtil } from '../..';
import { LogContextStore } from '../store/log-context.store';
import { RequestMetadataUtil } from '../utils/request-metadata.util';

/**
 * NestJS interceptor that sets up log context for each request
 */
@Injectable()
export class LogContextInterceptor implements NestInterceptor {
  constructor(private readonly logContextStore: LogContextStore) {}

  /**
   * Intercepts incoming requests and sets up log context
   * @param context NestJS execution context
   * @param next Call handler for the request
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const logContext = this.createLogContextFromRequest(context);
    
    // Create context at the beginning of the request
    this.logContextStore.updateContext(logContext);
    
    // Let the request continue
    return next.handle().pipe(
      tap({
        // Additional logging could be added here for response if needed
      })
    );
  }
  
  /**
   * Creates log context from request context
   * @param context NestJS execution context
   */
  private createLogContextFromRequest(context: ExecutionContext): LogContext {
    const contextType = context.getType();
    let logContext: LogContext = {};
    
    // HTTP request
    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest();
      logContext = {
        ...RequestMetadataUtil.extractFromHttpRequest(request),
      };
      
      // Add user context if authenticated
      if (request.user) {
        logContext = {
          ...logContext,
          ...RequestMetadataUtil.extractUserContext(request.user),
        };
      }
    } 
    // RPC request
    else if (contextType === 'rpc') {
      const rpcContext = context.switchToRpc().getContext();
      logContext = {
        ...RequestMetadataUtil.extractFromRpcContext(rpcContext),
      };
    }
    // Microservice event
    else if (contextType === 'ws' || contextType === 'graphql') {
      // Handle WebSocket or GraphQL context
      const requestId = RequestIdUtil.generateRequestId();
      logContext = { requestId };
    }
    
    return logContext;
  }
} 
