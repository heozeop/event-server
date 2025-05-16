import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import { LogContext } from '../interfaces';
import { RequestIdUtil } from './request-id.util';
import { RequestMetadataUtil } from './request-metadata.util';

/**
 * NestJS interceptor that sets up log context for each request
 */
@Injectable()
export class LogContextInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  /**
   * Intercepts incoming requests and sets up log context
   * @param context NestJS execution context
   * @param next Call handler for the request
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const logContext = this.createLogContextFromRequest(context);
    
    // Set the log context in CLS
    this.cls.set('logContext', logContext);
    
    // Continue with the request
    return next.handle();
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
