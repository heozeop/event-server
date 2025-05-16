import { LogContext } from '../../interfaces';
import { RequestIdUtil } from './request-id.util';

/**
 * Utility for extracting metadata from various request types
 */
export class RequestMetadataUtil {
  /**
   * Extracts metadata from HTTP request
   * @param req HTTP request object
   */
  static extractFromHttpRequest(req: any): Partial<LogContext> {
    if (!req) {
      return {};
    }

    // Extract request ID or generate a new one
    const requestId = RequestIdUtil.extractFromHttpHeaders(req.headers) || 
                      RequestIdUtil.generateRequestId();
    
    // Extract basic request metadata
    const metadata: Partial<LogContext> = {
      requestId,
      method: req.method,
      path: req.url || req.originalUrl,
    };
    
    // Extract client IP address
    if (req.ip || req.connection?.remoteAddress) {
      metadata.clientIp = req.ip || req.connection?.remoteAddress;
    } else if (req.headers['x-forwarded-for']) {
      const forwardedFor = Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : req.headers['x-forwarded-for'];
      
      metadata.clientIp = forwardedFor?.split(',')[0].trim();
    }
    
    // Extract user agent
    if (req.headers['user-agent']) {
      metadata.userAgent = Array.isArray(req.headers['user-agent'])
        ? req.headers['user-agent'][0]
        : req.headers['user-agent'];
    }
    
    return metadata;
  }
  
  /**
   * Extracts metadata from RPC context
   * @param rpcContext gRPC or other RPC context object
   */
  static extractFromRpcContext(rpcContext: any): Partial<LogContext> {
    if (!rpcContext) {
      return {};
    }
    
    const metadata = rpcContext.metadata || rpcContext.getMetadata?.() || {};
    
    // Extract request ID or generate a new one
    const requestId = RequestIdUtil.extractFromMessagingMetadata(metadata) || 
                      RequestIdUtil.generateRequestId();
    
    // Extract method and path-like info if available
    const context: Partial<LogContext> = {
      requestId,
    };
    
    if (rpcContext.service && rpcContext.method) {
      context.path = `${rpcContext.service}/${rpcContext.method}`;
      context.method = 'RPC';
    }
    
    return context;
  }

  /**
   * Extracts user authentication information
   * @param user User object from authentication system
   */
  static extractUserContext(user: any): Partial<LogContext> {
    if (!user) {
      return {};
    }
    
    const context: Partial<LogContext> = {};
    
    // Extract user ID
    if (user.id || user.userId || user.sub) {
      context.userId = user.id || user.userId || user.sub;
    }
    
    // Extract other relevant user info
    if (user.roles) {
      context.userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
    }
    
    return context;
  }
} 
